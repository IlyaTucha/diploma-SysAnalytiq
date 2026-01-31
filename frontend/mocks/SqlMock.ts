export const mockDatasets = {
  users: [
    { id: 1, name: 'Иван Петров', email: 'ivan@example.com', age: 25, city: 'Москва' },
    { id: 2, name: 'Мария Сидорова', email: 'maria@example.com', age: 30, city: 'Санкт-Петербург' },
    { id: 3, name: 'Петр Иванов', email: 'petr@example.com', age: 22, city: 'Казань' },
    { id: 4, name: 'Анна Смирнова', email: 'anna@example.com', age: 17, city: 'Москва' },
    { id: 5, name: 'Дмитрий Козлов', email: 'dmitry@example.com', age: 35, city: 'Екатеринбург' },
    { id: 6, name: 'Алексей Морозов', email: 'alex@example.com', age: 16, city: 'Новосибирск' },
  ],
  products: [
    { id: 1, name: 'Ноутбук', category: 'Электроника', price: 75000, stock: 15 },
    { id: 2, name: 'Смартфон', category: 'Электроника', price: 35000, stock: 30 },
    { id: 3, name: 'Книга "SQL для начинающих"', category: 'Книги', price: 890, stock: 50 },
    { id: 4, name: 'Наушники', category: 'Электроника', price: 5500, stock: 25 },
    { id: 5, name: 'Клавиатура', category: 'Электроника', price: 3200, stock: 20 },
  ],
  orders: [
    { id: 1, user_id: 1, product_id: 1, quantity: 1, total: 75000, status: 'Доставлен' },
    { id: 2, user_id: 2, product_id: 2, quantity: 2, total: 70000, status: 'В обработке' },
    { id: 3, user_id: 3, product_id: 3, quantity: 1, total: 890, status: 'Доставлен' },
    { id: 4, user_id: 1, product_id: 4, quantity: 1, total: 5500, status: 'Отправлен' },
    { id: 5, user_id: 4, product_id: 5, quantity: 1, total: 3200, status: 'Доставлен' },
  ],
};

export const schemaMetadata: Record<string, { pk: string[], fks: Record<string, string> }> = {
  users: {
    pk: ['id'],
    fks: {}
  },
  products: {
    pk: ['id'],
    fks: {}
  },
  orders: {
    pk: ['id'],
    fks: {
      user_id: 'users.id',
      product_id: 'products.id'
    }
  }
};