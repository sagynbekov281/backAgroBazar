import { MongoClient, Collection } from 'mongodb';

export interface DbUser { id: string; name: string; email: string; passwordHash: string; phone: string; role: string; region?: string; district?: string; village?: string; companyName?: string; telegram?: string; whatsapp?: string; rating: number; reviewCount: number; verified: boolean; totalSold: number; totalBought: number; createdAt: string; }
export interface DbListing { id: string; ownerId: string; ownerName: string; ownerRating: number; ownerVerified: boolean; title: string; category: string; images: string[]; description: string; price: number; currency: string; unit: string; minOrder: number; maxOrder?: number; bulkPrices?: any[]; weight?: number; region: string; district?: string; organic: boolean; exportReady: boolean; hasDelivery: boolean; inStock: boolean; vip: boolean; harvestDate?: string; views: number; createdAt: string; }
export interface DbOrder { id: string; listingId: string; listingTitle: string; listingImage: string; buyerId: string; buyerName: string; sellerId: string; qty: number; unit: string; price: number; total: number; address: string; phone: string; comment?: string; deliveryDate?: string; paymentMethod: string; status: string; createdAt: string; }
export interface DbReview { id: string; authorId: string; authorName: string; targetId: string; rating: number; comment: string; createdAt: string; }
export interface DbAnnouncement { id: string; authorId: string; authorName: string; authorRole: string; title: string; category: string; qty: number; unit: string; region: string; description: string; deadline?: string; status: string; offerCount: number; createdAt: string; }

export interface DbChatRoom {
  id: string;
  isGroup: boolean;
  name?: string;
  avatar?: string;
  ownerId?: string;
  participants: { id: string; name: string }[];
  createdAt: string;
}
export interface DbMessage { id: string; roomId: string; senderId: string; senderName: string; text: string; createdAt: string; read: boolean; readBy?: string[]; }
export interface DbTransport { id: string; ownerId: string; ownerName: string; ownerPhone: string; type: string; capacity: string; route: string; availableDates: string; region: string; price?: number; createdAt: string; }
export interface DbPrice { id: string; name: string; category: string; unit: string; avgPrice: number; minPrice: number; maxPrice: number; weekChange: number; monthChange: number; updatedAt: string; }

export interface DB { users: DbUser[]; listings: DbListing[]; orders: DbOrder[]; reviews: DbReview[]; announcements: DbAnnouncement[]; rooms: DbChatRoom[]; messages: DbMessage[]; transports: DbTransport[]; prices: DbPrice[]; }

function empty(): DB { return { users: [], listings: [], orders: [], reviews: [], announcements: [], rooms: [], messages: [], transports: [], prices: [] }; }

const MONGODB_URI = process.env.MONGODB_URI || '';
const DOC_ID = 'main';

let client: MongoClient | null = null;
let collection: Collection<{ _id: string } & DB> | null = null;

// In-memory cache — readDb()/writeDb() остаются синхронными для совместимости со старым кодом роутов
let cache: DB = empty();
let saveQueue: Promise<any> = Promise.resolve();

export async function initDb() {
  if (!MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI жок — маалыматтар сакталбайт (убедись что переменная задана на Render)');
    return;
  }
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  collection = db.collection<{ _id: string } & DB>('app_data');

  const doc = await collection.findOne({ _id: DOC_ID } as any);
  if (doc) {
    const { _id, ...rest } = doc as any;
    cache = { ...empty(), ...rest };
  } else {
    cache = empty();
    await collection.insertOne({ _id: DOC_ID, ...cache } as any);
  }
  console.log('✅ MongoDB Atlas менен туташты');
}

export function readDb(): DB {
  return cache;
}

export function writeDb(db: DB) {
  cache = db;
  if (!collection) return; // MONGODB_URI не задан — работаем только в памяти (данные пропадут при рестарте)
  // сохраняем в очередь, чтобы записи не перезаписывали друг друга гонкой условий
  saveQueue = saveQueue.then(() =>
    collection!.updateOne({ _id: DOC_ID } as any, { $set: cache }, { upsert: true })
  ).catch(err => console.error('Mongo save error:', err));
}