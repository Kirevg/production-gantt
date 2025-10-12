import React, { useState, useEffect, useCallback } from 'react';
import '../styles/buttons.css';

import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    LinearProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { Build as BuildIcon, Delete as DeleteIcon } from '@mui/icons-material';
import VolumeButton from './VolumeButton';



interface Product {
    id: string;
    serialNumber?: string;
    description?: string;
    quantity?: number;
    productSum?: number;
    version?: number;
    orderIndex?: number;
    createdAt: string;
    updatedAt: string;
    nomenclatureItem?: {
        id: string;
        name: string;
        designation?: string;
        article?: string;
        code1c?: string;
        manufacturer?: string;
        unit?: string;
        price?: number;
    };
    workStages?: Subtask[];
}

interface Subtask {
    id: string;
    name: string;
    sum: string;
    hours?: string;
    startDate: string;
    endDate: string;
    duration: number;
    progress: number;
    workType?: {
        id: string;
        name: string;
    };
    assignee?: {
        id: string;
        name: string;
    };
}


interface ProjectCardProps {
    projectId: string;
    projectName: string;
    onClose: () => void;
    onOpenSpecifications: (productId: string, productName: string) => void;
    canEdit: () => boolean;
    canCreate: () => boolean;
    canDelete: () => boolean;
    isNew?: boolean;
    user?: any;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ projectId, projectName, onClose, onOpenSpecifications, canEdit, canCreate, canDelete, isNew = false, user }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [openProductDialog, setOpenProductDialog] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [projectData, setProjectData] = useState({
        name: projectName,
        managerId: '',
        status: 'Planned' as 'Planned' | 'InProgress' | 'Done' | 'HasProblems'
    });
    const [managers, setManagers] = useState<any[]>([]);
    const [productForm, setProductForm] = useState({
        nomenclatureItemId: '',
        serialNumber: '',
        quantity: 1,
        link: ''
    });
    const [nomenclatureItems, setNomenclatureItems] = useState<any[]>([]);
    const [loadingNomenclature, setLoadingNomenclature] = useState(false);


    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    };

    const calculateStagesSum = (workStages: Subtask[]): number => {
        return workStages.reduce((sum, workStage) => {
            const workStageSum = parseFloat(workStage.sum) || 0;
            return sum + workStageSum;
        }, 0);
    };

    const getEarliestStartDate = (workStages: Subtask[]): string | null => {
        const datesWithValues = workStages
            .map(workStage => workStage.startDate)
            .filter(date => date && date.trim() !== '')
            .map(date => new Date(date))
            .filter(date => !isNaN(date.getTime()));

        if (datesWithValues.length === 0) {
            return null;
        }

        const earliestDate = new Date(Math.min(...datesWithValues.map(date => date.getTime())));
        return earliestDate.toISOString().split('T')[0];
    };

    const getLatestEndDate = (workStages: Subtask[]): string | null => {
        const datesWithValues = workStages
            .map(workStage => workStage.endDate)
            .filter(date => date && date.trim() !== '')
            .map(date => new Date(date))
            .filter(date => !isNaN(date.getTime()));

        if (datesWithValues.length === 0) {
            return null;
        }

        const latestDate = new Date(Math.max(...datesWithValues.map(date => date.getTime())));
        return latestDate.toISOString().split('T')[0];
    };

    const formatLinkDate = (createdAt: string, updatedAt: string): string => {
        const created = new Date(createdAt);
        const updated = new Date(updatedAt);

        // Если ссылка была обновлена после создания (разница больше 1 секунды)
        if (updated.getTime() - created.getTime() > 1000) {
            return updated.toLocaleDateString('ru-RU');
        } else {
            return created.toLocaleDateString('ru-RU');
        }
    };

    const fetchWorkStages = useCallback(async (taskId: string): Promise<Subtask[]> => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return [];
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/products/${taskId}/work-stages`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.map((subtask: any) => ({
                id: subtask.id,
                name: subtask.name,
                sum: subtask.sum,
                hours: subtask.hours,
                startDate: subtask.startDate,
                endDate: subtask.endDate,
                duration: subtask.duration,
                progress: subtask.progress,
                workType: subtask.workType,
                assignee: subtask.assignee
            }));
        } catch (error) {
            console.error('Ошибка загрузки подзадач:', error);
            return [];
        }
    }, []);

    // Загрузка номенклатуры (только типа Product)
    const fetchNomenclature = useCallback(async () => {
        try {
            setLoadingNomenclature(true);
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/items?type=Product`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setNomenclatureItems(data);
        } catch (error) {
            console.error('Ошибка загрузки номенклатуры:', error);
        } finally {
            setLoadingNomenclature(false);
        }
    }, []);

    const fetchProjectData = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setProjectData({
                    name: data.name,
                    managerId: data.projectManager?.id || '',
                    status: data.status || 'Planned'
                });
            }
        } catch (error) {
            console.error('Ошибка загрузки данных проекта:', error);
        }
    }, [projectId]);

    const fetchManagers = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/persons?isProjectManager=true`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setManagers(data);
            }
        } catch (error) {
            console.error('Ошибка загрузки руководителей:', error);
        }
    }, []);

    const fetchProducts = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/products`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API: Products fetched:', data);
            // Преобразуем изделия для отображения и загружаем этапы работ
            const productsData = await Promise.all(data.map(async (product: any) => {
                const workStages = await fetchWorkStages(product.id);
                return {
                    id: product.id,
                    name: product.nomenclatureItem?.name || 'Без названия',
                    serialNumber: product.serialNumber,
                    description: product.description,
                    nomenclatureItem: product.nomenclatureItem,
                    quantity: product.quantity,
                    startDate: product.startDate,
                    endDate: product.endDate,
                    progress: product.progress,
                    productSum: product.productSum,
                    version: product.version,
                    orderIndex: product.orderIndex,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt,
                    workStages: workStages
                };
            }));
            setProducts(productsData);
        } catch (error) {
            console.error('Ошибка загрузки изделий:', error);
        } finally {
            setLoading(false);
        }
    }, [projectId]);


    useEffect(() => {
        if (!isNew) {
            fetchProjectData();
            fetchProducts();
        }
        fetchManagers();
        fetchNomenclature();
    }, [projectId, isNew, fetchProjectData, fetchManagers, fetchProducts, fetchNomenclature]);

    const handleUpdateProject = async () => {
        try {
            const token = localStorage.getItem('token');

            if (isNew) {
                // Создание нового проекта
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: projectData.name,
                        projectManagerId: projectData.managerId || null,
                        status: projectData.status,
                        ownerId: user?.id || ''
                    })
                });

                if (response.ok) {
                    alert('Проект успешно создан');
                    onClose(); // Закрываем карточку создания
                } else {
                    alert('Ошибка при создании проекта');
                }
            } else {
                // Обновление существующего проекта
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: projectData.name,
                        projectManagerId: projectData.managerId || null,
                        status: projectData.status
                    })
                });

                if (response.ok) {
                    alert('Проект успешно обновлен');
                    // Данные уже актуальны, не нужно перезагружать
                } else {
                    alert('Ошибка при обновлении проекта');
                }
            }
        } catch (error) {
            console.error('Ошибка обновления проекта:', error);
            alert('Ошибка при обновлении проекта');
        }
    };

    const handleAddEmptyProduct = () => {
        // Создаем временную пустую строку
        const emptyProduct: Product = {
            id: `temp-${Date.now()}`, // Временный ID
            serialNumber: '',
            description: '',
            nomenclatureItem: undefined,
            quantity: 1,
            version: 0,
            orderIndex: products.length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Добавляем в конец списка
        setProducts([...products, emptyProduct]);
    };


    const handleCloseProductDialog = () => {
        setOpenProductDialog(false);
        setEditingProduct(null);
        setProductForm({
            nomenclatureItemId: '',
            serialNumber: '',
            quantity: 1,
            link: ''
        });
    };

    const handleSaveProduct = async () => {
        try {
            // Валидация
            if (!productForm.nomenclatureItemId) {
                alert('Пожалуйста, выберите элемент номенклатуры');
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            const url = editingProduct
                ? `${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/products/${editingProduct.id}`
                : `${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/products`;

            const method = editingProduct ? 'PUT' : 'POST';

            const requestData: {
                nomenclatureItemId: string;
                serialNumber?: string;
                description?: string;
                quantity: number;
                version?: number;
                orderIndex?: number;
                productSum?: number;
            } = {
                nomenclatureItemId: productForm.nomenclatureItemId,
                serialNumber: productForm.serialNumber || undefined,
                description: productForm.link || undefined,
                quantity: productForm.quantity
            };

            if (editingProduct) {
                // Для редактирования добавляем только version
                requestData.version = editingProduct.version;
            } else {
                // Для создания добавляем orderIndex
                requestData.orderIndex = 0;
            }

            console.log('Sending data:', requestData);

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('API Error:', errorData);
                console.error('Response status:', response.status);
                console.error('Request data:', requestData);
                console.error('Error details:', JSON.stringify(errorData.details, null, 2));

                // Если конфликт версий, обновляем данные и повторяем запрос
                if (response.status === 409 && errorData.error === 'Version conflict') {
                    console.log('Version conflict detected, refreshing data...');
                    await fetchProducts();
                    // Закрываем диалог и показываем сообщение пользователю
                    handleCloseProductDialog();
                    alert('Данные были изменены другим пользователем. Пожалуйста, обновите страницу и попробуйте снова.');
                    return;
                }

                throw new Error(`HTTP error! status: ${response.status}, details: ${JSON.stringify(errorData)}`);
            }

            await fetchProducts();
            handleCloseProductDialog();
        } catch (error) {
            console.error('Ошибка сохранения изделия:', error);
            const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
            alert(`Произошла ошибка при сохранении: ${errorMessage}\n\nПроверьте консоль браузера для подробностей.`);
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!window.confirm('Вы уверены, что хотите удалить это изделие?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchProducts();
        } catch (error) {
            console.error('Ошибка удаления изделия:', error);
        }
    };


    // Компонент для перетаскиваемой строки таблицы
    function ProductTableRow({ product, index }: { product: Product; index: number }) {

        const workStages = product.workStages || [];

        return (
            <TableRow
                onDoubleClick={() => !loading && onOpenSpecifications(product.id, product.nomenclatureItem?.name || '')}
                sx={{
                    height: '35px',
                    borderTop: '2px solid #e0e0e0',
                    '&:hover': {
                        backgroundColor: loading ? 'transparent' : '#f5f5f5',
                    },
                }}
            >
                <TableCell
                    sx={{
                        width: '40px',
                        minWidth: '40px',
                        maxWidth: '40px',
                        py: 0.5,
                        textAlign: 'center'
                    }}
                >
                    <Typography sx={{ fontSize: '18px', fontWeight: 900 }}>
                        ↑↓
                    </Typography>
                </TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center', width: '40px' }}>{index + 1}</TableCell>
                <TableCell sx={{ py: 0.5, minWidth: '250px' }}>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {product.nomenclatureItem?.name || 'Без названия'}
                    </Typography>
                </TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
                    <Typography variant="body1">
                        {product.serialNumber || '-'}
                    </Typography>
                </TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <VolumeButton
                        variant="contained"
                        size="small"
                        onClick={() => product.description && window.open(product.description, '_blank', 'noopener,noreferrer')}
                        color="blue"
                        sx={{
                            fontSize: '14px',
                            height: '36px',
                            minWidth: 'auto',
                            textTransform: 'none'
                        }}
                    >
                        {product.description ? formatLinkDate(product.createdAt, product.updatedAt) : 'Нет ссылки'}
                    </VolumeButton>
                </TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {calculateStagesSum(workStages).toLocaleString('ru-RU', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}
                </TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {getEarliestStartDate(workStages) ? formatDate(getEarliestStartDate(workStages)!) : '-'}
                </TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {getLatestEndDate(workStages) ? formatDate(getLatestEndDate(workStages)!) : '-'}
                </TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center', width: '60px' }}>
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', alignItems: 'center' }}>
                        {canDelete() && (
                            <IconButton
                                size="small"
                                onClick={() => handleDeleteProduct(product.id)}
                                color="error"
                                title="Удалить изделие"
                                sx={{ minWidth: 'auto', padding: '4px' }}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
                </TableCell>
            </TableRow>
        );
    }


    return (
        <Box className="page-container">
            {/* Заголовок */}
            <Box className="page-header">
                <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px' }}>
                    {isNew ? 'Карточка проекта (создание)' : 'Карточка проекта'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <VolumeButton
                        variant="contained"
                        onClick={onClose}
                        color="orange"
                    >
                        Назад
                    </VolumeButton>
                </Box>
            </Box>

            {/* Поля редактирования проекта */}
            {canEdit() && (
                <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#fafafa' }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                            fullWidth
                            label="Название проекта"
                            value={projectData.name}
                            onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                            size="small"
                            sx={{ flex: 2 }}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            fullWidth
                            select
                            label="Руководитель проекта"
                            value={projectData.managerId}
                            onChange={(e) => setProjectData({ ...projectData, managerId: e.target.value })}
                            size="small"
                            SelectProps={{ native: true }}
                            sx={{ flex: 2 }}
                            InputLabelProps={{ shrink: true }}
                        >
                            <option value="">Не назначен</option>
                            {managers.map((manager) => (
                                <option key={manager.id} value={manager.id}>
                                    {manager.lastName} {manager.firstName} {manager.middleName || ''}
                                </option>
                            ))}
                        </TextField>
                        <TextField
                            fullWidth
                            select
                            label="Статус"
                            value={projectData.status}
                            onChange={(e) => setProjectData({ ...projectData, status: e.target.value as 'Planned' | 'InProgress' | 'Done' | 'HasProblems' })}
                            size="small"
                            SelectProps={{ native: true }}
                            sx={{ flex: 1 }}
                            InputLabelProps={{ shrink: true }}
                        >
                            <option value="Planned">Запланирован</option>
                            <option value="InProgress">В работе</option>
                            <option value="Done">Завершен</option>
                            <option value="HasProblems">Есть проблемы</option>
                        </TextField>
                        <VolumeButton
                            variant="contained"
                            onClick={handleUpdateProject}
                            color="green"
                            sx={{ height: '40px' }}
                        >
                            Сохранить
                        </VolumeButton>
                    </Box>
                </Box>
            )}


            {/* Заголовок и кнопка добавления изделия */}
            {!isNew && (
                <Box className="page-header" sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '20px', mb: 0 }}>
                        Состав проекта
                    </Typography>
                    {canCreate() && (
                        <VolumeButton
                            variant="contained"
                            onClick={handleAddEmptyProduct}
                            color="blue"
                        >
                            Добавить
                        </VolumeButton>
                    )}
                </Box>
            )}

            {/* Таблица состава проекта */}
            {loading ? (
                <LinearProgress />
            ) : (
                <>
                    <TableContainer component={Paper}>
                        <Table sx={{
                            '& .MuiTableCell-root': {
                                borderRight: '1px solid #e0e0e0',
                                padding: '4px !important'
                            }
                        }}>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '40px', fontSize: '12px' }}>
                                        ↑↓
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '40px', fontSize: '12px' }}>№</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', minWidth: '250px', fontSize: '12px' }}>Изделие</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Сер. номер</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Ссылка</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Сумма</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Старт</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Финиш</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '60px' }}>
                                        <DeleteIcon fontSize="small" sx={{ color: 'red' }} />
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {products.map((product, index) => (
                                    <ProductTableRow key={product.id} product={product} index={index} />
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {products.length === 0 && (
                        <Card sx={{ mt: 2 }}>
                            <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                <BuildIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    Нет изделий в проекте
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Добавьте первое изделие для начала работы
                                </Typography>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {/* Диалог создания/редактирования изделия */}
            <Dialog
                open={openProductDialog}
                onClose={() => { }}
                maxWidth="md"
                fullWidth
                disableEscapeKeyDown={true}
                hideBackdrop={true}
                disablePortal={true}
                disableScrollLock={true}
                keepMounted={false}
                disableEnforceFocus={true}
                disableAutoFocus={true}
            >
                <DialogTitle>
                    {editingProduct ? 'Редактировать изделие' : 'Создать изделие'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <FormControl fullWidth required>
                            <InputLabel shrink>Элемент номенклатуры</InputLabel>
                            <Select
                                value={productForm.nomenclatureItemId}
                                onChange={(e) => setProductForm({ ...productForm, nomenclatureItemId: e.target.value })}
                                label="Элемент номенклатуры"
                                disabled={loadingNomenclature}
                                notched
                            >
                                {nomenclatureItems.map((item) => (
                                    <MenuItem key={item.id} value={item.id}>
                                        {item.name} {item.designation ? `(${item.designation})` : ''}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Количество"
                            type="number"
                            value={productForm.quantity}
                            onChange={(e) => setProductForm({ ...productForm, quantity: parseInt(e.target.value) || 1 })}
                            fullWidth
                            required
                            inputProps={{ min: 1 }}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Серийный номер"
                            value={productForm.serialNumber || ''}
                            onChange={(e) => setProductForm({ ...productForm, serialNumber: e.target.value })}
                            fullWidth
                            placeholder="SN123456"
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Ссылка"
                            value={productForm.link || ''}
                            onChange={(e) => setProductForm({ ...productForm, link: e.target.value })}
                            fullWidth
                            placeholder="https://example.com"
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseProductDialog}>Отмена</Button>
                    <Button onClick={handleSaveProduct} variant="contained" sx={{ fontSize: '14px' }}>
                        {editingProduct ? 'Сохранить' : 'Создать'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProjectCard;
