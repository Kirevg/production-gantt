// Функция для форматирования телефона для отображения
export const formatPhoneDisplay = (phone: string): string => {
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
export const formatPhoneInput = (value: string): string => {
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

