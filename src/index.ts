import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import listingRoutes from './routes/listings';
import { ordersRouter, reviewsRouter, announcementsRouter, transportRouter, pricesRouter, chatRouter, adminRouter } from './routes/all';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
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

app.listen(PORT, () => {
  console.log(`🌱 AgroBazar API иштеп жатат: http://localhost:${PORT}`);
});
