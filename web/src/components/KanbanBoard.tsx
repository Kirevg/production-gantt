import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import VolumeButton from './VolumeButton';

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
    productId?: string;
    productName?: string;
    serialNumber?: string | null;
    projectStatus?: string;
    assigneeId?: string | null;
    workTypeId?: string | null;
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

const KanbanBoard: React.FC<KanbanBoardProps> = ({ onOpenStage }) => {
    const [kanbanTasks, setKanbanTasks] = useState<KanbanTask[]>([]);
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

                console.log('📊 Данные этапа из API:', {
                    id: stage.id,
                    name: stage.name,
                    workTypeId: stage.workTypeId,
                    _debug: stage._debug
                });

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
                    assigneeId: stage.assigneeId || null,
                    workTypeId: stage.workTypeId || null,
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
        console.log('Клик по карточке:', task);
        console.log('workTypeId из задачи:', task.workTypeId);
        setEditingTask(task);
        // Форматируем дату для input
        const startDate = task.start.toISOString().split('T')[0];
        const duration = Math.ceil((task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Используем тот же подход что в StagesPage: преобразуем в строку или пустую строку
        setStageForm({
            sum: task.sum || '',
            hours: task.hours || '',
            startDate: startDate,
            duration: duration,
            workTypeId: (task.workTypeId || '') as string,
            assigneeId: (task.assigneeId || '') as string
        });
        console.log('stageForm после установки:', { workTypeId: (task.workTypeId || '') });
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
            const startDate = new Date(stageForm.startDate);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + stageForm.duration);

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

            const response = await fetch(
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
                                                    borderRadius: '2px'
                                                }}
                                            >
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                    📋 Проект: {projectName} - Изделий: {productsMap.size}
                                                </Typography>
                                            </Box>
                                            
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
                                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                                                                 <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                                                     🏗️ Изделие: {productName}
                                                                 </Typography>
                                                                                                                                   {serialNumber && (
                                                                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                                                          (Сер №: {serialNumber})
                                                                      </Typography>
                                                                  )}
                                                                 <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                                                     - Этапов: {productTasks.length}
                                                                 </Typography>
                                                             </Box>
                                                         </Box>
                                                         
                                                         {/* Карточки этапов работ этого изделия */}
                                                         <Box sx={{
                                                             display: 'flex',
                                                             flexWrap: 'wrap',
                                                             gap: 1
                                                         }}>
                                                                                                                              {productTasks.map((task) => (
                                                                                                                                                                                                                         <Paper
                                                                            key={task.id}
                                                                            sx={{
                                                                                p: '4px',
                                                                                minWidth: '150px',
                                                                                border: '2px solid #616161',
                                                                                cursor: 'pointer',
                                                                                transition: 'all 0.2s ease',
                                                                                '&:hover': {
                                                                                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                                                                    transform: 'translateY(-2px)'
                                                                                }
                                                                            }}
                                                                            onDoubleClick={() => handleCardClick(task)}
                                                                        >
                                                                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: '30px' }}>
                                                                             <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                                                 {task.name}
                                                                             </Typography>
                                                                                                                                                      <Typography variant="caption" sx={{ color: '#666', fontSize: '0.85em' }}>
                                                                                 📅 {new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(task.start)} - {new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(task.end)}
                                                                             </Typography>
                                                                         </Box>
                                                                                                                                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                                                             <Typography variant="body2" color="text.secondary">
                                                                                 👤 {task.assignee || 'Не назначен'}
                                                                             </Typography>
                                                                             <Typography variant="body2" color="text.secondary">
                                                                                 💰 <strong>Сумма:</strong> {formatSum(task.sum)} ₽
                                                                             </Typography>
                                                                         </Box>
                                                                     </Paper>
                                                                 ))}
                                                         </Box>
                                                     </Paper>
                                                 </Box>
                                             );
                                            })}
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
            <Dialog open={openEditDialog} onClose={() => { }} maxWidth="sm" fullWidth disableEscapeKeyDown>
                <DialogTitle>
                    {editingTask ? 'Редактировать этап' : 'Создать этап'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <FormControl fullWidth required>
                            <InputLabel shrink>Вид работ</InputLabel>
                            <Select
                                value={stageForm.workTypeId}
                                onChange={(e) => setStageForm({ ...stageForm, workTypeId: e.target.value })}
                                label="Вид работ"
                                required
                                notched
                            >
                                <MenuItem value="">
                                    <em>Не выбран</em>
                                </MenuItem>
                                {workTypes.map((workType) => (
                                    <MenuItem key={workType.id} value={workType.id}>
                                        {workType.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel shrink>Исполнитель</InputLabel>
                            <Select
                                value={stageForm.assigneeId}
                                onChange={(e) => setStageForm({ ...stageForm, assigneeId: e.target.value })}
                                label="Исполнитель"
                                notched
                            >
                                <MenuItem value="">
                                    <em>Не выбран</em>
                                </MenuItem>
                                {contractors.map((contractor) => (
                                    <MenuItem key={contractor.id} value={contractor.id}>
                                        {contractor.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Сумма"
                                value={formatSum(stageForm.sum)}
                                onChange={(e) => setStageForm({ ...stageForm, sum: e.target.value })}
                                inputProps={{ style: { textAlign: 'right' } }}
                                sx={{ flex: 1 }}
                            />
                            <TextField
                                label="Часов"
                                value={stageForm.hours}
                                onChange={(e) => setStageForm({ ...stageForm, hours: e.target.value })}
                                sx={{ flex: 1 }}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ flex: 1, position: 'relative' }}>
                                <TextField
                                    label="Дата начала"
                                    type="date"
                                    value={stageForm.startDate ? (typeof stageForm.startDate === 'string' ? stageForm.startDate.split('T')[0] : new Date(stageForm.startDate).toISOString().split('T')[0]) : ''}
                                    onChange={(e) => {
                                        setStageForm({ ...stageForm, startDate: e.target.value });
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ width: '100%' }}
                                    InputProps={{
                                        endAdornment: (
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    const input = e.currentTarget.parentElement?.querySelector('input[type="date"]') as HTMLInputElement;
                                                    if (input) {
                                                        input.focus();
                                                        // Используем setTimeout для корректного вызова showPicker
                                                        setTimeout(() => {
                                                            try {
                                                                input.showPicker?.();
                                                            } catch (error) {
                                                                // Если showPicker не работает, просто фокусируемся
                                                                input.click();
                                                            }
                                                        }, 0);
                                                    }
                                                }}
                                                sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
                                            >
                                                📅
                                            </IconButton>
                                        )
                                    }}
                                />
                            </Box>
                            <TextField
                                label="Срок (дни)"
                                type="number"
                                value={stageForm.duration}
                                onChange={(e) => setStageForm({ ...stageForm, duration: parseInt(e.target.value) || 1 })}
                                inputProps={{ min: 1 }}
                                sx={{ flex: 1 }}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <VolumeButton onClick={handleSaveStage} variant="contained" color="blue" sx={{ fontSize: '14px' }}>
                        {editingTask ? 'Сохранить' : 'Создать'}
                    </VolumeButton>
                    <VolumeButton onClick={handleCloseEditDialog} color="orange">
                        Отмена
                    </VolumeButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default KanbanBoard;
