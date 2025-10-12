import React, { useState, useEffect } from 'react';
import '../styles/buttons.css';
import {
    Box,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    LinearProgress,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button
} from '@mui/material';
import {
    Delete as DeleteIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Folder as FolderIcon,
    Description as DescriptionIcon,
    Upload as UploadIcon
} from '@mui/icons-material';
import VolumeButton from './VolumeButton';
import * as XLSX from 'xlsx';

// Интерфейс для единицы измерения
interface Unit {
    id: string;
    code: string;
    name: string;
    fullName?: string;
    internationalCode?: string;
}

// Интерфейс для вида номенклатуры
interface NomenclatureKind {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

// Интерфейс для группы номенклатуры
interface NomenclatureGroup {
    id: string;
    name: string;
    description?: string;
    parentId?: string;
    createdAt: string;
    updatedAt: string;
}

// Интерфейс для позиции номенклатуры
interface NomenclatureItem {
    id: string;
    groupId?: string;
    kindId?: string;
    designation?: string;
    name: string;
    article?: string;
    code1c?: string;
    manufacturer?: string;
    description?: string;
    unit?: string;
    price?: number;
    createdAt: string;
    updatedAt: string;
}

interface NomenclaturePageProps {
    canEdit: () => boolean;
    canCreate: () => boolean;
    canDelete: () => boolean;
}

const NomenclaturePage: React.FC<NomenclaturePageProps> = ({
    canEdit,
    canCreate,
    canDelete
}) => {
    const [groups, setGroups] = useState<NomenclatureGroup[]>([]);
    const [kinds, setKinds] = useState<NomenclatureKind[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [items, setItems] = useState<NomenclatureItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null); // Фильтр по группе
    const [selectedKindId, setSelectedKindId] = useState<string | null>(null); // Фильтр по виду
    const [rightPanelMode, setRightPanelMode] = useState<'groups' | 'kinds'>('groups'); // Режим правой панели

    // Состояние для диалога группы
    const [openGroupDialog, setOpenGroupDialog] = useState(false);
    const [editingGroup, setEditingGroup] = useState<NomenclatureGroup | null>(null);
    const [groupForm, setGroupForm] = useState({
        name: '',
        description: ''
    });

    // Состояние для диалога позиции
    const [openItemDialog, setOpenItemDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<NomenclatureItem | null>(null);
    const [itemForm, setItemForm] = useState({
        groupId: '',
        kindId: '',
        unitId: '',
        type: 'Product',
        designation: '',
        name: '',
        article: '',
        code1c: '',
        manufacturer: '',
        description: '',
        price: ''
    });

    // Состояние для диалога импорта
    const [openImportDialog, setOpenImportDialog] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [showColumnMapping, setShowColumnMapping] = useState(false);
    const [excelData, setExcelData] = useState<any[][]>([]);
    const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>({});
    const [showPreviewDialog, setShowPreviewDialog] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [importStats, setImportStats] = useState({ existing: 0, new: 0, total: 0 });
    const [error, setError] = useState<string>('');

    // Функция форматирования даты

    // Обработка Excel файла
    const handleFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

                if (jsonData.length > 0) {
                    setExcelData(jsonData as any[][]);
                    // НЕ открываем сопоставление колонок автоматически
                } else {
                    alert('Файл пуст или не содержит данных');
                }
            } catch (error) {
                console.error('Ошибка чтения файла:', error);
                alert('Ошибка чтения файла. Убедитесь, что файл является корректным Excel файлом.');
            }
        };
        reader.readAsBinaryString(file);
    };

    // Анализ данных импорта
    const analyzeImportData = async () => {
        try {
            setLoading(true);
            setError('');

            // Пропускаем заголовок (первую строку)
            const rows = excelData.slice(1);
            const analyzedData: any[] = [];
            let existingCount = 0;
            let newCount = 0;

            // Анализируем каждую строку
            for (const row of rows) {
                if (row.length < 2) continue; // Пропускаем пустые строки

                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        setError('Токен авторизации не найден');
                        return;
                    }

                    // Парсим данные из строки согласно сопоставлению колонок
                    const nomenclatureData: any = {};

                    Object.entries(columnMapping).forEach(([columnIndex, fieldName]) => {
                        const value = row[parseInt(columnIndex)];
                        if (value !== undefined && value !== null && value !== '') {
                            if (fieldName === 'price') {
                                nomenclatureData[fieldName] = parseFloat(value) || undefined;
                            } else {
                                nomenclatureData[fieldName] = value.toString();
                            }
                        }
                    });

                    // Проверяем обязательные поля
                    if (!nomenclatureData.name) {
                        continue;
                    }

                    // Ищем существующую позицию в номенклатуре по Артикулу, Код 1С, Наименованию, Обозначению
                    let existingItem = null;

                    // Пытаемся найти по каждому полю отдельно (приоритетный поиск)
                    if (!existingItem && nomenclatureData.article) {
                        const searchResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/find?article=${encodeURIComponent(nomenclatureData.article)}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (searchResponse.ok) {
                            existingItem = await searchResponse.json();
                        }
                    }

                    // Если не найдено по артикулу, ищем по коду 1С
                    if (!existingItem && nomenclatureData.code1c) {
                        const searchResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/find?code1c=${encodeURIComponent(nomenclatureData.code1c)}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (searchResponse.ok) {
                            existingItem = await searchResponse.json();
                        }
                    }

                    // Если не найдено по коду 1С, ищем по обозначению
                    if (!existingItem && nomenclatureData.designation) {
                        const searchResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/find?designation=${encodeURIComponent(nomenclatureData.designation)}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (searchResponse.ok) {
                            existingItem = await searchResponse.json();
                        }
                    }

                    // Если не найдено по обозначению, ищем по точному наименованию
                    if (!existingItem && nomenclatureData.name) {
                        const searchResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/find?name=${encodeURIComponent(nomenclatureData.name)}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (searchResponse.ok) {
                            existingItem = await searchResponse.json();
                        }
                    }

                    analyzedData.push({
                        ...nomenclatureData,
                        isExisting: !!existingItem,
                        existingItem: existingItem,
                        originalData: nomenclatureData
                    });

                    if (existingItem) {
                        existingCount++;
                    } else {
                        newCount++;
                    }

                } catch (error) {
                    console.error('Ошибка анализа строки:', error);
                }
            }

            setPreviewData(analyzedData);
            setImportStats({
                existing: existingCount,
                new: newCount,
                total: analyzedData.length
            });

            setShowColumnMapping(false);
            setShowPreviewDialog(true);

        } catch (error) {
            console.error('Ошибка анализа данных:', error);
            setError('Ошибка при анализе данных');
        } finally {
            setLoading(false);
        }
    };

    // Загрузка групп, видов, единиц и позиций
    const fetchNomenclature = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            // Загружаем единицы измерения
            const unitsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/units`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (unitsResponse.ok) {
                const unitsData = await unitsResponse.json();
                setUnits(unitsData);
            }

            // Загружаем виды номенклатуры
            const kindsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature-kinds`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (kindsResponse.ok) {
                const kindsData = await kindsResponse.json();
                setKinds(kindsData);
            }

            // Загружаем группы
            const groupsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/groups`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (groupsResponse.ok) {
                const groupsData = await groupsResponse.json();
                setGroups(groupsData);
            }

            // Загружаем позиции
            const itemsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/items`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (itemsResponse.ok) {
                const itemsData = await itemsResponse.json();
                setItems(itemsData);
            }
        } catch (error) {
            console.error('Ошибка загрузки номенклатуры:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNomenclature();
    }, []);

    // Переключение раскрытия группы
    const toggleGroup = (groupId: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupId)) {
            newExpanded.delete(groupId);
        } else {
            newExpanded.add(groupId);
        }
        setExpandedGroups(newExpanded);
    };

    // Обработчики для групп
    const handleOpenGroupDialog = (group?: NomenclatureGroup) => {
        if (group) {
            setEditingGroup(group);
            setGroupForm({
                name: group.name,
                description: group.description || ''
            });
        } else {
            setEditingGroup(null);
            setGroupForm({
                name: '',
                description: ''
            });
        }
        setOpenGroupDialog(true);
    };

    const handleCloseGroupDialog = () => {
        setOpenGroupDialog(false);
        setEditingGroup(null);
        setGroupForm({
            name: '',
            description: ''
        });
    };

    const handleSaveGroup = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            const url = editingGroup
                ? `${import.meta.env.VITE_API_BASE_URL}/nomenclature/groups/${editingGroup.id}`
                : `${import.meta.env.VITE_API_BASE_URL}/nomenclature/groups`;

            const method = editingGroup ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(groupForm)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchNomenclature();
            handleCloseGroupDialog();
        } catch (error) {
            console.error('Ошибка сохранения группы:', error);
        }
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту группу?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/groups/${groupId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchNomenclature();
        } catch (error) {
            console.error('Ошибка удаления группы:', error);
        }
    };

    // Обработчики для позиций
    const handleOpenItemDialog = (item?: NomenclatureItem, groupId?: string) => {
        if (item) {
            setEditingItem(item);
            setItemForm({
                groupId: item.groupId || '',
                kindId: item.kindId || '',
                unitId: (item as any).unitId || '',
                type: (item as any).type || 'Product',
                designation: item.designation || '',
                name: item.name,
                article: item.article || '',
                code1c: item.code1c || '',
                manufacturer: item.manufacturer || '',
                description: item.description || '',
                price: item.price?.toString() || ''
            });
        } else {
            setEditingItem(null);
            setItemForm({
                groupId: groupId || '',
                kindId: '',
                unitId: '',
                type: 'Product',
                designation: '',
                name: '',
                article: '',
                code1c: '',
                manufacturer: '',
                description: '',
                price: ''
            });
        }
        setOpenItemDialog(true);
    };

    const handleCloseItemDialog = () => {
        setOpenItemDialog(false);
        setEditingItem(null);
        setItemForm({
            groupId: '',
            kindId: '',
            unitId: '',
            type: 'Product',
            designation: '',
            name: '',
            article: '',
            code1c: '',
            manufacturer: '',
            description: '',
            price: ''
        });
    };

    const handleSaveItem = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            const url = editingItem
                ? `${import.meta.env.VITE_API_BASE_URL}/nomenclature/items/${editingItem.id}`
                : `${import.meta.env.VITE_API_BASE_URL}/nomenclature/items`;

            const method = editingItem ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...itemForm,
                    price: itemForm.price ? parseFloat(itemForm.price) : undefined
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchNomenclature();
            handleCloseItemDialog();
        } catch (error) {
            console.error('Ошибка сохранения позиции:', error);
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту позицию?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/items/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchNomenclature();
        } catch (error) {
            console.error('Ошибка удаления позиции:', error);
        }
    };

    // Получение позиций для группы
    const getItemsForGroup = (groupId: string) => {
        return items.filter(item => item.groupId === groupId);
    };

    // Получение позиций без группы
    const getItemsWithoutGroup = () => {
        return items.filter(item => !item.groupId);
    };

    // Получение отфильтрованных позиций (по выбранной группе и виду)
    const getFilteredItems = () => {
        let filtered = items;

        // Фильтр по группе
        if (selectedGroupId !== null) {
            if (selectedGroupId === '') {
                filtered = getItemsWithoutGroup();
            } else {
                filtered = getItemsForGroup(selectedGroupId);
            }
        }

        // Фильтр по виду
        if (selectedKindId !== null) {
            if (selectedKindId === '') {
                filtered = filtered.filter(item => !item.kindId);
            } else {
                filtered = filtered.filter(item => item.kindId === selectedKindId);
            }
        }

        return filtered;
    };

    return (
        <Box className="page-container">
            {/* Заголовок */}
            <Box className="page-header">
                <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px' }}>
                    Номенклатура
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {canCreate() && (
                        <>
                            <VolumeButton
                                variant="contained"
                                onClick={() => setOpenImportDialog(true)}
                                color="green"
                                startIcon={<UploadIcon />}
                            >
                                Импорт
                            </VolumeButton>
                            <VolumeButton
                                variant="contained"
                                onClick={() => handleOpenItemDialog()}
                                color="blue"
                            >
                                Создать
                            </VolumeButton>
                            <VolumeButton
                                variant="contained"
                                onClick={() => handleOpenGroupDialog()}
                                color="purple"
                            >
                                Добавить группу
                            </VolumeButton>
                        </>
                    )}
                </Box>
            </Box>

            {/* Трехколоночный layout: слева номенклатура, в центре группы, справа виды */}
            {loading ? (
                <LinearProgress />
            ) : (
                <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 200px)', width: '100%', overflow: 'hidden', justifyContent: 'space-between' }}>
                    {/* Левая колонка - Таблица номенклатуры */}
                    <Box sx={{ flex: '0 0 78%', overflow: 'auto', minWidth: '232px' }}>
                        <TableContainer component={Paper}>
                            <Table sx={{
                                '& .MuiTableCell-root': { border: '1px solid #e0e0e0', padding: '0 4px !important' },
                                '& .MuiTableHead-root .MuiTableCell-root': { fontSize: '14px !important', lineHeight: '0 !important' },
                                '& .MuiTableHead-root .MuiTableRow-root': { height: '30px !important', maxHeight: '30px !important' },
                                '& .MuiTableBody-root .MuiTableCell-root': { fontSize: '12px !important', lineHeight: '0 !important' },
                                '& .MuiTableBody-root .MuiTableRow-root': { height: '22px !important', maxHeight: '22px !important' }
                            }}>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '40px', fontSize: '14px', whiteSpace: 'nowrap' }}>№</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '14px', whiteSpace: 'nowrap' }}>Наименование</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '14px', whiteSpace: 'nowrap' }}>Артикул</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '14px', whiteSpace: 'nowrap' }}>Код 1С</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '14px', whiteSpace: 'nowrap' }}>Производитель</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '60px', fontSize: '14px', whiteSpace: 'nowrap' }}>
                                            <DeleteIcon fontSize="small" sx={{ color: 'red' }} />
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {/* Отфильтрованные позиции */}
                                    {getFilteredItems().map((item, index) => (
                                        <TableRow
                                            key={item.id}
                                            sx={{ height: '30px', cursor: 'pointer' }}
                                            onDoubleClick={() => canEdit() && handleOpenItemDialog(item)}
                                        >
                                            <TableCell sx={{ py: 0.5, textAlign: 'center', fontSize: '12px' }}>{index + 1}</TableCell>
                                            <TableCell sx={{ py: 0.5, fontSize: '12px' }}>
                                                {item.name}
                                            </TableCell>
                                            <TableCell sx={{ py: 0.5, textAlign: 'center', fontSize: '12px' }}>{item.article || '-'}</TableCell>
                                            <TableCell sx={{ py: 0.5, textAlign: 'center', fontSize: '12px' }}>{item.code1c || '-'}</TableCell>
                                            <TableCell sx={{ py: 0.5, textAlign: 'center', fontSize: '12px' }}>{item.manufacturer || '-'}</TableCell>
                                            <TableCell sx={{ textAlign: 'center', py: 0.5, width: '60px' }}>
                                                {canDelete() && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        color="error"
                                                        sx={{ minWidth: 'auto', padding: '0 !important' }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {getFilteredItems().length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                                Нет позиций
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    {/* Правая колонка - Таблица групп */}
                    <Box sx={{ flex: '0 0 20%', overflow: 'auto', minWidth: 0 }}>
                        <TableContainer component={Paper}>
                            <Table sx={{
                                '& .MuiTableCell-root': { border: '1px solid #e0e0e0', padding: '0 4px !important' },
                                '& .MuiTableHead-root .MuiTableCell-root': { fontSize: '14px !important', lineHeight: '0 !important' },
                                '& .MuiTableHead-root .MuiTableRow-root': { height: '30px !important', maxHeight: '30px !important' },
                                '& .MuiTableBody-root .MuiTableCell-root': { fontSize: '12px !important', lineHeight: '0 !important' },
                                '& .MuiTableBody-root .MuiTableRow-root': { height: '22px !important', maxHeight: '22px !important' }
                            }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell
                                            onClick={() => setRightPanelMode('groups')}
                                            sx={{
                                                fontWeight: 'bold',
                                                fontSize: '12px',
                                                color: rightPanelMode === 'groups' ? '#1976d2' : 'black',
                                                textAlign: 'center',
                                                padding: '12px 16px',
                                                border: '1px solid #e0e0e0',
                                                textDecoration: 'underline',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                width: '50%',
                                                '&:hover': {
                                                    backgroundColor: '#f5f5f5',
                                                    color: '#1976d2'
                                                }
                                            }}
                                        >
                                            Группы
                                        </TableCell>
                                        <TableCell
                                            onClick={() => setRightPanelMode('kinds')}
                                            sx={{
                                                fontWeight: 'bold',
                                                fontSize: '12px',
                                                color: rightPanelMode === 'kinds' ? '#1976d2' : 'black',
                                                textAlign: 'center',
                                                padding: '12px 16px',
                                                border: '1px solid #e0e0e0',
                                                textDecoration: 'underline',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                width: '50%',
                                                '&:hover': {
                                                    backgroundColor: '#f5f5f5',
                                                    color: '#1976d2'
                                                }
                                            }}
                                        >
                                            Виды
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rightPanelMode === 'groups' ? (
                                        <>
                                            {/* Кнопка "Все" для сброса фильтра */}
                                            <TableRow
                                                sx={{
                                                    height: '35px',
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedGroupId === null ? '#e3f2fd' : 'transparent',
                                                    '&:hover': { backgroundColor: '#f5f5f5' }
                                                }}
                                                onClick={() => setSelectedGroupId(null)}
                                            >
                                                <TableCell colSpan={2} sx={{ py: 0.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <strong>Все</strong>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                            {/* Кнопка "Без группы" */}
                                            <TableRow
                                                sx={{
                                                    height: '35px',
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedGroupId === '' ? '#e3f2fd' : 'transparent',
                                                    '&:hover': { backgroundColor: '#f5f5f5' }
                                                }}
                                                onClick={() => setSelectedGroupId('')}
                                            >
                                                <TableCell colSpan={2} sx={{ py: 0.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        Без группы
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                            {groups.map((group) => (
                                                <TableRow
                                                    key={group.id}
                                                    sx={{
                                                        height: '35px',
                                                        cursor: 'pointer',
                                                        backgroundColor: selectedGroupId === group.id ? '#e3f2fd' : 'transparent',
                                                        '&:hover': { backgroundColor: '#f5f5f5' }
                                                    }}
                                                    onClick={() => setSelectedGroupId(group.id)}
                                                    onDoubleClick={() => canEdit() && handleOpenGroupDialog(group)}
                                                >
                                                    <TableCell colSpan={2} sx={{ py: 0.5 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <FolderIcon fontSize="small" color="action" />
                                                            {group.name}
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {groups.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={2} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                                        Нет групп
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {/* Кнопка "Все" для сброса фильтра по видам */}
                                            <TableRow
                                                sx={{
                                                    height: '35px',
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedKindId === null ? '#e3f2fd' : 'transparent',
                                                    '&:hover': { backgroundColor: '#f5f5f5' }
                                                }}
                                                onClick={() => setSelectedKindId(null)}
                                            >
                                                <TableCell colSpan={2} sx={{ py: 0.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <strong>Все</strong>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                            {/* Кнопка "Без вида" */}
                                            <TableRow
                                                sx={{
                                                    height: '35px',
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedKindId === '' ? '#e3f2fd' : 'transparent',
                                                    '&:hover': { backgroundColor: '#f5f5f5' }
                                                }}
                                                onClick={() => setSelectedKindId('')}
                                            >
                                                <TableCell colSpan={2} sx={{ py: 0.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        Без вида
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                            {kinds.map((kind) => (
                                                <TableRow
                                                    key={kind.id}
                                                    sx={{
                                                        height: '35px',
                                                        cursor: 'pointer',
                                                        backgroundColor: selectedKindId === kind.id ? '#e3f2fd' : 'transparent',
                                                        '&:hover': { backgroundColor: '#f5f5f5' }
                                                    }}
                                                    onClick={() => setSelectedKindId(kind.id)}
                                                >
                                                    <TableCell colSpan={2} sx={{ py: 0.5 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <DescriptionIcon fontSize="small" color="action" />
                                                            {kind.name}
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {kinds.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={2} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                                        Нет видов
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Box>
            )}

            {/* Диалог создания/редактирования группы */}
            <Dialog open={openGroupDialog} onClose={() => { }} maxWidth="sm" fullWidth disableEscapeKeyDown>
                <DialogTitle>
                    {editingGroup ? 'Редактировать группу' : 'Создать группу'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Название группы"
                        fullWidth
                        variant="outlined"
                        value={groupForm.name}
                        onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                        sx={{ mb: 2 }}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        margin="dense"
                        label="Описание"
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        value={groupForm.description}
                        onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                    />
                </DialogContent>
                <DialogActions>
                    <VolumeButton onClick={handleSaveGroup} color="blue">
                        {editingGroup ? 'Сохранить' : 'Создать'}
                    </VolumeButton>
                    <VolumeButton onClick={handleCloseGroupDialog} color="orange">
                        Отмена
                    </VolumeButton>
                </DialogActions>
            </Dialog>

            {/* Диалог создания/редактирования позиции */}
            <Dialog open={openItemDialog} onClose={() => { }} maxWidth="md" fullWidth disableEscapeKeyDown>
                <DialogTitle>
                    Карточка номенклатуры
                </DialogTitle>
                <DialogContent>
                    {/* Строка 1: Обозначение | Наименование */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                            label="Обозначение"
                            value={itemForm.designation}
                            onChange={(e) => setItemForm({ ...itemForm, designation: e.target.value })}
                            margin="dense"
                            sx={{ width: '40%' }}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            autoFocus
                            label="Наименование"
                            value={itemForm.name}
                            onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                            margin="dense"
                            required
                            sx={{ width: '60%' }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>

                    {/* Строка 2: Описание */}
                    <TextField
                        fullWidth
                        label="Описание"
                        value={itemForm.description}
                        onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                        margin="dense"
                        multiline
                        rows={3}
                        sx={{ mb: 2 }}
                        InputLabelProps={{ shrink: true }}
                    />

                    {/* Строка 3: Артикул | Код 1С | Производитель */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                            label="Артикул"
                            value={itemForm.article}
                            onChange={(e) => setItemForm({ ...itemForm, article: e.target.value })}
                            margin="dense"
                            sx={{ flex: 1 }}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Код 1С"
                            value={itemForm.code1c}
                            onChange={(e) => setItemForm({ ...itemForm, code1c: e.target.value })}
                            margin="dense"
                            sx={{ flex: 1 }}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Производитель"
                            value={itemForm.manufacturer}
                            onChange={(e) => setItemForm({ ...itemForm, manufacturer: e.target.value })}
                            margin="dense"
                            sx={{ flex: 1 }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>

                    {/* Строка 4: Тип | Вид | Группа */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <FormControl margin="dense" sx={{ flex: 1 }}>
                            <InputLabel shrink>Тип</InputLabel>
                            <Select
                                value={itemForm.type}
                                onChange={(e) => setItemForm({ ...itemForm, type: e.target.value })}
                                label="Тип"
                                notched
                            >
                                <MenuItem value="Product">Товар</MenuItem>
                                <MenuItem value="Service">Услуга</MenuItem>
                                <MenuItem value="Work">Работа</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl margin="dense" sx={{ flex: 1 }}>
                            <InputLabel shrink>Вид</InputLabel>
                            <Select
                                value={itemForm.kindId}
                                onChange={(e) => setItemForm({ ...itemForm, kindId: e.target.value })}
                                label="Вид"
                                notched
                            >
                                <MenuItem value="">Не указан</MenuItem>
                                {kinds.map((kind) => (
                                    <MenuItem key={kind.id} value={kind.id}>
                                        {kind.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl margin="dense" sx={{ flex: 1 }}>
                            <InputLabel shrink>Группа</InputLabel>
                            <Select
                                value={itemForm.groupId}
                                onChange={(e) => setItemForm({ ...itemForm, groupId: e.target.value })}
                                label="Группа"
                                notched
                            >
                                <MenuItem value="">Без группы</MenuItem>
                                {groups.map((group) => (
                                    <MenuItem key={group.id} value={group.id}>
                                        {group.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Строка 5: Единица измерения | Цена */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <FormControl margin="dense" sx={{ flex: 1 }}>
                            <InputLabel shrink>Единица измерения</InputLabel>
                            <Select
                                value={itemForm.unitId}
                                onChange={(e) => setItemForm({ ...itemForm, unitId: e.target.value })}
                                label="Единица измерения"
                                notched
                            >
                                <MenuItem value="">Не указана</MenuItem>
                                {units.map((unit) => (
                                    <MenuItem key={unit.id} value={unit.id}>
                                        {unit.code} - {unit.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Цена (руб)"
                            type="number"
                            value={itemForm.price}
                            onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                            margin="dense"
                            inputProps={{ min: 0, step: 0.01 }}
                            sx={{ flex: 1 }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <VolumeButton onClick={handleSaveItem} color="blue">
                        Сохранить
                    </VolumeButton>
                    <VolumeButton onClick={handleCloseItemDialog} color="orange">
                        Отмена
                    </VolumeButton>
                </DialogActions>
            </Dialog>

            {/* Диалог импорта */}
            <Dialog open={openImportDialog} onClose={() => { }} maxWidth="sm" fullWidth disableEscapeKeyDown>
                <DialogTitle>
                    Импорт номенклатуры
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Выберите файл для импорта номенклатуры (Excel или CSV)
                        </Typography>
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    setImportFile(file);
                                    handleFileUpload(file);
                                }
                            }}
                            style={{ width: '100%' }}
                        />
                        {importFile && (
                            <Typography variant="body2" sx={{ mt: 2 }}>
                                Выбран файл: {importFile.name}
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <VolumeButton
                        onClick={() => {
                            if (excelData && excelData.length > 0) {
                                setOpenImportDialog(false);
                                setShowColumnMapping(true);
                            } else {
                                alert('Сначала выберите файл для импорта');
                            }
                        }}
                        color="green"
                        disabled={!importFile}
                    >
                        Импортировать
                    </VolumeButton>
                    <VolumeButton
                        onClick={() => {
                            setOpenImportDialog(false);
                            setImportFile(null);
                            setExcelData([]);
                        }}
                        color="orange"
                    >
                        Отмена
                    </VolumeButton>
                </DialogActions>
            </Dialog>

            {/* Диалог сопоставления колонок */}
            <Dialog
                open={showColumnMapping}
                maxWidth={false}
                fullWidth
                hideBackdrop={true}
                disablePortal={true}
                sx={{
                    '& .MuiDialog-paper': {
                        width: '100vw',
                        height: 'calc(100vh - 48px)',
                        margin: 0,
                        marginTop: '48px',
                        borderRadius: 0,
                        maxWidth: 'none',
                        overflow: 'hidden'
                    },
                    '& .MuiDialogContent-root': {
                        overflow: 'hidden !important'
                    },
                    '& .MuiDialogContentText-root': {
                        overflow: 'hidden !important'
                    }
                }}
            >
                <DialogTitle>Сопоставление колонок Excel</DialogTitle>
                <DialogContent sx={{ overflow: 'hidden' }}>
                    {excelData.length > 0 && (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            flexWrap: 'wrap',
                            alignContent: 'flex-start'
                        }}>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 2,
                                width: 'auto',
                                minWidth: `${excelData[0].length * 150}px`
                            }}>
                                <Typography variant="body2" color="text.secondary">
                                    Сопоставьте колонки из Excel файла с полями номенклатуры:
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        onClick={analyzeImportData}
                                        variant="contained"
                                        disabled={!Object.values(columnMapping).includes('name')}
                                    >
                                        Анализировать
                                    </Button>
                                    <Button onClick={() => setShowColumnMapping(false)}>
                                        Отмена
                                    </Button>
                                </Box>
                            </Box>
                            <Box sx={{ width: 'auto' }}>
                                <Table size="small" sx={{
                                    tableLayout: 'fixed',
                                    width: 'auto',
                                    '& .MuiTableCell-root': {
                                        width: '150px',
                                        maxWidth: '150px',
                                        fontSize: '12px !important'
                                    },
                                    '& .MuiTableBody-root .MuiTableCell-root:nth-of-type(2)': {
                                        paddingLeft: '4px !important',
                                        paddingRight: '4px !important'
                                    }
                                }}>
                                    <TableBody>
                                        {/* Строка сопоставления колонок */}
                                        <TableRow>
                                            {excelData[0].map((_: any, index: number) => (
                                                <TableCell key={index} sx={{ textAlign: 'center', padding: '4px !important' }}>
                                                    <FormControl size="small" sx={{ width: '100%', '& .MuiOutlinedInput-root': { height: '32px' }, '& .MuiSelect-select': { padding: '6px 14px', fontSize: '12px' } }}>
                                                        <Select
                                                            value={columnMapping[index.toString()] || ''}
                                                            onChange={(e) => {
                                                                const newMapping = { ...columnMapping };
                                                                Object.keys(newMapping).forEach(key => {
                                                                    if (key === index.toString()) delete newMapping[key];
                                                                });
                                                                if (e.target.value) {
                                                                    Object.keys(newMapping).forEach(key => {
                                                                        if (newMapping[key] === e.target.value) delete newMapping[key];
                                                                    });
                                                                    newMapping[index.toString()] = e.target.value;
                                                                }
                                                                setColumnMapping(newMapping);
                                                            }}
                                                            displayEmpty
                                                            sx={{ '& .MuiSelect-select': { fontSize: '12px' } }}
                                                        >
                                                            <MenuItem value="" sx={{ fontSize: '12px' }}>Не выбрано</MenuItem>
                                                            <MenuItem value="designation" sx={{ fontSize: '12px' }}>Обозначение</MenuItem>
                                                            <MenuItem value="name" sx={{ fontSize: '12px' }}>Наименование</MenuItem>
                                                            <MenuItem value="article" sx={{ fontSize: '12px' }}>Артикул</MenuItem>
                                                            <MenuItem value="code1c" sx={{ fontSize: '12px' }}>Код 1С</MenuItem>
                                                            <MenuItem value="group" sx={{ fontSize: '12px' }}>Группа</MenuItem>
                                                            <MenuItem value="manufacturer" sx={{ fontSize: '12px' }}>Производитель</MenuItem>
                                                            <MenuItem value="description" sx={{ fontSize: '12px' }}>Описание</MenuItem>
                                                            <MenuItem value="unit" sx={{ fontSize: '12px' }}>Ед. измерения</MenuItem>
                                                            <MenuItem value="price" sx={{ fontSize: '12px' }}>Цена</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                        {/* Заголовки Excel */}
                                        <TableRow>
                                            {excelData[0].map((_: any, index: number) => (
                                                <TableCell key={index} sx={{
                                                    fontWeight: 'bold',
                                                    fontSize: '12px !important',
                                                    textAlign: 'center',
                                                    padding: '4px !important',
                                                    border: '2px solid #333',
                                                    borderTop: '2px solid #333',
                                                    borderLeft: '2px solid #333',
                                                    borderRight: index === excelData[0].length - 1 ? '2px solid #333' : '1px solid #e0e0e0',
                                                    borderBottom: '2px solid #333'
                                                }}>
                                                    {excelData[0][index] || `Колонка ${index + 1}`}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                        {/* Превью данных */}
                                        {excelData.length > 1 && excelData.slice(1, 4).map((row: any[], rowIndex: number) => (
                                            <TableRow key={rowIndex}>
                                                {row.map((cell: any, cellIndex: number) => (
                                                    <TableCell key={cellIndex} sx={{
                                                        fontSize: '12px !important',
                                                        textAlign: 'center',
                                                        padding: '4px !important',
                                                        border: '1px solid #e0e0e0',
                                                        backgroundColor: columnMapping[cellIndex.toString()] ? '#e3f2fd' : 'transparent'
                                                    }}>
                                                        {cell || ''}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            {/* Диалог предварительного просмотра импорта */}
            <Dialog
                open={showPreviewDialog}
                maxWidth="lg"
                fullWidth
                hideBackdrop={true}
                disablePortal={true}
                sx={{
                    '& .MuiDialog-paper': {
                        width: '90vw',
                        height: '80vh',
                        maxWidth: 'none',
                        maxHeight: 'none'
                    }
                }}
            >
                <DialogTitle>
                    Предварительный просмотр импорта номенклатуры
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Всего позиций: {importStats.total} |
                        Существующих: {importStats.existing} |
                        Новых: {importStats.new}
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
                        <TableContainer component={Paper} sx={{ maxHeight: '400px' }}>
                            <Table size="small" sx={{
                                '& .MuiTableCell-root': { fontSize: '12px', padding: '4px 8px' }
                            }}>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Статус</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Наименование</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Артикул</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Код 1С</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Производитель</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Цена</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {previewData.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Chip
                                                    label={item.isExisting ? 'Существующая' : 'Новая'}
                                                    color={item.isExisting ? 'success' : 'warning'}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>{item.name}</TableCell>
                                            <TableCell>{item.article || '-'}</TableCell>
                                            <TableCell>{item.code1c || '-'}</TableCell>
                                            <TableCell>{item.manufacturer || '-'}</TableCell>
                                            <TableCell>{item.price || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Зеленые позиции будут использованы из номенклатуры,
                            желтые будут созданы как новые позиции
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button onClick={() => setShowPreviewDialog(false)}>
                            Отмена
                        </Button>
                        <Button
                            onClick={() => {
                                // TODO: Реализовать импорт номенклатуры
                                console.log('Импорт номенклатуры:', previewData);
                                setShowPreviewDialog(false);
                            }}
                            variant="contained"
                            color="primary"
                        >
                            Импортировать все
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default NomenclaturePage;

