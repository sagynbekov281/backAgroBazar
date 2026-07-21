import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './middleware/auth';
import { readDb, writeDb } from './db';

interface AuthedSocket extends Socket { userId?: string; userName?: string; }

const MAX_IMAGE_BASE64_LENGTH = 550_000; // ~400KB бинарный, с запасом на base64-раздутие

export function setupSocket(server: HttpServer) {
  const io = new Server(server, { cors: { origin: '*' }, maxHttpBufferSize: 1_000_000 });

  io.use((socket: AuthedSocket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('no_token'));
    try {
      const p = jwt.verify(token, JWT_SECRET) as { userId: string };
      const db = readDb();
      const user = db.users.find(u => u.id === p.userId);
      if (!user) return next(new Error('user_not_found'));
      socket.userId = user.id;
      socket.userName = user.name;
      next();
    } catch { next(new Error('invalid_token')); }
  });

  io.on('connection', (socket: AuthedSocket) => {
    const db = readDb();
    db.rooms.filter(r => r.participants.some(p => p.id === socket.userId))
      .forEach(r => socket.join(`room:${r.id}`));

    socket.broadcast.emit('presence:online', { userId: socket.userId });

    socket.on('room:join', (roomId: string) => {
      socket.join(`room:${roomId}`);
    });

    socket.on('message:send', ({ roomId, text, replyTo, type, fileUrl }: { roomId: string; text: string; replyTo?: string; type?: 'text' | 'image'; fileUrl?: string }) => {
      const isImage = type === 'image' && !!fileUrl;
      if (!isImage && !text?.trim()) return;
      if (isImage && fileUrl!.length > MAX_IMAGE_BASE64_LENGTH) {
        socket.emit('message:error', { message: 'Сүрөт өтө чоң. Кичине сүрөт тандаңыз.' });
        return;
      }
      const db2 = readDb();
      const room = db2.rooms.find(r => r.id === roomId);
      if (!room || !room.participants.some(p => p.id === socket.userId)) return;
      const msg = {
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        roomId, senderId: socket.userId!, senderName: socket.userName!,
        text: (text || '').trim(), createdAt: new Date().toISOString(), read: false,
        readBy: [socket.userId!],
        replyTo: replyTo || undefined,
        type: isImage ? 'image' as const : 'text' as const,
        fileUrl: isImage ? fileUrl : undefined,
      };
      db2.messages.push(msg); writeDb(db2);
      io.to(`room:${roomId}`).emit('message:new', msg);
    });

    socket.on('message:read', ({ roomId }: { roomId: string }) => {
      const db2 = readDb();
      const room = db2.rooms.find(r => r.id === roomId);
      if (!room || !room.participants.some(p => p.id === socket.userId)) return;
      let changed = false;
      db2.messages.forEach(m => {
        if (m.roomId === roomId && m.senderId !== socket.userId) {
          m.readBy = m.readBy || [];
          if (!m.readBy.includes(socket.userId!)) { m.readBy.push(socket.userId!); m.read = true; changed = true; }
        }
      });
      if (changed) writeDb(db2);
      socket.to(`room:${roomId}`).emit('message:read', { roomId, userId: socket.userId });
    });

   socket.on('message:delete', ({ roomId, messageId }: { roomId: string; messageId: string }) => {
      const db2 = readDb();
      const msg = db2.messages.find(m => m.id === messageId && m.roomId === roomId);
      if (!msg || msg.senderId !== socket.userId) return;
      db2.messages = db2.messages.filter(m => m.id !== messageId);
      writeDb(db2);
      io.to(`room:${roomId}`).emit('message:deleted', { roomId, messageId });
    });

    socket.on('typing', ({ roomId, isTyping }: { roomId: string; isTyping: boolean }) => {
      socket.to(`room:${roomId}`).emit('typing', { roomId, userId: socket.userId, userName: socket.userName, isTyping });
    });

    socket.on('disconnect', () => {
      const db2 = readDb();
      const user = db2.users.find(u => u.id === socket.userId);
      const lastSeen = new Date().toISOString();
      if (user) { user.lastSeen = lastSeen; writeDb(db2); }
      socket.broadcast.emit('presence:offline', { userId: socket.userId, lastSeen });
    });
  });

  return io;
}