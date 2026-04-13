export interface User {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  vkProfileUrl: string;
  telegramUsername: string;
  telegramNotifications: boolean;
  avatar?: string;
  isAdmin: boolean;
  groupId?: string;
  groupName?: string;
}
