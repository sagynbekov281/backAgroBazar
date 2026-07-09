"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_SECRET = void 0;
exports.auth = auth;
exports.optAuth = optAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.JWT_SECRET = process.env.JWT_SECRET || 'agrobazar_dev_secret_2025';
function auth(req, res, next) {
    const h = req.headers.authorization;
    if (!h?.startsWith('Bearer '))
        return res.status(401).json({ message: 'Авторизация талап кылынат' });
    try {
        const p = jsonwebtoken_1.default.verify(h.slice(7), exports.JWT_SECRET);
        req.userId = p.userId;
        next();
    }
    catch {
        return res.status(401).json({ message: 'Токен жараксыз' });
    }
}
function optAuth(req, _res, next) {
    const h = req.headers.authorization;
    if (h?.startsWith('Bearer ')) {
        try {
            const p = jsonwebtoken_1.default.verify(h.slice(7), exports.JWT_SECRET);
            req.userId = p.userId;
        }
        catch { }
    }
    next();
}
