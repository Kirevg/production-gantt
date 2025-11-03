import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    TextField,
    MenuItem
} from '@mui/material';
import VolumeButton from './VolumeButton';
import '../styles/buttons.css';

// Интерфейс для данных проекта
export interface ProjectFormData {
    name: string;
    managerId: string;
    status: 'InProject' | 'InProgress' | 'Done' | 'HasProblems';
}

// Интерфейс для пропсов компонента
interface ProjectDialogProps {
    open: boolean;                              // Открыт ли диалог
    editing: boolean;                           // Режим редактирования (true) или создания (false)
    projectForm: ProjectFormData;               // Данные формы проекта
    managers: Array<{                          // Список менеджеров проектов
        id: string;
        lastName: string;
        firstName: string;
        middleName?: string | null;
    }>;
    onClose: () => void;                       // Обработчик закрытия
    onSave: () => void;                        // Обработчик сохранения
    onChange: (form: ProjectFormData) => void;  // Обработчик изменения данных формы
}

// Общий компонент диалога создания/редактирования проекта
const ProjectDialog: React.FC<ProjectDialogProps> = ({
    open,
    editing,
    projectForm,
    managers,
    onClose,
    onSave,
    onChange
}) => {
    return (
        <Dialog
            open={open}
            onClose={() => { }}
            maxWidth="md"
            fullWidth
            disableEscapeKeyDown
            PaperProps={{
                sx: {
                    width: '600px',
                    maxWidth: '600px'
                }
            }}
        >
            <DialogTitle>
                {editing ? 'Редактировать проект' : 'Создать проект'}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    {/* Название проекта */}
                    <TextField
                        fullWidth
                        label="Название проекта"
                        value={projectForm.name}
                        onChange={(e) => onChange({ ...projectForm, name: e.target.value })}
                        required
                        InputLabelProps={{ shrink: true }}
                    />

                    {/* Руководитель проекта */}
                    <TextField
                        fullWidth
                        select
                        label="Руководитель проекта"
                        value={projectForm.managerId}
                        onChange={(e) => onChange({ ...projectForm, managerId: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                    >
                        <MenuItem value="">Не назначен</MenuItem>
                        {managers.map((manager) => (
                            <MenuItem key={manager.id} value={manager.id}>
                                {manager.lastName} {manager.firstName} {manager.middleName || ''}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Статус проекта */}
                    <TextField
                        fullWidth
                        select
                        label="Статус"
                        value={projectForm.status}
                        onChange={(e) => onChange({ ...projectForm, status: e.target.value as 'InProject' | 'InProgress' | 'Done' | 'HasProblems' })}
                        InputLabelProps={{ shrink: true }}
                    >
                        <MenuItem value="InProject">В проекте</MenuItem>
                        <MenuItem value="InProgress">В работе</MenuItem>
                        <MenuItem value="Done">Завершён</MenuItem>
                        <MenuItem value="HasProblems">Проблемы</MenuItem>
                    </TextField>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <VolumeButton onClick={onSave} color="blue">
                    Сохранить
                </VolumeButton>
                <VolumeButton onClick={onClose} color="orange">
                    Отмена
                </VolumeButton>
            </DialogActions>
        </Dialog>
    );
};

export default ProjectDialog;

