import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, MenuItem, Menu, ListItemIcon, ListItemText, Chip, Checkbox, FormControlLabel } from '@mui/material';
import { Refresh, Edit, Delete, ExpandLess, ExpandMore, Build, CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import emailIcon from '../assets/e-mail_180.png';
import VolumeButton from './VolumeButton';
import EditStageDialog from './EditStageDialog';
import ProjectDialog, { type ProjectFormData } from './ProjectDialog';
import ProductDialog, { type ProductFormData } from './ProductDialog';
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
    verticalListSortingStrategy,
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
    productStatus?: string; // Статус изделия
    projectStatus?: string;
    assigneeId?: string | null;
    workTypeId?: string | null;
    orderIndex?: number; // Индекс порядка этапа работ
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

// Компонент для сортируемой карточки проекта
interface SortableProjectCardProps {
    projectId: string;
    children: React.ReactNode;
}

const SortableProjectCard: React.FC<SortableProjectCardProps> = ({
    projectId,
    children
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useSortable({ id: `project-${projectId}` });

    // Определяем, есть ли смещение для анимации
    const hasTransform = transform && (transform.x !== 0 || transform.y !== 0);

    // Ограничиваем движение только по вертикали (только по оси Y)
    const verticalTransform = transform ? { ...transform, x: 0 } : null;

    const style = {
        transform: verticalTransform ? CSS.Transform.toString(verticalTransform) : undefined,
        transition: isDragging ? 'none' : hasTransform ? 'transform 0.2s ease' : 'none',
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    };

    return (
        <Box
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            sx={{
                mb: 1,
                cursor: isDragging ? 'grabbing' : 'grab',
                '&:hover': {
                    transform: !isDragging ? 'translateY(-2px)' : 'none',
                    transition: 'transform 0.2s ease'
                }
            }}
        >
            {children}
        </Box>
    );
};

// Компонент для сортируемой карточки изделия
interface SortableProductCardProps {
    productId: string;
    productName: string;
    productOrderIndex: number;
    projectId: string;
    children: React.ReactNode;
}

const SortableProductCard: React.FC<SortableProductCardProps> = ({
    productId,
    children
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useSortable({ id: `product-${productId}` });

    // Определяем, есть ли смещение для анимации
    const hasTransform = transform && (transform.x !== 0 || transform.y !== 0);

    // Ограничиваем движение только по вертикали (только по оси Y)
    const verticalTransform = transform ? { ...transform, x: 0 } : null;

    const style = {
        transform: verticalTransform ? CSS.Transform.toString(verticalTransform) : undefined,
        transition: isDragging ? 'none' : hasTransform ? 'transform 0.2s ease' : 'none',
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    };

    return (
        <Box
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            sx={{
                mb: 1,
                ml: 1,
                cursor: isDragging ? 'grabbing' : 'grab',
                '&:hover': {
                    transform: !isDragging ? 'translateY(-2px)' : 'none',
                    transition: 'transform 0.2s ease'
                }
            }}
        >
            {children}
        </Box>
    );
};

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
    // Локальное состояние для этапов каждого изделия (как в ProductCard)
    // Ключ: productId, значение: массив этапов в правильном порядке
    const [productStagesMap, setProductStagesMap] = useState<Map<string, KanbanTask[]>>(new Map());
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
    const statusFiltersKey = `kanban-${userId ?? 'anon'}-status-filters`;
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

    // Состояние для якорей меню статусов проектов
    const [statusMenuAnchor, setStatusMenuAnchor] = useState<{ [key: string]: HTMLElement | null }>({});

    // Состояние для фильтров статусов проектов с загрузкой из localStorage
    const [statusFilters, setStatusFilters] = useState<{
        InProject: boolean;
        InProgress: boolean;
        Done: boolean;
        HasProblems: boolean;
        Archived: boolean;
    }>(() => {
        try {
            const raw = localStorage.getItem(statusFiltersKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Проверяем, что все необходимые поля присутствуют
                return {
                    InProject: parsed.InProject !== undefined ? parsed.InProject : true,
                    InProgress: parsed.InProgress !== undefined ? parsed.InProgress : true,
                    Done: parsed.Done !== undefined ? parsed.Done : true,
                    HasProblems: parsed.HasProblems !== undefined ? parsed.HasProblems : true,
                    Archived: parsed.Archived !== undefined ? parsed.Archived : true
                };
            }
        } catch {
            // Игнорируем ошибки парсинга
        }
        // Значения по умолчанию
        return {
            InProject: true,
            InProgress: true,
            Done: true,
            HasProblems: true,
            Archived: true
        };
    });

    // Сохранение фильтров статусов в localStorage при изменении
    useEffect(() => {
        try {
            localStorage.setItem(statusFiltersKey, JSON.stringify(statusFilters));
        } catch {
            // Игнорируем ошибки сохранения
        }
    }, [statusFilters, statusFiltersKey]);

    // Обработчик изменения фильтров статусов
    const handleStatusFilterChange = (status: keyof typeof statusFilters) => {
        setStatusFilters(prev => ({
            ...prev,
            [status]: !prev[status]
        }));
    };

    // Функция для получения цвета статуса проекта
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'InProject': return 'warning';
            case 'InProgress': return 'primary';
            case 'Done': return 'success';
            case 'HasProblems': return 'error';
            case 'Archived': return 'default';
            default: return 'default';
        }
    };

    // Функция для получения текста статуса проекта
    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'InProject': return 'В проекте';
            case 'InProgress': return 'В работе';
            case 'Done': return 'Готово';
            case 'HasProblems': return 'Проблемы';
            case 'Archived': return 'Архив';
            default: return 'Неизвестно';
        }
    };

    // Обработчик открытия меню статуса
    const handleStatusMenuOpen = (event: React.MouseEvent<HTMLElement>, projectId: string) => {
        setStatusMenuAnchor(prev => ({ ...prev, [projectId]: event.currentTarget }));
    };

    // Обработчик закрытия меню статуса
    const handleStatusMenuClose = (projectId: string) => {
        setStatusMenuAnchor(prev => ({ ...prev, [projectId]: null }));
    };

    // Переключение свёрнутости карточки — отключено
    // Переключение свёрнутости проекта
    const toggleProjectCollapse = (projectId: string) => {
        setCollapsedProjects((prev) => {
            const next = new Set(prev);
            if (next.has(projectId)) next.delete(projectId); else next.add(projectId);
            try { localStorage.setItem(projectsKey, JSON.stringify(Array.from(next))); } catch {
                // Игнорируем ошибки сохранения в localStorage
            }
            return next;
        });
    };
    // Переключение свёрнутости изделия
    const toggleProductCollapse = (productKeyStr: string) => {
        setCollapsedProducts((prev) => {
            const next = new Set(prev);
            if (next.has(productKeyStr)) next.delete(productKeyStr); else next.add(productKeyStr);
            try { localStorage.setItem(productsKey, JSON.stringify(Array.from(next))); } catch {
                // Игнорируем ошибки сохранения в localStorage
            }
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

    // Состояние для меню статуса изделия
    const [productStatusMenu, setProductStatusMenu] = useState<{
        anchorEl: HTMLElement | null;
        productId: string;
    } | null>(null);

    // Состояние для диалога создания/редактирования проекта
    const [openProjectDialog, setOpenProjectDialog] = useState(false);
    const [editingProject, setEditingProject] = useState<{ id: string; name: string; managerId: string; status: string } | null>(null);
    const [projectForm, setProjectForm] = useState<ProjectFormData>({
        name: '',
        managerId: '',
        status: 'InProject'
    });
    const [managers, setManagers] = useState<Array<{
        id: string;
        lastName: string;
        firstName: string;
        middleName?: string | null;
    }>>([]);

    // Состояние для диалога создания/редактирования изделия
    const [openProductDialog, setOpenProductDialog] = useState(false);
    const [editingProduct, setEditingProduct] = useState<{ id: string; projectId: string; productId: string; version?: number } | null>(null);
    const [productForm, setProductForm] = useState<ProductFormData>({
        productId: '',
        productName: '',
        description: '', // Описание изделия
        serialNumber: '',
        quantity: 1,
        link: ''
    });
    const [catalogProducts, setCatalogProducts] = useState<Array<{ id: string, name: string }>>([]); // Каталог изделий для выпадающего списка
    // Состояние для хранения ссылок на модели по productId
    const [productModelLinks, setProductModelLinks] = useState<Record<string, Array<{ id: string; name: string; url: string; createdAt: string }>>>({});

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
                // console.error('❌ Ошибка ответа:', errorText);
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
                        // console.warn('⚠️ Невалидная дата для этапа:', stage);
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
                    productStatus: stage.productStatus || 'InProject', // Статус изделия
                    projectStatus: stage.projectStatus, // Статус проекта
                    orderIndex: stage.orderIndex || 0, // Индекс порядка этапа работ
                    projectManager: stage.projectManager || null
                };
            }).filter(Boolean);

            // console.log('🎯 Преобразованные задачи:', tasks);
            // console.log('🔍 Количество задач:', tasks.length);

            // Порядок уже отсортирован в API по orderIndex
            setKanbanTasks(tasks);

            // Создаем локальное состояние для этапов каждого изделия (как в ProductCard)
            const stagesMap = new Map<string, KanbanTask[]>();
            tasks.forEach(task => {
                if (task.productId &&
                    task.id &&
                    !task.id.startsWith('product-only-') &&
                    task.name &&
                    task.name.trim() !== '') {
                    if (!stagesMap.has(task.productId)) {
                        stagesMap.set(task.productId, []);
                    }
                    stagesMap.get(task.productId)!.push(task);
                }
            });
            // Сортируем этапы каждого изделия по orderIndex
            stagesMap.forEach((stages) => {
                stages.sort((a, b) => {
                    const orderA = a.orderIndex ?? 999999;
                    const orderB = b.orderIndex ?? 999999;
                    return orderA - orderB;
                });
            });
            setProductStagesMap(stagesMap);

            // Загружаем ссылки на модели для всех изделий
            const uniqueProductIds = Array.from(new Set(tasks.map(t => t.productId).filter(Boolean) as string[]));
            await fetchModelLinksForProducts(uniqueProductIds);
        } catch (err) {
            // console.error('Ошибка загрузки данных канбан-доски:', err);
            setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    };

    // Функция для загрузки ссылок на модели для всех изделий
    const fetchModelLinksForProducts = async (productIds: string[]) => {
        try {
            const token = localStorage.getItem('token');
            if (!token || productIds.length === 0) return;

            const linksMap: Record<string, Array<{ id: string; name: string; url: string; createdAt: string }>> = {};

            // Загружаем ссылки для каждого изделия
            await Promise.all(productIds.map(async (productId) => {
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/products/${productId}/model-links`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const links = await response.json();
                        linksMap[productId] = links;
                    }
                } catch (error) {
                    console.error(`Ошибка загрузки ссылок для изделия ${productId}:`, error);
                }
            }));

            setProductModelLinks(linksMap);
        } catch (error) {
            console.error('Ошибка загрузки ссылок на модели:', error);
        }
    };

    // Загружаем данные при монтировании компонента
    useEffect(() => {
        fetchKanbanData();
        fetchManagers(); // Загружаем менеджеров проектов
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
            // console.error('Ошибка загрузки видов работ:', error);
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
            // console.error('Ошибка загрузки подрядчиков:', error);
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

            // Вычисляем дату окончания: дата начала + (срок - 1) дней
            // Например: startDate=01.11, duration=1 -> endDate=01.11 (дата начала считается как 1 день)
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
            // console.error('Ошибка сохранения этапа:', error);
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
            if (activeTask && overTask && activeTask.productId === overTask.productId && activeTask.productId) {
                const productId = activeTask.productId;

                // Берем этапы этого изделия из локального состояния (как в ProductCard)
                const productStages = productStagesMap.get(productId) || [];

                // Находим индексы для перемещения в массиве этапов этого изделия (как в ProductCard)
                const oldIndex = productStages.findIndex((task) => task.id === active.id);
                const newIndex = productStages.findIndex((task) => task.id === over.id);

                if (oldIndex === -1 || newIndex === -1) {
                    return;
                }

                // 🔄 ПЕРЕМЕЩАЕМ КАРТОЧКУ В НОВОЕ ПОЛОЖЕНИЕ (точно как в ProductCard)
                const newProductStages = arrayMove(productStages, oldIndex, newIndex);

                // Обновляем orderIndex для всех этапов
                const updatedProductStages = newProductStages.map((stage, index) => ({
                    ...stage,
                    orderIndex: index
                }));

                // СНАЧАЛА обновляем локальное состояние для анимации (как в ProductCard)
                const newProductStagesMap = new Map(productStagesMap);
                newProductStagesMap.set(productId, updatedProductStages);
                setProductStagesMap(newProductStagesMap);

                // Обновляем глобальный массив kanbanTasks для синхронизации
                setKanbanTasks((currentTasks) => {
                    return currentTasks.map(task => {
                        if (task.productId === productId &&
                            task.id &&
                            !task.id.startsWith('product-only-') &&
                            task.name &&
                            task.name.trim() !== '') {
                            const updatedStage = updatedProductStages.find(s => s.id === task.id);
                            return updatedStage || task;
                        }
                        return task;
                    });
                });

                // Сохраняем порядок на сервере (как в ProductCard - сразу после обновления состояния)
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        return;
                    }

                    const stagesWithOrder = updatedProductStages.map((task, index) => ({
                        id: task.id,
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
                        // При ошибке откатываем изменения (как в ProductCard)
                        await fetchKanbanData();
                    }
                } catch (error) {
                    // При ошибке откатываем изменения (как в ProductCard)
                    await fetchKanbanData();
                }
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

    // Обработчик перетаскивания изделий
    const handleDragEndProducts = async (event: any, _projectId: string, sortedProducts: Array<[string, KanbanTask[]]>) => {
        const { active, over } = event;

        // Проверяем, что перетаскивание завершилось успешно и это изделие
        if (active.id !== over?.id && over?.id &&
            active.id.toString().startsWith('product-') &&
            over.id.toString().startsWith('product-')) {

            // Извлекаем productId из id (формат: product-{productId})
            const activeProductId = active.id.toString().replace('product-', '');
            const overProductId = over.id.toString().replace('product-', '');

            // Находим индексы изделий
            const oldIndex = sortedProducts.findIndex(([key]) => key === activeProductId);
            const newIndex = sortedProducts.findIndex(([key]) => key === overProductId);

            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                // Перемещаем изделия в новом порядке
                const newSortedProducts = arrayMove(sortedProducts, oldIndex, newIndex);

                // Оптимистично обновляем локальное состояние kanbanTasks
                // Обновляем productOrderIndex для всех задач соответствующих изделий
                const updatedTasks = kanbanTasks.map(task => {
                    const newProductIndex = newSortedProducts.findIndex(([productKey]) => productKey === task.productId);
                    if (newProductIndex !== -1) {
                        return {
                            ...task,
                            productOrderIndex: newProductIndex
                        };
                    }
                    return task;
                });
                setKanbanTasks(updatedTasks);

                // Формируем массив для API с новыми orderIndex
                // productKey в sortedProducts - это productId из KanbanTask, который является ID ProjectProduct
                const productOrders = newSortedProducts.map(([productKey], index) => {
                    // productKey - это уже ID ProjectProduct (из KanbanTask.productId)
                    return {
                        id: productKey, // ID ProjectProduct
                        orderIndex: index
                    };
                }).filter(item => item.id); // Убираем пустые

                // Сохраняем порядок через API
                await saveProductOrder(productOrders);
            }
        }
    };

    // Функция обновления статуса проекта
    const handleUpdateProjectStatus = async (projectId: string, newStatus: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // console.error('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: newStatus
                })
            });

            if (!response.ok) {
                throw new Error('Ошибка обновления статуса проекта');
            }

            // Обновляем статус в локальном состоянии
            const updatedTasks = kanbanTasks.map(task => {
                if (task.projectId === projectId) {
                    return {
                        ...task,
                        projectStatus: newStatus
                    };
                }
                return task;
            });
            setKanbanTasks(updatedTasks);
        } catch (error) {
            // console.error('Ошибка обновления статуса проекта:', error);
            // При ошибке обновляем данные, чтобы восстановить правильное состояние
            await fetchKanbanData();
        }
    };

    // Функция сохранения порядка проектов
    const saveProjectOrder = async (projectOrders: Array<{ id: string; orderIndex: number }>) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // console.error('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/reorder`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ projectOrders })
            });

            if (!response.ok) {
                throw new Error('Ошибка сохранения порядка проектов');
            }

            // Не обновляем данные с сервера, так как мы уже оптимистично обновили локальное состояние
            // Это предотвращает "подпрыгивание" элементов
            // Данные будут обновлены при следующей загрузке или при других действиях
        } catch (error) {
            // console.error('Ошибка сохранения порядка проектов:', error);
            // При ошибке обновляем данные, чтобы восстановить правильное состояние
            await fetchKanbanData();
        }
    };

    // Функция обработки перетаскивания проектов
    const handleDragEndProjects = async (event: any, sortedProjects: Array<[string, KanbanTask[]]>) => {
        const { active, over } = event;

        // Проверяем, что перетаскивание завершилось успешно и это проект
        if (active.id !== over?.id && over?.id &&
            active.id.toString().startsWith('project-') &&
            over.id.toString().startsWith('project-')) {

            // Извлекаем projectId из id (формат: project-{projectId})
            const activeProjectId = active.id.toString().replace('project-', '');
            const overProjectId = over.id.toString().replace('project-', '');

            // Находим индексы проектов
            const oldIndex = sortedProjects.findIndex(([key]) => key === activeProjectId);
            const newIndex = sortedProjects.findIndex(([key]) => key === overProjectId);

            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                // Перемещаем проекты в новом порядке
                const newSortedProjects = arrayMove(sortedProjects, oldIndex, newIndex);

                // Оптимистично обновляем локальное состояние kanbanTasks
                // Обновляем projectOrderIndex для всех задач соответствующих проектов
                const updatedTasks = kanbanTasks.map(task => {
                    const newProjectIndex = newSortedProjects.findIndex(([projectKey]) => projectKey === task.projectId);
                    if (newProjectIndex !== -1) {
                        return {
                            ...task,
                            projectOrderIndex: newProjectIndex
                        };
                    }
                    return task;
                });
                setKanbanTasks(updatedTasks);

                // Формируем массив для API с новыми orderIndex
                // projectKey в sortedProjects - это projectId из KanbanTask
                const projectOrders = newSortedProjects.map(([projectKey], index) => {
                    // projectKey - это ID Project
                    return {
                        id: projectKey, // ID Project
                        orderIndex: index
                    };
                }).filter(item => item.id); // Убираем пустые

                // Сохраняем порядок через API
                await saveProjectOrder(projectOrders);
            }
        }
    };

    // Функция сохранения порядка изделий
    const saveProductOrder = async (productOrders: Array<{ id: string; orderIndex: number }>) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // console.error('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/products/reorder`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productOrders })
            });

            if (!response.ok) {
                throw new Error('Ошибка сохранения порядка изделий');
            }

            // Не обновляем данные с сервера, так как мы уже оптимистично обновили локальное состояние
            // Это предотвращает "подпрыгивание" элементов
            // Данные будут обновлены при следующей загрузке или при других действиях
        } catch (error) {
            // console.error('Ошибка сохранения порядка изделий:', error);
            // При ошибке обновляем данные, чтобы восстановить правильное состояние
            await fetchKanbanData();
        }
    };


    // Загрузка каталога изделий из конкретного проекта (только уникальные названия)
    const fetchCatalogProducts = async (projectId: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Загружаем изделия только из указанного проекта
            const productsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/products`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!productsResponse.ok) {
                // console.error('Ошибка загрузки изделий для проекта');
                setCatalogProducts([]);
                return;
            }

            const products = await productsResponse.json();

            // Собираем уникальные изделия по названию (только для данного проекта)
            const uniqueProductsMap = new Map<string, { id: string, name: string }>();

            products.forEach((product: any) => {
                if (product.product?.id && product.product?.name) {
                    const nameKey = product.product.name.trim().toLowerCase();
                    // Если название еще не добавлено, добавляем его
                    if (!uniqueProductsMap.has(nameKey)) {
                        uniqueProductsMap.set(nameKey, {
                            id: product.product.id,
                            name: product.product.name
                        });
                    }
                }
            });

            const uniqueProducts = Array.from(uniqueProductsMap.values());
            setCatalogProducts(uniqueProducts);
        } catch (error) {
            // console.error('Ошибка загрузки каталога изделий:', error);
            setCatalogProducts([]);
        }
    };

    // Обработчик открытия диалога создания изделия
    const handleAddProduct = async (projectId: string) => {
        // Загружаем каталог изделий только для данного проекта
        await fetchCatalogProducts(projectId);

        // Открываем диалог создания изделия
        setProductForm({
            productId: '',
            productName: '',
            description: '',
            serialNumber: '',
            quantity: 1,
            link: ''
        });
        // Сохраняем projectId для создания изделия (id пустой = создание)
        setEditingProduct({ id: '', projectId, productId: '' });
        setOpenProductDialog(true);
    };

    // Обработчик открытия диалога редактирования изделия
    const handleEditProduct = async (projectId: string, projectProductId: string) => {
        try {
            // Загружаем данные изделия (projectProductId - это ID ProjectProduct, не CatalogProduct)
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Токен не найден');
                return;
            }

            // Используем эндпоинт /projects/products/:productId для получения ProjectProduct
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/products/${projectProductId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();

                // Загружаем каталог изделий только для данного проекта
                await fetchCatalogProducts(projectId);

                // Заполняем форму данными изделия
                // data.productId - это ID CatalogProduct (из справочника)
                // projectProductId - это ID ProjectProduct (запись в проекте)
                setEditingProduct({
                    id: projectProductId,
                    projectId,
                    productId: data.product?.id || '',
                    version: data.version || 1
                });
                setProductForm({
                    productId: data.product?.id || '',
                    productName: data.product?.name || '',
                    description: data.product?.description || '',
                    serialNumber: data.serialNumber || '',
                    quantity: data.quantity || 1,
                    link: data.description || ''
                });
                setOpenProductDialog(true);
            } else {
                await response.text();
                // console.error('Ошибка загрузки данных изделия:', response.status);
                alert(`Ошибка загрузки данных изделия: ${response.status}`);
            }
        } catch (error) {
            // console.error('Ошибка загрузки данных изделия:', error);
            alert('Ошибка загрузки данных изделия');
        }
    };

    // Обработчик сохранения изделия
    const handleSaveProduct = async () => {
        try {
            // Валидация
            if (!productForm.productName.trim()) {
                alert('Пожалуйста, введите или выберите изделие');
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                alert('Токен не найден');
                return;
            }

            if (!editingProduct) {
                alert('Ошибка: не указан проект для создания изделия');
                return;
            }

            const projectId = editingProduct.projectId;
            if (!projectId) {
                alert('Ошибка: не указан проект');
                return;
            }

            // Если введено вручную, сначала проверяем существование или создаём изделие в справочнике
            let catalogProductId = productForm.productId;

            if (!catalogProductId && productForm.productName.trim()) {
                try {
                    // Сначала проверяем, существует ли изделие с таким названием
                    const searchResponse = await fetch(
                        `${import.meta.env.VITE_API_BASE_URL}/catalog-products?query=${encodeURIComponent(productForm.productName.trim())}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        }
                    );

                    if (searchResponse.ok) {
                        const existingProducts = await searchResponse.json();
                        // Ищем точное совпадение (без учета регистра)
                        const exactMatch = existingProducts.find((p: any) =>
                            p.name.trim().toLowerCase() === productForm.productName.trim().toLowerCase()
                        );

                        if (exactMatch) {
                            catalogProductId = exactMatch.id;
                            // Обновляем описание, если оно изменилось
                            if (productForm.description?.trim() !== (exactMatch.description || '')) {
                                try {
                                    await fetch(`${import.meta.env.VITE_API_BASE_URL}/catalog-products/${exactMatch.id}`, {
                                        method: 'PUT',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${token}`
                                        },
                                        body: JSON.stringify({
                                            description: productForm.description?.trim() || null
                                        })
                                    });
                                } catch (error) {
                                    // console.error('Ошибка обновления описания изделия:', error);
                                    // Продолжаем работу даже если не удалось обновить описание
                                }
                            }
                        } else {
                            // Создаём новое изделие в справочнике
                            const createProductResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/catalog-products`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    name: productForm.productName.trim(),
                                    description: productForm.description?.trim() || undefined,
                                    isActive: true
                                })
                            });

                            if (!createProductResponse.ok) {
                                throw new Error('Ошибка создания изделия в справочнике');
                            }

                            const newProduct = await createProductResponse.json();
                            catalogProductId = newProduct.id;
                        }
                    }
                } catch (error) {
                    // console.error('Ошибка при создании/поиске изделия в справочнике:', error);
                    alert('Произошла ошибка при создании изделия в справочнике');
                    return;
                }
            }

            if (!catalogProductId) {
                alert('Ошибка: не удалось определить ID изделия. Пожалуйста, попробуйте снова.');
                return;
            }

            // Создание или обновление изделия в проекте
            if (editingProduct.id && editingProduct.id.trim() !== '') {
                // Обновление существующего изделия (editingProduct.id - это ID ProjectProduct)
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/products/${editingProduct.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        productId: catalogProductId,
                        serialNumber: productForm.serialNumber || undefined,
                        quantity: productForm.quantity,
                        version: editingProduct.version || 1
                    })
                });

                if (response.ok) {
                    // Обновляем описание изделия в справочнике, если оно изменилось
                    if (catalogProductId && productForm.description !== undefined) {
                        try {
                            await fetch(`${import.meta.env.VITE_API_BASE_URL}/catalog-products/${catalogProductId}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    description: productForm.description?.trim() || null
                                })
                            });
                        } catch (error) {
                            // console.error('Ошибка обновления описания изделия:', error);
                            // Не показываем ошибку пользователю, т.к. основное сохранение прошло успешно
                        }
                    }
                    alert('Изделие успешно обновлено');
                    setOpenProductDialog(false);
                    setEditingProduct(null);
                    await fetchKanbanData(); // Обновляем данные Kanban
                } else {
                    const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
                    alert(`Ошибка при обновлении изделия: ${JSON.stringify(errorData)}`);
                }
            } else {
                // Создание нового изделия
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/products`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        productId: catalogProductId,
                        serialNumber: productForm.serialNumber || undefined,
                        quantity: productForm.quantity
                    })
                });

                if (response.ok) {
                    // Обновляем описание изделия в справочнике, если оно изменилось
                    if (catalogProductId && productForm.description !== undefined) {
                        try {
                            await fetch(`${import.meta.env.VITE_API_BASE_URL}/catalog-products/${catalogProductId}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    description: productForm.description?.trim() || null
                                })
                            });
                        } catch (error) {
                            // console.error('Ошибка обновления описания изделия:', error);
                            // Не показываем ошибку пользователю, т.к. основное сохранение прошло успешно
                        }
                    }
                    alert('Изделие успешно создано');
                    setOpenProductDialog(false);
                    setEditingProduct(null);
                    await fetchKanbanData(); // Обновляем данные Kanban
                } else {
                    const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
                    alert(`Ошибка при создании изделия: ${JSON.stringify(errorData)}`);
                }
            }
        } catch (error) {
            // console.error('Ошибка сохранения изделия:', error);
            alert('Ошибка при сохранении изделия');
        }
    };

    // Обработчик закрытия диалога изделия
    const handleCloseProductDialog = () => {
        setOpenProductDialog(false);
        setEditingProduct(null);
        setProductForm({
            productId: '',
            productName: '',
            description: '',
            serialNumber: '',
            quantity: 1,
            link: ''
        });
    };

    // Обработчик клика по кнопке добавления этапа работ
    const handleAddStage = (productId: string) => {
        // console.log('Добавить этап работ в изделие:', productId);

        // Определяем начальную дату: если есть этапы для этого изделия - берем последнюю дату окончания + 1 день, иначе - сегодня
        let initialStartDate = new Date().toISOString().split('T')[0];
        const productStages = kanbanTasks.filter(task => task.productId === productId);
        if (productStages && productStages.length > 0) {
            // Находим самую позднюю дату окончания среди всех этапов изделия
            const latestEndDate = productStages.reduce((latest, task) => {
                if (task.end) {
                    const endDate = new Date(task.end);
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

        // Устанавливаем форму с вычисленной начальной датой
        setStageForm({
            sum: '',
            hours: '',
            startDate: initialStartDate,
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

    // Обработчики меню статуса изделия
    const handleProductStatusMenuOpen = (event: React.MouseEvent<HTMLElement>, productId: string) => {
        event.stopPropagation();
        setProductStatusMenu({
            anchorEl: event.currentTarget,
            productId
        });
    };

    const handleProductStatusMenuClose = () => {
        setProductStatusMenu(null);
    };

    const handleProductStatusChange = async (productId: string, newStatus: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Получаем текущую версию изделия и projectId
            const productTask = kanbanTasks.find(t => t.productId === productId);
            if (!productTask || !productTask.projectId) return;

            // Оптимистично обновляем статус изделия в локальном состоянии
            const updatedTasks = kanbanTasks.map(task => {
                if (task.productId === productId) {
                    return {
                        ...task,
                        productStatus: newStatus
                    };
                }
                return task;
            });
            setKanbanTasks(updatedTasks);

            // Получаем текущую версию изделия с сервера
            const productsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/${productTask.projectId}/products`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const products = await productsResponse.json();
            const product = products.find((p: any) => p.id === productId);

            if (!product) {
                // console.error('Изделие не найдено');
                return;
            }

            // Обновляем статус, сохраняя orderIndex
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/${productTask.projectId}/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    version: product.version || 1,
                    status: newStatus,
                    orderIndex: product.orderIndex || 0 // Сохраняем текущий orderIndex
                })
            });

            if (!response.ok) {
                throw new Error('Ошибка обновления статуса');
            }

            // Не обновляем данные с сервера, так как мы уже оптимистично обновили локальное состояние
            // Это предотвращает визуальные "подпрыгивания" элементов
        } catch (error) {
            // console.error('Ошибка обновления статуса изделия:', error);
            // При ошибке обновляем данные, чтобы восстановить правильное состояние
            await fetchKanbanData();
        } finally {
            handleProductStatusMenuClose();
        }
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    // Загрузка менеджеров проектов
    const fetchManagers = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

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
            // console.error('Ошибка загрузки руководителей:', error);
        }
    };

    // Обработчик открытия диалога создания проекта
    const handleAddProject = () => {
        setEditingProject(null);
        setProjectForm({
            name: '',
            managerId: '',
            status: 'InProject'
        });
        setOpenProjectDialog(true);
    };

    // Обработчик открытия диалога редактирования проекта
    const handleEditProject = async (projectId: string, projectName: string, status: string) => {
        try {
            // Загружаем данные проекта для получения managerId
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const managerId = data.projectManager?.id || '';
                setEditingProject({ id: projectId, name: projectName, managerId, status });
                setProjectForm({
                    name: projectName,
                    managerId: managerId,
                    status: status as 'InProject' | 'InProgress' | 'Done' | 'HasProblems'
                });
                setOpenProjectDialog(true);
            } else {
                alert('Ошибка загрузки данных проекта');
            }
        } catch (error) {
            // console.error('Ошибка загрузки данных проекта:', error);
            alert('Ошибка загрузки данных проекта');
        }
    };

    // Обработчик сохранения проекта
    const handleSaveProject = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Токен не найден');
                return;
            }

            if (!editingProject) {
                // Создание нового проекта
                const userId = getUserId();
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: projectForm.name,
                        projectManagerId: projectForm.managerId || null,
                        status: projectForm.status,
                        ownerId: userId || ''
                    })
                });

                if (response.ok) {
                    alert('Проект успешно создан');
                    setOpenProjectDialog(false);
                    await fetchKanbanData(); // Обновляем данные Kanban
                } else {
                    alert('Ошибка при создании проекта');
                }
            } else {
                // Обновление существующего проекта
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/${editingProject.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: projectForm.name,
                        projectManagerId: projectForm.managerId || null,
                        status: projectForm.status
                    })
                });

                if (response.ok) {
                    alert('Проект успешно обновлен');
                    setOpenProjectDialog(false);
                    setEditingProject(null);
                    await fetchKanbanData(); // Обновляем данные Kanban
                } else {
                    alert('Ошибка при обновлении проекта');
                }
            }
        } catch (error) {
            // console.error('Ошибка обновления проекта:', error);
            alert('Ошибка при обновлении проекта');
        }
    };

    // Обработчик закрытия диалога проекта
    const handleCloseProjectDialog = () => {
        setOpenProjectDialog(false);
        setEditingProject(null);
        setProjectForm({
            name: '',
            managerId: '',
            status: 'InProject'
        });
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
            // console.error('Ошибка удаления этапа:', error);
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
            <Box sx={{ minHeight: '600px', minWidth: '1400px', maxWidth: '1400px' }}>
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
                            <Box sx={{ mb: 2 }}>
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 0,
                                    flexWrap: 'wrap'
                                }}
                                >
                                    <Typography variant="h6" sx={{ minWidth: 'fit-content', fontSize: '22px', fontWeight: 'bold' }}>
                                        Проекты, изделия и этапы работ
                                    </Typography>
                                    {/* Фильтры статусов проектов */}
                                    {(() => {
                                        // Подсчитываем количество проектов по статусам
                                        const projectsByStatus = new Map<string, number>();
                                        kanbanTasks.forEach(task => {
                                            const status = task.projectStatus || 'InProject';
                                            projectsByStatus.set(status, (projectsByStatus.get(status) || 0) + 1);
                                        });
                                        // Получаем уникальные проекты для подсчета
                                        const uniqueProjects = new Set(kanbanTasks.map(task => task.projectId).filter(Boolean));
                                        const projectStatusCounts = new Map<string, number>();
                                        uniqueProjects.forEach(projectId => {
                                            const task = kanbanTasks.find(t => t.projectId === projectId);
                                            if (task) {
                                                const status = task.projectStatus || 'InProject';
                                                projectStatusCounts.set(status, (projectStatusCounts.get(status) || 0) + 1);
                                            }
                                        });

                                        return (
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                flexWrap: 'wrap',
                                                flex: 1,
                                                justifyContent: 'center'
                                            }}
                                            >

                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={statusFilters.InProject}
                                                            onChange={() => handleStatusFilterChange('InProject')}
                                                            color="default"
                                                        />
                                                    }
                                                    label={
                                                        <Chip
                                                            label="В проекте"
                                                            size="small"
                                                            sx={{
                                                                borderRadius: '6px',
                                                                backgroundColor: '#FFE082',
                                                                color: '#000',
                                                                width: '80px',
                                                                '& .MuiChip-label': {
                                                                    padding: '0px 4px'
                                                                }
                                                            }}
                                                        />
                                                    }
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={statusFilters.InProgress}
                                                            onChange={() => handleStatusFilterChange('InProgress')}
                                                            color="primary"
                                                        />
                                                    }
                                                    label={
                                                        <Chip
                                                            label="В работе"
                                                            color="primary"
                                                            size="small"
                                                            sx={{
                                                                borderRadius: '6px', width: '80px',
                                                                '& .MuiChip-label': {
                                                                    padding: '0px 4px'
                                                                }

                                                            }}
                                                        />
                                                    }
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={statusFilters.Done}
                                                            onChange={() => handleStatusFilterChange('Done')}
                                                            color="success"
                                                        />
                                                    }
                                                    label={
                                                        <Chip
                                                            label="Готово"
                                                            color="success"
                                                            size="small"
                                                            sx={{
                                                                borderRadius: '6px', width: '80px',
                                                                '& .MuiChip-label': {
                                                                    padding: '0px 4px'
                                                                }
                                                            }}
                                                        />
                                                    }
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={statusFilters.HasProblems}
                                                            onChange={() => handleStatusFilterChange('HasProblems')}
                                                            color="error"
                                                        />
                                                    }
                                                    label={
                                                        <Chip
                                                            label="Проблемы"
                                                            color="error"
                                                            size="small"
                                                            sx={{
                                                                borderRadius: '6px', width: '80px',
                                                                '& .MuiChip-label': {
                                                                    padding: '0px 4px'
                                                                }
                                                            }}
                                                        />
                                                    }
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={statusFilters.Archived}
                                                            onChange={() => handleStatusFilterChange('Archived')}
                                                            color="default"
                                                        />
                                                    }
                                                    label={
                                                        <Chip
                                                            label="Архив"
                                                            size="small"
                                                            sx={{
                                                                borderRadius: '6px',
                                                                width: '80px',
                                                                backgroundColor: '#9e9e9e',
                                                                color: '#fff',
                                                                '& .MuiChip-label': {
                                                                    padding: '0px 4px'
                                                                }
                                                            }}
                                                        />
                                                    }
                                                />
                                                <Tooltip title="Показать все">
                                                    <span>
                                                        <VolumeButton
                                                            onClick={() => setStatusFilters({ InProject: true, InProgress: true, Done: true, HasProblems: true, Archived: true })}
                                                            disabled={statusFilters.InProject && statusFilters.InProgress && statusFilters.Done && statusFilters.HasProblems && statusFilters.Archived}
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
                                                            <CheckBox fontSize="small" />
                                                        </VolumeButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title="Скрыть все">
                                                    <span>
                                                        <VolumeButton
                                                            onClick={() => setStatusFilters({ InProject: false, InProgress: false, Done: false, HasProblems: false, Archived: false })}
                                                            disabled={!statusFilters.InProject && !statusFilters.InProgress && !statusFilters.Done && !statusFilters.HasProblems && !statusFilters.Archived}
                                                            sx={{
                                                                width: '30px',
                                                                height: '30px',
                                                                minWidth: '30px',
                                                                minHeight: '30px',
                                                                p: 0,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '20px',
                                                                backgroundColor: '#9e9e9e',
                                                                color: 'white',
                                                                border: '2px solid #757575',
                                                                '&:hover': {
                                                                    backgroundColor: '#757575'
                                                                },
                                                                '&.Mui-disabled': {
                                                                    backgroundColor: '#9e9e9e',
                                                                    color: 'white',
                                                                    opacity: 0.6
                                                                }
                                                            }}
                                                        >
                                                            <CheckBoxOutlineBlank fontSize="small" />
                                                        </VolumeButton>
                                                    </span>
                                                </Tooltip>
                                            </Box>
                                        );
                                    })()}
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <Tooltip title="Создать проект">
                                            <VolumeButton
                                                onClick={handleAddProject}
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
                                        </Tooltip>
                                        <Tooltip title="Обновить">
                                            <VolumeButton
                                                onClick={handleRefresh}
                                                color="orange"
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
                                                <Refresh fontSize="small" />
                                            </VolumeButton>
                                        </Tooltip>
                                    </Box>
                                </Box>
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

                                // Фильтруем и сортируем проекты по projectOrderIndex и статусу
                                const sortedProjects = Array.from(projectsMap.entries())
                                    .filter(([, tasks]) => {
                                        // Применяем фильтры по статусу
                                        const projectStatus = tasks[0]?.projectStatus || 'InProject';
                                        // Проверяем, что фильтр для этого статуса включен
                                        // Используем явное преобразование типов для надежности
                                        const statusKey = projectStatus as 'InProject' | 'InProgress' | 'Done' | 'HasProblems' | 'Archived';
                                        const statusFilterValue = statusFilters[statusKey];
                                        // Если статус не найден в фильтрах, показываем проект (на случай если добавится новый статус)
                                        return statusFilterValue !== undefined ? statusFilterValue : true;
                                    })
                                    .sort((a, b) => {
                                        const orderA = a[1][0]?.projectOrderIndex ?? 999999;
                                        const orderB = b[1][0]?.projectOrderIndex ?? 999999;
                                        return orderA - orderB;
                                    });

                                // Обертываем список проектов в DndContext для перетаскивания
                                return (
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={(e) => handleDragEndProjects(e, sortedProjects)}
                                    >
                                        <SortableContext
                                            items={sortedProjects.map(([projectId]) => `project-${projectId}`)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {sortedProjects.map(([projectId, tasks]) => {
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
                                                    <SortableProjectCard key={projectId} projectId={projectId}>
                                                        {/* Контейнер проекта с рамкой */}
                                                        <Paper
                                                            sx={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                border: '2px solid #3e5f8a',
                                                                borderRadius: '4px',
                                                                p: 0.5,
                                                                gap: 0
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
                                                                    gap: 1,
                                                                    flexWrap: 'wrap'
                                                                }}
                                                            >
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                    <Tooltip title={isCollapsed ? 'Развернуть проект' : 'Свернуть проект'}>
                                                                        <span>
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
                                                                        </span>
                                                                    </Tooltip>
                                                                    {/* Кнопка добавления изделия - размер 40x40px */}
                                                                    <VolumeButton
                                                                        onClick={() => handleAddProduct(projectId)}
                                                                        sx={{
                                                                            width: '30px',
                                                                            height: '30px',
                                                                            minWidth: '30px',
                                                                            minHeight: '30px',
                                                                            p: 0,
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            fontSize: '20px',
                                                                            backgroundColor: '#3e5f8a',
                                                                            color: 'white',
                                                                            border: '2px solid #2d4563',
                                                                            '&:hover': {
                                                                                backgroundColor: '#2d4563'
                                                                            }
                                                                        }}
                                                                    >
                                                                        +
                                                                    </VolumeButton>
                                                                    <Typography
                                                                        variant="h6"
                                                                        sx={{
                                                                            fontWeight: 'bold',
                                                                            color: '#3e5f8a',
                                                                            cursor: 'pointer',
                                                                            ml: 2,
                                                                            '&:hover': {
                                                                                textDecoration: 'underline'
                                                                            }
                                                                        }}
                                                                        onDoubleClick={() => {
                                                                            // Получаем статус проекта из первой задачи
                                                                            const projectStatus = tasks[0]?.projectStatus || 'InProject';
                                                                            handleEditProject(projectId, projectName, projectStatus);
                                                                        }}
                                                                    >
                                                                        Проект: {projectName} - Изделий: {productsMap.size}
                                                                    </Typography>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', width: '100%' }}>
                                                                    {/* Чип статуса проекта с выпадающим меню */}
                                                                    <Chip
                                                                        label={getStatusLabel(tasks[0]?.projectStatus || 'InProject')}
                                                                        color={tasks[0]?.projectStatus === 'InProject' ? undefined : getStatusColor(tasks[0]?.projectStatus || 'InProject') as 'primary' | 'success' | 'error' | 'default'}
                                                                        size="small"
                                                                        onClick={(e) => handleStatusMenuOpen(e, projectId)}
                                                                        sx={{
                                                                            cursor: 'pointer',
                                                                            borderRadius: '6px',
                                                                            minWidth: '80px',
                                                                            ...(tasks[0]?.projectStatus === 'InProject' && {
                                                                                backgroundColor: '#FFE082',
                                                                                color: '#000'
                                                                            }),
                                                                            ...(tasks[0]?.projectStatus === 'Archived' && {
                                                                                backgroundColor: '#9e9e9e',
                                                                                color: '#fff'
                                                                            }),
                                                                            '&:hover': {
                                                                                opacity: 0.8
                                                                            }
                                                                        }}
                                                                    />
                                                                    <Menu
                                                                        anchorEl={statusMenuAnchor[projectId]}
                                                                        open={Boolean(statusMenuAnchor[projectId])}
                                                                        onClose={() => handleStatusMenuClose(projectId)}
                                                                    >
                                                                        <MenuItem
                                                                            onClick={() => {
                                                                                handleUpdateProjectStatus(projectId, 'InProject');
                                                                                handleStatusMenuClose(projectId);
                                                                            }}
                                                                        >
                                                                            <Chip
                                                                                label="В проекте"
                                                                                size="small"
                                                                                sx={{
                                                                                    borderRadius: '6px',
                                                                                    width: '80px',
                                                                                    backgroundColor: '#FFE082',
                                                                                    color: '#000',
                                                                                    '& .MuiChip-label': {
                                                                                        padding: '0px 4px'
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </MenuItem>
                                                                        <MenuItem
                                                                            onClick={() => {
                                                                                handleUpdateProjectStatus(projectId, 'InProgress');
                                                                                handleStatusMenuClose(projectId);
                                                                            }}
                                                                        >
                                                                            <Chip
                                                                                label="В работе"
                                                                                color="primary"
                                                                                size="small"
                                                                                sx={{
                                                                                    borderRadius: '6px',
                                                                                    width: '80px',
                                                                                    '& .MuiChip-label': {
                                                                                        padding: '0px 4px'
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </MenuItem>
                                                                        <MenuItem
                                                                            onClick={() => {
                                                                                handleUpdateProjectStatus(projectId, 'Done');
                                                                                handleStatusMenuClose(projectId);
                                                                            }}
                                                                        >
                                                                            <Chip
                                                                                label="Готово"
                                                                                color="success"
                                                                                size="small"
                                                                                sx={{
                                                                                    borderRadius: '6px',
                                                                                    width: '80px',
                                                                                    '& .MuiChip-label': {
                                                                                        padding: '0px 4px'
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </MenuItem>
                                                                        <MenuItem
                                                                            onClick={() => {
                                                                                handleUpdateProjectStatus(projectId, 'HasProblems');
                                                                                handleStatusMenuClose(projectId);
                                                                            }}
                                                                        >
                                                                            <Chip
                                                                                label="Проблемы"
                                                                                color="error"
                                                                                size="small"
                                                                                sx={{
                                                                                    borderRadius: '6px', width: '80px',
                                                                                    '& .MuiChip-label': {
                                                                                        padding: '0px 4px'
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </MenuItem>
                                                                        <MenuItem
                                                                            onClick={() => {
                                                                                handleUpdateProjectStatus(projectId, 'Archived');
                                                                                handleStatusMenuClose(projectId);
                                                                            }}
                                                                        >
                                                                            <Chip
                                                                                label="Архив"
                                                                                size="small"
                                                                                sx={{
                                                                                    borderRadius: '6px',
                                                                                    width: '80px',
                                                                                    backgroundColor: '#9e9e9e',
                                                                                    color: '#fff',
                                                                                    '& .MuiChip-label': {
                                                                                        padding: '0px 4px'
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </MenuItem>
                                                                    </Menu>
                                                                    {/* Информация о руководителе проекта */}
                                                                    {tasks[0]?.projectManager && (
                                                                        <Typography variant="body2" sx={{ color: '#424242', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                                            РП: {tasks[0].projectManager.name}
                                                                            {tasks[0].projectManager.phone && (
                                                                                <>
                                                                                    <Box component="span">📞</Box>
                                                                                    <Box component="span">{tasks[0].projectManager.phone}</Box>
                                                                                </>
                                                                            )}
                                                                            {tasks[0].projectManager.email && (
                                                                                <>
                                                                                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                                                                        <img
                                                                                            src={emailIcon}
                                                                                            alt="email"
                                                                                            style={{ width: '18px', height: '18px', verticalAlign: 'middle' }}
                                                                                        />
                                                                                    </Box>
                                                                                    <Box component="span">{tasks[0].projectManager.email}</Box>
                                                                                </>
                                                                            )}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            </Box>

                                                            {/* Группировка по изделиям (показываем только если проект не свернут и есть изделия) */}
                                                            {!isCollapsed && hasProducts && (
                                                                <DndContext
                                                                    sensors={sensors}
                                                                    collisionDetection={closestCenter}
                                                                    onDragEnd={(e) => handleDragEndProducts(e, projectId, sortedProducts)}
                                                                >
                                                                    <SortableContext
                                                                        items={sortedProducts.map(([productKey]) => `product-${productKey}`)}
                                                                        strategy={verticalListSortingStrategy}
                                                                    >
                                                                        {sortedProducts.map(([productKey, productTasks]) => {
                                                                            const productName = productTasks[0]?.productName || 'Без изделия';
                                                                            const productDescription = productTasks[0]?.productDescription; // Описание из Product
                                                                            const serialNumber = productTasks[0]?.serialNumber;
                                                                            const productOrderIndex = productTasks[0]?.productOrderIndex || 0;
                                                                            // Определяем, есть ли этапы у изделия
                                                                            const actualStages = productTasks.filter(task =>
                                                                                task.id &&
                                                                                !task.id.startsWith('product-only-') &&
                                                                                task.name &&
                                                                                task.name.trim() !== ''
                                                                            );
                                                                            const hasStages = actualStages.length > 0;
                                                                            return (
                                                                                <SortableProductCard
                                                                                    key={productKey}
                                                                                    productId={productKey}
                                                                                    productName={productName}
                                                                                    productOrderIndex={productOrderIndex}
                                                                                    projectId={projectId}
                                                                                >
                                                                                    {/* Контейнер изделия с рамкой */}
                                                                                    <Paper
                                                                                        sx={{
                                                                                            border: '2px solid #423189',
                                                                                            borderRadius: '4px'
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
                                                                                                    // Если нет этапов, карточка должна быть свернута и кнопка неактивна
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
                                                                                                    color="purple"
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
                                                                                                {/* Лампочка статуса изделия с выпадающим меню */}
                                                                                                {(() => {
                                                                                                    const productStatus = productTasks[0]?.productStatus || 'InProject';
                                                                                                    let statusColor = '#FFE082'; // Желтый - по умолчанию (InProject)
                                                                                                    let borderColor = '#F9A825'; // Более тёмный желтый для рамки
                                                                                                    if (productStatus === 'Done') {
                                                                                                        statusColor = '#81C784'; // Зеленый - готово
                                                                                                        borderColor = '#4caf50'; // Более тёмный зеленый для рамки
                                                                                                    } else if (productStatus === 'HasProblems') {
                                                                                                        statusColor = '#E57373'; // Красный - проблема
                                                                                                        borderColor = '#f44336'; // Более тёмный красный для рамки
                                                                                                    } else if (productStatus === 'InProgress') {
                                                                                                        statusColor = '#64B5F6'; // Синий - в работе
                                                                                                        borderColor = '#1976d2'; // Более тёмный синий для рамки
                                                                                                    }

                                                                                                    return (
                                                                                                        <Tooltip title="Изменить статус изделия">
                                                                                                            <IconButton
                                                                                                                onClick={(e) => handleProductStatusMenuOpen(e, productTasks[0]?.productId || '')}
                                                                                                                size="small"
                                                                                                                sx={{
                                                                                                                    width: '30px',
                                                                                                                    height: '30px',
                                                                                                                    p: 0,
                                                                                                                    // mr: '4px',
                                                                                                                    borderRadius: '7px',
                                                                                                                    border: '2px solid #616161', // Черная рамка на контейнере
                                                                                                                    backgroundColor: '#E7E7E7',
                                                                                                                    '&:focus': {
                                                                                                                        outline: 'none'
                                                                                                                    },
                                                                                                                    '&:focus-visible': {
                                                                                                                        outline: 'none'
                                                                                                                    },
                                                                                                                    '&:active': {
                                                                                                                        outline: 'none'
                                                                                                                    }
                                                                                                                }}
                                                                                                            >
                                                                                                                <Box
                                                                                                                    sx={{
                                                                                                                        width: '16px',
                                                                                                                        height: '16px',
                                                                                                                        borderRadius: '50%',
                                                                                                                        backgroundColor: statusColor,
                                                                                                                        border: `2px solid ${borderColor}` // Цветная рамка на лампочке
                                                                                                                    }}
                                                                                                                />
                                                                                                            </IconButton>
                                                                                                        </Tooltip>
                                                                                                    );
                                                                                                })()}
                                                                                                <Typography
                                                                                                    variant="subtitle1"
                                                                                                    sx={{
                                                                                                        fontWeight: 'bold',
                                                                                                        color: '#423189',
                                                                                                        cursor: 'pointer',
                                                                                                        '&:hover': {
                                                                                                            textDecoration: 'underline'
                                                                                                        }
                                                                                                    }}
                                                                                                    onDoubleClick={() => {
                                                                                                        const projectId = productTasks[0]?.projectId;
                                                                                                        const productId = productTasks[0]?.productId;
                                                                                                        if (projectId && productId) {
                                                                                                            handleEditProduct(projectId, productId);
                                                                                                        }
                                                                                                    }}
                                                                                                >
                                                                                                    {productName}
                                                                                                </Typography>
                                                                                                {productDescription && productDescription.trim() !== '' &&
                                                                                                    productDescription.toLowerCase() !== '[null]' &&
                                                                                                    productDescription.toLowerCase() !== 'null' && (
                                                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                                                            <Box sx={{
                                                                                                                width: '6px',
                                                                                                                height: '6px',
                                                                                                                borderRadius: '50%',
                                                                                                                backgroundColor: '#531a50',
                                                                                                                flexShrink: 0
                                                                                                            }} />
                                                                                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#531a50' }}>
                                                                                                                {productDescription}
                                                                                                            </Typography>
                                                                                                            <Box sx={{
                                                                                                                width: '6px',
                                                                                                                height: '6px',
                                                                                                                borderRadius: '50%',
                                                                                                                backgroundColor: '#531a50',
                                                                                                                flexShrink: 0
                                                                                                            }} />
                                                                                                        </Box>
                                                                                                    )}
                                                                                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: serialNumber ? '#423189' : '#d32f2f' }}>
                                                                                                    {serialNumber ? `(Сер № ${serialNumber})` : '(Сер № ...)'}
                                                                                                </Typography>
                                                                                                {/* Контейнер с кнопками ссылок на модели */}
                                                                                                <Box sx={{ display: 'flex', gap: 0.5, ml: 1, flexWrap: 'wrap' }}>
                                                                                                    {(() => {
                                                                                                        const productIdForLinks = productTasks[0]?.productId;
                                                                                                        if (!productIdForLinks) return null;

                                                                                                        const links = productModelLinks[productIdForLinks] || [];

                                                                                                        // Группируем ссылки по названию, берем с самой поздней датой
                                                                                                        const linksByName = new Map<string, { id: string; name: string; url: string; createdAt: string }>();
                                                                                                        links.forEach(link => {
                                                                                                            const existing = linksByName.get(link.name);
                                                                                                            if (!existing || new Date(link.createdAt) > new Date(existing.createdAt)) {
                                                                                                                linksByName.set(link.name, link);
                                                                                                            }
                                                                                                        });

                                                                                                        const uniqueLinks = Array.from(linksByName.values());

                                                                                                        if (uniqueLinks.length === 0) {
                                                                                                            return (
                                                                                                                <Box
                                                                                                                    component="button"
                                                                                                                    sx={{
                                                                                                                        padding: '2px 8px',
                                                                                                                        fontSize: '11px',
                                                                                                                        border: '1px solid #ccc',
                                                                                                                        borderRadius: '4px',
                                                                                                                        backgroundColor: '#f5f5f5',
                                                                                                                        cursor: 'default',
                                                                                                                        color: '#666',
                                                                                                                        '&:hover': {
                                                                                                                            backgroundColor: '#e0e0e0'
                                                                                                                        }
                                                                                                                    }}
                                                                                                                >
                                                                                                                    Ссылки нет
                                                                                                                </Box>
                                                                                                            );
                                                                                                        }

                                                                                                        return uniqueLinks.map(link => (
                                                                                                            <Box
                                                                                                                key={link.id}
                                                                                                                component="a"
                                                                                                                href={link.url}
                                                                                                                target="_blank"
                                                                                                                rel="noopener noreferrer"
                                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                                                sx={{
                                                                                                                    padding: '2px 8px',
                                                                                                                    fontSize: '11px',
                                                                                                                    border: '1px solid #1976d2',
                                                                                                                    borderRadius: '4px',
                                                                                                                    backgroundColor: '#e3f2fd',
                                                                                                                    color: '#1976d2',
                                                                                                                    textDecoration: 'none',
                                                                                                                    cursor: 'pointer',
                                                                                                                    '&:hover': {
                                                                                                                        backgroundColor: '#bbdefb',
                                                                                                                        textDecoration: 'none'
                                                                                                                    }
                                                                                                                }}
                                                                                                                title={link.url}
                                                                                                            >
                                                                                                                {link.name}
                                                                                                            </Box>
                                                                                                        ));
                                                                                                    })()}
                                                                                                </Box>
                                                                                            </Box>
                                                                                        </Box>

                                                                                        {/* Карточки этапов работ этого изделия */}
                                                                                        {(() => {
                                                                                            // Берем этапы из локального состояния (как в ProductCard)
                                                                                            // Используем productStagesMap для правильной анимации
                                                                                            const actualStages = productStagesMap.get(productKey) || [];
                                                                                            // Если нет этапов, карточка должна быть свернута
                                                                                            const hasStages = actualStages.length > 0;
                                                                                            const isCollapsed = collapsedProducts.has(productKey) || !hasStages;

                                                                                            // Показываем этапы только если карточка развернута и есть этапы
                                                                                            if (isCollapsed || !hasStages) {
                                                                                                return null;
                                                                                            }

                                                                                            // Если есть этапы, показываем их с SortableContext
                                                                                            if (actualStages.length > 0) {
                                                                                                // Создаем ключ для принудительного обновления при изменении порядка
                                                                                                const stagesKey = actualStages.map(s => `${s.id}-${s.orderIndex}`).join(',');
                                                                                                return (
                                                                                                    <SortableContext
                                                                                                        key={stagesKey}
                                                                                                        items={actualStages.map(task => task.id)}
                                                                                                        strategy={rectSortingStrategy}
                                                                                                    >
                                                                                                        <Box sx={{
                                                                                                            display: 'flex',
                                                                                                            flexWrap: 'wrap',
                                                                                                            gap: 0.5,
                                                                                                            alignItems: 'flex-start',
                                                                                                            minHeight: '60px', // Минимальная высота для стабильности
                                                                                                            position: 'relative', // Для правильного позиционирования
                                                                                                            overflow: 'visible', // Изменено на visible, чтобы границы не обрезались при hover
                                                                                                            width: '100%', // Полная ширина контейнера
                                                                                                            ml: 2,
                                                                                                            mb: 1
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
                                                                                </SortableProductCard>
                                                                            );
                                                                        })}
                                                                    </SortableContext>
                                                                </DndContext>
                                                            )}

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
                                                    </SortableProjectCard>
                                                );
                                            })}
                                        </SortableContext>
                                    </DndContext>
                                );
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

                {/* Меню статуса изделия */}
                <Menu
                    open={productStatusMenu !== null}
                    onClose={handleProductStatusMenuClose}
                    anchorEl={productStatusMenu?.anchorEl || null}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                    }}
                >
                    <MenuItem onClick={() => productStatusMenu && handleProductStatusChange(productStatusMenu.productId, 'InProject')}>
                        <Box
                            sx={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                backgroundColor: '#FFE082',
                                mr: 1,
                                border: '1px solid rgba(0,0,0,0.2)'
                            }}
                        />
                        <ListItemText>В проекте</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => productStatusMenu && handleProductStatusChange(productStatusMenu.productId, 'InProgress')}>
                        <Box
                            sx={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                backgroundColor: '#64B5F6',
                                mr: 1,
                                border: '1px solid rgba(0,0,0,0.2)'
                            }}
                        />
                        <ListItemText>В работе</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => productStatusMenu && handleProductStatusChange(productStatusMenu.productId, 'Done')}>
                        <Box
                            sx={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                backgroundColor: '#81C784',
                                mr: 1,
                                border: '1px solid rgba(0,0,0,0.2)'
                            }}
                        />
                        <ListItemText>Готово</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => productStatusMenu && handleProductStatusChange(productStatusMenu.productId, 'HasProblems')}>
                        <Box
                            sx={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                backgroundColor: '#E57373',
                                mr: 1,
                                border: '1px solid rgba(0,0,0,0.2)'
                            }}
                        />
                        <ListItemText>Проблема</ListItemText>
                    </MenuItem>
                </Menu>

                {/* Диалог создания/редактирования проекта */}
                <ProjectDialog
                    open={openProjectDialog}
                    editing={!!editingProject}
                    projectForm={projectForm}
                    managers={managers}
                    onClose={handleCloseProjectDialog}
                    onSave={handleSaveProject}
                    onChange={setProjectForm}
                />

                {/* Диалог создания/редактирования изделия */}
                <ProductDialog
                    open={openProductDialog}
                    editing={!!(editingProduct && editingProduct.id && editingProduct.id.trim() !== '')}
                    productForm={productForm}
                    catalogProducts={catalogProducts}
                    loading={loading}
                    onClose={handleCloseProductDialog}
                    onSave={handleSaveProduct}
                    onChange={setProductForm}
                />
            </Box>
        </DndContext>
    );
};

export default KanbanBoard;
