import React, { useState, useEffect, useCallback } from 'react';
import '../styles/buttons.css';

// Функция для форматирования суммы в формате "0 000,00"
const formatSum = (value: string | undefined | null): string => {
    if (!value || value === '') return '';

    // Убираем все символы кроме цифр и точки/запятой
    const cleaned = String(value).replace(/[^\d.,]/g, '');

    // Заменяем запятую на точку для корректного парсинга
    const normalized = cleaned.replace(',', '.');

    // Парсим число
    const number = parseFloat(normalized);

    if (isNaN(number)) return value;

    // Форматируем число с разделителями тысяч и двумя знаками после запятой
    return number.toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};
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
    Chip,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Delete as DeleteIcon,
    DragIndicator
} from '@mui/icons-material';
import VolumeButton from './VolumeButton';
import EditStageDialog from './EditStageDialog';

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


interface Stage {
    id: string;
    sum: string; // Сумма этапа (было name)
    hours?: string; // Количество часов (было description)
    startDate: string;
    duration: number; // Продолжительность в днях
    endDate: string; // Вычисляемая дата
    nomenclatureItemId?: string;
    nomenclatureItem?: {
        id: string;
        name: string;
    };
    assigneeId?: string;
    assignee?: {
        id: string;
        name: string;
    };
    progress: number;
    version?: number;
    orderIndex?: number;
    parentTaskId?: string;
}

interface StagesPageProps {
    productId: string;
    onBack?: () => void;
    canEdit?: () => boolean;
    canCreate?: () => boolean;
    canDelete?: () => boolean;
}

const StagesPage: React.FC<StagesPageProps> = ({ productId, onBack, canEdit = () => true, canCreate = () => true, canDelete = () => true }) => {
    const [stages, setStages] = useState<Stage[]>([]);
    const [loading, setLoading] = useState(true);
    const [productName, setProductName] = useState<string>('');
    const [workTypes, setWorkTypes] = useState<Array<{ id: string, name: string }>>([]);
    const [contractors, setContractors] = useState<Array<{ id: string, name: string }>>([]);

    // Состояние для диалога создания/редактирования этапа
    const [openStageDialog, setOpenStageDialog] = useState(false);
    const [editingStage, setEditingStage] = useState<Stage | null>(null);
    const [stageForm, setStageForm] = useState({
        sum: '',
        hours: '',
        startDate: '',
        duration: 1,
        workTypeId: '',
        assigneeId: ''
    });

    // Настройка сенсоров для drag-and-drop этапов
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Минимальное расстояние для начала перетаскивания
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleDateString('ru-RU');
        } catch (error) {
            console.error('Error formatting date:', dateString, error);
            return '-';
        }
    };

    const fetchStages = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/products/${productId}/work-stages`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setStages(data);
            } else {
                console.error('Ошибка загрузки этапов работ');
            }
        } catch (error) {
            console.error('Ошибка загрузки этапов работ:', error);
        } finally {
            setLoading(false);
        }
    }, [productId]);

    const fetchProductInfo = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            // Получаем информацию об изделии для отображения названия
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/products/${productId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const product = await response.json();
                setProductName(product.name);
            }
        } catch (error) {
            console.error('Ошибка загрузки информации об изделии:', error);
        }
    }, [productId]);

    const fetchWorkTypes = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature?type=Work`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

                // Если токен недействителен, перенаправляем на страницу входа
                if (response.status === 403 && errorData.error === 'Invalid or expired token') {
                    localStorage.removeItem('token');
                    window.location.reload();
                    return;
                }

                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setWorkTypes(data.map((workType: { id: string; name: string; description?: string; isActive: boolean }) => ({
                id: workType.id,
                name: workType.name
            })));
        } catch (error) {
            console.error('Ошибка загрузки видов работ:', error);
        }
    }, []);

    const fetchContractors = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/counterparties?isContractor=true`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

                // Если токен недействителен, перенаправляем на страницу входа
                if (response.status === 403 && errorData.error === 'Invalid or expired token') {
                    localStorage.removeItem('token');
                    window.location.reload();
                    return;
                }

                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setContractors(data.map((contractor: { id: string; name: string; contactName: string; phone: string; email?: string; isActive: boolean }) => ({
                id: contractor.id,
                name: contractor.name
            })));
        } catch (error) {
            console.error('Ошибка загрузки контрагентов:', error);
        }
    }, []);

    useEffect(() => {
        fetchStages();
        fetchProductInfo();
        fetchWorkTypes();
        fetchContractors();
    }, [fetchStages, fetchProductInfo, fetchWorkTypes, fetchContractors]);

    const handleOpenStageDialog = (stage?: Stage) => {
        if (stage) {
            setEditingStage(stage);
            // Преобразуем дату в формат YYYY-MM-DD для HTML input
            const formattedDate = stage.startDate ?
                (typeof stage.startDate === 'string' ?
                    stage.startDate.split('T')[0] :
                    new Date(stage.startDate).toISOString().split('T')[0]) : '';


            setStageForm({
                sum: stage.sum,
                hours: stage.hours || '',
                startDate: formattedDate,
                duration: stage.duration || 1,
                workTypeId: stage.nomenclatureItem?.id || stage.nomenclatureItemId || '',
                assigneeId: stage.assignee?.id || stage.assigneeId || ''
            });
        } else {
            setEditingStage(null);
            
            // Определяем начальную дату: если есть этапы - берем последнюю дату окончания + 1 день, иначе - сегодня
            let initialStartDate = new Date().toISOString().split('T')[0];
            if (stages && stages.length > 0) {
                // Находим самую позднюю дату окончания среди всех этапов
                const latestEndDate = stages.reduce((latest, stage) => {
                    if (stage.endDate) {
                        const endDate = new Date(stage.endDate);
                        if (!latest || endDate > latest) {
                            return endDate;
                        }
                    }
                    return latest;
                }, null as Date | null);
                
                if (latestEndDate) {
                    // Прибавляем 1 день к последней дате окончания
                    const nextStartDate = new Date(latestEndDate);
                    nextStartDate.setDate(nextStartDate.getDate() + 1);
                    initialStartDate = nextStartDate.toISOString().split('T')[0];
                }
            }
            
            setStageForm({
                sum: '',
                hours: '',
                startDate: initialStartDate,
                duration: 1,
                workTypeId: '',
                assigneeId: ''
            });
        }
        setOpenStageDialog(true);
    };

    const handleCloseStageDialog = () => {
        setOpenStageDialog(false);
        setEditingStage(null);
        setStageForm({
            sum: '',
            hours: '',
            startDate: '',
            duration: 1,
            workTypeId: '',
            assigneeId: ''
        });
    };

    const handleSaveStage = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            const url = editingStage
                ? `${import.meta.env.VITE_API_BASE_URL}/projects/products/${productId}/work-stages/${editingStage.id}`
                : `${import.meta.env.VITE_API_BASE_URL}/projects/products/${productId}/work-stages`;

            const method = editingStage ? 'PUT' : 'POST';

            // Вычисляем дату окончания: дата начала + продолжительность
            // Вычисляем дату окончания только если есть дата начала
            let startDate = null;
            let endDate = null;

            if (stageForm.startDate && stageForm.startDate.trim() !== '') {
                startDate = new Date(stageForm.startDate);
                endDate = new Date(startDate);
                // endDate = startDate + (duration - 1) дней, т.к. дата начала считается как 1 день
                endDate.setDate(startDate.getDate() + stageForm.duration - 1);
            }

            const requestData: any = {
                sum: stageForm.sum,
                hours: stageForm.hours,
                startDate: stageForm.startDate || null,
                endDate: endDate ? endDate.toISOString() : null,
                duration: stageForm.duration,
                nomenclatureItemId: stageForm.workTypeId || undefined,
                assigneeId: stageForm.assigneeId || undefined,
                progress: editingStage?.progress || 0,
                productId: productId
            };

            if (editingStage) {
                requestData.version = editingStage.version;
            }

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

                // Если токен недействителен, перенаправляем на страницу входа
                if (response.status === 403 && errorData.error === 'Invalid or expired token') {
                    localStorage.removeItem('token');
                    window.location.reload();
                    return;
                }

                throw new Error(`HTTP error! status: ${response.status}, details: ${JSON.stringify(errorData)}`);
            }

            await fetchStages();
            handleCloseStageDialog();
        } catch (error) {
            console.error('Ошибка сохранения этапа:', error);
            const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
            alert(`Произошла ошибка при сохранении: ${errorMessage}\n\nПроверьте консоль браузера для подробностей.`);
        }
    };

    const handleDeleteStage = async (stageId: string) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот этап?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/products/${productId}/work-stages/${stageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

                // Если токен недействителен, перенаправляем на страницу входа
                if (response.status === 403 && errorData.error === 'Invalid or expired token') {
                    localStorage.removeItem('token');
                    window.location.reload();
                    return;
                }

                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchStages();
        } catch (error) {
            console.error('Ошибка удаления этапа:', error);
        }
    };

    // Обработчик завершения перетаскивания для этапов
    const handleDragEnd = async (event: any) => {
        const { active, over } = event;

        if (!active || !over || active.id === over.id) {
            return;
        }

        const oldIndex = stages.findIndex((stage) => stage.id === active.id);
        const newIndex = stages.findIndex((stage) => stage.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        // Перемещаем этапы в UI
        const newStages = arrayMove(stages, oldIndex, newIndex);
        setStages(newStages);

        // Сохраняем порядок на сервере
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            const stagesWithOrder = newStages.map((stage, index) => ({
                id: stage.id,
                order: index
            }));

            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/projects/products/${productId}/work-stages/order`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ stages: stagesWithOrder })
                }
            );

            if (!response.ok) {
                console.error('Ошибка сохранения порядка этапов');
                // Откатываем изменения в UI
                await fetchStages();
            }
        } catch (error) {
            console.error('Ошибка сохранения порядка этапов:', error);
            // Откатываем изменения в UI
            await fetchStages();
        }
    };

    const handleBackToProject = () => {
        if (onBack) {
            onBack();
        } else {
            // Возвращаемся к карточке проекта
            window.history.back();
        }
    };

    // Компонент для перетаскиваемой строки таблицы этапов
    function SortableStageRow({ stage, index }: { stage: Stage; index: number }) {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({ id: stage.id });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0.5 : 1,
        };

        return (
            <TableRow
                ref={setNodeRef}
                style={style}
                sx={{ cursor: 'pointer' }}
                onDoubleClick={() => handleOpenStageDialog(stage)}
            >
                <TableCell sx={{ py: 0.5, textAlign: 'center', width: '40px' }}>
                    <DragIndicator
                        {...attributes}
                        {...listeners}
                        sx={{ cursor: 'grab', color: 'action.main' }}
                    />
                </TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center', width: '150px' }}>
                    {stage.nomenclatureItem ? (
                        <Chip
                            label={stage.nomenclatureItem.name}
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ width: '100%', minWidth: '120px', borderRadius: '6px' }}
                        />
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ width: '100%', minWidth: '120px' }}>
                            Не указан
                        </Typography>
                    )}
                </TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center', width: '150px' }}>
                    {stage.assignee ? (
                        <Chip
                            label={stage.assignee.name}
                            size="small"
                            variant="outlined"
                            color="secondary"
                            sx={{ width: '100%', minWidth: '120px', borderRadius: '6px' }}
                        />
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ width: '100%', minWidth: '120px' }}>
                            Не назначен
                        </Typography>
                    )}
                </TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'right' }}>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {formatSum(stage.sum)}
                        </Typography>
                    </Box>
                </TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
                    <Typography variant="body2">
                        {stage.hours || '0'}
                    </Typography>
                </TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>{formatDate(stage.startDate)}</TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
                    <Typography variant="body2">
                        {stage.duration} дн.
                    </Typography>
                </TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>{formatDate(stage.endDate)}</TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center', width: '60px' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <IconButton
                            size="small"
                            onClick={() => handleDeleteStage(stage.id)}
                            color="error"
                            title="Удалить этап"
                            sx={{ minWidth: 'auto', padding: '4px' }}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
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
                    Этапы работ по {productName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {canCreate() && (
                        <VolumeButton
                            variant="contained"
                            onClick={() => handleOpenStageDialog()}
                            color="blue"
                        >
                            Добавить этап
                        </VolumeButton>
                    )}
                    <VolumeButton
                        variant="contained"
                        onClick={handleBackToProject}
                        color="orange"
                    >
                        Назад
                    </VolumeButton>
                </Box>
            </Box>

            {/* Содержимое */}
            {loading ? (
                <LinearProgress />
            ) : (
                <Box>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '40px' }}>
                                            <DragIndicator sx={{ color: 'action.main' }} />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '150px' }}>Вид работ</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '150px' }}>Исполнитель</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Сумма</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Часов</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Руб/час</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Старт</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Срок</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Финиш</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '60px' }}>
                                            <DeleteIcon fontSize="small" sx={{ color: 'red' }} />
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                    <TableBody>
                                        {stages.map((stage, index) => (
                                            <SortableStageRow key={stage.id} stage={stage} index={index} />
                                        ))}
                                    </TableBody>
                                </SortableContext>
                            </Table>
                        </TableContainer>
                    </DndContext>
                </Box>
            )}

            {/* Диалог создания/редактирования этапа */}
            <EditStageDialog
                open={openStageDialog}
                editing={!!editingStage}
                stageForm={stageForm}
                workTypes={workTypes}
                contractors={contractors}
                onClose={handleCloseStageDialog}
                onSave={handleSaveStage}
                onChange={setStageForm}
            />
        </Box>
    );
};

export default StagesPage;
