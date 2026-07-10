import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { readDb, writeDb, initDb, DbUser, DbListing, DbPrice } from './db';

async function seed() {
  await initDb();

  const db = readDb();
  if (db.users.length > 0) { console.log('Маалымат базасы толтурулган, өтүп кетүүдө.'); return; }

  // ... остальной код без изменений

  const hash = await bcrypt.hash('123456', 10);

  const users: DbUser[] = [
    { id: 'admin1', name: 'Администратор', email: 'admin@test.kg', passwordHash: hash, phone: '+996700000000', role: 'admin', region: 'Бишкек', rating: 5, reviewCount: 0, verified: true, totalSold: 0, totalBought: 0, createdAt: new Date().toISOString() },
    { id: 'farmer1', name: 'Айбек Турсунов', email: 'farmer@test.kg', passwordHash: hash, phone: '+996700111111', role: 'farmer', region: 'Чуйская область', district: 'Аламудун', companyName: 'Жайлоо ЧП', telegram: '@aibek_farm', whatsapp: '+996700111111', rating: 4.8, reviewCount: 24, verified: true, totalSold: 2400000, totalBought: 0, createdAt: new Date(Date.now() - 180 * 86400000).toISOString() },
    { id: 'farmer2', name: 'Гүлнара Асанова', email: 'farmer2@test.kg', passwordHash: hash, phone: '+996700222222', role: 'farmer', region: 'Иссык-Кульская область', district: 'Тюп', companyName: 'Тоо Булак', rating: 4.6, reviewCount: 15, verified: true, totalSold: 980000, totalBought: 0, createdAt: new Date(Date.now() - 90 * 86400000).toISOString() },
    { id: 'farmer3', name: 'Мирлан Джумабеков', email: 'farmer3@test.kg', passwordHash: hash, phone: '+996700333333', role: 'farmer', region: 'Ошская область', district: 'Кара-Суу', rating: 4.3, reviewCount: 8, verified: false, totalSold: 450000, totalBought: 0, createdAt: new Date(Date.now() - 60 * 86400000).toISOString() },
    { id: 'buyer1', name: 'Марат Беков', email: 'buyer@test.kg', passwordHash: hash, phone: '+996700444444', role: 'buyer', region: 'Бишкек', rating: 0, reviewCount: 0, verified: false, totalSold: 0, totalBought: 320000, createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
    { id: 'exporter1', name: 'Нурлан Эргешов', email: 'export@test.kg', passwordHash: hash, phone: '+996700555555', role: 'exporter', companyName: 'KG Export LLC', region: 'Бишкек', rating: 4.9, reviewCount: 5, verified: true, totalSold: 0, totalBought: 8500000, createdAt: new Date(Date.now() - 120 * 86400000).toISOString() },
    { id: 'transport1', name: 'КамАЗ ЖЧК', email: 'transport@test.kg', passwordHash: hash, phone: '+996700666666', role: 'transport', region: 'Ошская область', rating: 4.5, reviewCount: 30, verified: true, totalSold: 0, totalBought: 0, createdAt: new Date(Date.now() - 200 * 86400000).toISOString() },
  ];

  const imgs = {
    potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80',
    onion: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=600&q=80',
    tomato: 'https://images.unsplash.com/photo-1546470427-e26264be0b11?w=600&q=80',
    apple: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&q=80',
    cow: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&q=80',
    sheep: 'https://images.unsplash.com/photo-1452857297128-d9c29adba80b?w=600&q=80',
    honey: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80',
    milk: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80',
    wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80',
    chicken: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600&q=80',
    tractor: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=600&q=80',
    carrot: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&q=80',
  };

  const listings: DbListing[] = [
    { id: nanoid(), ownerId: 'farmer1', ownerName: 'Жайлоо ЧП', ownerRating: 4.8, ownerVerified: true, title: 'Картошка "Невский" — опт', category: 'vegetables', images: [imgs.potato], description: 'Жаңы картошка, сорту Невский. Таза, ооруга каршы. Ири сатып алуучуларга арналган дүң баалар бар.', price: 18, currency: 'KGS', unit: 'кг', minOrder: 500, maxOrder: 50000, bulkPrices: [{ minQty: 500, maxQty: 2000, unit: 'кг', price: 18 }, { minQty: 2000, maxQty: 5000, unit: 'кг', price: 15 }, { minQty: 5000, maxQty: null, unit: 'кг', price: 12 }], weight: undefined, region: 'Чуйская область', district: 'Аламудун', organic: false, exportReady: true, hasDelivery: true, inStock: true, vip: true, harvestDate: '2025-09-15', views: 342, createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
    { id: nanoid(), ownerId: 'farmer1', ownerName: 'Жайлоо ЧП', ownerRating: 4.8, ownerVerified: true, title: 'Пияз жерги жер', category: 'vegetables', images: [imgs.onion], description: 'Кургак, жакшы сакталган пияз. Кыш бою сатылат.', price: 22, currency: 'KGS', unit: 'кг', minOrder: 100, bulkPrices: [{ minQty: 100, maxQty: 1000, unit: 'кг', price: 22 }, { minQty: 1000, maxQty: null, unit: 'кг', price: 18 }], region: 'Чуйская область', organic: false, exportReady: false, hasDelivery: true, inStock: true, vip: false, views: 128, createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
    { id: nanoid(), ownerId: 'farmer2', ownerName: 'Тоо Булак', ownerRating: 4.6, ownerVerified: true, title: 'Органик бал — тоо гүлдөрдөн', category: 'honey', images: [imgs.honey], description: 'Иссык-Көл тоолорунан жыйналган органикалык бал. Сертификат бар. Экспортко даяр.', price: 750, currency: 'KGS', unit: 'кг', minOrder: 5, bulkPrices: [{ minQty: 5, maxQty: 50, unit: 'кг', price: 750 }, { minQty: 50, maxQty: null, unit: 'кг', price: 650 }], region: 'Иссык-Кульская область', organic: true, exportReady: true, hasDelivery: true, inStock: true, vip: true, harvestDate: '2025-08-20', views: 521, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: nanoid(), ownerId: 'farmer2', ownerName: 'Тоо Булак', ownerRating: 4.6, ownerVerified: true, title: 'Дарыялык эчки сүтү', category: 'dairy', images: [imgs.milk], description: 'Ар күнү эртең менен алынган таза эчки сүтү. Жеткирүү бар.', price: 120, currency: 'KGS', unit: 'л', minOrder: 5, region: 'Иссык-Кульская область', organic: true, exportReady: false, hasDelivery: true, inStock: true, vip: false, views: 89, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: nanoid(), ownerId: 'farmer1', ownerName: 'Жайлоо ЧП', ownerRating: 4.8, ownerVerified: true, title: 'Уй эти — тирүү салмак', category: 'meat', images: [imgs.cow], description: 'Чабандан өстүрүлгөн тоок. Жашыл жерде жайылган. Тирүү салмак же союлган формада.', price: 380, currency: 'KGS', unit: 'кг', minOrder: 50, bulkPrices: [{ minQty: 50, maxQty: 200, unit: 'кг', price: 380 }, { minQty: 200, maxQty: null, unit: 'кг', price: 350 }], region: 'Чуйская область', organic: true, exportReady: false, hasDelivery: false, inStock: true, vip: true, views: 267, createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
    { id: nanoid(), ownerId: 'farmer3', ownerName: 'Мирлан Джумабеков', ownerRating: 4.3, ownerVerified: false, title: 'Кой — семиз курдюктуу', category: 'livestock', images: [imgs.sheep], description: 'Курдючтуу кой, 8-10 айлык. Байрам алдында өтө сатылат.', price: 15000, currency: 'KGS', unit: 'баш', minOrder: 1, region: 'Ошская область', organic: false, exportReady: false, hasDelivery: false, inStock: true, vip: false, views: 445, createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
    { id: nanoid(), ownerId: 'farmer3', ownerName: 'Мирлан Джумабеков', ownerRating: 4.3, ownerVerified: false, title: 'Буудай — жаңы кесим', category: 'grain', images: [imgs.wheat], description: 'Кара буудай, жаны жыйылган. Унга же мал тоюнтуу үчүн ылайыктуу.', price: 14, currency: 'KGS', unit: 'кг', minOrder: 1000, bulkPrices: [{ minQty: 1000, maxQty: 5000, unit: 'кг', price: 14 }, { minQty: 5000, maxQty: null, unit: 'кг', price: 12 }], region: 'Ошская область', organic: false, exportReady: true, hasDelivery: true, inStock: true, vip: false, harvestDate: '2025-08-01', views: 198, createdAt: new Date(Date.now() - 14 * 86400000).toISOString() },
    { id: nanoid(), ownerId: 'farmer2', ownerName: 'Тоо Булак', ownerRating: 4.6, ownerVerified: true, title: 'Томат "Де Барао" — опт', category: 'vegetables', images: [imgs.tomato], description: 'Күнөскана томаттары, ар дайым бар. Рестораниерге жана базарларга жеткирилет.', price: 85, currency: 'KGS', unit: 'кг', minOrder: 50, region: 'Иссык-Кульская область', organic: true, exportReady: false, hasDelivery: true, inStock: true, vip: false, views: 156, createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
    { id: nanoid(), ownerId: 'farmer1', ownerName: 'Жайлоо ЧП', ownerRating: 4.8, ownerVerified: true, title: 'Алма "Симиренко" — Чуй', category: 'fruits', images: [imgs.apple], description: 'Жашыл алма, таттуу-кычкыл. Чоку бойдон, таза. Экспорт үчүн жарактуу.', price: 55, currency: 'KGS', unit: 'кг', minOrder: 200, bulkPrices: [{ minQty: 200, maxQty: 1000, unit: 'кг', price: 55 }, { minQty: 1000, maxQty: null, unit: 'кг', price: 45 }], region: 'Чуйская область', organic: false, exportReady: true, hasDelivery: true, inStock: true, vip: false, harvestDate: '2025-09-20', views: 312, createdAt: new Date(Date.now() - 6 * 86400000).toISOString() },
    { id: nanoid(), ownerId: 'farmer3', ownerName: 'Мирлан Джумабеков', ownerRating: 4.3, ownerVerified: false, title: 'Тоок — жерги жер, бройлер', category: 'poultry', images: [imgs.chicken], description: 'Ачык аба аймагында өстүрүлгөн тоок. 45-60 күндүк. Дароо жеткирилет.', price: 250, currency: 'KGS', unit: 'кг', minOrder: 5, region: 'Ошская область', organic: false, exportReady: false, hasDelivery: true, inStock: true, vip: false, views: 78, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: nanoid(), ownerId: 'farmer1', ownerName: 'Жайлоо ЧП', ownerRating: 4.8, ownerVerified: true, title: 'МТЗ-82 трактор — жакшы абалда', category: 'tractor', images: [imgs.tractor], description: '2018-жылкы. Техникалык тейлөө өттү. Документтери бар. Жаратуу мүмкүнчүлүгү каралат.', price: 1850000, currency: 'KGS', unit: 'шт', minOrder: 1, region: 'Чуйская область', organic: false, exportReady: false, hasDelivery: false, inStock: true, vip: true, views: 891, createdAt: new Date(Date.now() - 20 * 86400000).toISOString() },
    { id: nanoid(), ownerId: 'farmer2', ownerName: 'Тоо Булак', ownerRating: 4.6, ownerVerified: true, title: 'Сабиз — мезгилдик', category: 'vegetables', images: [imgs.carrot], description: 'Кызыл сабиз, жаңы жыйылган. Чоку бойдон сакталган.', price: 30, currency: 'KGS', unit: 'кг', minOrder: 100, region: 'Иссык-Кульская область', organic: true, exportReady: false, hasDelivery: true, inStock: true, vip: false, views: 67, createdAt: new Date(Date.now() - 8 * 86400000).toISOString() },
  ];

  const prices: DbPrice[] = [
    { id: nanoid(), name: 'Картошка', category: 'Жашылча', unit: 'кг', avgPrice: 18, minPrice: 12, maxPrice: 25, weekChange: -3.5, monthChange: 12, updatedAt: new Date().toISOString() },
    { id: nanoid(), name: 'Пияз', category: 'Жашылча', unit: 'кг', avgPrice: 22, minPrice: 15, maxPrice: 30, weekChange: 5.2, monthChange: -8, updatedAt: new Date().toISOString() },
    { id: nanoid(), name: 'Сабиз', category: 'Жашылча', unit: 'кг', avgPrice: 35, minPrice: 25, maxPrice: 50, weekChange: 2.1, monthChange: 15, updatedAt: new Date().toISOString() },
    { id: nanoid(), name: 'Капуста', category: 'Жашылча', unit: 'кг', avgPrice: 28, minPrice: 20, maxPrice: 40, weekChange: -1.2, monthChange: 5, updatedAt: new Date().toISOString() },
    { id: nanoid(), name: 'Томат', category: 'Жашылча', unit: 'кг', avgPrice: 80, minPrice: 60, maxPrice: 120, weekChange: 8.5, monthChange: 22, updatedAt: new Date().toISOString() },
    { id: nanoid(), name: 'Уй эти', category: 'Мал', unit: 'кг', avgPrice: 450, minPrice: 380, maxPrice: 550, weekChange: 1.5, monthChange: 8, updatedAt: new Date().toISOString() },
    { id: nanoid(), name: 'Кой эти', category: 'Мал', unit: 'кг', avgPrice: 520, minPrice: 450, maxPrice: 620, weekChange: 3.2, monthChange: 12, updatedAt: new Date().toISOString() },
    { id: nanoid(), name: 'Жылкы эти', category: 'Мал', unit: 'кг', avgPrice: 480, minPrice: 420, maxPrice: 560, weekChange: 0, monthChange: 5, updatedAt: new Date().toISOString() },
    { id: nanoid(), name: 'Буудай', category: 'Дан', unit: 'кг', avgPrice: 14, minPrice: 11, maxPrice: 18, weekChange: -0.5, monthChange: 3, updatedAt: new Date().toISOString() },
    { id: nanoid(), name: 'Арпа', category: 'Дан', unit: 'кг', avgPrice: 11, minPrice: 9, maxPrice: 14, weekChange: 1.0, monthChange: 7, updatedAt: new Date().toISOString() },
    { id: nanoid(), name: 'Жүгөрү', category: 'Дан', unit: 'кг', avgPrice: 16, minPrice: 13, maxPrice: 20, weekChange: -2.0, monthChange: -5, updatedAt: new Date().toISOString() },
    { id: nanoid(), name: 'Бал', category: 'Башкалар', unit: 'кг', avgPrice: 700, minPrice: 500, maxPrice: 900, weekChange: 0, monthChange: 10, updatedAt: new Date().toISOString() },
  ];

  db.users.push(...users);
  db.listings.push(...listings);
  db.prices.push(...prices);
  db.announcements.push(
    { id: nanoid(), authorId: 'buyer1', authorName: 'Марат Беков', authorRole: 'buyer', title: '100 тонна картошка керек — опт', category: 'vegetables', qty: 100000, unit: 'кг', region: 'Бишкек', description: 'Чуй же Ош чарбасынан картошка сатып алам. Туруктуу жеткирүү менен. Баасын сүйлөшөбүз.', deadline: '2025-11-01', status: 'open', offerCount: 7, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: nanoid(), authorId: 'exporter1', authorName: 'KG Export LLC', authorRole: 'exporter', title: 'Экспорт үчүн алма керек — 50 тонна', category: 'fruits', qty: 50000, unit: 'кг', region: '', description: 'Сертификаттуу органикалык алма. Казахстанга экспорт. Талапка ылайык жеткирүү.', status: 'open', offerCount: 3, createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  );
  db.transports.push(
    { id: nanoid(), ownerId: 'transport1', ownerName: 'КамАЗ ЖЧК', ownerPhone: '+996700666666', type: 'kamaz', capacity: '20 тонна', route: 'Ош — Бишкек', availableDates: 'Дүйшөмбү, Сейшемби, Бейшемби', region: 'Ошская область', price: 35000, createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
    { id: nanoid(), ownerId: 'farmer1', ownerName: 'Айбек Турсунов', ownerPhone: '+996700111111', type: 'gazelle', capacity: '2 тонна', route: 'Чуй — Бишкек', availableDates: 'Ар күн', region: 'Чуйская область', price: 5000, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  );

  writeDb(db);
  console.log('✅ Демо маалыматтар жүктөлдү!');
  console.log('👤 Аккаунттар (сырсөз: 123456):');
  console.log('  admin@test.kg     — Администратор');
  console.log('  farmer@test.kg    — Фермер (Верификацияланган)');
  console.log('  farmer2@test.kg   — Фермер (Иссык-Көл)');
  console.log('  buyer@test.kg     — Сатып алуучу');
  console.log('  export@test.kg    — Экспорттоочу');
  console.log('  transport@test.kg — Транспорт');
}

seed();
