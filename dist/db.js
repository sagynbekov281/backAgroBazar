"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = initDb;
exports.readDb = readDb;
exports.writeDb = writeDb;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mongodb_1 = require("mongodb");
const DB_PATH = path_1.default.join(__dirname, '..', 'db.json');
function empty() { return { users: [], listings: [], orders: [], reviews: [], announcements: [], rooms: [], messages: [], transports: [], prices: [] }; }
const MONGODB_URI = process.env.MONGODB_URI || '';
const DOC_ID = 'main';
const USE_MONGO = !!MONGODB_URI;
let client = null;
let collection = null;
let cache = empty();
let saveQueue = Promise.resolve();
function readFileDb() {
    if (!fs_1.default.existsSync(DB_PATH)) {
        const d = empty();
        fs_1.default.writeFileSync(DB_PATH, JSON.stringify(d, null, 2));
        return d;
    }
    try {
        const db = JSON.parse(fs_1.default.readFileSync(DB_PATH, 'utf-8'));
        db.rooms = (db.rooms || []).map((r) => ({ isGroup: false, ...r }));
        return { ...empty(), ...db };
    }
    catch {
        return empty();
    }
}
function writeFileDb(db) { fs_1.default.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }
async function initDb() {
    if (!USE_MONGO) {
        cache = readFileDb();
        console.log('📁 Жергиликтүү db.json колдонулууда (MONGODB_URI жок)');
        return;
    }
    client = new mongodb_1.MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000 });
    await client.connect();
    const db = client.db();
    collection = db.collection('app_data');
    const doc = await collection.findOne({ _id: DOC_ID });
    if (doc) {
        const { _id, ...rest } = doc;
        cache = { ...empty(), ...rest };
    }
    else {
        cache = empty();
        await collection.insertOne({ _id: DOC_ID, ...cache });
    }
    console.log('✅ MongoDB Atlas менен туташты');
}
function readDb() {
    return cache;
}
function writeDb(db) {
    cache = db;
    if (!USE_MONGO) {
        writeFileDb(cache);
        return;
    }
    if (!collection)
        return;
    saveQueue = saveQueue.then(() => collection.updateOne({ _id: DOC_ID }, { $set: cache }, { upsert: true })).catch(err => console.error('Mongo save error:', err));
}
