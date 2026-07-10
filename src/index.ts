import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import authRoutes from './routes/auth';
import listingRoutes from './routes/listings';
import { ordersRouter, reviewsRouter, announcementsRouter, transportRouter, pricesRouter, chatRouter, adminRouter } from './routes/all';
import { setupSocket } from './socket';
import { initDb } from './db';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'AgroBazar API' }));

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/orders', ordersRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/transport', transportRouter);
app.use('/api/prices', pricesRouter);
app.use('/api/chat', chatRouter);
app.use('/api/admin', adminRouter);

app.use((_req, res) => res.status(404).json({ message: 'Маршрут табылган жок' }));

const server = createServer(app);
const io = setupSocket(server);
app.set('io', io);

// Сервер стартует сразу и открывает порт, не дожидаясь MongoDB.
// Если MongoDB зависнет или упадёт — сайт всё равно будет жив,
// просто данные не будут сохраняться, пока подключение не восстановится.
server.listen(PORT, () => {
  console.log(`🌱 AgroBazar API иштеп жатат: http://localhost:${PORT}`);
});

initDb().catch(err => {
  console.error('❌ MongoDB инициализация катасы:', err.message);
});