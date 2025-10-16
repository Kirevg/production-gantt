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
    Autocomplete,
} from '@mui/material';
import { Build as BuildIcon, Delete as DeleteIcon, DragIndicator } from '@mui/icons-material';

// Импорт библиотек для drag-and-drop функциональности
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
    product?: {
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
    const [isReordering, setIsReordering] = useState(false);
    const [openProductDialog, setOpenProductDialog] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [projectData, setProjectData] = useState({
        name: projectName,
        managerId: '',
        status: 'InProject' as 'InProject' | 'InProgress' | 'Done' | 'HasProblems'
    });
    const [managers, setManagers] = useState<any[]>([]);
    const [productForm, setProductForm] = useState({
        productId: '', // ID из справочника (если выбрано)
        productName: '', // Название изделия (ручной ввод или выбор)
        serialNumber: '',
        quantity: 1,
        link: ''
    });
    const [catalogProducts, setCatalogProducts] = useState<any[]>([]); // Изменено: список из справочника изделий
    const [loadingProducts, setLoadingProducts] = useState(false); // Изменено

    // Настройка сенсоров для drag-and-drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10, // Начинаем перетаскивание только после движения на 10px
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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

    // Загрузка справочника изделий
    const fetchCatalogProducts = useCallback(async () => {
        try {
            setLoadingProducts(true);
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/catalog-products?isActive=true`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setCatalogProducts(data);
        } catch (error) {
            console.error('Ошибка загрузки справочника изделий:', error);
        } finally {
            setLoadingProducts(false);
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
                    status: data.status || 'InProject'
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
                    name: product.product?.name || 'Без названия', // Изменено: теперь из справочника изделий
                    serialNumber: product.serialNumber,
                    description: product.description,
                    product: product.product, // Изменено
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
            // Сортируем продукты по orderIndex
            const sortedProducts = productsData.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
            setProducts(sortedProducts);
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
        fetchCatalogProducts();
    }, [projectId, isNew, fetchProjectData, fetchManagers, fetchProducts, fetchCatalogProducts]);

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
        // Открываем пустую карточку изделия с временным ID
        const tempProductId = `temp-${Date.now()}`;
        onOpenSpecifications(tempProductId, '');
    };

    // Обработчик для drag-and-drop событий
    const handleDragEnd = async (event: any) => {
        const { active, over } = event;

        if (active && over && active.id !== over.id) {
            const oldIndex = products.findIndex((product) => product.id === active.id);
            const newIndex = products.findIndex((product) => product.id === over.id);

            // Проверяем, что индексы найдены
            if (oldIndex === -1 || newIndex === -1) {
                console.error('Не удалось найти продукты для переупорядочивания');
                return;
            }

            // Сохраняем исходный порядок на случай ошибки
            const originalProducts = [...products];

            // Обновляем порядок в локальном состоянии
            const reorderedProducts = arrayMove(products, oldIndex, newIndex);
            const updatedProducts = reorderedProducts.map((product, index) => ({
                ...product,
                orderIndex: index
            }));

            setProducts(updatedProducts);
            setIsReordering(true);

            // Отправляем обновленный порядок на сервер
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setProducts(originalProducts);
                    setIsReordering(false);
                    return;
                }

                const productOrders = updatedProducts.map((product, index) => ({
                    id: product.id,
                    orderIndex: index
                }));

                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/products/reorder`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ productOrders })
                });

                if (!response.ok) {
                    // Если обновление не удалось, возвращаем исходный порядок
                    setProducts(originalProducts);
                    console.error('Ошибка обновления порядка продуктов');
                }
            } catch (error) {
                // При ошибке возвращаем исходный порядок
                setProducts(originalProducts);
                console.error('Ошибка сети при обновлении порядка:', error);
            } finally {
                setIsReordering(false);
            }
        }
    };

    const handleCloseProductDialog = () => {
        setOpenProductDialog(false);
        setEditingProduct(null);
        setProductForm({
            productId: '',
            productName: '',
            serialNumber: '',
            quantity: 1,
            link: ''
        });
    };

    const handleSaveProduct = async () => {
        try {
            // Валидация
            if (!productForm.productName.trim()) {
                alert('Пожалуйста, введите или выберите изделие');
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            // Если введено вручную, сначала создаём изделие в справочнике
            let productId = productForm.productId;

            if (!productId && productForm.productName.trim()) {
                // Создаём новое изделие в справочнике
                const createProductResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/catalog-products`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: productForm.productName.trim(),
                        isActive: true
                    })
                });

                if (!createProductResponse.ok) {
                    throw new Error('Ошибка создания изделия в справочнике');
                }

                const newProduct = await createProductResponse.json();
                productId = newProduct.id;

                // Обновляем список изделий
                await fetchCatalogProducts();
            }

            const url = editingProduct
                ? `${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/products/${editingProduct.id}`
                : `${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/products`;

            const method = editingProduct ? 'PUT' : 'POST';

            const requestData: {
                productId: string;
                serialNumber?: string;
                description?: string;
                quantity: number;
                version?: number;
                orderIndex?: number;
                productSum?: number;
            } = {
                productId: productId,
                serialNumber: productForm.serialNumber || undefined,
                description: productForm.link || undefined,
                quantity: productForm.quantity
            };

            if (editingProduct) {
                // Для редактирования добавляем только version (если он есть и больше 0)
                if (editingProduct.version && editingProduct.version > 0) {
                    requestData.version = editingProduct.version;
                }
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

    const handleDeleteProduct = (product: Product) => {
        setProductToDelete(product);
        setOpenDeleteDialog(true);
    };

    const confirmDeleteProduct = async () => {
        if (!productToDelete) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/products/${productToDelete.id}`, {
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
            setOpenDeleteDialog(false);
            setProductToDelete(null);
            console.log('Изделие успешно удалено');
        } catch (error) {
            console.error('Ошибка удаления изделия:', error);
            alert('Ошибка при удалении изделия. Проверьте консоль для подробностей.');
        }
    };


    // Компонент для перетаскиваемой строки таблицы
    function SortableProductTableRow({ product, index }: { product: Product; index: number }) {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({
            id: product.id,
            disabled: loading || isReordering
        });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0.5 : 1,
        };

        const workStages = product.workStages || [];

        return (
            <TableRow
                ref={setNodeRef}
                style={style}
                onDoubleClick={() => !loading && !isReordering && onOpenSpecifications(product.id, product.product?.name || '')}
                sx={{
                    height: '35px',
                    borderTop: '2px solid #e0e0e0',
                    '&:hover': {
                        backgroundColor: (loading || isReordering) ? 'transparent' : '#f5f5f5',
                    },
                }}
            >
                <TableCell
                    {...attributes}
                    {...listeners}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                        width: '40px',
                        minWidth: '40px',
                        maxWidth: '40px',
                        cursor: (loading || isReordering) ? 'default' : 'grab',
                        opacity: (loading || isReordering) ? 0.5 : 1,
                        py: 0.5,
                        textAlign: 'center',
                        '&:active': {
                            cursor: (loading || isReordering) ? 'default' : 'grabbing',
                        },
                    }}
                >
                    <DragIndicator color="action" />
                </TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center', width: '40px' }}>{index + 1}</TableCell>
                <TableCell sx={{ py: 0.5, minWidth: '250px' }}>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {product.product?.name || 'Без названия'}
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
                                onClick={() => handleDeleteProduct(product)}
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
                            onChange={(e) => setProjectData({ ...projectData, status: e.target.value as 'InProject' | 'InProgress' | 'Done' | 'HasProblems' })}
                            size="small"
                            SelectProps={{ native: true }}
                            sx={{ flex: 1 }}
                            InputLabelProps={{ shrink: true }}
                        >
                            <option value="InProject">В проекте</option>
                            <option value="InProgress">В работе</option>
                            <option value="Done">Завершён</option>
                            <option value="HasProblems">Проблемы</option>
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
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
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
                                            <DragIndicator sx={{ color: 'action.main' }} />
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
                                    <SortableContext items={products.map(p => p.id)} strategy={verticalListSortingStrategy}>
                                        {products.map((product, index) => (
                                            <SortableProductTableRow key={product.id} product={product} index={index} />
                                        ))}
                                    </SortableContext>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </DndContext>

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
                        <Autocomplete
                            freeSolo
                            options={catalogProducts}
                            getOptionLabel={(option) => {
                                if (typeof option === 'string') return option;
                                return `${option.name}${option.designation ? ` (${option.designation})` : ''}`;
                            }}
                            value={catalogProducts.find(p => p.id === productForm.productId) || null}
                            onChange={(_, newValue) => {
                                if (typeof newValue === 'string') {
                                    // Ручной ввод
                                    setProductForm({
                                        ...productForm,
                                        productId: '',
                                        productName: newValue
                                    });
                                } else if (newValue && newValue.id) {
                                    // Выбор из списка
                                    setProductForm({
                                        ...productForm,
                                        productId: newValue.id,
                                        productName: newValue.name
                                    });
                                } else {
                                    // Очистка
                                    setProductForm({
                                        ...productForm,
                                        productId: '',
                                        productName: ''
                                    });
                                }
                            }}
                            onInputChange={(_, newInputValue) => {
                                // Обновляем название при ручном вводе
                                setProductForm({
                                    ...productForm,
                                    productName: newInputValue
                                });
                            }}
                            inputValue={productForm.productName}
                            disabled={loadingProducts}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Изделие"
                                    required
                                    placeholder="Введите или выберите изделие"
                                    helperText="Выберите из списка или введите название вручную"
                                />
                            )}
                        />
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

            {/* Диалог подтверждения удаления изделия */}
            <Dialog
                open={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
                sx={{
                    '& .MuiDialog-paper': {
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        margin: 0,
                        width: '400px',
                        height: '200px',
                        maxHeight: '90vh'
                    }
                }}
            >
                <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
                    Подтверждение удаления
                </DialogTitle>
                <DialogContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                        {productToDelete?.product?.name || productToDelete?.name || 'Без названия'}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
                    <Button
                        onClick={confirmDeleteProduct}
                        variant="contained"
                        color="error"
                        className="volume-button"
                        sx={{ minWidth: 120 }}
                    >
                        Удалить
                    </Button>
                    <Button
                        onClick={() => setOpenDeleteDialog(false)}
                        variant="contained"
                        className="volume-button"
                        sx={{ minWidth: 120 }}
                    >
                        Отмена
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProjectCard;
