"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = setupSocket;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("./middleware/auth");
const db_1 = require("./db");
function setupSocket(server) {
    const io = new socket_io_1.Server(server, { cors: { origin: '*' } });
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token)
            return next(new Error('no_token'));
        try {
            const p = jsonwebtoken_1.default.verify(token, auth_1.JWT_SECRET);
            const db = (0, db_1.readDb)();
            const user = db.users.find(u => u.id === p.userId);
            if (!user)
                return next(new Error('user_not_found'));
            socket.userId = user.id;
            socket.userName = user.name;
            next();
        }
        catch {
            next(new Error('invalid_token'));
        }
    });
    io.on('connection', (socket) => {
        // авто-подключаем ко всем комнатам пользователя
        const db = (0, db_1.readDb)();
        db.rooms.filter(r => r.participants.some(p => p.id === socket.userId))
            .forEach(r => socket.join(`room:${r.id}`));
        socket.broadcast.emit('presence:online', { userId: socket.userId });
        socket.on('room:join', (roomId) => {
            socket.join(`room:${roomId}`);
        });
        socket.on('message:send', ({ roomId, text }) => {
            if (!text?.trim())
                return;
            const db2 = (0, db_1.readDb)();
            const room = db2.rooms.find(r => r.id === roomId);
            if (!room || !room.participants.some(p => p.id === socket.userId))
                return;
            const msg = {
                id: Math.random().toString(36).slice(2) + Date.now().toString(36),
                roomId, senderId: socket.userId, senderName: socket.userName,
                text: text.trim(), createdAt: new Date().toISOString(), read: false,
            };
            db2.messages.push(msg);
            (0, db_1.writeDb)(db2);
            io.to(`room:${roomId}`).emit('message:new', msg);
        });
        socket.on('typing', ({ roomId, isTyping }) => {
            socket.to(`room:${roomId}`).emit('typing', { roomId, userId: socket.userId, userName: socket.userName, isTyping });
        });
        socket.on('disconnect', () => {
            socket.broadcast.emit('presence:offline', { userId: socket.userId });
        });
    });
    return io;
}
