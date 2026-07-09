"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const nanoid_1 = require("nanoid");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const r = (0, express_1.Router)();
const pub = ({ passwordHash, ...u }) => u;
r.post('/register', async (req, res) => {
    const { name, email, phone, password, role, region, district, village, companyName, telegram, whatsapp } = req.body;
    if (!name || !email || !phone || !password)
        return res.status(400).json({ message: 'Бардык талааларды толтуруңуз' });
    if (password.length < 6)
        return res.status(400).json({ message: 'Сырсөз жок дегенде 6 символ болушу керек' });
    const db = (0, db_1.readDb)();
    if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase()))
        return res.status(409).json({ message: 'Бул email катталган' });
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const user = { id: (0, nanoid_1.nanoid)(), name, email: email.toLowerCase(), passwordHash, phone, role: role || 'buyer', region, district, village, companyName, telegram, whatsapp, rating: 0, reviewCount: 0, verified: false, totalSold: 0, totalBought: 0, createdAt: new Date().toISOString() };
    db.users.push(user);
    (0, db_1.writeDb)(db);
    const token = jsonwebtoken_1.default.sign({ userId: user.id }, auth_1.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: pub(user) });
});
r.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const db = (0, db_1.readDb)();
    const user = db.users.find(u => u.email === email?.toLowerCase());
    if (!user || !(await bcryptjs_1.default.compare(password, user.passwordHash)))
        return res.status(401).json({ message: 'Email же сырсөз туура эмес' });
    const token = jsonwebtoken_1.default.sign({ userId: user.id }, auth_1.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: pub(user) });
});
r.get('/me', auth_1.auth, (req, res) => {
    const db = (0, db_1.readDb)();
    const user = db.users.find(u => u.id === req.userId);
    if (!user)
        return res.status(404).json({ message: 'Колдонуучу табылган жок' });
    res.json({ user: pub(user) });
});
r.get('/search', auth_1.auth, (req, res) => {
    const q = String(req.query.q || '').trim().toLowerCase();
    if (q.length < 2)
        return res.json({ users: [] });
    const db = (0, db_1.readDb)();
    const results = db.users
        .filter(u => u.id !== req.userId)
        .filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
        .slice(0, 15)
        .map(pub);
    res.json({ users: results });
});
r.get('/user/:id', (req, res) => {
    const db = (0, db_1.readDb)();
    const user = db.users.find(u => u.id === req.params.id);
    if (!user)
        return res.status(404).json({ message: 'Колдонуучу табылган жок' });
    res.json({ user: pub(user) });
});
exports.default = r;
