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
    Alert,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Autocomplete
} from '@mui/material';
import {
    Delete as DeleteIcon,
    CalendarToday as CalendarIcon
} from '@mui/icons-material';
import VolumeButton from './VolumeButton';

// Интерфейсы для спецификаций
interface ProjectSpecification {
    id: string;
    name: string;
    description?: string;
    totalSum?: number; // Общая сумма спецификации
    version?: number; // Версия спецификации
    createdAt: string;
    updatedAt: string;
}

// Интерфейсы для этапов работ
interface Stage {
    id: string;
    sum: string;
    hours?: string;
    startDate: string;
    duration: number;
    endDate: string;
    workTypeId?: string;
    nomenclatureItem?: {
        id: string;
        name: string;
    };
    assigneeId?: string;
    assignee?: {
        id: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
}

// Функция для форматирования суммы в формате "0 000,00"
const formatSum = (value: string | undefined | null): string => {
    if (!value || value === '') return '';

    // Убираем все символы кроме цифр и точки/запятой
    const cleaned = String(value).replace(/[^\d.,]/g, '');

    // Заменяем запятую на точку для корректного парсинга
    const normalized = cleaned.replace(',', '.');

    // Парсим число
    const number = parseFloat(normalized);

    if (isNaN(number)) return value;

    // Форматируем число с разделителями тысяч и двумя знаками после запятой
    return number.toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

interface ProductCardProps {
    projectId: string;
    projectName: string;
    productId?: string;
    productName?: string;
    onBack: () => void;
    onOpenSpecification: (specificationId: string, specificationName: string) => void;
    onProductNameUpdate?: (productName: string) => void;
    canEdit: () => boolean;
    canCreate: () => boolean;
    canDelete: () => boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
    projectId,
    projectName,
    productId,
    productName,
    onBack,
    onOpenSpecification,
    onProductNameUpdate,
    canEdit,
    canCreate,
    canDelete
}) => {

    // Состояние для редактирования изделия
    const [openProductEditDialog, setOpenProductEditDialog] = useState(false);
    const [productData, setProductData] = useState<any>(null);
    const [catalogProducts, setCatalogProducts] = useState<Array<{ id: string, name: string }>>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [isNewProduct, setIsNewProduct] = useState(productId?.startsWith('temp-') || false);
    const [currentProductId, setCurrentProductId] = useState(productId);

    // Принудительное обновление компонента при изменении статуса изделия
    useEffect(() => {
        // Component will re-render when isNewProduct changes
    }, [isNewProduct]);

    // Отслеживание изменений currentProductId для загрузки данных
    useEffect(() => {
        if (currentProductId && !currentProductId.startsWith('temp-') && projectId) {
            // Loading data for real product ID
            fetchProductData();
            fetchSpecifications();
            fetchStages();
        }
    }, [currentProductId, projectId]);

    const [productForm, setProductForm] = useState({
        productId: '', // ID из справочника (если выбрано)
        productName: '', // Название изделия (ручной ввод или выбор)
        serialNumber: '',
        quantity: 1,
        link: ''
    });

    // Состояние для спецификаций
    const [specifications, setSpecifications] = useState<ProjectSpecification[]>([]);
    const [specificationsLoading, setSpecificationsLoading] = useState(true);
    const [openSpecificationDialog, setOpenSpecificationDialog] = useState(false);
    const [editingSpecification, setEditingSpecification] = useState<ProjectSpecification | null>(null);
    const [specificationForm, setSpecificationForm] = useState({
        name: '',
        description: ''
    });

    // Состояние для inline редактирования описания спецификации
    const [editingDescription, setEditingDescription] = useState<string | null>(null);
    const [descriptionValue, setDescriptionValue] = useState<string>('');

    // Состояние для этапов работ
    const [stages, setStages] = useState<Stage[]>([]);
    const [workTypes, setWorkTypes] = useState<Array<{ id: string, name: string }>>([]);
    const [contractors, setContractors] = useState<Array<{ id: string, name: string }>>([]);
    const [openStageDialog, setOpenStageDialog] = useState(false);
    const [editingStage, setEditingStage] = useState<Stage | null>(null);
    const [stageForm, setStageForm] = useState({
        sum: '',
        hours: '',
        startDate: '',
        duration: 1,
        workTypeId: '',
        assigneeId: ''
    });

    // Функция форматирования даты
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    };

    // Загрузка спецификаций
    const fetchSpecifications = async () => {
        try {
            setSpecificationsLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            // Не загружаем спецификации для временных изделий
            if (currentProductId?.startsWith('temp-')) {
                setSpecifications([]);
                setSpecificationsLoading(false);
                return;
            }


            // Строим URL для получения спецификаций изделия
            const url = `${import.meta.env.VITE_API_BASE_URL}/product-specifications/products/${currentProductId}/specifications`;

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
            console.error('Ошибка загрузки спецификаций:', error);
        } finally {
            setSpecificationsLoading(false);
        }
    };

    // Загрузка этапов работ
    const fetchStages = async () => {
        if (!currentProductId) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/products/${currentProductId}/work-stages`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setStages(data);
        } catch (error) {
            console.error('Ошибка загрузки этапов:', error);
        }
    };

    // Загрузка типов работ и подрядчиков
    const fetchWorkTypesAndContractors = async () => {
        try {
            const token = localStorage.getItem('token');

            // Загружаем типы работ
            const workTypesResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature?type=Work`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (workTypesResponse.ok) {
                const workTypesData = await workTypesResponse.json();
                setWorkTypes(workTypesData);
            }

            // Загружаем подрядчиков
            const contractorsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/counterparties?isContractor=true`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (contractorsResponse.ok) {
                const contractorsData = await contractorsResponse.json();
                setContractors(contractorsData);
            }
        } catch (error) {
            console.error('Ошибка загрузки справочников:', error);
        }
    };

    // Загрузка данных изделия
    const fetchProductData = async () => {
        if (!currentProductId || !projectId) return;

        // Если это временное изделие, не загружаем данные с сервера
        if (currentProductId?.startsWith('temp-')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/products/${currentProductId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setProductData(data);
            } else {
                console.error(`Ошибка загрузки изделия: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('Ошибка загрузки данных изделия:', error);
        }
    };

    // Загрузка справочника изделий
    const fetchCatalogProducts = async () => {
        try {
            setLoadingProducts(true);
            const token = localStorage.getItem('token');

            // Загружаем изделия только из текущего проекта
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/products`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Преобразуем данные изделий проекта в формат для выпадающего списка
                const projectProducts = data.map((product: any) => ({
                    id: product.id,
                    name: product.product?.name || product.name || 'Без названия'
                }));
                setCatalogProducts(projectProducts);
            }
        } catch (error) {
            console.error('Ошибка загрузки изделий проекта:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    // Открытие диалога редактирования изделия
    const handleOpenProductEdit = async () => {

        // Если данные еще не загружены, загружаем их
        let currentProductData = productData;
        if (!currentProductData && productId && !productId.startsWith('temp-') && projectId) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/products/${productId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    currentProductData = await response.json();
                    setProductData(currentProductData);
                } else {
                    console.error(`Ошибка загрузки изделия: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                console.error('Ошибка загрузки данных изделия:', error);
            }
        }


        // Загружаем форму с актуальными данными
        setProductForm({
            productId: currentProductData?.product?.id || '',
            productName: currentProductData?.product?.name || '',
            serialNumber: currentProductData?.serialNumber || '',
            quantity: currentProductData?.quantity || 1,
            link: currentProductData?.description || ''
        });
        setOpenProductEditDialog(true);
    };

    // Сохранение изменений изделия
    const handleSaveProduct = async () => {
        try {

            // Проверяем, что есть либо выбранное изделие, либо введено название вручную
            if (!productForm.productId && !productForm.productName) {
                console.error('Validation failed: both productId and productName are empty');
                alert('Пожалуйста, выберите изделие из справочника или введите название вручную');
                return;
            }

            const token = localStorage.getItem('token');
            let finalProductId = productForm.productId;

            // Если введено название вручную, но не выбрано из справочника - создаём новое изделие в справочнике
            if (!productForm.productId && productForm.productName) {
                try {
                    const createProductResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/catalog-products`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            name: productForm.productName,
                            isActive: true
                        })
                    });

                    if (createProductResponse.ok) {
                        const newProduct = await createProductResponse.json();
                        finalProductId = newProduct.id;
                    } else {
                        const errorData = await createProductResponse.json().catch(() => ({ error: 'Unknown error' }));
                        console.error('Ошибка создания изделия в справочнике:', errorData);
                        alert(`Ошибка при создании изделия в справочнике: ${JSON.stringify(errorData)}`);
                        return;
                    }
                } catch (error) {
                    console.error('Ошибка при создании изделия в справочнике:', error);
                    alert('Произошла ошибка при создании изделия в справочнике');
                    return;
                }
            }

            const isNewProduct = productId?.startsWith('temp-');

            const requestBody = {
                productId: (finalProductId && !finalProductId.startsWith('temp-')) ? finalProductId : undefined,
                serialNumber: productForm.serialNumber || undefined,
                description: productForm.link || undefined,
                quantity: productForm.quantity,
                ...(isNewProduct ? { orderIndex: 0 } : { version: productData?.version || 1 })
            };


            const url = isNewProduct
                ? `${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/products`
                : `${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/products/${productId}`;

            const method = isNewProduct ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                const savedProduct = await response.json();

                setOpenProductEditDialog(false);

                // Обновляем локальные данные изделия
                setProductData(savedProduct);

                // Если это было новое изделие, обновляем статус
                if (isNewProduct) {
                    setIsNewProduct(false);
                }

                // Обновляем справочник изделий
                await fetchCatalogProducts();

                // Для нового изделия также обновляем спецификации и этапы
                if (isNewProduct) {
                    // Обновляем ID
                    setCurrentProductId(savedProduct.id);

                    // Обновляем название изделия в родительском компоненте
                    if (onProductNameUpdate) {
                        // Используем название из формы или из загруженных данных
                        const productName = productForm.productName || savedProduct.product?.name || 'Без названия';
                        onProductNameUpdate(productName);
                    }
                } else {
                    // Для существующего изделия обновляем данные через API
                    await fetchProductData();
                }
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('API Error:', errorData);
                alert(`Ошибка при сохранении изделия: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error('Ошибка сохранения изделия:', error);
            alert('Произошла ошибка при сохранении');
        }
    };

    useEffect(() => {
        fetchSpecifications();
        fetchProductData();
        fetchCatalogProducts();
        if (productId) {
            fetchStages();
            fetchWorkTypesAndContractors();
        }
    }, [projectId, productId]);

    // Автоматически открываем диалог редактирования для новых изделий
    useEffect(() => {
        if (productId && productId.startsWith('temp-')) {
            handleOpenProductEdit();
        }
    }, [productId]);

    // Обработчики для спецификаций
    const handleOpenSpecificationDialog = (specification?: ProjectSpecification) => {
        if (specification) {
            setEditingSpecification(specification);
            setSpecificationForm({
                name: specification.name,
                description: specification.description || ''
            });
        } else {
            setEditingSpecification(null);
            setSpecificationForm({
                name: '',
                description: ''
            });
        }
        setOpenSpecificationDialog(true);
    };

    const handleCloseSpecificationDialog = () => {
        setOpenSpecificationDialog(false);
        setEditingSpecification(null);
        setSpecificationForm({
            name: '',
            description: ''
        });
    };

    const handleSaveSpecification = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            // Проверяем, что продукт уже создан (не temp-*)
            if (!editingSpecification && currentProductId?.startsWith('temp-')) {
                console.error('Нельзя создать спецификацию для временного изделия, currentProductId:', currentProductId);
                alert('Сначала сохраните изделие, а затем создавайте спецификации');
                return;
            }


            const url = editingSpecification
                ? `${import.meta.env.VITE_API_BASE_URL}/product-specifications/${editingSpecification.id}`
                : `${import.meta.env.VITE_API_BASE_URL}/product-specifications/products/${currentProductId}/specifications`;

            const method = editingSpecification ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: specificationForm.name,
                    description: specificationForm.description
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchSpecifications();
            handleCloseSpecificationDialog();
        } catch (error) {
            console.error('Ошибка сохранения спецификации:', error);
        }
    };

    const handleDeleteSpecification = async (specificationId: string) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту спецификацию?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/product-specifications/${specificationId}`, {
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
            console.error('Ошибка удаления спецификации:', error);
        }
    };

    // Функции для inline редактирования описания спецификации
    const handleDescriptionClick = (specificationId: string, currentDescription: string) => {
        if (canEdit()) {
            setEditingDescription(specificationId);
            setDescriptionValue(currentDescription || '');
        }
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDescriptionValue(e.target.value);
    };

    const handleDescriptionSave = async (specificationId: string) => {
        if (!canEdit()) {
            console.log('Нет прав на редактирование');
            setEditingDescription(null);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/product-specifications/${specificationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    description: descriptionValue
                })
            });

            if (response.ok) {
                const updatedSpecification = await response.json();
                setSpecifications(prev => prev.map(spec =>
                    spec.id === specificationId ? {
                        ...spec,
                        description: updatedSpecification.description
                    } : spec
                ));
                console.log('Описание обновлено:', updatedSpecification);
            } else {
                console.error('Ошибка обновления описания');
            }
        } catch (error) {
            console.error('Ошибка обновления описания:', error);
        }

        setEditingDescription(null);
    };

    const handleDescriptionCancel = () => {
        setEditingDescription(null);
        setDescriptionValue('');
    };

    const handleDescriptionKeyDown = (e: React.KeyboardEvent, specificationId: string) => {
        if (e.key === 'Enter') {
            handleDescriptionSave(specificationId);
        } else if (e.key === 'Escape') {
            handleDescriptionCancel();
        }
    };

    // Функция создания копии спецификации с увеличением версии
    const handleCreateSpecificationCopy = async (originalSpecification: ProjectSpecification) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            // Создаем копию спецификации с увеличенной версией
            const newVersion = (originalSpecification.version || 1) + 1;
            const copyData = {
                name: originalSpecification.name, // Копируем исходное название
                description: '', // Описание не копируется
                version: newVersion
            };

            const response = await fetch(`http://localhost:4000/product-specifications/products/${currentProductId}/specifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(copyData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const newSpecification = await response.json();
            console.log('Копия спецификации создана:', newSpecification);

            // Обновляем список спецификаций
            await fetchSpecifications();

            // Открываем окно "Спецификация" для новой спецификации
            onOpenSpecification(newSpecification.id, newSpecification.name);

        } catch (error) {
            console.error('Ошибка создания копии спецификации:', error);
        }
    };

    // Обработчики для этапов работ
    const handleOpenStageDialog = (stage?: Stage) => {
        if (stage) {
            setEditingStage(stage);
            // Преобразуем дату в формат YYYY-MM-DD для HTML input
            const formattedDate = stage.startDate ?
                (typeof stage.startDate === 'string' ?
                    stage.startDate.split('T')[0] :
                    new Date(stage.startDate).toISOString().split('T')[0]) : '';

            setStageForm({
                sum: stage.sum,
                hours: stage.hours || '',
                startDate: formattedDate,
                duration: stage.duration || 1,
                workTypeId: stage.workTypeId || '',
                assigneeId: stage.assignee?.id || stage.assigneeId || ''
            });
        } else {
            setEditingStage(null);
            setStageForm({
                sum: '',
                hours: '',
                startDate: '',
                duration: 1,
                workTypeId: '',
                assigneeId: ''
            });
        }
        setOpenStageDialog(true);
    };

    const handleCloseStageDialog = () => {
        setOpenStageDialog(false);
        setEditingStage(null);
        setStageForm({
            sum: '',
            hours: '',
            startDate: '',
            duration: 1,
            workTypeId: '',
            assigneeId: ''
        });
    };

    const handleSaveStage = async () => {
        try {
            // Проверяем обязательное поле "Вид работ"
            if (!stageForm.workTypeId || stageForm.workTypeId.trim() === '') {
                alert('Пожалуйста, выберите вид работ');
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            // Вычисляем дату окончания: дата начала + продолжительность
            let startDate = null;
            let endDate = null;

            if (stageForm.startDate && stageForm.startDate.trim() !== '') {
                startDate = new Date(stageForm.startDate);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + stageForm.duration);
            }

            const url = editingStage
                ? `${import.meta.env.VITE_API_BASE_URL}/projects/products/${productId}/work-stages/${editingStage.id}`
                : `${import.meta.env.VITE_API_BASE_URL}/projects/products/${productId}/work-stages`;

            const method = editingStage ? 'PUT' : 'POST';

            const requestData: any = {
                sum: stageForm.sum || '',
                hours: stageForm.hours || '',
                startDate: startDate ? startDate.toISOString() : null,
                endDate: endDate ? endDate.toISOString() : null,
                duration: stageForm.duration,
                nomenclatureItemId: stageForm.workTypeId,
                assigneeId: stageForm.assigneeId || undefined,
                productId: productId
            };

            if (!editingStage) {
                requestData.orderIndex = 0;
            }


            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('❌ API Error:', errorData);
                throw new Error(`HTTP error! status: ${response.status}, details: ${JSON.stringify(errorData)}`);
            }

            await fetchStages();
            handleCloseStageDialog();
        } catch (error) {
            console.error('Ошибка сохранения этапа:', error);
            alert(`Произошла ошибка при сохранении: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    const handleDeleteStage = async (stageId: string) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот этап?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/products/${productId}/work-stages/${stageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchStages();
        } catch (error) {
            console.error('Ошибка удаления этапа:', error);
        }
    };


    return (
        <Box className="page-container">
            {/* Заголовок */}
            <Box className="page-header">
                <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px' }}>
                    Карточка изделия проекта «{projectName}»
                    <br />
                    <span
                        style={{ textDecoration: 'underline', cursor: 'pointer', userSelect: 'none' }}
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleOpenProductEdit();
                        }}
                        title="Двойной клик для редактирования"
                    >{productData?.product?.name || productName || '...'}</span>
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <VolumeButton
                        variant="contained"
                        onClick={onBack}
                        color="orange"
                    >
                        Назад
                    </VolumeButton>
                </Box>
            </Box>

            {/* Секция спецификаций */}
            <Box sx={{ mb: 4 }}>
                <Box className="page-header" sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '18px', mb: 0 }}>
                        Список спецификаций
                    </Typography>
                    {canCreate() && (
                        <VolumeButton
                            variant="contained"
                            onClick={() => handleOpenSpecificationDialog()}
                            color="blue"
                        >
                            Добавить
                        </VolumeButton>
                    )}
                </Box>

                {/* Таблица спецификаций */}
                <TableContainer component={Paper}>
                    <Table sx={{ '& .MuiTableCell-root': { border: '1px solid #e0e0e0' } }}>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '300px' }}>Название</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '100px' }}>Версия</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Описание</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '140px' }}>Дата создания</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '100px' }}>Сумма</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '40px' }}>
                                    <DeleteIcon fontSize="small" sx={{ color: 'red' }} />
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {specificationsLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                                        <LinearProgress />
                                    </TableCell>
                                </TableRow>
                            ) : specifications.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            Список спецификаций пуст
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                specifications.map((specification) => (
                                    <TableRow
                                        key={specification.id}
                                        sx={{ height: '35px', cursor: 'pointer' }}
                                        onDoubleClick={() => onOpenSpecification(specification.id, specification.name)}
                                    >
                                        <TableCell sx={{ py: 0.5, width: '300px' }}>
                                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                {specification.name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 0.5, textAlign: 'center', width: '100px' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                <Box
                                                    onClick={() => {
                                                        handleCreateSpecificationCopy(specification);
                                                    }}
                                                    sx={{
                                                        width: '20px',
                                                        height: '20px',
                                                        p: '2px 4px',
                                                        cursor: 'pointer',
                                                        backgroundColor: '#f0f0f0',
                                                        border: '1px solid #808080',
                                                        fontFamily: 'Arial, sans-serif',
                                                        fontSize: '11px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        '&:hover': {
                                                            backgroundColor: '#e8e8e8'
                                                        },
                                                        '&:active': {
                                                            backgroundColor: '#d8d8d8',
                                                            border: '1px solid #404040'
                                                        }
                                                    }}
                                                >
                                                    <Typography variant="body2" sx={{
                                                        fontWeight: 'bold',
                                                        color: '#000',
                                                        fontFamily: 'Arial, sans-serif',
                                                        fontSize: '12px',
                                                        textAlign: 'center',
                                                        lineHeight: 1
                                                    }}>
                                                        +
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                    {specification.version || '1'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                py: 0.5,
                                                cursor: canEdit() ? 'pointer' : 'default',
                                                position: 'relative'
                                            }}
                                            onDoubleClick={(e) => {
                                                e.stopPropagation();
                                                handleDescriptionClick(specification.id, specification.description || '');
                                            }}
                                        >
                                            {editingDescription === specification.id ? (
                                                <input
                                                    type="text"
                                                    value={descriptionValue}
                                                    onChange={handleDescriptionChange}
                                                    onBlur={() => handleDescriptionSave(specification.id)}
                                                    onKeyDown={(e) => handleDescriptionKeyDown(e, specification.id)}
                                                    onFocus={(e) => e.target.select()}
                                                    style={{
                                                        width: '100%',
                                                        border: 'none',
                                                        outline: 'none',
                                                        background: 'transparent',
                                                        fontSize: '14px',
                                                        fontFamily: 'inherit',
                                                        color: 'inherit'
                                                    }}
                                                    autoFocus
                                                />
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    {specification.description || ''}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ py: 0.5, textAlign: 'center', width: '140px' }}>
                                            {formatDate(specification.createdAt)}
                                        </TableCell>
                                        <TableCell sx={{ py: 0.5, textAlign: 'right', width: '100px' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                {specification.totalSum ? `${specification.totalSum.toLocaleString('ru-RU')} ₽` : '0,00'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center', py: 0.5, width: '40px' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
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
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

            </Box>

            {/* Секция этапов работ */}
            <Box>
                <Box className="page-header" sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '18px', mb: 0 }}>
                        Этапы работ
                    </Typography>
                    <VolumeButton
                        variant="contained"
                        onClick={() => handleOpenStageDialog()}
                        color="blue"
                    >
                        Добавить
                    </VolumeButton>
                </Box>

                {!productId ? (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Для просмотра этапов работ необходимо выбрать изделие
                    </Alert>
                ) : (
                    <>
                        {/* Таблица этапов */}
                        <TableContainer component={Paper}>
                            <Table sx={{ '& .MuiTableCell-root': { border: '1px solid #e0e0e0' } }}>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '150px' }}>Вид работ</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '150px' }}>Исполнитель</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Сумма</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Часов</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Руб/час</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Старт</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Срок</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Финиш</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '60px' }}>
                                            <DeleteIcon fontSize="small" sx={{ color: 'red' }} />
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {stages.map((stage) => (
                                        <TableRow
                                            key={stage.id}
                                            sx={{ height: '35px', cursor: 'pointer' }}
                                            onDoubleClick={() => handleOpenStageDialog(stage)}
                                        >
                                            <TableCell sx={{ py: 0.5, textAlign: 'center', width: '150px' }}>
                                                {stage.nomenclatureItem ? (
                                                    <Chip
                                                        label={stage.nomenclatureItem.name}
                                                        size="small"
                                                        variant="outlined"
                                                        color="primary"
                                                        sx={{ width: '100%', minWidth: '120px', borderRadius: '6px' }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary" sx={{ width: '100%', minWidth: '120px' }}>
                                                        Не указан
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ py: 0.5, textAlign: 'center', width: '150px' }}>
                                                {stage.assignee ? (
                                                    <Chip
                                                        label={stage.assignee.name}
                                                        size="small"
                                                        variant="outlined"
                                                        color="secondary"
                                                        sx={{ width: '100%', minWidth: '120px', borderRadius: '6px' }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary" sx={{ width: '100%', minWidth: '120px' }}>
                                                        Не назначен
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ py: 0.5, textAlign: 'right' }}>
                                                <Box sx={{ textAlign: 'right' }}>
                                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                        {formatSum(stage.sum)}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
                                                <Typography variant="body2">
                                                    {stage.hours || '0'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
                                                <Typography variant="body2">
                                                    {(() => {
                                                        if (!stage.sum || !stage.hours) return '0.00';
                                                        const sumValue = parseFloat(String(stage.sum).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
                                                        const hoursValue = parseFloat(stage.hours || '0');
                                                        return hoursValue > 0 ? (sumValue / hoursValue).toFixed(2) : '0.00';
                                                    })()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 0.5, textAlign: 'center' }}>{formatDate(stage.startDate)}</TableCell>
                                            <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
                                                <Typography variant="body2">
                                                    {stage.duration} дн.
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 0.5, textAlign: 'center' }}>{formatDate(stage.endDate)}</TableCell>
                                            <TableCell sx={{ py: 0.5, textAlign: 'center', width: '60px' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDeleteStage(stage.id)}
                                                        color="error"
                                                        title="Удалить этап"
                                                        sx={{ minWidth: 'auto', padding: '4px' }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                    </>
                )}
            </Box>

            {/* Диалог создания/редактирования спецификации */}
            <Dialog open={openSpecificationDialog} onClose={() => { }} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingSpecification ? 'Редактировать спецификацию' : 'Создать спецификацию'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Название"
                        fullWidth
                        variant="outlined"
                        value={specificationForm.name}
                        onChange={(e) => setSpecificationForm({ ...specificationForm, name: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="Описание"
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        value={specificationForm.description}
                        onChange={(e) => setSpecificationForm({ ...specificationForm, description: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <VolumeButton onClick={handleSaveSpecification} color="blue">
                        {editingSpecification ? 'Сохранить' : 'Создать'}
                    </VolumeButton>
                    <VolumeButton onClick={handleCloseSpecificationDialog} color="orange">
                        Отмена
                    </VolumeButton>
                </DialogActions>
            </Dialog>

            {/* Диалог создания/редактирования этапа */}
            <Dialog open={openStageDialog} onClose={() => { }} maxWidth="sm" fullWidth disableEscapeKeyDown>
                <DialogTitle>
                    {editingStage ? 'Редактировать этап' : 'Создать этап'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <FormControl fullWidth required>
                            <InputLabel>Вид работ</InputLabel>
                            <Select
                                value={stageForm.workTypeId}
                                onChange={(e) => setStageForm({ ...stageForm, workTypeId: e.target.value })}
                                label="Вид работ"
                                required
                            >
                                <MenuItem value="">
                                    <em>Не выбран</em>
                                </MenuItem>
                                {workTypes.map((workType) => (
                                    <MenuItem key={workType.id} value={workType.id}>
                                        {workType.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Исполнитель</InputLabel>
                            <Select
                                value={stageForm.assigneeId}
                                onChange={(e) => setStageForm({ ...stageForm, assigneeId: e.target.value })}
                                label="Исполнитель"
                            >
                                <MenuItem value="">
                                    <em>Не выбран</em>
                                </MenuItem>
                                {contractors.map((contractor) => (
                                    <MenuItem key={contractor.id} value={contractor.id}>
                                        {contractor.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Сумма"
                                value={stageForm.sum}
                                onChange={(e) => setStageForm({ ...stageForm, sum: e.target.value })}
                                sx={{ flex: 1 }}
                            />
                            <TextField
                                label="Часов"
                                value={stageForm.hours}
                                onChange={(e) => setStageForm({ ...stageForm, hours: e.target.value })}
                                sx={{ flex: 1 }}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Дата начала"
                                type="date"
                                value={stageForm.startDate}
                                onChange={(e) => setStageForm({ ...stageForm, startDate: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                sx={{ flex: 1 }}
                                InputProps={{
                                    inputProps: {
                                        lang: 'ru-RU'
                                    },
                                    endAdornment: (
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                const input = document.querySelector('input[type="date"]') as HTMLInputElement;
                                                if (input) {
                                                    input.showPicker();
                                                }
                                            }}
                                            sx={{ mr: 1 }}
                                        >
                                            <CalendarIcon fontSize="small" />
                                        </IconButton>
                                    )
                                }}
                            />
                            <TextField
                                label="Срок (дни)"
                                type="number"
                                value={stageForm.duration}
                                onChange={(e) => setStageForm({ ...stageForm, duration: parseInt(e.target.value) || 1 })}
                                sx={{ flex: 1 }}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <VolumeButton onClick={handleSaveStage} color="blue">
                        {editingStage ? 'Сохранить' : 'Создать'}
                    </VolumeButton>
                    <VolumeButton onClick={handleCloseStageDialog} color="orange">
                        Отмена
                    </VolumeButton>
                </DialogActions>
            </Dialog>

            {/* Диалог редактирования/создания изделия */}
            <Dialog
                key={`product-dialog-${isNewProduct}-${currentProductId}`}
                open={openProductEditDialog}
                onClose={() => { }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{isNewProduct ? 'Создать изделие' : 'Редактировать изделие'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <Autocomplete
                            freeSolo
                            options={catalogProducts}
                            getOptionLabel={(option) => {
                                if (typeof option === 'string') return option;
                                return `${option.name}`;
                            }}
                            value={productForm.productId ? catalogProducts.find(p => p.id === productForm.productId) || null : productForm.productName}
                            onChange={(_, newValue) => {
                                if (typeof newValue === 'string') {
                                    // Ручной ввод
                                    setProductForm({
                                        ...productForm,
                                        productId: '',
                                        productName: newValue
                                    });
                                } else if (newValue && newValue.id) {
                                    // Выбор из списка
                                    setProductForm({
                                        ...productForm,
                                        productId: newValue.id,
                                        productName: newValue.name
                                    });
                                } else {
                                    // Очистка
                                    setProductForm({
                                        ...productForm,
                                        productId: '',
                                        productName: ''
                                    });
                                }
                            }}
                            onInputChange={(event, newInputValue) => {
                                // Обновляем productName при вводе текста
                                if (event && event.type === 'change') {
                                    setProductForm({
                                        ...productForm,
                                        productName: newInputValue,
                                        productId: ''
                                    });
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Изделие"
                                    fullWidth
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    error={!productForm.productId && !productForm.productName}
                                    helperText="Выберите из списка или введите название вручную"
                                />
                            )}
                            disabled={loadingProducts}
                        />
                        <TextField
                            label="Серийный номер"
                            value={productForm.serialNumber}
                            onChange={(e) => setProductForm({ ...productForm, serialNumber: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Количество"
                            type="number"
                            value={productForm.quantity}
                            onChange={(e) => setProductForm({ ...productForm, quantity: parseInt(e.target.value) || 1 })}
                            InputLabelProps={{ shrink: true }}
                            required
                        />
                        <TextField
                            label="Ссылка"
                            value={productForm.link}
                            onChange={(e) => setProductForm({ ...productForm, link: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <VolumeButton onClick={handleSaveProduct} color="blue">
                        {productId?.startsWith('temp-') ? 'Создать' : 'Сохранить'}
                    </VolumeButton>
                    <VolumeButton onClick={() => setOpenProductEditDialog(false)} color="orange">
                        Отмена
                    </VolumeButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProductCard;