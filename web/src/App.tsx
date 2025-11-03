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
  ToggleButton  // Переключатель
} from '@mui/material';

// Импорт иконок из Material-UI
import {
  Home as HomeIcon,
  Assignment as ProjectIcon,
  Folder as FolderIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  AdminPanelSettings as AdminIcon,
  Timeline as GanttIcon,
  CalendarMonth as CalendarMonthIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ViewAgenda as ViewAgendaIcon,
  CalendarToday as CalendarTodayIcon,
  Event as EventIcon
} from '@mui/icons-material';


// Импорт компонентов
// import GanttChart from './components/GanttChart'; // Не используется
import KanbanBoard from './components/KanbanBoard';
import ReferencesPage from './components/ReferencesPage';
import VolumeButton from './components/VolumeButton';
import ProjectManagersList from './components/ProjectManagersList';
import ContractorsList from './components/ContractorsList';
import UsersList from './components/UsersList';
import ProjectsList from './components/ProjectsList';
import type { User, Project } from './types/common';

// Интерфейс для ответа сервера при авторизации
interface LoginResponse {
  accessToken: string; // JWT токен для аутентификации
  user: User;          // Данные пользователя
}

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
  const [currentTab, setCurrentTab] = useState(0);    // Текущая активная вкладка

  // Состояние для календаря
  const [calendarView, setCalendarView] = useState<'month' | 'quarter' | 'halfyear' | 'year'>('month'); // Вид календаря
  const [calendarDate, setCalendarDate] = useState<Date>(new Date()); // Текущая дата календаря
  const [_calendarProjects, setCalendarProjects] = useState<Project[]>([]); // Проекты для отображения в календаре (оставлено для обратной совместимости)
  const [_calendarProducts, setCalendarProducts] = useState<ProductChip[]>([]); // Изделия для отображения в календаре
  const [_holidays, setHolidays] = useState<Map<string, boolean>>(new Map()); // Праздничные дни из производственного календаря РФ
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
      console.error('Ошибка загрузки проектов для календаря:', error);
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
          console.error(`Ошибка загрузки изделий для проекта ${project.id}:`, error);
        }
      }

      setCalendarProducts(productsChips);
    } catch (error) {
      console.error('Ошибка загрузки изделий для календаря:', error);
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
        console.error('Ошибка загрузки календаря:', response.status);
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
      console.error('Ошибка загрузки производственного календаря:', error);
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
      setShowProjectComposition(false);
      setShowStagesPage(false);
      setShowSpecificationsList(false);
      setSelectedProject(null);
      setSelectedProductId(null);
      setSelectedSpecificationId(null);
      setSelectedSpecificationName(null);
      setCurrentTab(newValue);
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
    if (!user || !canAccessTab(currentTab)) {
      // Если пользователь вышел или у него нет доступа к текущей вкладке, переключаем на главную
      setCurrentTab(0);
    }
  }, [user, currentTab, canAccessTab]);

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
        });
    }
  }, []);

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
      { index: 4, label: 'Руководители', icon: <PersonIcon /> },
      { index: 5, label: 'Исполнители', icon: <GroupIcon /> },
      { index: 6, label: 'Админ', icon: <AdminIcon /> },
    ];

    return tabs.filter(tab => canAccessTab(tab.index));
  };

  // Функция для рендеринга контента вкладок
  const renderTabContent = () => {
    switch (currentTab) {
      case 0: // Главная страница - календарь
        return (
          <Box className="page-content-container">
            <Box sx={{ mt: 2, mb: 1, width: 'calc(100% - 60px)', marginLeft: '30px', marginRight: '30px' }}>
              {/* Контролы для управления календарем */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                {/* Кнопки переключения вида календаря */}
                <ToggleButtonGroup
                  value={calendarView}
                  exclusive
                  onChange={(_, newValue) => {
                    if (newValue !== null) {
                      setCalendarView(newValue);
                    }
                  }}
                  aria-label="вид календаря"
                  size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      fontSize: '0.875rem',
                      padding: '6px 12px',
                      border: '1px solid rgba(0, 0, 0, 0.23)',
                      '&.Mui-selected': {
                        backgroundColor: '#1976d2',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: '#1565c0',
                        },
                      },
                    },
                  }}
                >
                  <ToggleButton value="month" aria-label="месяц">
                    <CalendarMonthIcon sx={{ mr: 0.5 }} />
                    Месяц
                  </ToggleButton>
                  <ToggleButton value="quarter" aria-label="квартал">
                    <CalendarTodayIcon sx={{ mr: 0.5 }} />
                    Квартал
                  </ToggleButton>
                  <ToggleButton value="halfyear" aria-label="полгода">
                    <ViewAgendaIcon sx={{ mr: 0.5 }} />
                    Полгода
                  </ToggleButton>
                  <ToggleButton value="year" aria-label="год">
                    <EventIcon sx={{ mr: 0.5 }} />
                    Год
                  </ToggleButton>
                </ToggleButtonGroup>

                {/* Кнопки навигации по датам */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    onClick={() => {
                      const newDate = new Date(calendarDate);
                      switch (calendarView) {
                        case 'month':
                          newDate.setMonth(newDate.getMonth() - 1);
                          break;
                        case 'quarter':
                          newDate.setMonth(newDate.getMonth() - 3);
                          break;
                        case 'halfyear':
                          newDate.setMonth(newDate.getMonth() - 6);
                          break;
                        case 'year':
                          newDate.setFullYear(newDate.getFullYear() - 1);
                          break;
                      }
                      setCalendarDate(newDate);
                    }}
                    aria-label="предыдущий период"
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                  <Typography variant="body1" sx={{ minWidth: '200px', textAlign: 'center' }}>
                    {(() => {
                      switch (calendarView) {
                        case 'month':
                          return calendarDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
                        case 'quarter':
                          const quarter = Math.floor(calendarDate.getMonth() / 3) + 1;
                          return `${quarter} квартал ${calendarDate.getFullYear()}`;
                        case 'halfyear':
                          const half = calendarDate.getMonth() < 6 ? 1 : 2;
                          return `${half} полугодие ${calendarDate.getFullYear()}`;
                        case 'year':
                          return calendarDate.getFullYear().toString();
                        default:
                          return '';
                      }
                    })()}
                  </Typography>
                  <IconButton
                    onClick={() => {
                      const newDate = new Date(calendarDate);
                      switch (calendarView) {
                        case 'month':
                          newDate.setMonth(newDate.getMonth() + 1);
                          break;
                        case 'quarter':
                          newDate.setMonth(newDate.getMonth() + 3);
                          break;
                        case 'halfyear':
                          newDate.setMonth(newDate.getMonth() + 6);
                          break;
                        case 'year':
                          newDate.setFullYear(newDate.getFullYear() + 1);
                          break;
                      }
                      setCalendarDate(newDate);
                    }}
                    aria-label="следующий период"
                  >
                    <ChevronRightIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Календарь */}
              <Box
                sx={{
                  overflow: 'auto',
                  width: '100%',
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
                  } else if (calendarView === 'year') {
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

                  return (
                    <>
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
                        {/* Календарь будет здесь */}
                      </Box>
                    </>
                  );
                })()}
              </Box>
            </Box>
          </Box>
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
      case 4: // Страница руководителей проектов
        return <ProjectManagersList canEdit={canEdit} canCreate={canCreate} canDelete={canDelete} />;
      case 5: // Страница исполнителей
        return <ContractorsList canEdit={canEdit} canCreate={canCreate} canDelete={canDelete} />;
      case 6: // Страница пользователей
        return (
          <>
            {user && <UsersList currentUser={user} canEdit={canEdit} canCreate={canCreate} canDelete={canDelete} />}
            {/* Остальной код для case 6 будет добавлен ниже */}
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
