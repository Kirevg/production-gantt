import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, Tooltip } from '@mui/material';
import { ZoomIn, ZoomOut, Refresh } from '@mui/icons-material';
import Gantt from 'react-gantt';

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
}

// Интерфейс для этапов работ (из существующего кода)
interface Stage {
    id: string;
    sum: string;
    hours?: string;
    startDate: string;
    duration: number;
    endDate: string;
    workTypeId?: string;
    nomenclatureItem?: {
        id: string;
        name: string;
    };
    assigneeId?: string;
    assignee?: {
        id: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
}

interface GanttChartProps {
    projectId: string;
    productId?: string;
    stages: Stage[];
    onStageUpdate?: (stageId: string, updates: Partial<Stage>) => void;
    onStageCreate?: (stage: Omit<Stage, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onStageDelete?: (stageId: string) => void;
    canEdit: () => boolean;
    canCreate: () => boolean;
    canDelete: () => boolean;
}

const GanttChart: React.FC<GanttChartProps> = ({
    projectId,
    productId,
    stages,
    onStageUpdate,
    onStageCreate,
    onStageDelete,
    canEdit,
    canCreate,
    canDelete
}) => {
    const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([]);
    const [zoom, setZoom] = useState<number>(1);

    // Преобразование этапов работ в задачи для Gantt
    const convertStagesToGanttTasks = (stages: Stage[]): GanttTask[] => {
        return stages.map((stage) => {
            const startDate = new Date(stage.startDate);
            const endDate = new Date(stage.endDate);
            
            return {
                id: stage.id,
                name: stage.nomenclatureItem?.name || 'Не указан',
                start: startDate,
                end: endDate,
                progress: 0, // Пока без прогресса
                assignee: stage.assignee?.name || 'Не назначен',
                workType: stage.nomenclatureItem?.name || 'Не указан',
                sum: stage.sum,
                hours: stage.hours || '0'
            };
        });
    };

    // Обновление задач при изменении этапов
    useEffect(() => {
        const tasks = convertStagesToGanttTasks(stages);
        setGanttTasks(tasks);
    }, [stages]);

    // Обработчики для Gantt-диаграммы
    const handleTaskUpdate = (task: GanttTask) => {
        if (!canEdit() || !onStageUpdate) return;

        const stageUpdates: Partial<Stage> = {
            startDate: task.start.toISOString(),
            endDate: task.end.toISOString(),
            duration: Math.ceil((task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24))
        };

        onStageUpdate(task.id, stageUpdates);
    };

    const handleTaskCreate = (task: GanttTask) => {
        if (!canCreate() || !onStageCreate) return;

        const newStage: Omit<Stage, 'id' | 'createdAt' | 'updatedAt'> = {
            sum: '',
            hours: '0',
            startDate: task.start.toISOString(),
            endDate: task.end.toISOString(),
            duration: Math.ceil((task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24)),
            workTypeId: '',
            assigneeId: ''
        };

        onStageCreate(newStage);
    };

    const handleTaskDelete = (taskId: string) => {
        if (!canDelete() || !onStageDelete) return;
        onStageDelete(taskId);
    };

    // Обработчики масштабирования
    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.2, 3));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.2, 0.5));
    };

    const handleRefresh = () => {
        // Обновляем данные
        const tasks = convertStagesToGanttTasks(stages);
        setGanttTasks(tasks);
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
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Gantt-диаграмма проекта
                </Typography>
                
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
                {ganttTasks.length > 0 ? (
                    <Gantt
                        tasks={ganttTasks}
                        onTaskUpdate={handleTaskUpdate}
                        onTaskCreate={handleTaskCreate}
                        onTaskDelete={handleTaskDelete}
                        zoom={zoom}
                        viewMode="day"
                        locale="ru"
                        dateFormat="DD.MM.YYYY"
                        showTooltip={true}
                        showCriticalPath={true}
                        showDependencies={true}
                        allowTaskDrag={canEdit()}
                        allowTaskResize={canEdit()}
                        allowTaskCreate={canCreate()}
                        allowTaskDelete={canDelete()}
                        style={{
                            height: '100%',
                            width: '100%'
                        }}
                    />
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

