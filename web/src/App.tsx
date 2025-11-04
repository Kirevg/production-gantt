// Импорт React хуков для управления состоянием компонентов
// Production Gantt - Система управления проектами
import React, { useState, useEffect, useCallback, useRef } from 'react';


// Импорт единого стиля для кнопок
import './styles/buttons.css';

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
  IconButton,   // Кнопка с иконкой
  Menu,         // Контекстное меню
  MenuItem,     // Элемент контекстного меню
  ToggleButtonGroup, // Группа переключателей
  ToggleButton, // Переключатель
  Tooltip,      // Подсказка при наведении
  CircularProgress, // Индикатор загрузки
  Table,        // Таблица
  TableBody,    // Тело таблицы
  TableCell,    // Ячейка таблицы
  TableContainer, // Контейнер для таблицы
  TableHead,    // Заголовок таблицы
  TableRow,     // Строка таблицы
  Chip,         // Чип для отображения меток
  Accordion,    // Аккордеон для сворачиваемых разделов
  AccordionSummary, // Заголовок аккордеона
  AccordionDetails,  // Содержимое аккордеона
  Checkbox      // Чекбокс для выбора опций
} from '@mui/material';

// Импорт иконок из Material-UI
import {
  Home as HomeIcon,
  Assignment as ProjectIcon,
  Folder as FolderIcon,
  AdminPanelSettings as AdminIcon,
  Timeline as GanttIcon,
  CalendarMonth as CalendarMonthIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ViewAgenda as ViewAgendaIcon,
  CalendarToday as CalendarTodayIcon,
  Event as EventIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Update as UpdateIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon // Иконка для сворачивания/разворачивания
} from '@mui/icons-material';


// Импорт компонентов
import KanbanBoard from './components/KanbanBoard';
import ReferencesPage from './components/ReferencesPage';
import VolumeButton from './components/VolumeButton';
import UsersList from './components/UsersList';
import ProjectsList from './components/ProjectsList';
import type { User, Project } from './types/common';

// Интерфейс для ответа сервера при авторизации
interface LoginResponse {
  accessToken: string; // JWT токен для аутентификации
  user: User;          // Данные пользователя
}

// Функция для определения праздничного дня
const isHoliday = (date: Date): boolean => {
  const month = date.getMonth();
  const day = date.getDate();

  // Новый год и рождественские праздники (1-8 января)
  if (month === 0) {
    if (day >= 1 && day <= 8) return true;
  }

  // 23 февраля - День защитника Отечества
  if (month === 1 && day === 23) return true;

  // 8 марта - Международный женский день
  if (month === 2 && day === 8) return true;

  // 1 мая - Праздник Весны и Труда
  if (month === 4 && day === 1) return true;

  // 9 мая - День Победы
  if (month === 4 && day === 9) return true;

  // 12 июня - День России
  if (month === 5 && day === 12) return true;

  // 4 ноября - День народного единства
  if (month === 10 && day === 4) return true;

  return false;
};

// Интерфейс для чипа изделия в календаре
interface ProductChip {
  id: string;                  // ID изделия проекта (ProjectProduct)
  projectId: string;           // ID проекта
  projectName: string;         // Название проекта
  projectStatus?: string;      // Статус проекта
  productStatus?: string;      // Статус изделия
  productName: string;         // Название изделия
  startDate: string;           // Дата начала (самая ранняя из этапов работ)
  endDate: string;             // Дата окончания (самая поздняя из этапов работ)
  workStages?: Array<{         // Этапы работ изделия
    id: string;
    startDate: string | null;
    endDate: string | null;
    nomenclatureItem?: { name: string } | null;
    assignee?: { id: string; name: string } | null;
    duration?: number | null;
  }>;
}

// Главный компонент приложения
export default function App() {
  // Состояние для формы входа
  const [email, setEmail] = useState('');        // Email пользователя
  const [password, setPassword] = useState('');  // Пароль пользователя
  const [loading, setLoading] = useState(false); // Индикатор загрузки
  const [error, setError] = useState('');        // Ошибка авторизации
  const [user, setUser] = useState<User | null>(null); // Данные авторизованного пользователя
  // Инициализируем текущую вкладку из localStorage или используем значение по умолчанию (0)
  const [currentTab, setCurrentTab] = useState(() => {
    const savedTab = localStorage.getItem('currentTab');
    return savedTab ? parseInt(savedTab, 10) : 0;
  });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Проверка токена при загрузке

  // Состояние для календаря
  const [calendarView, setCalendarView] = useState<'month' | 'quarter' | 'halfyear' | 'year'>('month'); // Вид календаря
  const [calendarDate, setCalendarDate] = useState<Date>(new Date()); // Текущая дата календаря
  const [_calendarProjects, setCalendarProjects] = useState<Project[]>([]); // Проекты для отображения в календаре (оставлено для обратной совместимости)
  const [calendarProducts, setCalendarProducts] = useState<ProductChip[]>([]); // Изделия для отображения в календаре
  const [holidays, setHolidays] = useState<Map<string, boolean>>(new Map()); // Праздничные дни из производственного календаря РФ
  const [_shortDays, setShortDays] = useState<Map<string, boolean>>(new Map()); // Сокращенные дни из производственного календаря РФ

  // Состояние для показа/скрытия состава проекта (используется только через setter)
  const [_showProjectComposition, setShowProjectComposition] = useState(false);
  // Состояние для хранения проекта, состав которого просматривается (используется только через setter)
  const [_selectedProject, setSelectedProject] = useState<Project | null>(null);
  // Состояние для показа/скрытия страницы этапов работ (используется только через setter)
  const [_showStagesPage, setShowStagesPage] = useState(false);
  // Состояние для хранения ID изделия, этапы которого просматриваются (используется только через setter)
  const [_selectedProductId, setSelectedProductId] = useState<string | null>(null);
  // Состояние для показа/скрытия списка спецификаций (используется только через setter)
  const [_showSpecificationsList, setShowSpecificationsList] = useState(false);
  // Состояние для переключения между старой и новой страницей спецификаций (используется только через setter)
  const [_showOldSpecificationsList, setShowOldSpecificationsList] = useState(false);
  // Состояние для показа/скрытия детальной спецификации (используется только через setter)
  const [_showSpecificationDetail, setShowSpecificationDetail] = useState(false);
  // Состояние для хранения информации об изделии для спецификаций (используется только через setter)
  const [_selectedProductName, setSelectedProductName] = useState<string | null>(null);
  // Состояние для хранения ID и названия спецификации (используется только через setter)
  const [_selectedSpecificationId, setSelectedSpecificationId] = useState<string | null>(null);
  const [_selectedSpecificationName, setSelectedSpecificationName] = useState<string | null>(null);

  // Состояние для контекстного меню страницы
  const [pageContextMenu, setPageContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  // Состояние для управления правами доступа ролей "Менеджер" и "Пользователь"
  const [rolePermissions, setRolePermissions] = useState<Record<string, { manager: boolean; user: boolean }>>({
    'main-page': { manager: true, user: true }, // Главная страница (Календарь)
    'kanban': { manager: true, user: true }, // Канбан-доска
    'projects-view': { manager: true, user: true }, // Проекты (просмотр)
    'projects-edit': { manager: true, user: false }, // Проекты: Создание / Редактирование
    'projects-delete': { manager: false, user: false }, // Проекты: Удаление
    'references-edit': { manager: true, user: false }, // Справочники: Создание / Редактирование
    'references-delete': { manager: false, user: false }, // Справочники: Удаление
    'nomenclature-view': { manager: true, user: true }, // Справочник Номенклатура
    'counterparties-view': { manager: true, user: true }, // Справочник Контрагенты
    'persons-view': { manager: true, user: true }, // Справочник Физические лица
    'units-view': { manager: true, user: true }, // Справочник Единицы измерения
    'nomenclature-types-view': { manager: true, user: true }, // Справочник Виды номенклатуры
    'products-view': { manager: true, user: true }, // Изделия в проектах
    'products-edit': { manager: true, user: false }, // Изделия: Создание / Редактирование
    'products-delete': { manager: true, user: false }, // Изделия: Удаление
    'stages-view': { manager: true, user: true }, // Этапы работ
    'stages-edit': { manager: true, user: false }, // Этапы: Создание / Редактирование
    'stages-delete': { manager: false, user: false }, // Этапы: Удаление
    'specifications-view': { manager: true, user: true }, // Спецификации (просмотр)
    'specifications-edit': { manager: true, user: false }, // Спецификации: Создание / Редактирование
    'specifications-delete': { manager: false, user: false } // Спецификации: Удаление
  });

  // Функция для изменения прав доступа
  const handlePermissionChange = (permissionKey: string, role: 'manager' | 'user') => {
    setRolePermissions(prev => ({
      ...prev,
      [permissionKey]: {
        ...prev[permissionKey],
        [role]: !prev[permissionKey][role]
      }
    }));
  };

  // Функция для изменения объединенных прав доступа (Создание/Редактирование/Удаление)
  const handleCombinedPermissionChange = (editKey: string, deleteKey: string, role: 'manager' | 'user') => {
    setRolePermissions(prev => {
      // Определяем новое значение: если оба разрешены, то запрещаем оба, иначе разрешаем оба
      const currentEdit = prev[editKey]?.[role] ?? false;
      const currentDelete = prev[deleteKey]?.[role] ?? false;
      const newValue = currentEdit && currentDelete ? false : true;

      return {
        ...prev,
        [editKey]: {
          ...prev[editKey],
          [role]: newValue
        },
        [deleteKey]: {
          ...prev[deleteKey],
          [role]: newValue
        }
      };
    });
  };

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

  // Флаг, помогающий не закрывать меню сразу после открытия в том же тике
  const pageMenuOpeningRef = useRef(false);

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
      case 4: // Админ панель - только для администраторов
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

  // Функция для создания резервной копии базы данных
  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Токен авторизации не найден. Пожалуйста, войдите в систему заново.');
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/backup/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Получаем JSON данные и создаем blob для скачивания
        const backupData = await response.json();
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Ошибка создания резервной копии`);
      }
    } catch (error) {
      // console.error('Ошибка создания резервной копии:', error);
      alert(`Ошибка создания резервной копии: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  // Функция для восстановления из резервной копии
  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);

      // Читаем файл
      const text = await file.text();
      const backupData = JSON.parse(text);

      // Отправляем данные на сервер (API ожидает { data: ... })
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/backup/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: backupData.data }),
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
      // console.error('Ошибка восстановления:', error);
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/migrations/deploy`, {
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
      // console.error('Ошибка применения миграций:', error);
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/migrations/reset`, {
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
      // console.error('Ошибка сброса миграций:', error);
      alert(`Ошибка сброса миграций: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  // Функция для проверки статуса миграций
  const handleCheckMigrationStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/migrations/status`, {
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
      // console.error('Ошибка проверки статуса миграций:', error);
      alert(`Ошибка проверки статуса: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  // Функция для загрузки проектов для календаря
  const fetchCalendarProjects = useCallback(async () => {
    if (!user) {
      setCalendarProjects([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Фильтруем проекты, у которых есть даты начала и окончания
        const projectsWithDates = data.filter((project: Project) =>
          project.startDate && project.endDate
        );
        setCalendarProjects(projectsWithDates);
      }
    } catch (error) {
      // console.error('Ошибка загрузки проектов для календаря:', error);
      setCalendarProjects([]);
    }
  }, [user]);

  // Функция для загрузки изделий с этапами работ для календаря
  const fetchCalendarProducts = useCallback(async () => {
    if (!user) {
      setCalendarProducts([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Получаем все проекты
      const projectsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!projectsResponse.ok) return;

      const projects = await projectsResponse.json();

      // Для каждого проекта получаем изделия с этапами работ
      const productsChips: ProductChip[] = [];

      for (const project of projects) {
        try {
          const productsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/${project.id}/products`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (productsResponse.ok) {
            const products = await productsResponse.json();

            for (const product of products) {
              // Проверяем, есть ли этапы работ
              if (product.workStages && product.workStages.length > 0) {
                // Находим самую раннюю дату начала из этапов работ
                const startDates = product.workStages
                  .filter((stage: any) => stage.startDate)
                  .map((stage: any) => new Date(stage.startDate).getTime());

                // Находим самую позднюю дату окончания из этапов работ
                const endDates = product.workStages
                  .filter((stage: any) => stage.endDate)
                  .map((stage: any) => new Date(stage.endDate).getTime());

                if (startDates.length > 0 && endDates.length > 0) {
                  const earliestStart = new Date(Math.min(...startDates));
                  const latestEnd = new Date(Math.max(...endDates));

                  productsChips.push({
                    id: product.id,
                    projectId: project.id,
                    projectName: project.name,
                    projectStatus: project.status || 'InProject',
                    productStatus: product.status || 'InProject',
                    productName: product.product?.name || 'Не указано',
                    startDate: earliestStart.toISOString(),
                    endDate: latestEnd.toISOString(),
                    workStages: product.workStages.map((stage: any) => ({
                      id: stage.id,
                      startDate: stage.startDate,
                      endDate: stage.endDate,
                      nomenclatureItem: stage.nomenclatureItem ? { name: stage.nomenclatureItem.name } : null,
                      assignee: stage.assignee ? { id: stage.assignee.id, name: stage.assignee.name } : null,
                      duration: stage.duration || null
                    }))
                  });
                }
              }
            }
          }
        } catch (error) {
          // console.error(`Ошибка загрузки изделий для проекта ${project.id}:`, error);
        }
      }

      setCalendarProducts(productsChips);
    } catch (error) {
      // console.error('Ошибка загрузки изделий для календаря:', error);
      setCalendarProducts([]);
    }
  }, [user]);

  // Функция для загрузки производственного календаря РФ
  const fetchHolidaysCalendar = useCallback(async () => {
    try {
      const year = calendarDate.getFullYear();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/calendar/${year}/holidays`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // console.error('Ошибка загрузки календаря:', response.status);
        return;
      }

      const data = await response.json();
      const holidaysMap = new Map<string, boolean>();
      const shortDaysMap = new Map<string, boolean>();

      // Преобразуем данные в Map с ключом в формате YYYY-MM-DD
      // holidays - праздничные дни (выходные)
      if (data.holidays && Array.isArray(data.holidays)) {
        data.holidays.forEach((day: any) => {
          const dateStr = day.date ? day.date.split('T')[0] : day.date; // Формат: YYYY-MM-DD
          holidaysMap.set(dateStr, true);
        });
      }

      // shortDays - сокращенные дни (рабочие, но на 1 час короче)
      if (data.shortDays && Array.isArray(data.shortDays)) {
        data.shortDays.forEach((day: any) => {
          const dateStr = day.date ? day.date.split('T')[0] : day.date; // Формат: YYYY-MM-DD
          shortDaysMap.set(dateStr, true);
        });
      }

      setHolidays(holidaysMap);
      setShortDays(shortDaysMap);
    } catch (error) {
      // console.error('Ошибка загрузки производственного календаря:', error);
    }
  }, [calendarDate]);

  useEffect(() => {
    if (user) {
      fetchCalendarProjects();
      fetchCalendarProducts();
    }
  }, [user, fetchCalendarProjects, fetchCalendarProducts]);

  // Загружаем производственный календарь отдельно от других данных
  useEffect(() => {
    if (user) {
      fetchHolidaysCalendar();
    }
  }, [user, calendarDate.getFullYear(), fetchHolidaysCalendar]);

  // Обновляем данные календаря при переключении на вкладку Главная
  useEffect(() => {
    if (user && currentTab === 0) {
      fetchCalendarProducts();
    }
  }, [user, currentTab, fetchCalendarProducts]);

  // Обработчик формы входа
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

        // Вкладка восстанавливается автоматически из localStorage при монтировании компонента
        // Эффект проверки доступа обработает случай, если у пользователя нет доступа к сохраненной вкладке
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
    localStorage.setItem('currentTab', '0'); // Сохраняем сброс вкладки
  };

  // Обработчик смены вкладки
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    // Проверяем доступ к вкладке перед переключением
    if (canAccessTab(newValue)) {
      // Закрываем все детальные страницы при переходе на другую вкладку
      setShowSpecificationDetail(false);
      setShowProjectComposition(false);
      setShowStagesPage(false);
      setShowSpecificationsList(false);
      setSelectedProject(null);
      setSelectedProductId(null);
      setSelectedSpecificationId(null);
      setSelectedSpecificationName(null);
      setCurrentTab(newValue);
      // Сохраняем выбранную вкладку в localStorage
      localStorage.setItem('currentTab', newValue.toString());
    }
  };

  // Обработчики контекстного меню страницы
  const handleClosePageContextMenu = () => {
    setPageContextMenu(null);
  };

  const handlePageContextMenuAction = (action: string) => {
    handleClosePageContextMenu();
    switch (action) {
      case 'create': {
        // Главная страница очищена — создание карточек выключено
        // console.log('Создать');
        break;
      }
      case 'paste':
        // Здесь можно добавить логику вставки
        // console.log('Вставить');
        break;
      case 'refresh':
        // Здесь можно добавить логику обновления
        // console.log('Обновить');
        break;
    }
  };

  // Функция для открытия состава проекта
  const handleOpenProjectComposition = (project: Project) => {
    setSelectedProject(project);
    setShowProjectComposition(true);
  };

  // Функция для открытия карточки создания проекта
  const handleOpenCreateProject = () => {
    // Функция используется в ProjectsList компоненте
  };

  // Функция для открытия страницы этапов из канбана
  const handleOpenStageFromKanban = (_productId: string) => {
    // Функция используется в KanbanBoard компоненте
  };

  // Эффект для проверки доступа к текущей вкладке при изменении пользователя
  useEffect(() => {
    // Не выполняем проверку, пока идет проверка токена
    if (isCheckingAuth) {
      return;
    }

    if (user) {
      // Если пользователь авторизован, проверяем доступ к текущей вкладке
      if (!canAccessTab(currentTab)) {
        // Если нет доступа к текущей вкладке, переключаем на главную
        setCurrentTab(0);
        localStorage.setItem('currentTab', '0');
      } else {
        // Если доступ есть, сохраняем текущую вкладку в localStorage
        localStorage.setItem('currentTab', currentTab.toString());
      }
    } else {
      // Если пользователь вышел (и проверка токена завершена), сбрасываем вкладку на главную
      setCurrentTab(0);
      localStorage.setItem('currentTab', '0');
    }
  }, [user, currentTab, canAccessTab, isCheckingAuth]);

  // Эффект для загрузки данных пользователя при монтировании компонента
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Если есть токен, загружаем данные пользователя
      fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(response => {
          if (response.ok) {
            return response.json();
          } else {
            localStorage.removeItem('token');
            throw new Error('Token invalid');
          }
        })
        .then((data: User) => {
          setUser(data);
        })
        .catch(() => {
          setUser(null);
        })
        .finally(() => {
          // Завершаем проверку аутентификации
          setIsCheckingAuth(false);
        });
    } else {
      // Если токена нет, сразу завершаем проверку
      setIsCheckingAuth(false);
    }
  }, []);

  // Пока проверяется токен, показываем индикатор загрузки
  if (isCheckingAuth) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100%'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  // Если пользователь не авторизован, показываем форму входа
  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Вход в систему
          </Typography>
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="username"
            />
            <TextField
              fullWidth
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        </Paper>
      </Container>
    );
  }

  // Функция для получения доступных вкладок
  const getAvailableTabs = () => {
    const tabs = [
      { index: 0, label: 'Главная', icon: <HomeIcon /> },
      { index: 1, label: 'Канбан', icon: <GanttIcon /> },
      { index: 2, label: 'Проекты', icon: <ProjectIcon /> },
      { index: 3, label: 'Справочники', icon: <FolderIcon /> },
      { index: 4, label: 'Админ', icon: <AdminIcon /> },
    ];

    return tabs.filter(tab => canAccessTab(tab.index));
  };

  // Функция для рендеринга контента вкладок
  const renderTabContent = () => {
    switch (currentTab) {
      case 0: // Главная страница с календарем
        return (
          <>
            {/* Календарь под вкладками */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 2,
              py: 1,
              backgroundColor: 'transparent',
              borderBottom: 0
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton
                  size="small"
                  sx={{
                    color: 'white',
                    border: 'none',
                    '&:hover': {
                      backgroundColor: 'transparent'
                    }
                  }}
                  onClick={() => {
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
                  }}
                >
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
                <IconButton
                  size="small"
                  sx={{
                    color: 'white',
                    border: 'none',
                    '&:hover': {
                      backgroundColor: 'transparent'
                    }
                  }}
                  onClick={() => {
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
                  }}
                >
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
            <Box
              onWheel={(e) => {
                const container = e.currentTarget;
                container.scrollLeft += e.deltaY;
              }}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#0E1720',
                borderBottom: 0,
                overflowX: 'auto',
                width: 'calc(100% - 60px)',
                marginLeft: '30px',
                marginRight: '30px',
                borderRadius: '4px',
                // Стили горизонтального скроллбара
                '&::-webkit-scrollbar': {
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#0E1720',
                  borderRadius: '4px',
                  border: '1px solid #4B4F50'
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#4B4F50',
                  borderRadius: '4px',
                  border: '1px solid #4B4F50',
                  '&:hover': {
                    backgroundColor: '#5a5f60'
                  }
                }
              }}>
              {(() => {
                const days: Date[] = [];
                if (calendarView === 'month') {
                  // Добавляем полный предыдущий месяц
                  const prevMonth = calendarDate.getMonth() === 0 ? 11 : calendarDate.getMonth() - 1;
                  const prevYear = calendarDate.getMonth() === 0 ? calendarDate.getFullYear() - 1 : calendarDate.getFullYear();
                  const firstDayOfPrevMonth = new Date(prevYear, prevMonth, 1);
                  const lastDayOfPrevMonth = new Date(prevYear, prevMonth + 1, 0);
                  const daysInPrevMonth = lastDayOfPrevMonth.getDate();
                  for (let i = 0; i < daysInPrevMonth; i++) {
                    const day = new Date(firstDayOfPrevMonth);
                    day.setDate(firstDayOfPrevMonth.getDate() + i);
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
                  // Добавляем полный следующий месяц
                  const nextMonth = calendarDate.getMonth() === 11 ? 0 : calendarDate.getMonth() + 1;
                  const nextYear = calendarDate.getMonth() === 11 ? calendarDate.getFullYear() + 1 : calendarDate.getFullYear();
                  const firstDayOfNextMonth = new Date(nextYear, nextMonth, 1);
                  const lastDayOfNextMonth = new Date(nextYear, nextMonth + 1, 0);
                  const daysInNextMonth = lastDayOfNextMonth.getDate();
                  for (let i = 0; i < daysInNextMonth; i++) {
                    const day = new Date(firstDayOfNextMonth);
                    day.setDate(firstDayOfNextMonth.getDate() + i);
                    days.push(day);
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
                // Создаем массив групп месяцев для строки с месяцами
                const monthGroups: Array<{ month: string, startIndex: number, count: number }> = [];
                let currentMonth = '';
                let currentStart = 0;

                days.forEach((day, index) => {
                  // Формируем формат "НОЯБРЬ 2025" вместо "нояб. 2025 г."
                  const monthName = day.toLocaleDateString('ru-RU', { month: 'long' }).toUpperCase();
                  const year = day.getFullYear();
                  const monthKey = `${monthName} ${year}`;
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

                // НОВАЯ ЛОГИКА: Основными чипами для расположения являются этапы работ
                // Сначала вычисляем позиции этапов работ, затем натягиваем чипы изделий на крайние даты этапов

                interface StageChip {
                  id: string;
                  productId: string;
                  product: ProductChip;
                  startDate: string | null;
                  endDate: string | null;
                  nomenclatureItem?: { name: string } | null;
                  assignee?: { id: string; name: string } | null;
                  duration?: number | null;
                  position: {
                    left: number;
                    width: number;
                    startIndex: number;
                    daysCount: number;
                    isCutLeft: boolean;
                    isCutRight: boolean;
                  } | null;
                }

                // Функция вычисления позиции этапа работ
                const getStagePosition = (stage: { startDate: string | null; endDate: string | null }) => {
                  if (!stage.startDate || !stage.endDate) return null;

                  const startDate = new Date(stage.startDate);
                  const endDate = new Date(stage.endDate);

                  // Нормализуем даты (убираем время)
                  startDate.setHours(0, 0, 0, 0);
                  endDate.setHours(0, 0, 0, 0);

                  // Получаем границы периода
                  const periodStart = new Date(days[0]);
                  periodStart.setHours(0, 0, 0, 0);
                  const periodEnd = new Date(days[days.length - 1]);
                  periodEnd.setHours(0, 0, 0, 0);

                  // Проверяем, есть ли пересечение этапа с периодом
                  if (endDate < periodStart || startDate > periodEnd) {
                    return null;
                  }

                  // Определяем, нужно ли обрезать слева
                  const isCutLeft = startDate < periodStart;

                  // Определяем, нужно ли обрезать справа
                  const isCutRight = endDate > periodEnd;

                  // Находим индекс дня начала (обрезаем слева, если нужно)
                  let startIndex = 0;
                  if (!isCutLeft) {
                    const foundIndex = days.findIndex(day => {
                      const dayDate = new Date(day);
                      dayDate.setHours(0, 0, 0, 0);
                      return dayDate.getTime() === startDate.getTime();
                    });
                    if (foundIndex !== -1) {
                      startIndex = foundIndex;
                    } else {
                      startIndex = 0;
                    }
                  }

                  // Находим индекс дня окончания (обрезаем справа, если нужно)
                  let endIndex = days.length - 1;
                  if (!isCutRight) {
                    const foundIndex = days.findIndex(day => {
                      const dayDate = new Date(day);
                      dayDate.setHours(0, 0, 0, 0);
                      return dayDate.getTime() === endDate.getTime();
                    });
                    if (foundIndex !== -1) {
                      endIndex = foundIndex;
                    } else {
                      endIndex = days.length - 1;
                    }
                  }

                  // Вычисляем количество дней между началом и концом этапа в отображаемом периоде
                  const daysDiff = endIndex - startIndex + 1;

                  // Ячейки календаря имеют ширину 39px включая бордюр справа (1px) с box-sizing: border-box
                  // Чипы этапов имеют бордюр 1px с каждой стороны с box-sizing: border-box
                  // Чип этапа должен помещаться внутри ячейки вместе со своими бордюрами
                  // Между соседними чипами всегда будет бордюр ячейки (1px)
                  const cellWidth = 39; // Ширина ячейки включая бордюр справа
                  const cellBorderWidth = 1; // Толщина бордюра ячейки справа

                  // Позиция чипа этапа: левая граница первой ячейки
                  // Чип этапа начинается с позиции левой границы ячейки (без смещения, бордюры внутри ячейки)
                  const left = startIndex * cellWidth;

                  // Ширина чипа этапа: суммарная ширина всех ячеек минус бордюр последней ячейки справа
                  // Чип занимает всю ширину ячеек кроме последнего бордюра справа, его бордюры учитываются внутри через box-sizing: border-box
                  // Между соседними чипами (в разных ячейках) будет бордюр ячейки (1px)
                  const width = daysDiff * cellWidth - cellBorderWidth;

                  return {
                    left, // Позиция слева - левая граница первой ячейки
                    width, // Ширина чипа = суммарная ширина всех ячеек минус бордюр последней ячейки справа (чип помещается внутри с бордюрами)
                    startIndex,
                    daysCount: daysDiff,
                    isCutLeft,
                    isCutRight
                  };
                };

                // Собираем все этапы работ со всех изделий
                const allStages: StageChip[] = [];
                calendarProducts.forEach(product => {
                  if (product.workStages && product.workStages.length > 0) {
                    product.workStages.forEach(stage => {
                      const position = getStagePosition(stage);
                      if (position) {
                        allStages.push({
                          id: stage.id,
                          productId: product.id,
                          product,
                          startDate: stage.startDate,
                          endDate: stage.endDate,
                          nomenclatureItem: stage.nomenclatureItem,
                          assignee: stage.assignee || null,
                          duration: stage.duration || null,
                          position
                        });
                      }
                    });
                  }
                });

                // Распределяем этапы работ по строкам (основная логика)
                const rows: Array<Array<StageChip>> = [];

                allStages.forEach(stage => {
                  if (!stage.position) return;

                  // Ищем строку, где этап помещается
                  let placed = false;
                  for (let i = 0; i < rows.length; i++) {
                    // Проверяем, что в строке все этапы с таким же названием проекта
                    const sameProjectName = rows[i].every(otherStage =>
                      otherStage.product.projectName === stage.product.projectName
                    );

                    if (!sameProjectName) {
                      continue;
                    }

                    // Проверяем, есть ли в строке уже этап другого изделия
                    // Каждое изделие должно быть в своей строке
                    const hasDifferentProduct = rows[i].some(otherStage =>
                      otherStage.productId !== stage.productId
                    );

                    // Если в строке уже есть этап другого изделия - пропускаем эту строку
                    if (hasDifferentProduct) {
                      continue;
                    }

                    // Проверяем, не пересекается ли с другими этапами в строке
                    // Этапы одного изделия (productId) могут перекрываться друг с другом
                    // Этапы разных изделий не должны пересекаться
                    const overlaps = rows[i].some(otherStage => {
                      if (!otherStage.position || !stage.position) return false;

                      // Если этапы одного изделия - разрешаем перекрытие
                      if (stage.productId === otherStage.productId) {
                        return false; // Этапы одного изделия могут перекрываться
                      }

                      // Для этапов разных изделий проверяем пересечение интервалов
                      const stageEnd = stage.position.startIndex + stage.position.daysCount;
                      const otherStageEnd = otherStage.position.startIndex + otherStage.position.daysCount;
                      // Этапы разных изделий пересекаются, если их интервалы дней перекрываются
                      return !(stage.position.startIndex >= otherStageEnd || otherStage.position.startIndex >= stageEnd);
                    });

                    if (!overlaps) {
                      rows[i].push(stage);
                      placed = true;
                      break;
                    }
                  }

                  // Если не поместилось, создаем новую строку
                  if (!placed) {
                    rows.push([stage]);
                  }
                });

                // Группируем этапы по изделиям для вычисления позиций чипов изделий
                const productGroups = new Map<string, { product: ProductChip; stages: StageChip[] }>();
                allStages.forEach(stage => {
                  if (!productGroups.has(stage.productId)) {
                    productGroups.set(stage.productId, {
                      product: stage.product,
                      stages: []
                    });
                  }
                  productGroups.get(stage.productId)!.stages.push(stage);
                });

                // Вычисляем позиции чипов изделий на основе крайних дат этапов
                const productPositions = new Map<string, {
                  left: number;
                  width: number;
                  startIndex: number;
                  daysCount: number;
                  isCutLeft: boolean;
                  isCutRight: boolean;
                }>();

                productGroups.forEach(({ product, stages }) => {
                  if (stages.length === 0) return;

                  // Находим самый ранний startIndex и самый поздний endIndex среди этапов
                  const minStartIndex = Math.min(...stages.map(s => s.position?.startIndex ?? Infinity));
                  const maxEndIndex = Math.max(...stages.map(s => s.position ? s.position.startIndex + s.position.daysCount - 1 : -Infinity));

                  if (minStartIndex === Infinity || maxEndIndex === -Infinity) return;

                  // Вычисляем позицию чипа изделия на основе крайних дат этапов
                  // Чип изделия может выпирать влево и вправо на величину своего бордюра (1px)
                  // Слева нужно дополнительно учесть бордюр ячейки даты (1px)
                  const borderWidth = 1; // Бордюр чипа изделия
                  const cellBorderWidth = 1; // Бордюр ячейки даты справа
                  const productDaysCount = maxEndIndex - minStartIndex + 1;

                  productPositions.set(product.id, {
                    left: minStartIndex * 39 - borderWidth - cellBorderWidth, // Выпирает на бордюр чипа (1px) + бордюр ячейки (1px) влево
                    width: productDaysCount * 39 + borderWidth * 2, // Выпирает на бордюр чипа (1px) вправо
                    startIndex: minStartIndex,
                    daysCount: productDaysCount,
                    isCutLeft: minStartIndex === 0,
                    isCutRight: maxEndIndex === days.length - 1
                  });
                });

                return (
                  <>
                    {/* Строка с месяцами - первая */}
                    <Box sx={{ display: 'flex', position: 'relative' }}>
                      {days.map((_, index) => {
                        // Находим группу месяца, к которой относится текущая ячейка
                        const monthGroup = monthGroups.find(g => index >= g.startIndex && index < g.startIndex + g.count);
                        // Проверяем, является ли это первой ячейкой месяца
                        const isFirstDayOfMonth = monthGroup && monthGroup.startIndex === index;
                        // Проверяем, является ли это последней ячейкой месяца или последней ячейкой строки
                        const isLastDayOfMonth = monthGroup && (index === monthGroup.startIndex + monthGroup.count - 1 || index === days.length - 1);
                        // Граница справа под цвет фона внутри месяца, цветная на границе между месяцами
                        const borderRightColor = isLastDayOfMonth || index === days.length - 1 ? '#262D33' : '#0E1720';

                        return (
                          <Box
                            key={index}
                            sx={{
                              width: '39px',
                              minHeight: '40px',
                              flexShrink: 0,
                              borderRight: index < days.length - 1 ? `thin solid ${borderRightColor}` : 'none',
                              borderTop: 'thin solid #4B4F50',
                              borderBottom: 'thin solid #4B4F50',
                              position: 'relative',
                              boxSizing: 'border-box'
                            }}
                          >
                            {isFirstDayOfMonth && monthGroup && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  left: 0,
                                  width: `${monthGroup.count * 39}px`,
                                  top: 0,
                                  bottom: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  pointerEvents: 'none',
                                  zIndex: 10
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: '14px',
                                    color: '#EDF3FA'
                                  }}
                                >
                                  {monthGroup.month}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Box>

                    {/* Строка с днями - вторая */}
                    <Box sx={{ display: 'flex' }}>
                      {days.map((day, index) => {
                        const isToday = day.toDateString() === new Date().toDateString();
                        // Определяем выходной день (суббота = 6, воскресенье = 0)
                        const dayOfWeek = day.getDay();
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        // Определяем праздничный день из производственного календаря РФ
                        const dateStr = day.toISOString().split('T')[0]; // Формат: YYYY-MM-DD
                        const isHolidayDay = holidays.get(dateStr) || isHoliday(day); // Используем данные API, если есть, иначе старую функцию
                        // Красный цвет для выходных и праздничных дней (производственный календарь)
                        const isRedDay = isWeekend || isHolidayDay;
                        return (
                          <Box
                            key={index}
                            onClick={() => setCalendarDate(day)}
                            sx={{
                              width: '39px',
                              minHeight: '40px',
                              flexShrink: 0,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              backgroundColor: 'transparent',
                              borderRight: index < days.length - 1 ? 'thin solid #262D33' : 'none',
                              borderBottom: 'thin solid #4B4F50',
                              boxSizing: 'border-box'
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.65rem',
                                color: isRedDay ? '#d32f2f' : '#EDF3FA',
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
                                color: isRedDay ? '#d32f2f' : '#EDF3FA',
                                fontWeight: isToday ? 700 : 400
                              }}
                            >
                              {day.getDate()}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                    {/* Остальные строки с ячейками и карточками изделий */}
                    {Array.from({ length: Math.max(rows.length, 15) }, (_, rowIndex) => {
                      // Получаем этапы работ для текущей строки
                      const stagesForRow = rows[rowIndex] || [];

                      // Группируем этапы по изделиям для рендеринга чипов изделий
                      const productGroupsForRow = new Map<string, StageChip[]>();
                      stagesForRow.forEach(stage => {
                        if (!productGroupsForRow.has(stage.productId)) {
                          productGroupsForRow.set(stage.productId, []);
                        }
                        productGroupsForRow.get(stage.productId)!.push(stage);
                      });

                      return (
                        <Box key={rowIndex} sx={{ display: 'flex', position: 'relative' }}>
                          {days.map((_, index) => {
                            // Верхние границы: строки 3-4 (rowIndex 0-1) и строки 5-17 (rowIndex >= 2) под цвет фона
                            const borderTopColor = (rowIndex <= 1 || rowIndex >= 2) ? '#0E1720' : '#4B4F50';
                            // Нижние границы: строки 3-4 (rowIndex 0-1) и строки 5-17 (rowIndex >= 2) под цвет фона
                            const borderBottomColor = (rowIndex <= 1 || rowIndex >= 2) ? '#0E1720' : '#4B4F50';

                            return (
                              <Box
                                key={index}
                                sx={{
                                  width: '39px',
                                  minHeight: '40px',
                                  flexShrink: 0,
                                  borderRight: index < days.length - 1 ? 'thin solid #262D33' : 'none',
                                  borderTop: `thin solid ${borderTopColor}`,
                                  borderBottom: `thin solid ${borderBottomColor}`,
                                  position: 'relative',
                                  boxSizing: 'border-box'
                                }}
                              />
                            );
                          })}
                          {/* Чипы изделий (фоновые элементы) для этой строки */}
                          {Array.from(productGroupsForRow.entries()).map(([productId, stages]) => {
                            const product = stages[0].product;
                            const position = productPositions.get(productId);
                            if (!position) return null;

                            return (
                              <Box
                                key={product.id}
                                sx={{
                                  position: 'absolute',
                                  left: `${position.left}px`,
                                  width: `${position.width}px`,
                                  height: '38px',
                                  color: '#B6BEC9',
                                  borderRadius: '4px',
                                  border: '1px solid #0254A5',
                                  padding: '4px 8px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'flex-start',
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                  zIndex: 3, // Фоновый элемент, ниже чипов этапов
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  boxSizing: 'border-box',
                                  // Градиент для обрезки с фоном
                                  background: position.isCutLeft && position.isCutRight
                                    ? 'linear-gradient(to right, rgba(11, 32, 55, 0.3), #0B2037 20px, #0B2037 calc(100% - 20px), rgba(11, 32, 55, 0.3))'
                                    : position.isCutLeft
                                      ? 'linear-gradient(to right, rgba(11, 32, 55, 0.3), #0B2037 20px)'
                                      : position.isCutRight
                                        ? 'linear-gradient(to left, rgba(11, 32, 55, 0.3), #0B2037 20px)'
                                        : '#0B2037'
                                }}
                                onClick={() => {
                                  // Можно добавить обработчик клика по карточке изделия
                                  // console.log('Клик по изделию:', product.productName, 'проект:', product.projectName);
                                }}
                              >
                                {/* Иконка обрезки слева */}
                                {position.isCutLeft && (
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      left: '2px',
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      width: '12px',
                                      height: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      zIndex: 6
                                    }}
                                    title="Изделие начинается раньше видимого периода"
                                  >
                                    <Box
                                      sx={{
                                        width: 0,
                                        height: 0,
                                        borderTop: '6px solid transparent',
                                        borderBottom: '6px solid transparent',
                                        borderRight: '8px solid #0254A5'
                                      }}
                                    />
                                  </Box>
                                )}
                                {/* Иконка обрезки справа */}
                                {position.isCutRight && (
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      right: '2px',
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      width: '12px',
                                      height: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      zIndex: 6
                                    }}
                                    title="Изделие продолжается после видимого периода"
                                  >
                                    <Box
                                      sx={{
                                        width: 0,
                                        height: 0,
                                        borderTop: '6px solid transparent',
                                        borderBottom: '6px solid transparent',
                                        borderLeft: '8px solid #0254A5'
                                      }}
                                    />
                                  </Box>
                                )}
                                {/* Первая строка: название проекта и изделия */}
                                {(() => {
                                  // Компонент для названия изделия с подсказкой в 2 строки
                                  const ProductNameComponent = React.memo(() => {
                                    const textRef = React.useRef<HTMLDivElement>(null);

                                    // Определяем статус текстом на русском
                                    const getStatusText = (status: string) => {
                                      switch (status) {
                                        case 'InProject': return 'В проекте';
                                        case 'InProgress': return 'В работе';
                                        case 'Done': return 'Готово';
                                        case 'HasProblems': return 'Проблема';
                                        default: return 'В проекте';
                                      }
                                    };

                                    // Определяем цвет лампочки в зависимости от статуса изделия
                                    let statusColor = '#FFE082'; // Желтый - по умолчанию (InProject)
                                    if (product.productStatus === 'Done') {
                                      statusColor = '#81C784'; // Зеленый - готово
                                    } else if (product.productStatus === 'HasProblems') {
                                      statusColor = '#E57373'; // Красный - проблема
                                    } else if (product.productStatus === 'InProgress') {
                                      statusColor = '#64B5F6'; // Синий - в работе
                                    }

                                    const nameBox = (
                                      <Box
                                        ref={textRef}
                                        sx={{ display: 'flex', alignItems: 'center', lineHeight: '14px', overflow: 'hidden' }}
                                      >
                                        {/* Лампочка статуса изделия */}
                                        <Box
                                          sx={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            backgroundColor: statusColor,
                                            mr: '6px',
                                            flexShrink: 0
                                          }}
                                        />
                                        <Box component="span" sx={{ color: '#DDBB88', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {product.projectName}
                                        </Box>
                                        <Box component="span" sx={{ mx: '4px', color: '#B6BEC9', flexShrink: 0 }}>
                                          •
                                        </Box>
                                        <Box component="span" sx={{ color: '#9966B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {product.productName}
                                        </Box>
                                      </Box>
                                    );

                                    // Кастомный компонент для Tooltip с цветной лампочкой
                                    const CustomTooltipContent = (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', mb: '4px' }}>
                                        <Box
                                          sx={{
                                            width: '10px',
                                            height: '10px',
                                            borderRadius: '50%',
                                            backgroundColor: statusColor,
                                            flexShrink: 0
                                          }}
                                        />
                                        <Box component="span">
                                          {getStatusText(product.productStatus || 'InProject')}
                                        </Box>
                                      </Box>
                                    );

                                    // Tooltip показывается всегда с полной информацией: статус с лампочкой, проект, изделие
                                    return (
                                      <Tooltip
                                        title={
                                          <Box>
                                            {CustomTooltipContent}
                                            <Box component="div">
                                              {product.projectName}
                                            </Box>
                                            <Box component="div">
                                              {product.productName}
                                            </Box>
                                          </Box>
                                        }
                                        enterDelay={1000}
                                        arrow
                                      >
                                        {nameBox}
                                      </Tooltip>
                                    );
                                  });

                                  return <ProductNameComponent key={`${product.id}-name`} />;
                                })()}
                              </Box>
                            );
                          })}
                          {/* Чипы этапов работ (основные элементы) для этой строки */}
                          {(() => {
                            // Определяем пересечения этапов одного изделия для штриховки
                            const intersectionRanges: Array<{ start: number; end: number }> = [];

                            // Находим все пересечения этапов одного изделия
                            for (let i = 0; i < stagesForRow.length; i++) {
                              const stage1 = stagesForRow[i];
                              if (!stage1.position) continue;

                              for (let j = i + 1; j < stagesForRow.length; j++) {
                                const stage2 = stagesForRow[j];
                                if (!stage2.position) continue;

                                // Проверяем, что этапы одного изделия
                                if (stage1.productId !== stage2.productId) continue;

                                // Определяем пересечение интервалов
                                // Логика: каждое начало чипа со следующей даты перекрывает конец предыдущей
                                const start1 = stage1.position.startIndex;
                                const end1 = stage1.position.startIndex + stage1.position.daysCount - 1; // Последний день первого этапа (индекс)
                                const start2 = stage2.position.startIndex;
                                const end2 = stage2.position.startIndex + stage2.position.daysCount - 1; // Последний день второго этапа (индекс)

                                // Проверяем, перекрываются ли этапы
                                // Логика: если дата начала одного этапа = дате окончания другого, это перекрытие
                                // Этапы перекрываются, если начало одного <= конец другого И начало другого <= конец первого
                                const overlaps = start1 <= end2 && start2 <= end1;

                                if (overlaps) {
                                  // Есть перекрытие - вычисляем область пересечения
                                  // Область пересечения: от начала более позднего до конца более раннего (включительно)
                                  const intersectionStart = Math.max(start1, start2);
                                  const intersectionEnd = Math.min(end1, end2) + 1; // +1 чтобы включить последний день пересечения

                                  // Добавляем диапазон только если есть реальное пересечение (минимум 1 день)
                                  if (intersectionStart < intersectionEnd) {
                                    intersectionRanges.push({
                                      start: intersectionStart,
                                      end: intersectionEnd
                                    });
                                  }
                                }
                              }
                            }

                            // Объединяем пересекающиеся диапазоны
                            const mergedIntersections: Array<{ start: number; end: number }> = [];
                            intersectionRanges.sort((a, b) => a.start - b.start);

                            for (const range of intersectionRanges) {
                              if (mergedIntersections.length === 0) {
                                mergedIntersections.push({ ...range });
                              } else {
                                const last = mergedIntersections[mergedIntersections.length - 1];
                                // Если текущий диапазон пересекается с последним - объединяем
                                if (range.start <= last.end) {
                                  last.end = Math.max(last.end, range.end);
                                } else {
                                  mergedIntersections.push({ ...range });
                                }
                              }
                            }

                            // Преобразуем объединенные диапазоны в пиксельные координаты и храним также индексы дней
                            const cellWidth = 39;
                            const intersections = mergedIntersections.map(range => ({
                              left: range.start * cellWidth,
                              width: (range.end - range.start) * cellWidth,
                              startIndex: range.start, // Индекс дня начала пересечения (включительно)
                              endIndex: range.end      // Индекс дня конца пересечения (включительно, последний день + 1)
                            }));

                            return (
                              <>
                                {/* Рендерим чипы этапов */}
                                {stagesForRow.map((stage) => {
                                  if (!stage.position) return null;

                                  // Функция для форматирования даты
                                  const formatDate = (dateString: string | null): string => {
                                    if (!dateString) return 'Не указано';
                                    try {
                                      const date = new Date(dateString);
                                      if (isNaN(date.getTime())) return 'Не указано';
                                      return date.toLocaleDateString('ru-RU');
                                    } catch {
                                      return 'Не указано';
                                    }
                                  };

                                  // Формируем текст подсказки в 2 строки через точки-разделители
                                  // Первая строка: название этапа • исполнитель
                                  const firstLineParts: string[] = [];
                                  firstLineParts.push(stage.nomenclatureItem?.name || 'Этап работ');

                                  if (stage.assignee?.name) {
                                    firstLineParts.push(stage.assignee.name);
                                  } else {
                                    firstLineParts.push('Не указан');
                                  }

                                  // Вторая строка: дата старта • дата финиша • продолжительность
                                  const secondLineParts: string[] = [];
                                  secondLineParts.push(formatDate(stage.startDate));
                                  secondLineParts.push(formatDate(stage.endDate));

                                  // Продолжительность
                                  if (stage.duration !== null && stage.duration !== undefined) {
                                    secondLineParts.push(`${stage.duration} ${stage.duration === 1 ? 'день' : stage.duration < 5 ? 'дня' : 'дней'}`);
                                  } else {
                                    // Вычисляем продолжительность из дат, если не указана
                                    if (stage.startDate && stage.endDate) {
                                      try {
                                        const start = new Date(stage.startDate);
                                        const end = new Date(stage.endDate);
                                        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                                          const diffTime = end.getTime() - start.getTime();
                                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 чтобы включить первый день
                                          secondLineParts.push(`${diffDays} ${diffDays === 1 ? 'день' : diffDays < 5 ? 'дня' : 'дней'}`);
                                        } else {
                                          secondLineParts.push('Не указана');
                                        }
                                      } catch {
                                        secondLineParts.push('Не указана');
                                      }
                                    } else {
                                      secondLineParts.push('Не указана');
                                    }
                                  }

                                  const tooltipTitle = `${firstLineParts.join(' • ')}\n${secondLineParts.join(' • ')}`;

                                  // Вычисляем незаштрихованную область для текущего чипа этапа
                                  const stageStart = stage.position.startIndex;
                                  const stageEnd = stage.position.startIndex + stage.position.daysCount;

                                  // Находим пересечения, которые затрагивают текущий чип (используем индексы дней напрямую)
                                  const affectingIntersections = intersections.filter(intersection => {
                                    // Проверяем, пересекается ли пересечение с текущим чипом используя индексы дней
                                    return !(intersection.endIndex <= stageStart || intersection.startIndex >= stageEnd);
                                  });

                                  // Определяем незаштрихованную область
                                  let unshadedStart = stageStart;
                                  let unshadedEnd = stageEnd;

                                  // Если есть пересечения, находим самый большой незаштрихованный сегмент
                                  if (affectingIntersections.length > 0) {
                                    // Используем индексы дней напрямую и сортируем
                                    const shadedRanges = affectingIntersections.map(intersection => ({
                                      start: intersection.startIndex,
                                      end: intersection.endIndex
                                    })).sort((a, b) => a.start - b.start);

                                    // Находим незаштрихованные сегменты
                                    const unshadedSegments: Array<{ start: number; end: number }> = [];
                                    let currentStart = stageStart;

                                    for (const shaded of shadedRanges) {
                                      // Если есть незаштрихованная область до текущего заштрихованного диапазона
                                      if (currentStart < shaded.start) {
                                        unshadedSegments.push({
                                          start: currentStart,
                                          end: shaded.start
                                        });
                                      }
                                      currentStart = Math.max(currentStart, shaded.end);
                                    }

                                    // Добавляем последний незаштрихованный сегмент
                                    if (currentStart < stageEnd) {
                                      unshadedSegments.push({
                                        start: currentStart,
                                        end: stageEnd
                                      });
                                    }

                                    // Находим самый большой незаштрихованный сегмент
                                    if (unshadedSegments.length > 0) {
                                      const largestSegment = unshadedSegments.reduce((max, seg) => {
                                        const size = seg.end - seg.start;
                                        const maxSize = max.end - max.start;
                                        return size > maxSize ? seg : max;
                                      });
                                      unshadedStart = largestSegment.start;
                                      unshadedEnd = largestSegment.end;
                                    }
                                  }

                                  // Вычисляем позицию и ширину для центрирования текста по незаштрихованной области
                                  const cellWidth = 39;
                                  const unshadedLeft = (unshadedStart - stageStart) * cellWidth;
                                  const unshadedWidth = (unshadedEnd - unshadedStart) * cellWidth;

                                  const chipBox = (
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        left: `${stage.position.left}px`,
                                        width: `${stage.position.width}px`,
                                        bottom: '4px', // Позиция внизу чипа изделия (4px от нижнего края)
                                        height: '16px',
                                        backgroundColor: '#1A3A5A',
                                        color: '#B6BEC9',
                                        borderRadius: '3px',
                                        border: '1px solid #0254A5',
                                        padding: '0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-start', // Изменено с 'center' на 'flex-start' для позиционирования по незаштрихованной области
                                        overflow: 'hidden',
                                        fontSize: '9px',
                                        fontWeight: 400,
                                        zIndex: 7, // Поверх чипа изделия
                                        textAlign: 'center',
                                        boxSizing: 'border-box', // Бордюры учитываются внутри ширины чипа
                                        cursor: 'default'
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          position: 'absolute',
                                          left: `${unshadedLeft + unshadedWidth / 2}px`, // Центр незаштрихованной области
                                          transform: 'translateX(-50%)', // Центрируем текст относительно центра незаштрихованной области
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          maxWidth: `${unshadedWidth}px`, // Максимальная ширина = незаштрихованная область
                                          textAlign: 'center',
                                          pointerEvents: 'none' // Чтобы не блокировать клики на чип
                                        }}
                                      >
                                        {stage.nomenclatureItem?.name || 'Этап'}
                                      </Box>
                                    </Box>
                                  );

                                  // Tooltip показывается всегда с полной информацией
                                  return (
                                    <Tooltip
                                      key={stage.id}
                                      title={tooltipTitle}
                                      enterDelay={1000}
                                      arrow
                                      componentsProps={{
                                        tooltip: {
                                          sx: {
                                            whiteSpace: 'pre-line' // Позволяет отображать переносы строк
                                          }
                                        }
                                      }}
                                    >
                                      {chipBox}
                                    </Tooltip>
                                  );
                                })}
                                {/* Штрихованные overlay элементы в местах пересечения этапов одного изделия */}
                                {intersections.map((intersection, idx) => (
                                  <Box
                                    key={`intersection-${idx}`}
                                    sx={{
                                      position: 'absolute',
                                      left: `${intersection.left}px`,
                                      width: `${intersection.width}px`,
                                      bottom: '4px',
                                      height: '14px',
                                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255, 255, 255, 0.3) 2px, rgba(255, 255, 255, 0.3) 4px)',
                                      backgroundColor: 'transparent',
                                      border: '1px solid #0254A5',
                                      pointerEvents: 'none',
                                      zIndex: 15, // Поверх чипов этапов
                                      borderRadius: '3px'
                                    }}
                                  />
                                ))}
                              </>
                            );
                          })()}
                        </Box>
                      );
                    })}
                  </>
                );
              })()}
            </Box>
          </>
        );
      case 1: // Канбан-доска
        return (
          <Box className="page-content-container">
            <Box sx={{ mt: 2, mb: 1, width: 'calc(100% - 60px)', marginLeft: '30px', marginRight: '30px' }}>
              <KanbanBoard onOpenStage={handleOpenStageFromKanban} />
            </Box>
          </Box>
        );
      case 2: // Страница проектов
        return user && <ProjectsList onOpenProjectComposition={handleOpenProjectComposition} onOpenCreateProject={handleOpenCreateProject} user={user} canCreate={canCreate} canDelete={canDelete} />;
      case 3: // Страница справочников
        return <ReferencesPage canEdit={canEdit} canCreate={canCreate} canDelete={canDelete} />;
      case 4: // Страница пользователей (Админ панель)
        return (
          <>
            {user && <UsersList currentUser={user} canEdit={canEdit} canCreate={canCreate} canDelete={canDelete} />}

            {/* Управление правами доступа */}
            <Box className="page-container" sx={{ mt: 3 }}>
              <Box className="page-header">
                <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px' }}>
                  Управление правами доступа
                </Typography>
              </Box>
              <Paper sx={{ p: 3, mb: 3 }}>
                {/* Аккордеон для сворачивания раздела прав доступа */}
                <Accordion defaultExpanded>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="rights-accordion-content"
                    id="rights-accordion-header"
                    sx={{
                      flexDirection: 'row-reverse',
                      '& .MuiAccordionSummary-expandIconWrapper': {
                        marginLeft: 0,
                        marginRight: 'auto'
                      },
                      '& .MuiAccordionSummary-content': {
                        marginLeft: 'auto',
                        marginRight: 0
                      }
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                      Права доступа по ролям
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Ниже представлена таблица прав доступа для каждой роли в системе
                    </Typography>

                    {/* Таблица прав доступа */}
                    <TableContainer component={Paper} variant="outlined">
                      <Table sx={{
                        '& .MuiTableCell-root': {
                          padding: '2px 8px', // Минимальный padding для уменьшения высоты строк
                          height: '20px',
                          minHeight: 'unset', // Убираем минимальную высоту
                          lineHeight: '1.2', // Уменьшаем межстрочный интервал
                          verticalAlign: 'middle' // Выравнивание по вертикали по центру
                        },
                        '& .MuiCheckbox-root': {
                          padding: '0px' // Уменьшаем padding у чекбоксов
                        },
                        '& .MuiSvgIcon-root': {
                          verticalAlign: 'middle'
                        }
                      }}>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5', height: '30px' }}>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', minWidth: '200px' }}>Раздел / Действие</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#ffebee' }}>
                              <Chip label="Администратор" color="error" size="small" sx={{ width: '120px', borderRadius: '6px', fontWeight: 'normal' }} />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f3e5f5' }}>
                              <Chip label="Менеджер" color="secondary" size="small" sx={{ width: '120px', borderRadius: '6px', fontWeight: 'normal' }} />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#e3f2fd' }}>
                              <Chip label="Пользователь" color="primary" size="small" sx={{ width: '120px', borderRadius: '6px', fontWeight: 'normal' }} />
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody sx={{ '& .MuiTableRow-root': { height: '30px' } }}>
                          {/* Группировка: Страницы */}
                          <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.95rem' }} colSpan={4}>
                              Страницы (только просмотр)
                            </TableCell>
                          </TableRow>
                          {/* Главная страница */}
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'medium' }}>Главная страница (Календарь)</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['main-page'].manager}
                                onChange={() => handlePermissionChange('main-page', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['main-page'].user}
                                onChange={() => handlePermissionChange('main-page', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          {/* Канбан */}
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'medium' }}>Канбан-доска</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['kanban'].manager}
                                onChange={() => handlePermissionChange('kanban', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['kanban'].user}
                                onChange={() => handlePermissionChange('kanban', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          {/* Проекты */}
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'medium' }}>Проекты</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['projects-view'].manager}
                                onChange={() => handlePermissionChange('projects-view', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['projects-view'].user}
                                onChange={() => handlePermissionChange('projects-view', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          {/* Справочник Номенклатура */}
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'medium' }}>Справочник Номенклатура</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['nomenclature-view'].manager}
                                onChange={() => handlePermissionChange('nomenclature-view', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['nomenclature-view'].user}
                                onChange={() => handlePermissionChange('nomenclature-view', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          {/* Справочник Контрагенты */}
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'medium' }}>Справочник Контрагенты</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['counterparties-view'].manager}
                                onChange={() => handlePermissionChange('counterparties-view', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['counterparties-view'].user}
                                onChange={() => handlePermissionChange('counterparties-view', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          {/* Справочник Физические лица */}
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'medium' }}>Справочник Физические лица</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['persons-view'].manager}
                                onChange={() => handlePermissionChange('persons-view', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['persons-view'].user}
                                onChange={() => handlePermissionChange('persons-view', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          {/* Справочник Единицы измерения */}
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'medium' }}>Справочник Единицы измерения</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['units-view'].manager}
                                onChange={() => handlePermissionChange('units-view', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['units-view'].user}
                                onChange={() => handlePermissionChange('units-view', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          {/* Справочник Виды номенклатуры */}
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'medium' }}>Справочник Виды номенклатуры</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['nomenclature-types-view'].manager}
                                onChange={() => handlePermissionChange('nomenclature-types-view', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['nomenclature-types-view'].user}
                                onChange={() => handlePermissionChange('nomenclature-types-view', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          {/* Админ панель */}
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'medium' }}>Админ панель</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>-</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>-</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Управление пользователями</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>-</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>-</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Резервное копирование</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>-</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>-</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Миграции базы данных</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>-</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>-</TableCell>
                          </TableRow>
                          {/* Группировка: Элементы */}
                          <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.95rem' }} colSpan={4}>
                              Элементы
                            </TableCell>
                          </TableRow>
                          {/* Подзаголовок: Проект */}
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', pl: 2 }} colSpan={4}>
                              Проект
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Просмотр</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['projects-view'].manager}
                                onChange={() => handlePermissionChange('projects-view', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['projects-view'].user}
                                onChange={() => handlePermissionChange('projects-view', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Создание / Редактирование / Удаление</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['projects-edit'].manager && rolePermissions['projects-delete'].manager}
                                onChange={() => handleCombinedPermissionChange('projects-edit', 'projects-delete', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['projects-edit'].user && rolePermissions['projects-delete'].user}
                                onChange={() => handleCombinedPermissionChange('projects-edit', 'projects-delete', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          {/* Подзаголовок: Изделие */}
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', pl: 2 }} colSpan={4}>
                              Изделие
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Просмотр</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['products-view'].manager}
                                onChange={() => handlePermissionChange('products-view', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['products-view'].user}
                                onChange={() => handlePermissionChange('products-view', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Создание / Редактирование / Удаление</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['products-edit'].manager && rolePermissions['products-delete'].manager}
                                onChange={() => handleCombinedPermissionChange('products-edit', 'products-delete', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['products-edit'].user && rolePermissions['products-delete'].user}
                                onChange={() => handleCombinedPermissionChange('products-edit', 'products-delete', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          {/* Подзаголовок: Этап работ */}
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', pl: 2 }} colSpan={4}>
                              Этап работ
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Просмотр</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['stages-view'].manager}
                                onChange={() => handlePermissionChange('stages-view', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['stages-view'].user}
                                onChange={() => handlePermissionChange('stages-view', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Создание / Редактирование / Удаление</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['stages-edit'].manager && rolePermissions['stages-delete'].manager}
                                onChange={() => handleCombinedPermissionChange('stages-edit', 'stages-delete', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['stages-edit'].user && rolePermissions['stages-delete'].user}
                                onChange={() => handleCombinedPermissionChange('stages-edit', 'stages-delete', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          {/* Подзаголовок: Спецификация */}
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', pl: 2 }} colSpan={4}>
                              Спецификация
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Просмотр</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['specifications-view'].manager}
                                onChange={() => handlePermissionChange('specifications-view', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['specifications-view'].user}
                                onChange={() => handlePermissionChange('specifications-view', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Создание / Редактирование / Удаление</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['specifications-edit'].manager && rolePermissions['specifications-delete'].manager}
                                onChange={() => handleCombinedPermissionChange('specifications-edit', 'specifications-delete', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['specifications-edit'].user && rolePermissions['specifications-delete'].user}
                                onChange={() => handleCombinedPermissionChange('specifications-edit', 'specifications-delete', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          {/* Подзаголовок: Номенклатура */}
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', pl: 2 }} colSpan={4}>
                              Номенклатура
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Просмотр</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['nomenclature-view'].manager}
                                onChange={() => handlePermissionChange('nomenclature-view', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['nomenclature-view'].user}
                                onChange={() => handlePermissionChange('nomenclature-view', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Создание / Редактирование / Удаление</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['references-edit'].manager && rolePermissions['references-delete'].manager}
                                onChange={() => handleCombinedPermissionChange('references-edit', 'references-delete', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['references-edit'].user && rolePermissions['references-delete'].user}
                                onChange={() => handleCombinedPermissionChange('references-edit', 'references-delete', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          {/* Подзаголовок: Контрагенты */}
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', pl: 2 }} colSpan={4}>
                              Контрагенты
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Просмотр</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['counterparties-view'].manager}
                                onChange={() => handlePermissionChange('counterparties-view', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['counterparties-view'].user}
                                onChange={() => handlePermissionChange('counterparties-view', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Создание / Редактирование / Удаление</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['references-edit'].manager && rolePermissions['references-delete'].manager}
                                onChange={() => handleCombinedPermissionChange('references-edit', 'references-delete', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['references-edit'].user && rolePermissions['references-delete'].user}
                                onChange={() => handleCombinedPermissionChange('references-edit', 'references-delete', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          {/* Подзаголовок: Физ лица */}
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', pl: 2 }} colSpan={4}>
                              Физ лица
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Просмотр</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['persons-view'].manager}
                                onChange={() => handlePermissionChange('persons-view', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['persons-view'].user}
                                onChange={() => handlePermissionChange('persons-view', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Создание / Редактирование / Удаление</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['references-edit'].manager && rolePermissions['references-delete'].manager}
                                onChange={() => handleCombinedPermissionChange('references-edit', 'references-delete', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['references-edit'].user && rolePermissions['references-delete'].user}
                                onChange={() => handleCombinedPermissionChange('references-edit', 'references-delete', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          {/* Подзаголовок: Единицы измерения */}
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', pl: 2 }} colSpan={4}>
                              Единицы измерения
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Просмотр</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['units-view'].manager}
                                onChange={() => handlePermissionChange('units-view', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['units-view'].user}
                                onChange={() => handlePermissionChange('units-view', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Создание / Редактирование / Удаление</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['references-edit'].manager && rolePermissions['references-delete'].manager}
                                onChange={() => handleCombinedPermissionChange('references-edit', 'references-delete', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['references-edit'].user && rolePermissions['references-delete'].user}
                                onChange={() => handleCombinedPermissionChange('references-edit', 'references-delete', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          {/* Подзаголовок: Виды номенклатуры */}
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', pl: 2 }} colSpan={4}>
                              Виды номенклатуры
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Просмотр</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['nomenclature-types-view'].manager}
                                onChange={() => handlePermissionChange('nomenclature-types-view', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['nomenclature-types-view'].user}
                                onChange={() => handlePermissionChange('nomenclature-types-view', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Создание / Редактирование / Удаление</TableCell>
                            <TableCell sx={{ textAlign: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
                              <Tooltip title="Администратор всегда имеет полный доступ">
                                <CheckCircleIcon color="success" />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['references-edit'].manager && rolePermissions['references-delete'].manager}
                                onChange={() => handleCombinedPermissionChange('references-edit', 'references-delete', 'manager')}
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={rolePermissions['references-edit'].user && rolePermissions['references-delete'].user}
                                onChange={() => handleCombinedPermissionChange('references-edit', 'references-delete', 'user')}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Информационная справка */}
                    <Alert severity="info" sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        📋 Справка по правам доступа:
                      </Typography>
                      <Box component="ul" sx={{ m: 0, pl: 3, '& li': { mb: 0.5 } }}>
                        <li>
                          <strong>Администратор:</strong> Полный доступ ко всем разделам системы, включая управление пользователями и настройки базы данных
                        </li>
                        <li>
                          <strong>Менеджер:</strong> Может создавать и редактировать проекты, изделия, справочники. Не может удалять проекты и некоторые справочники, не имеет доступа к админ панели
                        </li>
                        <li>
                          <strong>Пользователь:</strong> Имеет доступ только на просмотр информации. Не может создавать, редактировать или удалять данные
                        </li>
                        <li>
                          <strong>Важно:</strong> Права доступа проверяются как на фронтенде, так и на бэкенде для обеспечения безопасности
                        </li>
                      </Box>
                    </Alert>
                  </AccordionDetails>
                </Accordion>
              </Paper>
            </Box>

            {/* Управление базами данных */}
            <Box className="page-container" sx={{ mt: 3 }}>
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

                {/* Информационная памятка о бэкапах */}
                <Accordion sx={{ mb: 3 }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="backup-memo-accordion-content"
                    id="backup-memo-accordion-header"
                    sx={{
                      flexDirection: 'row-reverse',
                      '& .MuiAccordionSummary-expandIconWrapper': {
                        marginLeft: 0,
                        marginRight: 'auto'
                      },
                      '& .MuiAccordionSummary-content': {
                        marginLeft: 'auto',
                        marginRight: 0
                      }
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      📋 Памятка по резервному копированию:
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Alert
                      severity="info"
                      sx={{
                        '& .MuiAlert-message': {
                          width: '100%'
                        }
                      }}
                    >
                      <Box component="ul" sx={{ m: 0, pl: 3, '& li': { mb: 0.5 } }}>
                        <li>
                          <strong>Что сохраняется в бэкапе:</strong>
                          <ul style={{ marginTop: '4px', marginBottom: '8px', paddingLeft: '20px' }}>
                            <li>Все данные из таблиц базы данных</li>
                            <li>Схема базы данных (Prisma schema) - для восстановления структуры</li>
                            <li>Информация о примененных миграциях</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Перед важными операциями:</strong> всегда создавайте бэкап перед применением миграций, сбросом данных или другими критическими действиями
                        </li>
                        <li>
                          <strong>Для полного восстановления после краха:</strong>
                          <ol style={{ marginTop: '4px', marginBottom: '8px', paddingLeft: '20px' }}>
                            <li>Сначала примените миграции (кнопка "Применить миграции") - это восстановит структуру БД</li>
                            <li>Затем восстановите данные (кнопка "Восстановить из копии") - это восстановит все данные</li>
                          </ol>
                        </li>
                        <li>
                          <strong>Хранение бэкапов:</strong> сохраняйте файлы бэкапов в безопасном месте вне сервера, желательно на внешнем носителе или облачном хранилище
                        </li>
                        <li>
                          <strong>Регулярность:</strong> рекомендуется создавать бэкапы регулярно (например, ежедневно или перед каждым релизом)
                        </li>
                      </Box>
                    </Alert>
                  </AccordionDetails>
                </Accordion>

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
        <AppBar position="static" className="header" sx={{ height: '56px', width: '100%', justifyContent: 'center', borderBottom: 'none' }}>
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

        {/* Основной контент */}
        {renderTabContent()}

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
