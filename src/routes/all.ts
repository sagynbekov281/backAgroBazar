import { Router } from 'express';
import { nanoid } from 'nanoid';
import { readDb, writeDb } from '../db';
import { auth, AR } from '../middleware/auth';

/* ── ORDERS ── */
export const ordersRouter = Router();

ordersRouter.post('/', auth, (req: AR, res) => {
  const db = readDb();
  const buyer = db.users.find(u => u.id === req.userId);
  if (!buyer) return res.status(401).json({ message: 'Авторизация талап кылынат' });
  const { listingId, qty, address, phone, comment, deliveryDate, paymentMethod } = req.body;
  const listing = db.listings.find(l => l.id === listingId);
  if (!listing) return res.status(404).json({ message: 'Жарыя табылган жок' });
  const order = { id: nanoid(), listingId, listingTitle: listing.title, listingImage: listing.images[0], buyerId: buyer.id, buyerName: buyer.name, sellerId: listing.ownerId, qty: Number(qty), unit: listing.unit, price: listing.price, total: listing.price * Number(qty), address: address || '', phone: phone || buyer.phone, comment, deliveryDate, paymentMethod: paymentMethod || 'cash', status: 'new', createdAt: new Date().toISOString() };
  db.orders.push(order); writeDb(db);
  res.status(201).json({ order });
});

ordersRouter.get('/mine', auth, (req: AR, res) => {
  const db = readDb();
  res.json({ orders: db.orders.filter(o => o.buyerId === req.userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
});

ordersRouter.get('/seller', auth, (req: AR, res) => {
  const db = readDb();
  res.json({ orders: db.orders.filter(o => o.sellerId === req.userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
});

/* ── REVIEWS ── */
export const reviewsRouter = Router();

reviewsRouter.get('/:targetId', (req, res) => {
  const db = readDb();
  res.json({ reviews: db.reviews.filter(r => r.targetId === req.params.targetId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
});

reviewsRouter.post('/', auth, (req: AR, res) => {
  const db = readDb();
  const author = db.users.find(u => u.id === req.userId);
  if (!author) return res.status(401).json({ message: 'Авторизация талап кылынат' });
  const { targetId, rating, comment } = req.body;
  const review = { id: nanoid(), authorId: author.id, authorName: author.name, targetId, rating: Number(rating), comment: comment || '', createdAt: new Date().toISOString() };
  db.reviews.push(review);
  const userReviews = db.reviews.filter(r => r.targetId === targetId);
  const target = db.users.find(u => u.id === targetId);
  if (target) { target.rating = userReviews.reduce((s, r) => s + r.rating, 0) / userReviews.length; target.reviewCount = userReviews.length; }
  writeDb(db); res.status(201).json({ review });
});

/* ── ANNOUNCEMENTS ── */
export const announcementsRouter = Router();

announcementsRouter.get('/', (req, res) => {
  const db = readDb();
  let list = [...db.announcements].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const { category, region } = req.query;
  if (category) list = list.filter(a => a.category === category);
  if (region) list = list.filter(a => a.region.includes(String(region)));
  res.json({ announcements: list });
});

announcementsRouter.post('/', auth, (req: AR, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.userId);
  if (!user) return res.status(401).json({ message: 'Авторизация талап кылынат' });
  const { title, category, qty, unit, region, description, deadline } = req.body;
  const ann = { id: nanoid(), authorId: user.id, authorName: user.name, authorRole: user.role, title, category: category || 'vegetables', qty: Number(qty), unit: unit || 'кг', region: region || '', description: description || '', deadline, status: 'open', offerCount: 0, createdAt: new Date().toISOString() };
  db.announcements.push(ann); writeDb(db); res.status(201).json({ announcement: ann });
});

announcementsRouter.get('/mine', auth, (req: AR, res) => {
  const db = readDb();
  res.json({ announcements: db.announcements.filter(a => a.authorId === req.userId) });
});

/* ── TRANSPORT ── */
export const transportRouter = Router();

transportRouter.get('/', (req, res) => {
  const db = readDb();
  let list = [...db.transports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const { region, type } = req.query;
  if (region) list = list.filter(t => t.region.includes(String(region)));
  if (type) list = list.filter(t => t.type === type);
  res.json({ transports: list });
});

transportRouter.post('/', auth, (req: AR, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.userId);
  if (!user) return res.status(401).json({ message: 'Авторизация талап кылынат' });
  const { type, capacity, route, availableDates, region, price } = req.body;
  const t = { id: nanoid(), ownerId: user.id, ownerName: user.name, ownerPhone: user.phone, type: type || 'truck', capacity: capacity || '', route: route || '', availableDates: availableDates || '', region: region || '', price: price ? Number(price) : undefined, createdAt: new Date().toISOString() };
  db.transports.push(t); writeDb(db); res.status(201).json({ transport: t });
});

/* ── PRICES ── */
export const pricesRouter = Router();
pricesRouter.get('/', (req, res) => { const db = readDb(); res.json({ prices: db.prices }); });

/* ── ADMIN ── */
export const adminRouter = Router();
adminRouter.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'admin' });
});

/* ── CHAT ── */
export const chatRouter = Router();

chatRouter.post('/start', auth, (req: AR, res) => {
  const db = readDb();
  const me = db.users.find(u => u.id === req.userId);
  const other = db.users.find(u => u.id === req.body.userId);
  if (!me || !other) return res.status(404).json({ message: 'Колдонуучу табылган жок' });
  let room = db.rooms.find(r => !r.isGroup && r.participants.some(p => p.id === me.id) && r.participants.some(p => p.id === other.id));
  if (!room) {
    room = { id: nanoid(), isGroup: false, participants: [{ id: me.id, name: me.name }, { id: other.id, name: other.name }], createdAt: new Date().toISOString() };
    db.rooms.push(room); writeDb(db);
  }
  res.json({ roomId: room.id });
});

chatRouter.post('/groups', auth, (req: AR, res) => {
  const db = readDb();
  const me = db.users.find(u => u.id === req.userId);
  if (!me) return res.status(401).json({ message: 'Авторизация талап кылынат' });
  const { name, userIds } = req.body as { name: string; userIds: string[] };
  if (!name?.trim()) return res.status(400).json({ message: 'Топтун атын жазыңыз' });
  const ids = Array.from(new Set([...(userIds || []), me.id]));
  const participants = ids
    .map(id => db.users.find(u => u.id === id))
    .filter(Boolean)
    .map(u => ({ id: u!.id, name: u!.name }));
  if (participants.length < 2) return res.status(400).json({ message: 'Жок дегенде дагы бир мүчө кошуңуз' });
  const room: any = {
    id: nanoid(), isGroup: true, name: name.trim(), ownerId: me.id,
    participants, createdAt: new Date().toISOString(),
  };
  db.rooms.push(room); writeDb(db);
  res.status(201).json({ room });
});

chatRouter.post('/groups/:roomId/members', auth, (req: AR, res) => {
  const db = readDb();
  const room = db.rooms.find(r => r.id === req.params.roomId);
  if (!room || !room.isGroup) return res.status(404).json({ message: 'Топ табылган жок' });
  const user = db.users.find(u => u.id === req.body.userId);
  if (!user) return res.status(404).json({ message: 'Колдонуучу табылган жок' });
  if (!room.participants.some(p => p.id === user.id)) {
    room.participants.push({ id: user.id, name: user.name });
    writeDb(db);
  }
  res.json({ room });
});

chatRouter.get('/rooms', auth, (req: AR, res) => {
  const db = readDb();
  const rooms = db.rooms.filter(r => r.participants.some(p => p.id === req.userId)).map(r => {
    const msgs = db.messages.filter(m => m.roomId === r.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const unread = msgs.filter(m => m.senderId !== req.userId && !(m.readBy || []).includes(req.userId!)).length;
    return { ...r, lastMessage: msgs[0]?.deleted ? 'Билдирүү өчүрүлгөн' : msgs[0]?.text, lastAt: msgs[0]?.createdAt, unread };
  }).sort((a, b) => new Date(b.lastAt || b.createdAt).getTime() - new Date(a.lastAt || a.createdAt).getTime());
  res.json({ rooms });
});

chatRouter.get('/rooms/:roomId/messages', auth, (req: AR, res) => {
  const db = readDb();
  const room = db.rooms.find(r => r.id === req.params.roomId);
  if (!room || !room.participants.some(p => p.id === req.userId)) return res.status(403).json({ message: 'Укук жок' });
  const msgs = db.messages.filter(m => m.roomId === req.params.roomId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  res.json({ messages: msgs });
});

chatRouter.post('/rooms/:roomId/messages', auth, (req: AR, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.userId);
  if (!user) return res.status(401).json({ message: 'Авторизация талап кылынат' });
  const room = db.rooms.find(r => r.id === req.params.roomId);
  if (!room || !room.participants.some(p => p.id === user.id)) return res.status(403).json({ message: 'Укук жок' });
  const { text, replyTo, type, fileUrl } = req.body;
  const msg = { id: nanoid(), roomId: String(req.params.roomId), senderId: user.id, senderName: user.name, text: text || '', createdAt: new Date().toISOString(), read: false, readBy: [user.id], replyTo, type: type || 'text', fileUrl };
  db.messages.push(msg); writeDb(db);
  const io = req.app.get('io');
  if (io) io.to(`room:${room.id}`).emit('message:new', msg);
  res.status(201).json({ message: msg });
});

chatRouter.post('/rooms/:roomId/read', auth, (req: AR, res) => {
  const db = readDb();
  const room = db.rooms.find(r => r.id === req.params.roomId);
  if (!room || !room.participants.some(p => p.id === req.userId)) return res.status(403).json({ message: 'Укук жок' });
  let changed = false;
  db.messages.forEach(m => {
    if (m.roomId === req.params.roomId && m.senderId !== req.userId) {
      m.readBy = m.readBy || [];
      if (!m.readBy.includes(req.userId!)) { m.readBy.push(req.userId!); m.read = true; changed = true; }
    }
  });
  if (changed) writeDb(db);
  const io = req.app.get('io');
  if (io) io.to(`room:${room.id}`).emit('message:read', { roomId: room.id, userId: req.userId });
  res.json({ success: true });
});

chatRouter.delete('/rooms/:roomId/messages/:messageId', auth, (req: AR, res) => {
  const db = readDb();
  const msg = db.messages.find(m => m.id === req.params.messageId && m.roomId === req.params.roomId);
  if (!msg) return res.status(404).json({ message: 'Билдирүү табылган жок' });
  if (msg.senderId !== req.userId) return res.status(403).json({ message: 'Укук жок' });
  msg.deleted = true; msg.text = ''; msg.fileUrl = undefined;
  writeDb(db);
  const io = req.app.get('io');
  if (io) io.to(`room:${req.params.roomId}`).emit('message:deleted', { roomId: req.params.roomId, messageId: req.params.messageId });
  res.json({ success: true });
});
// Создание группы
chatRouter.post('/groups', auth, (req: AR, res) => {
  const db = readDb();
  const me = db.users.find(u => u.id === req.userId);
  if (!me) return res.status(401).json({ message: 'Авторизация талап кылынат' });
  const { name, userIds } = req.body as { name: string; userIds: string[] };
  if (!name?.trim()) return res.status(400).json({ message: 'Топтун атын жазыңыз' });
  const ids = Array.from(new Set([...(userIds || []), me.id]));
  const participants = ids
    .map(id => db.users.find(u => u.id === id))
    .filter(Boolean)
    .map(u => ({ id: u!.id, name: u!.name }));
  if (participants.length < 2) return res.status(400).json({ message: 'Жок дегенде дагы бир мүчө кошуңуз' });
  const room: any = {
    id: nanoid(), isGroup: true, name: name.trim(), ownerId: me.id,
    participants, createdAt: new Date().toISOString(),
  };
  db.rooms.push(room); writeDb(db);
  res.status(201).json({ room });
});

// Добавить участника в группу
chatRouter.post('/groups/:roomId/members', auth, (req: AR, res) => {
  const db = readDb();
  const room = db.rooms.find(r => r.id === req.params.roomId);
  if (!room || !room.isGroup) return res.status(404).json({ message: 'Топ табылган жок' });
  const user = db.users.find(u => u.id === req.body.userId);
  if (!user) return res.status(404).json({ message: 'Колдонуучу табылган жок' });
  if (!room.participants.some(p => p.id === user.id)) {
    room.participants.push({ id: user.id, name: user.name });
    writeDb(db);
  }
  res.json({ room });
});

chatRouter.get('/rooms', auth, (req: AR, res) => {
  const db = readDb();
  const rooms = db.rooms.filter(r => r.participants.some(p => p.id === req.userId)).map(r => {
    const msgs = db.messages.filter(m => m.roomId === r.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const unread = msgs.filter(m => m.senderId !== req.userId && !m.read).length;
    return { ...r, lastMessage: msgs[0]?.text, lastAt: msgs[0]?.createdAt, unread };
  }).sort((a, b) => new Date(b.lastAt || b.createdAt).getTime() - new Date(a.lastAt || a.createdAt).getTime());
  res.json({ rooms });
});

chatRouter.get('/rooms/:roomId/messages', auth, (req: AR, res) => {
  const db = readDb();
  const room = db.rooms.find(r => r.id === req.params.roomId);
  if (!room || !room.participants.some(p => p.id === req.userId)) return res.status(403).json({ message: 'Укук жок' });
  const msgs = db.messages.filter(m => m.roomId === req.params.roomId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  res.json({ messages: msgs });
});

chatRouter.post('/rooms/:roomId/messages', auth, (req: AR, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.userId);
  if (!user) return res.status(401).json({ message: 'Авторизация талап кылынат' });
  const room = db.rooms.find(r => r.id === req.params.roomId);
  if (!room || !room.participants.some(p => p.id === user.id)) return res.status(403).json({ message: 'Укук жок' });
  const msg = { id: nanoid(), roomId: String(req.params.roomId), senderId: user.id, senderName: user.name, text: req.body.text, createdAt: new Date().toISOString(), read: false };
  db.messages.push(msg); writeDb(db);
  const io = req.app.get('io');
  if (io) io.to(`room:${room.id}`).emit('message:new', msg);
  res.status(201).json({ message: msg });
});