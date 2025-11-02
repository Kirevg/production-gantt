import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton
} from '@mui/material';
import { CalendarToday as CalendarIcon } from '@mui/icons-material';
import VolumeButton from './VolumeButton';
import '../styles/buttons.css';

// Интерфейс для формы этапа
export interface StageFormData {
    sum: string;
    hours: string;
    startDate: string;
    duration: number;
    workTypeId: string;
    assigneeId: string;
}

// Интерфейс для пропсов компонента
interface EditStageDialogProps {
    open: boolean;                              // Открыт ли диалог
    editing: boolean;                           // Режим редактирования (true) или создания (false)
    stageForm: StageFormData;                  // Данные формы
    workTypes: Array<{ id: string; name: string }>;  // Список видов работ
    contractors: Array<{ id: string; name: string }>; // Список исполнителей
    onClose: () => void;                       // Обработчик закрытия
    onSave: () => void;                        // Обработчик сохранения
    onChange: (form: StageFormData) => void;   // Обработчик изменения данных формы
    formatSum?: (value: string) => string;     // Функция форматирования суммы (опционально)
    sumFieldProps?: React.InputHTMLAttributes<HTMLInputElement>;  // Дополнительные пропсы для поля суммы
}

// Общий компонент диалога редактирования этапа
const EditStageDialog: React.FC<EditStageDialogProps> = ({
    open,
    editing,
    stageForm,
    workTypes,
    contractors,
    onClose,
    onSave,
    onChange,
    formatSum,
    sumFieldProps
}) => {
    // Вычисляем дату окончания: дата начала + срок (дней)
    const calculateEndDate = (): string => {
        if (!stageForm.startDate) return '';
        const startDate = new Date(stageForm.startDate);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + stageForm.duration);
        return endDate.toISOString().split('T')[0];
    };

    const calculatedEndDate = calculateEndDate();
    return (
        <Dialog open={open} onClose={() => { }} maxWidth="sm" fullWidth disableEscapeKeyDown>
            <DialogTitle>
                {editing ? 'Редактировать этап' : 'Создать этап'}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    {/* Вид работ */}
                    <FormControl fullWidth required>
                        <InputLabel>Вид работ</InputLabel>
                        <Select
                            value={stageForm.workTypeId}
                            onChange={(e) => onChange({ ...stageForm, workTypeId: e.target.value })}
                            label="Вид работ"
                            required
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

                    {/* Исполнитель */}
                    <FormControl fullWidth>
                        <InputLabel>Исполнитель</InputLabel>
                        <Select
                            value={stageForm.assigneeId}
                            onChange={(e) => onChange({ ...stageForm, assigneeId: e.target.value })}
                            label="Исполнитель"
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

                    {/* Сумма и Часов */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="Сумма"
                            value={formatSum ? formatSum(stageForm.sum) : stageForm.sum}
                            onChange={(e) => onChange({ ...stageForm, sum: e.target.value })}
                            sx={{ flex: 1 }}
                            inputProps={sumFieldProps}
                        />
                        <TextField
                            label="Часов"
                            value={stageForm.hours}
                            onChange={(e) => onChange({ ...stageForm, hours: e.target.value })}
                            sx={{ flex: 1 }}
                        />
                    </Box>

                    {/* Дата начала и Срок */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ flex: 1, position: 'relative' }}>
                            <TextField
                                label="Дата начала"
                                type="date"
                                value={stageForm.startDate}
                                onChange={(e) => onChange({ ...stageForm, startDate: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: '100%' }}
                                InputProps={{
                                    inputProps: {
                                        lang: 'ru-RU'
                                    },
                                    endAdornment: (
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const input = e.currentTarget.parentElement?.querySelector('input[type="date"]') as HTMLInputElement;
                                                if (input) {
                                                    input.focus();
                                                    setTimeout(() => {
                                                        try {
                                                            input.showPicker?.();
                                                        } catch (error) {
                                                            input.click();
                                                        }
                                                    }, 0);
                                                }
                                            }}
                                            sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
                                        >
                                            <CalendarIcon fontSize="small" />
                                        </IconButton>
                                    )
                                }}
                            />
                        </Box>
                        <TextField
                            label="Срок (дни)"
                            type="number"
                            value={stageForm.duration}
                            onChange={(e) => onChange({ ...stageForm, duration: parseInt(e.target.value) || 1 })}
                            inputProps={{ min: 1 }}
                            sx={{ flex: 1 }}
                        />
                    </Box>

                    {/* Дата окончания (вычисляемое поле) */}
                    {calculatedEndDate && (
                        <TextField
                            label="Дата окончания"
                            type="date"
                            value={calculatedEndDate}
                            InputLabelProps={{ shrink: true }}
                            disabled
                            fullWidth
                            sx={{
                                '& .MuiInputBase-input.Mui-disabled': {
                                    WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)'
                                }
                            }}
                        />
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <VolumeButton onClick={onSave} color="blue">
                    {editing ? 'Сохранить' : 'Создать'}
                </VolumeButton>
                <VolumeButton onClick={onClose} color="orange">
                    Отмена
                </VolumeButton>
            </DialogActions>
        </Dialog>
    );
};

export default EditStageDialog;

