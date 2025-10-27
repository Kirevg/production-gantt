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
    serialNumber?: string | null;
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
                    name: stage.name || 'Этап', // Только название этапа, изделие показывается ниже
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
                    serialNumber: stage.serialNumber || null,
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

                            return Array.from(projectsMap.entries()).map(([projectId, tasks]) => {
                                const projectName = tasks[0]?.projectName || 'Без проекта';
                                
                                // Теперь группируем этапы этого проекта по изделиям
                                const productsMap = new Map<string, KanbanTask[]>();
                                tasks.forEach(task => {
                                    const productKey = `${task.productId || ''}:${task.productName || 'Без изделия'}`;
                                    if (!productsMap.has(productKey)) {
                                        productsMap.set(productKey, []);
                                    }
                                    productsMap.get(productKey)?.push(task);
                                });

                                return (
                                    <Box key={projectId} sx={{ mb: 4 }}>
                                        {/* Заголовок проекта */}
                                        <Paper
                                            sx={{
                                                p: '8px',
                                                mb: 1,
                                                backgroundColor: '#f5f5f5',
                                                borderLeft: '4px solid #1976d2'
                                            }}
                                        >
                                                                                         <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                📋 Проект: {projectName} - Изделий: {productsMap.size}
                                            </Typography>
                                        </Paper>
                                        
                                        {/* Группировка по изделиям */}
                                        {Array.from(productsMap.entries()).map(([productKey, productTasks]) => {
                                            const productName = productTasks[0]?.productName || 'Без изделия';
                                            const serialNumber = productTasks[0]?.serialNumber;
                                            // Формируем полное название с серийным номером
                                            const productDisplayName = serialNumber 
                                                ? `${productName} (SN: ${serialNumber})` 
                                                : productName;
                                            return (
                                                <Box key={productKey} sx={{ mb: 2, ml: 2 }}>
                                                    {/* Заголовок изделия */}
                                                    <Paper
                                                        sx={{
                                                            p: 1,
                                                            mb: 1,
                                                            backgroundColor: '#fafafa',
                                                            borderLeft: '3px solid #4caf50'
                                                        }}
                                                    >
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                                            🏗️ Изделие: {productDisplayName} - Этапов: {productTasks.length}
                                                        </Typography>
                                                    </Paper>
                                                    
                                                    {/* Карточки этапов работ этого изделия */}
                                                    <Box sx={{
                                                        display: 'flex',
                                                        flexWrap: 'wrap',
                                                        gap: 1,
                                                        ml: 2
                                                    }}>
                                                        {productTasks.map((task) => (
                                                            <Paper
                                                                key={task.id}
                                                                sx={{
                                                                    p: '4px',
                                                                    minWidth: '150px',
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
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: '30px' }}>
                                                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                                        {task.name}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ color: '#666', fontSize: '0.85em' }}>
                                                                        📅 {task.start.toLocaleDateString('ru-RU')} - {task.end.toLocaleDateString('ru-RU')}
                                                                    </Typography>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        👤 {task.assignee || 'Не назначен'}
                                                                    </Typography>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        💰 <strong>Сумма:</strong> {task.sum || '0'} ₽
                                                                    </Typography>
                                                                </Box>
                                                            </Paper>
                                                        ))}
                                                    </Box>
                                                </Box>
                                            );
                                        })}
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
