import { User } from '@/types/user';

export const usersData: User[] = [
  // ФТ-3-1 (ID: 1)
  {
    id: '1',
    name: 'Иван Иванов',
    email: 'ivan@example.com',
    isAdmin: false,
    groupId: '1',
  },
  {
    id: '2',
    name: 'Сидор Сидоров',
    email: 'sidor@example.com',
    isAdmin: false,
    groupId: '1',
  },
  {
    id: '3',
    name: 'Мария Кузнецова',
    email: 'maria@example.com',
    isAdmin: false,
    groupId: '1',
  },
  
  // ФТ-3-2 (ID: 2)
  {
    id: '4',
    name: 'Петр Петров',
    email: 'petr@example.com',
    isAdmin: false,
    groupId: '2',
  },
  {
    id: '5',
    name: 'Анна Смирнова',
    email: 'anna@example.com',
    isAdmin: false,
    groupId: '2',
  },
  
  // КН-3 (ID: 3)
  {
    id: '6',
    name: 'Алексей Попов',
    email: 'alex@example.com',
    isAdmin: false,
    groupId: '3',
  },
  {
    id: '7',
    name: 'Ольга Васильева',
    email: 'olga@example.com',
    isAdmin: false,
    groupId: '3',
  },
];
