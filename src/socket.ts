import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './middleware/auth';
import { readDb, writeDb } from './db';

interface AuthedSocket extends Socket { userId?: string; userName?: string; }

export function setupSocket(server: HttpServer) {
  const io = new Server(server, { cors: { origin: '*' } });

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
    // авто-подключаем ко всем комнатам пользователя
    const db = readDb();
    db.rooms.filter(r => r.participants.some(p => p.id === socket.userId))
      .forEach(r => socket.join(`room:${r.id}`));

    socket.broadcast.emit('presence:online', { userId: socket.userId });

    socket.on('room:join', (roomId: string) => {
      socket.join(`room:${roomId}`);
    });

    socket.on('message:send', ({ roomId, text }: { roomId: string; text: string }) => {
      if (!text?.trim()) return;
      const db2 = readDb();
      const room = db2.rooms.find(r => r.id === roomId);
      if (!room || !room.participants.some(p => p.id === socket.userId)) return;
      const msg = {
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        roomId, senderId: socket.userId!, senderName: socket.userName!,
        text: text.trim(), createdAt: new Date().toISOString(), read: false,
      };
      db2.messages.push(msg); writeDb(db2);
      io.to(`room:${roomId}`).emit('message:new', msg);
    });

    socket.on('typing', ({ roomId, isTyping }: { roomId: string; isTyping: boolean }) => {
      socket.to(`room:${roomId}`).emit('typing', { roomId, userId: socket.userId, userName: socket.userName, isTyping });
    });

    socket.on('disconnect', () => {
      socket.broadcast.emit('presence:offline', { userId: socket.userId });
    });
  });

  return io;
}