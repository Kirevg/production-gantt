import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Chip,
    FormControlLabel,
    Checkbox
} from '@mui/material';
import { Delete, DragIndicator } from '@mui/icons-material';
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
import type { Project, User } from '../types/common';
import { formatPhoneDisplay } from '../utils/phoneUtils';

interface ProjectsListProps {
    onOpenProjectComposition: (project: Project) => void;
    onOpenCreateProject: () => void;
    user: User;
    canCreate: () => boolean;
    canDelete: () => boolean;
}

const ProjectsList: React.FC<ProjectsListProps> = ({ onOpenProjectComposition, onOpenCreateProject, user, canCreate, canDelete }) => {
    // Состояние для хранения списка проектов
    const [projects, setProjects] = useState<Project[]>([]);
    // Состояние для отображения индикатора загрузки
    const [loading, setLoading] = useState(true);
    // Состояние для хранения ошибок
    const [error, setError] = useState<string | null>(null);
    // Состояние для показа/скрытия формы создания проекта
    const [showCreateForm, setShowCreateForm] = useState(false);
    // Состояние для показа/скрытия диалога удаления
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    // Состояние для хранения проекта, который удаляется
    const [deletingProject, setDeletingProject] = useState<Project | null>(null);
    // Состояние для формы создания нового проекта
    const [newProject, setNewProject] = useState({
        name: '',                    // Название проекта
        status: 'InProject' as 'InProject' | 'InProgress' | 'Done' | 'HasProblems' | 'Archived',   // Статус по умолчанию
        managerId: ''               // ID руководителя проекта
    });
    // Состояние для списка руководителей
    const [managers, setManagers] = useState<Array<{
        id: string;
        firstName: string;
        lastName: string;
        middleName?: string;
        email?: string;
    }>>([]);
    // Состояние для отслеживания процесса перетаскивания
    const [isReordering, setIsReordering] = useState(false);
    // Состояние для фильтров статусов
    const [statusFilters, setStatusFilters] = useState({
        InProject: true,
        InProgress: true,
        Done: true,
        HasProblems: true,
        Archived: true
    });

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
    // Состояние для хранения данных о задачах проектов
    const [projectTasks, setProjectTasks] = useState<{ [projectId: string]: any[] }>({});

    // Функция для фильтрации и сортировки проектов по статусам
    const getFilteredProjects = () => {
        return projects
            .filter(project => statusFilters[project.status])
            .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    };

    // Обработчик для drag-and-drop событий
    const handleDragEnd = async (event: any) => {
        const { active, over } = event;

        if (active && over && active.id !== over.id) {
            const filteredProjects = getFilteredProjects();

            // Находим индексы перетаскиваемого и целевого элементов в отфильтрованном списке
            const oldIndex = filteredProjects.findIndex((project) => project.id === active.id);
            const newIndex = filteredProjects.findIndex((project) => project.id === over.id);

            // Проверяем, что индексы найдены
            if (oldIndex === -1 || newIndex === -1) {
                // console.('Не удалось найти проекты для переупорядочивания');
                return;
            }

            // Сохраняем исходный порядок на случай ошибки
            const originalProjects = [...projects];

            // Обновляем порядок в локальном состоянии
            const reorderedFilteredProjects = arrayMove(filteredProjects, oldIndex, newIndex);

            // Обновляем общий список проектов, сохраняя новый порядок для отфильтрованных проектов
            const updatedProjects = [...projects];
            reorderedFilteredProjects.forEach((project, index) => {
                const projectIndex = updatedProjects.findIndex(p => p.id === project.id);
                if (projectIndex !== -1) {
                    updatedProjects[projectIndex] = { ...project, orderIndex: index };
                }
            });

            setProjects(updatedProjects);
            setIsReordering(true);

            // Отправляем обновленный порядок на сервер
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Токен авторизации не найден');
                    setProjects(originalProjects);
                    setIsReordering(false);
                    return;
                }

                // Отправляем на сервер только те проекты, которые изменили порядок
                const projectOrders = reorderedFilteredProjects.map((project, index) => ({
                    id: project.id,
                    orderIndex: index
                }));

                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/reorder`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ projectOrders })
                });

                if (!response.ok) {
                    // Если обновление не удалось, возвращаем исходный порядок
                    setProjects(originalProjects);
                    const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
                    setError(`Ошибка обновления порядка проектов: ${errorData.error}`);
                    // console.('Ошибка API:', response.status, errorData);
                } else {
                    // Очищаем ошибки при успешном обновлении
                    setError(null);
                }
            } catch (error) {
                // При ошибке возвращаем исходный порядок
                setProjects(originalProjects);
                setError(`Ошибка сети при обновлении порядка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
                // console.('Ошибка сети:', error);
            } finally {
                setIsReordering(false);
            }
        }
    };

    // Функция для загрузки списка проектов с сервера
    const fetchProjects = async () => {
        try {
            // Получаем токен авторизации из localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Токен авторизации не найден. Пожалуйста, войдите в систему заново.');
                setLoading(false);
                return;
            }

            // Отправляем GET запрос на API для получения списка проектов
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Если запрос успешен, парсим JSON и обновляем состояние
                const data = await response.json();
                setProjects(data);
                setError(null); // Очищаем ошибки при успешной загрузке
            } else {
                // Если запрос неуспешен, парсим ошибку
                const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
                setError(`Ошибка загрузки проектов: ${errorData.error}`);
            }
        } catch (err) {
            // При ошибке сети устанавливаем соответствующее сообщение
            setError(`Ошибка сети: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
        } finally {
            // В любом случае убираем индикатор загрузки
            setLoading(false);
        }
    };

    // Функция для загрузки задач проектов
    const fetchProjectTasks = async (projectId: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/products`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const tasks = await response.json();
                setProjectTasks(prev => ({
                    ...prev,
                    [projectId]: tasks
                }));
            } else {
                const errorData = await response.json();
                // console.(`Ошибка загрузки задач для проекта ${projectId}:`, errorData);
            }
        } catch (err) {
            // console.('Ошибка загрузки задач проекта:', err);
        }
    };

    // Функция для загрузки всех задач проектов
    const fetchAllProjectTasks = async () => {
        for (const project of projects) {
            await fetchProjectTasks(project.id);
        }
    };

    // Функция для получения самой ранней даты начала из задач проекта
    // Рассчитывает даты так же, как в карточке проекта
    const getProjectEarliestStartDate = (projectId: string): string | null => {
        const tasks = projectTasks[projectId] || [];

        // Для каждой задачи (изделия) рассчитываем самую раннюю дату из её этапов работ
        // Это точно такая же логика, как в карточке проекта
        const productEarliestDates = tasks.map((task: any) => {
            const workStages = task.workStages || [];
            const datesWithValues = workStages
                .map((stage: any) => stage.startDate)
                .filter((date: any) => date && date.trim() !== '')
                .map((date: any) => new Date(date))
                .filter((date: Date) => !isNaN(date.getTime()));

            if (datesWithValues.length === 0) {
                return null;
            }

            const earliestDate = new Date(Math.min(...datesWithValues.map((date: Date) => date.getTime())));
            return earliestDate.toISOString().split('T')[0];
        }).filter((date: any) => date !== null);

        if (productEarliestDates.length === 0) {
            return null;
        }

        // Из всех самых ранних дат изделий выбираем самую раннюю
        const earliestDate = new Date(Math.min(...productEarliestDates.filter((date): date is string => date !== null).map((date: string) => new Date(date).getTime())));
        return earliestDate.toISOString().split('T')[0];
    };

    // Функция для получения самой поздней даты окончания из задач проекта
    // Рассчитывает даты так же, как в карточке проекта
    const getProjectLatestEndDate = (projectId: string): string | null => {
        const tasks = projectTasks[projectId] || [];

        // Для каждой задачи (изделия) рассчитываем самую позднюю дату из её этапов работ
        // Это точно такая же логика, как в карточке проекта
        const productLatestDates = tasks.map((task: any) => {
            const workStages = task.workStages || [];
            const datesWithValues = workStages
                .map((stage: any) => stage.endDate)
                .filter((date: any) => date && date.trim() !== '')
                .map((date: any) => new Date(date))
                .filter((date: Date) => !isNaN(date.getTime()));

            if (datesWithValues.length === 0) {
                return null;
            }

            const latestDate = new Date(Math.max(...datesWithValues.map((date: Date) => date.getTime())));
            return latestDate.toISOString().split('T')[0];
        }).filter((date: any) => date !== null);

        if (productLatestDates.length === 0) {
            return null;
        }

        // Из всех самых поздних дат изделий выбираем самую позднюю
        const latestDate = new Date(Math.max(...productLatestDates.filter((date): date is string => date !== null).map((date: string) => new Date(date).getTime())));
        return latestDate.toISOString().split('T')[0];
    };

    // Функция для загрузки списка руководителей
    const fetchManagers = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // console.('Токен авторизации не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/persons?isProjectManager=true`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setManagers(data);
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
                // console.('Ошибка загрузки руководителей:', errorData.error);
            }
        } catch (error) {
            // console.('Ошибка сети при загрузке руководителей:', error);
        }
    };

    // Обработчик изменения фильтров статусов
    const handleStatusFilterChange = (status: keyof typeof statusFilters) => {
        setStatusFilters(prev => ({
            ...prev,
            [status]: !prev[status]
        }));
    };

    // Эффект для загрузки проектов и руководителей при монтировании компонента
    useEffect(() => {
        fetchProjects();
        fetchManagers();
    }, []);

    // Эффект для загрузки задач проектов после загрузки проектов
    useEffect(() => {
        if (projects.length > 0) {
            fetchAllProjectTasks();
        }
    }, [projects]);

    // Компонент для перетаскиваемой строки таблицы
    function SortableTableRow({ project }: { project: Project }) {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({
            id: project.id,
            disabled: loading || isReordering // Отключаем перетаскивание во время загрузки или переупорядочивания
        });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0.5 : 1,
        };

        return (
            <TableRow
                ref={setNodeRef}
                style={style}
                onDoubleClick={() => !loading && !isReordering && onOpenProjectComposition(project)}
                sx={{
                    height: '35px',
                    cursor: (loading || isReordering) ? 'default' : 'pointer',
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
                        '&:active': {
                            cursor: (loading || isReordering) ? 'default' : 'grabbing',
                        },
                    }}
                >
                    <DragIndicator color="action" />
                </TableCell>
                <TableCell
                    onDoubleClick={() => !loading && !isReordering && onOpenProjectComposition(project)}
                    sx={{
                        fontWeight: 'medium',
                        py: 0.5,
                        wordWrap: 'break-word',
                        whiteSpace: 'normal',
                        cursor: (loading || isReordering) ? 'default' : 'pointer'
                    }}
                >
                    {project.name}
                </TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
                    <Chip
                        label={
                            project.status === 'InProject' ? 'В проекте' :
                                project.status === 'InProgress' ? 'В работе' :
                                    project.status === 'Done' ? 'Завершён' :
                                        project.status === 'HasProblems' ? 'Проблемы' :
                                            project.status === 'Archived' ? 'Архив' : 'В проекте'
                        }
                        color={
                            project.status === 'InProject' ? undefined :
                                project.status === 'InProgress' ? 'primary' :
                                    project.status === 'Done' ? 'success' :
                                        project.status === 'HasProblems' ? 'error' :
                                            project.status === 'Archived' ? 'default' : undefined
                        }
                        size="small"
                        sx={{
                            width: '80px',
                            borderRadius: '6px',
                            ...(project.status === 'InProject' && {
                                backgroundColor: '#FFE082',
                                color: '#000'
                            }),
                            ...(project.status === 'Archived' && {
                                backgroundColor: '#9e9e9e',
                                color: '#fff'
                            })
                        }}
                    />
                </TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
                    {getProjectEarliestStartDate(project.id) ? new Date(getProjectEarliestStartDate(project.id)!).toLocaleDateString('ru-RU') : '-'}
                </TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
                    {getProjectLatestEndDate(project.id) ? new Date(getProjectLatestEndDate(project.id)!).toLocaleDateString('ru-RU') : '-'}
                </TableCell>
                <TableCell sx={{ py: 0.5 }}>
                    {project.projectManager ? (
                        <>
                            {project.projectManager.firstName} {project.projectManager.lastName}
                        </>
                    ) : (
                        'Не назначен'
                    )}
                </TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
                    {formatPhoneDisplay(project.projectManager?.phone || '')}
                </TableCell>
                <TableCell sx={{ textAlign: 'center', py: 0.5, width: '60px' }}>
                    {canDelete() && (
                        <IconButton
                            size="small"
                            onClick={() => handleDeleteProject(project)}
                            color="error"
                            sx={{
                                minWidth: 'auto',
                                padding: '4px',
                                '&:active': {
                                    transform: 'none !important',
                                    boxShadow: 'none !important',
                                    backgroundColor: 'transparent !important'
                                },
                                '&:focus': {
                                    outline: 'none !important',
                                    backgroundColor: 'transparent !important'
                                }
                            }}
                        >
                            <Delete fontSize="small" />
                        </IconButton>
                    )}
                </TableCell>
            </TableRow>
        );
    }

    // Обработчик создания нового проекта
    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault(); // Предотвращаем стандартное поведение формы
        try {
            // Получаем токен авторизации из localStorage
            const token = localStorage.getItem('token');
            // Отправляем POST запрос для создания проекта
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Передаем токен в заголовке
                },
                body: JSON.stringify({
                    ...newProject, // Распаковываем данные формы
                    ownerId: user.id, // ID текущего пользователя
                    managerId: newProject.managerId || null // ID руководителя проекта
                })
            });

            if (response.ok) {
                // Если проект создан успешно
                setShowCreateForm(false); // Скрываем форму
                setNewProject({ name: '', status: 'InProject', managerId: '' }); // Очищаем форму
                fetchProjects(); // Обновляем список проектов
            } else {
                // Если произошла ошибка, парсим ответ и показываем ошибку
                const errorData = await response.json();
                setError(`Ошибка создания проекта: ${errorData.error || 'Неизвестная ошибка'}`);
            }
        } catch (err) {
            // При ошибке сети показываем соответствующее сообщение
            setError(`Ошибка сети: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
        }
    };

    // Обработчик для начала удаления проекта
    const handleDeleteProject = (project: Project) => {
        setDeletingProject(project); // Устанавливаем проект для удаления
        setShowDeleteDialog(true);   // Показываем диалог подтверждения
    };

    // Обработчик подтверждения удаления проекта
    const confirmDeleteProject = async () => {
        if (!deletingProject) return; // Если нет проекта для удаления, выходим

        try {
            // Получаем токен авторизации
            const token = localStorage.getItem('token');
            // Отправляем DELETE запрос для удаления проекта
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/${deletingProject.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Если удаление успешно
                setShowDeleteDialog(false); // Скрываем диалог
                setDeletingProject(null);   // Очищаем удаляемый проект
                fetchProjects();             // Обновляем список
            } else {
                // Если произошла ошибка
                const errorData = await response.json();
                setError(`Ошибка удаления проекта: ${errorData.error || 'Неизвестная ошибка'}`);
            }
        } catch (err) {
            // При ошибке сети
            setError(`Ошибка сети: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
        }
    };

    // Если идет загрузка, показываем индикатор
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={3} sx={{ width: '100%' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Если есть ошибка, показываем ее
    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                {error}
            </Alert>
        );
    }

    // Основной рендер компонента списка проектов
    return (
        <>
            {/* 
             * КОНТЕЙНЕР СТРАНИЦЫ - СТАНДАРТНОЕ ИСПОЛЬЗОВАНИЕ
             * 
             * БАЗОВЫЕ СТИЛИ: Определены в web/src/styles/buttons.css (.page-container)
             *   - min-width: 1200px - минимальная ширина контейнера
             *   - max-width: 1200px - максимальная ширина контейнера
             * 
             * ЛОКАЛЬНЫЕ ПЕРЕОПРЕДЕЛЕНИЯ: НЕТ (используются только базовые стили)
             * 
             * ЭТО СТАНДАРТНЫЙ СЛУЧАЙ:
             *   - Используются только базовые стили из CSS
             *   - Не требуется дополнительных отступов или специальной компоновки
             *   - Если нужно изменить ширину - редактируйте в buttons.css
             *   - Если нужно добавить отступы - используйте sx prop (см. примеры в App.tsx)
             */}
            <Box className="page-container">
                {/* Заголовок и кнопка создания проекта */}
                <Box className="page-header">
                    <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px' }}>Список проектов</Typography>
                    {canCreate() && (
                        <Button
                            variant="contained"
                            size="large"
                            onClick={onOpenCreateProject}
                            className="depth-button"
                            sx={{ fontSize: '14px' }}
                        >
                            Создать проект
                        </Button>
                    )}
                </Box>

                {/* Форма создания нового проекта */}
                <Dialog
                    open={showCreateForm}
                    onClose={() => { }}
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
                    <DialogTitle>Создать новый проект</DialogTitle>
                    <form onSubmit={handleCreateProject}>
                        <DialogContent>
                            {/* Поле для названия проекта */}
                            <TextField
                                autoFocus
                                fullWidth
                                label="Название проекта"
                                value={newProject.name}
                                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                margin="normal"
                                required
                            />
                            {/* Выпадающий список для выбора руководителя проекта */}
                            <TextField
                                fullWidth
                                select
                                label="Руководитель проекта"
                                value={newProject.managerId}
                                onChange={(e) => setNewProject({ ...newProject, managerId: e.target.value })}
                                margin="normal"
                                SelectProps={{ native: true }}
                            >
                                <option value=""></option>
                                {managers.map((manager) => (
                                    <option key={manager.id} value={manager.id}>
                                        {manager.lastName} {manager.firstName} {manager.middleName || ''}
                                    </option>
                                ))}
                            </TextField>
                            {/* Выпадающий список для выбора статуса */}
                            <TextField
                                fullWidth
                                select
                                label="Статус"
                                value={newProject.status}
                                onChange={(e) => setNewProject({ ...newProject, status: e.target.value as 'InProject' | 'InProgress' | 'Done' | 'HasProblems' | 'Archived' })}
                                margin="normal"
                                SelectProps={{ native: true }}
                            >
                                <option value="InProject">В проекте</option>
                                <option value="InProgress">В работе</option>
                                <option value="Done">Завершён</option>
                                <option value="HasProblems">Проблемы</option>
                                <option value="Archived">Архив</option>
                            </TextField>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setShowCreateForm(false)} variant="contained" size="large" sx={{ fontSize: '14px' }}>Отмена</Button>
                            <Button type="submit" variant="contained" size="large" className="depth-button" sx={{ fontSize: '14px' }}>Создать</Button>
                        </DialogActions>
                    </form>
                </Dialog>

                {/* Фильтры статусов */}
                <Paper sx={{ p: 0, mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', height: '56px', overflow: 'hidden', width: '100%' }}>
                        <Typography variant="body2" color="text.secondary">
                            Показано: {getFilteredProjects().length} из {projects.length}
                        </Typography>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={statusFilters.InProject}
                                    onChange={() => handleStatusFilterChange('InProject')}
                                    color="default"
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                    <Chip
                                        label="В проекте"
                                        size="small"
                                        sx={{
                                            borderRadius: '6px',
                                            backgroundColor: '#FFE082',
                                            color: '#000'
                                        }}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        ({projects.filter(p => p.status === 'InProject').length})
                                    </Typography>
                                </Box>
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
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                    <Chip
                                        label="В работе"
                                        color="primary"
                                        size="small"
                                        sx={{ borderRadius: '6px' }}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        ({projects.filter(p => p.status === 'InProgress').length})
                                    </Typography>
                                </Box>
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
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                    <Chip
                                        label="Завершён"
                                        color="success"
                                        size="small"
                                        sx={{ borderRadius: '6px' }}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        ({projects.filter(p => p.status === 'Done').length})
                                    </Typography>
                                </Box>
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
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                    <Chip
                                        label="Проблемы"
                                        color="error"
                                        size="small"
                                        sx={{ borderRadius: '6px' }}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        ({projects.filter(p => p.status === 'HasProblems').length})
                                    </Typography>
                                </Box>
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
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                    <Chip
                                        label="Архив"
                                        size="small"
                                        sx={{
                                            borderRadius: '6px',
                                            backgroundColor: '#9e9e9e',
                                            color: '#fff'
                                        }}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        ({projects.filter(p => p.status === 'Archived').length})
                                    </Typography>
                                </Box>
                            }
                        />

                        <Button
                            size="small"
                            onClick={() => setStatusFilters({ InProject: true, InProgress: true, Done: true, HasProblems: true, Archived: true })}
                            disabled={statusFilters.InProject && statusFilters.InProgress && statusFilters.Done && statusFilters.HasProblems && statusFilters.Archived}
                        >
                            Показать все
                        </Button>
                        <Button
                            size="small"
                            onClick={() => setStatusFilters({ InProject: false, InProgress: false, Done: false, HasProblems: false, Archived: false })}
                            disabled={!statusFilters.InProject && !statusFilters.InProgress && !statusFilters.Done && !statusFilters.HasProblems && !statusFilters.Archived}
                        >
                            Скрыть все
                        </Button>
                    </Box>
                </Paper>

                {/* Таблица с проектами */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <TableContainer
                        component={Paper}
                        sx={{
                            width: '100%',
                            p: 0,
                            '& .MuiTable-root': {
                                minWidth: 'max-content' // Минимальная ширина таблицы
                            }
                        }}
                    >
                        <Table sx={{
                            minWidth: 'max-content',
                            tableLayout: 'fixed',
                            '& .MuiTableCell-root': {
                                borderRight: '1px solid #e0e0e0',
                                '&:last-child': {
                                    borderRight: 'none'
                                }
                            },
                            '& .MuiTableCell-root:first-of-type': {
                                width: '40px !important',
                                minWidth: '40px !important',
                                maxWidth: '40px !important',
                                flex: '0 0 40px !important'
                            },
                            '& .MuiTableBody-root .MuiTableCell-root': {
                                padding: '4px 4px !important'
                            },
                            '& .MuiTableBody-root .MuiTableCell-root:first-of-type': {
                                textAlign: 'center !important'
                            },
                            '& .MuiTableCell-root:nth-of-type(4)': {
                                width: '100px !important',
                                minWidth: '100px !important',
                                maxWidth: '100px !important'
                            },
                            '& .MuiTableCell-root:nth-of-type(5)': {
                                width: '100px !important',
                                minWidth: '100px !important',
                                maxWidth: '100px !important'
                            },
                            '& .MuiTableCell-root:nth-of-type(3)': {
                                width: '120px !important',
                                minWidth: '120px !important',
                                maxWidth: '120px !important'
                            },
                            '& .MuiTableCell-root:nth-of-type(7)': {
                                width: '140px !important',
                                minWidth: '140px !important',
                                maxWidth: '140px !important'
                            },
                            '& .MuiTableCell-root:nth-of-type(6)': {
                                width: '200px !important',
                                minWidth: '200px !important',
                                maxWidth: '200px !important',
                                whiteSpace: 'normal !important'
                            },
                            '& .MuiIconButton-root': {
                                '&:active': {
                                    transform: 'none !important',
                                    boxShadow: 'none !important',
                                    backgroundColor: 'transparent !important'
                                },
                                '&:focus': {
                                    outline: 'none !important',
                                    backgroundColor: 'transparent !important'
                                },
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.04) !important'
                                },
                                '&:focus-visible': {
                                    outline: 'none !important'
                                }
                            }
                        }}>
                            {/* Заголовок таблицы */}
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f5f5f5', height: '56px' }}>
                                    <TableCell sx={{ fontWeight: 'bold', width: '40px', minWidth: '40px', maxWidth: '40px', textAlign: 'center', px: 0 }}>
                                        <Typography sx={{ fontSize: '18px', fontWeight: 900 }}>
                                            ↑↓
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', px: 0 }}>Название</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', px: 0, width: '120px' }}>Статус</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', px: 0, width: '100px' }}>Старт</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', px: 0, width: '100px' }}>Финиш</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', px: 0, width: '200px' }}>Руководитель проекта</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', px: 0, width: '140px' }}>Телефон</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', px: 0, width: '60px' }}>
                                        <Delete sx={{ color: 'error.main' }} />
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            {/* Тело таблицы с данными проектов */}
                            <TableBody>
                                <SortableContext items={getFilteredProjects().map(p => p.id)} strategy={verticalListSortingStrategy}>
                                    {getFilteredProjects().map((project) => (
                                        <SortableTableRow key={project.id} project={project} />
                                    ))}
                                </SortableContext>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DndContext>

                {/* Диалог удаления проекта */}
                <Dialog
                    open={showDeleteDialog}
                    onClose={() => { }}
                    hideBackdrop={true}
                    disablePortal={true}
                    disableScrollLock={true}
                    keepMounted={false}
                    disableEnforceFocus={true}
                    disableAutoFocus={true}
                    disableEscapeKeyDown={true}
                >
                    <DialogTitle>Удалить проект</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Вы уверены, что хотите удалить проект "{deletingProject?.name}"?
                            Это действие нельзя отменить.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowDeleteDialog(false)} variant="contained" size="large" sx={{ fontSize: '14px' }}>Отмена</Button>
                        <Button onClick={confirmDeleteProject} color="error" variant="contained" size="large">
                            Удалить
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </>
    );
};

export default ProjectsList;

