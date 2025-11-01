// Импорт React хуков для управления состоянием компонентов
// Production Gantt - Система управления проектами
import React, { useState, useEffect, useCallback, useRef } from 'react';


// Импорт единого стиля для кнопок
import './styles/buttons.css';

// Импорт для маски ввода телефона (удален - используем собственное форматирование)


// Функция для форматирования телефона для отображения
const formatPhoneDisplay = (phone: string): string => {
  if (!phone) return '-';

  // Если телефон уже в нужном формате, возвращаем как есть
  if (phone.match(/^\+\d \d{3} \d{3}-\d{2}-\d{2}$/)) {
    return phone;
  }

  // Удаляем все символы кроме цифр и +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Если начинается с +7 или 7, форматируем как российский номер
  if (cleaned.startsWith('+7') && cleaned.length === 12) {
    const digits = cleaned.substring(2);
    return `+7 ${digits.substring(0, 3)} ${digits.substring(3, 6)}-${digits.substring(6, 8)}-${digits.substring(8, 10)}`;
  } else if (cleaned.startsWith('7') && cleaned.length === 11) {
    const digits = cleaned.substring(1);
    return `+7 ${digits.substring(0, 3)} ${digits.substring(3, 6)}-${digits.substring(6, 8)}-${digits.substring(8, 10)}`;
  }

  // Для других форматов возвращаем как есть
  return phone;
};

// Функция для форматирования телефона при вводе
const formatPhoneInput = (value: string): string => {
  // Удаляем все символы кроме цифр и +
  const cleaned = value.replace(/[^\d+]/g, '');

  // Если пустая строка, возвращаем пустую
  if (!cleaned) return '';

  // Если начинается с 8, заменяем на +7
  if (cleaned.startsWith('8')) {
    const digits = cleaned.substring(1);
    return `+7 ${digits.substring(0, 3)} ${digits.substring(3, 6)}-${digits.substring(6, 8)}-${digits.substring(8, 10)}`;
  }

  // Если начинается с 7, заменяем на +7
  if (cleaned.startsWith('7')) {
    const digits = cleaned.substring(1);
    return `+7 ${digits.substring(0, 3)} ${digits.substring(3, 6)}-${digits.substring(6, 8)}-${digits.substring(8, 10)}`;
  }

  // Если уже начинается с +7
  if (cleaned.startsWith('+7')) {
    const digits = cleaned.substring(2);
    return `+7 ${digits.substring(0, 3)} ${digits.substring(3, 6)}-${digits.substring(6, 8)}-${digits.substring(8, 10)}`;
  }

  // Если начинается не с +7, 7 или 8, добавляем +7
  const digits = cleaned.replace(/[^\d]/g, '');
  if (digits.length > 0) {
    return `+7 ${digits.substring(0, 3)} ${digits.substring(3, 6)}-${digits.substring(6, 8)}-${digits.substring(8, 10)}`;
  }
  return '+7 ';
};

// Компонент для ввода телефона с маской
const PhoneInput = React.forwardRef<HTMLInputElement, {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  sx?: object;
}>(({ value, onChange, placeholder, required, sx }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneInput(e.target.value);
    onChange(formatted);
  };

  return (
    <TextField
      fullWidth
      variant="outlined"
      placeholder={placeholder || "+7 999 999-99-99"}
      required={required}
      sx={sx}
      ref={ref}
      value={value}
      onChange={handleChange}
      inputProps={{
        maxLength: 18 // +7 999 999-99-99
      }}
    />
  );
});

PhoneInput.displayName = 'PhoneInput';


// Импорт компонентов Material-UI для создания пользовательского интерфейса
import {
  Container,    // Контейнер для ограничения ширины контента
  Paper,        // Бумажный компонент для создания карточек
  TextField,    // Поле ввода текста
  Button,       // Кнопка
  Typography,   // Текстовые элементы с различными стилями
  Box,          // Универсальный контейнер для компоновки
  Alert,        // Компонент для отображения уведомлений
  AppBar,       // Верхняя панель навигации
  Toolbar,      // Панель инструментов внутри AppBar
  Tabs,         // Компонент вкладок
  Tab,          // Отдельная вкладка
  Table,        // Таблица
  TableBody,    // Тело таблицы
  TableCell,    // Ячейка таблицы
  TableContainer, // Контейнер для таблицы
  TableHead,    // Заголовок таблицы
  TableRow,     // Строка таблицы
  Chip,         // Чип для отображения статуса
  CircularProgress, // Индикатор загрузки
  IconButton,   // Кнопка с иконкой
  Dialog,       // Модальное окно
  DialogTitle,  // Заголовок диалога
  DialogContent, // Содержимое диалога
  DialogActions, // Действия в диалоге
  Menu,         // Контекстное меню
  MenuItem,     // Элемент контекстного меню
  FormControlLabel, // Лейбл для элементов формы
  Checkbox,     // Чекбокс
  ToggleButtonGroup, // Группа переключателей
  ToggleButton  // Переключатель
} from '@mui/material';

// Импорт иконок из Material-UI
import {
  Delete,
  DragIndicator,
  Delete as DeleteIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Update as UpdateIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Home as HomeIcon,
  Assignment as ProjectIcon,
  Folder as FolderIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  AdminPanelSettings as AdminIcon,
  Timeline as GanttIcon,
  Clear as ClearIcon,
  CalendarMonth as CalendarMonthIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ViewAgenda as ViewAgendaIcon,
  CalendarToday as CalendarTodayIcon,
  Event as EventIcon
} from '@mui/icons-material';

// Импорт библиотек для drag-and-drop функциональности
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Импорт компонентов
import ProjectCard from './components/ProjectCard';
import StagesPage from './components/StagesPage';
import SpecificationDetail from './components/SpecificationDetail';
import ProductCard from './components/ProductCard';
import SpecificationsList from './components/SpecificationsList';
// import GanttChart from './components/GanttChart'; // Не используется
import KanbanBoard from './components/KanbanBoard';
import ReferencesPage from './components/ReferencesPage';
import VolumeButton from './components/VolumeButton';

// Интерфейс для описания структуры пользователя
interface User {
  id: string;        // Уникальный идентификатор пользователя
  email: string;     // Email адрес пользователя
  role: string;      // Роль пользователя (admin, manager, user)
  isActive: boolean; // Активен ли пользователь
}

// Интерфейс для ответа сервера при авторизации
interface LoginResponse {
  accessToken: string; // JWT токен для аутентификации
  user: User;          // Данные пользователя
}

// Интерфейс для описания структуры проекта
interface Project {
  id: string;         // Уникальный идентификатор проекта
  name: string;        // Название проекта
  status: 'InProject' | 'InProgress' | 'Done' | 'HasProblems'; // Статус проекта
  startDate: string | null;  // Дата начала проекта
  endDate: string | null;    // Дата окончания проекта
  ownerId: string;    // ID владельца проекта
  managerId?: string; // ID руководителя проекта
  orderIndex: number; // Индекс для сортировки проектов
  createdAt: string; // Дата создания
  updatedAt: string; // Дата последнего обновления
  owner?: {           // Информация о владельце
    id: string;
    email: string;
    role: string;
  };
  projectManager?: {         // Информация о руководителе проекта
    id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    email?: string;
    phone?: string;
  };
  tasks: Array<{    // Массив задач проекта
    id: string;
    name: string;
  }>;
}

// Интерфейс для руководителя проекта
interface ProjectManager {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

// Интерфейс для пользователя системы
interface SystemUser {
  id: string;
  email: string;
  password?: string;
  role: 'admin' | 'manager' | 'user';
  isActive: boolean;
  personId?: string;
  createdAt: string;
  updatedAt: string;
}

// Интерфейс для исполнителя
interface Contractor {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Компонент для управления руководителями проектов
function ProjectManagersList({ canEdit, canCreate, canDelete }: {
  canEdit: () => boolean;
  canCreate: () => boolean;
  canDelete: () => boolean;
}) {
  const [managers, setManagers] = useState<ProjectManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditManagerForm, setShowEditManagerForm] = useState(false);
  const [editingManager, setEditingManager] = useState<ProjectManager | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingManager, setDeletingManager] = useState<ProjectManager | null>(null);
  const [newManager, setNewManager] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: ''
  });

  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Токен авторизации не найден');
        setLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/persons?isProjectManager=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setManagers(data);
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
        setError(`Ошибка загрузки руководителей: ${errorData.error}`);
      }
    } catch (error) {
      setError(`Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/persons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...newManager,
          middleName: newManager.middleName || undefined,
          isProjectManager: true
        })
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewManager({ firstName: '', lastName: '', middleName: '', email: '', phone: '' });
        fetchManagers();
      } else {
        const errorData = await response.json();
        setError(`Ошибка создания руководителя: ${errorData.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      setError(`Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  const handleEditManager = (manager: ProjectManager) => {
    setEditingManager(manager);
    setShowEditManagerForm(true);
  };

  const handleUpdateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingManager) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/persons/${editingManager.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          firstName: editingManager.firstName,
          lastName: editingManager.lastName,
          middleName: editingManager.middleName || undefined,
          email: editingManager.email,
          phone: editingManager.phone
        })
      });

      if (response.ok) {
        setShowEditManagerForm(false);
        setEditingManager(null);
        fetchManagers();
      } else {
        const errorData = await response.json();
        setError(`Ошибка обновления руководителя: ${errorData.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      setError(`Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  const handleDeleteManager = (manager: ProjectManager) => {
    setDeletingManager(manager);
    setShowDeleteDialog(true);
  };

  const confirmDeleteManager = async () => {
    if (!deletingManager) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/persons/${deletingManager.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setShowDeleteDialog(false);
        setDeletingManager(null);
        fetchManagers();
      } else {
        const errorData = await response.json();
        setError(`Ошибка удаления руководителя: ${errorData.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      setError(`Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3} sx={{ width: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box className="page-container">
      {/* Заголовок и кнопка создания */}
      <Box className="page-header">
        <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px' }}>Список руководителей проектов</Typography>
        {canCreate() && (
          <Button
            variant="contained"
            size="large"
            onClick={() => setShowCreateForm(true)}
            className="depth-button"
            sx={{ fontSize: '14px' }}
          >
            Добавить руководителя
          </Button>
        )}
      </Box>

      {/* Форма создания руководителя */}
      <Dialog
        open={showCreateForm}
        onClose={() => { }}
        maxWidth="sm"
        fullWidth
        hideBackdrop={true}
        disablePortal={true}
        disableScrollLock={true}
        keepMounted={false}
        disableEnforceFocus={true}
        disableAutoFocus={true}
        disableEscapeKeyDown={true}
      >
        <DialogTitle>Добавить руководителя проекта</DialogTitle>
        <form onSubmit={handleCreateManager}>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              label="Фамилия"
              value={newManager.lastName}
              onChange={(e) => setNewManager({ ...newManager, lastName: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Имя"
              value={newManager.firstName}
              onChange={(e) => setNewManager({ ...newManager, firstName: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Отчество"
              value={newManager.middleName}
              onChange={(e) => setNewManager({ ...newManager, middleName: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={newManager.email}
              onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
              margin="normal"
              required
              inputProps={{
                autoComplete: "username"
              }}
            />
            <PhoneInput
              value={newManager.phone}
              onChange={(phone) => setNewManager({ ...newManager, phone })}
              placeholder="+7 999 999-99-99"
              required
              sx={{ mt: 2, mb: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateForm(false)} variant="contained" size="large" sx={{ fontSize: '14px' }}>Отмена</Button>
            <VolumeButton type="submit" color="blue">Создать</VolumeButton>
          </DialogActions>
        </form>
      </Dialog>

      {/* Таблица с руководителями */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>ФИО</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Телефон</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '60px' }}>
                <Delete fontSize="small" sx={{ color: 'red' }} />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {managers.map((manager) => (
              <TableRow
                key={manager.id}
                sx={{ height: '35px' }}
                onDoubleClick={() => canEdit() && handleEditManager(manager)}
                style={{ cursor: canEdit() ? 'pointer' : 'default' }}
              >
                <TableCell sx={{ fontWeight: 'medium', py: 0.5 }}>
                  {manager.lastName} {manager.firstName} {manager.middleName || ''}
                </TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>{manager.email || '-'}</TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>{formatPhoneDisplay(manager.phone || '')}</TableCell>
                <TableCell sx={{ textAlign: 'center', py: 0.5, width: '60px' }}>
                  {canDelete() && (
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteManager(manager)}
                      color="error"
                      sx={{ minWidth: 'auto', padding: '4px' }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Диалог редактирования руководителя */}
      <Dialog
        open={showEditManagerForm}
        onClose={() => { }}
        maxWidth="sm"
        fullWidth
        hideBackdrop={true}
        disablePortal={true}
        disableScrollLock={true}
        keepMounted={false}
        disableEnforceFocus={true}
        disableAutoFocus={true}
        disableEscapeKeyDown={true}
      >
        <DialogTitle sx={{ pb: 1 }}>Редактировать руководителя</DialogTitle>
        <DialogContent>
          {editingManager ? (
            <Box component="form" sx={{ mt: 2, width: '100%' }}>
              <TextField
                fullWidth
                label="Фамилия"
                value={editingManager.lastName}
                onChange={(e) => setEditingManager({ ...editingManager, lastName: e.target.value })}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Имя"
                value={editingManager.firstName}
                onChange={(e) => setEditingManager({ ...editingManager, firstName: e.target.value })}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Отчество"
                value={editingManager.middleName || ''}
                onChange={(e) => setEditingManager({ ...editingManager, middleName: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editingManager.email || ''}
                onChange={(e) => setEditingManager({ ...editingManager, email: e.target.value })}
                margin="normal"
              />
              <PhoneInput
                value={editingManager.phone || ''}
                onChange={(phone) => setEditingManager({ ...editingManager, phone })}
                placeholder="+7 999 999-99-99"
                sx={{ mt: 2, mb: 1 }}
              />
            </Box>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center', width: '100%' }}>
              <Typography color="error">Данные руководителя не загружены</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowEditManagerForm(false);
            setEditingManager(null);
          }} variant="contained" size="large" sx={{ fontSize: '14px' }}>Отмена</Button>
          <Button onClick={handleUpdateManager} variant="contained" size="large" sx={{ fontSize: '14px' }}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог удаления руководителя */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => { }}
        hideBackdrop={true}
        disablePortal={true}
        disableScrollLock={true}
        keepMounted={false}
        disableEnforceFocus={true}
        disableAutoFocus={true}
        disableEscapeKeyDown={true}
      >
        <DialogTitle>Удалить руководителя</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить руководителя "{deletingManager?.lastName} {deletingManager?.firstName}"?
            Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)} variant="contained" size="large" sx={{ fontSize: '14px' }}>Отмена</Button>
          <Button onClick={confirmDeleteManager} variant="contained" size="large" sx={{ fontSize: '14px', backgroundColor: 'error.main', '&:hover': { backgroundColor: 'error.dark' } }}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Компонент для управления исполнителями
function ContractorsList({ canEdit, canCreate, canDelete }: {
  canEdit: () => boolean;
  canCreate: () => boolean;
  canDelete: () => boolean;
}) {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditContractorForm, setShowEditContractorForm] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingContractor, setDeletingContractor] = useState<Contractor | null>(null);
  const [newContractor, setNewContractor] = useState({
    name: '',
    contactName: '',
    phone: '',
    email: ''
  });

  const fetchContractors = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Токен авторизации не найден');
        setLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/counterparties?isContractor=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setContractors(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка загрузки исполнителей');
      }
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractors();
  }, []);

  const handleCreateContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/counterparties`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newContractor,
          email: newContractor.email || undefined,
          isContractor: true
        }),
      });

      if (response.ok) {
        await fetchContractors();
        setShowCreateForm(false);
        setNewContractor({ name: '', contactName: '', phone: '', email: '' });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка создания исполнителя');
      }
    } catch {
      setError('Ошибка сети');
    }
  };

  const handleEditContractor = (contractor: Contractor) => {
    setEditingContractor(contractor);
    setShowEditContractorForm(true);
  };

  const handleUpdateContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContractor) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/counterparties/${editingContractor.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingContractor.name,
          contactName: editingContractor.contactName,
          phone: editingContractor.phone,
          email: editingContractor.email || undefined,
          isActive: editingContractor.isActive
        }),
      });

      if (response.ok) {
        await fetchContractors();
        setShowEditContractorForm(false);
        setEditingContractor(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка обновления исполнителя');
      }
    } catch {
      setError('Ошибка сети');
    }
  };

  const handleDeleteContractor = (contractor: Contractor) => {
    setDeletingContractor(contractor);
    setShowDeleteDialog(true);
  };

  const confirmDeleteContractor = async () => {
    if (!deletingContractor) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/counterparties/${deletingContractor.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchContractors();
        setShowDeleteDialog(false);
        setDeletingContractor(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка удаления исполнителя');
      }
    } catch {
      setError('Ошибка сети');
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', maxWidth: 'none' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px', mb: 4 }}>
          Исполнители
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, width: '100%' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box className="page-container">
      <Box className="page-header">
        <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px' }}>
          Список исполнителей
        </Typography>
        {canCreate() && (
          <Button
            variant="contained"
            onClick={() => setShowCreateForm(true)}
            className="depth-button"
            sx={{ fontSize: '14px' }}
          >
            Добавить исполнителя
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Название</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Контактное лицо</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Телефон</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Статус</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '60px' }}>
                <Delete fontSize="small" sx={{ color: 'red' }} />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contractors.map((contractor) => (
              <TableRow
                key={contractor.id}
                sx={{ height: '35px' }}
                onDoubleClick={() => canEdit() && handleEditContractor(contractor)}
                style={{ cursor: canEdit() ? 'pointer' : 'default' }}
              >
                <TableCell sx={{ py: 0.5 }}>{contractor.name}</TableCell>
                <TableCell sx={{ py: 0.5 }}>{contractor.contactName}</TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>{formatPhoneDisplay(contractor.phone)}</TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>{contractor.email || '-'}</TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
                  <Chip
                    label={contractor.isActive ? 'Активен' : 'Неактивен'}
                    color={contractor.isActive ? 'success' : 'default'}
                    size="small"
                    sx={{ width: '100px', borderRadius: '6px' }}
                  />
                </TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center', width: '60px' }}>
                  {canDelete() && (
                    <IconButton onClick={() => handleDeleteContractor(contractor)} size="small" color="error" sx={{ minWidth: 'auto', padding: '4px' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Форма создания исполнителя */}
      <Dialog
        open={showCreateForm}
        onClose={() => { }}
        maxWidth="sm"
        fullWidth
        hideBackdrop={true}
        disablePortal={true}
        disableScrollLock={true}
        keepMounted={false}
        disableEnforceFocus={true}
        disableAutoFocus={true}
        disableEscapeKeyDown={true}
      >
        <DialogTitle>Добавить исполнителя</DialogTitle>
        <form onSubmit={handleCreateContractor}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Название"
              fullWidth
              variant="outlined"
              value={newContractor.name}
              onChange={(e) => setNewContractor({ ...newContractor, name: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Контактное лицо"
              fullWidth
              variant="outlined"
              value={newContractor.contactName}
              onChange={(e) => setNewContractor({ ...newContractor, contactName: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <PhoneInput
              value={newContractor.phone}
              onChange={(phone) => setNewContractor({ ...newContractor, phone })}
              placeholder="+7 999 999-99-99"
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Email"
              type="email"
              fullWidth
              variant="outlined"
              value={newContractor.email}
              onChange={(e) => setNewContractor({ ...newContractor, email: e.target.value })}
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateForm(false)} variant="contained" size="large" sx={{ fontSize: '14px' }}>Отмена</Button>
            <Button type="submit" variant="contained" size="large" className="depth-button" sx={{ fontSize: '14px' }}>Создать</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Форма редактирования исполнителя */}
      <Dialog
        open={showEditContractorForm}
        onClose={() => { }}
        maxWidth="sm"
        fullWidth
        hideBackdrop={true}
        disablePortal={true}
        disableScrollLock={true}
        keepMounted={false}
        disableEnforceFocus={true}
        disableAutoFocus={true}
        disableEscapeKeyDown={true}
      >
        <DialogTitle>Редактировать исполнителя</DialogTitle>
        {editingContractor ? (
          <form onSubmit={handleUpdateContractor}>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Название"
                fullWidth
                variant="outlined"
                value={editingContractor.name}
                onChange={(e) => setEditingContractor({ ...editingContractor, name: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Контактное лицо"
                fullWidth
                variant="outlined"
                value={editingContractor.contactName}
                onChange={(e) => setEditingContractor({ ...editingContractor, contactName: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
              <PhoneInput
                value={editingContractor.phone}
                onChange={(phone) => setEditingContractor({ ...editingContractor, phone })}
                placeholder="+7 999 999-99-99"
                required
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Email"
                type="email"
                fullWidth
                variant="outlined"
                value={editingContractor.email || ''}
                onChange={(e) => setEditingContractor({ ...editingContractor, email: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editingContractor.isActive}
                    onChange={(e) => setEditingContractor({ ...editingContractor, isActive: e.target.checked })}
                  />
                }
                label="Активен"
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowEditContractorForm(false)} variant="contained" size="large" sx={{ fontSize: '14px' }}>Отмена</Button>
              <Button type="submit" variant="contained" size="large" sx={{ fontSize: '14px' }}>Сохранить</Button>
            </DialogActions>
          </form>
        ) : (
          <DialogContent>
            <Box sx={{ p: 2, textAlign: 'center', width: '100%' }}>
              <Typography color="error">Данные исполнителя не загружены</Typography>
            </Box>
          </DialogContent>
        )}
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => { }}
        hideBackdrop={true}
        disablePortal={true}
        disableScrollLock={true}
        keepMounted={false}
        disableEnforceFocus={true}
        disableAutoFocus={true}
        disableEscapeKeyDown={true}
      >
        <DialogTitle>Удалить исполнителя</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить исполнителя "{deletingContractor?.name}"?
            Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)} variant="contained" size="large" sx={{ fontSize: '14px' }}>Отмена</Button>
          <Button onClick={confirmDeleteContractor} variant="contained" size="large" sx={{ fontSize: '14px', backgroundColor: 'error.main', '&:hover': { backgroundColor: 'error.dark' } }}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Компонент для управления пользователями системы
function UsersList({ currentUser, canEdit, canCreate, canDelete }: {
  currentUser: User;
  canEdit: () => boolean;
  canCreate: () => boolean;
  canDelete: () => boolean;
}) {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditUserForm, setShowEditUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingUser, setDeletingUser] = useState<SystemUser | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'user' as 'user' | 'manager' | 'admin',
    personId: ''
  });

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Токен авторизации не найден');
        setLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
        setError(`Ошибка загрузки пользователей: ${errorData.error}`);
      }

      // Загрузка физических лиц для выбора при создании пользователя
      const personsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/persons`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (personsResponse.ok) {
        const personsData = await personsResponse.json();
        setPersons(personsData);
      }
    } catch (error) {
      setError(`Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  // Функция для проверки, является ли пользователь последним администратором
  const isLastAdmin = (user: SystemUser) => {
    if (user.role !== 'admin' || !user.isActive) return false;

    const activeAdmins = users.filter(u => u.role === 'admin' && u.isActive);
    return activeAdmins.length <= 1;
  };

  // Функция для проверки, можно ли удалить пользователя
  const canDeleteUser = (user: SystemUser) => {
    if (user.id === currentUser.id) return false; // Нельзя удалить себя
    return !isLastAdmin(user); // Нельзя удалить последнего администратора
  };

  // Функция для проверки, можно ли редактировать роль пользователя
  const canEditUserRole = (user: SystemUser) => {
    if (user.id === currentUser.id && isLastAdmin(user)) return false; // Последний админ не может изменить свою роль
    return true;
  };

  // Функция для проверки, можно ли деактивировать пользователя
  const canDeactivateUser = (user: SystemUser) => {
    if (user.id === currentUser.id && isLastAdmin(user)) return false; // Последний админ не может деактивировать себя
    return true;
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Токен авторизации не найден');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newUser,
          personId: newUser.personId || undefined
        })
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewUser({ email: '', password: '', role: 'user', personId: '' });
        fetchUsers();
        setError(null);
      } else {
        const errorData = await response.json();
        setError(`Ошибка создания пользователя: ${errorData.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      setError(`Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  const handleEditUser = (user: SystemUser) => {
    setEditingUser({ ...user, password: '' });
    setShowEditUserForm(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Токен авторизации не найден');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: editingUser.email,
          password: editingUser.password || undefined,
          role: editingUser.role,
          isActive: editingUser.isActive,
          personId: editingUser.personId || undefined
        })
      });

      if (response.ok) {
        setShowEditUserForm(false);
        setEditingUser(null);
        fetchUsers();
        setError(null);
      } else {
        const errorData = await response.json();
        setError(`Ошибка обновления пользователя: ${errorData.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      setError(`Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  const handleDeleteUser = (user: SystemUser) => {
    if (!canDeleteUser(user)) {
      if (user.id === currentUser.id) {
        setError('Вы не можете удалить самого себя');
      } else if (isLastAdmin(user)) {
        setError('Нельзя удалить последнего активного администратора системы');
      }
      return;
    }
    setDeletingUser(user);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Токен авторизации не найден');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setShowDeleteDialog(false);
        setDeletingUser(null);
        fetchUsers();
        setError(null);
      } else {
        const errorData = await response.json();
        setError(`Ошибка удаления пользователя: ${errorData.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      setError(`Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3} sx={{ width: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box className="page-container">
      {/* Заголовок и кнопка создания */}
      <Box className="page-header">
        <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px' }}>Управление пользователями</Typography>
        {canCreate() && (
          <Button
            variant="contained"
            size="large"
            onClick={() => setShowCreateForm(true)}
            className="depth-button"
            sx={{ fontSize: '14px' }}
          >
            Создать пользователя
          </Button>
        )}
      </Box>

      {/* Форма создания пользователя */}
      <Dialog
        open={showCreateForm}
        onClose={() => { }}
        maxWidth="sm"
        fullWidth
        hideBackdrop={true}
        disablePortal={true}
        disableScrollLock={true}
        keepMounted={false}
        disableEnforceFocus={true}
        disableAutoFocus={true}
        disableEscapeKeyDown={true}
      >
        <DialogTitle>Создать нового пользователя</DialogTitle>
        <form onSubmit={handleCreateUser}>
          <DialogContent>
            <TextField
              fullWidth
              select
              label="Физическое лицо"
              value={newUser.personId}
              onChange={(e) => setNewUser({ ...newUser, personId: e.target.value })}
              margin="normal"
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
            >
              <option value="">Не указано</option>
              {persons.map((person) => (
                <option key={person.id} value={person.id}>
                  {`${person.lastName} ${person.firstName} ${person.middleName || ''}`}
                </option>
              ))}
            </TextField>
            <TextField
              autoFocus
              fullWidth
              label="Email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              margin="normal"
              required
              InputLabelProps={{ shrink: true }}
              inputProps={{
                autoComplete: "username"
              }}
            />
            <TextField
              fullWidth
              label="Пароль"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              margin="normal"
              required
              InputLabelProps={{ shrink: true }}
              inputProps={{
                autoComplete: "new-password"
              }}
            />
            <TextField
              fullWidth
              select
              label="Роль"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'user' | 'manager' | 'admin' })}
              margin="normal"
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
            >
              <option value="user">Пользователь</option>
              <option value="manager">Менеджер</option>
              <option value="admin">Администратор</option>
            </TextField>
          </DialogContent>
          <DialogActions>
            <VolumeButton type="submit" variant="contained" size="large">Создать</VolumeButton>
            <VolumeButton onClick={() => setShowCreateForm(false)} variant="contained" size="large">Отмена</VolumeButton>
          </DialogActions>
        </form>
      </Dialog>

      {/* Таблица с пользователями */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>ФИО</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '150px', textAlign: 'center' }}>Роль</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Статус</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '60px' }}>
                <Delete fontSize="small" sx={{ color: 'red' }} />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                sx={{ height: '35px' }}
                onDoubleClick={() => canEdit() && handleEditUser(user)}
                style={{ cursor: canEdit() ? 'pointer' : 'default' }}
              >
                <TableCell sx={{ py: 0.5 }}>
                  {(user as any).person
                    ? `${(user as any).person.lastName} ${(user as any).person.firstName} ${(user as any).person.middleName || ''}`
                    : '-'}
                </TableCell>
                <TableCell sx={{ fontWeight: 'medium', py: 0.5 }}>
                  {user.email}
                </TableCell>
                <TableCell sx={{ py: 0.5, width: '150px', textAlign: 'center' }}>
                  <Chip
                    label={user.role === 'admin' ? 'Администратор' :
                      user.role === 'manager' ? 'Менеджер' : 'Пользователь'}
                    color={user.role === 'admin' ? 'error' :
                      user.role === 'manager' ? 'secondary' : 'primary'}
                    size="small"
                    sx={{ width: '120px', borderRadius: '6px' }}
                  />
                </TableCell>
                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
                  <Chip
                    label={user.isActive ? 'Активен' : 'Заблокирован'}
                    color={user.isActive ? 'success' : 'default'}
                    size="small"
                    sx={{ width: '100px', borderRadius: '6px' }}
                  />
                </TableCell>
                <TableCell sx={{ textAlign: 'center', py: 0.5, width: '60px' }}>
                  {canDelete() && (
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteUser(user)}
                      color="error"
                      disabled={!canDeleteUser(user)}
                      sx={{ minWidth: 'auto', padding: '4px' }}
                      title={!canDeleteUser(user) ?
                        (user.id === currentUser.id ? 'Нельзя удалить самого себя' : 'Нельзя удалить последнего администратора')
                        : 'Удалить пользователя'
                      }
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Диалог редактирования пользователя */}
      <Dialog
        open={showEditUserForm}
        onClose={() => { }}
        maxWidth="sm"
        fullWidth
        hideBackdrop={true}
        disablePortal={true}
        disableScrollLock={true}
        keepMounted={false}
        disableEnforceFocus={true}
        disableAutoFocus={true}
        disableEscapeKeyDown={true}
      >
        <DialogTitle sx={{ pb: 1 }}>Редактировать пользователя</DialogTitle>
        <DialogContent>
          {editingUser ? (
            <Box component="form" sx={{ mt: 2, width: '100%' }}>
              <TextField
                fullWidth
                select
                label="Физическое лицо"
                value={editingUser.personId || ''}
                onChange={(e) => setEditingUser({ ...editingUser, personId: e.target.value })}
                margin="normal"
                SelectProps={{ native: true }}
                InputLabelProps={{ shrink: true }}
              >
                <option value="">Не указано</option>
                {persons.map((person) => (
                  <option key={person.id} value={person.id}>
                    {`${person.lastName} ${person.firstName} ${person.middleName || ''}`}
                  </option>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editingUser.email}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                margin="normal"
                required
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Новый пароль (оставьте пустым, чтобы не изменять)"
                type="password"
                value={editingUser.password || ''}
                onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                margin="normal"
                helperText="Введите новый пароль или оставьте поле пустым"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                select
                label="Роль"
                value={editingUser.role}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'user' | 'manager' | 'admin' })}
                margin="normal"
                SelectProps={{ native: true }}
                disabled={!canEditUserRole(editingUser)}
                helperText={!canEditUserRole(editingUser) ? 'Последний администратор не может изменить свою роль' : ''}
                InputLabelProps={{ shrink: true }}
              >
                <option value="user">Пользователь</option>
                <option value="manager">Менеджер</option>
                <option value="admin">Администратор</option>
              </TextField>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editingUser.isActive}
                    onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                    disabled={!canDeactivateUser(editingUser)}
                  />
                }
                label="Активен"
              />
              {!canDeactivateUser(editingUser) && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  Последний администратор не может быть деактивирован
                </Typography>
              )}
            </Box>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center', width: '100%' }}>
              <Typography color="error">Данные пользователя не загружены</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditUserForm(false)} variant="contained" size="large" sx={{ fontSize: '14px' }}>Отмена</Button>
          <Button onClick={handleUpdateUser} variant="contained" size="large" sx={{ fontSize: '14px' }}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог удаления пользователя */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => { }}
        hideBackdrop={true}
        disablePortal={true}
        disableScrollLock={true}
        keepMounted={false}
        disableEnforceFocus={true}
        disableAutoFocus={true}
        disableEscapeKeyDown={true}
      >
        <DialogTitle>Удалить пользователя</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить пользователя "{deletingUser?.email}"?
            Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)} variant="contained" size="large" sx={{ fontSize: '14px' }}>Отмена</Button>
          <Button onClick={confirmDeleteUser} color="error" variant="contained" size="large">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Компонент для отображения списка проектов
function ProjectsList({ onOpenProjectComposition, onOpenCreateProject, user, canCreate, canDelete }: {
  onOpenProjectComposition: (project: Project) => void;
  onOpenCreateProject: () => void;
  user: User;
  canCreate: () => boolean;
  canDelete: () => boolean;
}) {
  // Состояние для хранения списка проектов
  const [projects, setProjects] = useState<Project[]>([]);
  // Состояние для отображения индикатора загрузки
  const [loading, setLoading] = useState(true);
  // Состояние для хранения ошибок
  const [error, setError] = useState<string | null>(null);
  // Состояние для показа/скрытия формы создания проекта
  const [showCreateForm, setShowCreateForm] = useState(false);
  // Состояние для показа/скрытия диалога удаления
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // Состояние для хранения проекта, который удаляется
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  // Состояние для формы создания нового проекта
  const [newProject, setNewProject] = useState({
    name: '',                    // Название проекта
    status: 'InProject' as 'InProject' | 'InProgress' | 'Done' | 'HasProblems',   // Статус по умолчанию
    managerId: ''               // ID руководителя проекта
  });
  // Состояние для списка руководителей
  const [managers, setManagers] = useState<Array<{
    id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    email?: string;
  }>>([]);
  // Состояние для отслеживания процесса перетаскивания
  const [isReordering, setIsReordering] = useState(false);
  // Состояние для фильтров статусов
  const [statusFilters, setStatusFilters] = useState({
    InProject: true,
    InProgress: true,
    Done: true,
    HasProblems: true
  });

  // Настройка сенсоров для drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // Начинаем перетаскивание только после движения на 10px
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  // Состояние для хранения данных о задачах проектов
  const [projectTasks, setProjectTasks] = useState<{ [projectId: string]: any[] }>({});

  // Обработчик для drag-and-drop событий
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      const filteredProjects = getFilteredProjects();

      // Находим индексы перетаскиваемого и целевого элементов в отфильтрованном списке
      const oldIndex = filteredProjects.findIndex((project) => project.id === active.id);
      const newIndex = filteredProjects.findIndex((project) => project.id === over.id);

      // Проверяем, что индексы найдены
      if (oldIndex === -1 || newIndex === -1) {
        console.error('Не удалось найти проекты для переупорядочивания');
        return;
      }

      // Сохраняем исходный порядок на случай ошибки
      const originalProjects = [...projects];

      // Обновляем порядок в локальном состоянии
      const reorderedFilteredProjects = arrayMove(filteredProjects, oldIndex, newIndex);

      // Обновляем общий список проектов, сохраняя новый порядок для отфильтрованных проектов
      const updatedProjects = [...projects];
      reorderedFilteredProjects.forEach((project, index) => {
        const projectIndex = updatedProjects.findIndex(p => p.id === project.id);
        if (projectIndex !== -1) {
          updatedProjects[projectIndex] = { ...project, orderIndex: index };
        }
      });

      setProjects(updatedProjects);
      setIsReordering(true);

      // Отправляем обновленный порядок на сервер
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Токен авторизации не найден');
          setProjects(originalProjects);
          setIsReordering(false);
          return;
        }

        // Отправляем на сервер только те проекты, которые изменили порядок
        const projectOrders = reorderedFilteredProjects.map((project, index) => ({
          id: project.id,
          orderIndex: index
        }));

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/reorder`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ projectOrders })
        });

        if (!response.ok) {
          // Если обновление не удалось, возвращаем исходный порядок
          setProjects(originalProjects);
          const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
          setError(`Ошибка обновления порядка проектов: ${errorData.error}`);
          console.error('Ошибка API:', response.status, errorData);
        } else {
          // Очищаем ошибки при успешном обновлении
          setError(null);
        }
      } catch (error) {
        // При ошибке возвращаем исходный порядок
        setProjects(originalProjects);
        setError(`Ошибка сети при обновлении порядка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        console.error('Ошибка сети:', error);
      } finally {
        setIsReordering(false);
      }
    }
  };

  // Функция для загрузки списка проектов с сервера
  const fetchProjects = async () => {
    try {
      // Получаем токен авторизации из localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Токен авторизации не найден. Пожалуйста, войдите в систему заново.');
        setLoading(false);
        return;
      }

      // Отправляем GET запрос на API для получения списка проектов
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Если запрос успешен, парсим JSON и обновляем состояние
        const data = await response.json();
        setProjects(data);
        setError(null); // Очищаем ошибки при успешной загрузке
      } else {
        // Если запрос неуспешен, парсим ошибку
        const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
        setError(`Ошибка загрузки проектов: ${errorData.error}`);
      }
    } catch (err) {
      // При ошибке сети устанавливаем соответствующее сообщение
      setError(`Ошибка сети: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    } finally {
      // В любом случае убираем индикатор загрузки
      setLoading(false);
    }
  };

  // Функция для загрузки задач проектов
  const fetchProjectTasks = async (projectId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/products`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const tasks = await response.json();
        setProjectTasks(prev => ({
          ...prev,
          [projectId]: tasks
        }));
      } else {
        const errorData = await response.json();
        console.error(`Ошибка загрузки задач для проекта ${projectId}:`, errorData);
      }
    } catch (err) {
      console.error('Ошибка загрузки задач проекта:', err);
    }
  };

  // Функция для загрузки всех задач проектов
  const fetchAllProjectTasks = async () => {
    for (const project of projects) {
      await fetchProjectTasks(project.id);
    }
  };

  // Функция для получения самой ранней даты начала из задач проекта
  // Рассчитывает даты так же, как в карточке проекта
  const getProjectEarliestStartDate = (projectId: string): string | null => {
    const tasks = projectTasks[projectId] || [];

    // Для каждой задачи (изделия) рассчитываем самую раннюю дату из её этапов работ
    // Это точно такая же логика, как в карточке проекта
    const productEarliestDates = tasks.map((task: any) => {
      const workStages = task.workStages || [];
      const datesWithValues = workStages
        .map((stage: any) => stage.startDate)
        .filter((date: any) => date && date.trim() !== '')
        .map((date: any) => new Date(date))
        .filter((date: Date) => !isNaN(date.getTime()));

      if (datesWithValues.length === 0) {
        return null;
      }

      const earliestDate = new Date(Math.min(...datesWithValues.map((date: Date) => date.getTime())));
      return earliestDate.toISOString().split('T')[0];
    }).filter((date: any) => date !== null);

    if (productEarliestDates.length === 0) {
      return null;
    }

    // Из всех самых ранних дат изделий выбираем самую раннюю
    const earliestDate = new Date(Math.min(...productEarliestDates.filter((date): date is string => date !== null).map((date: string) => new Date(date).getTime())));
    return earliestDate.toISOString().split('T')[0];
  };

  // Функция для получения самой поздней даты окончания из задач проекта
  // Рассчитывает даты так же, как в карточке проекта
  const getProjectLatestEndDate = (projectId: string): string | null => {
    const tasks = projectTasks[projectId] || [];

    // Для каждой задачи (изделия) рассчитываем самую позднюю дату из её этапов работ
    // Это точно такая же логика, как в карточке проекта
    const productLatestDates = tasks.map((task: any) => {
      const workStages = task.workStages || [];
      const datesWithValues = workStages
        .map((stage: any) => stage.endDate)
        .filter((date: any) => date && date.trim() !== '')
        .map((date: any) => new Date(date))
        .filter((date: Date) => !isNaN(date.getTime()));

      if (datesWithValues.length === 0) {
        return null;
      }

      const latestDate = new Date(Math.max(...datesWithValues.map((date: Date) => date.getTime())));
      return latestDate.toISOString().split('T')[0];
    }).filter((date: any) => date !== null);

    if (productLatestDates.length === 0) {
      return null;
    }

    // Из всех самых поздних дат изделий выбираем самую позднюю
    const latestDate = new Date(Math.max(...productLatestDates.filter((date): date is string => date !== null).map((date: string) => new Date(date).getTime())));
    return latestDate.toISOString().split('T')[0];
  };


  // Функция для загрузки списка руководителей
  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Токен авторизации не найден');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/persons?isProjectManager=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setManagers(data);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
        console.error('Ошибка загрузки руководителей:', errorData.error);
      }
    } catch (error) {
      console.error('Ошибка сети при загрузке руководителей:', error);
    }
  };

  // Функция для фильтрации и сортировки проектов по статусам
  const getFilteredProjects = () => {
    return projects
      .filter(project => statusFilters[project.status])
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  };

  // Обработчик изменения фильтров статусов
  const handleStatusFilterChange = (status: keyof typeof statusFilters) => {
    setStatusFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  // Эффект для загрузки проектов и руководителей при монтировании компонента
  useEffect(() => {
    fetchProjects();
    fetchManagers();
  }, []);

  // Эффект для загрузки задач проектов после загрузки проектов
  useEffect(() => {
    if (projects.length > 0) {
      fetchAllProjectTasks();
    }
  }, [projects]);

  // Компонент для перетаскиваемой строки таблицы
  function SortableTableRow({ project }: { project: Project }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: project.id,
      disabled: loading || isReordering // Отключаем перетаскивание во время загрузки или переупорядочивания
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <TableRow
        ref={setNodeRef}
        style={style}
        onDoubleClick={() => !loading && !isReordering && onOpenProjectComposition(project)}
        sx={{
          height: '35px',
          '&:hover': {
            backgroundColor: (loading || isReordering) ? 'transparent' : '#f5f5f5',
          },
        }}
      >
        <TableCell
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          sx={{
            width: '40px',
            minWidth: '40px',
            maxWidth: '40px',
            cursor: (loading || isReordering) ? 'default' : 'grab',
            opacity: (loading || isReordering) ? 0.5 : 1,
            py: 0.5,
            '&:active': {
              cursor: (loading || isReordering) ? 'default' : 'grabbing',
            },
          }}
        >
          <DragIndicator color="action" />
        </TableCell>
        <TableCell sx={{
          fontWeight: 'medium',
          py: 0.5,
          wordWrap: 'break-word',
          whiteSpace: 'normal'
        }}>
          {project.name}
        </TableCell>
        <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
          <Chip
            label={project.status === 'InProject' ? 'В проекте' :
              project.status === 'InProgress' ? 'В работе' :
                project.status === 'Done' ? 'Завершён' : 'Проблемы'}
            color={project.status === 'InProject' ? 'secondary' :
              project.status === 'InProgress' ? 'primary' :
                project.status === 'Done' ? 'success' : 'error'}
            size="small"
            sx={{ width: '120px', borderRadius: '6px' }}
          />
        </TableCell>
        <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
          {getProjectEarliestStartDate(project.id) ? new Date(getProjectEarliestStartDate(project.id)!).toLocaleDateString('ru-RU') : '-'}
        </TableCell>
        <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
          {getProjectLatestEndDate(project.id) ? new Date(getProjectLatestEndDate(project.id)!).toLocaleDateString('ru-RU') : '-'}
        </TableCell>
        <TableCell sx={{ py: 0.5 }}>
          {project.projectManager ? (
            <>
              {project.projectManager.firstName} {project.projectManager.lastName}
            </>
          ) : (
            'Не назначен'
          )}
        </TableCell>
        <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
          {formatPhoneDisplay(project.projectManager?.phone || '')}
        </TableCell>
        <TableCell sx={{ textAlign: 'center', py: 0.5, width: '60px' }}>
          {canDelete() && (
            <IconButton
              size="small"
              onClick={() => handleDeleteProject(project)}
              color="error"
              sx={{
                minWidth: 'auto',
                padding: '4px',
                '&:active': {
                  transform: 'none !important',
                  boxShadow: 'none !important',
                  backgroundColor: 'transparent !important'
                },
                '&:focus': {
                  outline: 'none !important',
                  backgroundColor: 'transparent !important'
                }
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          )}
        </TableCell>
      </TableRow>
    );
  }

  // Обработчик создания нового проекта
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault(); // Предотвращаем стандартное поведение формы
    try {
      // Получаем токен авторизации из localStorage
      const token = localStorage.getItem('token');
      // Отправляем POST запрос для создания проекта
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Передаем токен в заголовке
        },
        body: JSON.stringify({
          ...newProject, // Распаковываем данные формы
          ownerId: user.id, // ID текущего пользователя
          managerId: newProject.managerId || null // ID руководителя проекта
        })
      });

      if (response.ok) {
        // Если проект создан успешно
        setShowCreateForm(false); // Скрываем форму
        setNewProject({ name: '', status: 'InProject', managerId: '' }); // Очищаем форму
        fetchProjects(); // Обновляем список проектов
      } else {
        // Если произошла ошибка, парсим ответ и показываем ошибку
        const errorData = await response.json();
        setError(`Ошибка создания проекта: ${errorData.error || 'Неизвестная ошибка'}`);
      }
    } catch (err) {
      // При ошибке сети показываем соответствующее сообщение
      setError(`Ошибка сети: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    }
  };

  // Обработчик для начала удаления проекта
  const handleDeleteProject = (project: Project) => {
    setDeletingProject(project); // Устанавливаем проект для удаления
    setShowDeleteDialog(true);   // Показываем диалог подтверждения
  };

  // Обработчик подтверждения удаления проекта
  const confirmDeleteProject = async () => {
    if (!deletingProject) return; // Если нет проекта для удаления, выходим

    try {
      // Получаем токен авторизации
      const token = localStorage.getItem('token');
      // Отправляем DELETE запрос для удаления проекта
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/${deletingProject.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Если удаление успешно
        setShowDeleteDialog(false); // Скрываем диалог
        setDeletingProject(null);   // Очищаем удаляемый проект
        fetchProjects();             // Обновляем список
      } else {
        // Если произошла ошибка
        const errorData = await response.json();
        setError(`Ошибка удаления проекта: ${errorData.error || 'Неизвестная ошибка'}`);
      }
    } catch (err) {
      // При ошибке сети
      setError(`Ошибка сети: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    }
  };


  // Если идет загрузка, показываем индикатор
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3} sx={{ width: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Если есть ошибка, показываем ее
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  // Основной рендер компонента списка проектов
  return (
    <Box className="page-container">
      {/* Заголовок и кнопка создания проекта */}
      <Box className="page-header">
        <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px' }}>Список проектов</Typography>
        {canCreate() && (
          <Button
            variant="contained"
            size="large"
            onClick={onOpenCreateProject}
            className="depth-button"
            sx={{ fontSize: '14px' }}
          >
            Создать проект
          </Button>
        )}
      </Box>

      {/* Форма создания нового проекта */}
      <Dialog
        open={showCreateForm}
        onClose={() => { }}
        maxWidth="sm"
        fullWidth
        hideBackdrop={true}
        disablePortal={true}
        disableScrollLock={true}
        keepMounted={false}
        disableEnforceFocus={true}
        disableAutoFocus={true}
        disableEscapeKeyDown={true}
      >
        <DialogTitle>Создать новый проект</DialogTitle>
        <form onSubmit={handleCreateProject}>
          <DialogContent>
            {/* Поле для названия проекта */}
            <TextField
              autoFocus
              fullWidth
              label="Название проекта"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              margin="normal"
              required
            />
            {/* Выпадающий список для выбора руководителя проекта */}
            <TextField
              fullWidth
              select
              label="Руководитель проекта"
              value={newProject.managerId}
              onChange={(e) => setNewProject({ ...newProject, managerId: e.target.value })}
              margin="normal"
              SelectProps={{ native: true }}
            >
              <option value=""></option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.lastName} {manager.firstName} {manager.middleName || ''}
                </option>
              ))}
            </TextField>
            {/* Выпадающий список для выбора статуса */}
            <TextField
              fullWidth
              select
              label="Статус"
              value={newProject.status}
              onChange={(e) => setNewProject({ ...newProject, status: e.target.value as 'InProject' | 'InProgress' | 'Done' | 'HasProblems' })}
              margin="normal"
              SelectProps={{ native: true }}
            >
              <option value="InProject">В проекте</option>
              <option value="InProgress">В работе</option>
              <option value="Done">Завершён</option>
              <option value="HasProblems">Проблемы</option>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateForm(false)} variant="contained" size="large" sx={{ fontSize: '14px' }}>Отмена</Button>
            <Button type="submit" variant="contained" size="large" className="depth-button" sx={{ fontSize: '14px' }}>Создать</Button>
          </DialogActions>
        </form>
      </Dialog>


      {/* Фильтры статусов */}
      <Paper sx={{ p: 0, mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', height: '56px', overflow: 'hidden', width: '100%' }}>
          <Typography variant="body2" color="text.secondary">
            Показано: {getFilteredProjects().length} из {projects.length}
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={statusFilters.InProject}
                onChange={() => handleStatusFilterChange('InProject')}
                color="default"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Chip
                  label="В проекте"
                  color="secondary"
                  size="small"
                  sx={{ borderRadius: '6px' }}
                />
                <Typography variant="body2" color="text.secondary">
                  ({projects.filter(p => p.status === 'InProject').length})
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={statusFilters.InProgress}
                onChange={() => handleStatusFilterChange('InProgress')}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Chip
                  label="В работе"
                  color="primary"
                  size="small"
                  sx={{ borderRadius: '6px' }}
                />
                <Typography variant="body2" color="text.secondary">
                  ({projects.filter(p => p.status === 'InProgress').length})
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={statusFilters.Done}
                onChange={() => handleStatusFilterChange('Done')}
                color="success"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Chip
                  label="Завершён"
                  color="success"
                  size="small"
                  sx={{ borderRadius: '6px' }}
                />
                <Typography variant="body2" color="text.secondary">
                  ({projects.filter(p => p.status === 'Done').length})
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={statusFilters.HasProblems}
                onChange={() => handleStatusFilterChange('HasProblems')}
                color="error"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Chip
                  label="Проблемы"
                  color="error"
                  size="small"
                  sx={{ borderRadius: '6px' }}
                />
                <Typography variant="body2" color="text.secondary">
                  ({projects.filter(p => p.status === 'HasProblems').length})
                </Typography>
              </Box>
            }
          />

          <Button
            size="small"
            onClick={() => setStatusFilters({ InProject: true, InProgress: true, Done: true, HasProblems: true })}
            disabled={statusFilters.InProject && statusFilters.InProgress && statusFilters.Done && statusFilters.HasProblems}
          >
            Показать все
          </Button>
          <Button
            size="small"
            onClick={() => setStatusFilters({ InProject: false, InProgress: false, Done: false, HasProblems: false })}
            disabled={!statusFilters.InProject && !statusFilters.InProgress && !statusFilters.Done && !statusFilters.HasProblems}
          >
            Скрыть все
          </Button>
        </Box>
      </Paper>

      {/* Индикатор загрузки при переупорядочивании */}
      {isReordering && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Обновление порядка проектов...
        </Alert>
      )}

      {/* Таблица с проектами */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <TableContainer
          component={Paper}
          sx={{
            width: '100%',
            p: 0,
            '& .MuiTable-root': {
              minWidth: 'max-content' // Минимальная ширина таблицы
            }
          }}
        >
          <Table sx={{
            minWidth: 'max-content',
            tableLayout: 'fixed',
            '& .MuiTableCell-root': {
              borderRight: '1px solid #e0e0e0',
              '&:last-child': {
                borderRight: 'none'
              }
            },
            '& .MuiTableCell-root:first-of-type': {
              width: '40px !important',
              minWidth: '40px !important',
              maxWidth: '40px !important',
              flex: '0 0 40px !important'
            },
            '& .MuiTableBody-root .MuiTableCell-root': {
              padding: '4px 4px !important'
            },
            '& .MuiTableBody-root .MuiTableCell-root:first-of-type': {
              textAlign: 'center !important'
            },
            '& .MuiTableCell-root:nth-of-type(4)': {
              width: '100px !important',
              minWidth: '100px !important',
              maxWidth: '100px !important'
            },
            '& .MuiTableCell-root:nth-of-type(5)': {
              width: '100px !important',
              minWidth: '100px !important',
              maxWidth: '100px !important'
            },
            '& .MuiTableCell-root:nth-of-type(3)': {
              width: '120px !important',
              minWidth: '120px !important',
              maxWidth: '120px !important'
            },
            '& .MuiTableCell-root:nth-of-type(7)': {
              width: '140px !important',
              minWidth: '140px !important',
              maxWidth: '140px !important'
            },
            '& .MuiTableCell-root:nth-of-type(6)': {
              width: '200px !important',
              minWidth: '200px !important',
              maxWidth: '200px !important',
              whiteSpace: 'normal !important'
            },
            '& .MuiIconButton-root': {
              '&:active': {
                transform: 'none !important',
                boxShadow: 'none !important',
                backgroundColor: 'transparent !important'
              },
              '&:focus': {
                outline: 'none !important',
                backgroundColor: 'transparent !important'
              },
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04) !important'
              },
              '&:focus-visible': {
                outline: 'none !important'
              }
            }
          }}>
            {/* Заголовок таблицы */}
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5', height: '56px' }}>
                <TableCell sx={{ fontWeight: 'bold', width: '40px', minWidth: '40px', maxWidth: '40px', textAlign: 'center', px: 0 }}>
                  <Typography sx={{ fontSize: '18px', fontWeight: 900 }}>
                    ↑↓
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', px: 0 }}>Название</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', px: 0, width: '120px' }}>Статус</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', px: 0, width: '100px' }}>Старт</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', px: 0, width: '100px' }}>Финиш</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', px: 0, width: '200px' }}>Руководитель проекта</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', px: 0, width: '140px' }}>Телефон</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', px: 0, width: '60px' }}>
                  <Delete sx={{ color: 'error.main' }} />
                </TableCell>
              </TableRow>
            </TableHead>
            {/* Тело таблицы с данными проектов */}
            <TableBody>
              <SortableContext items={getFilteredProjects().map(p => p.id)} strategy={verticalListSortingStrategy}>
                {getFilteredProjects().map((project) => (
                  <SortableTableRow key={project.id} project={project} />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </TableContainer>
      </DndContext>

      {/* Диалог удаления проекта */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => { }}
        hideBackdrop={true}
        disablePortal={true}
        disableScrollLock={true}
        keepMounted={false}
        disableEnforceFocus={true}
        disableAutoFocus={true}
        disableEscapeKeyDown={true}
      >
        <DialogTitle>Удалить проект</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить проект "{deletingProject?.name}"?
            Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)} variant="contained" size="large" sx={{ fontSize: '14px' }}>Отмена</Button>
          <Button onClick={confirmDeleteProject} color="error" variant="contained" size="large">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Главный компонент приложения
export default function App() {
  // Состояние для формы входа
  const [email, setEmail] = useState('');        // Email пользователя
  const [password, setPassword] = useState('');  // Пароль пользователя
  const [loading, setLoading] = useState(false); // Индикатор загрузки
  const [error, setError] = useState('');        // Ошибка авторизации
  const [user, setUser] = useState<User | null>(null); // Данные авторизованного пользователя
  const [currentTab, setCurrentTab] = useState(0);    // Текущая активная вкладка

  // Состояние для календаря
  const [calendarView, setCalendarView] = useState<'month' | 'quarter' | 'halfyear' | 'year'>('month'); // Вид календаря
  const [calendarDate, setCalendarDate] = useState<Date>(new Date()); // Текущая дата календаря

  // Состояние для показа/скрытия состава проекта
  const [showProjectComposition, setShowProjectComposition] = useState(false);
  // Состояние для хранения проекта, состав которого просматривается
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  // Состояние для показа/скрытия страницы этапов работ
  const [showStagesPage, setShowStagesPage] = useState(false);
  // Состояние для хранения ID изделия, этапы которого просматриваются
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  // Состояние для показа/скрытия списка спецификаций
  const [showSpecificationsList, setShowSpecificationsList] = useState(false);
  // Состояние для переключения между старой и новой страницей спецификаций
  const [showOldSpecificationsList, setShowOldSpecificationsList] = useState(false);
  // Состояние для показа/скрытия детальной спецификации
  const [showSpecificationDetail, setShowSpecificationDetail] = useState(false);
  // Состояние для хранения информации об изделии для спецификаций
  const [selectedProductName, setSelectedProductName] = useState<string | null>(null);
  // Состояние для хранения ID и названия спецификации
  const [selectedSpecificationId, setSelectedSpecificationId] = useState<string | null>(null);
  const [selectedSpecificationName, setSelectedSpecificationName] = useState<string | null>(null);

  // Состояние для контекстного меню страницы
  const [pageContextMenu, setPageContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  // Эффект для обработчика переключения на старую страницу спецификаций
  useEffect(() => {
    const handleSwitchToOldSpecifications = (event: any) => {
      const { productId, productName } = event.detail;
      setSelectedProductId(productId);
      setSelectedProductName(productName);
      setShowSpecificationsList(true);
      setShowOldSpecificationsList(true);
    };

    window.addEventListener('switchToOldSpecifications', handleSwitchToOldSpecifications);

    return () => {
      window.removeEventListener('switchToOldSpecifications', handleSwitchToOldSpecifications);
    };
  }, []);

  // Эффект для закрытия контекстных меню при клике вне их
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Закрываем меню при клике вне элементов с data-context-menu-trigger
      const target = event.target as Element;
      if (!target.closest('[data-context-menu-trigger]')) {
        setPageContextMenu(null);
      }
    };

    const handleContextMenuOutside = (event: MouseEvent) => {
      const someMenuOpen = pageContextMenu !== null;

      // Проверяем цель клика
      const target = event.target as Element;
      const isContextMenuTrigger = target.closest('[data-context-menu-trigger]');
      const isInsideMuiMenu =
        !!(target.closest('.MuiMenu-root') || target.closest('.MuiPopover-root') || target.closest('[role="menu"]'));

      // Если клик по меню/триггеру — ничего не делаем
      if (isContextMenuTrigger || isInsideMuiMenu) {
        return;
      }

      // Если меню уже открыто и клик не по меню — блокируем нативное и репозиционируем меню страницы
      if (someMenuOpen) {
        event.preventDefault();
        setPageContextMenu({ mouseX: (event as MouseEvent).clientX + 2, mouseY: (event as MouseEvent).clientY - 6 });
        return;
      }

      // Если preventDefault уже был вызван (страница/карточка) — пропускаем
      if (event.defaultPrevented) {
        return;
      }

      // Если мы только что открываем меню страницы – не закрываем его сразу
      if (pageMenuOpeningRef.current) {
        return;
      }

      // Иначе — закрываем на всякий случай
      setPageContextMenu(null);
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('contextmenu', handleContextMenuOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('contextmenu', handleContextMenuOutside);
    };
  }, []);

  // Логирование состояния pageContextMenu для отладки — удалено

  // Функция для проверки доступа к вкладке
  const canAccessTab = useCallback((tabIndex: number) => {
    if (!user) return false;

    switch (tabIndex) {
      case 0: // Главная - доступна всем
        return true;
      case 1: // Канбан - доступна всем авторизованным
        return true;
      case 2: // Проекты - доступна всем авторизованным
        return true;
      case 3: // Справочники - доступна всем авторизованным
        return true;
      case 4: // Руководители - доступна всем авторизованным
        return true;
      case 5: // Исполнители - доступна всем авторизованным
        return true;
      case 6: // Админ панель - только для администраторов
        return user.role === 'admin';
      default:
        return false;
    }
  }, [user]);

  // Функция для проверки прав на редактирование
  const canEdit = useCallback(() => {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'manager';
  }, [user]);

  // Функция для проверки прав на создание
  const canCreate = useCallback(() => {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'manager';
  }, [user]);

  // Функция для проверки прав на удаление
  const canDelete = useCallback(() => {
    if (!user) return false;
    return user.role === 'admin';
  }, [user]);

  // Функция для восстановления из резервной копии
  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);

      // Читаем файл
      const text = await file.text();
      const backupData = JSON.parse(text);

      // Отправляем данные на сервер
      const response = await fetch('http://localhost:4000/api/backup/restore', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backupData }),
      });

      if (response.ok) {
        alert('База данных успешно восстановлена из резервной копии!');
        // Обновляем страницу для отображения восстановленных данных
        window.location.reload();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка восстановления');
      }
    } catch (error) {
      console.error('Ошибка восстановления:', error);
      alert(`Ошибка восстановления: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
      // Очищаем поле input
      event.target.value = '';
    }
  };

  // Функция для применения миграций
  const handleDeployMigrations = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/api/migrations/deploy', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Миграции применены успешно!\n\n${result.message}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка применения миграций');
      }
    } catch (error) {
      console.error('Ошибка применения миграций:', error);
      alert(`Ошибка применения миграций: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  // Функция для сброса миграций
  const handleResetMigrations = async () => {
    const confirmed = window.confirm(
      '⚠️ ВНИМАНИЕ! ⚠️\n\n' +
      'Сброс миграций УДАЛИТ ВСЕ ДАННЫЕ из базы данных!\n' +
      'Эта операция необратима!\n\n' +
      'Убедитесь, что у вас есть резервная копия!\n\n' +
      'Вы действительно хотите продолжить?'
    );

    if (!confirmed) return;

    const doubleConfirmed = window.confirm(
      'Последнее предупреждение!\n\n' +
      'ВСЕ ДАННЫЕ БУДУТ УДАЛЕНЫ!\n' +
      'Напишите "ДА" в следующем окне для подтверждения.'
    );

    if (!doubleConfirmed) return;

    const finalConfirm = window.prompt('Для подтверждения введите: ДА');
    if (finalConfirm !== 'ДА') {
      alert('Операция отменена.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/api/migrations/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirm: true }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Миграции сброшены успешно!\n\n${result.message}\n\nОбновите страницу для применения изменений.`);
        window.location.reload();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сброса миграций');
      }
    } catch (error) {
      console.error('Ошибка сброса миграций:', error);
      alert(`Ошибка сброса миграций: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  // Функция для проверки статуса миграций
  const handleCheckMigrationStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/api/migrations/status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Статус миграций:\n\n${result.status}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка проверки статуса');
      }
    } catch (error) {
      console.error('Ошибка проверки статуса миграций:', error);
      alert(`Ошибка проверки статуса: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  // Функция для создания резервной копии
  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Токен авторизации не найден. Пожалуйста, войдите в систему заново.');
      }


      const response = await fetch('http://localhost:4000/api/backup/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Скачиваем файл резервной копии
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        alert('Резервная копия успешно создана и скачана!');
      } else {
        const errorData = await response.json();
        console.error('Backup creation error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Ошибка создания резервной копии`);
      }
    } catch (error) {
      console.error('Ошибка создания резервной копии:', error);
      alert(`Ошибка создания резервной копии: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  // Функция для получения доступных вкладок
  const getAvailableTabs = () => {
    const tabs = [
      {
        index: 0,
        label: 'Главная',
        icon: <HomeIcon />,
        description: 'Главная страница',
        color: '#1976d2'
      },
      {
        index: 1,
        label: 'Канбан',
        icon: <GanttIcon />,
        description: 'Канбан-доска этапов',
        color: '#00897b'
      },
      {
        index: 2,
        label: 'Проекты',
        icon: <ProjectIcon />,
        description: 'Управление проектами',
        color: '#2e7d32'
      },
      {
        index: 3,
        label: 'Справочники',
        icon: <FolderIcon />,
        description: 'Номенклатура и единицы измерения',
        color: '#ed6c02'
      },
      {
        index: 4,
        label: 'Руководители',
        icon: <PersonIcon />,
        description: 'Руководители проектов',
        color: '#9c27b0'
      },
      {
        index: 5,
        label: 'Исполнители',
        icon: <GroupIcon />,
        description: 'Исполнители работ',
        color: '#d32f2f'
      },
      {
        index: 6,
        label: 'Админ панель',
        icon: <AdminIcon />,
        description: 'Управление системой',
        color: '#424242'
      }
    ];

    return tabs.filter(tab => canAccessTab(tab.index));
  };

  // Обработчик авторизации
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Предотвращаем стандартное поведение формы
    setLoading(true);   // Включаем индикатор загрузки
    setError('');       // Очищаем предыдущие ошибки

    try {
      // Отправляем POST запрос на сервер для авторизации
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }), // Передаем email и пароль
      });

      if (response.ok) {
        // Если авторизация успешна
        const data: LoginResponse = await response.json();
        setUser(data.user); // Сохраняем данные пользователя
        localStorage.setItem('token', data.accessToken); // Сохраняем токен в localStorage

        // Сбрасываем текущую вкладку на главную при входе
        setCurrentTab(0);
      } else {
        // Если произошла ошибка авторизации
        const errorData = await response.json();
        setError(errorData.error || 'Login failed');
      }
    } catch {
      // При ошибке сети
      setError('Network error');
    } finally {
      // В любом случае убираем индикатор загрузки
      setLoading(false);
    }
  };

  // Обработчик выхода из системы
  const handleLogout = () => {
    setUser(null); // Очищаем данные пользователя
    localStorage.removeItem('token'); // Удаляем токен из localStorage
    setCurrentTab(0); // Сбрасываем вкладку на главную
  };

  // Обработчик смены вкладки
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    // Проверяем доступ к вкладке перед переключением
    if (canAccessTab(newValue)) {
      // Закрываем все детальные страницы при переходе на другую вкладку
      setShowSpecificationDetail(false);
      setShowSpecificationsList(false);
      setShowOldSpecificationsList(false);
      setShowStagesPage(false);
      setShowProjectComposition(false);
      setSelectedProject(null);
      setSelectedProductId(null);
      setSelectedProductName(null);
      setSelectedSpecificationId(null);
      setSelectedSpecificationName(null);

      // Переключаем вкладку
      setCurrentTab(newValue);
    }
  };

  // Обработчики контекстного меню страницы
  // Флаг, помогающий не закрывать меню сразу после открытия в том же тике
  const pageMenuOpeningRef = useRef(false);

  // Обработчик клика по странице (для главной не требуется)
  // const handlePageClick = () => {
  //   setPageContextMenu(null);
  // };

  const handleClosePageContextMenu = () => {
    setPageContextMenu(null);
  };

  const handlePageContextMenuAction = (action: string) => {
    handleClosePageContextMenu();
    switch (action) {
      case 'create': {
        // Главная страница очищена — создание карточек выключено
        console.log('Создать');
        break;
      }
      case 'paste':
        // Здесь можно добавить логику вставки
        console.log('Вставить');
        break;
      case 'refresh':
        // Здесь можно добавить логику обновления
        console.log('Обновить');
        break;
    }
  };

  // Функция для открытия состава проекта
  const handleOpenProjectComposition = (project: Project) => {
    setSelectedProject(project);
    setShowProjectComposition(true);
  };

  // Функция для закрытия состава проекта
  const handleCloseProjectComposition = () => {
    setShowProjectComposition(false);
    setSelectedProject(null);
  };

  // Функция для открытия карточки создания проекта
  const handleOpenCreateProject = () => {
    setSelectedProject({
      id: 'new', // Временный ID для нового проекта
      name: '',
      status: 'InProject' as const,
      startDate: null,
      endDate: null,
      ownerId: user?.id || '',
      managerId: '',
      orderIndex: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      owner: user ? { id: user.id, email: user.email, role: user.role } : undefined,
      projectManager: undefined,
      tasks: []
    });
    setShowProjectComposition(true);
  };


  // Функция для закрытия страницы этапов работ
  const handleCloseStagesPage = () => {
    setShowStagesPage(false);
    setSelectedProductId(null);
  };

  // Функция для открытия страницы этапов из канбана
  const handleOpenStageFromKanban = (productId: string) => {
    setSelectedProductId(productId);
    setShowStagesPage(true);
  };

  // Функция для открытия списка спецификаций проекта
  const handleOpenSpecificationsList = (productId: string, productName: string) => {
    setSelectedProductId(productId);
    setSelectedProductName(productName);
    setShowSpecificationsList(true);
  };


  // Функция для открытия детальной спецификации
  const handleOpenSpecificationDetail = (specificationId: string, specificationName: string) => {
    setSelectedSpecificationId(specificationId);
    setSelectedSpecificationName(specificationName);
    setShowSpecificationDetail(true);
  };


  // Функция для закрытия детальной спецификации
  const handleCloseSpecificationDetail = () => {
    setShowSpecificationDetail(false);
    setSelectedSpecificationId(null);
    setSelectedSpecificationName(null);
  };


  // Эффект для проверки доступа к текущей вкладке при изменении пользователя
  useEffect(() => {
    if (user && !canAccessTab(currentTab)) {
      // Если текущая вкладка недоступна для пользователя, переключаемся на главную
      setCurrentTab(0);
    }
  }, [user, currentTab, canAccessTab]);

  // Функция для рендера содержимого вкладок
  const renderTabContent = () => {
    // Если открыта детальная спецификация, показываем её
    if (showSpecificationDetail && selectedSpecificationId && selectedSpecificationName) {
      return (
        <SpecificationDetail
          projectProductSpecificationListId={selectedSpecificationId}
          productName={selectedSpecificationName}
          onBack={handleCloseSpecificationDetail}
          canEdit={canEdit}
          canCreate={canCreate}
          canDelete={canDelete}
        />
      );
    }

    // Если открыт список спецификаций проекта, показываем его
    if (showSpecificationsList && selectedProject) {
      // Если включена старая страница, показываем SpecificationsList
      if (showOldSpecificationsList) {
        return (
          <SpecificationsList
            projectId={selectedProject.id}
            projectName={selectedProject.name}
            productId={selectedProductId || undefined}
            productName={selectedProductName || undefined}
            onBack={() => {
              setShowSpecificationsList(false);
              setShowOldSpecificationsList(false);
            }}
            onOpenSpecification={handleOpenSpecificationDetail}
            canEdit={canEdit}
            canCreate={canCreate}
            canDelete={canDelete}
          />
        );
      }

      // Иначе показываем новую объединенную страницу
      return (
        <ProductCard
          projectId={selectedProject.id}
          projectName={selectedProject.name}
          productId={selectedProductId || undefined}
          productName={selectedProductName || undefined}
          onBack={() => {
            setShowSpecificationsList(false);
            setShowOldSpecificationsList(false);
          }}
          onOpenSpecification={handleOpenSpecificationDetail}
          onProductNameUpdate={(newName) => setSelectedProductName(newName)}
          canEdit={canEdit}
          canCreate={canCreate}
          canDelete={canDelete}
        />
      );
    }

    // Если открыта страница этапов работ, показываем её
    if (showStagesPage && selectedProductId) {
      return (
        <StagesPage
          productId={selectedProductId}
          onBack={handleCloseStagesPage}
          canEdit={canEdit}
          canCreate={canCreate}
          canDelete={canDelete}
        />
      );
    }

    // Если открыт состав проекта, показываем его
    if (showProjectComposition && selectedProject) {
      return (
        <ProjectCard
          projectId={selectedProject.id}
          projectName={selectedProject.name}
          onClose={handleCloseProjectComposition}
          onOpenSpecifications={handleOpenSpecificationsList}
          canEdit={canEdit}
          canCreate={canCreate}
          canDelete={canDelete}
          isNew={selectedProject.id === 'new'}
          user={user}
        />
      );
    }

    // Проверяем доступ к текущей вкладке
    if (!canAccessTab(currentTab)) {
      return (
        <Box className="page-content-container">
          <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px', mb: 4 }}>
            Доступ запрещен
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            У вас нет прав доступа к этой странице.
          </Typography>
          <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
            Обратитесь к администратору для получения необходимых прав.
          </Typography>
        </Box>
      );
    }

    switch (currentTab) {
      case 0: // Главная страница — очищено по требованию (оставляем только шапку и вкладки)
        return null;
      case 1: // Канбан-доска
        return (
          <Box className="page-content-container">
            <Box sx={{ mt: 2, mb: 1, width: '100%' }}>
              <KanbanBoard onOpenStage={handleOpenStageFromKanban} />
            </Box>
          </Box>
        );
      case 2: // Страница проектов
        return user && <ProjectsList onOpenProjectComposition={handleOpenProjectComposition} onOpenCreateProject={handleOpenCreateProject} user={user} canCreate={canCreate} canDelete={canDelete} />;
      case 3: // Страница справочников
        return <ReferencesPage canEdit={canEdit} canCreate={canCreate} canDelete={canDelete} />;
      case 4: // Страница руководителей проектов
        return <ProjectManagersList canEdit={canEdit} canCreate={canCreate} canDelete={canDelete} />;
      case 5: // Страница исполнителей
        return <ContractorsList canEdit={canEdit} canCreate={canCreate} canDelete={canDelete} />;
      case 6: // Страница пользователей
        return (
          <>
            {user && <UsersList currentUser={user} canEdit={canEdit} canCreate={canCreate} canDelete={canDelete} />}

            {/* Управление базами данных */}
            <Box className="page-container">
              <Box className="page-header">
                <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px' }}>
                  Управление базами данных
                </Typography>
              </Box>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 2 }}>
                  Резервное копирование
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Создайте резервную копию базы данных перед важными изменениями
                </Typography>
                <Button
                  startIcon={<BackupIcon />}
                  sx={{ mr: 2 }}
                  onClick={handleCreateBackup}
                  disabled={loading}
                  className="system-button system-button-blue"
                >
                  Создать резервную копию
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreBackup}
                  style={{ display: 'none' }}
                  id="restore-backup-input"
                />
                <Button
                  startIcon={<RestoreIcon />}
                  component="label"
                  htmlFor="restore-backup-input"
                  disabled={loading}
                  className="system-button system-button-purple"
                >
                  Восстановить из копии
                </Button>
              </Paper>

              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 2 }}>
                  Миграции базы данных
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Управление схемой базы данных и миграциями
                </Typography>
                <Button
                  startIcon={<UpdateIcon />}
                  sx={{ mr: 2 }}
                  onClick={handleDeployMigrations}
                  disabled={loading}
                  className="system-button system-button-cyan"
                >
                  Применить миграции
                </Button>
                <Button
                  startIcon={<RefreshIcon />}
                  sx={{ mr: 2 }}
                  onClick={handleResetMigrations}
                  disabled={loading}
                  className="system-button system-button-orange"
                >
                  Сбросить миграции
                </Button>
                <Button
                  startIcon={<CheckCircleIcon />}
                  onClick={handleCheckMigrationStatus}
                  disabled={loading}
                  className="system-button system-button-green"
                >
                  Проверить статус
                </Button>
              </Paper>

              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 2 }}>
                  Очистка данных
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Осторожно! Эти операции необратимы
                </Typography>
                <Button
                  startIcon={<DeleteIcon />}
                  sx={{ mr: 2 }}
                  className="system-button system-button-red"
                >
                  Очистить все данные
                </Button>
                <Button
                  startIcon={<ClearIcon />}
                  className="system-button system-button-red"
                >
                  Удалить неиспользуемые записи
                </Button>
              </Paper>
            </Box>
          </>
        );
      default:
        return null;
    }
  };

  // Если пользователь авторизован, показываем основной интерфейс
  if (user) {
    return (
      <Box className="app" sx={{
        minHeight: '100vh',        // Минимальная высота на весь экран
        display: 'flex',          // Flexbox для вертикальной компоновки
        flexDirection: 'column'   // Вертикальное направление
      }}>
        {/* Верхняя панель навигации */}
        <AppBar position="static" className="header" sx={{ height: '56px', width: '100%', mx: 'auto', justifyContent: 'center', borderBottom: 'none' }}>
          <Toolbar sx={{
            height: '56px',
            minHeight: '0 !important',
            '&.MuiToolbar-root': {
              minHeight: '0 !important'
            }
          }}>
            {/* Логотип */}
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <img
                src="/logo.png"
                alt="Логотип"
                style={{
                  height: '50px',
                  width: '78px'
                }}
              />
            </Box>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Система управления проектами
            </Typography>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user.email} ({user.role}) {/* Отображаем email и роль пользователя */}
            </Typography>
            <Button color="inherit" onClick={handleLogout}>
              Выйти
            </Button>
          </Toolbar>
        </AppBar>

        {/* Панель вкладок */}
        <Tabs
          className="tabs"
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              color: 'white', // Белый цвет для неактивных вкладок
              fontWeight: 500,
              minHeight: '48px',
              padding: '8px 16px',
              '&.Mui-selected': {
                color: '#1976d2', // Синий цвет для активной вкладки
                fontWeight: 600,
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
              },
              '&:hover': {
                color: '#1976d2', // Синий цвет при наведении
                backgroundColor: 'rgba(25, 118, 210, 0.05)',
              }
            }
          }}
        >
          {getAvailableTabs().map((tab) => (
            <Tab
              key={tab.index}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', minWidth: '80px' }}>
                  {tab.icon}
                  <span>{tab.label}</span>
                </Box>
              }
            />
          ))}
        </Tabs>

        {/* Календарь под вкладками */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          px: 2,
          py: 1,
          backgroundColor: 'transparent',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton size="small" sx={{ color: 'white' }} onClick={() => {
              const newDate = new Date(calendarDate);
              if (calendarView === 'quarter') {
                newDate.setMonth(newDate.getMonth() - 3);
              } else if (calendarView === 'halfyear') {
                newDate.setMonth(newDate.getMonth() - 6);
              } else if (calendarView === 'year') {
                newDate.setFullYear(newDate.getFullYear() - 1);
              } else {
                newDate.setMonth(newDate.getMonth() - 1);
              }
              setCalendarDate(newDate);
            }}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="body1" sx={{ minWidth: '200px', textAlign: 'center', color: 'white' }}>
              {calendarView === 'month' && calendarDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
              {calendarView === 'quarter' && (() => {
                const quarter = Math.floor(calendarDate.getMonth() / 3) + 1;
                return `${quarter} квартал ${calendarDate.getFullYear()}`;
              })()}
              {calendarView === 'halfyear' && (() => {
                const halfyear = Math.floor(calendarDate.getMonth() / 6) + 1;
                return `${halfyear} полугодие ${calendarDate.getFullYear()}`;
              })()}
              {calendarView === 'year' && calendarDate.getFullYear()}
            </Typography>
            <IconButton size="small" onClick={() => {
              const newDate = new Date(calendarDate);
              if (calendarView === 'quarter') {
                newDate.setMonth(newDate.getMonth() + 3);
              } else if (calendarView === 'halfyear') {
                newDate.setMonth(newDate.getMonth() + 6);
              } else if (calendarView === 'year') {
                newDate.setFullYear(newDate.getFullYear() + 1);
              } else {
                newDate.setMonth(newDate.getMonth() + 1);
              }
              setCalendarDate(newDate);
            }}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
          <ToggleButtonGroup
            value={calendarView}
            exclusive
            onChange={(_, value) => value && setCalendarView(value)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)'
                  }
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }
            }}
          >
            <ToggleButton value="month">
              <CalendarMonthIcon fontSize="small" sx={{ mr: 0.5 }} />
              Месяц
            </ToggleButton>
            <ToggleButton value="quarter">
              <ViewAgendaIcon fontSize="small" sx={{ mr: 0.5 }} />
              Квартал
            </ToggleButton>
            <ToggleButton value="halfyear">
              <CalendarTodayIcon fontSize="small" sx={{ mr: 0.5 }} />
              Полугодие
            </ToggleButton>
            <ToggleButton value="year">
              <EventIcon fontSize="small" sx={{ mr: 0.5 }} />
              Год
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Полоска с днями */}
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e0e0e0'
        }}>
          {(() => {
            const days: Date[] = [];
            if (calendarView === 'month') {
              // Добавляем дни предыдущего месяца
              const currentMonth = calendarDate.getMonth();
              const currentYear = calendarDate.getFullYear();
              const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
              const lastDayOfPrevMonth = new Date(currentYear, currentMonth, 0);
              const daysFromPrevMonth = firstDayOfMonth.getDay() || 7; // Количество дней для заполнения недели
              for (let i = daysFromPrevMonth - 1; i >= 1; i--) {
                const day = new Date(lastDayOfPrevMonth);
                day.setDate(lastDayOfPrevMonth.getDate() - i + 1);
                days.push(day);
              }
              // Добавляем дни текущего месяца
              const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
              const lastDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
              const daysInMonth = lastDay.getDate();
              for (let i = 0; i < daysInMonth; i++) {
                const day = new Date(firstDay);
                day.setDate(firstDay.getDate() + i);
                days.push(day);
              }
              // Добавляем дни следующего месяца для заполнения недели
              const lastDayOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
              const lastDayOfWeek = lastDayOfMonth.getDay();
              const daysFromNextMonth = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
              if (daysFromNextMonth > 0) {
                for (let i = 1; i <= daysFromNextMonth; i++) {
                  const day = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, i);
                  days.push(day);
                }
              }
            } else if (calendarView === 'quarter') {
              const quarter = Math.floor(calendarDate.getMonth() / 3);
              const startMonth = quarter * 3;
              for (let month = startMonth; month < startMonth + 3; month++) {
                const firstDay = new Date(calendarDate.getFullYear(), month, 1);
                const lastDay = new Date(calendarDate.getFullYear(), month + 1, 0);
                const daysInMonth = lastDay.getDate();
                for (let i = 0; i < daysInMonth; i++) {
                  const day = new Date(firstDay);
                  day.setDate(firstDay.getDate() + i);
                  days.push(day);
                }
              }
            } else if (calendarView === 'halfyear') {
              const halfyear = Math.floor(calendarDate.getMonth() / 6);
              const startMonth = halfyear * 6;
              for (let month = startMonth; month < startMonth + 6; month++) {
                const firstDay = new Date(calendarDate.getFullYear(), month, 1);
                const lastDay = new Date(calendarDate.getFullYear(), month + 1, 0);
                const daysInMonth = lastDay.getDate();
                for (let i = 0; i < daysInMonth; i++) {
                  const day = new Date(firstDay);
                  day.setDate(firstDay.getDate() + i);
                  days.push(day);
                }
              }
            } else {
              // Год
              for (let month = 0; month < 12; month++) {
                const firstDay = new Date(calendarDate.getFullYear(), month, 1);
                const lastDay = new Date(calendarDate.getFullYear(), month + 1, 0);
                const daysInMonth = lastDay.getDate();
                for (let i = 0; i < daysInMonth; i++) {
                  const day = new Date(firstDay);
                  day.setDate(firstDay.getDate() + i);
                  days.push(day);
                }
              }
            }
            // Создаем массив месяцев для группировки
            const monthGroups: Array<{ month: string, startIndex: number, count: number }> = [];
            let currentMonth = '';
            let currentStart = 0;
            
            days.forEach((day, index) => {
              const monthKey = day.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
              if (monthKey !== currentMonth) {
                if (currentMonth) {
                  monthGroups.push({ month: currentMonth, startIndex: currentStart, count: index - currentStart });
                }
                currentMonth = monthKey;
                currentStart = index;
              }
            });
            if (currentMonth) {
              monthGroups.push({ month: currentMonth, startIndex: currentStart, count: days.length - currentStart });
            }
            
            return (
              <>
                {/* Строка с месяцами */}
                <Box sx={{ display: 'flex', width: '100%' }}>
                  {monthGroups.map((group, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        width: `${group.count * 40}px`,
                        borderRight: idx < monthGroups.length - 1 ? '1px solid #e0e0e0' : 'none',
                        py: 0.5,
                        textAlign: 'center',
                        backgroundColor: '#f5f5f5'
                      }}
                    >
                      <Typography variant="caption" sx={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>
                        {group.month}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                {/* Строка с днями */}
                <Box sx={{ display: 'flex', width: '100%' }}>
                  {days.map((day, index) => {
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                      <Box
                        key={index}
                        onClick={() => setCalendarDate(day)}
                        sx={{
                          width: '40px',
                          minHeight: '40px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          backgroundColor: 'transparent',
                          borderRight: index < days.length - 1 ? '1px solid #e0e0e0' : 'none'
                        }}
                      >
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontSize: '0.65rem', 
                            color: '#666',
                            textTransform: 'uppercase',
                            fontWeight: 500
                          }}
                        >
                          {day.toLocaleDateString('ru-RU', { weekday: 'short' })}
                        </Typography>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontSize: '14px', 
                            color: '#000',
                            fontWeight: isToday ? 700 : 400
                          }}
                        >
                          {day.getDate()}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </>
            );
          })()}
        </Box>

        {/* Основной контент */}
        {renderTabContent()
        }

        {/* Контекстное меню страницы */}
        <Menu
          open={pageContextMenu !== null}
          onClose={(_event, _reason) => {
            handleClosePageContextMenu();
          }}
          anchorReference="anchorPosition"
          anchorPosition={
            pageContextMenu !== null
              ? { top: pageContextMenu.mouseY, left: pageContextMenu.mouseX }
              : undefined
          }
          onClick={(e) => e.stopPropagation()}
          disableAutoFocusItem
          disableEnforceFocus
          disableRestoreFocus
          // Убираем aria-hidden с контейнера меню для соответствия стандартам ARIA
          slotProps={{
            root: {
              'aria-hidden': false,
              onContextMenu: (e: React.MouseEvent) => e.preventDefault()
            },
            paper: {
              'aria-hidden': false,
              onContextMenu: (e: React.MouseEvent) => e.preventDefault()
            }
          }}
          MenuListProps={{
            'aria-labelledby': 'context-menu-page',
            role: 'menu'
          }}
        >
          <MenuItem onClick={() => handlePageContextMenuAction('create')}>
            Создать
          </MenuItem>
          <MenuItem onClick={() => handlePageContextMenuAction('paste')}>
            Вставить
          </MenuItem>
          <MenuItem onClick={() => handlePageContextMenuAction('refresh')}>
            Обновить
          </MenuItem>
        </Menu>

      </Box>
    );
  }

  // Если пользователь не авторизован, показываем форму входа
  return (
    <Box sx={{
      display: 'flex',              // Flexbox для центрирования
      justifyContent: 'center',     // Центрирование по горизонтали
      alignItems: 'center',         // Центрирование по вертикали
      minHeight: '100vh',          // Минимальная высота на весь экран
      width: '100%',               // Полная ширина
      position: 'fixed',           // Фиксированное позиционирование
      top: 0,                      // Отступ сверху
      left: 0,                     // Отступ слева
      right: 0,                    // Отступ справа
      bottom: 0                    // Отступ снизу
    }}>
      {/* Верхняя панель навигации */}
      <AppBar position="static" className="header" sx={{ height: '56px', width: '100%', mx: 'auto', justifyContent: 'center', borderBottom: 'none' }}>
        <Toolbar sx={{
          height: '56px',
          minHeight: '0 !important',
          '&.MuiToolbar-root': {
            minHeight: '0 !important'
          }
        }}>
          {/* Логотип */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <img
              src="/logo.png"
              alt="Логотип"
              style={{
                height: '50px',
                width: '78px'
              }}
            />
          </Box>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Система управления проектами
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ width: '100%', mx: 'auto', mt: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" align="center">
            Вход в систему
          </Typography>

          <Box component="form" onSubmit={handleLogin} sx={{ mt: 3 }}>
            {/* Поле для ввода email */}
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              inputProps={{
                autoComplete: "username"
              }}
            />

            {/* Поле для ввода пароля */}
            <TextField
              fullWidth
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              inputProps={{
                autoComplete: "current-password"
              }}
            />

            {/* Отображение ошибки авторизации */}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {/* Кнопка входа */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
              <VolumeButton
                type="submit"
                disabled={loading}
                color="blue"
              >
                {loading ? 'Вход...' : 'Войти'}
              </VolumeButton>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}