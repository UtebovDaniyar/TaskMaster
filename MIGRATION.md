# Миграция от Appwrite к современному стеку

## Что было заменено

### База данных
- ❌ **Appwrite Database** → ✅ **Neon PostgreSQL + Prisma ORM**
- Все коллекции Appwrite заменены на Prisma модели
- Автоматические миграции через Prisma
- Типобезопасные запросы

### Аутентификация
- ❌ **Appwrite Auth** → ✅ **NextAuth.js v5 (Auth.js)**
- OAuth провайдеры (Google)
- JWT токены + HTTP-only cookies
- Автоматическое управление сессиями

### Файловое хранилище
- ❌ **Appwrite Storage** → ✅ **UploadThing**
- Интеграция с Next.js App Router
- Автоматическая оптимизация изображений
- CDN доставка

### Кэширование
- ✅ **Redis (Upstash)** - для сессий и кэша
- ✅ **React Query** - клиентское кэширование

## Изменения в коде

### 1. Типы данных
```typescript
// Было (Appwrite)
import { Models } from "node-appwrite";
export type Workspace = Models.Document & {
  name: string;
  imageUrl: string;
};

// Стало (Prisma)
import { Workspace as PrismaWorkspace } from "@prisma/client";
export type Workspace = PrismaWorkspace;
```

### 2. Запросы к базе данных
```typescript
// Было (Appwrite)
const workspaces = await databases.listDocuments(
  DATABASE_ID,
  WORKSPACES_ID,
  [Query.equal("userId", user.$id)]
);

// Стало (Prisma)
const workspaces = await prisma.workspace.findMany({
  where: {
    members: {
      some: {
        userId: user.id,
      },
    },
  },
});
```

### 3. Аутентификация
```typescript
// Было (Appwrite)
const { account } = await createSessionClient();
const user = await account.get();

// Стало (NextAuth)
const user = await getCurrentUser();
```

### 4. Загрузка файлов
```typescript
// Было (Appwrite)
const file = await storage.createFile(BUCKET_ID, ID.unique(), image);

// Стало (UploadThing)
<ImageUploadButton 
  onUploadComplete={(url) => setImageUrl(url)}
/>
```

## Настройка окружения

Обновите `.env` файл:

```env
# База данных
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# UploadThing
UPLOADTHING_SECRET="..."
UPLOADTHING_APP_ID="..."

# Redis
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
```

## Команды для запуска

```bash
# Установка зависимостей
npm install

# Генерация Prisma клиента
npx prisma generate

# Применение схемы к БД
npx prisma db push

# Запуск проекта
npm run dev
```

## Преимущества новой архитектуры

1. **Типобезопасность** - Prisma обеспечивает полную типобезопасность
2. **Производительность** - PostgreSQL + Redis для оптимальной скорости
3. **Масштабируемость** - Современный стек легко масштабируется
4. **DX (Developer Experience)** - Лучшие инструменты разработки
5. **Безопасность** - NextAuth.js обеспечивает enterprise-уровень безопасности

## Что нужно доделать

- [ ] Реализовать загрузку изображений через UploadThing в формах
- [ ] Добавить email/password аутентификацию (опционально)
- [ ] Настроить production окружение
- [ ] Добавить мониторинг и логирование 