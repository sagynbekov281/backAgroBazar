"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const nanoid_1 = require("nanoid");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const r = (0, express_1.Router)();
r.get('/', auth_1.optAuth, (req, res) => {
    const db = (0, db_1.readDb)();
    let list = [...db.listings];
    const { category, region, organic, exportReady, hasDelivery, vip, search, sort, ownerId, limit } = req.query;
    if (category)
        list = list.filter(l => l.category === category);
    if (region)
        list = list.filter(l => l.region.includes(String(region)));
    if (organic === 'true')
        list = list.filter(l => l.organic);
    if (exportReady === 'true')
        list = list.filter(l => l.exportReady);
    if (hasDelivery === 'true')
        list = list.filter(l => l.hasDelivery);
    if (vip === 'true')
        list = list.filter(l => l.vip);
    if (ownerId)
        list = list.filter(l => l.ownerId === ownerId);
    if (search) {
        const q = String(search).toLowerCase();
        list = list.filter(l => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q));
    }
    if (sort === 'price_asc')
        list.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc')
        list.sort((a, b) => b.price - a.price);
    else if (sort === 'popular')
        list.sort((a, b) => b.views - a.views);
    else if (sort === 'vip')
        list.sort((a, b) => (b.vip ? 1 : 0) - (a.vip ? 1 : 0));
    else
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (limit)
        list = list.slice(0, Number(limit));
    res.json({ listings: list });
});
r.get('/mine/all', auth_1.auth, (req, res) => {
    const db = (0, db_1.readDb)();
    res.json({ listings: db.listings.filter(l => l.ownerId === req.userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
});
r.get('/:id', (req, res) => {
    const db = (0, db_1.readDb)();
    const idx = db.listings.findIndex(l => l.id === req.params.id);
    if (idx === -1)
        return res.status(404).json({ message: 'Жарыя табылган жок' });
    db.listings[idx].views += 1;
    (0, db_1.writeDb)(db);
    res.json({ listing: db.listings[idx] });
});
r.post('/', auth_1.auth, (req, res) => {
    const db = (0, db_1.readDb)();
    const user = db.users.find(u => u.id === req.userId);
    if (!user)
        return res.status(401).json({ message: 'Авторизация талап кылынат' });
    const { title, category, images, description, price, unit, minOrder, maxOrder, bulkPrices, weight, region, district, organic, exportReady, hasDelivery, inStock, vip, harvestDate } = req.body;
    if (!title || !category || price == null || !region)
        return res.status(400).json({ message: 'Милдеттүү талааларды толтуруңуз' });
    const listing = { id: (0, nanoid_1.nanoid)(), ownerId: user.id, ownerName: user.companyName || user.name, ownerRating: user.rating, ownerVerified: user.verified, title, category, images: images?.length ? images : ['https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&q=80'], description: description || '', price: Number(price), currency: 'KGS', unit: unit || 'кг', minOrder: Number(minOrder) || 1, maxOrder: maxOrder ? Number(maxOrder) : undefined, bulkPrices: bulkPrices || [], weight: weight ? Number(weight) : undefined, region, district, organic: Boolean(organic), exportReady: Boolean(exportReady), hasDelivery: Boolean(hasDelivery), inStock: inStock !== false, vip: Boolean(vip), harvestDate, views: 0, createdAt: new Date().toISOString() };
    db.listings.push(listing);
    (0, db_1.writeDb)(db);
    res.status(201).json({ listing });
});
r.put('/:id', auth_1.auth, (req, res) => {
    const db = (0, db_1.readDb)();
    const i = db.listings.findIndex(l => l.id === req.params.id);
    if (i === -1)
        return res.status(404).json({ message: 'Жарыя табылган жок' });
    if (db.listings[i].ownerId !== req.userId)
        return res.status(403).json({ message: 'Укук жок' });
    db.listings[i] = { ...db.listings[i], ...req.body, id: db.listings[i].id, ownerId: db.listings[i].ownerId, price: req.body.price != null ? Number(req.body.price) : db.listings[i].price };
    (0, db_1.writeDb)(db);
    res.json({ listing: db.listings[i] });
});
r.delete('/:id', auth_1.auth, (req, res) => {
    const db = (0, db_1.readDb)();
    const i = db.listings.findIndex(l => l.id === req.params.id);
    if (i === -1)
        return res.status(404).json({ message: 'Жарыя табылган жок' });
    if (db.listings[i].ownerId !== req.userId)
        return res.status(403).json({ message: 'Укук жок' });
    db.listings.splice(i, 1);
    (0, db_1.writeDb)(db);
    res.json({ success: true });
});
exports.default = r;
