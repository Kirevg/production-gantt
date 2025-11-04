// Компонент для управления справочником изделий (Products)
// Позволяет создавать, редактировать и удалять изделия, которые затем используются в проектах
import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Switch,
    FormControlLabel,
    Alert,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import PageHeader from './PageHeader';

// Интерфейс для изделия из справочника
interface Product {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface ProductsCatalogPageProps {
    canEdit: () => boolean;
    canCreate: () => boolean;
    canDelete: () => boolean;
}

const ProductsCatalogPage: React.FC<ProductsCatalogPageProps> = ({
    canEdit,
    canCreate,
    canDelete
}) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [showDialog, setShowDialog] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        isActive: true,
    });

    // Загрузка списка изделий
    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/catalog-products`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка загрузки изделий');
            }

            const data = await response.json();
            setProducts(data);
        } catch (error) {
// console.('Ошибка загрузки изделий:', error);
            setError('Не удалось загрузить список изделий');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Открытие диалога создания/редактирования
    const handleOpenDialog = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setProductForm({
                name: product.name,
                description: product.description || '',
                isActive: product.isActive,
            });
        } else {
            setEditingProduct(null);
            setProductForm({
                name: '',
                description: '',
                isActive: true,
            });
        }
        setShowDialog(true);
    };

    // Закрытие диалога
    const handleCloseDialog = () => {
        setShowDialog(false);
        setEditingProduct(null);
    };

    // Сохранение изделия
    const handleSave = async () => {
        try {
            setError('');
            const token = localStorage.getItem('token');
            const url = editingProduct
                ? `${import.meta.env.VITE_API_BASE_URL}/catalog-products/${editingProduct.id}`
                : `${import.meta.env.VITE_API_BASE_URL}/catalog-products`;
            const method = editingProduct ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: productForm.name,
                    description: productForm.description || undefined,
                    isActive: productForm.isActive,
                })
            });

            if (!response.ok) {
                throw new Error('Ошибка сохранения изделия');
            }

            await fetchProducts();
            handleCloseDialog();
        } catch (error) {
// console.('Ошибка сохранения:', error);
            setError('Не удалось сохранить изделие');
        }
    };

    // Удаление изделия
    const handleDelete = async (id: string) => {
        if (!window.confirm('Вы уверены, что хотите удалить это изделие?')) {
            return;
        }

        try {
            setError('');
            const token = localStorage.getItem('token');

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/catalog-products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка удаления изделия');
            }

            await fetchProducts();
        } catch (error: any) {
// console.('Ошибка удаления:', error);
            setError(error.message || 'Не удалось удалить изделие');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader title="Справочник изделий">
                {canCreate() && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        Создать изделие
                    </Button>
                )}
            </PageHeader>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><Typography variant="subtitle2">Название</Typography></TableCell>
                            <TableCell><Typography variant="subtitle2">Примечание</Typography></TableCell>
                            <TableCell><Typography variant="subtitle2">Статус</Typography></TableCell>
                            {(canEdit() || canDelete()) && (
                                <TableCell><Typography variant="subtitle2">Действия</Typography></TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    Загрузка...
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    Нет изделий
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell>{product.description || '-'}</TableCell>
                                    <TableCell>
                                        {product.isActive ? 'Активно' : 'Неактивно'}
                                    </TableCell>
                                    {(canEdit() || canDelete()) && (
                                        <TableCell>
                                            {canEdit() && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenDialog(product)}
                                                    title="Редактировать"
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                            {canDelete() && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDelete(product.id)}
                                                    title="Удалить"
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Диалог создания/редактирования */}
            <Dialog
                open={showDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                disableEscapeKeyDown
            >
                <DialogTitle>
                    {editingProduct ? 'Редактировать изделие' : 'Создать изделие'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Название *"
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Примечание"
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        margin="normal"
                        multiline
                        rows={3}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={productForm.isActive}
                                onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                            />
                        }
                        label="Активно"
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Отмена</Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        color="primary"
                        disabled={!productForm.name}
                    >
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProductsCatalogPage;


