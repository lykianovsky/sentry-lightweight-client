# sentry-lightweight-client

Легковесный клиент для отправки ошибок в Sentry с поддержкой очередей, контекста и минимальной зависимости от SDK.

## 🚀 Установка

```bash
pnpm add sentry-lightweight-client
# или
npm install sentry-lightweight-client
# или
yarn add sentry-lightweight-client
```

## 🔧 Использование

### 1. Инициализация клиента

```ts
import { Client } from 'sentry-lightweight-client'

const sentryClient = new Client({
  dsn: 'https://<PUBLIC_KEY>@sentry.io/<PROJECT_ID>',
})
```

### 2. Простая отправка ошибки

```ts
sentryClient.capture(new Error('Something went wrong'))
sentryClient.capture('String-based error')
```

### 3. Отправка ошибок с дополнительным контекстом

```ts
sentryClient.capture(new Error('Something went wrong'), {
  extra: {
    userId: '123',
    feature: 'checkout',
  },
  tags: {
    env: 'production',
  },
  fingerprint: ['custom-fingerprint'],
})
```

---

## 📦 Интеграция с Next.js сервером

Библиотека может использоваться как реализация `Instrumentation.onRequestError` из `next/dist/server/instrumentation/types`:

```ts
import type { InstrumentationOnRequestError } from 'next/dist/server/instrumentation/types'
import { Client } from 'sentry-lightweight-client'

const client = new Client({ dsn: process.env.SENTRY_DSN! })

export const onRequestError: InstrumentationOnRequestError = (
  error,
  request,
  context,
) => {
  client.capture(error, {
    extra: {
      url: request.path,
      method: request.method,
      headers: request.headers,
      ...context,
    },
  })
}
```

---

## 🧱 Архитектура

- `Client`: основной класс, отвечающий за инициализацию и отправку ошибок.
- `HttpClient`: low-level HTTP POST-обертка.
- `InformationBuilder`: собирает payload ошибки в формат, понятный Sentry.
- `Queue`: очередь для последовательной отправки событий (например, при загрузке/нагрузке).

---

## ⚠️ Валидация DSN

Если DSN передан в неправильном формате — клиент выбросит исключение:

```
Invalid Sentry DSN - your_dsn_value. Check is dsn format valid
```

Ожидаемый формат:
```
https://<PUBLIC_KEY>@sentry.io/<PROJECT_ID>
```

---

## 📘 Пример в приложении

```ts
import { Client } from 'sentry-lightweight-client'
import { getEnvironment } from '@utils/guards/environment'
import { isString } from '@utils/guards/types'
import type { InstrumentationOnRequestError } from 'next/dist/server/instrumentation/types'

type RequestServerErrorParameters = Parameters<InstrumentationOnRequestError>

class Service {
  private readonly _client = new Client({ dsn: getEnvironment('SENTRY_DSN') })

  public capture(error: string | Error) {
    this._client.capture(error)
  }

  public captureServerHandlerError(
    error: RequestServerErrorParameters[0],
    request: RequestServerErrorParameters[1],
    context: RequestServerErrorParameters[2],
  ) {
    if (isString(error) || error instanceof Error) {
      this._client.capture(error, {
        extra: {
          url: request.path,
          method: request.method,
          headers: request.headers,
          ...context,
        },
      })
    }
  }
}

export const errorService = new Service()
```

---

## ✅ TODO / Возможности

- [x] Очередь отправки
- [x] Поддержка `extra`, `tags`, `fingerprint`
- [ ] Поддержка user context
- [ ] Retry при неудаче
- [ ] Браузерная сборка (если нужно)

---

## 🪪 License

MIT
