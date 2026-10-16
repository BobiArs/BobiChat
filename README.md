<p align="center">
  <img src="assets/images/icons/BobiChatIcon.png" width="280" style="margin-top: 45px;"  alt="BobiChat Logo" />
</p>

<h1 align="center">BobiChat</h1>

<p align="center">
  <strong>Сучасний мобільний месенджер з підтримкою дзвінків 1080p/60FPS FREE</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-SDK_57-000020?logo=expo&logoColor=white" alt="Expo SDK 57" />
  <img src="https://img.shields.io/badge/React_Native-0.86-61DAFB?logo=react&logoColor=white" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-7.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-13.0-FFCA28?logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
</p>

---

## 📖 Зміст

- [Про проєкт](#-про-проєкт)
- [Ключові можливості](#-ключові-можливості)
- [Технологічний стек](#-технологічний-стек)
- [Архітектура даних](#-архітектура-даних)
- [Структура проєкту](#-структура-проєкту)
- [🔑 Налаштування Firebase та змінних оточення](#-налаштування-firebase-та-змінних-оточення)
- [Встановлення та запуск](#-встановлення-та-запуск)
- [Ліцензія](#-ліцензія)

---

## 🚀 Про проєкт

**BobiChat** — це повнофункціональний мобільний месенджер, побудований на **Expo / React Native**. Додаток дозволяє обмінюватись текстовими повідомленнями, фотографіями, стікерами та емодзі, здійснювати аудіо- та відеодзвінки з підтримкою якості до **1080p при 60 FPS**, а також демонструвати екран у реальному часі. Усі повідомлення синхронізуються між пристроями через **Cloud Firestore**, а профілі та сесії зберігаються локально в **SQLite** для миттєвого оффлайн-доступу.

Додаток має темну кольорову схему у стилі «warm dark» з золотисто-помаранчевим акцентом (`#E89D43`), що забезпечує комфортне використання у будь-який час доби.

---

## ✨ Ключові можливості

### 💬 Повідомлення та чат

- **Текстові повідомлення** з синхронізацією в реальному часі через Cloud Firestore
- **Надсилання фотографій** із галереї пристрою (вибір через Image Picker, конвертація у Base64)
- **Стікери та емодзі** — вбудований каталог стікерів із категоріями: Маскоти 🐶, Реакції 🔥, Фан 🎮, Фрази 💬
- **Реакції на повідомлення** — швидкі емодзі-реакції (❤️ 🔥 👍 😂 😮 😢 🎉 🫡) на будь-яке повідомлення
- **Редагування повідомлень** — можливість редагувати свої текстові повідомлення протягом 7 днів від дати надсилання
- **Видалення повідомлень** — «Видалити у себе» або «Видалити для всіх» з повним очищенням у Firestore
- **Повноекранний перегляд фото** — натисніть на зображення для його збільшення

### 📞 Дзвінки та стрімінг

- **Аудіодзвінки** — голосові дзвінки зі стабільним P2P-з'єднанням
- **Відеодзвінки** — камера з підтримкою роздільної здатності до 1080p при 60 FPS
- **Демонстрація екрана** — трансляція екрана в реальному часі через P2P-тунель (1080p/60FPS)
- **Управління дзвінком** — перемикання мікрофона, камери та режиму демонстрації екрана

### 👥 Друзі та контакти

- **Пошук користувачів** — пошук за ім'ям, тегом або email по базі Cloud Firestore
- **Система запитів у друзі** — надсилання, прийняття та відхилення запитів із push-сповіщеннями в реальному часі (Firestore `onSnapshot`)
- **QR-код профілю** — унікальний QR-код для швидкого додавання у друзі
- **Сканер QR-кодів** — сканування QR-кодів інших користувачів BobiChat через камеру

### 🏠 Сервери та канали

- **Створення серверів** — спільноти для великого числа користувачів
- **Текстові канали** (`#`) — окремі чати для обговорень у межах сервера
- **Голосові кімнати** (🔊) — голосові канали з індикацією якості 1080p 60FPS

### 👤 Профіль користувача

- **Редагування профілю** — зміна нікнейму, кастомного статусу та фото профілю (вибір із галереї)
- **Мережеві статуси** — «В мережі» 🟢, «Не турбувати» 🔴, «Невидимий» 👻
- **Унікальний тег** — кожен користувач отримує персональний 4-значний тег (напр. `#4281`)
- **Перегляд чужих профілів** — натискання на аватар показує повну картку профілю з кнопками дій

### 📌 Обране (Збережені повідомлення)

- **Персональний блокнот** — чат «Обране» (🔖) для збереження нотаток, фотографій та будь-яких повідомлень
- **Доступ через меню** — відкривається через кнопку «⋮» у правому верхньому куті списку чатів

### 🔐 Аутентифікація

- **Email + пароль** — реєстрація та вхід через Firebase Authentication
- **Google Sign-In** — авторизація через Google акаунт (OAuth 2.0 через `expo-auth-session`)
- **Персистентні сесії** — стан авторизації зберігається через AsyncStorage, автоматичний вхід при повторних запусках

---

## 🔧 Технологічний стек

### Ядро

| Технологія                                        | Версія            | Опис                                                            |
| ------------------------------------------------- | ----------------- | --------------------------------------------------------------- |
| **[Expo](https://expo.dev/)**                     | SDK 57 (~57.0.27) | Платформа для побудови React Native додатків без нативного коду |
| **[React Native](https://reactnative.dev/)**      | 0.86.3            | Фреймворк для кросплатформної мобільної розробки                |
| **[React](https://react.dev/)**                   | 19.2.3            | Бібліотека для побудови UI                                      |
| **[TypeScript](https://www.typescriptlang.org/)** | 7.x               | Строга типізація для JavaScript                                 |
| **[Expo Router](https://docs.expo.dev/router/)**  | ~57.0.25          | Файлова навігація (File-based routing)                          |

### Backend та бази даних

| Технологія                                                                      | Опис                                                                                          |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------- |
| **[Firebase Auth](https://firebase.google.com/docs/auth)**                      | Аутентифікація (Email/Password + Google OAuth)                                                |
| **[Cloud Firestore](https://firebase.google.com/docs/firestore)**               | Хмарна NoSQL-база для синхронізації повідомлень, профілів та запитів у друзі в реальному часі |
| **[Firebase Storage](https://firebase.google.com/docs/storage)**                | Хмарне сховище (підготовлено для медіа-файлів)                                                |
| **[expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/)**            | Локальна SQLite база для офлайн-first зберігання даних                                        |
| **[AsyncStorage](https://react-native-async-storage.github.io/async-storage/)** | v3 (3.1.1)                                                                                    | Персистентність Firebase Auth сесій |

### UI та стилізація

| Технологія                                                                                   | Опис                                                    |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------- |
| **[NativeWind](https://www.nativewind.dev/)** v4                                             | TailwindCSS для React Native (utility-first стилізація) |
| **[TailwindCSS](https://tailwindcss.com/)** v3                                               | CSS-фреймворк (генерація класів для NativeWind)         |
| **[Lucide React Native](https://lucide.dev/)**                                               | Набір 1000+ SVG-іконок                                  |
| **[expo-image](https://docs.expo.dev/versions/latest/sdk/image/)**                           | Оптимізований компонент для рендерингу зображень        |
| **[React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)** v4        | Анімації на нативному потоці                            |
| **[React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)** | v3 (3.3.0)                                              | Нативна обробка жестів |

### Медіа та камера

| Технологія                                                                             | Опис                                             |
| -------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **[expo-camera](https://docs.expo.dev/versions/latest/sdk/camera/)**                   | Доступ до камери пристрою (QR-сканер)            |
| **[expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)**        | Вибір фото/відео з галереї та камери             |
| **[expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/)**          | Робота з файловою системою, конвертація в Base64 |
| **[react-native-qrcode-svg](https://github.com/awesomejerry/react-native-qrcode-svg)** | Генерація QR-кодів для профілю користувача       |
| **[react-native-svg](https://github.com/software-mansion/react-native-svg)**           | SVG-рендеринг (іконки, QR-коди)                  |

### Утиліти

| Технологія                                                                       | Опис                                    |
| -------------------------------------------------------------------------------- | --------------------------------------- |
| **[uuid](https://github.com/uuidjs/uuid)**                                       | Генерація унікальних ідентифікаторів    |
| **[expo-auth-session](https://docs.expo.dev/versions/latest/sdk/auth-session/)** | OAuth 2.0 авторизація (Google Sign-In)  |
| **[expo-web-browser](https://docs.expo.dev/versions/latest/sdk/webbrowser/)**    | Відкриття веб-сторінок для OAuth-потоку |
| **[expo-crypto](https://docs.expo.dev/versions/latest/sdk/crypto/)**             | Криптографічні утиліти                  |
| **[expo-constants](https://docs.expo.dev/versions/latest/sdk/constants/)**       | Доступ до системних констант            |

### Збірка та DevTools

| Технологія                                                 | Опис                                               |
| ---------------------------------------------------------- | -------------------------------------------------- |
| **[EAS Build](https://docs.expo.dev/build/introduction/)** | Хмарна збірка додатку (dev / preview / production) |
| **[ESLint](https://eslint.org/)** v10                      | Лінтинг коду з конфігурацією `eslint-config-expo`  |
| **[Metro](https://metrobundler.dev/)**                     | Збирач JavaScript-бандлів для React Native         |

---

## 🗄️ Архітектура даних

BobiChat використовує **Offline-First** підхід з двошаровою синхронізацією:

```
┌─────────────────────────────────────────────────────────┐
│                    Користувач                           │
│                        │                                │
│  ┌─────────────────────┼────────────────────────┐       │
│  │        SQLite (локальна, миттєва)            │       │
│  │  • users — профілі та акаунти                │       │
│  │  • active_session — поточна сесія            │       │
│  │  • chats — список чатів та DM               │       │
│  │  • messages — повідомлення (з реакціями)     │       │
│  │  • servers — сервери спільнот                │       │
│  │  • channels — канали серверів                │       │
│  │  • sync_events — журнал P2P-подій            │       │
│  └─────────────────────┼────────────────────────┘       │
│                        │ синхронізація                   │
│  ┌─────────────────────┼────────────────────────┐       │
│  │     Cloud Firestore (хмарна, real-time)      │       │
│  │  • users/{uid} — профілі у хмарі            │       │
│  │  • chats/{roomId}/messages — повідомлення    │       │
│  │  • friend_requests/{id} — запити у друзі     │       │
│  └──────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

**Принцип роботи:**

1. **Запис** — спочатку оптимістично зберігається у SQLite (миттєва відповідь UI), потім асинхронно відправляється у Firestore
2. **Читання** — при відкритті чату дані моментально підвантажуються з SQLite, потім Firestore `onSnapshot` синхронізує нові/змінені/видалені повідомлення
3. **Firestore Room ID** — для DM-чатів використовується детермінований ідентифікатор `dm_{sortedId1}_{sortedId2}`, щоб обидва співрозмовники бачили одну й ту ж кімнату

---

## 📂 Структура проєкту

```
BobiChat/
├── src/                          # Основний вихідний код
│   ├── app/                      # Expo Router — екрани та навігація
│   │   ├── _layout.tsx           # Кореневий layout (SafeAreaProvider, Stack, ініціалізація БД)
│   │   └── index.tsx             # Головний екран: оркестрація стану, модалки, навігація між чатами
│   │
│   ├── database/                 # Локальна база даних
│   │   └── db.ts                 # Ініціалізація SQLite, створення таблиць, міграції колонок
│   │
│   └── services/                 # Бізнес-логіка та сервіси
│       ├── firebase.ts           # Ініціалізація Firebase App, Auth, Firestore, Storage
│       ├── authService.ts        # Сервіс аутентифікації: реєстрація, вхід, профіль, система друзів
│       ├── storageService.ts     # Конвертація медіа-файлів у Base64 Data URL
│       └── p2pEngine.ts          # P2P-движок синхронізації подій між пристроями
│
├── components/                   # UI-компоненти (розділені за доменами)
│   ├── auth/
│   │   └── AuthModal.tsx         # Модальне вікно авторизації (Email + Google Sign-In)
│   │
│   ├── chat/
│   │   └── ChatArea.tsx          # Область чату: список повідомлень, поле вводу, стікери, реакції,
│   │                             #   редагування, видалення, перегляд фото, шапка з кнопками дзвінків
│   │
│   ├── common/
│   │   └── GoogleIcon.tsx        # SVG-іконка Google для кнопки авторизації
│   │
│   ├── friends/
│   │   └── AddFriendsModal.tsx   # Модалка додавання друзів: пошук, вхідні запити, QR-код, QR-сканер
│   │
│   ├── media/
│   │   └── CallOverlay.tsx       # Оверлей дзвінка: відео/аудіо/демонстрація екрана, управління
│   │
│   ├── profile/
│   │   ├── ProfileModal.tsx      # Модалка налаштувань свого профілю (нікнейм, статус, аватар, вихід)
│   │   └── UserProfileModal.tsx  # Модалка перегляду чужого профілю (дані, дії: написати/зателефонувати)
│   │
│   └── sidebar/
│       ├── ServerSidebar.tsx     # Ліва вузька панель: перемикач DM ↔ Сервери, список серверів, «+»
│       └── ChannelList.tsx       # Список чатів/каналів, меню «⋮» (Обране, друзі, налаштування),
│                                 #   панель профілю внизу, модалки дій над чатом
│
├── hooks/                        # Кастомні React-хуки
│   └── useLocalChat.ts           # Хук синхронізації повідомлень: SQLite ↔ Firestore onSnapshot,
│                                 #   надсилання, редагування, реакції, видалення з дедуплікацією
│
├── assets/                       # Статичні ресурси
│   ├── images/                   # Іконки додатку, splash-screen, фавікон
│   │   ├── icon.png              # Головна іконка додатку
│   │   ├── splash-icon.png       # Зображення splash-екрана
│   │   ├── android-icon-*.png    # Adaptive Icon для Android (foreground/background/monochrome)
│   │   ├── favicon.png           # Фавікон для веб-версії
│   │   └── logo-glow.png         # Логотип зі світінням
│   └── expo.icon/                # Іконка для iOS (Expo формат)
│
├── app.json                      # Конфігурація Expo: назва, іконки, плагіни, EAS project ID
├── eas.json                      # Профілі EAS Build: development, preview, production
├── package.json                  # Залежності, скрипти запуску
├── tsconfig.json                 # Конфігурація TypeScript з path aliases (@/* → ./src/*)
├── tailwind.config.js            # Конфігурація TailwindCSS з кастомною палітрою «bobi»
├── babel.config.js               # Babel-конфігурація з пресетом NativeWind
├── metro.config.js               # Metro bundler з підтримкою NativeWind CSS
├── eslint.config.js              # Конфігурація ESLint (eslint-config-expo)
├── global.css                    # Глобальні CSS-стилі (Tailwind base/components/utilities)
├── google-services.json          # Конфігурація Firebase для Android
├── expo-env.d.ts                 # Типи оточення Expo
├── nativewind-env.d.ts           # Типи NativeWind для TypeScript
├── AGENTS.md                     # Інструкції для AI-агентів по роботі з проєктом
├── LICENSE                       # Ліцензія MIT
└── README.md                     # Цей файл
```

---

## 🎨 Дизайн-система

BobiChat використовує кастомну темну кольорову палітру `bobi`, визначену у `tailwind.config.js`:

| Токен            | Колір     | Використання                                                         |
| ---------------- | --------- | -------------------------------------------------------------------- |
| `bobi-bg`        | `#1E1A17` | Основний темний фон додатку                                          |
| `bobi-card`      | `#2A2420` | Фон карток, чатів, модальних вікон                                   |
| `bobi-secondary` | `#3A322C` | Бордери, другорядні елементи, hover-стани                            |
| `bobi-accent`    | `#E89D43` | Золотисто-помаранчевий акцент (кнопки, активні елементи, індикатори) |
| `bobi-warm`      | `#C89968` | М'який бежевий (другорядні іконки)                                   |
| `bobi-text`      | `#F4EAE1` | Основний текст                                                       |
| `bobi-subtext`   | `#A6988B` | Другорядний текст, підписи                                           |

---

---

## 🔑 Налаштування Firebase та змінних оточення

> **Важливо:** Файл `.env` з реальними ключами **не включений до репозиторію** з міркувань безпеки. Вам потрібно створити власний Firebase проєкт та налаштувати змінні оточення.

### Крок 1 — Створіть Firebase проєкт

1. Перейдіть на [Firebase Console](https://console.firebase.google.com/)
2. Натисніть **"Add project"** → введіть назву → підтвердіть
3. Увімкніть потрібні сервіси:
   - **Authentication** → Sign-in method → увімкніть `Email/Password` та `Google`
   - **Firestore Database** → Create database → вибрати регіон
   - **Storage** → Get started

### Крок 2 — Отримайте Web SDK ключі

1. У Firebase Console → **Налаштування проєкту** (⚙️ біля назви проєкту) → вкладка **"Загальні"**
2. Прокрутіть вниз до **"Ваші застосунки"** → натисніть **`</>`** (Web)
3. Введіть назву застосунку → **"Register app"**
4. Скопіюйте об'єкт `firebaseConfig` — він містить усі необхідні ключі

```js
// Приклад того, що ви побачите:
const firebaseConfig = {
  apiKey: "AIzaSy...", // → EXPO_PUBLIC_FIREBASE_API_KEY
  authDomain: "proj.firebaseapp.com", // → EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId: "your-project-id", // → EXPO_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: "proj.firebasestorage.app", // → EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456789", // → EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123:web:abc", // → EXPO_PUBLIC_FIREBASE_APP_ID
  measurementId: "G-XXXXXXX", // → EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};
```

### Крок 3 — Отримайте Google Web Client ID (для Google Sign-In)

1. У Firebase Console → **Authentication** → **Sign-in method** → **Google** → увімкніть
2. Розгорніть розділ **"Web SDK configuration"** → скопіюйте **Web client ID**
3. АБО: [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials** → знайдіть OAuth 2.0 Client ID з типом "Web client"

### Крок 4 — Налаштуйте файл `.env`

```bash
# Скопіюйте шаблон
cp .env.example .env
```

Відкрийте `.env` та замініть усі `your_..._here` значення на реальні ключі з попередніх кроків:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
```

### Крок 5 — Налаштуйте `google-services.json` (для Android)

1. У Firebase Console → **Налаштування проєкту** → вкладка **"Загальні"**
2. У розділі **"Ваші застосунки"** натисніть **"Add app"** → Android
3. Package name: `com.bobichat.app` (або ваш власний, якщо ви форкнули)
4. Завантажте `google-services.json` та покладіть його до **кореневої папки** проєкту

> ⚠️ **`google-services.json` також захищений `.gitignore`** і не потрапить у репозиторій. Кожен розробник завантажує його вручну з Firebase Console.

### Крок 6 — Налаштуйте правила Firestore

У Firebase Console → **Firestore Database** → **Rules**, встановіть базові правила:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🛠 Встановлення та запуск

### Передумови

- **Node.js** рекомендовано v24.22
- **npm** або **bun** (якщо є `bun.lock`)
- **Expo CLI** — встановлюється автоматично через `npx`
- **Android Studio / Xcode** — для запуску на емуляторі (або Expo Go для базового тестування на ваших пристроях)

### Установка

```bash
# 1. Клонувати репозиторій
git clone https://github.com/BobiArs/BobiChat.git
cd BobiChat

# 2. Встановити залежності
npm install

# 3. Запустити dev-сервер Expo
npx expo start
```

### Корисні команди

```bash
npx expo start              # Запуск dev-сервера
npx expo start --android    # Запуск на Android
npx expo start --ios        # Запуск на iOS
npx expo start --web        # Запуск у браузері

npx expo install <package>  # Встановити пакет з SDK-сумісною версією
npx expo lint               # Перевірка лінтером
npx tsc --noEmit            # Перевірка типів TypeScript
npx expo-doctor             # Діагностика залежностей

# EAS Build (хмарна збірка)
npx eas-cli build --profile development   # Dev-збірка
npx eas-cli build --profile preview       # Preview APK
npx eas-cli build --profile production    # Production збірка
```

---

## 🗺️ Майбутній функціонал (Roadmap)

- [ ] **Голосові повідомлення** — запис та відтворення аудіо-повідомлень
- [ ] **Відео-кружки** — запис коротких (до 1.3 хв) круглих відео з можливістю перемикання камери
- [ ] **Відповіді на повідомлення** — довге натискання → «Відповісти», прикріплення цитати
- [ ] **Закріплення повідомлень** — pin-повідомлення у верхній частині чату
- [ ] **Надсилання відео та файлів** — повна підтримка мультимедійних вкладень
- [ ] **WebRTC P2P-дзвінки** — реальне peer-to-peer з'єднання для аудіо/відео через WebRTC
- [ ] **Push-сповіщення** — FCM/APNs нотифікації про нові повідомлення та дзвінки
- [ ] **Створення серверів/груп** — повноцінний UI для створення та управління серверами
- [ ] **Демонстрація екрана** — вибір роздільної здатності: 720p/30fps, 720p/60fps, 1080p/60fps
- [ ] **SQLite обране** — переведення чату "Обране" на чисто SQLite, без Firebase, Firestore

---

## 📄 Ліцензія

Цей проєкт розповсюджується під ліцензією **MIT**. Дивіться файл [LICENSE](LICENSE) для деталей.

---

<p align="center">
  <strong>BobiChat</strong> — зроблено з ❤️ та ☕ + 🌙
</p>
