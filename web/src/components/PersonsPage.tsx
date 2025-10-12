import React, { useState, useEffect } from 'react';
import '../styles/buttons.css';
import {
    Box,
    Typography,
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
    IconButton,
    LinearProgress,
    FormControlLabel,
    Checkbox
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import VolumeButton from './VolumeButton';

// Интерфейс для физического лица
interface Person {
    id: string;
    lastName: string;
    firstName: string;
    middleName?: string;
    position?: string;
    phone?: string;
    email?: string;
    isProjectManager: boolean;
    isActive: boolean;
}

interface PersonsPageProps {
    canEdit: () => boolean;
    canCreate: () => boolean;
    canDelete: () => boolean;
}

const PersonsPage: React.FC<PersonsPageProps> = ({ canEdit, canCreate, canDelete }) => {
    const [persons, setPersons] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Person | null>(null);
    const [personForm, setPersonForm] = useState({
        lastName: '',
        firstName: '',
        middleName: '',
        position: '',
        phone: '',
        email: '',
        isProjectManager: false,
        isActive: true
    });

    // Загрузка физических лиц
    const fetchPersons = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/persons`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setPersons(data);
            }
        } catch (error) {
            console.error('Ошибка загрузки физических лиц:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPersons();
    }, []);

    const handleOpenDialog = (person?: Person) => {
        if (person) {
            setEditingPerson(person);
            setPersonForm({
                lastName: person.lastName,
                firstName: person.firstName,
                middleName: person.middleName || '',
                position: person.position || '',
                phone: person.phone || '',
                email: person.email || '',
                isProjectManager: person.isProjectManager,
                isActive: person.isActive
            });
        } else {
            setEditingPerson(null);
            setPersonForm({
                lastName: '',
                firstName: '',
                middleName: '',
                position: '',
                phone: '',
                email: '',
                isProjectManager: false,
                isActive: true
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingPerson(null);
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const url = editingPerson
                ? `${import.meta.env.VITE_API_BASE_URL}/persons/${editingPerson.id}`
                : `${import.meta.env.VITE_API_BASE_URL}/persons`;

            const response = await fetch(url, {
                method: editingPerson ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...personForm,
                    middleName: personForm.middleName || undefined,
                    position: personForm.position || undefined,
                    phone: personForm.phone || undefined,
                    email: personForm.email || undefined
                })
            });

            if (response.ok) {
                await fetchPersons();
                handleCloseDialog();
            }
        } catch (error) {
            console.error('Ошибка сохранения физического лица:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Удалить физическое лицо?')) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/persons/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                await fetchPersons();
            }
        } catch (error) {
            console.error('Ошибка удаления физического лица:', error);
        }
    };

    return (
        <Box className="page-container">
            <Box className="page-header">
                <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px' }}>
                    Физические лица
                </Typography>
                {canCreate() && (
                    <VolumeButton variant="contained" onClick={() => handleOpenDialog()} color="blue">
                        Добавить физическое лицо
                    </VolumeButton>
                )}
            </Box>

            {loading ? (
                <LinearProgress />
            ) : (
                <TableContainer component={Paper}>
                    <Table sx={{ '& .MuiTableCell-root': { border: '1px solid #e0e0e0' } }}>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '40px', fontSize: '12px' }}>№</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '12px' }}>ФИО</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '12px' }}>Должность</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '12px' }}>Телефон</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '12px' }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '12px' }}>РП</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '60px', fontSize: '12px' }}>
                                    <DeleteIcon fontSize="small" sx={{ color: 'red' }} />
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {persons.map((person, index) => (
                                <TableRow
                                    key={person.id}
                                    sx={{ height: '35px' }}
                                    onDoubleClick={() => canEdit() && handleOpenDialog(person)}
                                    style={{ cursor: canEdit() ? 'pointer' : 'default' }}
                                >
                                    <TableCell sx={{ py: 0.5, textAlign: 'center' }}>{index + 1}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>{`${person.lastName} ${person.firstName} ${person.middleName || ''}`}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>{person.position || '-'}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>{person.phone || '-'}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>{person.email || '-'}</TableCell>
                                    <TableCell sx={{ py: 0.5, textAlign: 'center' }}>{person.isProjectManager ? '✓' : ''}</TableCell>
                                    <TableCell sx={{ textAlign: 'center', py: 0.5, width: '60px' }}>
                                        {canDelete() && (
                                            <IconButton size="small" onClick={() => handleDelete(person.id)} color="error" sx={{ padding: '4px' }}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Диалог */}
            <Dialog open={openDialog} onClose={() => { }} maxWidth="sm" fullWidth disableEscapeKeyDown>
                <DialogTitle>
                    {editingPerson ? 'Редактировать физическое лицо' : 'Создать физическое лицо'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField label="Фамилия" value={personForm.lastName} onChange={(e) => setPersonForm({ ...personForm, lastName: e.target.value })} margin="dense" required sx={{ flex: 1 }} InputLabelProps={{ shrink: true }} />
                        <TextField label="Имя" value={personForm.firstName} onChange={(e) => setPersonForm({ ...personForm, firstName: e.target.value })} margin="dense" required sx={{ flex: 1 }} InputLabelProps={{ shrink: true }} />
                        <TextField label="Отчество" value={personForm.middleName} onChange={(e) => setPersonForm({ ...personForm, middleName: e.target.value })} margin="dense" sx={{ flex: 1 }} InputLabelProps={{ shrink: true }} />
                    </Box>
                    <TextField fullWidth label="Должность" value={personForm.position} onChange={(e) => setPersonForm({ ...personForm, position: e.target.value })} margin="dense" sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField fullWidth label="Телефон" value={personForm.phone} onChange={(e) => setPersonForm({ ...personForm, phone: e.target.value })} margin="dense" InputLabelProps={{ shrink: true }} />
                        <TextField fullWidth label="Email" type="email" value={personForm.email} onChange={(e) => setPersonForm({ ...personForm, email: e.target.value })} margin="dense" InputLabelProps={{ shrink: true }} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <FormControlLabel control={<Checkbox checked={personForm.isProjectManager} onChange={(e) => setPersonForm({ ...personForm, isProjectManager: e.target.checked })} />} label="Руководитель проекта" />
                        <FormControlLabel control={<Checkbox checked={personForm.isActive} onChange={(e) => setPersonForm({ ...personForm, isActive: e.target.checked })} />} label="Активен" />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <VolumeButton onClick={handleSave} color="blue">Сохранить</VolumeButton>
                    <VolumeButton onClick={handleCloseDialog} color="orange">Отмена</VolumeButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PersonsPage;

