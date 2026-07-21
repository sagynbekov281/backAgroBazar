"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const auth_1 = __importDefault(require("./routes/auth"));
const listings_1 = __importDefault(require("./routes/listings"));
const all_1 = require("./routes/all");
const socket_1 = require("./socket");
const db_1 = require("./db");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
app.use((0, cors_1.default)({ origin: process.env.CLIENT_URL || '*' }));
app.use(express_1.default.json({ limit: '10mb' }));
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'AgroBazar API' }));
app.use('/api/auth', auth_1.default);
app.use('/api/listings', listings_1.default);
app.use('/api/orders', all_1.ordersRouter);
app.use('/api/reviews', all_1.reviewsRouter);
app.use('/api/announcements', all_1.announcementsRouter);
app.use('/api/transport', all_1.transportRouter);
app.use('/api/prices', all_1.pricesRouter);
app.use('/api/chat', all_1.chatRouter);
app.use('/api/admin', all_1.adminRouter);
app.use((_req, res) => res.status(404).json({ message: 'Маршрут табылган жок' }));
const server = (0, http_1.createServer)(app);
const io = (0, socket_1.setupSocket)(server);
app.set('io', io);
// Сервер стартует сразу и открывает порт, не дожидаясь MongoDB.
// Если MongoDB зависнет или упадёт — сайт всё равно будет жив,
// просто данные не будут сохраняться, пока подключение не восстановится.
server.listen(PORT, () => {
    console.log(`🌱 AgroBazar API иштеп жатат: http://localhost:${PORT}`);
});
(0, db_1.initDb)().catch(err => {
    console.error('❌ MongoDB инициализация катасы:', err.message);
});
