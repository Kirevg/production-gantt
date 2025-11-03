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
import { Delete } from '@mui/icons-material';
import type { User, SystemUser } from '../types/common';
import VolumeButton from './VolumeButton';

interface UsersListProps {
    currentUser: User;
    canEdit: () => boolean;
    canCreate: () => boolean;
    canDelete: () => boolean;
}

const UsersList: React.FC<UsersListProps> = ({ currentUser, canEdit, canCreate, canDelete }) => {
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [persons, setPersons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditUserForm, setShowEditUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletingUser, setDeletingUser] = useState<SystemUser | null>(null);
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        role: 'user' as 'user' | 'manager' | 'admin',
        personId: ''
    });

    // Функция для загрузки списка пользователей
    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Токен авторизации не найден');
                setLoading(false);
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data);
                setError(null);
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
                setError(`Ошибка загрузки пользователей: ${errorData.error}`);
            }

            // Загрузка физических лиц для выбора при создании пользователя
            const personsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/persons`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (personsResponse.ok) {
                const personsData = await personsResponse.json();
                setPersons(personsData);
            }
        } catch (error) {
            setError(`Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        } finally {
            setLoading(false);
        }
    };

    // Функция для проверки, является ли пользователь последним администратором
    const isLastAdmin = (user: SystemUser) => {
        if (user.role !== 'admin' || !user.isActive) return false;

        const activeAdmins = users.filter(u => u.role === 'admin' && u.isActive);
        return activeAdmins.length <= 1;
    };

    // Функция для проверки, можно ли удалить пользователя
    const canDeleteUser = (user: SystemUser) => {
        if (user.id === currentUser.id) return false; // Нельзя удалить себя
        return !isLastAdmin(user); // Нельзя удалить последнего администратора
    };

    // Функция для проверки, можно ли редактировать роль пользователя
    const canEditUserRole = (user: SystemUser) => {
        if (user.id === currentUser.id && isLastAdmin(user)) return false; // Последний админ не может изменить свою роль
        return true;
    };

    // Функция для проверки, можно ли деактивировать пользователя
    const canDeactivateUser = (user: SystemUser) => {
        if (user.id === currentUser.id && isLastAdmin(user)) return false; // Последний админ не может деактивировать себя
        return true;
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Обработчик создания нового пользователя
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Токен авторизации не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...newUser,
                    personId: newUser.personId || undefined
                })
            });

            if (response.ok) {
                setShowCreateForm(false);
                setNewUser({ email: '', password: '', role: 'user', personId: '' });
                fetchUsers();
                setError(null);
            } else {
                const errorData = await response.json();
                setError(`Ошибка создания пользователя: ${errorData.error || 'Неизвестная ошибка'}`);
            }
        } catch (error) {
            setError(`Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    // Обработчик редактирования пользователя
    const handleEditUser = (user: SystemUser) => {
        setEditingUser({ ...user, password: '' });
        setShowEditUserForm(true);
    };

    // Обработчик обновления пользователя
    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Токен авторизации не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: editingUser.email,
                    password: editingUser.password || undefined,
                    role: editingUser.role,
                    isActive: editingUser.isActive,
                    personId: editingUser.personId || undefined
                })
            });

            if (response.ok) {
                setShowEditUserForm(false);
                setEditingUser(null);
                fetchUsers();
                setError(null);
            } else {
                const errorData = await response.json();
                setError(`Ошибка обновления пользователя: ${errorData.error || 'Неизвестная ошибка'}`);
            }
        } catch (error) {
            setError(`Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    // Обработчик удаления пользователя
    const handleDeleteUser = (user: SystemUser) => {
        if (!canDeleteUser(user)) {
            if (user.id === currentUser.id) {
                setError('Вы не можете удалить самого себя');
            } else if (isLastAdmin(user)) {
                setError('Нельзя удалить последнего активного администратора системы');
            }
            return;
        }
        setDeletingUser(user);
        setShowDeleteDialog(true);
    };

    // Подтверждение удаления пользователя
    const confirmDeleteUser = async () => {
        if (!deletingUser) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Токен авторизации не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${deletingUser.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setShowDeleteDialog(false);
                setDeletingUser(null);
                fetchUsers();
                setError(null);
            } else {
                const errorData = await response.json();
                setError(`Ошибка удаления пользователя: ${errorData.error || 'Неизвестная ошибка'}`);
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
                <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px' }}>Управление пользователями</Typography>
                {canCreate() && (
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => setShowCreateForm(true)}
                        className="depth-button"
                        sx={{ fontSize: '14px' }}
                    >
                        Создать пользователя
                    </Button>
                )}
            </Box>

            {/* Форма создания пользователя */}
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
                <DialogTitle>Создать нового пользователя</DialogTitle>
                <form onSubmit={handleCreateUser}>
                    <DialogContent>
                        <TextField
                            fullWidth
                            select
                            label="Физическое лицо"
                            value={newUser.personId}
                            onChange={(e) => setNewUser({ ...newUser, personId: e.target.value })}
                            margin="normal"
                            SelectProps={{ native: true }}
                            InputLabelProps={{ shrink: true }}
                        >
                            <option value="">Не указано</option>
                            {persons.map((person) => (
                                <option key={person.id} value={person.id}>
                                    {`${person.lastName} ${person.firstName} ${person.middleName || ''}`}
                                </option>
                            ))}
                        </TextField>
                        <TextField
                            autoFocus
                            fullWidth
                            label="Email"
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            margin="normal"
                            required
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                autoComplete: "username"
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Пароль"
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            margin="normal"
                            required
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                autoComplete: "new-password"
                            }}
                        />
                        <TextField
                            fullWidth
                            select
                            label="Роль"
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'user' | 'manager' | 'admin' })}
                            margin="normal"
                            SelectProps={{ native: true }}
                            InputLabelProps={{ shrink: true }}
                        >
                            <option value="user">Пользователь</option>
                            <option value="manager">Менеджер</option>
                            <option value="admin">Администратор</option>
                        </TextField>
                    </DialogContent>
                    <DialogActions>
                        <VolumeButton type="submit" variant="contained" size="large">Создать</VolumeButton>
                        <VolumeButton onClick={() => setShowCreateForm(false)} variant="contained" size="large">Отмена</VolumeButton>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Таблица с пользователями */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>ФИО</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: '150px', textAlign: 'center' }}>Роль</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Статус</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '60px' }}>
                                <Delete fontSize="small" sx={{ color: 'red' }} />
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow
                                key={user.id}
                                sx={{ height: '35px' }}
                                onDoubleClick={() => canEdit() && handleEditUser(user)}
                                style={{ cursor: canEdit() ? 'pointer' : 'default' }}
                            >
                                <TableCell sx={{ py: 0.5 }}>
                                    {(user as any).person
                                        ? `${(user as any).person.lastName} ${(user as any).person.firstName} ${(user as any).person.middleName || ''}`
                                        : '-'}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'medium', py: 0.5 }}>
                                    {user.email}
                                </TableCell>
                                <TableCell sx={{ py: 0.5, width: '150px', textAlign: 'center' }}>
                                    <Chip
                                        label={user.role === 'admin' ? 'Администратор' :
                                            user.role === 'manager' ? 'Менеджер' : 'Пользователь'}
                                        color={user.role === 'admin' ? 'error' :
                                            user.role === 'manager' ? 'secondary' : 'primary'}
                                        size="small"
                                        sx={{ width: '120px', borderRadius: '6px' }}
                                    />
                                </TableCell>
                                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
                                    <Chip
                                        label={user.isActive ? 'Активен' : 'Заблокирован'}
                                        color={user.isActive ? 'success' : 'default'}
                                        size="small"
                                        sx={{ width: '100px', borderRadius: '6px' }}
                                    />
                                </TableCell>
                                <TableCell sx={{ textAlign: 'center', py: 0.5, width: '60px' }}>
                                    {canDelete() && (
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDeleteUser(user)}
                                            color="error"
                                            disabled={!canDeleteUser(user)}
                                            sx={{ minWidth: 'auto', padding: '4px' }}
                                            title={!canDeleteUser(user) ?
                                                (user.id === currentUser.id ? 'Нельзя удалить самого себя' : 'Нельзя удалить последнего администратора')
                                                : 'Удалить пользователя'
                                            }
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

            {/* Диалог редактирования пользователя */}
            <Dialog
                open={showEditUserForm}
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
                <DialogTitle sx={{ pb: 1 }}>Редактировать пользователя</DialogTitle>
                <DialogContent>
                    {editingUser ? (
                        <Box component="form" sx={{ mt: 2, width: '100%' }}>
                            <TextField
                                fullWidth
                                select
                                label="Физическое лицо"
                                value={editingUser.personId || ''}
                                onChange={(e) => setEditingUser({ ...editingUser, personId: e.target.value })}
                                margin="normal"
                                SelectProps={{ native: true }}
                                InputLabelProps={{ shrink: true }}
                            >
                                <option value="">Не указано</option>
                                {persons.map((person) => (
                                    <option key={person.id} value={person.id}>
                                        {`${person.lastName} ${person.firstName} ${person.middleName || ''}`}
                                    </option>
                                ))}
                            </TextField>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={editingUser.email}
                                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                margin="normal"
                                required
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                fullWidth
                                label="Новый пароль (оставьте пустым, чтобы не изменять)"
                                type="password"
                                value={editingUser.password || ''}
                                onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                                margin="normal"
                                helperText="Введите новый пароль или оставьте поле пустым"
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                fullWidth
                                select
                                label="Роль"
                                value={editingUser.role}
                                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'user' | 'manager' | 'admin' })}
                                margin="normal"
                                SelectProps={{ native: true }}
                                disabled={!canEditUserRole(editingUser)}
                                helperText={!canEditUserRole(editingUser) ? 'Последний администратор не может изменить свою роль' : ''}
                                InputLabelProps={{ shrink: true }}
                            >
                                <option value="user">Пользователь</option>
                                <option value="manager">Менеджер</option>
                                <option value="admin">Администратор</option>
                            </TextField>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={editingUser.isActive}
                                        onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                                        disabled={!canDeactivateUser(editingUser)}
                                    />
                                }
                                label="Активен"
                            />
                            {!canDeactivateUser(editingUser) && (
                                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                                    Последний администратор не может быть деактивирован
                                </Typography>
                            )}
                        </Box>
                    ) : (
                        <Box sx={{ p: 2, textAlign: 'center', width: '100%' }}>
                            <Typography color="error">Данные пользователя не загружены</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowEditUserForm(false)} variant="contained" size="large" sx={{ fontSize: '14px' }}>Отмена</Button>
                    <Button onClick={handleUpdateUser} variant="contained" size="large" sx={{ fontSize: '14px' }}>Сохранить</Button>
                </DialogActions>
            </Dialog>

            {/* Диалог удаления пользователя */}
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
                <DialogTitle>Удалить пользователя</DialogTitle>
                <DialogContent>
                    <Typography>
                        Вы уверены, что хотите удалить пользователя "{deletingUser?.email}"?
                        Это действие нельзя отменить.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDeleteDialog(false)} variant="contained" size="large" sx={{ fontSize: '14px' }}>Отмена</Button>
                    <Button onClick={confirmDeleteUser} color="error" variant="contained" size="large">
                        Удалить
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UsersList;

