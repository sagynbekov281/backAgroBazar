import { Router } from 'express';
import { nanoid } from 'nanoid';
import { readDb, writeDb } from '../db';
import { auth, AR } from '../middleware/auth';
import { AI_USER_ID, AI_USER_NAME } from '../ai';

/* ── ORDERS ── */
export const ordersRouter = Router();

ordersRouter.post('/', auth, (req: AR, res) => {
  const db = readDb();
  const buyer = db.users.find(u => u.id === req.userId);
  if (!buyer) return res.status(401).json({ message: 'Требуется авторизация' });
  const { listingId, qty, address, phone, comment, deliveryDate, paymentMethod } = req.body;
  const listing = db.listings.find(l => l.id === listingId);
  if (!listing) return res.status(404).json({ message: 'Объявление не найдено' });
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
  if (!author) return res.status(401).json({ message: 'Требуется авторизация' });
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
  if (!user) return res.status(401).json({ message: 'Требуется авторизация' });
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
  if (!user) return res.status(401).json({ message: 'Требуется авторизация' });
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
  if (!me || !other) return res.status(404).json({ message: 'Пользователь не найден' });
  let room = db.rooms.find(r => !r.isGroup && r.participants.some(p => p.id === me.id) && r.participants.some(p => p.id === other.id));
  if (!room) {
    room = { id: nanoid(), isGroup: false, participants: [{ id: me.id, name: me.name }, { id: other.id, name: other.name }], createdAt: new Date().toISOString() };
    db.rooms.push(room); writeDb(db);
  }
  res.json({ roomId: room.id });
});

chatRouter.post('/ai/start', auth, (req: AR, res) => {
  const db = readDb();
  const me = db.users.find(u => u.id === req.userId);
  if (!me) return res.status(401).json({ message: 'Требуется авторизация' });

  let room = db.rooms.find(r =>
    !r.isGroup &&
    r.participants.some(p => p.id === AI_USER_ID) &&
    r.participants.some(p => p.id === me.id)
  );
  if (!room) {
    room = {
      id: nanoid(), isGroup: false,
      participants: [{ id: me.id, name: me.name }, { id: AI_USER_ID, name: AI_USER_NAME }],
      createdAt: new Date().toISOString(),
    };
    db.rooms.push(room);
    const welcome = {
      id: nanoid(),
      roomId: room.id,
      senderId: AI_USER_ID,
      senderName: AI_USER_NAME,
      text: 'Здравствуйте! Я AgroBazar AI. Напишите своё сообщение, и я отвечу.',
      createdAt: new Date().toISOString(),
      read: false,
      readBy: [AI_USER_ID],
      type: 'text' as const,
      deletedFor: [] as string[],
    };
    db.messages.push(welcome);
    writeDb(db);
  }
  res.json({ roomId: room.id });
});

chatRouter.post('/groups', auth, (req: AR, res) => {
  const db = readDb();
  const me = db.users.find(u => u.id === req.userId);
  if (!me) return res.status(401).json({ message: 'Требуется авторизация' });
  const { name, userIds } = req.body as { name: string; userIds: string[] };
  if (!name?.trim()) return res.status(400).json({ message: 'Введите название группы' });
  const ids = Array.from(new Set([...(userIds || []), me.id]));
  const participants = ids
    .map(id => db.users.find(u => u.id === id))
    .filter(Boolean)
    .map(u => ({ id: u!.id, name: u!.name }));
  if (participants.length < 2) return res.status(400).json({ message: 'Добавьте хотя бы ещё одного участника' });
  const room: any = {
    id: nanoid(), isGroup: true, name: name.trim(), ownerId: me.id, admins: [me.id],
    participants, createdAt: new Date().toISOString(),
  };
  db.rooms.push(room); writeDb(db);
  res.status(201).json({ room });
});

function isGroupAdmin(room: any, userId?: string) {
  if (!userId) return false;
  if (room.ownerId === userId) return true;
  return (room.admins || []).includes(userId);
}

chatRouter.post('/groups/:roomId/members', auth, (req: AR, res) => {
  const db = readDb();
  const room = db.rooms.find(r => r.id === req.params.roomId);
  if (!room || !room.isGroup) return res.status(404).json({ message: 'Группа не найдена' });
  const user = db.users.find(u => u.id === req.body.userId);
  if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
  if (!room.participants.some(p => p.id === user.id)) {
    room.participants.push({ id: user.id, name: user.name });
    writeDb(db);
  }
  res.json({ room });
});

// админ мучону чыгарат
chatRouter.post('/groups/:roomId/remove', auth, (req: AR, res) => {
  const db = readDb();
  const room: any = db.rooms.find(r => r.id === req.params.roomId);
  if (!room || !room.isGroup) return res.status(404).json({ message: 'Группа не найдена' });
  if (!isGroupAdmin(room, req.userId)) return res.status(403).json({ message: 'Для этого действия нужны права администратора' });
  const targetId = req.body.userId;
  if (targetId === room.ownerId) return res.status(400).json({ message: 'Нельзя удалить владельца группы' });
  room.participants = room.participants.filter((p: any) => p.id !== targetId);
  room.admins = (room.admins || []).filter((a: string) => a !== targetId);
  writeDb(db);
  const io = req.app.get('io');
  if (io) io.to(`room:${room.id}`).emit('group:member_removed', { roomId: room.id, userId: targetId });
  res.json({ success: true });
});

// админ дайындоо/алып салуу
chatRouter.post('/groups/:roomId/admins', auth, (req: AR, res) => {
  const db = readDb();
  const room: any = db.rooms.find(r => r.id === req.params.roomId);
  if (!room || !room.isGroup) return res.status(404).json({ message: 'Группа не найдена' });
  if (room.ownerId !== req.userId) return res.status(403).json({ message: 'Это действие может выполнить только владелец группы' });
  const { userId, makeAdmin } = req.body as { userId: string; makeAdmin: boolean };
  if (!room.participants.some((p: any) => p.id === userId)) return res.status(404).json({ message: 'Участник не найден' });
  room.admins = room.admins || [];
  if (makeAdmin) {
    if (!room.admins.includes(userId)) room.admins.push(userId);
  } else {
    room.admins = room.admins.filter((a: string) => a !== userId);
  }
  writeDb(db);
  res.json({ room });
});

chatRouter.get('/rooms', auth, (req: AR, res) => {
  const db = readDb();
  const rooms = db.rooms.filter(r => r.participants.some(p => p.id === req.userId)).map((r: any) => {
    const allMsgs = db.messages
      .filter(m => m.roomId === r.id && !(m.deletedFor || []).includes(req.userId!))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const lastReal = allMsgs.find(m => m.type !== 'system') || allMsgs[0];
    const unread = allMsgs.filter(m => m.type !== 'system' && m.senderId !== req.userId && !(m.readBy || []).includes(req.userId!)).length;
    const lastMessage = lastReal ? (lastReal.deleted ? 'Сообщение удалено' : lastReal.type === 'image' ? '📷 Фото' : lastReal.text) : undefined;
    // персональный никнейм собеседника (только для личных чатов, виден только текущему юзеру)
    const nickname = !r.isGroup ? (r.nicknames || {})[req.userId!] : undefined;
    return { ...r, lastMessage, lastAt: lastReal?.createdAt, unread, nickname };
  }).sort((a, b) => new Date(b.lastAt || b.createdAt).getTime() - new Date(a.lastAt || a.createdAt).getTime());
  res.json({ rooms });
});

chatRouter.get('/rooms/:roomId/messages', auth, (req: AR, res) => {
  const db = readDb();
  const room = db.rooms.find(r => r.id === req.params.roomId);
  if (!room || !room.participants.some(p => p.id === req.userId)) return res.status(403).json({ message: 'Нет доступа' });
  const msgs = db.messages
    .filter(m => m.roomId === req.params.roomId && !(m.deletedFor || []).includes(req.userId!))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  res.json({ messages: msgs });
});

chatRouter.post('/rooms/:roomId/messages', auth, (req: AR, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.userId);
  if (!user) return res.status(401).json({ message: 'Требуется авторизация' });
  const room = db.rooms.find(r => r.id === req.params.roomId);
  if (!room || !room.participants.some(p => p.id === user.id)) return res.status(403).json({ message: 'Нет доступа' });
  const { text, replyTo, type, fileUrl } = req.body;
  const msg = { id: nanoid(), roomId: String(req.params.roomId), senderId: user.id, senderName: user.name, text: text || '', createdAt: new Date().toISOString(), read: false, readBy: [user.id], replyTo, type: type || 'text', fileUrl, deletedFor: [] as string[] };
  db.messages.push(msg); writeDb(db);
  const io = req.app.get('io');
  if (io) io.to(`room:${room.id}`).emit('message:new', msg);
  res.status(201).json({ message: msg });
});

chatRouter.post('/rooms/:roomId/read', auth, (req: AR, res) => {
  const db = readDb();
  const room = db.rooms.find(r => r.id === req.params.roomId);
  if (!room || !room.participants.some(p => p.id === req.userId)) return res.status(403).json({ message: 'Нет доступа' });
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

// удаление сообщения: 'me' - только у себя, 'everyone' - у всех
chatRouter.delete('/rooms/:roomId/messages/:messageId', auth, (req: AR, res) => {
  const db = readDb();
  const msg = db.messages.find(m => m.id === req.params.messageId && m.roomId === req.params.roomId);
  if (!msg) return res.status(404).json({ message: 'Сообщение не найдено' });
  const mode = req.query.mode === 'everyone' ? 'everyone' : 'me';
  if (mode === 'everyone') {
    if (msg.senderId !== req.userId) return res.status(403).json({ message: 'Нет доступа' });
    db.messages = db.messages.filter(m => m.id !== req.params.messageId);
    writeDb(db);
    const io = req.app.get('io');
    if (io) io.to(`room:${req.params.roomId}`).emit('message:deleted', { roomId: req.params.roomId, messageId: req.params.messageId, mode: 'everyone' });
  } else {
    msg.deletedFor = msg.deletedFor || [];
    if (!msg.deletedFor.includes(req.userId!)) msg.deletedFor.push(req.userId!);
    writeDb(db);
  }
  res.json({ success: true });
});

// удаление чата только у себя (сообщения не меняются, у собеседника остаются видны)
chatRouter.delete('/rooms/:roomId', auth, (req: AR, res) => {
  const db = readDb();
  const room = db.rooms.find(r => r.id === req.params.roomId);
  if (!room || !room.participants.some(p => p.id === req.userId)) return res.status(403).json({ message: 'Нет доступа' });
  db.messages.forEach(m => {
    if (m.roomId === req.params.roomId) {
      m.deletedFor = m.deletedFor || [];
      if (!m.deletedFor.includes(req.userId!)) m.deletedFor.push(req.userId!);
    }
  });
  writeDb(db);
  res.json({ success: true });
});

// изменение названия и аватарки группы (только владелец группы)
chatRouter.patch('/groups/:roomId', auth, (req: AR, res) => {
  const db = readDb();
  const room: any = db.rooms.find(r => r.id === req.params.roomId);
  if (!room || !room.isGroup) return res.status(404).json({ message: 'Группа не найдена' });
  if (room.ownerId !== req.userId) return res.status(403).json({ message: 'Это действие может выполнить только владелец группы' });
  const me = db.users.find(u => u.id === req.userId);

  const { name, avatar } = req.body as { name?: string; avatar?: string | null };
  const io = req.app.get('io');
  const sysMsgs: any[] = [];
  const now = () => new Date().toISOString();

  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ message: 'Введите название группы' });
    const trimmed = name.trim();
    if (trimmed !== room.name) {
      sysMsgs.push({ id: nanoid(), roomId: room.id, senderId: 'system', senderName: 'system', text: `${me?.name || 'Пользователь'} изменил(а) название группы на «${trimmed}»`, createdAt: now(), read: true, readBy: [], type: 'system' });
    }
    room.name = trimmed;
  }

  if (avatar !== undefined) {
    if (avatar && avatar.length > 550_000) {
      return res.status(400).json({ message: 'Изображение слишком большое. Выберите файл поменьше.' });
    }
    if (avatar) {
      sysMsgs.push({ id: nanoid(), roomId: room.id, senderId: 'system', senderName: 'system', text: `${me?.name || 'Пользователь'} изменил(а) фото группы`, createdAt: now(), read: true, readBy: [], type: 'system' });
    } else if (room.avatar) {
      sysMsgs.push({ id: nanoid(), roomId: room.id, senderId: 'system', senderName: 'system', text: `${me?.name || 'Пользователь'} удалил(а) фото группы`, createdAt: now(), read: true, readBy: [], type: 'system' });
    }
    room.avatar = avatar || undefined;
  }

  if (sysMsgs.length) db.messages.push(...sysMsgs);
  writeDb(db);

  if (io) {
    io.to(`room:${room.id}`).emit('group:updated', { room });
    sysMsgs.forEach(m => io.to(`room:${room.id}`).emit('message:new', m));
  }
  res.json({ room });
});

// Никнейм собеседника в личном чате — виден только тому, кто его назначил
chatRouter.patch('/rooms/:roomId/nickname', auth, (req: AR, res) => {
  const db = readDb();
  const room: any = db.rooms.find(r => r.id === req.params.roomId);
  if (!room) return res.status(404).json({ message: 'Чат не найден' });
  if (room.isGroup) return res.status(400).json({ message: 'В группах никнеймы не используются' });
  if (!room.participants.some((p: any) => p.id === req.userId)) return res.status(403).json({ message: 'Нет доступа' });

  const { nickname } = req.body as { nickname?: string | null };
  room.nicknames = room.nicknames || {};
  const trimmed = (nickname || '').trim();
  if (trimmed) {
    room.nicknames[req.userId!] = trimmed;
  } else {
    delete room.nicknames[req.userId!];
  }
  writeDb(db);
  res.json({ room, nickname: room.nicknames[req.userId!] || null });
});

chatRouter.post('/groups/:roomId/leave', auth, (req: AR, res) => {
  const db = readDb();
  const room = db.rooms.find(r => r.id === req.params.roomId);
  if (!room || !room.isGroup) return res.status(404).json({ message: 'Группа не найдена' });
  const leaver = db.users.find(u => u.id === req.userId);
  if (!room.participants.some(p => p.id === req.userId)) return res.status(403).json({ message: 'Вы не состоите в этой группе' });

  room.participants = room.participants.filter(p => p.id !== req.userId);
  room.admins = (room.admins || []).filter((a: string) => a !== req.userId);

  const sysMsg = { id: nanoid(), roomId: room.id, senderId: 'system', senderName: 'system', text: `${leaver?.name || 'Колдонуучу'} топтон чыгып кетти`, createdAt: new Date().toISOString(), read: true, readBy: [], type: 'system' as const };

  // если группа опустела — удаляем полностью
  if (room.participants.length === 0) {
    db.rooms = db.rooms.filter(r => r.id !== room!.id);
    db.messages = db.messages.filter(m => m.roomId !== room!.id);
  } else {
    db.messages.push(sysMsg);
    if (room.ownerId === req.userId) {
      // если владелец вышел — назначаем нового владельца
      room.ownerId = room.participants[0].id;
      if (!room.admins!.includes(room.ownerId)) room.admins!.push(room.ownerId);
    }
  }

  writeDb(db);
  const io = req.app.get('io');
  if (io) {
    io.to(`room:${req.params.roomId}`).emit('group:left', { roomId: req.params.roomId, userId: req.userId });
    if (room.participants.length > 0) io.to(`room:${req.params.roomId}`).emit('message:new', sysMsg);
  }
  res.json({ success: true });
});