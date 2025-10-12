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
    MenuItem
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import VolumeButton from './VolumeButton';

interface Specification {
    id: string;
    designation?: string;
    name: string;
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
}

interface SpecificationsPageProps {
    productId: string;
    productName: string;
    onBack: () => void;
    canEdit?: () => boolean;
    canCreate?: () => boolean;
    canDelete?: () => boolean;
}

const SpecificationDetail: React.FC<SpecificationsPageProps> = ({
    productId,
    productName,
    onBack,
    canEdit = () => true,
    canCreate = () => true,
    canDelete = () => true
}) => {
    const [specifications, setSpecifications] = useState<Specification[]>([]);

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
    const [specificationForm, setSpecificationForm] = useState({
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

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/product-specifications/${productId}/specifications`, {
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

    useEffect(() => {
        fetchSpecifications();
    }, [productId]);

    const handleOpenCreateForm = () => {
        setSpecificationForm({
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
        setShowCreateForm(true);
    };

    const handleOpenEditForm = (specification: Specification) => {
        setEditingSpecification(specification);
        setSpecificationForm({
            designation: specification.designation || '',
            name: specification.name,
            article: specification.article || '',
            code1c: specification.code1c || '',
            group: specification.group || '',
            manufacturer: specification.manufacturer || '',
            description: specification.description || '',
            quantity: specification.quantity,
            unit: specification.unit || '',
            price: specification.price?.toString() || '',
            totalPrice: specification.totalPrice?.toString() || ''
        });
        setShowEditForm(true);
    };

    const handleCloseForms = () => {
        setShowCreateForm(false);
        setShowEditForm(false);
        setEditingSpecification(null);
        setSpecificationForm({
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

            const data = {
                designation: specificationForm.designation || undefined,
                name: specificationForm.name,
                description: specificationForm.description || undefined,
                quantity: specificationForm.quantity,
                unit: specificationForm.unit || undefined,
                price: specificationForm.price ? parseFloat(specificationForm.price) : undefined,
                totalPrice: specificationForm.totalPrice ? parseFloat(specificationForm.totalPrice) : undefined
            };

            const url = editingSpecification
                ? `${import.meta.env.VITE_API_BASE_URL}/specifications/${editingSpecification.id}`
                : `${import.meta.env.VITE_API_BASE_URL}/product-specifications/${productId}/specifications`;

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

    const importFromExcel = async () => {
        try {
            setLoading(true);
            setError('');

            // Пропускаем заголовок (первую строку)
            const rows = excelData.slice(1);

            let successCount = 0;
            let errorCount = 0;

            // Импортируем каждую строку
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
                        errorCount++;
                        continue;
                    }

                    // Создаем позицию спецификации
                    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/product-specifications/${productId}/specifications`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(specificationData)
                    });

                    if (response.ok) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    errorCount++;
                }
            }

            // Обновляем список спецификаций
            await fetchSpecifications();

            // Закрываем диалог сопоставления
            setShowColumnMapping(false);

            // Показываем результат
            if (successCount > 0 && errorCount === 0) {
                alert(`Успешно импортировано ${successCount} позиций`);
            } else if (successCount > 0 && errorCount > 0) {
                alert(`Импортировано ${successCount} позиций, ошибок: ${errorCount}`);
            } else {
                alert(`Ошибка импорта. Не удалось импортировать ни одной позиции.`);
            }

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
                                <TableCell sx={{ p: 0.5, textAlign: 'center' }}>{specification.designation || ''}</TableCell>
                                <TableCell sx={{ p: 0.5 }}>{specification.name}</TableCell>
                                <TableCell sx={{ p: 0.5, textAlign: 'center' }}>{specification.article || '-'}</TableCell>
                                <TableCell sx={{ p: 0.5, textAlign: 'center' }}>{specification.code1c || '-'}</TableCell>
                                <TableCell sx={{ p: 0.5, textAlign: 'center' }}>{specification.group || '-'}</TableCell>
                                <TableCell sx={{ p: 0.5, textAlign: 'center' }}>{specification.manufacturer || '-'}</TableCell>
                                <TableCell sx={{ p: 0.5 }}>{specification.description || '-'}</TableCell>
                                <TableCell sx={{ p: 0.5, textAlign: 'center' }}>{specification.quantity}</TableCell>
                                <TableCell sx={{ p: 0.5, textAlign: 'center' }}>{specification.unit || '-'}</TableCell>
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
                                        onClick={importFromExcel}
                                        variant="contained"
                                        disabled={!Object.values(columnMapping).includes('name')}
                                    >
                                        Импортировать
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
                                    '& .MuiTableBody-root .MuiTableCell-root:nth-child(2)': {
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
        </Box>
    );
};

export default SpecificationDetail;
