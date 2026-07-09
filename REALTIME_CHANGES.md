# Что добавлено в бекенд

## Новые файлы
- `src/socket.ts` — Socket.io сервер: онлайн-статусы, typing, доставка событий
- `src/routes/friends.ts` — система друзей (заявки, список, поиск)

## Изменённые файлы
- `src/db.ts` — у пользователя появились поля `online`, `lastSeen`, `friends[]`; новая коллекция `friendRequests`
- `src/index.ts` — сервер теперь через `http.createServer` + подключён Socket.io
- `src/routes/all.ts` (chatRouter) — сообщения теперь долетают через сокет мгновенно + добавлена отметка прочтения
- `package.json` — добавлена зависимость `socket.io`

Старый `db.json` совместим — при первом запуске недостающие поля докидываются автоматически.

## Новые REST-эндпоинты

**Друзья** (`/api/friends`, везде нужен `Authorization: Bearer <token>`):
- `GET /search?q=имя_или_телефон` — поиск пользователей
- `GET /` — список моих друзей (с `online`, `lastSeen`)
- `GET /requests` — входящие заявки
- `GET /requests/sent` — отправленные заявки
- `POST /requests` `{ toId }` — отправить заявку
- `POST /requests/:id/accept` — принять
- `POST /requests/:id/decline` — отклонить
- `DELETE /:userId` — удалить из друзей

**Чат** (`/api/chat`, без изменений в путях, но с доп. полями):
- `GET /rooms` — теперь возвращает `otherOnline`, `otherLastSeen` для каждой комнаты
- `POST /rooms/:roomId/read` — новый: отметить сообщения прочитанными

## Socket.io — подключение с фронта

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:4000/api", {
  auth: { token: localStorage.getItem("token") } // тот же JWT, что и для REST
});
```

## События с сервера (слушать через `socket.on(...)`)
- `new_message` — пришло новое сообщение `{ id, roomId, senderId, senderName, text, createdAt, read }`
- `friend_online` / `friend_offline` — `{ userId, lastSeen? }`
- `friends_status` — при подключении, разом статус всех друзей `[{ userId, online, lastSeen }]`
- `friend_request_received` — `{ id, fromId, fromName, ... }`
- `friend_request_accepted` — `{ by: { id, name } }`
- `friend_removed` — `{ userId }`
- `typing` / `stop_typing` — `{ roomId, userId }`
- `messages_read` — `{ roomId, by }`

## События на сервер (слать через `socket.emit(...)`)
- `typing` / `stop_typing` — `{ roomId }` (отправлять при вводе текста в чате)

Отправка самих сообщений и отметка прочтения остаются обычными REST-запросами (POST) —
сокет только мгновенно уведомляет второго участника, чтобы не было polling.

## Проверено
Полный сценарий (регистрация → поиск → заявка в друзья → принятие → чат →
сообщение долетает мгновенно по сокету → прочтение → онлайн/офлайн статус)
прогнан end-to-end и работает.

## Важно про архитектуру
БД сейчас — это один JSON-файл (`db.json`), который перезаписывается целиком на
каждое действие. Для демо/портфолио этого достаточно, но при реальной нагрузке
(много одновременных сообщений) возможны гонки при записи. Если проект пойдёт
дальше демо-стадии — стоит перейти на настоящую БД (Postgres/MongoDB).
