import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { readDb, writeDb, DbUser } from '../db';
import { auth, AR, JWT_SECRET } from '../middleware/auth';

const r = Router();
const pub = ({ passwordHash, ...u }: DbUser) => u;

r.post('/register', async (req, res) => {
  const { name, email, phone, password, role, region, district, village, companyName, telegram, whatsapp } = req.body;
  if (!name || !email || !phone || !password) return res.status(400).json({ message: 'Бардык талааларды толтуруңуз' });
  if (password.length < 6) return res.status(400).json({ message: 'Сырсөз жок дегенде 6 символ болушу керек' });
  const db = readDb();
  if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase())) return res.status(409).json({ message: 'Бул email катталган' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user: DbUser = { id: nanoid(), name, email: email.toLowerCase(), passwordHash, phone, role: role || 'buyer', region, district, village, companyName, telegram, whatsapp, rating: 0, reviewCount: 0, verified: false, totalSold: 0, totalBought: 0, createdAt: new Date().toISOString() };
  db.users.push(user); writeDb(db);
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: pub(user) });
});

r.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const db = readDb();
  const user = db.users.find(u => u.email === email?.toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Email же сырсөз туура эмес' });
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: pub(user) });
});

r.get('/me', auth, (req: AR, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ message: 'Колдонуучу табылган жок' });
  res.json({ user: pub(user) });
});

r.get('/search', auth, (req: AR, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (q.length < 2) return res.json({ users: [] });
  const db = readDb();
  const results = db.users
    .filter(u => u.id !== req.userId)
    .filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    .slice(0, 15)
    .map(pub);
  res.json({ users: results });
});

r.get('/user/:id', (req, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'Колдонуучу табылган жок' });
  res.json({ user: pub(user) });
});

export default r;