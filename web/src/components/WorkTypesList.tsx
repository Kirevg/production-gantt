import React, { useState, useEffect } from 'react';
import '../styles/buttons.css';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

interface WorkType {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface WorkTypesListProps {
    canEdit: () => boolean;
    canCreate: () => boolean;
    canDelete: () => boolean;
}

const WorkTypesList: React.FC<WorkTypesListProps> = ({ canEdit, canCreate, canDelete }) => {
    const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingWorkType, setEditingWorkType] = useState<WorkType | null>(null);
    const [workTypeForm, setWorkTypeForm] = useState({
        name: '',
        description: ''
    });

    const fetchWorkTypes = async () => {
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
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setWorkTypes(data);
        } catch (error) {
            console.error('Ошибка загрузки видов работ:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkTypes();
    }, []);

    const handleOpenDialog = (workType?: WorkType) => {
        if (workType) {
            setEditingWorkType(workType);
            setWorkTypeForm({
                name: workType.name,
                description: workType.description || ''
            });
        } else {
            setEditingWorkType(null);
            setWorkTypeForm({
                name: '',
                description: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingWorkType(null);
        setWorkTypeForm({
            name: '',
            description: ''
        });
    };

    const handleSaveWorkType = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            const url = editingWorkType
                ? `${import.meta.env.VITE_API_BASE_URL}/nomenclature/${editingWorkType.id}`
                : `${import.meta.env.VITE_API_BASE_URL}/nomenclature`;

            const method = editingWorkType ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...workTypeForm,
                    type: 'Work'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchWorkTypes();
            handleCloseDialog();
        } catch (error) {
            console.error('Ошибка сохранения вида работ:', error);
            alert('Произошла ошибка при сохранении. Попробуйте еще раз.');
        }
    };

    const handleDeleteWorkType = async (id: string) => {
        if (!confirm('Вы уверены, что хотите удалить этот вид работ?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 400) {
                    const errorData = await response.json();
                    alert(errorData.error);
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchWorkTypes();
        } catch (error) {
            console.error('Ошибка удаления вида работ:', error);
            alert('Произошла ошибка при удалении. Попробуйте еще раз.');
        }
    };

    if (loading) {
        return <Typography>Загрузка...</Typography>;
    }

    return (
        <Box className="page-container">
            <Box className="page-header">
                <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px' }}>
                    Виды работ
                </Typography>
                {canCreate() && (
                    <Button
                        variant="contained"
                        onClick={() => handleOpenDialog()}
                        className="depth-button"
                        sx={{ fontSize: '14px' }}
                    >
                        Добавить вид работ
                    </Button>
                )}
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Название</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Описание</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '60px' }}>
                                <DeleteIcon fontSize="small" sx={{ color: 'red' }} />
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {workTypes.map((workType) => (
                            <TableRow
                                key={workType.id}
                                sx={{ height: '35px' }}
                                onDoubleClick={() => canEdit() && handleOpenDialog(workType)}
                                style={{ cursor: canEdit() ? 'pointer' : 'default' }}
                            >
                                <TableCell sx={{ py: 0.5 }}>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                        {workType.name}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ py: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {workType.description || '-'}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ py: 0.5, textAlign: 'center', width: '60px' }}>
                                    {canDelete() && (
                                        <IconButton
                                            onClick={() => handleDeleteWorkType(workType.id)}
                                            color="error"
                                            size="small"
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

            {/* Диалог создания/редактирования вида работ */}
            <Dialog
                open={openDialog}
                onClose={() => { }}
                maxWidth="md"
                fullWidth
                disableEscapeKeyDown={true}
                hideBackdrop={true}
                disablePortal={true}
                disableScrollLock={true}
                keepMounted={false}
                disableEnforceFocus={true}
                disableAutoFocus={true}
            >
                <DialogTitle>
                    {editingWorkType ? 'Редактировать вид работ' : 'Создать вид работ'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Название вида работ"
                            value={workTypeForm.name}
                            onChange={(e) => setWorkTypeForm({ ...workTypeForm, name: e.target.value })}
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Описание"
                            value={workTypeForm.description}
                            onChange={(e) => setWorkTypeForm({ ...workTypeForm, description: e.target.value })}
                            fullWidth
                            multiline
                            rows={3}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Отмена</Button>
                    <Button onClick={handleSaveWorkType} variant="contained" className="depth-button" sx={{ fontSize: '14px' }}>
                        {editingWorkType ? 'Сохранить' : 'Создать'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default WorkTypesList;
