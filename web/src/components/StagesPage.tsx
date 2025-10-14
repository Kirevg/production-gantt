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
    Delete as DeleteIcon
} from '@mui/icons-material';
import VolumeButton from './VolumeButton';


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
        assigneeId: '',
        progress: 0
    });

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
                console.log('📊 Stages data from API:', data);
                if (data.length > 0) {
                    console.log('📅 First stage endDate:', data[0].endDate);
                    console.log('📅 First stage startDate:', data[0].startDate);
                    console.log('📅 First stage duration:', data[0].duration);
                }
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
                assigneeId: stage.assignee?.id || stage.assigneeId || '',
                progress: stage.progress
            });
        } else {
            setEditingStage(null);
            setStageForm({
                sum: '',
                hours: '',
                startDate: '',
                duration: 1,
                workTypeId: '',
                assigneeId: '',
                progress: 0
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
            assigneeId: '',
            progress: 0
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
                endDate.setDate(startDate.getDate() + stageForm.duration);
            }

            const requestData = {
                sum: stageForm.sum,
                hours: stageForm.hours,
                startDate: stageForm.startDate || null,
                endDate: endDate ? endDate.toISOString() : null,
                duration: stageForm.duration,
                nomenclatureItemId: stageForm.workTypeId || undefined,
                assigneeId: stageForm.assigneeId || undefined,
                progress: stageForm.progress,
                productId: productId
            };

            if (editingStage) {
                (requestData as any).version = editingStage.version;
            } else {
                (requestData as any).orderIndex = 0;
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

    const handleBackToProject = () => {
        if (onBack) {
            onBack();
        } else {
            // Возвращаемся к карточке проекта
            window.history.back();
        }
    };

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
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
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
                            <TableBody>
                                {stages.map((stage) => (
                                    <TableRow
                                        key={stage.id}
                                        sx={{ height: '35px' }}
                                        onDoubleClick={() => canEdit() && handleOpenStageDialog(stage)}
                                        style={{ cursor: canEdit() ? 'pointer' : 'default' }}
                                    >
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
                                        <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
                                            <Typography variant="body2">
                                                {(() => {
                                                    if (!stage.sum || !stage.hours) return '0.00';
                                                    const sumValue = parseFloat(String(stage.sum).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
                                                    const hoursValue = parseFloat(stage.hours || '0');
                                                    return hoursValue > 0 ? (sumValue / hoursValue).toFixed(2) : '0.00';
                                                })()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 0.5, textAlign: 'center' }}>{formatDate(stage.startDate)}</TableCell>
                                        <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
                                            <Typography variant="body2">
                                                {stage.duration} дн.
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
                                            {stage.endDate ? formatDate(stage.endDate) : (
                                                <Typography variant="body2" color="text.secondary">-</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ py: 0.5, textAlign: 'center', width: '60px' }}>
                                            {canDelete() && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteStage(stage.id)}
                                                    color="error"
                                                    title="Удалить этап"
                                                    sx={{ minWidth: 'auto', padding: '4px' }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* Диалог создания/редактирования этапа */}
            <Dialog open={openStageDialog} onClose={() => { }} maxWidth="sm" fullWidth disableEscapeKeyDown>
                <DialogTitle>
                    {editingStage ? 'Редактировать этап' : 'Создать этап'}
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
                                value={stageForm.sum}
                                onChange={(e) => setStageForm({ ...stageForm, sum: e.target.value })}
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
                                label="Срок"
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
                    <Button onClick={handleCloseStageDialog}>Отмена</Button>
                    <Button onClick={handleSaveStage} variant="contained" sx={{ fontSize: '14px' }}>
                        {editingStage ? 'Сохранить' : 'Создать'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default StagesPage;
