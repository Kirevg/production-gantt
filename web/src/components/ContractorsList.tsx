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
    CircularProgress,
    Chip,
    FormControlLabel,
    Checkbox
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Contractor } from '../types/common';
import { formatPhoneDisplay } from '../utils/phoneUtils';
import PhoneInput from './PhoneInput';

interface ContractorsListProps {
    canEdit: () => boolean;
    canCreate: () => boolean;
    canDelete: () => boolean;
}

const ContractorsList: React.FC<ContractorsListProps> = ({ canEdit, canCreate, canDelete }) => {
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditContractorForm, setShowEditContractorForm] = useState(false);
    const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletingContractor, setDeletingContractor] = useState<Contractor | null>(null);
    const [newContractor, setNewContractor] = useState({
        name: '',
        contactName: '',
        phone: '',
        email: ''
    });

    // Функция для загрузки списка исполнителей
    const fetchContractors = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Токен авторизации не найден');
                setLoading(false);
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/counterparties?isContractor=true`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setContractors(data);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Ошибка загрузки исполнителей');
            }
        } catch {
            setError('Ошибка сети');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContractors();
    }, []);

    // Обработчик создания нового исполнителя
    const handleCreateContractor = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/counterparties`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...newContractor,
                    email: newContractor.email || undefined,
                    isContractor: true
                }),
            });

            if (response.ok) {
                await fetchContractors();
                setShowCreateForm(false);
                setNewContractor({ name: '', contactName: '', phone: '', email: '' });
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Ошибка создания исполнителя');
            }
        } catch {
            setError('Ошибка сети');
        }
    };

    // Обработчик редактирования исполнителя
    const handleEditContractor = (contractor: Contractor) => {
        setEditingContractor(contractor);
        setShowEditContractorForm(true);
    };

    // Обработчик обновления исполнителя
    const handleUpdateContractor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingContractor) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/counterparties/${editingContractor.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: editingContractor.name,
                    contactName: editingContractor.contactName,
                    phone: editingContractor.phone,
                    email: editingContractor.email || undefined,
                    isActive: editingContractor.isActive
                }),
            });

            if (response.ok) {
                await fetchContractors();
                setShowEditContractorForm(false);
                setEditingContractor(null);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Ошибка обновления исполнителя');
            }
        } catch {
            setError('Ошибка сети');
        }
    };

    // Обработчик удаления исполнителя
    const handleDeleteContractor = (contractor: Contractor) => {
        setDeletingContractor(contractor);
        setShowDeleteDialog(true);
    };

    // Подтверждение удаления исполнителя
    const confirmDeleteContractor = async () => {
        if (!deletingContractor) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/counterparties/${deletingContractor.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                await fetchContractors();
                setShowDeleteDialog(false);
                setDeletingContractor(null);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Ошибка удаления исполнителя');
            }
        } catch {
            setError('Ошибка сети');
        }
    };

    // Индикатор загрузки
    if (loading) {
        return (
            <Box sx={{ width: '100%', maxWidth: 'none' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px', mb: 4 }}>
                    Исполнители
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, width: '100%' }}>
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    return (
        <Box className="page-container">
            <Box className="page-header">
                <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px' }}>
                    Список исполнителей
                </Typography>
                {canCreate() && (
                    <Button
                        variant="contained"
                        onClick={() => setShowCreateForm(true)}
                        className="depth-button"
                        sx={{ fontSize: '14px' }}
                    >
                        Добавить исполнителя
                    </Button>
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Название</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Контактное лицо</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Телефон</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Статус</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '60px' }}>
                                <DeleteIcon fontSize="small" sx={{ color: 'red' }} />
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {contractors.map((contractor) => (
                            <TableRow
                                key={contractor.id}
                                sx={{ height: '35px' }}
                                onDoubleClick={() => canEdit() && handleEditContractor(contractor)}
                                style={{ cursor: canEdit() ? 'pointer' : 'default' }}
                            >
                                <TableCell sx={{ py: 0.5 }}>{contractor.name}</TableCell>
                                <TableCell sx={{ py: 0.5 }}>{contractor.contactName}</TableCell>
                                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>{formatPhoneDisplay(contractor.phone)}</TableCell>
                                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>{contractor.email || '-'}</TableCell>
                                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
                                    <Chip
                                        label={contractor.isActive ? 'Активен' : 'Неактивен'}
                                        color={contractor.isActive ? 'success' : 'default'}
                                        size="small"
                                        sx={{ width: '100px', borderRadius: '6px' }}
                                    />
                                </TableCell>
                                <TableCell sx={{ py: 0.5, textAlign: 'center', width: '60px' }}>
                                    {canDelete() && (
                                        <IconButton onClick={() => handleDeleteContractor(contractor)} size="small" color="error" sx={{ minWidth: 'auto', padding: '4px' }}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Форма создания исполнителя */}
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
                <DialogTitle>Добавить исполнителя</DialogTitle>
                <form onSubmit={handleCreateContractor}>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Название"
                            fullWidth
                            variant="outlined"
                            value={newContractor.name}
                            onChange={(e) => setNewContractor({ ...newContractor, name: e.target.value })}
                            required
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="dense"
                            label="Контактное лицо"
                            fullWidth
                            variant="outlined"
                            value={newContractor.contactName}
                            onChange={(e) => setNewContractor({ ...newContractor, contactName: e.target.value })}
                            required
                            sx={{ mb: 2 }}
                        />
                        <PhoneInput
                            value={newContractor.phone}
                            onChange={(phone) => setNewContractor({ ...newContractor, phone })}
                            placeholder="+7 999 999-99-99"
                            required
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="dense"
                            label="Email"
                            type="email"
                            fullWidth
                            variant="outlined"
                            value={newContractor.email}
                            onChange={(e) => setNewContractor({ ...newContractor, email: e.target.value })}
                            sx={{ mb: 2 }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowCreateForm(false)} variant="contained" size="large" sx={{ fontSize: '14px' }}>Отмена</Button>
                        <Button type="submit" variant="contained" size="large" className="depth-button" sx={{ fontSize: '14px' }}>Создать</Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Форма редактирования исполнителя */}
            <Dialog
                open={showEditContractorForm}
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
                <DialogTitle>Редактировать исполнителя</DialogTitle>
                {editingContractor ? (
                    <form onSubmit={handleUpdateContractor}>
                        <DialogContent>
                            <TextField
                                autoFocus
                                margin="dense"
                                label="Название"
                                fullWidth
                                variant="outlined"
                                value={editingContractor.name}
                                onChange={(e) => setEditingContractor({ ...editingContractor, name: e.target.value })}
                                required
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                margin="dense"
                                label="Контактное лицо"
                                fullWidth
                                variant="outlined"
                                value={editingContractor.contactName}
                                onChange={(e) => setEditingContractor({ ...editingContractor, contactName: e.target.value })}
                                required
                                sx={{ mb: 2 }}
                            />
                            <PhoneInput
                                value={editingContractor.phone}
                                onChange={(phone) => setEditingContractor({ ...editingContractor, phone })}
                                placeholder="+7 999 999-99-99"
                                required
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                margin="dense"
                                label="Email"
                                type="email"
                                fullWidth
                                variant="outlined"
                                value={editingContractor.email || ''}
                                onChange={(e) => setEditingContractor({ ...editingContractor, email: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={editingContractor.isActive}
                                        onChange={(e) => setEditingContractor({ ...editingContractor, isActive: e.target.checked })}
                                    />
                                }
                                label="Активен"
                                sx={{ mt: 2 }}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setShowEditContractorForm(false)} variant="contained" size="large" sx={{ fontSize: '14px' }}>Отмена</Button>
                            <Button type="submit" variant="contained" size="large" sx={{ fontSize: '14px' }}>Сохранить</Button>
                        </DialogActions>
                    </form>
                ) : (
                    <DialogContent>
                        <Box sx={{ p: 2, textAlign: 'center', width: '100%' }}>
                            <Typography color="error">Данные исполнителя не загружены</Typography>
                        </Box>
                    </DialogContent>
                )}
            </Dialog>

            {/* Диалог подтверждения удаления */}
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
                <DialogTitle>Удалить исполнителя</DialogTitle>
                <DialogContent>
                    <Typography>
                        Вы уверены, что хотите удалить исполнителя "{deletingContractor?.name}"?
                        Это действие нельзя отменить.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDeleteDialog(false)} variant="contained" size="large" sx={{ fontSize: '14px' }}>Отмена</Button>
                    <Button onClick={confirmDeleteContractor} variant="contained" size="large" sx={{ fontSize: '14px', backgroundColor: 'error.main', '&:hover': { backgroundColor: 'error.dark' } }}>
                        Удалить
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ContractorsList;

