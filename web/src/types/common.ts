// Интерфейс для пользователя системы
export interface User {
    id: string;        // Уникальный идентификатор пользователя
    email: string;     // Email адрес пользователя
    role: string;      // Роль пользователя (admin, manager, user)
    isActive: boolean; // Активен ли пользователь
}

// Интерфейс для ответа сервера при авторизации
export interface LoginResponse {
    accessToken: string; // JWT токен для аутентификации
    user: User;          // Данные пользователя
}

// Интерфейс для описания структуры проекта
export interface Project {
    id: string;         // Уникальный идентификатор проекта
    name: string;        // Название проекта
    status: 'InProject' | 'InProgress' | 'Done' | 'HasProblems' | 'Archived'; // Статус проекта
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
export interface ProjectManager {
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
export interface SystemUser {
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
export interface Contractor {
    id: string;
    name: string;
    contactName: string;
    phone: string;
    email?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

