import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'db.json');

export interface DbUser { id: string; name: string; email: string; passwordHash: string; phone: string; role: string; region?: string; district?: string; village?: string; companyName?: string; telegram?: string; whatsapp?: string; rating: number; reviewCount: number; verified: boolean; totalSold: number; totalBought: number; createdAt: string; }
export interface DbListing { id: string; ownerId: string; ownerName: string; ownerRating: number; ownerVerified: boolean; title: string; category: string; images: string[]; description: string; price: number; currency: string; unit: string; minOrder: number; maxOrder?: number; bulkPrices?: any[]; weight?: number; region: string; district?: string; organic: boolean; exportReady: boolean; hasDelivery: boolean; inStock: boolean; vip: boolean; harvestDate?: string; views: number; createdAt: string; }
export interface DbOrder { id: string; listingId: string; listingTitle: string; listingImage: string; buyerId: string; buyerName: string; sellerId: string; qty: number; unit: string; price: number; total: number; address: string; phone: string; comment?: string; deliveryDate?: string; paymentMethod: string; status: string; createdAt: string; }
export interface DbReview { id: string; authorId: string; authorName: string; targetId: string; rating: number; comment: string; createdAt: string; }
export interface DbAnnouncement { id: string; authorId: string; authorName: string; authorRole: string; title: string; category: string; qty: number; unit: string; region: string; description: string; deadline?: string; status: string; offerCount: number; createdAt: string; }
export interface DbChatRoom { id: string; participants: { id: string; name: string }[]; createdAt: string; }
export interface DbMessage { id: string; roomId: string; senderId: string; senderName: string; text: string; createdAt: string; read: boolean; }
export interface DbTransport { id: string; ownerId: string; ownerName: string; ownerPhone: string; type: string; capacity: string; route: string; availableDates: string; region: string; price?: number; createdAt: string; }
export interface DbPrice { id: string; name: string; category: string; unit: string; avgPrice: number; minPrice: number; maxPrice: number; weekChange: number; monthChange: number; updatedAt: string; }

interface DB { users: DbUser[]; listings: DbListing[]; orders: DbOrder[]; reviews: DbReview[]; announcements: DbAnnouncement[]; rooms: DbChatRoom[]; messages: DbMessage[]; transports: DbTransport[]; prices: DbPrice[]; }

function empty(): DB { return { users: [], listings: [], orders: [], reviews: [], announcements: [], rooms: [], messages: [], transports: [], prices: [] }; }

export function readDb(): DB {
  if (!fs.existsSync(DB_PATH)) { const d = empty(); fs.writeFileSync(DB_PATH, JSON.stringify(d, null, 2)); return d; }
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')); } catch { return empty(); }
}

export function writeDb(db: DB) { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }
