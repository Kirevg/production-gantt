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
    Checkbox,
    Chip
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import VolumeButton from './VolumeButton';

// Интерфейс для контрагента
interface Counterparty {
    id: string;
    name: string;
    fullName?: string;
    inn?: string;
    kpp?: string;
    legalAddress?: string;
    contactName?: string;
    phone?: string;
    email?: string;
    isSupplier: boolean;
    isManufacturer: boolean;
    isContractor: boolean;
    isActive: boolean;
}

interface CounterpartiesPageProps {
    canEdit: () => boolean;
    canCreate: () => boolean;
    canDelete: () => boolean;
}

const CounterpartiesPage: React.FC<CounterpartiesPageProps> = ({ canEdit, canCreate, canDelete }) => {
    const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingCounterparty, setEditingCounterparty] = useState<Counterparty | null>(null);

    // Состояние для фильтров типов контрагентов с сохранением в localStorage
    const [typeFilters, setTypeFilters] = useState(() => {
        const saved = localStorage.getItem('counterparties-type-filters');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Ошибка загрузки фильтров контрагентов:', e);
            }
        }
        return {
            supplier: true,
            manufacturer: true,
            contractor: true
        };
    });
    const [counterpartyForm, setCounterpartyForm] = useState({
        name: '',
        fullName: '',
        inn: '',
        kpp: '',
        legalAddress: '',
        contactName: '',
        phone: '',
        email: '',
        isSupplier: false,
        isManufacturer: false,
        isContractor: false,
        isActive: true
    });

    // Загрузка контрагентов
    const fetchCounterparties = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/counterparties`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setCounterparties(data);
            }
        } catch (error) {
            console.error('Ошибка загрузки контрагентов:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCounterparties();
    }, []);

    // Функция для фильтрации контрагентов по типам
    const getFilteredCounterparties = () => {
        return counterparties.filter(cp => {
            if (cp.isSupplier && !typeFilters.supplier) return false;
            if (cp.isManufacturer && !typeFilters.manufacturer) return false;
            if (cp.isContractor && !typeFilters.contractor) return false;
            return true;
        });
    };

    // Обработчик изменения фильтров типов с сохранением в localStorage
    const handleTypeFilterChange = (type: keyof typeof typeFilters) => {
        const newFilters = {
            ...typeFilters,
            [type]: !typeFilters[type]
        };
        setTypeFilters(newFilters);
        localStorage.setItem('counterparties-type-filters', JSON.stringify(newFilters));
    };

    const handleOpenDialog = (counterparty?: Counterparty) => {
        if (counterparty) {
            setEditingCounterparty(counterparty);
            setCounterpartyForm({
                name: counterparty.name,
                fullName: counterparty.fullName || '',
                inn: counterparty.inn || '',
                kpp: counterparty.kpp || '',
                legalAddress: counterparty.legalAddress || '',
                contactName: counterparty.contactName || '',
                phone: counterparty.phone || '',
                email: counterparty.email || '',
                isSupplier: counterparty.isSupplier,
                isManufacturer: counterparty.isManufacturer,
                isContractor: counterparty.isContractor,
                isActive: counterparty.isActive
            });
        } else {
            setEditingCounterparty(null);
            setCounterpartyForm({
                name: '',
                fullName: '',
                inn: '',
                kpp: '',
                legalAddress: '',
                contactName: '',
                phone: '',
                email: '',
                isSupplier: false,
                isManufacturer: false,
                isContractor: false,
                isActive: true
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingCounterparty(null);
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const url = editingCounterparty
                ? `${import.meta.env.VITE_API_BASE_URL}/counterparties/${editingCounterparty.id}`
                : `${import.meta.env.VITE_API_BASE_URL}/counterparties`;

            const response = await fetch(url, {
                method: editingCounterparty ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...counterpartyForm,
                    fullName: counterpartyForm.fullName || undefined,
                    inn: counterpartyForm.inn || undefined,
                    kpp: counterpartyForm.kpp || undefined,
                    legalAddress: counterpartyForm.legalAddress || undefined,
                    contactName: counterpartyForm.contactName || undefined,
                    phone: counterpartyForm.phone || undefined,
                    email: counterpartyForm.email || undefined
                })
            });

            if (response.ok) {
                await fetchCounterparties();
                handleCloseDialog();
            }
        } catch (error) {
            console.error('Ошибка сохранения контрагента:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Удалить контрагента?')) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/counterparties/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                await fetchCounterparties();
            }
        } catch (error) {
            console.error('Ошибка удаления контрагента:', error);
        }
    };

    return (
        <Box className="page-container">
            <Box className="page-header">
                <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px' }}>
                    Контрагенты
                </Typography>
                {canCreate() && (
                    <VolumeButton variant="contained" onClick={() => handleOpenDialog()} color="blue">
                        Добавить
                    </VolumeButton>
                )}
            </Box>

            {/* Фильтры типов контрагентов */}
            <Paper sx={{ p: 0, mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', height: '56px', overflow: 'hidden', width: '100%' }}>
                    <Typography variant="body2" color="text.secondary">
                        Показано: {getFilteredCounterparties().length} из {counterparties.length}
                    </Typography>

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={typeFilters.supplier}
                                onChange={() => handleTypeFilterChange('supplier')}
                                color="default"
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                <Chip
                                    label="Поставщик"
                                    color="secondary"
                                    size="small"
                                    sx={{ borderRadius: '6px' }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                    ({counterparties.filter(cp => cp.isSupplier).length})
                                </Typography>
                            </Box>
                        }
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={typeFilters.manufacturer}
                                onChange={() => handleTypeFilterChange('manufacturer')}
                                color="primary"
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                <Chip
                                    label="Производитель"
                                    color="primary"
                                    size="small"
                                    sx={{ borderRadius: '6px' }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                    ({counterparties.filter(cp => cp.isManufacturer).length})
                                </Typography>
                            </Box>
                        }
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={typeFilters.contractor}
                                onChange={() => handleTypeFilterChange('contractor')}
                                color="success"
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                <Chip
                                    label="Подрядчик"
                                    color="success"
                                    size="small"
                                    sx={{ borderRadius: '6px' }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                    ({counterparties.filter(cp => cp.isContractor).length})
                                </Typography>
                            </Box>
                        }
                    />
                </Box>
            </Paper>

            {loading ? (
                <LinearProgress />
            ) : (
                <TableContainer component={Paper}>
                    <Table sx={{ '& .MuiTableCell-root': { border: '1px solid #e0e0e0' } }}>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '40px', fontSize: '12px' }}>№</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '12px' }}>Название</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '12px' }}>Контактное лицо</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '12px' }}>Телефон</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '60px', fontSize: '12px' }}>
                                    <DeleteIcon fontSize="small" sx={{ color: 'red' }} />
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {getFilteredCounterparties().map((cp, index) => (
                                <TableRow
                                    key={cp.id}
                                    sx={{ height: '35px' }}
                                    onDoubleClick={() => canEdit() && handleOpenDialog(cp)}
                                    style={{ cursor: canEdit() ? 'pointer' : 'default' }}
                                >
                                    <TableCell sx={{ py: 0.5, textAlign: 'center' }}>{index + 1}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>{cp.name}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>{cp.contactName || '-'}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>{cp.phone || '-'}</TableCell>
                                    <TableCell sx={{ textAlign: 'center', py: 0.5, width: '60px' }}>
                                        {canDelete() && (
                                            <IconButton size="small" onClick={() => handleDelete(cp.id)} color="error" sx={{ padding: '4px' }}>
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
            <Dialog open={openDialog} onClose={() => { }} maxWidth="md" fullWidth disableEscapeKeyDown>
                <DialogTitle>
                    {editingCounterparty ? 'Редактировать контрагента' : 'Создать контрагента'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField fullWidth label="Название" value={counterpartyForm.name} onChange={(e) => setCounterpartyForm({ ...counterpartyForm, name: e.target.value })} margin="dense" required InputLabelProps={{ shrink: true }} />
                    </Box>
                    <TextField fullWidth label="Полное название" value={counterpartyForm.fullName} onChange={(e) => setCounterpartyForm({ ...counterpartyForm, fullName: e.target.value })} margin="dense" sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField label="ИНН" value={counterpartyForm.inn} onChange={(e) => setCounterpartyForm({ ...counterpartyForm, inn: e.target.value })} margin="dense" sx={{ flex: 1 }} InputLabelProps={{ shrink: true }} />
                        <TextField label="КПП" value={counterpartyForm.kpp} onChange={(e) => setCounterpartyForm({ ...counterpartyForm, kpp: e.target.value })} margin="dense" sx={{ flex: 1 }} InputLabelProps={{ shrink: true }} />
                    </Box>
                    <TextField fullWidth label="Юридический адрес" value={counterpartyForm.legalAddress} onChange={(e) => setCounterpartyForm({ ...counterpartyForm, legalAddress: e.target.value })} margin="dense" sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField fullWidth label="Контактное лицо" value={counterpartyForm.contactName} onChange={(e) => setCounterpartyForm({ ...counterpartyForm, contactName: e.target.value })} margin="dense" InputLabelProps={{ shrink: true }} />
                        <TextField fullWidth label="Телефон" value={counterpartyForm.phone} onChange={(e) => setCounterpartyForm({ ...counterpartyForm, phone: e.target.value })} margin="dense" InputLabelProps={{ shrink: true }} />
                        <TextField fullWidth label="Email" type="email" value={counterpartyForm.email} onChange={(e) => setCounterpartyForm({ ...counterpartyForm, email: e.target.value })} margin="dense" InputLabelProps={{ shrink: true }} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <FormControlLabel control={<Checkbox checked={counterpartyForm.isSupplier} onChange={(e) => setCounterpartyForm({ ...counterpartyForm, isSupplier: e.target.checked })} />} label="Поставщик" />
                        <FormControlLabel control={<Checkbox checked={counterpartyForm.isManufacturer} onChange={(e) => setCounterpartyForm({ ...counterpartyForm, isManufacturer: e.target.checked })} />} label="Производитель" />
                        <FormControlLabel control={<Checkbox checked={counterpartyForm.isContractor} onChange={(e) => setCounterpartyForm({ ...counterpartyForm, isContractor: e.target.checked })} />} label="Подрядчик" />
                        <FormControlLabel control={<Checkbox checked={counterpartyForm.isActive} onChange={(e) => setCounterpartyForm({ ...counterpartyForm, isActive: e.target.checked })} />} label="Активен" />
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

export default CounterpartiesPage;

