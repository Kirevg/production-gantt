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
    MenuItem
} from '@mui/material';
import {
    Delete as DeleteIcon,
    List as ListIcon,
    CalendarToday as CalendarIcon
} from '@mui/icons-material';
import VolumeButton from './VolumeButton';

// Интерфейсы для спецификаций
interface ProjectSpecification {
    id: string;
    name: string;
    description?: string;
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
    workType?: {
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
    canCreate,
    canDelete
}) => {

    // Состояние для редактирования изделия
    const [openProductEditDialog, setOpenProductEditDialog] = useState(false);
    const [productData, setProductData] = useState<any>(null);
    const [nomenclatureItems, setNomenclatureItems] = useState<Array<{ id: string, name: string }>>([]);
    const [productForm, setProductForm] = useState({
        nomenclatureItemId: '',
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
            console.error('Ошибка загрузки спецификаций:', error);
        } finally {
            setSpecificationsLoading(false);
        }
    };

    // Загрузка этапов работ
    const fetchStages = async () => {
        if (!productId) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/products/${productId}/work-stages`, {
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
        if (!productId || !projectId) return;

        // Если это временное изделие, не загружаем данные с сервера
        if (productId.startsWith('temp-')) {
            console.log('Временное изделие, данные не загружаются с сервера');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/products/${productId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Product data loaded:', data);
                setProductData(data);
            } else {
                console.error(`Ошибка загрузки изделия: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('Ошибка загрузки данных изделия:', error);
        }
    };

    // Загрузка номенклатуры - только товары из группы "Изделия"
    const fetchNomenclature = async () => {
        try {
            const token = localStorage.getItem('token');

            // Сначала получаем все группы, чтобы найти группу "Изделия"
            const groupsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/groups`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!groupsResponse.ok) {
                console.error('Ошибка загрузки групп номенклатуры');
                return;
            }

            const groups = await groupsResponse.json();
            const productsGroup = groups.find((group: any) => group.name === 'Изделия');

            if (!productsGroup) {
                console.error('Группа "Изделия" не найдена');
                return;
            }

            // Получаем только товары из группы "Изделия"
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature?type=Product&groupId=${productsGroup.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setNomenclatureItems(data);
            }
        } catch (error) {
            console.error('Ошибка загрузки номенклатуры:', error);
        }
    };

    // Открытие диалога редактирования изделия
    const handleOpenProductEdit = async () => {
        console.log('handleOpenProductEdit called');
        console.log('productData before:', productData);
        console.log('nomenclatureItems:', nomenclatureItems);

        // Если данные еще не загружены, загружаем их
        let currentProductData = productData;
        if (!currentProductData && productId && !productId.startsWith('temp-') && projectId) {
            console.log('Loading product data...');
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/products/${productId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    currentProductData = await response.json();
                    console.log('Product data loaded:', currentProductData);
                    setProductData(currentProductData);
                } else {
                    console.error(`Ошибка загрузки изделия: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                console.error('Ошибка загрузки данных изделия:', error);
            }
        }

        console.log('productData after:', currentProductData);

        // Загружаем форму с актуальными данными
        setProductForm({
            nomenclatureItemId: currentProductData?.nomenclatureItem?.id || '',
            serialNumber: currentProductData?.serialNumber || '',
            quantity: currentProductData?.quantity || 1,
            link: currentProductData?.description || ''
        });
        setOpenProductEditDialog(true);
    };

    // Сохранение изменений изделия
    const handleSaveProduct = async () => {
        try {
            if (!productForm.nomenclatureItemId) {
                alert('Пожалуйста, выберите элемент номенклатуры');
                return;
            }

            const token = localStorage.getItem('token');
            const isNewProduct = productId?.startsWith('temp-');

            const requestBody = {
                nomenclatureItemId: productForm.nomenclatureItemId,
                serialNumber: productForm.serialNumber || undefined,
                description: productForm.link || undefined,
                quantity: productForm.quantity,
                ...(isNewProduct ? { orderIndex: 0 } : { version: productData?.version || 1 })
            };

            console.log('API: Request body:', requestBody);
            console.log('Is new product:', isNewProduct);

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
                setOpenProductEditDialog(false);
                // Обновляем данные изделия вместо перезагрузки страницы
                await fetchProductData();
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
        fetchNomenclature();
        if (productId) {
            fetchStages();
            fetchWorkTypesAndContractors();
        }
    }, [projectId, productId]);

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
                workTypeId: stage.workType?.id || stage.workTypeId || '',
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
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Токен не найден');
                return;
            }

            const url = editingStage
                ? `${import.meta.env.VITE_API_BASE_URL}/projects/products/${productId}/work-stages/${editingStage.id}`
                : `${import.meta.env.VITE_API_BASE_URL}/projects/products/${productId}/work-stages`;

            const method = editingStage ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    sum: stageForm.sum,
                    hours: stageForm.hours,
                    startDate: stageForm.startDate,
                    duration: stageForm.duration,
                    workTypeId: stageForm.workTypeId,
                    assigneeId: stageForm.assigneeId || null
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchStages();
            handleCloseStageDialog();
        } catch (error) {
            console.error('Ошибка сохранения этапа:', error);
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
                    Карточка изделия <span
                        style={{ textDecoration: 'underline', cursor: 'pointer', userSelect: 'none' }}
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            console.log('Double click triggered');
                            handleOpenProductEdit();
                        }}
                        title="Двойной клик для редактирования"
                    >{productName || '...'}</span>
                    <br />
                    проекта "<span style={{ textDecoration: 'underline' }}>{projectName}</span>"
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
                        Спецификации
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
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Название</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Описание</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Дата создания</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Дата обновления</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '60px' }}>
                                    <DeleteIcon fontSize="small" sx={{ color: 'red' }} />
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {specificationsLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                                        <LinearProgress />
                                    </TableCell>
                                </TableRow>
                            ) : specifications.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            Спецификации не найдены
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
                                        <TableCell sx={{ textAlign: 'center', py: 0.5, width: '60px' }}>
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
                                                {stage.workType ? (
                                                    <Chip
                                                        label={stage.workType.name}
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
            <Dialog open={openSpecificationDialog} onClose={handleCloseSpecificationDialog} maxWidth="sm" fullWidth>
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
                                    }
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
            <Dialog open={openProductEditDialog} onClose={() => setOpenProductEditDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{productId?.startsWith('temp-') ? 'Создать изделие' : 'Редактировать изделие'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <FormControl fullWidth required>
                            <InputLabel shrink>Элемент номенклатуры</InputLabel>
                            <Select
                                value={productForm.nomenclatureItemId}
                                onChange={(e) => setProductForm({ ...productForm, nomenclatureItemId: e.target.value })}
                                label="Элемент номенклатуры"
                                notched
                                required
                            >
                                {nomenclatureItems.map((item) => (
                                    <MenuItem key={item.id} value={item.id}>
                                        {item.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
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