import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    LinearProgress,
    Alert,
    FormControl,
    Select,
    MenuItem,
    Chip
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import VolumeButton from './VolumeButton';

interface Specification {
    id: string;
    designation?: string;
    name?: string;
    article?: string;
    code1c?: string;
    group?: string;
    manufacturer?: string;
    description?: string;
    quantity: number;
    unit?: string;
    price?: number;
    totalPrice?: number;
    orderIndex: number;
    createdAt: string;
    updatedAt: string;
    nomenclatureItem?: {
        id: string;
        name: string;
        designation?: string;
        article?: string;
        code1c?: string;
        manufacturer?: string;
        description?: string;
        price?: number;
        group?: {
            id: string;
            name: string;
        };
    };
}

interface SpecificationsPageProps {
    productSpecificationId: string;
    productName: string;
    onBack: () => void;
    canEdit?: () => boolean;
    canCreate?: () => boolean;
    canDelete?: () => boolean;
}

const SpecificationDetail: React.FC<SpecificationsPageProps> = ({
    productSpecificationId,
    productName,
    onBack,
    canEdit = () => true,
    canCreate = () => true,
    canDelete = () => true
}) => {
    const [specifications, setSpecifications] = useState<Specification[]>([]);

    // Состояние для диалога выбора номенклатуры
    const [showNomenclatureDialog, setShowNomenclatureDialog] = useState(false);
    const [nomenclatureItems, setNomenclatureItems] = useState<Array<{
        id: string;
        name: string;
        designation?: string;
        article?: string;
        code1c?: string;
        manufacturer?: string;
        price?: number;
        group?: { name: string };
        kind?: { name: string };
    }>>([]);
    const [allNomenclatureItems, setAllNomenclatureItems] = useState<Array<{
        id: string;
        name: string;
        designation?: string;
        article?: string;
        code1c?: string;
        manufacturer?: string;
        price?: number;
        group?: { name: string };
        kind?: { name: string };
    }>>([]);
    const [nomenclatureLoading, setNomenclatureLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<Array<{
        item: any;
        quantity: number;
        unit: string;
    }>>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);

    // Функция для форматирования денежных значений в маску 0 000,00
    const formatCurrency = (value: number | null | undefined): string => {
        if (!value) return '-';
        return value.toLocaleString('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingSpecification, setEditingSpecification] = useState<Specification | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletingSpecification, setDeletingSpecification] = useState<Specification | null>(null);
    const [showColumnMapping, setShowColumnMapping] = useState(false);
    const [excelData, setExcelData] = useState<any[][]>([]);
    const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>({});
    const [showPreviewDialog, setShowPreviewDialog] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [importStats, setImportStats] = useState({ existing: 0, new: 0, total: 0 });
    const [specificationForm, setSpecificationForm] = useState({
        nomenclatureItemId: '',
        designation: '',
        name: '',
        article: '',
        code1c: '',
        group: '',
        manufacturer: '',
        description: '',
        quantity: 1,
        unit: '',
        price: '',
        totalPrice: ''
    });

    const fetchSpecifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Токен авторизации не найден');
                setLoading(false);
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/product-specifications/${productSpecificationId}/specifications`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSpecifications(data);
                setError(null);
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
                setError(`Ошибка загрузки спецификаций: ${errorData.error}`);
            }
        } catch (error) {
            setError(`Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchNomenclature = async () => {
        try {
            setNomenclatureLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен авторизации не найден');
                return;
            }

            // Загружаем номенклатуру и группы параллельно
            const [itemsResponse, groupsResponse] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/items`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/groups`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (itemsResponse.ok) {
                const data = await itemsResponse.json();
                setAllNomenclatureItems(data);
                setNomenclatureItems(data);
            }

            if (groupsResponse.ok) {
                const groupsData = await groupsResponse.json();
                setGroups(groupsData);
            }
        } catch (error) {
            console.error('Ошибка загрузки номенклатуры:', error);
        } finally {
            setNomenclatureLoading(false);
        }
    };

    useEffect(() => {
        fetchSpecifications();
    }, [productSpecificationId]);

    const handleOpenCreateForm = async () => {
        // Загружаем номенклатуру и открываем диалог выбора
        await fetchNomenclature();
        setShowNomenclatureDialog(true);
    };

    const handleOpenEditForm = (specification: Specification) => {
        setEditingSpecification(specification);
        setSpecificationForm({
            nomenclatureItemId: specification.nomenclatureItem?.id || '',
            designation: specification.nomenclatureItem?.designation || specification.designation || '',
            name: specification.nomenclatureItem?.name || specification.name || '',
            article: specification.nomenclatureItem?.article || specification.article || '',
            code1c: specification.nomenclatureItem?.code1c || specification.code1c || '',
            group: specification.group || '',
            manufacturer: specification.nomenclatureItem?.manufacturer || specification.manufacturer || '',
            description: specification.nomenclatureItem?.description || specification.description || '',
            quantity: specification.quantity,
            unit: specification.unit || '',
            price: specification.price?.toString() || '',
            totalPrice: specification.totalPrice?.toString() || ''
        });
        setShowEditForm(true);
    };


    const handleCloseNomenclatureDialog = () => {
        setShowNomenclatureDialog(false);
        setSearchQuery('');
        setSelectedGroupId(null);
        setSelectedItems([]);
        setShowFilters(false);
        // Восстанавливаем полный список номенклатуры
        setNomenclatureItems(allNomenclatureItems);
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        applyFilters(query, selectedGroupId);
    };

    const handleGroupSelection = (groupId: string | null) => {
        setSelectedGroupId(groupId);
        applyFilters(searchQuery, groupId);
    };

    const applyFilters = (query: string, groupId: string | null) => {
        let filtered = allNomenclatureItems;

        // Фильтр по поиску
        if (query.trim() !== '') {
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(query.toLowerCase()) ||
                (item.designation && item.designation.toLowerCase().includes(query.toLowerCase())) ||
                (item.article && item.article.toLowerCase().includes(query.toLowerCase())) ||
                (item.code1c && item.code1c.toLowerCase().includes(query.toLowerCase())) ||
                (item.manufacturer && item.manufacturer.toLowerCase().includes(query.toLowerCase()))
            );
        }

        // Фильтр по группе
        if (groupId) {
            filtered = filtered.filter(item => item.group?.name === groupId);
        }

        setNomenclatureItems(filtered);
    };

    const handleItemSelection = (item: any) => {
        // Проверяем, не добавлен ли уже этот элемент
        const existingIndex = selectedItems.findIndex(selected => selected.item.id === item.id);

        if (existingIndex >= 0) {
            // Если уже добавлен, увеличиваем количество
            const newSelectedItems = [...selectedItems];
            newSelectedItems[existingIndex].quantity += 1;
            setSelectedItems(newSelectedItems);
        } else {
            // Если новый, добавляем с количеством 1
            setSelectedItems([...selectedItems, {
                item: item,
                quantity: 1,
                unit: item.unit || 'шт'
            }]);
        }
    };


    const clearSelectedItems = () => {
        setSelectedItems([]);
    };

    const transferToDocument = () => {
        if (selectedItems.length === 0) {
            alert('Выберите номенклатуру для добавления');
            return;
        }

        // Добавляем первую выбранную позицию в спецификацию
        // По принципу 1С: сохраняем только ID номенклатуры, количество и цену
        const firstItem = selectedItems[0];
        setSpecificationForm({
            nomenclatureItemId: firstItem.item.id,
            designation: firstItem.item.designation || '',
            name: firstItem.item.name,
            article: firstItem.item.article || '',
            code1c: firstItem.item.code1c || '',
            group: firstItem.item.group?.name || '',
            manufacturer: firstItem.item.manufacturer || '',
            description: firstItem.item.description || '',
            quantity: firstItem.quantity,
            unit: firstItem.unit,
            price: firstItem.item.price?.toString() || '',
            totalPrice: ''
        });

        setSelectedItems([]);
        setShowNomenclatureDialog(false);
        setShowCreateForm(true);
    };

    const getTotalSum = () => {
        return selectedItems.reduce((sum, selected) => {
            return sum + (selected.item.price || 0) * selected.quantity;
        }, 0);
    };

    const handleCloseForms = () => {
        setShowCreateForm(false);
        setShowEditForm(false);
        setEditingSpecification(null);
        setSpecificationForm({
            nomenclatureItemId: '',
            designation: '',
            name: '',
            article: '',
            code1c: '',
            group: '',
            manufacturer: '',
            description: '',
            quantity: 1,
            unit: '',
            price: '',
            totalPrice: ''
        });
    };


    const handleSaveSpecification = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Токен авторизации не найден');
                return;
            }

            // Принцип 1С: в документ передаем только ID номенклатуры, количество и цену
            const data: any = {
                nomenclatureItemId: specificationForm.nomenclatureItemId,
                quantity: specificationForm.quantity,
                price: specificationForm.price ? parseFloat(specificationForm.price) : undefined,
                totalPrice: specificationForm.totalPrice ? parseFloat(specificationForm.totalPrice) : undefined
            };

            const url = editingSpecification
                ? `${import.meta.env.VITE_API_BASE_URL}/specifications/${editingSpecification.id}`
                : `${import.meta.env.VITE_API_BASE_URL}/product-specifications/${productSpecificationId}/specifications`;

            const method = editingSpecification ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                handleCloseForms();
                fetchSpecifications();
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
                setError(`Ошибка сохранения спецификации: ${errorData.error}`);
            }
        } catch (error) {
            setError(`Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    const handleDeleteSpecification = (specification: Specification) => {
        setDeletingSpecification(specification);
        setShowDeleteDialog(true);
    };

    const handleImport = () => {
        // Создаем скрытый input для выбора файла
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                parseExcelFile(file);
            }
        };
        input.click();
    };

    const parseExcelFile = async (file: File) => {
        try {
            setLoading(true);
            setError('');

            // Читаем файл Excel
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

            // Сохраняем данные и показываем диалог сопоставления
            console.log('Excel data:', jsonData);
            console.log('Number of rows:', jsonData.length);
            console.log('Number of columns in first row:', (jsonData[0] as any[])?.length || 0);
            setExcelData(jsonData as any[][]);

            // Инициализируем сопоставление колонок по умолчанию
            const defaultMapping: { [key: string]: string } = {};
            if (jsonData.length > 0) {
                const headers = jsonData[0] as string[];
                headers.forEach((header, index) => {
                    const headerLower = header?.toLowerCase() || '';
                    if (headerLower.includes('обознач') || headerLower.includes('designation')) {
                        defaultMapping[index.toString()] = 'designation';
                    } else if (headerLower.includes('назван') || headerLower.includes('name') || headerLower.includes('наимен')) {
                        defaultMapping[index.toString()] = 'name';
                    } else if (headerLower.includes('артикул') || headerLower.includes('article')) {
                        defaultMapping[index.toString()] = 'article';
                    } else if (headerLower.includes('код') && headerLower.includes('1с')) {
                        defaultMapping[index.toString()] = 'code1c';
                    } else if (headerLower.includes('группа') || headerLower.includes('group')) {
                        defaultMapping[index.toString()] = 'group';
                    } else if (headerLower.includes('производитель') || headerLower.includes('manufacturer') || headerLower.includes('бренд')) {
                        defaultMapping[index.toString()] = 'manufacturer';
                    } else if (headerLower.includes('описан') || headerLower.includes('description') || headerLower.includes('примечан')) {
                        defaultMapping[index.toString()] = 'description';
                    } else if (headerLower.includes('количест') || headerLower.includes('quantity') || headerLower.includes('кол-во')) {
                        defaultMapping[index.toString()] = 'quantity';
                    } else if (headerLower.includes('цена') || headerLower.includes('price') || headerLower.includes('стоимость')) {
                        defaultMapping[index.toString()] = 'price';
                    } else if (headerLower.includes('единиц') || headerLower.includes('unit') || headerLower.includes('ед.')) {
                        defaultMapping[index.toString()] = 'unit';
                    }
                });
            }

            setColumnMapping(defaultMapping);
            setShowColumnMapping(true);

        } catch (error) {
            console.error('Ошибка парсинга файла:', error);
            setError('Ошибка при чтении файла Excel');
        } finally {
            setLoading(false);
        }
    };

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
                    const specificationData: any = {};

                    Object.entries(columnMapping).forEach(([columnIndex, fieldName]) => {
                        const value = row[parseInt(columnIndex)];
                        if (value !== undefined && value !== null && value !== '') {
                            if (fieldName === 'quantity') {
                                specificationData[fieldName] = parseInt(value) || 1;
                            } else if (fieldName === 'price') {
                                specificationData[fieldName] = parseFloat(value) || undefined;
                            } else {
                                specificationData[fieldName] = value.toString();
                            }
                        }
                    });

                    // Проверяем обязательные поля
                    if (!specificationData.name) {
                        continue;
                    }

                    // Ищем существующую позицию в номенклатуре
                    let existingItem = null;

                    if (specificationData.article || specificationData.code1c || specificationData.name) {
                        const searchParams = new URLSearchParams();
                        if (specificationData.article) searchParams.append('article', specificationData.article);
                        if (specificationData.code1c) searchParams.append('code1c', specificationData.code1c);
                        if (specificationData.name) searchParams.append('name', specificationData.name);

                        const searchResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/find?${searchParams}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (searchResponse.ok) {
                            existingItem = await searchResponse.json();
                        }
                    }

                    analyzedData.push({
                        ...specificationData,
                        isExisting: !!existingItem,
                        existingItem: existingItem,
                        originalData: specificationData
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

    const importFromExcel = async () => {
        try {
            setLoading(true);
            setError('');

            let successCount = 0;
            let errorCount = 0;
            let existingCount = 0;
            let skippedCount = 0;

            // Импортируем каждую проанализированную позицию
            for (const item of previewData) {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        setError('Токен авторизации не найден');
                        return;
                    }

                    let nomenclatureItemId: string | null = null;

                    if (item.isExisting) {
                        // Используем существующую позицию
                        nomenclatureItemId = item.existingItem.id;
                        existingCount++;
                    } else {
                        // Пропускаем новые позиции - они НЕ будут добавлены в спецификацию
                        // В спецификацию добавляются ТОЛЬКО позиции, которые УЖЕ ЕСТЬ в номенклатуре
                        skippedCount++;
                        continue;
                    }

                    // Проверяем, что у нас есть nomenclatureItemId (позиция должна быть в номенклатуре)
                    if (!nomenclatureItemId) {
                        console.warn(`Позиция "${item.name}" не найдена в номенклатуре и не была создана`);
                        skippedCount++;
                        continue;
                    }

                    // Создаем позицию спецификации с ссылкой на номенклатуру
                    // В спецификацию добавляем только количество, цену и общую стоимость
                    // Остальные данные берем из номенклатуры
                    const requestData: any = {
                        nomenclatureItemId: nomenclatureItemId,
                        quantity: item.originalData.quantity ? parseInt(item.originalData.quantity) : 1,
                        price: item.originalData.price && !isNaN(parseFloat(item.originalData.price)) ? parseFloat(item.originalData.price) : null,
                        totalPrice: item.originalData.totalPrice && !isNaN(parseFloat(item.originalData.totalPrice)) ? parseFloat(item.originalData.totalPrice) : null
                    };

                    console.log('Отправляемые данные:', requestData);

                    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/product-specifications/${productSpecificationId}/specifications`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestData)
                    });

                    if (response.ok) {
                        successCount++;
                    } else {
                        errorCount++;
                        const errorText = await response.text();
                        console.error('Ошибка API:', response.status, errorText);
                    }
                } catch (error) {
                    console.error('Ошибка импорта позиции:', error);
                    errorCount++;
                }
            }

            // Обновляем список спецификаций
            await fetchSpecifications();

            // Закрываем диалог предварительного просмотра
            setShowPreviewDialog(false);

            // Показываем результат
            const message = `Импорт завершен:
- Успешно добавлено в спецификацию: ${successCount} позиций
- Использовано из номенклатуры: ${existingCount} позиций
- Пропущено (не найдены в номенклатуре): ${skippedCount} позиций
- Ошибок: ${errorCount}

${skippedCount > 0 ? '⚠️ Внимание: Некоторые позиции не были добавлены в спецификацию, так как они не найдены в номенклатуре. Сначала добавьте их в справочник номенклатуры.' : ''}`;

            alert(message);

        } catch (error) {
            console.error('Ошибка импорта:', error);
            setError('Ошибка при импорте файла');
        } finally {
            setLoading(false);
        }
    };

    const confirmDeleteSpecification = async () => {
        if (!deletingSpecification) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Токен авторизации не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/specifications/${deletingSpecification.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setShowDeleteDialog(false);
                setDeletingSpecification(null);
                fetchSpecifications();
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
                setError(`Ошибка удаления спецификации: ${errorData.error}`);
            }
        } catch (error) {
            setError(`Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    const handleClearAll = async () => {
        if (!canDelete() || specifications.length === 0) return;

        if (!window.confirm('Вы уверены, что хотите удалить все позиции спецификации?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Токен авторизации не найден');
                return;
            }

            // Удаляем все спецификации для данного продукта
            const deletePromises = specifications.map(spec =>
                fetch(`${import.meta.env.VITE_API_BASE_URL}/specifications/${spec.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
            );

            const responses = await Promise.all(deletePromises);
            const failedDeletes = responses.filter(response => !response.ok);

            if (failedDeletes.length === 0) {
                setError('Все позиции успешно удалены');
                fetchSpecifications();
            } else {
                setError(`Ошибка удаления ${failedDeletes.length} из ${specifications.length} позиций`);
            }
        } catch (error) {
            setError(`Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    if (loading) {
        return (
            <Box className="page-container">
                <LinearProgress />
            </Box>
        );
    }

    return (
        <Box className="page-container">
            <Box className="page-header">
                <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px' }}>
                    Спецификация: {productName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {canCreate() && (
                        <VolumeButton
                            variant="contained"
                            onClick={handleImport}
                            color="green"
                        >
                            Импорт
                        </VolumeButton>
                    )}
                    {canDelete() && specifications.length > 0 && (
                        <VolumeButton
                            variant="contained"
                            onClick={handleClearAll}
                            color="red"
                        >
                            Очистить
                        </VolumeButton>
                    )}
                    {canCreate() && (
                        <VolumeButton
                            variant="contained"
                            onClick={handleOpenCreateForm}
                            color="blue"
                        >
                            Добавить
                        </VolumeButton>
                    )}
                    <VolumeButton
                        variant="contained"
                        onClick={onBack}
                        color="orange"
                    >
                        Назад
                    </VolumeButton>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}


            <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
                <Table sx={{
                    '& .MuiTableCell-root': { borderRight: '1px solid #bdbdbd' },
                    '& .MuiTableHead-root .MuiTableCell-root': { fontSize: '12px !important' },
                    '& .MuiTableBody-root .MuiTableCell-root': { fontSize: '12px !important' },
                    '& .MuiTableRow-root': { height: '30px !important' },
                    '& .MuiTableBody-root .MuiTableRow-root': { height: '30px !important' },
                    '& .MuiButtonBase-root-MuiIconButton-root': { padding: '0 !important' },
                    '& .MuiIconButton-root': { padding: '0 !important' },
                    tableLayout: 'auto',
                    width: '100%',
                    minWidth: 'max-content'
                }}>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '12px', width: '40px', whiteSpace: 'nowrap' }}>№</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '12px', whiteSpace: 'nowrap' }}>Обозначение</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '12px', whiteSpace: 'nowrap' }}>Наименование</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '12px', whiteSpace: 'nowrap' }}>Артикул</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '12px', whiteSpace: 'nowrap' }}>Код 1С</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '12px', whiteSpace: 'nowrap' }}>Группа</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '12px', whiteSpace: 'nowrap' }}>Производитель</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '12px', whiteSpace: 'nowrap' }}>Описание</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '12px', whiteSpace: 'nowrap' }}>Кол-во</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '12px', whiteSpace: 'nowrap' }}>Ед.</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '12px', whiteSpace: 'nowrap' }}>Цена за ед. (руб)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '12px', whiteSpace: 'nowrap' }}>Сумма</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '20px', fontSize: '12px', p: 0.5, whiteSpace: 'nowrap' }}>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {specifications.map((specification, index) => (
                            <TableRow
                                key={specification.id}
                                sx={{ height: '30px !important', cursor: canEdit() ? 'pointer' : 'default' }}
                                onDoubleClick={canEdit() ? () => handleOpenEditForm(specification) : undefined}
                            >
                                <TableCell sx={{ p: 0.5, textAlign: 'center', width: '40px' }}>{index + 1}</TableCell>
                                <TableCell sx={{ p: 0.5, textAlign: 'center' }}>{specification.nomenclatureItem?.designation || specification.designation || '-'}</TableCell>
                                <TableCell sx={{ p: 0.5 }}>{specification.nomenclatureItem?.name || specification.name || '-'}</TableCell>
                                <TableCell sx={{ p: 0.5, textAlign: 'center' }}>{specification.nomenclatureItem?.article || specification.article || '-'}</TableCell>
                                <TableCell sx={{ p: 0.5, textAlign: 'center' }}>{specification.nomenclatureItem?.code1c || specification.code1c || '-'}</TableCell>
                                <TableCell sx={{ p: 0.5, textAlign: 'center' }}>{specification.nomenclatureItem?.group?.name || specification.group || '-'}</TableCell>
                                <TableCell sx={{ p: 0.5, textAlign: 'center' }}>{specification.nomenclatureItem?.manufacturer || specification.manufacturer || '-'}</TableCell>
                                <TableCell sx={{ p: 0.5 }}>{specification.nomenclatureItem?.description || specification.description || '-'}</TableCell>
                                <TableCell sx={{ p: 0.5, textAlign: 'center' }}>{specification.quantity}</TableCell>
                                <TableCell sx={{ p: 0.5, textAlign: 'center' }}>{(specification.nomenclatureItem as any)?.unit || specification.unit || '-'}</TableCell>
                                <TableCell sx={{ p: 0.5, textAlign: 'right' }}>
                                    {formatCurrency(specification.price)}
                                </TableCell>
                                <TableCell sx={{ p: 0.5, textAlign: 'right' }}>
                                    {formatCurrency(specification.totalPrice)}
                                </TableCell>
                                <TableCell sx={{ textAlign: 'center', p: 0.5, width: '20px' }}>
                                    {canDelete() && (
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDeleteSpecification(specification)}
                                            color="error"
                                            sx={{ minWidth: 'auto', padding: '4px' }}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Диалог выбора номенклатуры */}
            <Dialog
                open={showNomenclatureDialog}
                onClose={handleCloseNomenclatureDialog}
                maxWidth="lg"
                fullWidth
                hideBackdrop={true}
                disablePortal={true}
                disableScrollLock={true}
                keepMounted={false}
                disableEnforceFocus={true}
                disableAutoFocus={true}
                disableEscapeKeyDown={true}
            >
                <DialogTitle sx={{
                    backgroundColor: '#f5f5f5',
                    borderBottom: '1px solid #ddd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '8px' }}>📦</span>
                        Подбор номенклатуры
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {selectedItems.length} на сумму {getTotalSum().toLocaleString('ru-RU')} ₽
                    </Typography>
                </DialogTitle>

                <DialogContent sx={{ p: 0, height: '600px', display: 'flex', flexDirection: 'column' }}>
                    {/* Верхняя панель с выбранными позициями */}
                    <Box sx={{ p: 2, borderBottom: '1px solid #ddd', backgroundColor: '#fafafa' }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                            <TextField
                                label="Номенклатура"
                                multiline
                                rows={2}
                                value={selectedItems.map(item => `${item.item.name} (${item.quantity} ${item.unit})`).join('\n')}
                                sx={{ flex: 1 }}
                                InputProps={{ readOnly: true }}
                            />
                            <TextField
                                label="Количество"
                                type="number"
                                size="small"
                                sx={{ width: '120px' }}
                                disabled={selectedItems.length === 0}
                            />
                            <TextField
                                label="Ед."
                                size="small"
                                sx={{ width: '80px' }}
                                disabled={selectedItems.length === 0}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={transferToDocument}
                                disabled={selectedItems.length === 0}
                                sx={{ backgroundColor: '#ffc107', color: 'black' }}
                            >
                                Перенести в документ
                            </Button>
                            <Button variant="outlined" onClick={clearSelectedItems} disabled={selectedItems.length === 0}>
                                Очистить
                            </Button>
                            <Button variant="outlined">
                                Показать в списке
                            </Button>
                        </Box>
                    </Box>

                    {/* Панель фильтров и поиска */}
                    <Box sx={{ p: 2, borderBottom: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                            <Button
                                variant="text"
                                onClick={() => setShowFilters(!showFilters)}
                                sx={{ textTransform: 'none', color: 'black' }}
                            >
                                {showFilters ? '▼' : '▶'} Фильтры
                            </Button>
                            <Button variant="outlined" size="small">Создать</Button>
                            <Box sx={{ flex: 1 }} />
                            <TextField
                                placeholder="Поиск (Ctrl+F)"
                                size="small"
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                sx={{ width: '300px' }}
                                InputProps={{
                                    startAdornment: <span style={{ marginRight: '8px' }}>🔍</span>,
                                    endAdornment: searchQuery && (
                                        <IconButton size="small" onClick={() => handleSearchChange('')}>
                                            ✕
                                        </IconButton>
                                    )
                                }}
                            />
                        </Box>

                        {showFilters && (
                            <Box sx={{ mt: 2, p: 2, backgroundColor: 'white', borderRadius: 1, border: '1px solid #ddd' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Дополнительные фильтры будут здесь
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Основное содержимое - две колонки */}
                    <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                        {/* Левая колонка - список номенклатуры */}
                        <Box sx={{ flex: 1, borderRight: '1px solid #ddd' }}>
                            {nomenclatureLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <LinearProgress />
                                </Box>
                            ) : (
                                <TableContainer sx={{ height: '100%' }}>
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                                <TableCell sx={{ fontWeight: 'bold', minWidth: '200px' }}>
                                                    Наименование ↓
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Остаток</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Ед.изм</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Артикул</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Цена</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {nomenclatureItems.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                                                        <Typography color="text.secondary">
                                                            {searchQuery ? 'Ничего не найдено' : 'Номенклатура не найдена'}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                nomenclatureItems.map((item) => (
                                                    <TableRow
                                                        key={item.id}
                                                        sx={{
                                                            cursor: 'pointer',
                                                            '&:hover': { backgroundColor: '#e3f2fd' },
                                                            '&.selected': { backgroundColor: '#fff3cd' }
                                                        }}
                                                        onClick={() => handleItemSelection(item)}
                                                        className={selectedItems.some(selected => selected.item.id === item.id) ? 'selected' : ''}
                                                    >
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <span style={{ marginRight: '8px' }}>📦</span>
                                                                {item.name}
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>-</TableCell>
                                                        <TableCell>шт</TableCell>
                                                        <TableCell>{item.article || '-'}</TableCell>
                                                        <TableCell>{item.price ? `${item.price.toLocaleString('ru-RU')} ₽` : '-'}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>

                        {/* Правая колонка - группы */}
                        <Box sx={{ width: '250px', backgroundColor: '#f9f9f9' }}>
                            <Box sx={{ p: 2, borderBottom: '1px solid #ddd' }}>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Группы</Typography>
                                    <IconButton size="small">
                                        <span>⋮</span>
                                    </IconButton>
                                </Box>
                            </Box>

                            <Box sx={{ p: 1 }}>
                                <Box
                                    sx={{
                                        p: 1,
                                        cursor: 'pointer',
                                        borderRadius: 1,
                                        backgroundColor: selectedGroupId === null ? '#fff3cd' : 'transparent',
                                        '&:hover': { backgroundColor: '#e3f2fd' }
                                    }}
                                    onClick={() => handleGroupSelection(null)}
                                >
                                    📁 Все группы
                                </Box>

                                {groups.map((group) => (
                                    <Box
                                        key={group.id}
                                        sx={{
                                            p: 1,
                                            cursor: 'pointer',
                                            borderRadius: 1,
                                            backgroundColor: selectedGroupId === group.id ? '#fff3cd' : 'transparent',
                                            '&:hover': { backgroundColor: '#e3f2fd' }
                                        }}
                                        onClick={() => handleGroupSelection(group.id)}
                                    >
                                        📁 {group.name}
                                    </Box>
                                ))}

                                <Box
                                    sx={{
                                        p: 1,
                                        cursor: 'pointer',
                                        borderRadius: 1,
                                        backgroundColor: selectedGroupId === 'no-group' ? '#fff3cd' : 'transparent',
                                        '&:hover': { backgroundColor: '#e3f2fd' }
                                    }}
                                    onClick={() => handleGroupSelection('no-group')}
                                >
                                    📁 Нет группы
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ backgroundColor: '#f5f5f5', borderTop: '1px solid #ddd' }}>
                    <Button onClick={handleCloseNomenclatureDialog}>Отмена</Button>
                </DialogActions>
            </Dialog>

            {/* Диалог создания/редактирования спецификации */}
            <Dialog
                open={showCreateForm || showEditForm}
                onClose={handleCloseForms}
                maxWidth="sm"
                fullWidth
                hideBackdrop={true}
                disablePortal={true}
                disableScrollLock={true}
                keepMounted={false}
                disableEnforceFocus={true}
                disableAutoFocus={true}
                disableEscapeKeyDown={true}
            >
                <DialogTitle>
                    {editingSpecification ? 'Редактировать позицию' : 'Добавить позицию'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Обозначение"
                        value={specificationForm.designation}
                        onChange={(e) => setSpecificationForm({ ...specificationForm, designation: e.target.value })}
                        margin="normal"
                        placeholder="ПЗ.123456, СБ.001 и т.д."
                    />
                    <TextField
                        autoFocus
                        fullWidth
                        label="Наименование"
                        value={specificationForm.name}
                        onChange={(e) => setSpecificationForm({ ...specificationForm, name: e.target.value })}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Артикул"
                        value={specificationForm.article}
                        onChange={(e) => setSpecificationForm({ ...specificationForm, article: e.target.value })}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Код 1С"
                        value={specificationForm.code1c}
                        onChange={(e) => setSpecificationForm({ ...specificationForm, code1c: e.target.value })}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Группа"
                        value={specificationForm.group}
                        onChange={(e) => setSpecificationForm({ ...specificationForm, group: e.target.value })}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Производитель"
                        value={specificationForm.manufacturer}
                        onChange={(e) => setSpecificationForm({ ...specificationForm, manufacturer: e.target.value })}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Описание"
                        value={specificationForm.description}
                        onChange={(e) => setSpecificationForm({ ...specificationForm, description: e.target.value })}
                        margin="normal"
                        multiline
                        rows={2}
                    />
                    <TextField
                        fullWidth
                        label="Количество"
                        type="number"
                        value={specificationForm.quantity}
                        onChange={(e) => setSpecificationForm({ ...specificationForm, quantity: parseInt(e.target.value) || 1 })}
                        margin="normal"
                        required
                        inputProps={{ min: 1 }}
                    />
                    <TextField
                        fullWidth
                        label="Единица измерения"
                        value={specificationForm.unit}
                        onChange={(e) => setSpecificationForm({ ...specificationForm, unit: e.target.value })}
                        margin="normal"
                        placeholder="шт, кг, м, м² и т.д."
                    />
                    <TextField
                        fullWidth
                        label="Цена за единицу (руб)"
                        type="number"
                        value={specificationForm.price}
                        onChange={(e) => setSpecificationForm({ ...specificationForm, price: e.target.value })}
                        margin="normal"
                        inputProps={{ min: 0, step: 0.01 }}
                    />
                    <TextField
                        fullWidth
                        label="Общая стоимость (руб)"
                        type="number"
                        value={specificationForm.totalPrice}
                        onChange={(e) => setSpecificationForm({ ...specificationForm, totalPrice: e.target.value })}
                        margin="normal"
                        inputProps={{ min: 0, step: 0.01 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseForms}>Отмена</Button>
                    <Button onClick={handleSaveSpecification} variant="contained" sx={{ fontSize: '14px' }}>
                        {editingSpecification ? 'Сохранить' : 'Создать'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Диалог удаления спецификации */}
            <Dialog
                open={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                hideBackdrop={true}
                disablePortal={true}
                disableScrollLock={true}
                keepMounted={false}
                disableEnforceFocus={true}
                disableAutoFocus={true}
                disableEscapeKeyDown={true}
            >
                <DialogTitle>Удалить позицию</DialogTitle>
                <DialogContent>
                    <Typography>
                        Вы уверены, что хотите удалить позицию "{deletingSpecification?.name}"?
                        Это действие нельзя отменить.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDeleteDialog(false)}>Отмена</Button>
                    <Button onClick={confirmDeleteSpecification} color="error" variant="contained">
                        Удалить
                    </Button>
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
                                    Сопоставьте колонки из Excel файла с полями спецификации:
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
                                                            <MenuItem value="quantity" sx={{ fontSize: '12px' }}>Кол-во</MenuItem>
                                                            <MenuItem value="unit" sx={{ fontSize: '12px' }}>Ед.</MenuItem>
                                                            <MenuItem value="price" sx={{ fontSize: '12px' }}>Цена за ед. (руб)</MenuItem>
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
                                                        padding: '2px 4px !important',
                                                        whiteSpace: 'normal',
                                                        border: '2px solid #333',
                                                        borderTop: '1px solid #e0e0e0',
                                                        borderLeft: cellIndex === 0 ? '2px solid #333' : '1px solid #e0e0e0',
                                                        borderRight: cellIndex === row.length - 1 ? '2px solid #333' : '1px solid #e0e0e0',
                                                        borderBottom: rowIndex === 2 ? '2px solid #333' : '1px solid #e0e0e0'
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
                    Предварительный просмотр импорта спецификации
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Всего позиций: {importStats.total} |
                        Найдено в номенклатуре: {importStats.existing} |
                        Не найдено в номенклатуре: {importStats.new}
                    </Typography>
                    {importStats.new > 0 && (
                        <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                            ⚠️ Позиции, не найденные в номенклатуре, НЕ будут добавлены в спецификацию
                        </Typography>
                    )}
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
                                        <TableCell sx={{ fontWeight: 'bold' }}>Количество</TableCell>
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
                                            <TableCell>{item.quantity}</TableCell>
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
                            ✅ Зеленые позиции будут добавлены в спецификацию (найдены в номенклатуре)<br />
                            ⚠️ Желтые позиции НЕ будут добавлены в спецификацию (не найдены в номенклатуре)
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button onClick={() => setShowPreviewDialog(false)}>
                            Отмена
                        </Button>
                        <Button
                            onClick={importFromExcel}
                            variant="contained"
                            color="primary"
                            disabled={importStats.existing === 0}
                        >
                            Добавить в спецификацию ({importStats.existing})
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SpecificationDetail;
