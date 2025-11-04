import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, Tooltip } from '@mui/material';
import { ZoomIn, ZoomOut, Refresh } from '@mui/icons-material';

// Интерфейс для задач Gantt-диаграммы
interface GanttTask {
    id: string;
    name: string;
    start: Date;
    end: Date;
    progress: number;
    dependencies?: string[];
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


interface GanttChartProps {
    // Пока без параметров
}

const GanttChart: React.FC<GanttChartProps> = () => {
    const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // Загрузка данных для Gantt-диаграммы
    const fetchGanttData = async () => {
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
            // console.log('📊 Получены данные Gantt:', data);

            // Преобразуем данные в формат для React Gantt Chart
            const tasks: GanttTask[] = data.map((stage: any) => {
                const startDate = new Date(stage.start);
                const endDate = new Date(stage.end);

                // Проверяем валидность дат
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    // console.warn('⚠️ Невалидная дата для этапа:', stage);
                    return null;
                }

                return {
                    id: stage.id,
                    name: `${stage.projectName || 'Проект'} - ${stage.productName || 'Изделие'} - ${stage.name || 'Этап'}`,
                    start: startDate,
                    end: endDate,
                    progress: Math.min(Math.max(stage.progress || 0, 0), 100), // Ограничиваем прогресс 0-100
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
            }).filter(Boolean); // Убираем null значения

            // console.log('🎯 Преобразованные задачи:', tasks);
            // console.log('🔍 Количество задач:', tasks.length);

            // if (tasks.length > 0) {
            //     console.log('🔍 Первая задача:', tasks[0]);
            //     console.log('🔍 Типы данных:', tasks.map(t => ({
            //         id: typeof t.id,
            //         name: typeof t.name,
            //         start: typeof t.start,
            //         end: typeof t.end,
            //         progress: typeof t.progress
            //     })));
            // }

            setGanttTasks(tasks);
        } catch (err) {
            // console.error('Ошибка загрузки данных Gantt:', err);
            setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    };

    // Данные для React Gantt Chart уже готовы в ganttTasks

    // Загружаем данные при монтировании компонента
    useEffect(() => {
        fetchGanttData();
    }, []);



    // Обработчики масштабирования (пока заглушки)
    const handleZoomIn = () => {
        // console.log('Увеличить масштаб');
    };

    const handleZoomOut = () => {
        // console.log('Уменьшить масштаб');
    };

    const handleRefresh = () => {
        // Перезагружаем данные с сервера
        fetchGanttData();
    };

    return (
        <Box sx={{ width: '100%', height: '600px' }}>
            {/* Заголовок с кнопками управления */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                p: 2,
                backgroundColor: '#f5f5f5',
                borderRadius: 1
            }}>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Увеличить масштаб">
                        <IconButton onClick={handleZoomIn} size="small">
                            <ZoomIn />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Уменьшить масштаб">
                        <IconButton onClick={handleZoomOut} size="small">
                            <ZoomOut />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Обновить">
                        <IconButton onClick={handleRefresh} size="small">
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Gantt-диаграмма */}
            <Paper sx={{ height: 'calc(100% - 80px)', overflow: 'auto' }}>
                {loading ? (
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
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
                ) : ganttTasks.length > 0 ? (
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        flexDirection: 'column',
                        gap: 2,
                        p: 4
                    }}>
                    </Box>
                ) : (
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        flexDirection: 'column',
                        gap: 2
                    }}>
                        <Typography variant="h6" color="text.secondary">
                            Нет этапов для отображения
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Добавьте этапы работ, чтобы увидеть Gantt-диаграмму
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default GanttChart;

