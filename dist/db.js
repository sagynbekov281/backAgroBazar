"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readDb = readDb;
exports.writeDb = writeDb;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DB_PATH = path_1.default.join(__dirname, '..', 'db.json');
function empty() { return { users: [], listings: [], orders: [], reviews: [], announcements: [], rooms: [], messages: [], transports: [], prices: [] }; }
function readDb() {
    if (!fs_1.default.existsSync(DB_PATH)) {
        const d = empty();
        fs_1.default.writeFileSync(DB_PATH, JSON.stringify(d, null, 2));
        return d;
    }
    try {
        const db = JSON.parse(fs_1.default.readFileSync(DB_PATH, 'utf-8'));
        db.rooms = (db.rooms || []).map((r) => ({ isGroup: false, ...r }));
        return db;
    }
    catch {
        return empty();
    }
}
function writeDb(db) { fs_1.default.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }
