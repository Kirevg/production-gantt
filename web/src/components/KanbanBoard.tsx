import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, Tooltip } from '@mui/material';
import { Refresh } from '@mui/icons-material';

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
    productId?: string;
    productName?: string;
    projectStatus?: string;
}

const KanbanBoard: React.FC = () => {
    const [kanbanTasks, setKanbanTasks] = useState<KanbanTask[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // Загрузка данных для канбан-доски
    const fetchKanbanData = async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('token');
            console.log('🔑 Токен из localStorage:', token ? 'найден' : 'не найден');
            console.log('🌐 API URL:', `${import.meta.env.VITE_API_BASE_URL}/projects/gantt`);

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

            console.log('📡 Ответ сервера:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Ошибка ответа:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('📊 Получены данные для канбан-доски:', data);

            // Преобразуем данные в формат для канбан-доски
            const tasks: KanbanTask[] = data.map((stage: any) => {
                const startDate = new Date(stage.start);
                const endDate = new Date(stage.end);

                // Проверяем валидность дат
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    console.warn('⚠️ Невалидная дата для этапа:', stage);
                    return null;
                }

                return {
                    id: stage.id,
                    name: `${stage.projectName || 'Проект'} - ${stage.productName || 'Изделие'} - ${stage.name || 'Этап'}`,
                    start: startDate,
                    end: endDate,
                    progress: Math.min(Math.max(stage.progress || 0, 0), 100),
                    assignee: stage.assignee || 'Не назначен',
                    workType: stage.workType || 'Не указан',
                    sum: stage.sum || '0',
                    hours: stage.hours || '0',
                    projectId: stage.projectId,
                    projectName: stage.projectName || 'Проект',
                    productId: stage.productId,
                    productName: stage.productName || 'Изделие',
                    projectStatus: stage.projectStatus
                };
            }).filter(Boolean);

            console.log('🎯 Преобразованные задачи:', tasks);
            console.log('🔍 Количество задач:', tasks.length);

            setKanbanTasks(tasks);
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
    }, []);

    // Обработчики
    const handleCardClick = (task: KanbanTask) => {
        console.log('Клик по карточке:', task);
        // Здесь можно добавить логику редактирования
    };

    const handleRefresh = () => {
        fetchKanbanData();
    };

    return (
        <Box sx={{ width: '100%', minHeight: '600px' }}>
            {/* Заголовок с кнопкой обновления */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                p: 2,
                backgroundColor: '#f5f5f5',
                borderRadius: 1
            }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    Канбан-доска этапов работ
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Обновить">
                        <IconButton onClick={handleRefresh} size="small">
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Канбан-доска */}
            <Paper sx={{ minHeight: 'calc(100% - 80px)', overflow: 'auto' }}>
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
                    <Box sx={{ p: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Этапы работ ({kanbanTasks.length})
                        </Typography>
                        {/* Группируем задачи по проектам */}
                        {(() => {
                            // Группируем задачи по projectId
                            const projectsMap = new Map<string, KanbanTask[]>();
                            kanbanTasks.forEach(task => {
                                if (!projectsMap.has(task.projectId || '')) {
                                    projectsMap.set(task.projectId || '', []);
                                }
                                projectsMap.get(task.projectId || '')?.push(task);
                            });

                            return Array.from(projectsMap.entries()).map(([projectId, tasks]) => {
                                const projectName = tasks[0]?.projectName || 'Без проекта';
                                return (
                                    <Box key={projectId} sx={{ mb: 3 }}>
                                        {/* Заголовок проекта */}
                                        <Paper
                                            sx={{
                                                p: 1.5,
                                                mb: 1,
                                                backgroundColor: '#f5f5f5',
                                                borderLeft: '4px solid #1976d2'
                                            }}
                                        >
                                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                📋 {projectName} ({tasks.length})
                                            </Typography>
                                        </Paper>
                                        {/* Карточки этапов работ этого проекта */}
                                        <Box sx={{
                                            display: 'grid',
                                            gap: 1,
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                            ml: 2
                                        }}>
                                            {tasks.map((task) => (
                                                <Paper
                                                    key={task.id}
                                                    sx={{
                                                        p: 2,
                                                        border: '1px solid #e0e0e0',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': {
                                                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                                            transform: 'translateY(-2px)'
                                                        }
                                                    }}
                                                    onClick={() => handleCardClick(task)}
                                                >
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                                        {task.name}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                        🏗️ <strong>Изделие:</strong> {task.productName}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                        📅 <strong>Сроки:</strong> {task.start.toLocaleDateString('ru-RU')} - {task.end.toLocaleDateString('ru-RU')}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                        👤 <strong>Исполнитель:</strong> {task.assignee || 'Не назначен'}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        💰 <strong>Сумма:</strong> {task.sum || '0'} ₽
                                                    </Typography>
                                                </Paper>
                                            ))}
                                        </Box>
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
        </Box>
    );
};

export default KanbanBoard;
