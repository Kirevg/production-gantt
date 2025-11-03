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
    CircularProgress
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import type { ProjectManager } from '../types/common';
import { formatPhoneDisplay } from '../utils/phoneUtils';
import PhoneInput from './PhoneInput';
import VolumeButton from './VolumeButton';

interface ProjectManagersListProps {
    canEdit: () => boolean;
    canCreate: () => boolean;
    canDelete: () => boolean;
}

const ProjectManagersList: React.FC<ProjectManagersListProps> = ({ canEdit, canCreate, canDelete }) => {
    const [managers, setManagers] = useState<ProjectManager[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditManagerForm, setShowEditManagerForm] = useState(false);
    const [editingManager, setEditingManager] = useState<ProjectManager | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletingManager, setDeletingManager] = useState<ProjectManager | null>(null);
    const [newManager, setNewManager] = useState({
        firstName: '',
        lastName: '',
        middleName: '',
        email: '',
        phone: ''
    });

    // Функция для загрузки списка руководителей
    const fetchManagers = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Токен авторизации не найден');
                setLoading(false);
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
                setError(null);
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
                setError(`Ошибка загрузки руководителей: ${errorData.error}`);
            }
        } catch (error) {
            setError(`Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManagers();
    }, []);

    // Обработчик создания нового руководителя
    const handleCreateManager = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/persons`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ...newManager,
                    middleName: newManager.middleName || undefined,
                    isProjectManager: true
                })
            });

            if (response.ok) {
                setShowCreateForm(false);
                setNewManager({ firstName: '', lastName: '', middleName: '', email: '', phone: '' });
                fetchManagers();
            } else {
                const errorData = await response.json();
                setError(`Ошибка создания руководителя: ${errorData.error || 'Неизвестная ошибка'}`);
            }
        } catch (error) {
            setError(`Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    // Обработчик редактирования руководителя
    const handleEditManager = (manager: ProjectManager) => {
        setEditingManager(manager);
        setShowEditManagerForm(true);
    };

    // Обработчик обновления руководителя
    const handleUpdateManager = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingManager) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/persons/${editingManager.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    firstName: editingManager.firstName,
                    lastName: editingManager.lastName,
                    middleName: editingManager.middleName || undefined,
                    email: editingManager.email,
                    phone: editingManager.phone
                })
            });

            if (response.ok) {
                setShowEditManagerForm(false);
                setEditingManager(null);
                fetchManagers();
            } else {
                const errorData = await response.json();
                setError(`Ошибка обновления руководителя: ${errorData.error || 'Неизвестная ошибка'}`);
            }
        } catch (error) {
            setError(`Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    // Обработчик удаления руководителя
    const handleDeleteManager = (manager: ProjectManager) => {
        setDeletingManager(manager);
        setShowDeleteDialog(true);
    };

    // Подтверждение удаления руководителя
    const confirmDeleteManager = async () => {
        if (!deletingManager) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/persons/${deletingManager.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                setShowDeleteDialog(false);
                setDeletingManager(null);
                fetchManagers();
            } else {
                const errorData = await response.json();
                setError(`Ошибка удаления руководителя: ${errorData.error || 'Неизвестная ошибка'}`);
            }
        } catch (error) {
            setError(`Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    // Индикатор загрузки
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={3} sx={{ width: '100%' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Отображение ошибки
    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Box className="page-container">
            {/* Заголовок и кнопка создания */}
            <Box className="page-header">
                <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px' }}>Список руководителей проектов</Typography>
                {canCreate() && (
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => setShowCreateForm(true)}
                        className="depth-button"
                        sx={{ fontSize: '14px' }}
                    >
                        Добавить руководителя
                    </Button>
                )}
            </Box>

            {/* Форма создания руководителя */}
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
                <DialogTitle>Добавить руководителя проекта</DialogTitle>
                <form onSubmit={handleCreateManager}>
                    <DialogContent>
                        <TextField
                            autoFocus
                            fullWidth
                            label="Фамилия"
                            value={newManager.lastName}
                            onChange={(e) => setNewManager({ ...newManager, lastName: e.target.value })}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Имя"
                            value={newManager.firstName}
                            onChange={(e) => setNewManager({ ...newManager, firstName: e.target.value })}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Отчество"
                            value={newManager.middleName}
                            onChange={(e) => setNewManager({ ...newManager, middleName: e.target.value })}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={newManager.email}
                            onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                            margin="normal"
                            required
                            inputProps={{
                                autoComplete: "username"
                            }}
                        />
                        <PhoneInput
                            value={newManager.phone}
                            onChange={(phone) => setNewManager({ ...newManager, phone })}
                            placeholder="+7 999 999-99-99"
                            required
                            sx={{ mt: 2, mb: 1 }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowCreateForm(false)} variant="contained" size="large" sx={{ fontSize: '14px' }}>Отмена</Button>
                        <VolumeButton type="submit" color="blue">Создать</VolumeButton>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Таблица с руководителями */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>ФИО</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Телефон</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '60px' }}>
                                <Delete fontSize="small" sx={{ color: 'red' }} />
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {managers.map((manager) => (
                            <TableRow
                                key={manager.id}
                                sx={{ height: '35px' }}
                                onDoubleClick={() => canEdit() && handleEditManager(manager)}
                                style={{ cursor: canEdit() ? 'pointer' : 'default' }}
                            >
                                <TableCell sx={{ fontWeight: 'medium', py: 0.5 }}>
                                    {manager.lastName} {manager.firstName} {manager.middleName || ''}
                                </TableCell>
                                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>{manager.email || '-'}</TableCell>
                                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>{formatPhoneDisplay(manager.phone || '')}</TableCell>
                                <TableCell sx={{ textAlign: 'center', py: 0.5, width: '60px' }}>
                                    {canDelete() && (
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDeleteManager(manager)}
                                            color="error"
                                            sx={{ minWidth: 'auto', padding: '4px' }}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Диалог редактирования руководителя */}
            <Dialog
                open={showEditManagerForm}
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
                <DialogTitle sx={{ pb: 1 }}>Редактировать руководителя</DialogTitle>
                <DialogContent>
                    {editingManager ? (
                        <Box component="form" sx={{ mt: 2, width: '100%' }}>
                            <TextField
                                fullWidth
                                label="Фамилия"
                                value={editingManager.lastName}
                                onChange={(e) => setEditingManager({ ...editingManager, lastName: e.target.value })}
                                margin="normal"
                                required
                            />
                            <TextField
                                fullWidth
                                label="Имя"
                                value={editingManager.firstName}
                                onChange={(e) => setEditingManager({ ...editingManager, firstName: e.target.value })}
                                margin="normal"
                                required
                            />
                            <TextField
                                fullWidth
                                label="Отчество"
                                value={editingManager.middleName || ''}
                                onChange={(e) => setEditingManager({ ...editingManager, middleName: e.target.value })}
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={editingManager.email || ''}
                                onChange={(e) => setEditingManager({ ...editingManager, email: e.target.value })}
                                margin="normal"
                            />
                            <PhoneInput
                                value={editingManager.phone || ''}
                                onChange={(phone) => setEditingManager({ ...editingManager, phone })}
                                placeholder="+7 999 999-99-99"
                                sx={{ mt: 2, mb: 1 }}
                            />
                        </Box>
                    ) : (
                        <Box sx={{ p: 2, textAlign: 'center', width: '100%' }}>
                            <Typography color="error">Данные руководителя не загружены</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setShowEditManagerForm(false);
                        setEditingManager(null);
                    }} variant="contained" size="large" sx={{ fontSize: '14px' }}>Отмена</Button>
                    <Button onClick={handleUpdateManager} variant="contained" size="large" sx={{ fontSize: '14px' }}>Сохранить</Button>
                </DialogActions>
            </Dialog>

            {/* Диалог удаления руководителя */}
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
                <DialogTitle>Удалить руководителя</DialogTitle>
                <DialogContent>
                    <Typography>
                        Вы уверены, что хотите удалить руководителя "{deletingManager?.lastName} {deletingManager?.firstName}"?
                        Это действие нельзя отменить.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDeleteDialog(false)} variant="contained" size="large" sx={{ fontSize: '14px' }}>Отмена</Button>
                    <Button onClick={confirmDeleteManager} variant="contained" size="large" sx={{ fontSize: '14px', backgroundColor: 'error.main', '&:hover': { backgroundColor: 'error.dark' } }}>
                        Удалить
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProjectManagersList;

