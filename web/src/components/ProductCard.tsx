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
    CalendarToday as CalendarIcon,
    Balance as BalanceIcon
} from '@mui/icons-material';
import VolumeButton from './VolumeButton';

// Интерфейсы для спецификаций
interface ProjectSpecification {
    id: string;
    name: string;
    description?: string;
    totalSum?: number; // Общая сумма спецификации
    version?: number; // Версия спецификации
    isLocked?: boolean; // Заблокирована ли спецификация
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

    // Состояние для сравнения версий
    const [showVersionCompareDialog, setShowVersionCompareDialog] = useState(false);
    const [comparingSpecification, setComparingSpecification] = useState<ProjectSpecification | null>(null);
    const [versionCompareData, setVersionCompareData] = useState<any>(null);
    const [versionCompareLoading, setVersionCompareLoading] = useState(false);

    // Функция форматирования даты
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    };

    // Загрузка спецификаций
    // Функция для форматирования чисел с пробелами и запятой
    const formatNumber = (value: number | null | undefined): string => {
        if (value === null || value === undefined) return '-';
        return value.toLocaleString('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Функция для определения статуса спецификаций (дочерняя/родительская)
    const determineSpecificationStatus = (specifications: any[]) => {
        // Группируем спецификации по названию
        const groupedByNames = specifications.reduce((acc, spec) => {
            const name = spec.name || 'Без названия';
            if (!acc[name]) {
                acc[name] = [];
            }
            acc[name].push(spec);
            return acc;
        }, {});

        // Для каждой группы определяем статус
        const result = [];
        for (const [name, specs] of Object.entries(groupedByNames)) {
            const specsArray = specs as any[];

            if (specsArray.length === 1) {
                // Если версия одна - она дочерняя (активная)
                const processedSpecs = specsArray.map((spec) => ({
                    ...spec,
                    isChild: true,   // Единственная версия = дочерняя (активная)
                    isParent: false // Единственная версия = не родительская
                }));
                result.push(...processedSpecs);
            } else {
                // Если версий несколько - самая большая дочерняя, остальные родительские
                const sortedSpecs = specsArray.sort((a, b) => (b.version || 1) - (a.version || 1));
                const processedSpecs = sortedSpecs.map((spec, index) => ({
                    ...spec,
                    isChild: index === 0, // Первая (самая большая) = дочерняя (активная)
                    isParent: index > 0   // Остальные = родительские
                }));
                result.push(...processedSpecs);
            }
        }

        return result;
    };

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

            // Определяем дочерние и родительские спецификации
            const specificationsWithStatus = determineSpecificationStatus(data);
            setSpecifications(specificationsWithStatus);
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

    // Загрузка справочника изделий из текущего проекта (только изделия из данного проекта)
    const fetchCatalogProducts = async () => {
        try {
            setLoadingProducts(true);
            const token = localStorage.getItem('token');
            if (!token || !projectId) {
                return;
            }

            // Загружаем изделия из текущего проекта
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/products`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Преобразуем в формат для выпадающего списка и убираем дубликаты по названию (без учета регистра)
                const uniqueProductsMap = new Map<string, { id: string, name: string }>();
                data.forEach((product: any) => {
                    // Используем product.name из связанного справочника изделий
                    const productName = product.product?.name || product.name || 'Без названия';
                    const productId = product.product?.id || product.id;
                    if (productId && productName) {
                        const nameKey = productName.trim().toLowerCase();
                        if (!uniqueProductsMap.has(nameKey)) {
                            uniqueProductsMap.set(nameKey, {
                                id: productId,
                                name: productName
                            });
                        }
                    }
                });
                // Преобразуем Map в массив
                const uniqueProducts = Array.from(uniqueProductsMap.values());
                setCatalogProducts(uniqueProducts);
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

            // Если введено название вручную, но не выбрано из справочника - проверяем существование или создаём новое изделие
            if (!productForm.productId && productForm.productName) {
                try {
                    // Сначала проверяем, существует ли изделие с таким названием
                    const searchResponse = await fetch(
                        `${import.meta.env.VITE_API_BASE_URL}/catalog-products?query=${encodeURIComponent(productForm.productName.trim())}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        }
                    );

                    if (searchResponse.ok) {
                        const existingProducts = await searchResponse.json();
                        // Ищем точное совпадение (без учета регистра)
                        const exactMatch = existingProducts.find((p: any) =>
                            p.name.trim().toLowerCase() === productForm.productName.trim().toLowerCase()
                        );

                        if (exactMatch) {
                            // Используем существующий ID
                            finalProductId = exactMatch.id;
                            console.log(`Найдено существующее изделие: ${exactMatch.name} (ID: ${exactMatch.id})`);
                        } else {
                            // Создаём новое изделие только если не найдено точное совпадение
                            const createProductResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/catalog-products`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    name: productForm.productName.trim(),
                                    isActive: true
                                })
                            });

                            if (createProductResponse.ok) {
                                const newProduct = await createProductResponse.json();
                                finalProductId = newProduct.id;
                                console.log(`Создано новое изделие: ${newProduct.name} (ID: ${newProduct.id})`);
                            } else {
                                const errorData = await createProductResponse.json().catch(() => ({ error: 'Unknown error' }));
                                console.error('Ошибка создания изделия в справочнике:', errorData);
                                alert(`Ошибка при создании изделия в справочнике: ${JSON.stringify(errorData)}`);
                                return;
                            }
                        }
                    } else {
                        // Если поиск не удался, пробуем создать новое
                        const createProductResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/catalog-products`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                name: productForm.productName.trim(),
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
                    }
                } catch (error) {
                    console.error('Ошибка при создании/поиске изделия в справочнике:', error);
                    alert('Произошла ошибка при создании изделия в справочнике');
                    return;
                }
            }

            // Проверяем, что finalProductId валидный перед отправкой
            if (!finalProductId || !finalProductId.trim()) {
                alert('Ошибка: не удалось определить ID изделия. Пожалуйста, попробуйте снова.');
                return;
            }

            const isNewProduct = productId?.startsWith('temp-');

            const requestBody = {
                productId: finalProductId.trim(),
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
        // Находим спецификацию для проверки статуса
        const specification = specifications.find(spec => spec.id === specificationId);
        if (specification?.isParent) {
            alert('Эта спецификация является родительской и не может быть удалена. Удалите дочернюю версию.');
            return;
        }

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

    // Функция для загрузки данных сравнения версий
    const fetchVersionCompare = async (specification: ProjectSpecification) => {
        try {
            setVersionCompareLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            // API найдет родительскую (версия - 1) и дочернюю (текущая версия) спецификации
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/product-specifications/${specification.id}/compare/${specification.version - 1}/${specification.version}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setVersionCompareData(data);
        } catch (error) {
            console.error('Ошибка загрузки сравнения версий:', error);
            alert('Ошибка при загрузке данных сравнения');
        } finally {
            setVersionCompareLoading(false);
        }
    };

    // Функция для открытия диалога сравнения версий
    const handleOpenVersionCompare = (specification: ProjectSpecification) => {
        setComparingSpecification(specification);
        setShowVersionCompareDialog(true);
        fetchVersionCompare(specification);
    };

    // Функции для inline редактирования описания спецификации
    const handleDescriptionClick = (specificationId: string, currentDescription: string) => {
        if (canEdit()) {
            // Проверяем, не заблокирована ли спецификация
            const specification = specifications.find(spec => spec.id === specificationId);
            if (specification?.isLocked) {
                alert('Эта спецификация заблокирована и не может быть изменена');
                return;
            }
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

        // Проверяем, не заблокирована ли спецификация
        const specification = specifications.find(spec => spec.id === specificationId);
        if (specification?.isLocked) {
            console.log('Спецификация заблокирована');
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

            // Используем специальный эндпоинт для полного копирования спецификации
            // Этот эндпоинт копирует ВСЕ строки спецификации, а не только базовую информацию
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/product-specifications/${originalSpecification.id}/copy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('Ошибка копирования спецификации:', errorData);
                alert(`Ошибка при копировании спецификации: ${errorData.error || 'Неизвестная ошибка'}`);
                return;
            }

            const newSpecification = await response.json();
            console.log('Копия спецификации создана с содержимым:', newSpecification);

            // Обновляем список спецификаций
            await fetchSpecifications();

            // Открываем окно "Спецификация" для новой спецификации
            onOpenSpecification(newSpecification.id, newSpecification.name);

        } catch (error) {
            console.error('Ошибка создания копии спецификации:', error);
            alert('Произошла ошибка при копировании спецификации');
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
                workTypeId: stage.nomenclatureItem?.id || stage.workTypeId || '',
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
                    {canCreate() && specifications.some(spec => !spec.isLocked) && (
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
                                        onDoubleClick={() => {
                                            // Разрешаем открытие заблокированных спецификаций для просмотра
                                            onOpenSpecification(specification.id, specification.name);
                                        }}
                                    >
                                        <TableCell sx={{ py: 0.5, width: '300px' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                    {specification.name}
                                                </Typography>
                                                {specification.isLocked && (
                                                    <Box
                                                        sx={{
                                                            width: '16px',
                                                            height: '16px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#d32f2f',
                                                            fontSize: '12px'
                                                        }}
                                                        title="Спецификация заблокирована (есть дочерние копии)"
                                                    >
                                                        🔒
                                                    </Box>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ py: 0.5, textAlign: 'center', width: '100px' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                <Box
                                                    onClick={() => {
                                                        // Проверяем, не заблокирована ли спецификация
                                                        if (specification.isLocked) {
                                                            alert('Эта спецификация заблокирована и не может быть скопирована');
                                                            return;
                                                        }
                                                        handleCreateSpecificationCopy(specification);
                                                    }}
                                                    sx={{
                                                        width: '20px',
                                                        height: '20px',
                                                        p: '2px 4px',
                                                        cursor: specification.isLocked ? 'not-allowed' : 'pointer',
                                                        backgroundColor: specification.isLocked ? '#ffebee' : '#f0f0f0',
                                                        border: specification.isLocked ? '1px solid #f44336' : '1px solid #808080',
                                                        fontFamily: 'Arial, sans-serif',
                                                        fontSize: '11px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        opacity: specification.isLocked ? 0.6 : 1,
                                                        '&:hover': {
                                                            backgroundColor: specification.isLocked ? '#ffebee' : '#e8e8e8'
                                                        },
                                                        '&:active': {
                                                            backgroundColor: specification.isLocked ? '#ffebee' : '#d8d8d8',
                                                            border: specification.isLocked ? '1px solid #f44336' : '1px solid #404040'
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

                                                {/* Кнопка сравнения версий */}
                                                {specification.version && specification.version > 1 && (
                                                    <Box
                                                        onClick={() => handleOpenVersionCompare(specification)}
                                                        sx={{
                                                            width: '20px',
                                                            height: '20px',
                                                            p: '2px 4px',
                                                            cursor: 'pointer',
                                                            backgroundColor: '#e3f2fd',
                                                            border: '1px solid #2196f3',
                                                            fontFamily: 'Arial, sans-serif',
                                                            fontSize: '11px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            '&:hover': {
                                                                backgroundColor: '#bbdefb'
                                                            },
                                                            '&:active': {
                                                                backgroundColor: '#90caf9',
                                                                border: '1px solid #1976d2'
                                                            }
                                                        }}
                                                        title="Сравнить с предыдущей версией"
                                                    >
                                                        <BalanceIcon sx={{ fontSize: '12px', color: '#1976d2' }} />
                                                    </Box>
                                                )}

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
                                                {canDelete() && !specification.isLocked && (
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
                            isOptionEqualToValue={(option, value) => {
                                if (typeof option === 'string' || typeof value === 'string') return option === value;
                                return option.id === value.id;
                            }}
                            renderOption={(props, option) => {
                                // Явно указываем key на основе id для избежания дубликатов
                                const key = typeof option === 'string' ? option : option.id;
                                return (
                                    <li {...props} key={key}>
                                        {typeof option === 'string' ? option : option.name}
                                    </li>
                                );
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
                                        productId: '' // Сбрасываем ID при ручном вводе
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

            {/* Диалог сравнения версий */}
            <Dialog
                open={showVersionCompareDialog}
                onClose={() => { }} // Отключаем закрытие при клике вне окна
                maxWidth="lg"
                fullWidth
                disableEscapeKeyDown // Отключаем закрытие по Escape
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                        Сравнение версий: {comparingSpecification?.name} (v{(comparingSpecification?.version || 1) - 1} vs v{comparingSpecification?.version})
                    </Typography>
                    <IconButton
                        onClick={() => setShowVersionCompareDialog(false)}
                        sx={{ ml: 2 }}
                        size="small"
                    >
                        ✕
                    </IconButton>
                </DialogTitle>
                <DialogContent>

                    {versionCompareLoading ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography sx={{ fontSize: '12px' }}>Загрузка данных сравнения...</Typography>
                        </Box>
                    ) : versionCompareData ? (
                        <Box>
                            <Typography variant="body2" sx={{ mb: 2, color: '#666', fontSize: '12px' }}>
                                {versionCompareData.message}
                            </Typography>

                            {/* Таблица сравнения версий */}
                            {versionCompareData.changes && versionCompareData.changes.length > 0 ? (
                                <TableContainer component={Paper} sx={{ mt: 2 }}>
                                    <Table size="small" sx={{
                                        borderLeft: '2px solid #999',
                                        borderRight: '2px solid #999',
                                        '& .MuiTableCell-root': {
                                            borderRight: '1px solid #e0e0e0',
                                            fontSize: '12px !important',
                                            '& *': {
                                                fontSize: '12px !important'
                                            },
                                            '&:last-child': {
                                                borderRight: 'none'
                                            }
                                        },
                                        '& .MuiTableHead-root .MuiTableCell-root': {
                                            borderTop: '2px solid #999 !important',
                                            borderRight: '2px solid #999 !important',
                                            borderBottom: '2px solid #999 !important',
                                            fontWeight: 'bold !important',
                                            fontSize: '14px !important',
                                            '&:first-child': {
                                                borderLeft: '2px solid #999 !important'
                                            },
                                            '&:last-child': {
                                                borderRight: '2px solid #999 !important'
                                            }
                                        },
                                        '& .MuiTableBody-root .MuiTableRow:last-child .MuiTableCell-root': {
                                            borderBottom: '2px solid #999 !important'
                                        },
                                        '& .MuiTableBody-root .MuiTableCell-root *': {
                                            fontSize: '12px !important'
                                        }
                                    }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ textAlign: 'center', width: '120px' }}>Тип изменения</TableCell>
                                                <TableCell sx={{ textAlign: 'center', width: 'auto' }}>Номенклатура</TableCell>
                                                <TableCell sx={{ textAlign: 'center', width: '100px' }}>Артикул</TableCell>
                                                <TableCell sx={{ textAlign: 'center', width: '100px' }}>Кол-во</TableCell>
                                                <TableCell sx={{ textAlign: 'center', width: '120px' }}>Цена</TableCell>
                                                <TableCell sx={{ textAlign: 'center', width: '120px' }}>Сумма</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {versionCompareData.changes.map((change: any, index: number) => (
                                                <TableRow key={index}>
                                                    <TableCell sx={{ textAlign: 'center', width: '120px' }}>
                                                        {change.type === 'modified' ? (
                                                            <Box sx={{
                                                                px: 1,
                                                                py: 0.5,
                                                                borderRadius: 1,
                                                                fontSize: '12px',
                                                                fontWeight: 'bold',
                                                                color: 'white',
                                                                backgroundColor: '#ff9800',
                                                                display: 'inline-block',
                                                                minWidth: '80px',
                                                                textAlign: 'center'
                                                            }}>
                                                                Изменено
                                                            </Box>
                                                        ) : (
                                                            <Box sx={{
                                                                px: 1,
                                                                py: 0.5,
                                                                borderRadius: 1,
                                                                fontSize: '12px',
                                                                fontWeight: 'bold',
                                                                color: 'white',
                                                                backgroundColor:
                                                                    change.type === 'added' ? '#4caf50' : '#f44336',
                                                                display: 'inline-block',
                                                                minWidth: '80px',
                                                                textAlign: 'center'
                                                            }}>
                                                                {change.type === 'added' ? 'Добавлено' : 'Удалено'}
                                                            </Box>
                                                        )}
                                                    </TableCell>
                                                    <TableCell sx={{ width: 'auto' }}>{change.item.name}</TableCell>
                                                    <TableCell sx={{ width: '100px' }}>{change.item.article || '-'}</TableCell>
                                                    <TableCell sx={{ textAlign: 'right', width: '100px' }}>
                                                        {change.type === 'removed' ? (
                                                            <span style={{ color: '#f44336' }}>
                                                                {change.version1.quantity}
                                                            </span>
                                                        ) : change.type === 'added' ? (
                                                            <span style={{ color: '#4caf50' }}>
                                                                {change.version2.quantity}
                                                            </span>
                                                        ) : (
                                                            <Box>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                                    <Box sx={{
                                                                        fontSize: '12px',
                                                                        color: '#ff9800',
                                                                        fontWeight: 'bold'
                                                                    }}>Старое:</Box>
                                                                    <Box style={{ color: '#ff9800' }}>
                                                                        {change.version1.quantity}
                                                                    </Box>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <Box sx={{
                                                                        fontSize: '12px',
                                                                        color: '#2196f3',
                                                                        fontWeight: 'bold'
                                                                    }}>Новое:</Box>
                                                                    <Box style={{ color: '#2196f3' }}>
                                                                        {change.version2.quantity}
                                                                    </Box>
                                                                </Box>
                                                            </Box>
                                                        )}
                                                    </TableCell>
                                                    <TableCell sx={{ textAlign: 'right', width: '120px' }}>
                                                        {change.type === 'removed' ? (
                                                            <span style={{ color: '#f44336' }}>
                                                                {formatNumber(change.version1.price)}
                                                            </span>
                                                        ) : change.type === 'added' ? (
                                                            <span style={{ color: '#4caf50' }}>
                                                                {formatNumber(change.version2.price)}
                                                            </span>
                                                        ) : (
                                                            <Box>
                                                                <Box style={{ color: '#ff9800' }}>
                                                                    {formatNumber(change.version1.price)}
                                                                </Box>
                                                                <Box style={{ color: '#2196f3' }}>
                                                                    {formatNumber(change.version2.price)}
                                                                </Box>
                                                            </Box>
                                                        )}
                                                    </TableCell>
                                                    <TableCell sx={{ textAlign: 'right', width: '120px' }}>
                                                        {change.type === 'removed' ? (
                                                            <span style={{ color: '#f44336' }}>
                                                                {formatNumber(change.version1.totalPrice)}
                                                            </span>
                                                        ) : change.type === 'added' ? (
                                                            <span style={{ color: '#4caf50' }}>
                                                                {formatNumber(change.version2.totalPrice)}
                                                            </span>
                                                        ) : (
                                                            <Box>
                                                                <Box style={{ color: '#ff9800' }}>
                                                                    {formatNumber(change.version1.totalPrice)}
                                                                </Box>
                                                                <Box style={{ color: '#2196f3' }}>
                                                                    {formatNumber(change.version2.totalPrice)}
                                                                </Box>
                                                            </Box>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Box sx={{
                                    p: 2,
                                    border: '1px dashed #ccc',
                                    borderRadius: 1,
                                    textAlign: 'center',
                                    color: '#666',
                                    backgroundColor: '#f5f5f5'
                                }}>
                                    <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                        ✅ Изменений между версиями не найдено
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    ) : (
                        <Box sx={{
                            p: 2,
                            border: '1px dashed #ccc',
                            borderRadius: 1,
                            textAlign: 'center',
                            color: '#666'
                        }}>
                            <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                Ошибка загрузки данных сравнения
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <VolumeButton onClick={() => setShowVersionCompareDialog(false)} color="orange">
                        Закрыть
                    </VolumeButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProductCard;