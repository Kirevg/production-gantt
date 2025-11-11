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
    LinearProgress
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import VolumeButton from './VolumeButton';

// Интерфейс для единицы измерения
interface Unit {
    id: string;
    code: string;
    name: string;
    fullName?: string;
    internationalCode?: string;
    createdAt: string;
    updatedAt: string;
}

interface UnitsPageProps {
    canEdit: () => boolean;
    canCreate: () => boolean;
    canDelete: () => boolean;
}

const UnitsPage: React.FC<UnitsPageProps> = ({ canEdit, canCreate, canDelete }) => {
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [unitForm, setUnitForm] = useState({
        code: '',
        name: '',
        fullName: '',
        internationalCode: ''
    });

    // Загрузка единиц измерения
    const fetchUnits = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
// console.('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/units`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUnits(data);
            }
        } catch (error) {
// console.('Ошибка загрузки единиц измерения:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnits();
    }, []);

    const handleOpenDialog = (unit?: Unit) => {
        if (unit) {
            setEditingUnit(unit);
            setUnitForm({
                code: unit.code,
                name: unit.name,
                fullName: unit.fullName || '',
                internationalCode: unit.internationalCode || ''
            });
        } else {
            setEditingUnit(null);
            setUnitForm({
                code: '',
                name: '',
                fullName: '',
                internationalCode: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingUnit(null);
        setUnitForm({
            code: '',
            name: '',
            fullName: '',
            internationalCode: ''
        });
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
// console.('Токен не найден');
                return;
            }

            const url = editingUnit
                ? `${import.meta.env.VITE_API_BASE_URL}/units/${editingUnit.id}`
                : `${import.meta.env.VITE_API_BASE_URL}/units`;

            const response = await fetch(url, {
                method: editingUnit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...unitForm,
                    fullName: unitForm.fullName || undefined,
                    internationalCode: unitForm.internationalCode || undefined
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchUnits();
            handleCloseDialog();
        } catch (error) {
// console.('Ошибка сохранения единицы измерения:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Вы уверены, что хотите удалить эту единицу измерения?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
// console.('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/units/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchUnits();
        } catch (error) {
// console.('Ошибка удаления единицы измерения:', error);
        }
    };

    return (
        <Box className="page-container">
            {/* Заголовок */}
            <Box className="page-header">
                <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px' }}>
                    Единицы измерения
                </Typography>
                <Box>
                    {canCreate() && (
                        <VolumeButton
                            variant="contained"
                            onClick={() => handleOpenDialog()}
                            color="blue"
                        >
                            Добавить единицу
                        </VolumeButton>
                    )}
                </Box>
            </Box>

            {/* Таблица единиц измерения */}
            {loading ? (
                <LinearProgress />
            ) : (
                <TableContainer component={Paper}>
                    <Table sx={{ '& .MuiTableCell-root': { border: '1px solid #e0e0e0' } }}>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '40px', fontSize: '12px' }}>№</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '12px' }}>Код</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '12px' }}>Название</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '12px' }}>Полное название</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '12px' }}>Аналоги</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '12px' }}>Межд. код</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '60px', fontSize: '12px' }}>
                                    <DeleteIcon fontSize="small" sx={{ color: 'red' }} />
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {units.map((unit, index) => (
                                <TableRow
                                    key={unit.id}
                                    sx={{ height: '35px', cursor: 'pointer' }}
                                    onDoubleClick={() => canEdit() && handleOpenDialog(unit)}
                                >
                                    <TableCell sx={{ py: 0.5, textAlign: 'center' }}>{index + 1}</TableCell>
                                    <TableCell sx={{ py: 0.5, textAlign: 'center' }}>{unit.code}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>{unit.name}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>{unit.fullName || '-'}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>{'-'}</TableCell>
                                    <TableCell sx={{ py: 0.5, textAlign: 'center' }}>{unit.internationalCode || '-'}</TableCell>
                                    <TableCell sx={{ textAlign: 'center', py: 0.5, width: '60px' }}>
                                        {canDelete() && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(unit.id)}
                                                color="error"
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
            )}

            {/* Диалог создания/редактирования */}
            <Dialog open={openDialog} onClose={() => { }} maxWidth="sm" fullWidth disableEscapeKeyDown>
                <DialogTitle>
                    {editingUnit ? 'Редактировать единицу измерения' : 'Создать единицу измерения'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Код"
                        value={unitForm.code}
                        onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value })}
                        margin="dense"
                        required
                        sx={{ mb: 2 }}
                        placeholder="шт, кг, м, л"
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        fullWidth
                        label="Название"
                        value={unitForm.name}
                        onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                        margin="dense"
                        required
                        sx={{ mb: 2 }}
                        placeholder="штука, килограмм, метр, литр"
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        fullWidth
                        label="Полное название"
                        value={unitForm.fullName}
                        onChange={(e) => setUnitForm({ ...unitForm, fullName: e.target.value })}
                        margin="dense"
                        sx={{ mb: 2 }}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        fullWidth
                        label="Международный код"
                        value={unitForm.internationalCode}
                        onChange={(e) => setUnitForm({ ...unitForm, internationalCode: e.target.value })}
                        margin="dense"
                        placeholder="PCE, KGM, MTR, LTR"
                        InputLabelProps={{ shrink: true }}
                    />
                </DialogContent>
                <DialogActions>
                    <VolumeButton onClick={handleSave} color="blue">
                        Сохранить
                    </VolumeButton>
                    <VolumeButton onClick={handleCloseDialog} color="orange">
                        Отмена
                    </VolumeButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UnitsPage;

