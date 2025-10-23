import React, { useState, useEffect } from 'react';
import '../styles/buttons.css';
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
    Checkbox,
    FormControlLabel
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

    // Состояние для "Окна выбора номенклатуры" - диалога замены позиций в спецификации
    const [editingCell, setEditingCell] = useState<string | null>(null); // ID редактируемой ячейки (null = окно закрыто)
    const [cellSearchQuery, setCellSearchQuery] = useState(''); // Текст поиска в окне выбора номенклатуры
    const [cellFilteredItems, setCellFilteredItems] = useState<any[]>([]); // Отфильтрованные элементы номенклатуры для отображения
    const [windowPosition, setWindowPosition] = useState({ top: 0, left: 0 }); // Позиция окна выбора номенклатуры

    // Состояние для inline редактирования количества
    const [editingQuantity, setEditingQuantity] = useState<string | null>(null);
    const [quantityValue, setQuantityValue] = useState<string>('');

    // Состояние для inline редактирования цены за единицу
    const [editingPrice, setEditingPrice] = useState<string | null>(null);
    const [priceValue, setPriceValue] = useState<string>('');

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
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [importStats, setImportStats] = useState({ existing: 0, new: 0, total: 0, skipped: 0 });
    const [showExcelImportDialog, setShowExcelImportDialog] = useState(false);
    const [importSettings, setImportSettings] = useState({
        updateMatched: false,
        createNew: true,
        group: ''
    });

    // Функция для пересчета статистики импорта при изменении настроек
    const recalculateImportStats = (settings: typeof importSettings) => {
        const total = previewData.length;
        const existing = previewData.filter(item => item.matched).length;
        const newItems = total - existing;

        let updated = 0;
        let created = 0;
        let skipped = 0;

        if (settings.updateMatched) {
            updated = existing;
        } else {
            skipped += existing;
        }

        if (settings.createNew) {
            created = newItems;
        } else {
            skipped += newItems;
        }

        setImportStats({
            existing: updated,
            new: created,
            total: total,
            skipped: skipped
        });
    };


    // Функции для inline редактирования количества
    const handleQuantityClick = (specificationId: string, currentQuantity: number) => {
        if (canEdit()) {
            setEditingQuantity(specificationId);
            setQuantityValue(currentQuantity.toString());
        }
    };

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuantityValue(e.target.value);
    };

    const handleQuantitySave = async (specificationId: string) => {
        if (!canEdit()) {
            console.log('Нет прав на редактирование');
            setEditingQuantity(null);
            return;
        }

        const newQuantity = parseFloat(quantityValue);
        if (isNaN(newQuantity) || newQuantity < 0) {
            console.log('Некорректное значение количества:', quantityValue);
            setEditingQuantity(null);
            return;
        }

        console.log('Сохранение количества:', newQuantity, 'для спецификации:', specificationId);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/specifications/${specificationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ quantity: newQuantity })
            });

            console.log('Ответ сервера:', response.status);

            if (response.ok) {
                // Обновляем локальное состояние
                setSpecifications(prev => prev.map(spec =>
                    spec.id === specificationId
                        ? { ...spec, quantity: newQuantity, totalPrice: newQuantity * (spec.price || 0) }
                        : spec
                ));
                console.log('Количество успешно обновлено');
            } else {
                console.error('Ошибка сервера:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Ошибка обновления количества:', error);
        }

        setEditingQuantity(null);
    };

    const handleQuantityCancel = () => {
        setEditingQuantity(null);
        setQuantityValue('');
    };

    // Функции для inline редактирования цены за единицу
    const handlePriceClick = (specificationId: string, currentPrice: number) => {
        if (canEdit()) {
            setEditingPrice(specificationId);
            setPriceValue(currentPrice.toString());
        }
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPriceValue(e.target.value);
    };

    const handlePriceSave = async (specificationId: string) => {
        if (!canEdit()) {
            console.log('Нет прав на редактирование');
            setEditingPrice(null);
            return;
        }

        const newPrice = parseFloat(priceValue);
        if (isNaN(newPrice) || newPrice < 0) {
            console.log('Некорректное значение цены:', priceValue);
            setEditingPrice(null);
            return;
        }

        try {
            const response = await fetch(`http://localhost:4000/specifications/${specificationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    price: newPrice
                })
            });

            if (response.ok) {
                const updatedSpecification = await response.json();
                setSpecifications(prev => prev.map(spec =>
                    spec.id === specificationId ? {
                        ...spec,
                        price: updatedSpecification.price,
                        totalPrice: updatedSpecification.price * spec.quantity // Пересчитываем сумму: цена * количество
                    } : spec
                ));
                console.log('Цена обновлена:', updatedSpecification);
            } else {
                console.error('Ошибка обновления цены');
            }
        } catch (error) {
            console.error('Ошибка обновления цены:', error);
        }

        setEditingPrice(null);
    };

    const handlePriceCancel = () => {
        setEditingPrice(null);
        setPriceValue('');
    };

    const handlePriceKeyDown = (e: React.KeyboardEvent, specificationId: string) => {
        if (e.key === 'Enter') {
            handlePriceSave(specificationId);
        } else if (e.key === 'Escape') {
            handlePriceCancel();
        }
    };

    const handleQuantityKeyDown = (e: React.KeyboardEvent, specificationId: string) => {
        if (e.key === 'Enter') {
            handleQuantitySave(specificationId);
        } else if (e.key === 'Escape') {
            handleQuantityCancel();
        }
    };

    // Загружаем сохраненные ширины колонок из localStorage
    const getInitialColumnWidths = () => {
        try {
            const saved = localStorage.getItem('specification-column-widths');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Ошибка загрузки сохраненных ширин колонок:', error);
        }
        return {
            number: 40,
            name: 200,
            article: 100,
            quantity: 80,
            unit: 80,
            price: 100,
            total: 100
        };
    };

    const [columnWidths, setColumnWidths] = useState(getInitialColumnWidths);

    // Маппинг колонок для правильного изменения размера
    const columnOrder = ['number', 'name', 'article', 'quantity', 'unit', 'price', 'total'];

    // Функция для изменения ширины колонки
    const handleColumnResize = (columnKey: string, newWidth: number) => {
        // При захвате правой границы ячейки изменяем размер колонки слева
        const currentIndex = columnOrder.indexOf(columnKey);
        const targetColumn = currentIndex > 0 ? columnOrder[currentIndex - 1] : columnKey;

        const newWidths = {
            ...columnWidths,
            [targetColumn]: Math.max(50, newWidth) // Минимальная ширина 50px
        };

        // Проверяем, что суммарная ширина не превышает контейнер
        const totalWidth = Object.values(newWidths).reduce((sum: number, width: unknown) => sum + (width as number), 0);
        const containerWidth = 1200; // Примерная ширина контейнера

        if (totalWidth <= containerWidth) {
            setColumnWidths(newWidths);

            // Сохраняем в localStorage
            try {
                localStorage.setItem('specification-column-widths', JSON.stringify(newWidths));
            } catch (error) {
                console.warn('Ошибка сохранения ширин колонок:', error);
            }
        }
    };

    // Обработчики для изменения размера колонок
    const [isResizing, setIsResizing] = useState<string | null>(null);
    const [startX, setStartX] = useState(0);
    const [startWidth, setStartWidth] = useState(0);

    const handleMouseDown = (e: React.MouseEvent, columnKey: string) => {
        e.preventDefault();
        setIsResizing(columnKey);
        setStartX(e.clientX);

        // При захвате правой границы ячейки используем ширину колонки слева
        const currentIndex = columnOrder.indexOf(columnKey);
        const targetColumn = currentIndex > 0 ? columnOrder[currentIndex - 1] : columnKey;
        setStartWidth(columnWidths[targetColumn as keyof typeof columnWidths]);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isResizing) {
            const newWidth = startWidth + (e.clientX - startX);
            handleColumnResize(isResizing, newWidth);
        }
    };

    const handleMouseUp = () => {
        setIsResizing(null);
    };

    // Добавляем обработчики событий мыши
    React.useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isResizing, startX, startWidth]);
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
                // После парсинга НЕ открываем диалог - он откроется только после анализа
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
            setShowExcelImportDialog(true); // Открываем окно сразу при начале анализа

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
                total: analyzedData.length,
                skipped: 0
            });

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

            // Закрываем диалог импорта Excel
            setShowExcelImportDialog(false);

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

    // Функции для работы с "Окном выбора номенклатуры" - диалогом замены позиций
    const handleReplaceNomenclatureItem = async (specification: Specification, event: React.MouseEvent) => {
        try {
            // Сохраняем текущую позицию для замены в состоянии
            setEditingSpecification(specification);

            // Вычисляем позицию окна относительно ячейки
            const rect = event.currentTarget.getBoundingClientRect();
            setWindowPosition({
                top: rect.bottom + window.scrollY + 10, // 10px отступ от ячейки
                left: rect.left + window.scrollX // Левый край ячейки
            });

            // Активируем режим редактирования ячейки - открываем "Окно выбора номенклатуры"
            setEditingCell(specification.id);

            // Очищаем предыдущие результаты поиска и текст
            setCellFilteredItems([]);
            setCellSearchQuery('');

            // Загружаем полный список номенклатуры для поиска и фильтрации (асинхронно)
            await fetchNomenclature();

            console.log('Окно выбора номенклатуры открыто:', {
                editingCell: specification.id,
                windowPosition,
                allNomenclatureItems: allNomenclatureItems.length
            });
        } catch (error) {
            console.error('Ошибка при открытии окна выбора номенклатуры:', error);
        }
    };

    // Обработчик изменения текста поиска в "Окне выбора номенклатуры"
    const handleCellSearchChange = (query: string) => {
        // Обновляем текст поиска в состоянии
        setCellSearchQuery(query);

        // Если поисковый запрос пустой - очищаем результаты
        if (!query.trim()) {
            setCellFilteredItems([]);
            return;
        }

        // Фильтруем номенклатуру по нескольким полям: название, артикул, код 1С, обозначение
        const filtered = allNomenclatureItems.filter(item => {
            const searchLower = query.toLowerCase();
            return (
                item.name?.toLowerCase().includes(searchLower) ||
                item.article?.toLowerCase().includes(searchLower) ||
                item.code1c?.toLowerCase().includes(searchLower) ||
                item.designation?.toLowerCase().includes(searchLower)
            );
        });

        // Обновляем отфильтрованные элементы для отображения в "Окне выбора номенклатуры"
        setCellFilteredItems(filtered);
    };

    // Обработчик выбора номенклатуры в "Окне выбора номенклатуры" - заменяет позицию в спецификации
    const handleSelectCellNomenclatureItem = async (item: any) => {
        // Проверяем, что есть редактируемая спецификация
        if (!editingSpecification) return;

        try {
            // Отправляем PUT запрос на API для замены номенклатуры в позиции
            const response = await fetch(`http://localhost:4000/specifications/${editingSpecification.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    nomenclatureItemId: item.id // Передаем ID выбранной номенклатуры
                })
            });

            if (!response.ok) {
                throw new Error('Ошибка обновления позиции');
            }

            // Получаем обновленную спецификацию с загруженными данными номенклатуры
            const updatedSpecification = await response.json();

            // Обновляем локальное состояние - заменяем старую позицию на новую
            setSpecifications(prev =>
                prev.map(spec =>
                    spec.id === editingSpecification.id
                        ? { ...spec, ...updatedSpecification } // Заменяем данными с сервера
                        : spec
                )
            );

            // Закрываем режим редактирования
            setEditingCell(null);
            setEditingSpecification(null);
            setCellSearchQuery('');
            setCellFilteredItems([]);

        } catch (error) {
            console.error('Ошибка обновления позиции:', error);
            setError('Ошибка при обновлении позиции');
        }
    };

    const handleCancelCellEdit = () => {
        setEditingCell(null);
        setEditingSpecification(null);
        setCellSearchQuery('');
        setCellFilteredItems([]);
    };

    const handleAddEmptyRow = () => {
        // Добавляем пустую строку в таблицу спецификации
        setSpecifications(prev => [...prev, {
            id: `temp-${Date.now()}`,
            designation: '',
            name: '',
            article: '',
            code1c: '',
            group: '',
            manufacturer: '',
            description: '',
            quantity: 1,
            unit: '',
            price: 0,
            totalPrice: 0,
            orderIndex: prev.length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            nomenclatureItem: undefined
        }]);
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
        <Box className="page-container" sx={{
            overflow: 'hidden',
            height: 'auto !important',
            maxHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Box className="page-header" sx={{ flexShrink: 0 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px' }}>
                    Спецификация: {productName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {canCreate() && (
                        <VolumeButton
                            variant="contained"
                            onClick={handleAddEmptyRow}
                            color="blue"
                        >
                            Добавить
                        </VolumeButton>
                    )}
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
                            color="purple"
                        >
                            Подбор
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
                <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }}>
                    {error}
                </Alert>
            )}


            <TableContainer
                component={Paper}
                sx={{
                    width: '100%',
                    flex: 1,
                    height: '600px !important',
                    maxHeight: '600px !important',
                    overflowY: editingCell ? 'hidden' : 'auto', // Блокируем прокрутку когда открыто окно выбора номенклатуры
                    overflowX: 'hidden', // Без горизонтальной прокрутки
                    border: '1px solid #ddd',
                    borderRadius: 1,
                    // Ограничиваем ширину таблицы
                    '& .MuiTable-root': {
                        width: '100%',
                        maxWidth: '100%',
                        tableLayout: 'fixed' // Фиксированная ширина колонок
                    },
                    '&::-webkit-scrollbar': {
                        width: '8px',
                        height: '0px' // Убираем горизонтальную прокрутку
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: '#f1f1f1',
                        borderRadius: '4px'
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#c1c1c1',
                        borderRadius: '4px',
                        '&:hover': {
                            backgroundColor: '#a8a8a8'
                        }
                    }
                }}
                onClick={handleCancelCellEdit}
            >
                <Table
                    stickyHeader
                    sx={{
                        '& .MuiTableCell-root': { borderRight: '1px solid #bdbdbd' },
                        '& .MuiTableHead-root .MuiTableCell-root': {
                            fontSize: '12px !important',
                            backgroundColor: '#f5f5f5 !important',
                            position: 'sticky',
                            top: 0,
                            zIndex: 1
                        },
                        '& .MuiTableBody-root .MuiTableCell-root': { fontSize: '12px !important' },
                        '& .MuiTableRow-root': { height: '30px !important' },
                        '& .MuiTableBody-root .MuiTableRow-root': { height: '30px !important' },
                        '& .MuiButtonBase-root-MuiIconButton-root': { padding: '0 !important' },
                        '& .MuiIconButton-root': { padding: '0 !important' },
                        tableLayout: 'fixed', // Фиксированная ширина колонок
                        width: '100%',
                        maxWidth: '100%', // Таблица не выезжает за контейнер
                        minWidth: '100%' // Минимальная ширина = ширина контейнера
                    }}>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell
                                sx={{
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    fontSize: '12px',
                                    width: `${columnWidths.number}px`,
                                    position: 'relative',
                                    cursor: 'col-resize',
                                    '&:hover': { backgroundColor: '#e0e0e0' }
                                }}
                                onMouseDown={(e) => handleMouseDown(e, 'number')}
                            >№</TableCell>
                            <TableCell
                                sx={{
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    fontSize: '12px',
                                    width: `${columnWidths.name}px`,
                                    position: 'relative',
                                    cursor: 'col-resize',
                                    '&:hover': { backgroundColor: '#e0e0e0' }
                                }}
                                onMouseDown={(e) => handleMouseDown(e, 'name')}
                            >Наименование</TableCell>
                            <TableCell
                                sx={{
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    fontSize: '12px',
                                    width: `${columnWidths.article}px`,
                                    position: 'relative',
                                    cursor: 'col-resize',
                                    '&:hover': { backgroundColor: '#e0e0e0' }
                                }}
                                onMouseDown={(e) => handleMouseDown(e, 'article')}
                            >Артикул</TableCell>
                            <TableCell
                                sx={{
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    fontSize: '12px',
                                    width: `${columnWidths.quantity}px`,
                                    position: 'relative',
                                    cursor: 'col-resize',
                                    '&:hover': { backgroundColor: '#e0e0e0' }
                                }}
                                onMouseDown={(e) => handleMouseDown(e, 'quantity')}
                            >Кол-во</TableCell>
                            <TableCell
                                sx={{
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    fontSize: '12px',
                                    width: `${columnWidths.unit}px`,
                                    position: 'relative',
                                    cursor: 'col-resize',
                                    '&:hover': { backgroundColor: '#e0e0e0' }
                                }}
                                onMouseDown={(e) => handleMouseDown(e, 'unit')}
                            >Ед. изм.</TableCell>
                            <TableCell
                                sx={{
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    fontSize: '12px',
                                    width: `${columnWidths.price}px`,
                                    position: 'relative',
                                    cursor: 'col-resize',
                                    '&:hover': { backgroundColor: '#e0e0e0' }
                                }}
                                onMouseDown={(e) => handleMouseDown(e, 'price')}
                            >Цена за ед.</TableCell>
                            <TableCell
                                sx={{
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    fontSize: '12px',
                                    width: `${columnWidths.total}px`,
                                    minWidth: '80px',
                                    position: 'relative',
                                    cursor: 'col-resize',
                                    '&:hover': { backgroundColor: '#e0e0e0' }
                                }}
                                onMouseDown={(e) => handleMouseDown(e, 'total')}
                            >Сумма</TableCell>
                            <TableCell sx={{
                                fontWeight: 'bold',
                                textAlign: 'center',
                                verticalAlign: 'middle', // Вертикальное центрирование
                                width: '40px',
                                fontSize: '12px',
                                p: 0.5,
                                whiteSpace: 'nowrap',
                                cursor: 'default' // Заблокированное изменение размера
                            }}>
                                <Delete
                                    fontSize="small"
                                    sx={{
                                        color: '#d32f2f' // Красный цвет как в ячейках
                                    }}
                                />
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {specifications.map((specification, index) => (
                            <TableRow
                                key={specification.id}
                                sx={{ height: '30px !important' }}
                            >
                                <TableCell sx={{ p: 0.5, textAlign: 'center', width: '40px' }}>{index + 1}</TableCell>
                                <TableCell sx={{
                                    p: 0.5,
                                    position: 'relative',
                                    wordWrap: 'break-word',
                                    whiteSpace: 'normal'
                                }}>
                                    {editingCell === specification.id ? (
                                        <Box
                                            className="nomenclature-selection-window"
                                            sx={{
                                                position: 'relative'
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <TextField
                                                fullWidth
                                                size="small"
                                                value={cellSearchQuery}
                                                onChange={(e) => handleCellSearchChange(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                placeholder="Поиск номенклатуры..."
                                                sx={{
                                                    '& .MuiInputBase-root': {
                                                        height: '24px !important', // Уменьшаем высоту TextField
                                                        fontSize: '12px !important',
                                                        minHeight: '24px !important' // Минимальная высота
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        fontSize: '12px !important',
                                                        padding: '2px 8px !important' // Уменьшаем padding
                                                    }
                                                }}
                                            />
                                            {editingCell === specification.id && (
                                                <Box
                                                    className="nomenclature-selection-window"
                                                    sx={{
                                                        position: 'fixed', // Fixed позиционирование для полной независимости от ячейки
                                                        top: `${windowPosition.top}px`, // Вычисленная позиция сверху
                                                        left: `${windowPosition.left}px`, // Вычисленная позиция слева
                                                        // right: 0, // Убираем привязку к правому краю
                                                        // width: '400px', // Убираем фиксированную ширину
                                                        minWidth: '300px', // Минимальная ширина для читаемости
                                                        maxWidth: '80vw', // Максимальная ширина = 80% от ширины экрана
                                                        zIndex: 1000,
                                                        backgroundColor: 'white',
                                                        border: '1px solid #ccc',
                                                        borderRadius: 1,
                                                        maxHeight: '200px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {/* Контейнер для прокрутки списка */}
                                                    <Box
                                                        sx={{
                                                            flex: 1,
                                                            overflow: 'auto',
                                                            maxHeight: '150px',
                                                            // Стили ползунка как у основной таблицы
                                                            '&::-webkit-scrollbar': {
                                                                width: '8px',
                                                                height: '0px' // Убираем горизонтальную прокрутку
                                                            },
                                                            '&::-webkit-scrollbar-track': {
                                                                backgroundColor: '#f1f1f1',
                                                                borderRadius: '4px'
                                                            },
                                                            '&::-webkit-scrollbar-thumb': {
                                                                backgroundColor: '#c1c1c1',
                                                                borderRadius: '4px',
                                                                '&:hover': {
                                                                    backgroundColor: '#a8a8a8'
                                                                }
                                                            }
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {/* Отфильтрованные элементы */}
                                                        {cellFilteredItems.length > 0 ? (
                                                            cellFilteredItems.slice(0, 10).map((item) => (
                                                                <Box
                                                                    key={item.id}
                                                                    onClick={() => handleSelectCellNomenclatureItem(item)}
                                                                    sx={{
                                                                        p: 1,
                                                                        cursor: 'pointer',
                                                                        borderBottom: '1px solid #f0f0f0',
                                                                        '&:hover': {
                                                                            backgroundColor: '#f5f5f5'
                                                                        },
                                                                        '&:last-child': {
                                                                            borderBottom: 'none'
                                                                        }
                                                                    }}
                                                                >
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            fontSize: '12px !important',
                                                                            fontWeight: 'normal !important',
                                                                            '&.MuiTypography-root': {
                                                                                fontSize: '12px !important',
                                                                                fontWeight: 'normal !important'
                                                                            },
                                                                            '&.MuiTypography-body2': {
                                                                                fontSize: '12px !important',
                                                                                fontWeight: 'normal !important'
                                                                            }
                                                                        }}
                                                                    >
                                                                        {item.name}
                                                                        {item.code1c && ` (${item.code1c})`}
                                                                    </Typography>
                                                                </Box>
                                                            ))
                                                        ) : (
                                                            <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                                                                <Typography variant="body2">
                                                                    Ничего не найдено
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Box>

                                                    {/* Кнопки внизу окна */}
                                                    <Box sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        borderTop: '1px solid #ccc',
                                                        position: 'sticky',
                                                        bottom: 0,
                                                        p: '4px 8px'
                                                    }}>
                                                        {/* Кнопка "Показать все" в стиле 1С - как ссылка */}
                                                        <Box
                                                            onClick={() => {
                                                                setCellFilteredItems(allNomenclatureItems);
                                                                setCellSearchQuery('');
                                                            }}
                                                            sx={{
                                                                p: '4px 8px',
                                                                cursor: 'pointer',
                                                                backgroundColor: 'transparent', // Прозрачный фон
                                                                border: 'none', // Убираем все границы
                                                                borderRadius: '0px', // Убираем скругления
                                                                fontFamily: 'Arial, sans-serif',
                                                                fontSize: '11px',
                                                                '&:hover': {
                                                                    backgroundColor: 'transparent' // Прозрачный фон при наведении
                                                                },
                                                                '&:active': {
                                                                    backgroundColor: 'transparent', // Прозрачный фон при нажатии
                                                                    border: 'none' // Убираем границы при нажатии
                                                                }
                                                            }}
                                                        >
                                                            <Typography variant="body2" sx={{
                                                                fontWeight: 'normal',
                                                                color: '#0000ff',
                                                                fontFamily: 'Arial, sans-serif',
                                                                fontSize: '11px',
                                                                textAlign: 'center',
                                                                textDecoration: 'underline',
                                                                '&:hover': {
                                                                    textDecoration: 'underline'
                                                                }
                                                            }}>
                                                                Показать все
                                                            </Typography>
                                                        </Box>

                                                        {/* Кнопка с плюсом в стиле 1С - небольшая прямоугольная */}
                                                        <Box
                                                            onClick={() => {
                                                                // TODO: Добавить функционал для новой кнопки
                                                                console.log('Кнопка с плюсом нажата');
                                                            }}
                                                            sx={{
                                                                width: '30px',
                                                                height: '20px',
                                                                p: '2px 4px',
                                                                cursor: 'pointer',
                                                                backgroundColor: '#f0f0f0',
                                                                border: '1px solid #808080',
                                                                fontFamily: 'Arial, sans-serif',
                                                                fontSize: '11px',
                                                                '&:hover': {
                                                                    backgroundColor: '#e8e8e8'
                                                                },
                                                                '&:active': {
                                                                    backgroundColor: '#d8d8d8',
                                                                    border: '1px solid #404040'
                                                                }
                                                            }}
                                                        >
                                                            <Typography variant="body2" sx={{
                                                                fontWeight: 'bold',
                                                                color: '#000',
                                                                fontFamily: 'Arial, sans-serif',
                                                                fontSize: '12px',
                                                                textAlign: 'center',
                                                                lineHeight: 1
                                                            }}>
                                                                +
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            )}
                                        </Box>
                                    ) : (
                                        <Box
                                            onDoubleClick={(e) => handleReplaceNomenclatureItem(specification, e)}
                                            sx={{
                                                cursor: canEdit() ? 'pointer' : 'default',
                                                '&:hover': canEdit() ? { backgroundColor: '#f5f5f5' } : {}
                                            }}
                                        >
                                            {specification.nomenclatureItem?.name || specification.name || '-'}
                                        </Box>
                                    )}
                                </TableCell>
                                <TableCell
                                    sx={{ p: 0.5, textAlign: 'center', wordWrap: 'break-word', whiteSpace: 'normal' }}
                                >{specification.nomenclatureItem?.article || specification.article || '-'}</TableCell>
                                <TableCell
                                    sx={{ p: 0.5, textAlign: 'center', cursor: canEdit() ? 'pointer' : 'default' }}
                                    onDoubleClick={() => handleQuantityClick(specification.id, specification.quantity)}
                                >
                                    {editingQuantity === specification.id ? (
                                        <input
                                            type="number"
                                            value={quantityValue}
                                            onChange={handleQuantityChange}
                                            onBlur={() => handleQuantitySave(specification.id)}
                                            onKeyDown={(e) => handleQuantityKeyDown(e, specification.id)}
                                            onFocus={(e) => e.target.select()}
                                            style={{
                                                width: '100%',
                                                border: 'none',
                                                outline: 'none',
                                                textAlign: 'center',
                                                fontSize: '12px',
                                                backgroundColor: 'transparent',
                                                // Убираем стрелки вверх/вниз
                                                MozAppearance: 'textfield',
                                                WebkitAppearance: 'none',
                                                appearance: 'none'
                                            }}
                                            autoFocus
                                        />
                                    ) : (
                                        specification.quantity
                                    )}
                                </TableCell>
                                <TableCell
                                    sx={{ p: 0.5, textAlign: 'center' }}
                                >
                                    {(specification.nomenclatureItem as any)?.unit?.name ||
                                        (specification.nomenclatureItem as any)?.unit?.code ||
                                        specification.unit || '-'}
                                </TableCell>
                                <TableCell
                                    sx={{ p: 0.5, textAlign: 'right', cursor: canEdit() ? 'pointer' : 'default' }}
                                    onDoubleClick={() => handlePriceClick(specification.id, specification.price || 0)}
                                >
                                    {editingPrice === specification.id ? (
                                        <input
                                            type="number"
                                            value={priceValue}
                                            onChange={handlePriceChange}
                                            onBlur={() => handlePriceSave(specification.id)}
                                            onKeyDown={(e) => handlePriceKeyDown(e, specification.id)}
                                            onFocus={(e) => e.target.select()}
                                            style={{
                                                width: '100%',
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent',
                                                textAlign: 'right',
                                                fontSize: '12px',
                                                fontFamily: 'inherit',
                                                // Убираем стрелки вверх/вниз
                                                MozAppearance: 'textfield',
                                                WebkitAppearance: 'none',
                                                appearance: 'none'
                                            }}
                                            autoFocus
                                        />
                                    ) : (
                                        formatCurrency(specification.price)
                                    )}
                                </TableCell>
                                <TableCell
                                    sx={{ p: 0.5, textAlign: 'right', minWidth: '80px' }}
                                >
                                    {formatCurrency(specification.totalPrice)}
                                </TableCell>
                                <TableCell sx={{
                                    textAlign: 'center',
                                    p: 0.5,
                                    width: '40px',
                                    cursor: 'default' // Заблокированное изменение размера
                                }}>
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

            {/* Общая сумма под таблицей */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                mt: 1,
                pr: 2 // Отступ справа для выравнивания с колонкой "Сумма"
            }}>
                <Typography variant="h6" sx={{
                    fontWeight: 'bold',
                    color: '#1976d2',
                    fontSize: '16px'
                }}>
                    Итого: {formatCurrency(specifications.reduce((sum, spec) => sum + (spec.totalPrice || 0), 0))}
                </Typography>
            </Box>

            {/* Диалог выбора номенклатуры */}
            <Dialog
                open={showNomenclatureDialog}
                onClose={() => { }} // Отключаем закрытие при клике вне диалога
                maxWidth="lg"
                fullWidth
                hideBackdrop={false}
                disablePortal={true}
                disableScrollLock={true}
                keepMounted={false}
                disableEnforceFocus={true}
                disableAutoFocus={true}
                disableEscapeKeyDown={true} // Отключаем закрытие по Escape
                BackdropProps={{
                    onClick: (e) => e.stopPropagation() // Предотвращаем закрытие при клике на backdrop
                }}
            >
                <DialogTitle
                    sx={{
                        backgroundColor: '#f5f5f5',
                        borderBottom: '1px solid #ddd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '8px' }}>📦</span>
                        Подбор номенклатуры
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {selectedItems.length} на сумму {getTotalSum().toLocaleString('ru-RU')} ₽
                    </Typography>
                </DialogTitle>

                <DialogContent
                    sx={{ p: 0, height: '600px', display: 'flex', flexDirection: 'column' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Верхняя панель с выбранными позициями */}
                    <Box
                        sx={{ p: 2, borderBottom: '1px solid #ddd', backgroundColor: '#fafafa' }}
                        onClick={(e) => e.stopPropagation()}
                    >
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
                    <Box
                        sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Левая колонка - список номенклатуры */}
                        <Box
                            sx={{ flex: 1, borderRight: '1px solid #ddd' }}
                            onClick={(e) => e.stopPropagation()}
                        >
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
                        <Box
                            sx={{ width: '250px', backgroundColor: '#f9f9f9' }}
                            onClick={(e) => e.stopPropagation()}
                        >
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

                <DialogActions
                    sx={{ backgroundColor: '#f5f5f5', borderTop: '1px solid #ddd' }}
                    onClick={(e) => e.stopPropagation()}
                >
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
                        autoFocus
                        fullWidth
                        label="Наименование"
                        value={specificationForm.name}
                        onChange={(e) => setSpecificationForm({ ...specificationForm, name: e.target.value })}
                        margin="normal"
                        required
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Количество"
                            type="number"
                            value={specificationForm.quantity}
                            onChange={(e) => setSpecificationForm({ ...specificationForm, quantity: parseInt(e.target.value) || 1 })}
                            margin="normal"
                            required
                            inputProps={{ min: 1 }}
                            sx={{
                                '& .MuiInputBase-input': {
                                    textAlign: 'right'
                                }
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Единица измерения"
                            value={specificationForm.unit}
                            margin="normal"
                            InputProps={{ readOnly: true }}
                            sx={{
                                '& .MuiInputBase-input': {
                                    backgroundColor: '#f5f5f5',
                                    color: '#666'
                                }
                            }}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Цена за единицу (руб)"
                            type="number"
                            value={specificationForm.price ? parseFloat(specificationForm.price).toFixed(2) : ''}
                            onChange={(e) => setSpecificationForm({ ...specificationForm, price: e.target.value })}
                            margin="normal"
                            inputProps={{ min: 0, step: 0.01 }}
                            sx={{
                                '& .MuiInputBase-input': {
                                    textAlign: 'right'
                                }
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Сумма (руб)"
                            type="number"
                            value={(() => {
                                const quantity = Number(specificationForm.quantity) || 0;
                                const price = Number(specificationForm.price) || 0;
                                return (quantity * price).toFixed(2);
                            })()}
                            margin="normal"
                            InputProps={{ readOnly: true }}
                            sx={{
                                '& .MuiInputBase-input': {
                                    backgroundColor: '#f5f5f5',
                                    color: '#666',
                                    textAlign: 'right'
                                }
                            }}
                        />
                    </Box>
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


            {/* Диалог загрузки данных из Excel в стиле 1С */}
            <Dialog
                open={showExcelImportDialog}
                maxWidth="md"
                fullWidth
                hideBackdrop={true}
                disablePortal={true}
                disableEscapeKeyDown={true}
                sx={{
                    '& .MuiDialog-paper': {
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                    }
                }}
            >
                <DialogTitle sx={{
                    backgroundColor: '#f5f5f5',
                    borderBottom: '1px solid #ddd',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <span style={{ fontSize: '20px' }}>📊</span>
                    Загрузка данных из Excel
                </DialogTitle>

                <DialogContent sx={{ p: 3 }}>
                    {/* Индикатор загрузки */}
                    {loading && (
                        <Box sx={{ mb: 2 }}>
                            <LinearProgress />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                                Анализ данных...
                            </Typography>
                        </Box>
                    )}

                    {/* Информационный блок */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 3,
                        p: 2,
                        backgroundColor: '#fff3cd',
                        borderRadius: 1,
                        border: '1px solid #ffeaa7'
                    }}>
                        <span style={{ fontSize: '16px' }}>ℹ️</span>
                        <Typography variant="body2" color="text.secondary">
                            Загрузка табличной части. Предварительный анализ и настройка.
                        </Typography>
                    </Box>

                    {/* Статистика импорта */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="body2">
                                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{importStats.total}</span> строки получено
                            </Typography>
                            <Button size="small" variant="text" sx={{ textTransform: 'none' }}>
                                показать строки...
                            </Button>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="body2">
                                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{importStats.existing}</span> из них сопоставлены{importSettings.updateMatched ? ' и будут обновлены' : ''}
                            </Typography>
                            <Button size="small" variant="text" sx={{ textTransform: 'none' }}>
                                показать строки...
                            </Button>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={importSettings.updateMatched}
                                        onChange={(e) => {
                                            const newSettings = {
                                                ...importSettings,
                                                updateMatched: e.target.checked
                                            };
                                            setImportSettings(newSettings);
                                            // Пересчитываем статистику при изменении настроек
                                            recalculateImportStats(newSettings);
                                        }}
                                    />
                                }
                                label="Обновлять сопоставленные элементы полученными данными"
                                sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={importSettings.createNew}
                                        onChange={(e) => {
                                            const newSettings = {
                                                ...importSettings,
                                                createNew: e.target.checked
                                            };
                                            setImportSettings(newSettings);
                                            // Пересчитываем статистику при изменении настроек
                                            recalculateImportStats(newSettings);
                                        }}
                                    />
                                }
                                label="Создавать новые элементы, если полученные данные не сопоставлены"
                                sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="body2">
                                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{importStats.new}</span> <span style={{ color: importSettings.createNew ? '#2e7d32' : '#d32f2f' }}>{importSettings.createNew ? 'строк будет создано' : 'строк будет пропущено'}</span>
                            </Typography>
                            <Button size="small" variant="text" sx={{ textTransform: 'none' }}>
                                показать строки...
                            </Button>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="body2">
                                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>0</span> строк, которые невозможно загрузить
                            </Typography>
                            <Button size="small" variant="text" sx={{ textTransform: 'none' }}>
                                строк...
                            </Button>
                        </Box>
                    </Box>

                </DialogContent>

                <DialogActions sx={{
                    backgroundColor: '#f5f5f5',
                    borderTop: '1px solid #ddd',
                    justifyContent: 'space-between',
                    p: 2
                }}>
                    <Button
                        onClick={() => {
                            setShowExcelImportDialog(false);
                            setShowColumnMapping(true);
                        }}
                        sx={{
                            backgroundColor: '#6c757d',
                            color: 'white',
                            '&:hover': { backgroundColor: '#5a6268' }
                        }}
                    >
                        ← Назад
                    </Button>
                    <Button
                        onClick={importFromExcel}
                        variant="contained"
                        sx={{
                            backgroundColor: '#ffc107',
                            color: 'black',
                            fontWeight: 'bold',
                            '&:hover': { backgroundColor: '#ffb300' }
                        }}
                    >
                        Загрузить данные в приложение
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SpecificationDetail;
