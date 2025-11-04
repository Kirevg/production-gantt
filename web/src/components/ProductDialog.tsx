import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    TextField,
    Autocomplete
} from '@mui/material';
import VolumeButton from './VolumeButton';
import '../styles/buttons.css';

// Интерфейс для данных изделия
export interface ProductFormData {
    productId: string;      // ID из справочника (если выбрано)
    productName: string;     // Название изделия (ручной ввод или выбор)
    serialNumber: string;    // Серийный номер
    quantity: number;        // Количество
    link: string;           // Ссылка
}

// Интерфейс для пропсов компонента
interface ProductDialogProps {
    open: boolean;                              // Открыт ли диалог
    editing: boolean;                           // Режим редактирования (true) или создания (false)
    productForm: ProductFormData;               // Данные формы изделия
    catalogProducts: Array<{                    // Каталог изделий для выпадающего списка
        id: string;
        name: string;
    }>;
    loading?: boolean;                          // Состояние загрузки (опционально)
    onClose: () => void;                       // Обработчик закрытия
    onSave: () => void;                        // Обработчик сохранения
    onChange: (form: ProductFormData) => void;  // Обработчик изменения данных формы
}

// Общий компонент диалога создания/редактирования изделия
const ProductDialog: React.FC<ProductDialogProps> = ({
    open,
    editing,
    productForm,
    catalogProducts,
    loading = false,
    onClose,
    onSave,
    onChange
}) => {
    return (
        <Dialog
            open={open}
            onClose={() => { }}
            maxWidth="md"
            fullWidth
            disableEscapeKeyDown
            PaperProps={{
                sx: {
                    width: '600px',
                    maxWidth: '600px'
                }
            }}
        >
            <DialogTitle>
                {editing ? 'Редактировать изделие' : 'Создать изделие'}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    {/* Поле выбора изделия с автодополнением */}
                    <Autocomplete
                        freeSolo
                        options={catalogProducts}
                        getOptionLabel={(option) => {
                            if (typeof option === 'string') return option;
                            return option.name || '';
                        }}
                        isOptionEqualToValue={(option, value) => {
                            if (typeof option === 'string' || typeof value === 'string') return option === value;
                            return option.id === value.id;
                        }}
                        value={productForm.productId ? catalogProducts.find(p => p.id === productForm.productId) || null : productForm.productName}
                        onChange={(_, newValue) => {
                            if (typeof newValue === 'string') {
                                // Ручной ввод
                                onChange({
                                    ...productForm,
                                    productId: '',
                                    productName: newValue
                                });
                            } else if (newValue && newValue.id) {
                                // Выбор из списка
                                onChange({
                                    ...productForm,
                                    productId: newValue.id,
                                    productName: newValue.name
                                });
                            } else {
                                // Очистка
                                onChange({
                                    ...productForm,
                                    productId: '',
                                    productName: ''
                                });
                            }
                        }}
                        onInputChange={(_, newInputValue) => {
                            // Обновляем название при ручном вводе
                            onChange({
                                ...productForm,
                                productName: newInputValue,
                                productId: '' // Сбрасываем ID при ручном вводе
                            });
                        }}
                        inputValue={productForm.productName}
                        renderOption={(props, option) => {
                            // Явно указываем key на основе id для избежания дубликатов
                            const key = typeof option === 'string' ? option : option.id;
                            return (
                                <li {...props} key={key}>
                                    {typeof option === 'string' ? option : option.name}
                                </li>
                            );
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Изделие"
                                required
                                placeholder="Введите или выберите изделие"
                                helperText="Выберите из списка или введите название вручную"
                            />
                        )}
                        disabled={loading}
                    />

                    {/* Поле количества */}
                    <TextField
                        label="Количество"
                        type="number"
                        value={productForm.quantity}
                        onChange={(e) => onChange({ ...productForm, quantity: parseInt(e.target.value) || 1 })}
                        fullWidth
                        required
                        inputProps={{ min: 1 }}
                        InputLabelProps={{ shrink: true }}
                    />

                    {/* Поле серийного номера */}
                    <TextField
                        label="Серийный номер"
                        value={productForm.serialNumber || ''}
                        onChange={(e) => onChange({ ...productForm, serialNumber: e.target.value })}
                        fullWidth
                        placeholder="SN123456"
                        InputLabelProps={{ shrink: true }}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <VolumeButton onClick={onSave} color="blue">
                    {editing ? 'Сохранить' : 'Создать'}
                </VolumeButton>
                <VolumeButton onClick={onClose} color="orange">
                    Отмена
                </VolumeButton>
            </DialogActions>
        </Dialog>
    );
};

export default ProductDialog;

