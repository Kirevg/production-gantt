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

// Интерфейс для вида номенклатуры
interface NomenclatureKind {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

interface NomenclatureKindsPageProps {
    canEdit: () => boolean;
    canCreate: () => boolean;
    canDelete: () => boolean;
}

const NomenclatureKindsPage: React.FC<NomenclatureKindsPageProps> = ({ canEdit, canCreate, canDelete }) => {
    const [kinds, setKinds] = useState<NomenclatureKind[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingKind, setEditingKind] = useState<NomenclatureKind | null>(null);
    const [kindForm, setKindForm] = useState({
        name: '',
        description: ''
    });

    // Загрузка видов номенклатуры
    const fetchKinds = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                // console.error('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature-kinds`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setKinds(data);
            }
        } catch (error) {
            // console.error('Ошибка загрузки видов номенклатуры:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKinds();
    }, []);

    const handleOpenDialog = (kind?: NomenclatureKind) => {
        if (kind) {
            setEditingKind(kind);
            setKindForm({
                name: kind.name,
                description: kind.description || ''
            });
        } else {
            setEditingKind(null);
            setKindForm({
                name: '',
                description: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingKind(null);
        setKindForm({
            name: '',
            description: ''
        });
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // console.error('Токен не найден');
                return;
            }

            const url = editingKind
                ? `${import.meta.env.VITE_API_BASE_URL}/nomenclature-kinds/${editingKind.id}`
                : `${import.meta.env.VITE_API_BASE_URL}/nomenclature-kinds`;

            const response = await fetch(url, {
                method: editingKind ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...kindForm,
                    description: kindForm.description || undefined
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchKinds();
            handleCloseDialog();
        } catch (error) {
            // console.error('Ошибка сохранения вида номенклатуры:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Вы уверены, что хотите удалить этот вид номенклатуры?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // console.error('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature-kinds/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchKinds();
        } catch (error) {
            // console.error('Ошибка удаления вида номенклатуры:', error);
        }
    };

    return (
        <Box className="page-container">
            {/* Заголовок */}
            <Box className="page-header">
                <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px' }}>
                    Виды номенклатуры
                </Typography>
                <Box>
                    {canCreate() && (
                        <VolumeButton
                            variant="contained"
                            onClick={() => handleOpenDialog()}
                            color="blue"
                        >
                            Добавить вид
                        </VolumeButton>
                    )}
                </Box>
            </Box>

            {/* Таблица видов номенклатуры */}
            {loading ? (
                <LinearProgress />
            ) : (
                <TableContainer component={Paper}>
                    <Table sx={{ '& .MuiTableCell-root': { border: '1px solid #e0e0e0' } }}>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '40px', fontSize: '12px' }}>№</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '12px' }}>Название</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '12px' }}>Описание</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '60px', fontSize: '12px' }}>
                                    <DeleteIcon fontSize="small" sx={{ color: 'red' }} />
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {kinds.map((kind, index) => (
                                <TableRow
                                    key={kind.id}
                                    sx={{ height: '35px' }}
                                    onDoubleClick={() => canEdit() && handleOpenDialog(kind)}
                                    style={{ cursor: canEdit() ? 'pointer' : 'default' }}
                                >
                                    <TableCell sx={{ py: 0.5, textAlign: 'center' }}>{index + 1}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>{kind.name}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>{kind.description || '-'}</TableCell>
                                    <TableCell sx={{ textAlign: 'center', py: 0.5, width: '60px' }}>
                                        {canDelete() && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(kind.id)}
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
                    {editingKind ? 'Редактировать вид номенклатуры' : 'Создать вид номенклатуры'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Название"
                        value={kindForm.name}
                        onChange={(e) => setKindForm({ ...kindForm, name: e.target.value })}
                        margin="dense"
                        required
                        sx={{ mb: 2 }}
                        placeholder="Материал, Изделие, Полуфабрикат и т.д."
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        fullWidth
                        label="Описание"
                        value={kindForm.description}
                        onChange={(e) => setKindForm({ ...kindForm, description: e.target.value })}
                        margin="dense"
                        multiline
                        rows={3}
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

export default NomenclatureKindsPage;

