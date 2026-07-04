# GiftTrack

Веб-застосунок для відстеження повернення коштів за подарунок між двома користувачами.

## Швидкий старт

### 1. Налаштуйте Firebase

1. Перейдіть на [Firebase Console](https://console.firebase.google.com/)
2. Створіть новий проєкт
3. Увімкніть **Authentication** → Email/Password
4. Увімкніть **Firestore Database** (режим Production)
5. Скопіюйте конфіг свого веб-застосунку

### 2. Налаштуйте змінні середовища

```bash
cp .env.example .env.local
```

Відредагуйте `.env.local` та вставте свої Firebase credentials.

### 3. Встановіть правила безпеки Firestore

Скопіюйте вміст файлу `firestore.rules` у розділ **Firestore → Rules** у Firebase Console.

### 4. Запустіть застосунок

```bash
npm install
npm run dev
```

Відкрийте [http://localhost:5173](http://localhost:5173)

---

## Ролі користувачів

| Роль | Можливості |
|------|-----------|
| Дружина | Вносить платежі (статус: pending) |
| Чоловік | Підтверджує або відхиляє платежі |

Лише **підтверджені** платежі зменшують залишок боргу.

---

## Структура Firestore

```
users/{userId}
  - email, displayName, role, createdAt

gifts/{giftId}
  - name, description, totalAmount, currency, purchaseDate, createdBy, createdAt
  
  payments/{paymentId}
    - amount, comment, paymentDate, paymentMethod
    - status: pending / confirmed / rejected
    - createdBy, confirmedBy, confirmedAt, createdAt
```

---

## Стек

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Firebase Auth + Firestore
- React Hook Form + Zod
- React Router v6
- Sonner (notifications)
- Lucide React (icons)
