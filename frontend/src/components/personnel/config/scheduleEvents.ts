// src/config/scheduleEvents.ts

export const EVENT_COLORS: Record<string, string> = {
    duty: '#b0b0b0',
    vacation: '#b8c4b0',
    sick: '#c4b0b0',
    hospital: '#b0b8c4',
    business_trip: '#c4c0b0',
    inspection: '#b8b0c4',
    day_off: '#c0b8b0',
    study_leave: '#b0b8b8',
};

export const EVENT_LABELS: Record<string, string> = {
    duty: 'Дежурство',
    vacation: 'Отпуск',
    sick: 'Больничный',
    hospital: 'Госпиталь',
    business_trip: 'Командировка',
    inspection: 'Проверка',
    day_off: 'Отгул',
    study_leave: 'Учебный отпуск',
};

export const EVENT_SHORT_LABELS: Record<string, string> = {
    duty: 'Д',
    vacation: 'О',
    sick: 'Б',
    hospital: 'Г',
    business_trip: 'К',
    inspection: 'П',
    day_off: 'От',
    study_leave: 'УО',
};

// Приоритет для определения статуса в месячном режиме (чем меньше число, тем выше приоритет)
export const EVENT_PRIORITY: Record<string, number> = {
    vacation: 1,
    sick: 2,
    business_trip: 3,
    duty: 4,
    other: 5,  
    hospital: 6,
    inspection: 7,
    day_off: 8,
    study_leave: 9,
};