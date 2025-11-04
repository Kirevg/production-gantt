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
    IconButton,
    LinearProgress,
    Alert,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    List as ListIcon
} from '@mui/icons-material';
import VolumeButton from './VolumeButton';

interface ProjectSpecification {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

interface SpecificationsListProps {
    projectId: string;
    projectName: string;
    productId?: string;
    productName?: string;
    onBack: () => void;
    onOpenSpecification: (specificationId: string, specificationName: string) => void;
    canEdit: () => boolean;
    canCreate: () => boolean;
    canDelete: () => boolean;
}

const SpecificationsList: React.FC<SpecificationsListProps> = ({
    projectId,
    projectName,
    productId,
    productName,
    onBack,
    onOpenSpecification,
    canEdit = () => true,
    canCreate = () => true,
    canDelete = () => true,
}) => {
    const [specifications, setSpecifications] = useState<ProjectSpecification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingSpecification, setEditingSpecification] = useState<ProjectSpecification | null>(null);
    const [specificationForm, setSpecificationForm] = useState({
        name: '',
        description: ''
    });

    // Функция для форматирования даты
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    };

    // Загрузка спецификаций проекта
    const fetchSpecifications = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Токен не найден');
                return;
            }

            // Строим URL для получения спецификаций изделия
            const url = `${import.meta.env.VITE_API_BASE_URL}/products/${productId}/specifications`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setSpecifications(data);
        } catch (error) {
// console.('Ошибка загрузки спецификаций:', error);
            setError('Ошибка загрузки спецификаций');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSpecifications();
    }, [projectId, productId]);

    // Обработчики форм
    const handleOpenDialog = (specification?: ProjectSpecification) => {
        if (specification) {
            setEditingSpecification(specification);
            setSpecificationForm({
                name: specification.name,
                description: specification.description || ''
            });
        } else {
            setEditingSpecification(null);
            setSpecificationForm({ name: '', description: '' });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingSpecification(null);
        setSpecificationForm({ name: '', description: '' });
    };

    // Сохранение спецификации
    const handleSaveSpecification = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Токен не найден');
                return;
            }

            const url = editingSpecification
                ? `${import.meta.env.VITE_API_BASE_URL}/product-specifications/${editingSpecification.id}`
                : `${import.meta.env.VITE_API_BASE_URL}/products/${productId}/specifications`;

            const method = editingSpecification ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(specificationForm)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchSpecifications();
            handleCloseDialog();
        } catch (error) {
// console.('Ошибка сохранения спецификации:', error);
            alert('Произошла ошибка при сохранении. Попробуйте еще раз.');
        }
    };

    // Удаление спецификации
    const handleDeleteSpecification = async (id: string) => {
        if (!confirm('Вы уверены, что хотите удалить эту спецификацию?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/product-specifications/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchSpecifications();
        } catch (error) {
// console.('Ошибка удаления спецификации:', error);
            alert('Произошла ошибка при удалении. Попробуйте еще раз.');
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                <LinearProgress />
                <Typography sx={{ mt: 2 }}>Загрузка спецификаций...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button onClick={fetchSpecifications} variant="contained">
                    Попробовать снова
                </Button>
            </Box>
        );
    }

    return (
        <Box className="page-container">
            <Box className="page-header">
                <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px' }}>
                    Спецификации проекта "{projectName}"
                    {productName && (
                        <>
                            <br />
                            <Typography component="span" sx={{ fontSize: '1rem', fontWeight: 'normal' }}>
                                Изделие: {productName}
                            </Typography>
                        </>
                    )}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {canCreate() && (
                        <VolumeButton
                            variant="contained"
                            onClick={() => handleOpenDialog()}
                            color="blue"
                        >
                            Добавить
                        </VolumeButton>
                    )}
                    <VolumeButton
                        variant="contained"
                        onClick={onBack}
                        color="orange"
                    >
                        Назад
                    </VolumeButton>
                </Box>
            </Box>

            {/* Таблица спецификаций */}
            <TableContainer component={Paper}>
                <Table sx={{ '& .MuiTableCell-root': { border: '1px solid #e0e0e0' } }}>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Название</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Описание</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Дата создания</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Дата обновления</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '90px' }}>
                                <DeleteIcon fontSize="small" sx={{ color: 'red' }} />
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {specifications.map((specification) => (
                            <TableRow
                                key={specification.id}
                                sx={{ height: '35px' }}
                                onDoubleClick={() => canEdit() && handleOpenDialog(specification)}
                                style={{ cursor: canEdit() ? 'pointer' : 'default' }}
                            >
                                <TableCell sx={{ py: 0.5 }}>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                        {specification.name}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ py: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {specification.description || '-'}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
                                    {formatDate(specification.createdAt)}
                                </TableCell>
                                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
                                    {formatDate(specification.updatedAt)}
                                </TableCell>
                                <TableCell sx={{ textAlign: 'center', py: 0.5, width: '90px' }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => onOpenSpecification(specification.id, specification.name)}
                                        color="primary"
                                        sx={{ minWidth: 'auto', padding: '4px' }}
                                    >
                                        <ListIcon fontSize="small" />
                                    </IconButton>
                                    {canDelete() && (
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDeleteSpecification(specification.id)}
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

            {/* Форма создания/редактирования */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                disableEscapeKeyDown
            >
                <DialogTitle>
                    {editingSpecification ? 'Редактировать спецификацию' : 'Создать спецификацию'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Название спецификации"
                        value={specificationForm.name}
                        onChange={(e) => setSpecificationForm({ ...specificationForm, name: e.target.value })}
                        margin="normal"
                        required
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        fullWidth
                        label="Описание"
                        value={specificationForm.description}
                        onChange={(e) => setSpecificationForm({ ...specificationForm, description: e.target.value })}
                        margin="normal"
                        multiline
                        rows={3}
                        InputLabelProps={{ shrink: true }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Отмена</Button>
                    <Button onClick={handleSaveSpecification} variant="contained" sx={{ fontSize: '14px' }}>
                        {editingSpecification ? 'Сохранить' : 'Создать'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SpecificationsList;
