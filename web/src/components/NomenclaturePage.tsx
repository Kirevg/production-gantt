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
    Alert,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Menu,
    ListItemIcon,
    ListItemText,
    Checkbox,
    ListItemButton,
    Radio,
    FormControlLabel
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Folder as FolderIcon,
    Description as DescriptionIcon,
    Upload as UploadIcon,
    AddBox as AddBoxIcon,
    IndeterminateCheckBox as MinusBoxIcon,
    Menu as MenuIcon,
    Add as AddIcon,
    KeyboardArrowUp as ArrowUpIcon,
    KeyboardArrowDown as ArrowDownIcon,
    Sort as SortIcon
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

// Интерфейс для дерева групп
interface NomenclatureGroupTree extends NomenclatureGroup {
    children: NomenclatureGroupTree[];
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
    const [error, setError] = useState<string>('');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set()); // Раскрытые группы
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null); // Фильтр по группе
    const [selectedKindId, setSelectedKindId] = useState<string | null>(null); // Фильтр по виду
    const [rightPanelMode, setRightPanelMode] = useState<'groups' | 'kinds'>('groups'); // Режим правой панели

    // Состояние для меню управления группами
    const [groupsMenuAnchor, setGroupsMenuAnchor] = useState<null | HTMLElement>(null);
    const [showNestedGroups, setShowNestedGroups] = useState(false); // Показывать номенклатуру вложенных групп
    const [sortByName, setSortByName] = useState(true); // Сортировать по наименованию

    // Состояние для диалога группы
    const [openGroupDialog, setOpenGroupDialog] = useState(false);
    const [editingGroup, setEditingGroup] = useState<NomenclatureGroup | null>(null);
    const [groupForm, setGroupForm] = useState({
        name: '',
        description: '',
        parentId: ''
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
    const [noHeaders, setNoHeaders] = useState(false);
    const [showPreviewDialog, setShowPreviewDialog] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [importStats, setImportStats] = useState({ existing: 0, new: 0, total: 0 });
    const [previewFilter, setPreviewFilter] = useState<'all' | 'existing' | 'new'>('all');

    // Состояния для детального сравнения
    const [showCompareDialog, setShowCompareDialog] = useState(false);
    const [compareItem, setCompareItem] = useState<any>(null);
    const [updateFields, setUpdateFields] = useState<{ [key: string]: boolean }>({});

    // Функция форматирования даты

    // Автоматическое сопоставление колонок по заголовкам
    const autoMapColumns = (headers: any[]) => {
        const mapping: { [key: string]: string } = {};

        // Словарь возможных вариантов названий колонок
        const columnVariants: { [key: string]: string[] } = {
            'designation': ['обозначение', 'designation', 'код изделия', 'шифр'],
            'name': ['наименование', 'название', 'name', 'номенклатура'],
            'article': ['артикул', 'article', 'арт'],
            'code1c': ['код 1с', 'код1с', 'code1c', '1c', 'код'],
            'group': ['группа', 'group', 'категория'],
            'manufacturer': ['производитель', 'manufacturer', 'изготовитель'],
            'description': ['описание', 'description', 'примечание'],
            'unit': ['ед. измерения', 'единица', 'unit', 'ед', 'единица измерения'],
            'price': ['цена', 'price', 'стоимость']
        };

        headers.forEach((header: any, index: number) => {
            if (!header) return;

            const headerLower = header.toString().toLowerCase().trim();

            // Ищем совпадение с известными вариантами
            for (const [fieldName, variants] of Object.entries(columnVariants)) {
                for (const variant of variants) {
                    if (headerLower.includes(variant) || variant.includes(headerLower)) {
                        // Проверяем, не занято ли уже это поле
                        const isAlreadyMapped = Object.values(mapping).includes(fieldName);
                        if (!isAlreadyMapped) {
                            mapping[index.toString()] = fieldName;
                            break;
                        }
                    }
                }
            }
        });

        return mapping;
    };

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

                    // Автоматическое сопоставление колонок на основе заголовков
                    if (jsonData[0]) {
                        const autoMapping = autoMapColumns(jsonData[0] as any[]);
                        setColumnMapping(autoMapping);
                    }

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

            // Пропускаем заголовок (первую строку), если таблица с заголовками
            const rows = noHeaders ? excelData : excelData.slice(1);
            const analyzedData: any[] = [];
            let existingCount = 0;
            let newCount = 0;

            // Анализируем каждую строку
            for (const row of rows) {
                if (row.length < 2) continue; // Пропускаем пустые строки

                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        console.error('Токен авторизации не найден');
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

                    // Ищем существующую позицию в номенклатуре по приоритетным критериям
                    let existingItem = null;

                    // ПРИОРИТЕТ 1: Сначала ищем по наименованию (самое важное поле)
                    if (!existingItem && nomenclatureData.name) {
                        const searchResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/find?name=${encodeURIComponent(nomenclatureData.name)}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (searchResponse.ok) {
                            const foundItem = await searchResponse.json();
                            // Проверяем точное совпадение по наименованию
                            if (foundItem && foundItem.name && foundItem.name.toLowerCase() === nomenclatureData.name.toLowerCase()) {
                                existingItem = foundItem;
                            }
                        }
                    }

                    // ПРИОРИТЕТ 2: Если не найдено по наименованию, ищем по артикулу
                    if (!existingItem && nomenclatureData.article) {
                        const searchResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/find?article=${encodeURIComponent(nomenclatureData.article)}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (searchResponse.ok) {
                            const foundItem = await searchResponse.json();
                            // Проверяем точное совпадение по артикулу
                            if (foundItem && foundItem.article && foundItem.article.toLowerCase() === nomenclatureData.article.toLowerCase()) {
                                existingItem = foundItem;
                            }
                        }
                    }

                    // ПРИОРИТЕТ 3: Если не найдено по артикулу, ищем по коду 1С
                    if (!existingItem && nomenclatureData.code1c) {
                        const searchResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/find?code1c=${encodeURIComponent(nomenclatureData.code1c)}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (searchResponse.ok) {
                            const foundItem = await searchResponse.json();
                            // Проверяем точное совпадение по коду 1С
                            if (foundItem && foundItem.code1c && foundItem.code1c.toLowerCase() === nomenclatureData.code1c.toLowerCase()) {
                                existingItem = foundItem;
                            }
                        }
                    }

                    // ПРИОРИТЕТ 4: Если не найдено по коду 1С, ищем по обозначению
                    if (!existingItem && nomenclatureData.designation) {
                        const searchResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/find?designation=${encodeURIComponent(nomenclatureData.designation)}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (searchResponse.ok) {
                            const foundItem = await searchResponse.json();
                            // Проверяем точное совпадение по обозначению
                            if (foundItem && foundItem.designation && foundItem.designation.toLowerCase() === nomenclatureData.designation.toLowerCase()) {
                                existingItem = foundItem;
                            }
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
            setPreviewFilter('all'); // Сбрасываем фильтр при открытии

            setShowColumnMapping(false);
            setShowPreviewDialog(true);

        } catch (error) {
            console.error('Ошибка анализа данных:', error);
            console.error('Ошибка при анализе данных');
        } finally {
            setLoading(false);
        }
    };

    // Фильтрация данных предпросмотра
    const getFilteredPreviewData = () => {
        switch (previewFilter) {
            case 'existing':
                return previewData.filter(item => item.isExisting);
            case 'new':
                return previewData.filter(item => !item.isExisting);
            default:
                return previewData;
        }
    };

    // Получить различия между данными из Excel и БД
    const getDifferences = (excelData: any, existingItem: any) => {
        const differences: { field: string, excelValue: any, dbValue: any, label: string }[] = [];

        // Порядок приоритета сравнения полей
        const fieldPriority = [
            'name',        // Наименование - самое важное
            'designation', // Обозначение
            'article',     // Артикул
            'code1c',      // Код 1С
            'manufacturer', // Производитель
            'description', // Описание
            'price',       // Цена
            'group'        // Группа
        ];

        const fieldLabels: { [key: string]: string } = {
            designation: 'Обозначение',
            name: 'Наименование',
            article: 'Артикул',
            code1c: 'Код 1С',
            manufacturer: 'Производитель',
            description: 'Описание',
            price: 'Цена',
            group: 'Группа'
        };

        // Сравниваем поля в порядке приоритета
        fieldPriority.forEach(field => {
            const excelValue = excelData[field];
            const dbValue = existingItem[field];

            // Для группы извлекаем только название
            let excelDisplayValue = excelValue || '(пусто)';
            let dbDisplayValue = dbValue || '(пусто)';

            if (field === 'group') {
                if (typeof excelValue === 'object' && excelValue?.name) {
                    excelDisplayValue = excelValue.name;
                }
                if (typeof dbValue === 'object' && dbValue?.name) {
                    dbDisplayValue = dbValue.name;
                }
            }

            // Сравниваем значения (с учётом пустых строк и null)
            const excelNormalized = excelDisplayValue || '';
            const dbNormalized = dbDisplayValue || '';

            if (excelNormalized !== dbNormalized) {
                differences.push({
                    field,
                    excelValue: excelDisplayValue,
                    dbValue: dbDisplayValue,
                    label: fieldLabels[field]
                });
            }
        });

        return differences;
    };

    // Открыть диалог сравнения для позиции
    const handleOpenCompareDialog = (item: any) => {
        if (!item.existingItem) return;

        const differences = getDifferences(item.originalData, item.existingItem);

        // По умолчанию выбираем все поля для обновления
        const defaultUpdateFields: { [key: string]: boolean } = {};
        differences.forEach(diff => {
            defaultUpdateFields[diff.field] = true;
        });

        setCompareItem(item);
        setUpdateFields(defaultUpdateFields);
        setShowCompareDialog(true);
    };

    // Применить выбранные обновления к позиции
    const handleApplyUpdates = () => {
        if (!compareItem) return;

        // Обновляем данные позиции согласно выбранным полям
        const updatedItem = { ...compareItem };
        Object.keys(updateFields).forEach(field => {
            if (updateFields[field]) {
                updatedItem[field] = compareItem.originalData[field];
            } else {
                updatedItem[field] = compareItem.existingItem[field];
            }
        });

        // Обновляем в массиве previewData
        const updatedPreviewData = previewData.map(item =>
            item === compareItem ? { ...updatedItem, needsUpdate: true } : item
        );
        setPreviewData(updatedPreviewData);

        setShowCompareDialog(false);
        setCompareItem(null);
    };

    // Импорт номенклатуры
    const importNomenclature = async (includeNewItems: boolean = true) => {
        try {
            setLoading(true);
            setError(''); // Очищаем предыдущие ошибки

            const token = localStorage.getItem('token');
            if (!token) {
                setError('Токен авторизации не найден');
                return;
            }

            let successCount = 0;
            let errorCount = 0;

            // Фильтруем данные в зависимости от выбора пользователя
            const itemsToImport = includeNewItems
                ? previewData
                : previewData.filter(item => item.isExisting);

            for (const item of itemsToImport) {
                try {
                    // Если позиция существует и требует обновления
                    if (item.isExisting && item.needsUpdate) {
                        // Обновляем существующую позицию
                        const nomenclatureItem: any = {};

                        // Добавляем только изменённые поля
                        if (item.designation !== item.existingItem.designation) nomenclatureItem.designation = item.designation;
                        if (item.name !== item.existingItem.name) nomenclatureItem.name = item.name;
                        if (item.article !== item.existingItem.article) nomenclatureItem.article = item.article;
                        if (item.code1c !== item.existingItem.code1c) nomenclatureItem.code1c = item.code1c;
                        if (item.manufacturer !== item.existingItem.manufacturer) nomenclatureItem.manufacturer = item.manufacturer;
                        if (item.description !== item.existingItem.description) nomenclatureItem.description = item.description;
                        if (item.price && parseFloat(item.price) !== item.existingItem.price) {
                            nomenclatureItem.price = parseFloat(item.price);
                        }

                        // Отправляем PUT запрос для обновления
                        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/items/${item.existingItem.id}`, {
                            method: 'PUT',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(nomenclatureItem)
                        });

                        if (response.ok) {
                            successCount++;
                        } else {
                            errorCount++;
                        }
                        continue;
                    }

                    // Если позиция существует без обновлений, пропускаем её
                    if (item.isExisting) {
                        successCount++;
                        continue;
                    }

                    // Создаём новую позицию
                    const nomenclatureItem: any = {
                        name: item.name,
                        type: 'Product', // По умолчанию тип "Товар"
                    };

                    // Добавляем опциональные поля
                    if (item.designation) nomenclatureItem.designation = item.designation;
                    if (item.article) nomenclatureItem.article = item.article;
                    if (item.code1c) nomenclatureItem.code1c = item.code1c;
                    if (item.manufacturer) nomenclatureItem.manufacturer = item.manufacturer;
                    if (item.description) nomenclatureItem.description = item.description;
                    if (item.unit) nomenclatureItem.unit = item.unit;
                    if (item.price) nomenclatureItem.price = parseFloat(item.price);

                    // Обработка группы (если указана)
                    if (item.group) {
                        // Ищем группу по названию
                        const groupsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/groups`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (groupsResponse.ok) {
                            const groups = await groupsResponse.json();
                            const foundGroup = groups.find((g: any) =>
                                g.name.toLowerCase() === item.group.toLowerCase()
                            );

                            if (foundGroup) {
                                nomenclatureItem.groupId = foundGroup.id;
                            } else {
                                // Создаём новую группу
                                const newGroupResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/groups`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ name: item.group })
                                });

                                if (newGroupResponse.ok) {
                                    const newGroup = await newGroupResponse.json();
                                    nomenclatureItem.groupId = newGroup.id;
                                }
                            }
                        }
                    }

                    // Создаём позицию номенклатуры
                    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/items`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(nomenclatureItem)
                    });

                    if (response.ok) {
                        successCount++;
                    } else {
                        errorCount++;
                        console.error('Ошибка создания позиции:', await response.text());
                    }

                } catch (error) {
                    errorCount++;
                    console.error('Ошибка импорта позиции:', error);
                }
            }

            // Закрываем диалог и обновляем данные
            setShowPreviewDialog(false);
            setImportFile(null);
            setExcelData([]);
            setColumnMapping({});
            setPreviewData([]);

            // Показываем результат
            alert(`Импорт завершен!\nУспешно: ${successCount}\nОшибок: ${errorCount}`);

            // Обновляем список номенклатуры
            await fetchNomenclature();

        } catch (error) {
            console.error('Ошибка импорта:', error);
            console.error('Ошибка при импорте номенклатуры');
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


    // Обработчики для групп
    const handleOpenGroupDialog = (group?: NomenclatureGroup) => {
        if (group) {
            setEditingGroup(group);
            setGroupForm({
                name: group.name,
                description: group.description || '',
                parentId: group.parentId || ''
            });
        } else {
            setEditingGroup(null);
            setGroupForm({
                name: '',
                description: '',
                parentId: ''
            });
        }
        setOpenGroupDialog(true);
    };

    const handleCloseGroupDialog = () => {
        setOpenGroupDialog(false);
        setEditingGroup(null);
        setGroupForm({
            name: '',
            description: '',
            parentId: ''
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
                    groupId: itemForm.groupId || undefined,
                    kindId: itemForm.kindId || undefined,
                    unitId: itemForm.unitId || undefined,
                    type: itemForm.type || undefined,
                    designation: itemForm.designation || undefined,
                    name: itemForm.name,
                    article: itemForm.article || undefined,
                    code1c: itemForm.code1c || undefined,
                    manufacturer: itemForm.manufacturer || undefined,
                    description: itemForm.description || undefined,
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
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `Ошибка: ${response.status}`;
                alert(errorMessage);
                return;
            }

            await fetchNomenclature();
        } catch (error) {
            console.error('Ошибка удаления позиции:', error);
            alert('Не удалось удалить позицию. Проверьте консоль для подробностей.');
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
    // Построение дерева групп
    const buildGroupTree = (groups: NomenclatureGroup[]): NomenclatureGroupTree[] => {
        const groupMap = new Map<string, NomenclatureGroupTree>();
        const rootGroups: NomenclatureGroupTree[] = [];

        // Создаем карту всех групп с пустыми массивами детей
        groups.forEach(group => {
            groupMap.set(group.id, { ...group, children: [] });
        });

        // Строим дерево
        groups.forEach(group => {
            const groupWithChildren = groupMap.get(group.id)!;
            if (group.parentId && groupMap.has(group.parentId)) {
                groupMap.get(group.parentId)!.children.push(groupWithChildren);
            } else {
                rootGroups.push(groupWithChildren);
            }
        });

        return rootGroups;
    };

    // Функция для переключения раскрытия группы
    const toggleGroupExpand = (groupId: string, event: React.MouseEvent) => {
        event.stopPropagation(); // Останавливаем всплытие, чтобы не срабатывал onClick на строке
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

    // Функции для меню управления группами
    const handleGroupsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setGroupsMenuAnchor(event.currentTarget);
    };

    const handleGroupsMenuClose = () => {
        setGroupsMenuAnchor(null);
    };

    const handleExpandAllGroups = () => {
        const allGroupIds = new Set<string>();
        const collectAllGroupIds = (groupTree: NomenclatureGroupTree[]) => {
            groupTree.forEach(group => {
                allGroupIds.add(group.id);
                if (group.children.length > 0) {
                    collectAllGroupIds(group.children);
                }
            });
        };
        collectAllGroupIds(buildGroupTree(groups));
        setExpandedGroups(allGroupIds);
        handleGroupsMenuClose();
    };

    const handleCollapseAllGroups = () => {
        setExpandedGroups(new Set());
        handleGroupsMenuClose();
    };

    const handleCreateGroup = () => {
        handleOpenGroupDialog();
        handleGroupsMenuClose();
    };

    // Рекурсивное отображение дерева групп
    const renderGroupTree = (groupTree: NomenclatureGroupTree[], level = 0) => {
        return groupTree.map((group) => (
            <React.Fragment key={group.id}>
                <TableRow
                    sx={{
                        minHeight: '20px',
                        cursor: 'pointer',
                        backgroundColor: selectedGroupId === group.id ? '#e3f2fd' : 'transparent',
                        '&:hover': { backgroundColor: '#f5f5f5' }
                    }}
                    onClick={() => setSelectedGroupId(group.id)}
                    onDoubleClick={() => canEdit() && handleOpenGroupDialog(group)}
                >
                    <TableCell colSpan={2} sx={{ py: 0.5, textAlign: 'left', paddingLeft: `${8}px` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {group.children.length > 0 && (
                                <IconButton
                                    size="small"
                                    onClick={(e) => toggleGroupExpand(group.id, e)}
                                    sx={{
                                        padding: 0,
                                        width: '16px',
                                        height: '16px',
                                        minWidth: '16px',
                                        '& .MuiSvgIcon-root': { fontSize: '16px' }
                                    }}
                                >
                                    {expandedGroups.has(group.id) ? <MinusBoxIcon /> : <AddBoxIcon />}
                                </IconButton>
                            )}
                            {group.children.length === 0 && <Box sx={{ width: '16px', minWidth: '16px' }} />}
                            <Box sx={{ width: `${level * 24}px`, minWidth: `${level * 24}px` }} />
                            <FolderIcon fontSize="small" sx={{ color: '#ffc107' }} />
                            {group.name}
                        </Box>
                    </TableCell>
                </TableRow>
                {group.children.length > 0 && expandedGroups.has(group.id) && renderGroupTree(group.children, level + 1)}
            </React.Fragment>
        ));
    };

    // Рекурсивное отображение групп в выпадающем списке
    const renderGroupMenuItems = (groupTree: NomenclatureGroupTree[], level = 0): React.ReactNode[] => {
        const items: React.ReactNode[] = [];

        groupTree.forEach((group) => {
            items.push(
                <MenuItem key={group.id} value={group.id}>
                    {'— '.repeat(level)}{group.name}
                </MenuItem>
            );

            if (group.children.length > 0) {
                items.push(...renderGroupMenuItems(group.children, level + 1));
            }
        });

        return items;
    };

    // Функция для получения всех дочерних групп
    const getAllChildGroupIds = (groupId: string): string[] => {
        const childIds: string[] = [];
        const findChildren = (parentId: string) => {
            groups.forEach(group => {
                if (group.parentId === parentId) {
                    childIds.push(group.id);
                    findChildren(group.id); // Рекурсивно ищем детей детей
                }
            });
        };
        findChildren(groupId);
        return childIds;
    };

    // Функция для получения номенклатуры группы с учетом вложенных групп
    const getItemsForGroupWithNested = (groupId: string) => {
        const allGroupIds = [groupId, ...getAllChildGroupIds(groupId)];
        return items.filter(item => item.groupId && allGroupIds.includes(item.groupId));
    };

    const getFilteredItems = () => {
        let filtered = items;

        // Если активен режим "Группы" - применяем фильтр по группам
        if (rightPanelMode === 'groups' && selectedGroupId !== null) {
            if (selectedGroupId === '') {
                filtered = getItemsWithoutGroup();
            } else {
                if (showNestedGroups) {
                    filtered = getItemsForGroupWithNested(selectedGroupId);
                } else {
                    filtered = getItemsForGroup(selectedGroupId);
                }
            }
        }

        // Если активен режим "Виды" - применяем фильтр по видам
        if (rightPanelMode === 'kinds' && selectedKindId !== null) {
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

            {/* Трехколоночный layout: слева номенклатура, в центре группы, справа виды */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            {loading ? (
                <LinearProgress />
            ) : (
                <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 200px)', width: '100%', overflow: 'hidden', justifyContent: 'space-between' }}>
                    {/* Левая колонка - Таблица номенклатуры */}
                    <Box sx={{ flex: '0 0 68%', minWidth: '232px', display: 'flex', flexDirection: 'column' }}>
                        {/* Заголовок и кнопки управления */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, mt: 2 }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px' }}>
                                Номенклатура
                            </Typography>
                            {canCreate() && (
                                <Box sx={{ display: 'flex', gap: 2 }}>
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
                                </Box>
                            )}
                        </Box>
                        <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto' }}>
                            <Table sx={{
                                '& .MuiTableCell-root': { border: '1px solid #e0e0e0', padding: '0 4px !important' },
                                '& .MuiTableHead-root .MuiTableCell-root': { fontSize: '14px !important', lineHeight: '0 !important' },
                                '& .MuiTableHead-root .MuiTableRow-root': { height: '30px !important', maxHeight: '30px !important' },
                                '& .MuiTableBody-root .MuiTableCell-root': { fontSize: '12px !important', lineHeight: '1.2 !important' },
                                '& .MuiTableBody-root .MuiTableRow-root': { height: 'auto !important', minHeight: '20px !important' },
                                '& .MuiTableHead-root .MuiTypography-root': { fontSize: '14px !important' }
                            }}>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '40px', fontSize: '14px' }}>№</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '14px', minWidth: '200px' }}>Наименование</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '14px' }}>Артикул</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '14px' }}>Код 1С</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '14px' }}>Производитель</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '40px', fontSize: '14px' }}>
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
                                            <TableCell sx={{ py: 0.5, fontSize: '12px', minWidth: '200px' }}>
                                                {item.name}
                                            </TableCell>
                                            <TableCell sx={{ py: 0.5, textAlign: 'center', fontSize: '12px' }}>{item.article || '-'}</TableCell>
                                            <TableCell sx={{ py: 0.5, textAlign: 'center', fontSize: '12px' }}>{item.code1c || '-'}</TableCell>
                                            <TableCell sx={{ py: 0.5, textAlign: 'center', fontSize: '12px' }}>{item.manufacturer || '-'}</TableCell>
                                            <TableCell sx={{ textAlign: 'center', py: 0.5, width: '40px' }}>
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
                    <Box sx={{ flex: '0 0 30%', minWidth: 0 }}>
                        <TableContainer component={Paper} sx={{ maxHeight: '600px', overflow: 'auto', marginTop: '64px' }}>
                            <Table sx={{
                                '& .MuiTableCell-root': { border: '1px solid #e0e0e0', padding: '0 4px !important' },
                                '& .MuiTableHead-root .MuiTableCell-root': { fontSize: '14px !important', lineHeight: '0 !important' },
                                '& .MuiTableHead-root .MuiTableRow-root': { height: '30px !important', maxHeight: '30px !important' },
                                '& .MuiTableBody-root .MuiTableCell-root': { fontSize: '12px !important', lineHeight: '1.2 !important' },
                                '& .MuiTableBody-root .MuiTableRow-root': { height: '20px !important', maxHeight: '20px !important' },
                                '& .MuiTableHead-root .MuiTypography-root': { fontSize: '14px !important' }
                            }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell colSpan={2} sx={{ padding: '8px 16px', border: '1px solid #e0e0e0' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <FormControlLabel
                                                        control={
                                                            <Radio
                                                                checked={rightPanelMode === 'groups'}
                                                                onChange={() => setRightPanelMode('groups')}
                                                                size="small"
                                                                sx={{ padding: '4px' }}
                                                            />
                                                        }
                                                        label="Группы"
                                                        sx={{ margin: 0, '& .MuiFormControlLabel-label': { fontSize: '14px !important' } }}
                                                    />
                                                    <FormControlLabel
                                                        control={
                                                            <Radio
                                                                checked={rightPanelMode === 'kinds'}
                                                                onChange={() => setRightPanelMode('kinds')}
                                                                size="small"
                                                                sx={{ padding: '4px' }}
                                                            />
                                                        }
                                                        label="Виды"
                                                        sx={{ margin: 0, '& .MuiFormControlLabel-label': { fontSize: '14px !important' } }}
                                                    />
                                                </Box>
                                                {rightPanelMode === 'groups' && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={handleGroupsMenuOpen}
                                                        sx={{
                                                            padding: '4px',
                                                            '& .MuiSvgIcon-root': { fontSize: '16px' }
                                                        }}
                                                    >
                                                        <MenuIcon />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rightPanelMode === 'groups' ? (
                                        <>
                                            {/* Кнопка "Все" для сброса фильтра */}
                                            <TableRow
                                                sx={{
                                                    minHeight: '20px',
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedGroupId === null ? '#e3f2fd' : 'transparent',
                                                    '&:hover': { backgroundColor: '#f5f5f5' }
                                                }}
                                                onClick={() => setSelectedGroupId(null)}
                                            >
                                                <TableCell colSpan={2} sx={{ py: 0.5, textAlign: 'left' }}>
                                                    <strong>&lt;Все группы&gt;</strong>
                                                </TableCell>
                                            </TableRow>
                                            {renderGroupTree(buildGroupTree(groups))}
                                            {/* Кнопка "Нет группы" */}
                                            <TableRow
                                                sx={{
                                                    minHeight: '20px',
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedGroupId === '' ? '#e3f2fd' : 'transparent',
                                                    '&:hover': { backgroundColor: '#f5f5f5' }
                                                }}
                                                onClick={() => setSelectedGroupId('')}
                                            >
                                                <TableCell colSpan={2} sx={{ py: 0.5, textAlign: 'left' }}>
                                                    <strong>&lt;Нет группы&gt;</strong>
                                                </TableCell>
                                            </TableRow>
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
                                                    minHeight: '20px',
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedKindId === null ? '#e3f2fd' : 'transparent',
                                                    '&:hover': { backgroundColor: '#f5f5f5' }
                                                }}
                                                onClick={() => setSelectedKindId(null)}
                                            >
                                                <TableCell colSpan={2} sx={{ py: 0.5, textAlign: 'left' }}>
                                                    <strong>&lt;Все&gt;</strong>
                                                </TableCell>
                                            </TableRow>
                                            {/* Кнопка "Без вида" */}
                                            <TableRow
                                                sx={{
                                                    minHeight: '20px',
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedKindId === '' ? '#e3f2fd' : 'transparent',
                                                    '&:hover': { backgroundColor: '#f5f5f5' }
                                                }}
                                                onClick={() => setSelectedKindId('')}
                                            >
                                                <TableCell colSpan={2} sx={{ py: 0.5, textAlign: 'left' }}>
                                                    <strong>&lt;Без вида&gt;</strong>
                                                </TableCell>
                                            </TableRow>
                                            {kinds.map((kind) => (
                                                <TableRow
                                                    key={kind.id}
                                                    sx={{
                                                        minHeight: '20px',
                                                        cursor: 'pointer',
                                                        backgroundColor: selectedKindId === kind.id ? '#e3f2fd' : 'transparent',
                                                        '&:hover': { backgroundColor: '#f5f5f5' }
                                                    }}
                                                    onClick={() => setSelectedKindId(kind.id)}
                                                >
                                                    <TableCell colSpan={2} sx={{ py: 0.5, textAlign: 'left' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <DescriptionIcon fontSize="small" sx={{ color: '#1976d2' }} />
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
                    <FormControl margin="dense" fullWidth>
                        <InputLabel shrink>Родительская группа</InputLabel>
                        <Select
                            value={groupForm.parentId}
                            onChange={(e) => setGroupForm({ ...groupForm, parentId: e.target.value })}
                            label="Родительская группа"
                            notched
                        >
                            <MenuItem value="">Без родительской группы</MenuItem>
                            {groups.length > 0 ? renderGroupMenuItems(buildGroupTree(groups.filter(group => group.id !== editingGroup?.id))) : <MenuItem disabled>Нет доступных групп</MenuItem>}
                        </Select>
                    </FormControl>
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
                                {renderGroupMenuItems(buildGroupTree(groups))}
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
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Сопоставьте колонки из Excel файла с полями номенклатуры:
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <input
                                            type="checkbox"
                                            id="noHeaders"
                                            checked={noHeaders}
                                            onChange={(e) => setNoHeaders(e.target.checked)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <label htmlFor="noHeaders" style={{ cursor: 'pointer', fontSize: '14px' }}>
                                            Таблица без заголовков
                                        </label>
                                    </Box>
                                </Box>
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
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                        <Typography
                            variant="body2"
                            sx={{
                                cursor: 'pointer',
                                fontWeight: previewFilter === 'all' ? 'bold' : 'normal',
                                color: previewFilter === 'all' ? 'primary.main' : 'text.secondary',
                                textDecoration: previewFilter === 'all' ? 'underline' : 'none',
                                '&:hover': { color: 'primary.main' }
                            }}
                            onClick={() => setPreviewFilter('all')}
                        >
                            Всего позиций: {importStats.total}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">|</Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                cursor: 'pointer',
                                fontWeight: previewFilter === 'existing' ? 'bold' : 'normal',
                                color: previewFilter === 'existing' ? 'success.main' : 'text.secondary',
                                textDecoration: previewFilter === 'existing' ? 'underline' : 'none',
                                '&:hover': { color: 'success.main' }
                            }}
                            onClick={() => setPreviewFilter('existing')}
                        >
                            Существующих: {importStats.existing}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">|</Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                cursor: 'pointer',
                                fontWeight: previewFilter === 'new' ? 'bold' : 'normal',
                                color: previewFilter === 'new' ? 'warning.main' : 'text.secondary',
                                textDecoration: previewFilter === 'new' ? 'underline' : 'none',
                                '&:hover': { color: 'warning.main' }
                            }}
                            onClick={() => setPreviewFilter('new')}
                        >
                            Новых: {importStats.new}
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
                        <TableContainer component={Paper} sx={{ maxHeight: '400px' }}>
                            <Table size="small" stickyHeader sx={{
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
                                        <TableCell sx={{ fontWeight: 'bold' }}>Действия</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {getFilteredPreviewData().map((item, index) => {
                                        const differences = item.existingItem ? getDifferences(item.originalData, item.existingItem) : [];
                                        const hasDifferences = differences.length > 0;

                                        return (
                                            <TableRow key={index} sx={{
                                                backgroundColor: item.needsUpdate ? '#fff9c4' : 'inherit'
                                            }}>
                                                <TableCell>
                                                    <Chip
                                                        label={
                                                            item.needsUpdate ? 'Обновится' :
                                                                item.isExisting ? 'Существующая' : 'Новая'
                                                        }
                                                        color={
                                                            item.needsUpdate ? 'info' :
                                                                item.isExisting ? 'success' : 'warning'
                                                        }
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                    {hasDifferences && !item.needsUpdate && (
                                                        <Chip
                                                            label={`${differences.length} отличий`}
                                                            color="warning"
                                                            size="small"
                                                            sx={{ ml: 0.5 }}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell>{item.article || '-'}</TableCell>
                                                <TableCell>{item.code1c || '-'}</TableCell>
                                                <TableCell>{item.manufacturer || '-'}</TableCell>
                                                <TableCell>{item.price || '-'}</TableCell>
                                                <TableCell>
                                                    {item.isExisting && hasDifferences && (
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => handleOpenCompareDialog(item)}
                                                        >
                                                            {item.needsUpdate ? 'Изменить' : 'Сравнить'}
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Зеленые позиции существуют в номенклатуре,
                            желтые будут созданы как новые позиции
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button onClick={() => setShowPreviewDialog(false)}>
                            Отмена
                        </Button>
                        <Button
                            onClick={() => importNomenclature(true)}
                            variant="contained"
                            color="primary"
                        >
                            Импортировать все
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>

            {/* Диалог детального сравнения */}
            <Dialog
                open={showCompareDialog}
                onClose={() => setShowCompareDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Сравнение данных: {compareItem?.name}
                </DialogTitle>
                <DialogContent>
                    {compareItem && compareItem.existingItem && (
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Поле</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>В Excel</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>В базе данных</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Обновить?</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {getDifferences(compareItem.originalData, compareItem.existingItem).map((diff) => (
                                        <TableRow key={diff.field}>
                                            <TableCell sx={{ fontWeight: 'bold' }}>{diff.label}</TableCell>
                                            <TableCell sx={{
                                                backgroundColor: '#e3f2fd',
                                                fontWeight: 'bold'
                                            }}>
                                                {diff.excelValue}
                                            </TableCell>
                                            <TableCell sx={{
                                                backgroundColor: '#f5f5f5'
                                            }}>
                                                {diff.dbValue}
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'center' }}>
                                                <Checkbox
                                                    checked={updateFields[diff.field] || false}
                                                    onChange={(e) => setUpdateFields({
                                                        ...updateFields,
                                                        [diff.field]: e.target.checked
                                                    })}
                                                    color="primary"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                    <Box sx={{ mt: 2, p: 2, backgroundColor: '#fff9c4', borderRadius: 1 }}>
                        <Typography variant="body2">
                            <strong>Подсказка:</strong> Выберите поля, которые нужно обновить из Excel.
                            Поля без галочки останутся без изменений.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowCompareDialog(false)}>
                        Отмена
                    </Button>
                    <Button
                        onClick={handleApplyUpdates}
                        variant="contained"
                        color="primary"
                    >
                        Применить изменения
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Меню управления группами */}
            <Menu
                anchorEl={groupsMenuAnchor}
                open={Boolean(groupsMenuAnchor)}
                onClose={handleGroupsMenuClose}
                PaperProps={{
                    sx: {
                        minWidth: '280px',
                        '& .MuiListItemText-root .MuiTypography-root': {
                            fontSize: '12px !important'
                        },
                        '& .MuiCheckbox-root': {
                            padding: '4px !important',
                            '& .MuiSvgIcon-root': {
                                fontSize: '18px !important'
                            }
                        },
                        '& .MuiListItemButton-root': {
                            padding: '0 8px !important'
                        },
                        '& .MuiListItemIcon-root': {
                            minWidth: '36px !important'
                        }
                    }
                }}
            >
                {/* Кнопка Создать */}
                <ListItemButton onClick={handleCreateGroup}>
                    <ListItemIcon>
                        <Box sx={{
                            width: 16,
                            height: 16,
                            backgroundColor: '#ffc107',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: '5px'
                        }}>
                            <AddIcon sx={{ color: 'white', fontSize: 16 }} />
                        </Box>
                    </ListItemIcon>
                    <ListItemText primary="Создать" />
                </ListItemButton>

                {/* Чекбокс: Показывать номенклатуру вложенных групп */}
                <ListItemButton onClick={() => setShowNestedGroups(!showNestedGroups)}>
                    <ListItemIcon>
                        <Checkbox
                            checked={showNestedGroups}
                            onChange={() => setShowNestedGroups(!showNestedGroups)}
                            size="small"
                        />
                    </ListItemIcon>
                    <ListItemText primary="Показывать номенклатуру вложенных групп" />
                </ListItemButton>

                {/* Чекбокс: Сортировать по наименованию */}
                <ListItemButton onClick={() => setSortByName(!sortByName)}>
                    <ListItemIcon>
                        <Checkbox
                            checked={sortByName}
                            onChange={() => setSortByName(!sortByName)}
                            size="small"
                        />
                    </ListItemIcon>
                    <ListItemText primary="Сортировать по наименованию" />
                </ListItemButton>

                {/* Кнопка Вверх */}
                <ListItemButton onClick={handleGroupsMenuClose}>
                    <ListItemIcon>
                        <ArrowUpIcon sx={{ color: '#1976d2' }} />
                    </ListItemIcon>
                    <ListItemText primary="Вверх" />
                </ListItemButton>

                {/* Кнопка Вниз */}
                <ListItemButton onClick={handleGroupsMenuClose}>
                    <ListItemIcon>
                        <ArrowDownIcon sx={{ color: '#1976d2' }} />
                    </ListItemIcon>
                    <ListItemText primary="Вниз" />
                </ListItemButton>

                {/* Кнопка Свернуть все */}
                <ListItemButton onClick={handleCollapseAllGroups}>
                    <ListItemIcon>
                        <SortIcon sx={{ color: '#666' }} />
                    </ListItemIcon>
                    <ListItemText primary="Свернуть все" />
                </ListItemButton>

                {/* Кнопка Развернуть все */}
                <ListItemButton onClick={handleExpandAllGroups}>
                    <ListItemIcon>
                        <SortIcon sx={{ color: '#666' }} />
                    </ListItemIcon>
                    <ListItemText primary="Развернуть все" />
                </ListItemButton>
            </Menu>
        </Box>
    );
};

export default NomenclaturePage;

