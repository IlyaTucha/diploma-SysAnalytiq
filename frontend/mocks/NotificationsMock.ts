import { User } from '@/types/user';
import { Notification } from '@/types/notification';

const mockReviewer: User = {
  id: '10',
  name: 'Иван Петров',
  email: 'ivan@example.com',
  avatar: '/images/minion.jpg',
  isAdmin: true
};

const mockReviewer2: User = {
  id: '11',
  name: 'Сергей Сергеев',
  email: 'sergey@example.com',
  avatar: '/images/minion.jpg',
  isAdmin: true
};

const mockReviewer3: User = {
  id: '12',
  name: 'Мария Сидорова',
  email: 'maria@example.com',
  avatar: '/images/minion.jpg',
  isAdmin: true
};

export const notificationsData: Notification[] = [
  {
    id: '1',
    type: 'approved',
    reviewer: mockReviewer,
    moduleName: 'SQL: Создание и выполнение SQL запросов',
    lessonTitle: 'Базовые запросы SELECT',
    reviewDate: new Date(Date.now() - 3600 * 1000).toISOString(), 
    generalComment: 'Отличная работа! Все запросы написаны корректно и оптимально.',
    lessonPath: '/lessons/sql-basics',
    isRead: false
  },
  {
    id: '3',
    type: 'rejected',
    reviewer: mockReviewer2,
    moduleName: 'Swagger: Описание API',
    lessonTitle: 'Описание эндпоинтов пользователей',
    reviewDate: new Date(Date.now() - 86400 * 1000).toISOString(),
    generalComment: 'В целом верно, но есть ошибка в обработке данных.',
    highlightedCode: 'paths:\n  /users:\n    post:\n      summary: Create user\n      responses:\n        \'200\':\n          description: OK',
    inlineComment: 'Для создания ресурса лучше использовать код 201 Created.',
    startLine: 12,
    endLine: 16,
    lessonPath: '/lessons/rest-api',
    isRead: false
  },
  {
    id: '4',
    type: 'approved',
    reviewer: mockReviewer3,
    moduleName: 'ERD: Проектирование баз данных',
    lessonTitle: 'Связи один-ко-многим',
    reviewDate: new Date(Date.now() - 172800 * 1000).toISOString(),
    lessonPath: '/lessons/erd-relationships',
    isRead: true
  }
];
