import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, MenuItem, Menu, ListItemIcon, ListItemText } from '@mui/material';
import { Refresh, Edit, Delete, ExpandLess, ExpandMore, Build } from '@mui/icons-material';
import VolumeButton from './VolumeButton';
import EditStageDialog from './EditStageDialog';
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
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

// Интерфейс для задач канбан-доски
interface KanbanTask {
    id: string;
    name: string;
    start: Date;
    end: Date;
    progress: number;
    assignee?: string;
    workType?: string;
    sum?: string;
    hours?: string;
    projectId?: string;
    projectName?: string;
    projectOrderIndex?: number;
    productId?: string;
    productOrderIndex?: number;
    productName?: string;
    productDescription?: string | null; // Описание из справочника Product
    serialNumber?: string | null;
    projectStatus?: string;
    assigneeId?: string | null;
    workTypeId?: string | null;
    projectManager?: {
        name: string;
        phone: string | null;
        email: string | null;
    } | null;
}

interface KanbanBoardProps {
    onOpenStage?: (productId: string, stageId?: string) => void;
}

interface StageForm {
    sum: string;
    hours: string;
    startDate: string;
    duration: number;
    workTypeId: string;
    assigneeId: string;
}


// Компонент для сортируемой карточки этапа
interface SortableStageCardProps {
    task: KanbanTask;
    onDoubleClick: (task: KanbanTask) => void;
    onContextMenu: (event: React.MouseEvent, task: KanbanTask) => void;
}

const SortableStageCard: React.FC<SortableStageCardProps> = ({
    task,
    onDoubleClick,
    onContextMenu,
    // formatSum
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
        isOver,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : 'transform 0.3s ease',
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    };

    return (
        <Paper
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            sx={{
                p: '4px',
                minWidth: '150px',
                border: isOver ? '2px solid #1976d2' : '2px solid #616161',
                cursor: isDragging ? 'grabbing' : 'grab',
                transition: 'all 0.3s ease',
                backgroundColor: isOver ? 'rgba(25, 118, 210, 0.05)' : 'transparent',
                '&:hover': {
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    transform: isDragging ? 'none' : 'translateY(-2px)'
                }
            }}
            onDoubleClick={() => onDoubleClick(task)}
            onContextMenu={(e: React.MouseEvent) => onContextMenu(e, task)}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: '12px' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.25, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                        <Build fontSize="small" sx={{ color: '#616161' }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.name}
                        </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '0.85em' }}>
                        👤 {task.assignee || 'Не назначен'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.1 }}>
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '0.85em' }}>
                        📅 {new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(task.start)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '0.85em' }}>
                        ⏱️ {new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(task.end)}
                    </Typography>
                </Box>
            </Box>
            {/* Дополнительный контент при необходимости */}
        </Paper>
    );
};

const KanbanBoard: React.FC<KanbanBoardProps> = () => {
    const [kanbanTasks, setKanbanTasks] = useState<KanbanTask[]>([]);
    // Получаем userId из JWT токена
    const getUserId = (): string | null => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;
            const parts = token.split('.');
            if (parts.length < 2) return null;
            const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const jsonStr = decodeURIComponent(atob(payloadB64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            const payload = JSON.parse(jsonStr);
            return payload?.user?.id || payload?.id || payload?.userId || payload?.sub || null;
        } catch {
            return null;
        }
    };
    const userId = getUserId();
    // const stagesKey = `kanban-${userId ?? 'anon'}-collapsed-stages`;
    const projectsKey = `kanban-${userId ?? 'anon'}-collapsed-projects`;
    const productsKey = `kanban-${userId ?? 'anon'}-collapsed-products`;
    // Свернутость карточек этапов отключена
    // Свернутые проекты (по projectId) с ленивой инициализацией из localStorage
    const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(() => {
        try {
            const raw = localStorage.getItem(projectsKey);
            return new Set(raw ? (JSON.parse(raw) as string[]) : []);
        } catch {
            return new Set<string>();
        }
    });
    // Свернутые изделия (по productKey) с ленивой инициализацией из localStorage
    const [collapsedProducts, setCollapsedProducts] = useState<Set<string>>(() => {
        try {
            const raw = localStorage.getItem(productsKey);
            return new Set(raw ? (JSON.parse(raw) as string[]) : []);
        } catch {
            return new Set<string>();
        }
    });

    // Переключение свёрнутости карточки — отключено
    // Переключение свёрнутости проекта
    const toggleProjectCollapse = (projectId: string) => {
        setCollapsedProjects((prev) => {
            const next = new Set(prev);
            if (next.has(projectId)) next.delete(projectId); else next.add(projectId);
            try { localStorage.setItem(projectsKey, JSON.stringify(Array.from(next))); } catch { }
            return next;
        });
    };
    // Переключение свёрнутости изделия
    const toggleProductCollapse = (productKeyStr: string) => {
        setCollapsedProducts((prev) => {
            const next = new Set(prev);
            if (next.has(productKeyStr)) next.delete(productKeyStr); else next.add(productKeyStr);
            try { localStorage.setItem(productsKey, JSON.stringify(Array.from(next))); } catch { }
            return next;
        });
    };

    // (сохранение выполняется в toggle-функциях)
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // Состояние для диалога редактирования
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
    const [workTypes, setWorkTypes] = useState<Array<{ id: string, name: string }>>([]);
    const [contractors, setContractors] = useState<Array<{ id: string, name: string }>>([]);
    const [stageForm, setStageForm] = useState<StageForm>({
        sum: '',
        hours: '',
        startDate: '',
        duration: 1,
        workTypeId: '',
        assigneeId: ''
    });

    // Состояние для контекстного меню
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        task: KanbanTask | null;
    } | null>(null);

    // Сенсоры для drag-and-drop с ограничениями
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

    // Состояние для отслеживания активного перетаскивания
    // const [activeId, setActiveId] = useState<string | null>(null);
    // const [overId, setOverId] = useState<string | null>(null);
    // const [shouldMove, setShouldMove] = useState<boolean>(false);

    // Функция загрузки сохраненного порядка из localStorage
    const loadSavedOrder = (tasks: KanbanTask[]): KanbanTask[] => {
        try {
            const savedOrder = localStorage.getItem('kanban-task-order');
            if (!savedOrder) return tasks;

            const orderData = JSON.parse(savedOrder);
            // console.log('📂 Загружен сохраненный порядок:', orderData);

            // Создаем карту порядка по ID задачи
            const orderMap = new Map();
            orderData.forEach((item: any) => {
                orderMap.set(item.id, item.order);
            });

            // Сортируем задачи по сохраненному порядку
            const sortedTasks = [...tasks].sort((a, b) => {
                const orderA = orderMap.get(a.id) ?? 999999; // Новые задачи в конец
                const orderB = orderMap.get(b.id) ?? 999999;
                return orderA - orderB;
            });

            // console.log('🔄 Применен сохраненный порядок');
            return sortedTasks;
        } catch (error) {
            console.warn('Ошибка загрузки сохраненного порядка:', error);
            return tasks;
        }
    };

    // Загрузка данных для канбан-доски
    const fetchKanbanData = async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('token');
            // console.log('🔑 Токен из localStorage:', token ? 'найден' : 'не найден');
            // console.log('🌐 API URL:', `${import.meta.env.VITE_API_BASE_URL}/projects/gantt`);

            if (!token) {
                setError('Токен авторизации не найден. Войдите в систему.');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/gantt`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // console.log('📡 Ответ сервера:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Ошибка ответа:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            // console.log('📊 Получены данные для канбан-доски:', data);

            // Преобразуем данные в формат для канбан-доски
            const tasks: KanbanTask[] = data.map((stage: any) => {
                // Для изделий без этапов и проектов без изделий даты могут быть null
                // Определяем, является ли это изделием без этапов (по специальному ID)
                const isProductOnly = stage.id && stage.id.startsWith('product-only-');
                // Определяем, является ли это проектом без изделий (по специальному ID)
                const isProjectOnly = stage.id && stage.id.startsWith('project-only-');

                let startDate: Date;
                let endDate: Date;

                if (isProductOnly || isProjectOnly || !stage.start || !stage.end) {
                    // Для изделий без этапов и проектов без изделий используем текущую дату как заглушку
                    // Эти даты не будут использоваться для отображения
                    const today = new Date();
                    startDate = today;
                    endDate = today;
                } else {
                    startDate = new Date(stage.start);
                    endDate = new Date(stage.end);

                    // Проверяем валидность дат только для реальных этапов
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                        console.warn('⚠️ Невалидная дата для этапа:', stage);
                        return null;
                    }
                }

                return {
                    id: stage.id,
                    name: stage.name || '', // Пустое имя для изделий без этапов
                    start: startDate,
                    end: endDate,
                    progress: Math.min(Math.max(stage.progress || 0, 0), 100),
                    assignee: stage.assignee || 'Не назначен',
                    workType: stage.workType || 'Не указан',
                    sum: stage.sum || '0',
                    hours: stage.hours || '0',
                    assigneeId: stage.assigneeId || null,
                    workTypeId: stage.workTypeId || null,
                    projectId: stage.projectId,
                    projectName: stage.projectName || 'Проект',
                    projectOrderIndex: stage.projectOrderIndex,
                    productId: stage.productId,
                    productOrderIndex: stage.productOrderIndex,
                    productName: stage.productName || 'Изделие',
                    productDescription: stage.productDescription || null, // Описание из Product
                    serialNumber: stage.serialNumber || null,
                    projectStatus: stage.projectStatus,
                    projectManager: stage.projectManager || null
                };
            }).filter(Boolean);

            // console.log('🎯 Преобразованные задачи:', tasks);
            // console.log('🔍 Количество задач:', tasks.length);

            // Применяем сохраненный порядок
            const orderedTasks = loadSavedOrder(tasks);
            setKanbanTasks(orderedTasks);
        } catch (err) {
            console.error('Ошибка загрузки данных канбан-доски:', err);
            setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    };

    // Загружаем данные при монтировании компонента
    useEffect(() => {
        fetchKanbanData();
        fetchWorkTypes();
        fetchContractors();
    }, []);

    // Загрузка справочников
    const fetchWorkTypes = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature?type=Work`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setWorkTypes(data.map((wt: { id: string; name: string }) => ({ id: wt.id, name: wt.name })));
            }
        } catch (error) {
            console.error('Ошибка загрузки видов работ:', error);
        }
    };

    const fetchContractors = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/counterparties?isContractor=true`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setContractors(data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
            }
        } catch (error) {
            console.error('Ошибка загрузки подрядчиков:', error);
        }
    };

    // Обработчик клика по карточке этапа работ
    const handleCardClick = (task: KanbanTask) => {
        // console.log('Клик по карточке:', task);
        // console.log('workTypeId из задачи:', task.workTypeId);
        setEditingTask(task);
        // Форматируем дату для input
        const startDate = task.start.toISOString().split('T')[0];
        // Вычисляем длительность: endDate - startDate + 1 день (включаем обе даты)
        const duration = Math.ceil((task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        // console.log('Вычисленная длительность:', duration, 'дней');
        // console.log('Даты:', { start: task.start, end: task.end });

        // Используем тот же подход что в StagesPage: преобразуем в строку или пустую строку
        setStageForm({
            sum: task.sum || '',
            hours: task.hours || '',
            startDate: startDate,
            duration: duration,
            workTypeId: (task.workTypeId || '') as string,
            assigneeId: (task.assigneeId || '') as string
        });
        // console.log('stageForm после установки:', { workTypeId: (task.workTypeId || ''), duration });
        setOpenEditDialog(true);
    };

    const handleCloseEditDialog = () => {
        setOpenEditDialog(false);
        setEditingTask(null);
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
        if (!editingTask || !editingTask.productId) {
            alert('Ошибка: не указан продукт');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Токен не найден');
                return;
            }

            // Вычисляем дату окончания
            // duration уже включает даты начала и окончания, поэтому вычитаем 1 день
            const startDate = new Date(stageForm.startDate);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + stageForm.duration - 1);

            const requestData = {
                sum: stageForm.sum,
                hours: stageForm.hours,
                startDate: stageForm.startDate || null,
                endDate: endDate.toISOString(),
                duration: stageForm.duration,
                nomenclatureItemId: stageForm.workTypeId || undefined,
                assigneeId: stageForm.assigneeId || undefined,
                productId: editingTask.productId
            };

            let response;
            const isNewStage = !editingTask.id; // Новый этап, если нет ID

            if (isNewStage) {
                // Создаем новый этап
                response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/projects/products/${editingTask.productId}/work-stages`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestData)
                    }
                );
            } else {
                // Редактируем существующий этап
                response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/projects/products/${editingTask.productId}/work-stages/${editingTask.id}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestData)
                    }
                );
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(`HTTP error! status: ${response.status}, details: ${JSON.stringify(errorData)}`);
            }

            handleCloseEditDialog();
            await fetchKanbanData(); // Обновляем данные канбан-доски
        } catch (error) {
            console.error('Ошибка сохранения этапа:', error);
            alert(`Произошла ошибка при сохранении: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    const handleRefresh = () => {
        fetchKanbanData();
    };

    // Обработчики drag-and-drop
    const handleDragStart = (_event: any) => {
        // setActiveId(event.active.id);
        // setOverId(null);
        // setShouldMove(false);
    };

    const handleDragOver = (_event: any) => {
        // try {
        //     const { active, over } = event;

        //     if (over?.id && active?.id && active.id !== over.id) {
        //         setOverId(over.id);

        //         // 🎬 ТОЛЬКО АНИМАЦИЯ - проверяем пересечение на 50%
        //         // Сохранение происходит только в handleDragEnd при отпускании кнопки мыши
        //         const activeRect = active.rect?.current?.translated;
        //         const overRect = over.rect?.current?.translated;

        //         if (activeRect && overRect) {
        //             const intersection = getIntersectionRatio(activeRect, overRect);
        //             setShouldMove(intersection > 0.5);
        //         } else {
        //             setShouldMove(false);
        //         }
        //     } else {
        //         setOverId(null);
        //         setShouldMove(false);
        //     }
        // } catch (error) {
        //     console.warn('Ошибка в handleDragOver:', error);
        //     setOverId(null);
        //     setShouldMove(false);
        // }
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;

        // Проверяем, что перетаскивание завершилось успешно
        if (active.id !== over?.id && over?.id) {
            // Находим активную и целевую задачи
            const activeTask = kanbanTasks.find((task) => task.id === active.id);
            const overTask = kanbanTasks.find((task) => task.id === over.id);

            // Проверяем, что обе задачи принадлежат одному изделию
            if (activeTask && overTask && activeTask.productId === overTask.productId) {
                // Находим индексы для перемещения
                const oldIndex = kanbanTasks.findIndex((task) => task.id === active.id);
                const newIndex = kanbanTasks.findIndex((task) => task.id === over.id);

                if (oldIndex !== -1 && newIndex !== -1) {
                    // 🔄 ПЕРЕМЕЩАЕМ КАРТОЧКУ В НОВОЕ ПОЛОЖЕНИЕ
                    const newTasks = arrayMove(kanbanTasks, oldIndex, newIndex);
                    setKanbanTasks(newTasks);

                    // 💾 СОХРАНЯЕМ НОВЫЙ ПОРЯДОК
                    // console.log('💾 Сохранение порядка при отпускании кнопки мыши');
                    await saveTaskOrder(newTasks);

                    // console.log('✅ Карточка успешно перемещена и сохранена');
                }
            } else {
                // console.log('⚠️ Перетаскивание между разными изделиями или задачи не найдены');
            }
        } else {
            // console.log('ℹ️ Перетаскивание отменено или не завершено');
        }

        // Сбрасываем состояние перетаскивания в конце
        // setActiveId(null);
        // setOverId(null);
        // setShouldMove(false);
    };

    // Функция для вычисления процента пересечения
    // const getIntersectionRatio = (rect1: any, rect2: any) => {
    //     // Проверяем, что все необходимые свойства существуют
    //     if (!rect1 || !rect2 ||
    //         typeof rect1.left !== 'number' || typeof rect1.width !== 'number' || typeof rect1.height !== 'number' ||
    //         typeof rect2.left !== 'number' || typeof rect2.width !== 'number' || typeof rect2.height !== 'number') {
    //         return 0;
    //     }

    //     const x1 = Math.max(rect1.left, rect2.left);
    //     const y1 = Math.max(rect1.top, rect2.top);
    //     const x2 = Math.min(rect1.left + rect1.width, rect2.left + rect2.width);
    //     const y2 = Math.min(rect1.top + rect1.height, rect2.top + rect2.height);

    //     if (x2 <= x1 || y2 <= y1) return 0;

    //     const intersectionArea = (x2 - x1) * (y2 - y1);
    //     const rect2Area = rect2.width * rect2.height;

    //     return rect2Area > 0 ? intersectionArea / rect2Area : 0;
    // };

    // Функция сохранения порядка этапов
    const saveTaskOrder = async (tasks: KanbanTask[]) => {
        try {
            // Сохраняем порядок в localStorage для персистентности
            const taskOrder = tasks.map((task, index) => ({
                id: task.id,
                order: index,
                productId: task.productId
            }));

            localStorage.setItem('kanban-task-order', JSON.stringify(taskOrder));
            // console.log('💾 Порядок этапов сохранен в localStorage:', taskOrder);

            // Группируем этапы по изделиям для отправки на сервер
            const stagesByProduct = new Map<string, Array<{ id: string; order: number }>>();

            tasks.forEach((task, index) => {
                if (task.productId) {
                    if (!stagesByProduct.has(task.productId)) {
                        stagesByProduct.set(task.productId, []);
                    }
                    stagesByProduct.get(task.productId)!.push({
                        id: task.id,
                        order: index
                    });
                }
            });

            // Отправляем обновления для каждого изделия
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn('Токен не найден, сохраняем только в localStorage');
                return;
            }

            const updatePromises = Array.from(stagesByProduct.entries()).map(async ([productId, stages]) => {
                try {
                    const response = await fetch(
                        `${import.meta.env.VITE_API_BASE_URL}/projects/products/${productId}/work-stages/order`,
                        {
                            method: 'PUT',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ stages })
                        }
                    );

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                        throw new Error(`HTTP error! status: ${response.status}, details: ${JSON.stringify(errorData)}`);
                    }

                    // console.log(`✅ Порядок этапов для изделия ${productId} сохранен на сервере`);
                } catch (error) {
                    console.error(`❌ Ошибка сохранения порядка для изделия ${productId}:`, error);
                    // Не прерываем выполнение, продолжаем с другими изделиями
                }
            });

            await Promise.all(updatePromises);
            // console.log('✅ Все обновления порядка этапов завершены');
        } catch (error) {
            console.error('Ошибка сохранения порядка этапов:', error);
        }
    };

    // Обработчик клика по кнопке добавления изделия
    const handleAddProduct = (_projectId: string) => {
        // console.log('Добавить изделие в проект:', _projectId);
        // TODO: Реализовать логику добавления изделия
        alert('Функция добавления изделия будет реализована');
    };

    // Обработчик клика по кнопке добавления этапа работ
    const handleAddStage = (productId: string) => {
        // console.log('Добавить этап работ в изделие:', productId);

        // Создаем пустую задачу для нового этапа
        const newTask: KanbanTask = {
            id: '', // Будет создан на сервере
            name: '',
            start: new Date(),
            end: new Date(),
            progress: 0,
            assignee: '',
            workType: '',
            sum: '',
            hours: '',
            projectId: '',
            projectName: '',
            productId: productId,
            productName: '',
            serialNumber: null,
            projectStatus: '',
            assigneeId: null,
            workTypeId: null,
            projectManager: null
        };

        // Устанавливаем пустую форму
        setStageForm({
            sum: '',
            hours: '',
            startDate: new Date().toISOString().split('T')[0], // Сегодняшняя дата
            duration: 1,
            workTypeId: '',
            assigneeId: ''
        });

        // Открываем диалог редактирования
        setEditingTask(newTask);
        setOpenEditDialog(true);
    };

    // Обработчики контекстного меню
    const handleContextMenu = (event: React.MouseEvent, task: KanbanTask) => {
        event.preventDefault();
        setContextMenu({
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
            task: task
        });
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const handleEditFromContextMenu = () => {
        if (contextMenu?.task) {
            handleCardClick(contextMenu.task);
        }
        handleCloseContextMenu();
    };

    const handleDeleteStage = async () => {
        if (!contextMenu?.task || !contextMenu.task.id || !contextMenu.task.productId) {
            alert('Ошибка: не удается удалить этап');
            return;
        }

        if (!confirm('Вы уверены, что хотите удалить этот этап работ?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Токен не найден');
                return;
            }

            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/projects/products/${contextMenu.task.productId}/work-stages/${contextMenu.task.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(`HTTP error! status: ${response.status}, details: ${JSON.stringify(errorData)}`);
            }

            handleCloseContextMenu();
            await fetchKanbanData(); // Обновляем данные канбан-доски
        } catch (error) {
            console.error('Ошибка удаления этапа:', error);
            alert(`Произошла ошибка при удалении: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        // Отключаем автоматическое возвращение карточек в исходное положение
        // Теперь мы сами управляем позициями через состояние
        >
            <Box sx={{ width: '100%', minHeight: '600px' }}>
                {/* Канбан-доска */}
                <Paper sx={{
                    minHeight: 'calc(100% - 80px)',
                    overflow: 'auto',
                    position: 'relative', // Для правильного позиционирования drag & drop
                    width: '100%'
                }}>
                    {loading ? (
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            minHeight: '400px',
                            flexDirection: 'column',
                            gap: 2
                        }}>
                            <Typography variant="h6" color="text.secondary">
                                Загрузка данных...
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Получаем этапы работ всех проектов
                            </Typography>
                        </Box>
                    ) : error ? (
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            minHeight: '400px',
                            flexDirection: 'column',
                            gap: 2
                        }}>
                            <Typography variant="h6" color="error">
                                Ошибка загрузки данных
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {error}
                            </Typography>
                        </Box>
                    ) : kanbanTasks.length > 0 ? (
                        <Box sx={{ pt: 2, pb: 2, paddingLeft: '30px', paddingRight: '30px' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    Проекты, изделия и этапы работ
                                </Typography>
                                <Tooltip title="Обновить">
                                    <IconButton onClick={handleRefresh} size="small">
                                        <Refresh />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            {/* Группируем задачи по проектам и изделиям */}
                            {(() => {
                                // Сначала группируем задачи по projectId
                                const projectsMap = new Map<string, KanbanTask[]>();
                                kanbanTasks.forEach(task => {
                                    if (!projectsMap.has(task.projectId || '')) {
                                        projectsMap.set(task.projectId || '', []);
                                    }
                                    projectsMap.get(task.projectId || '')?.push(task);
                                });

                                // Сортируем проекты по projectOrderIndex
                                return Array.from(projectsMap.entries())
                                    .sort((a, b) => {
                                        const orderA = a[1][0]?.projectOrderIndex ?? 999999;
                                        const orderB = b[1][0]?.projectOrderIndex ?? 999999;
                                        return orderA - orderB;
                                    })
                                    .map(([projectId, tasks]) => {
                                        const projectName = tasks[0]?.projectName || 'Без проекта';

                                        // Теперь группируем этапы этого проекта по изделиям
                                        // Используем productId как ключ, чтобы каждое изделие было уникальным
                                        const productsMap = new Map<string, KanbanTask[]>();
                                        tasks.forEach(task => {
                                            // Пропускаем записи проектов без изделий (project-only-)
                                            if (task.id && task.id.startsWith('project-only-')) {
                                                return;
                                            }
                                            // Используем productId как ключ для уникальности изделий
                                            const productKey = task.productId || 'unknown';
                                            if (!productsMap.has(productKey)) {
                                                productsMap.set(productKey, []);
                                            }
                                            productsMap.get(productKey)?.push(task);
                                        });

                                        // Сортируем изделия по productOrderIndex для правильного порядка
                                        const sortedProducts = Array.from(productsMap.entries())
                                            .sort((a, b) => {
                                                const orderA = a[1][0]?.productOrderIndex ?? 999999;
                                                const orderB = b[1][0]?.productOrderIndex ?? 999999;
                                                return orderA - orderB;
                                            });

                                        // Определяем, есть ли у проекта изделия
                                        const hasProducts = productsMap.size > 0;
                                        // Если нет изделий, карточка должна быть свернута и кнопка неактивна
                                        const isCollapsed = collapsedProjects.has(projectId) || !hasProducts;

                                        return (
                                            <Box key={projectId} sx={{ mb: 2 }}>
                                                {/* Контейнер проекта с рамкой */}
                                                <Paper
                                                    sx={{
                                                        border: '2px solid #1976d2',
                                                        borderRadius: '4px',
                                                        p: 1
                                                    }}
                                                >
                                                    {/* Заголовок проекта */}
                                                    <Box
                                                        sx={{
                                                            p: '8px',
                                                            mb: 1,
                                                            backgroundColor: '#f5f5f5',
                                                            borderRadius: '2px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '30px',
                                                            flexWrap: 'wrap'
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <Tooltip title={isCollapsed ? 'Развернуть проект' : 'Свернуть проект'}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => hasProducts && toggleProjectCollapse(projectId)}
                                                                    aria-label={isCollapsed ? 'Развернуть проект' : 'Свернуть проект'}
                                                                    disabled={!hasProducts}
                                                                    disableRipple
                                                                    sx={{
                                                                        '&:focus': {
                                                                            outline: 'none',
                                                                            border: 'none'
                                                                        },
                                                                        '&:focus-visible': {
                                                                            outline: 'none',
                                                                            border: 'none'
                                                                        },
                                                                        '&:hover': {
                                                                            backgroundColor: 'transparent'
                                                                        },
                                                                        '&.Mui-disabled': {
                                                                            opacity: 0.5
                                                                        }
                                                                    }}
                                                                >
                                                                    {isCollapsed ? <ExpandMore fontSize="small" /> : <ExpandLess fontSize="small" />}
                                                                </IconButton>
                                                            </Tooltip>
                                                            {/* Кнопка добавления изделия - размер 40x40px */}
                                                            <VolumeButton
                                                                onClick={() => handleAddProduct(projectId)}
                                                                color="blue"
                                                                sx={{
                                                                    width: '30px',
                                                                    height: '30px',
                                                                    minWidth: '30px',
                                                                    minHeight: '30px',
                                                                    p: 0,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontSize: '20px'
                                                                }}
                                                            >
                                                                +
                                                            </VolumeButton>
                                                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                                📋 Проект: {projectName} - Изделий: {productsMap.size}
                                                            </Typography>
                                                        </Box>
                                                        {tasks[0]?.projectManager && (
                                                            <Typography variant="body2" sx={{ color: '#424242' }}>
                                                                РП: {tasks[0].projectManager.name}
                                                                {tasks[0].projectManager.phone && ` 📞 ${tasks[0].projectManager.phone}`}
                                                                {tasks[0].projectManager.email && ` 📧 ${tasks[0].projectManager.email}`}
                                                            </Typography>
                                                        )}
                                                    </Box>

                                                    {/* Группировка по изделиям (показываем только если проект не свернут и есть изделия) */}
                                                    {!isCollapsed && hasProducts && sortedProducts.map(([productKey, productTasks]) => {
                                                        const productName = productTasks[0]?.productName || 'Без изделия';
                                                        const productDescription = productTasks[0]?.productDescription; // Описание из Product
                                                        const serialNumber = productTasks[0]?.serialNumber;
                                                        return (
                                                            <Box key={productKey} sx={{ mb: 2, ml: 2 }}>
                                                                {/* Контейнер изделия с рамкой */}
                                                                <Paper
                                                                    sx={{
                                                                        border: '2px solid #4caf50',
                                                                        borderRadius: '4px',
                                                                        p: 1
                                                                    }}
                                                                >
                                                                    {/* Заголовок изделия */}
                                                                    <Box
                                                                        sx={{
                                                                            p: 1,
                                                                            mb: 1,
                                                                            backgroundColor: '#fafafa',
                                                                            borderRadius: '2px'
                                                                        }}
                                                                    >
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                            {(() => {
                                                                                // Фильтруем только настоящие этапы (не изделия без этапов)
                                                                                const actualStages = productTasks.filter(task =>
                                                                                    task.id &&
                                                                                    !task.id.startsWith('product-only-') &&
                                                                                    task.name &&
                                                                                    task.name.trim() !== ''
                                                                                );
                                                                                // Если нет этапов, карточка должна быть свернута и кнопка неактивна
                                                                                const hasStages = actualStages.length > 0;
                                                                                const isCollapsed = collapsedProducts.has(productKey) || !hasStages;

                                                                                return (
                                                                                    <Tooltip title={isCollapsed ? 'Развернуть изделие' : 'Свернуть изделие'}>
                                                                                        <IconButton
                                                                                            size="small"
                                                                                            onClick={() => hasStages && toggleProductCollapse(productKey)}
                                                                                            aria-label={isCollapsed ? 'Развернуть изделие' : 'Свернуть изделие'}
                                                                                            disabled={!hasStages}
                                                                                            disableRipple
                                                                                            sx={{
                                                                                                '&:focus': {
                                                                                                    outline: 'none',
                                                                                                    border: 'none'
                                                                                                },
                                                                                                '&:focus-visible': {
                                                                                                    outline: 'none',
                                                                                                    border: 'none'
                                                                                                },
                                                                                                '&:hover': {
                                                                                                    backgroundColor: 'transparent'
                                                                                                },
                                                                                                '&.Mui-disabled': {
                                                                                                    opacity: 0.5
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            {isCollapsed ? <ExpandMore fontSize="small" /> : <ExpandLess fontSize="small" />}
                                                                                        </IconButton>
                                                                                    </Tooltip>
                                                                                );
                                                                            })()}
                                                                            {/* Кнопка добавления этапа - размер 40x40px */}
                                                                            <VolumeButton
                                                                                onClick={() => handleAddStage(productTasks[0]?.productId || '')}
                                                                                color="green"
                                                                                sx={{
                                                                                    width: '30px',
                                                                                    height: '30px',
                                                                                    minWidth: '30px',
                                                                                    minHeight: '30px',
                                                                                    p: 0,
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    fontSize: '20px'
                                                                                }}
                                                                            >
                                                                                +
                                                                            </VolumeButton>
                                                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                                                                {productName}
                                                                            </Typography>
                                                                            {productDescription && productDescription.trim() !== '' &&
                                                                                productDescription.toLowerCase() !== '[null]' &&
                                                                                productDescription.toLowerCase() !== 'null' && (
                                                                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                                                                                        {productDescription}
                                                                                    </Typography>
                                                                                )}
                                                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: serialNumber ? '#2e7d32' : '#d32f2f' }}>
                                                                                {serialNumber ? `(Сер № ${serialNumber})` : '(Сер № ...)'}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Box>

                                                                    {/* Карточки этапов работ этого изделия */}
                                                                    {(() => {
                                                                        // Фильтруем только настоящие этапы (не изделия без этапов)
                                                                        // Изделия без этапов имеют ID вида "product-only-${productId}" или пустое name
                                                                        const actualStages = productTasks.filter(task =>
                                                                            task.id &&
                                                                            !task.id.startsWith('product-only-') &&
                                                                            task.name &&
                                                                            task.name.trim() !== ''
                                                                        );
                                                                        // Если нет этапов, карточка должна быть свернута
                                                                        const hasStages = actualStages.length > 0;
                                                                        const isCollapsed = collapsedProducts.has(productKey) || !hasStages;

                                                                        // Показываем этапы только если карточка развернута и есть этапы
                                                                        if (isCollapsed || !hasStages) {
                                                                            return null;
                                                                        }

                                                                        // Если есть этапы, показываем их с SortableContext
                                                                        if (actualStages.length > 0) {
                                                                            return (
                                                                                <SortableContext
                                                                                    items={actualStages.map(task => task.id)}
                                                                                    strategy={rectSortingStrategy}
                                                                                >
                                                                                    <Box sx={{
                                                                                        display: 'flex',
                                                                                        flexWrap: 'wrap',
                                                                                        gap: 1,
                                                                                        alignItems: 'flex-start',
                                                                                        minHeight: '60px', // Минимальная высота для стабильности
                                                                                        position: 'relative', // Для правильного позиционирования
                                                                                        overflow: 'hidden', // Скрываем карточки, выходящие за границы изделия
                                                                                        width: '100%' // Полная ширина контейнера
                                                                                    }}>
                                                                                        {actualStages.map((task) => (
                                                                                            <SortableStageCard
                                                                                                key={task.id}
                                                                                                task={task}
                                                                                                onDoubleClick={handleCardClick}
                                                                                                onContextMenu={handleContextMenu}
                                                                                            />
                                                                                        ))}
                                                                                    </Box>
                                                                                </SortableContext>
                                                                            );
                                                                        } else {
                                                                            // Если нет этапов, показываем сообщение или просто пустой блок
                                                                            return (
                                                                                <Box sx={{
                                                                                    p: 2,
                                                                                    textAlign: 'center',
                                                                                    color: 'text.secondary',
                                                                                    fontSize: '0.875rem',
                                                                                    minHeight: '60px',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center'
                                                                                }}>
                                                                                    Нет этапов работ. Нажмите +, чтобы добавить этап.
                                                                                </Box>
                                                                            );
                                                                        }
                                                                    })()}
                                                                </Paper>
                                                            </Box>
                                                        );
                                                    })}

                                                    {/* Сообщение для проектов без изделий (показываем только если проект развернут, но нет изделий) */}
                                                    {!isCollapsed && !hasProducts && (
                                                        <Box sx={{
                                                            p: 2,
                                                            textAlign: 'center',
                                                            color: 'text.secondary',
                                                            fontSize: '0.875rem',
                                                            minHeight: '60px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            ml: 2
                                                        }}>
                                                            Нет изделий. Нажмите +, чтобы добавить изделие.
                                                        </Box>
                                                    )}
                                                </Paper>
                                            </Box>
                                        );
                                    });
                            })()}
                        </Box>
                    ) : (
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            minHeight: '400px',
                            flexDirection: 'column',
                            gap: 2
                        }}>
                            <Typography variant="h6" color="text.secondary">
                                Нет этапов для отображения
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Добавьте этапы работ, чтобы увидеть канбан-доску
                            </Typography>
                        </Box>
                    )}
                </Paper>

                {/* Диалог редактирования этапа работ */}
                <EditStageDialog
                    open={openEditDialog}
                    editing={!!(editingTask && editingTask.id)}
                    stageForm={stageForm}
                    workTypes={workTypes}
                    contractors={contractors}
                    onClose={handleCloseEditDialog}
                    onSave={handleSaveStage}
                    onChange={setStageForm}
                    formatSum={formatSum}
                    sumFieldProps={{ style: { textAlign: 'right' } }}
                />

                {/* Контекстное меню */}
                <Menu
                    open={contextMenu !== null}
                    onClose={handleCloseContextMenu}
                    anchorReference="anchorPosition"
                    anchorPosition={
                        contextMenu !== null
                            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                            : undefined
                    }
                    // Убираем aria-hidden с контейнера меню для соответствия стандартам ARIA
                    slotProps={{
                        root: {
                            'aria-hidden': false
                        },
                        paper: {
                            'aria-hidden': false
                        }
                    }}
                    MenuListProps={{
                        role: 'menu'
                    }}
                >
                    <MenuItem onClick={handleEditFromContextMenu}>
                        <ListItemIcon>
                            <Edit fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Редактировать</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleDeleteStage}>
                        <ListItemIcon>
                            <Delete fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Удалить</ListItemText>
                    </MenuItem>
                </Menu>
            </Box>
        </DndContext>
    );
};

export default KanbanBoard;
