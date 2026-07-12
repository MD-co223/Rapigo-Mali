import { db } from '../src/lib/db';
import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log('🌱 Seeding Rapigo Mali database...');

  // Clean existing data
  await db.auditLog.deleteMany();
  await db.transaction.deleteMany();
  await db.wallet.deleteMany();
  await db.rating.deleteMany();
  await db.message.deleteMany();
  await db.chat.deleteMany();
  await db.notification.deleteMany();
  await db.driverLocation.deleteMany();
  await db.delivery.deleteMany();
  await db.payment.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.couponUsage.deleteMany();
  await db.coupon.deleteMany();
  await db.referral.deleteMany();
  await db.favorite.deleteMany();
  await db.advertisement.deleteMany();
  await db.subscription.deleteMany();
  await db.product.deleteMany();
  await db.business.deleteMany();
  await db.category.deleteMany();
  await db.plan.deleteMany();
  await db.supportTicket.deleteMany();
  await db.report.deleteMany();
  await db.setting.deleteMany();
  await db.driver.deleteMany();
  await db.merchant.deleteMany();
  await db.client.deleteMany();
  await db.user.deleteMany();

  // === SETTINGS ===
  const settings = [
    { key: 'platform_name', value: 'Rapigo Mali', type: 'STRING', group: 'GENERAL' },
    { key: 'platform_currency', value: 'XOF', type: 'STRING', group: 'GENERAL' },
    { key: 'default_city', value: 'Bamako', type: 'STRING', group: 'GENERAL' },
    { key: 'delivery_base_fee', value: '500', type: 'NUMBER', group: 'DELIVERY' },
    { key: 'delivery_per_km_fee', value: '200', type: 'NUMBER', group: 'DELIVERY' },
    { key: 'delivery_free_threshold', value: '10000', type: 'NUMBER', group: 'DELIVERY' },
    { key: 'service_fee_rate', value: '0.05', type: 'NUMBER', group: 'PAYMENT' },
    { key: 'min_order_amount', value: '1000', type: 'NUMBER', group: 'GENERAL' },
    { key: 'max_delivery_radius', value: '15', type: 'NUMBER', group: 'DELIVERY' },
    { key: 'loyalty_points_rate', value: '1', type: 'NUMBER', group: 'GENERAL' },
    { key: 'referral_reward', value: '2000', type: 'NUMBER', group: 'GENERAL' },
    { key: 'driver_commission_rate', value: '0.20', type: 'NUMBER', group: 'PAYMENT' },
    { key: 'dark_mode_default', value: 'false', type: 'BOOLEAN', group: 'GENERAL' },
    { key: 'maintenance_mode', value: 'false', type: 'BOOLEAN', group: 'SECURITY' },
    { key: 'otp_expiry_seconds', value: '300', type: 'NUMBER', group: 'SECURITY' },
  ];

  for (const s of settings) {
    await db.setting.create({ data: s });
  }
  console.log('  ✅ Settings created');

  // === PLANS ===
  const plans = [
    { name: 'Starter', slug: 'starter', price: 0, duration: 30, maxProducts: 20, priority: 0, features: JSON.stringify(['Profil boutique', '5 produits', 'Commandes basiques']) },
    { name: 'Pro', slug: 'pro', price: 15000, duration: 30, maxProducts: 100, priority: 1, features: JSON.stringify(['Profil boutique premium', '100 produits', 'Statistiques avancées', 'Support prioritaire', 'Publicités']) },
    { name: 'Business', slug: 'business', price: 35000, duration: 30, maxProducts: 500, priority: 2, features: JSON.stringify(['Tout Pro', '500 produits', 'API access', 'Gestionnaire dédié', 'Marketing avancé', 'Badge vérifié']) },
    { name: 'Enterprise', slug: 'enterprise', price: 75000, duration: 30, maxProducts: 9999, priority: 3, features: JSON.stringify(['Tout Business', 'Produits illimités', 'Intégration complète', 'Account manager', 'Analytics premium', 'SLA garanti']) },
  ];

  for (const p of plans) {
    await db.plan.create({ data: p });
  }
  console.log('  ✅ Plans created');

  // === CATEGORIES ===
  const categories = [
    { name: 'Restaurants', slug: 'restaurants', icon: '🍽️', sortOrder: 1 },
    { name: 'Supermarchés', slug: 'supermarches', icon: '🛒', sortOrder: 2 },
    { name: 'Pharmacies', slug: 'pharmacies', icon: '💊', sortOrder: 3 },
    { name: 'Boutiques', slug: 'boutiques', icon: '🛍️', sortOrder: 4 },
    { name: 'Colis', slug: 'colis', icon: '📦', sortOrder: 5 },
    { name: 'Boissons', slug: 'boissons', icon: '🥤', sortOrder: 6, parentId: null },
    { name: 'Plats locaux', slug: 'plats-locaux', icon: '🍛', sortOrder: 7 },
    { name: 'Fast Food', slug: 'fast-food', icon: '🍔', sortOrder: 8 },
    { name: 'Pâtisserie', slug: 'patisserie', icon: '🧁', sortOrder: 9 },
    { name: 'Épicerie', slug: 'epicerie', icon: '🛒', sortOrder: 10 },
    { name: 'Produits de beauté', slug: 'produits-beaute', icon: '💄', sortOrder: 11 },
    { name: 'Électronique', slug: 'electronique', icon: '📱', sortOrder: 12 },
  ];

  const createdCategories: Record<string, string> = {};
  for (const c of categories) {
    const cat = await db.category.create({ data: { ...c, parentId: c.parentId ? createdCategories[c.parentId] : null } });
    createdCategories[c.slug] = cat.id;
  }
  console.log('  ✅ Categories created');

  // === ADMIN USER ===
  const adminPassword = await hashPassword('Admin@123');
  const admin = await db.user.create({
    data: {
      email: 'admin@rapigo.ml',
      phone: '+22370000000',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'Rapigo',
      role: 'ADMIN',
      isVerified: true,
      isActive: true,
    },
  });
  console.log('  ✅ Admin user created');

  // === MERCHANT USERS ===
  const merchants = [
    { name: 'Le Terranga', type: 'RESTAURANT', desc: 'Restaurant malien traditionnel', phone: '+22370000001', email: 'terranga@rapigo.ml', quartier: 'Hamdallaye' },
    { name: 'Supermarché Sahel', type: 'SUPERMARKET', desc: 'Votre supermarché de quartier', phone: '+22370000002', email: 'sahel@rapigo.ml', quartier: 'Badalabougou' },
    { name: 'Pharmacie Centrale', type: 'PHARMACY', desc: 'Pharmacie de confiance', phone: '+22370000003', email: 'pharmacie@rapigo.ml', quartier: 'ACI 2000' },
    { name: 'Boutique Fashion Mall', type: 'BOUTIQUE', desc: 'Mode et accessoires', phone: '+22370000004', email: 'fashion@rapigo.ml', quartier: 'Lafiabougou' },
    { name: 'Chez Kadi', type: 'RESTAURANT', desc: 'Cuisine africaine authentique', phone: '+22370000005', email: 'kadi@rapigo.ml', quartier: 'Kalaban-Coura' },
    { name: 'Express Colis', type: 'COLIS', desc: 'Livraison rapide de colis', phone: '+22370000006', email: 'express@rapigo.ml', quartier: 'Sotuba' },
    { name: 'Tokyo Sushi', type: 'RESTAURANT', desc: 'Restaurant japonais', phone: '+22370000007', email: 'tokyo@rapigo.ml', quartier: 'Baco Djicoroni' },
    { name: 'Green Market', type: 'SUPERMARKET', desc: 'Produits bio et locaux', phone: '+22370000008', email: 'green@rapigo.ml', quartier: 'Faso Kanu' },
  ];

  const createdMerchants: Array<{ id: string; userId: string; type: string }> = [];
  for (const m of merchants) {
    const pass = await hashPassword('Merchant@123');
    const user = await db.user.create({
      data: {
        email: m.email,
        phone: m.phone,
        password: pass,
        firstName: m.name,
        lastName: '',
        role: 'MERCHANT',
        isVerified: true,
      },
    });
    const merchant = await db.merchant.create({
      data: {
        userId: user.id,
        businessName: m.name,
        businessType: m.type,
        description: m.desc,
        phone: m.phone,
        email: m.email,
        address: `Bamako, ${m.quartier}`,
        quartier: m.quartier,
        city: 'Bamako',
        isApproved: true,
        isFeatured: ['Le Terranga', 'Tokyo Sushi'].includes(m.name),
        rating: 4.0 + Math.random() * 1.0,
        totalRatings: Math.floor(Math.random() * 200) + 50,
      },
    });
    createdMerchants.push({ id: merchant.id, userId: user.id, type: m.type });
  }
  console.log('  ✅ Merchants created');

  // === DRIVER USERS ===
  const driverNames = ['Moussa Traoré', 'Amadou Diallo', 'Ibrahim Keita', 'Oumar Sidibé', 'Seydou Coulibaly', 'Bakary Diarra', 'Modibo Sangaré', 'Fatoumata Diabaté'];
  const createdDrivers: string[] = [];
  for (let i = 0; i < driverNames.length; i++) {
    const pass = await hashPassword('Driver@123');
    const [first, last] = driverNames[i].split(' ');
    const user = await db.user.create({
      data: {
        email: `driver${i + 1}@rapigo.ml`,
        phone: `+2237100000${i}`,
        password: pass,
        firstName: first,
        lastName: last,
        role: 'DRIVER',
        isVerified: true,
      },
    });
    const driver = await db.driver.create({
      data: {
        userId: user.id,
        vehicleType: i < 6 ? 'MOTO' : 'VOITURE',
        vehiclePlate: `ML-${1000 + i}-BJ`,
        vehicleBrand: ['Yamaha', 'Honda', 'Suzuki', 'Piaggio', 'TVS', 'Bajaj', 'Toyota', 'Renault'][i],
        vehicleColor: ['Noir', 'Rouge', 'Bleu', 'Vert', 'Blanc', 'Gris', 'Noir', 'Blanc'][i],
        idCardNumber: `ID${1000000 + i}`,
        licenseNumber: `PERMIS${100000 + i}`,
        isVerified: true,
        isOnline: Math.random() > 0.3,
        isAvailable: Math.random() > 0.4,
        rating: 3.5 + Math.random() * 1.5,
        totalRatings: Math.floor(Math.random() * 300) + 50,
        totalDeliveries: Math.floor(Math.random() * 500) + 100,
        totalEarnings: Math.random() * 2000000 + 500000,
        currentLat: 12.6392 + (Math.random() - 0.5) * 0.1,
        currentLng: -8.0029 + (Math.random() - 0.5) * 0.1,
        bonus: Math.random() * 50000,
      },
    });
    createdDrivers.push(driver.id);
  }
  console.log('  ✅ Drivers created');

  // === CLIENT USERS ===
  const clientNames = ['Aminata Konaté', 'Mamadou Touré', 'Fatoumata Cissé', 'Ibrahima Dembélé', 'Kadiatou Bah', 'Souleymane Sacko', 'Awa Camara', 'Drissa Koné', 'Mariam Ouattara', 'Rokia Sangaré'];
  const createdClients: Array<{ id: string; userId: string; referralCode: string }> = [];
  for (let i = 0; i < clientNames.length; i++) {
    const pass = await hashPassword('Client@123');
    const [first, last] = clientNames[i].split(' ');
    const referralCode = `RAPIGO${first.toUpperCase().slice(0, 3)}${i + 100}`;
    const user = await db.user.create({
      data: {
        email: `client${i + 1}@rapigo.ml`,
        phone: `+2237200000${i}`,
        password: pass,
        firstName: first,
        lastName: last,
        role: 'CLIENT',
        isVerified: true,
      },
    });
    const client = await db.client.create({
      data: {
        userId: user.id,
        address: `Quartier ${['Hamdallaye', 'Badalabougou', 'ACI 2000', 'Kalaban', 'Lafiabougou', 'Sotuba', 'Baco Djicoroni', 'Faso Kanu', 'Djicoroni Para', 'Sabalibougou'][i]}`,
        city: 'Bamako',
        quartier: ['Hamdallaye', 'Badalabougou', 'ACI 2000', 'Kalaban', 'Lafiabougou', 'Sotuba', 'Baco Djicoroni', 'Faso Kanu', 'Djicoroni Para', 'Sabalibougou'][i],
        loyaltyPoints: Math.floor(Math.random() * 5000) + 500,
        totalSpent: Math.random() * 500000 + 50000,
        totalOrders: Math.floor(Math.random() * 50) + 5,
        referralCode,
      },
    });
    createdClients.push({ id: client.id, userId: user.id, referralCode });

    // Create wallet
    await db.wallet.create({
      data: {
        userId: user.id,
        balance: Math.floor(Math.random() * 50000) + 5000,
      },
    });
  }
  console.log('  ✅ Clients created');

  // === BUSINESSES ===
  const businessNames = [
    { merchantIdx: 0, name: 'Le Terranga - Centre-ville', quartier: 'Hamdallaye' },
    { merchantIdx: 0, name: 'Le Terranga - ACI', quartier: 'ACI 2000' },
    { merchantIdx: 1, name: 'Supermarché Sahel - Principal', quartier: 'Badalabougou' },
    { merchantIdx: 2, name: 'Pharmacie Centrale - 24h', quartier: 'ACI 2000' },
    { merchantIdx: 4, name: 'Chez Kadi - Kalaban', quartier: 'Kalaban-Coura' },
    { merchantIdx: 6, name: 'Tokyo Sushi - Bamako', quartier: 'Baco Djicoroni' },
    { merchantIdx: 7, name: 'Green Market - Bio', quartier: 'Faso Kanu' },
  ];

  const createdBusinesses: string[] = [];
  for (const b of businessNames) {
    const biz = await db.business.create({
      data: {
        merchantId: createdMerchants[b.merchantIdx].id,
        name: b.name,
        slug: b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        address: `Bamako, ${b.quartier}`,
        city: 'Bamako',
        quartier: b.quartier,
        lat: 12.6392 + (Math.random() - 0.5) * 0.05,
        lng: -8.0029 + (Math.random() - 0.5) * 0.05,
        phone: `+2237000000${b.merchantIdx}`,
        isOpen: Math.random() > 0.2,
      },
    });
    createdBusinesses.push(biz.id);
  }
  console.log('  ✅ Businesses created');

  // === PRODUCTS ===
  const productData = [
    // Le Terranga
    { merchantIdx: 0, businessIdx: 0, cat: 'plats-locaux', name: 'Tô avec sauce arachide', price: 2500, stock: 50 },
    { merchantIdx: 0, businessIdx: 0, cat: 'plats-locaux', name: 'Riz au gras', price: 3000, stock: 40 },
    { merchantIdx: 0, businessIdx: 0, cat: 'plats-locaux', name: 'Foutou avec poisson', price: 3500, stock: 30 },
    { merchantIdx: 0, businessIdx: 0, cat: 'boissons', name: 'Bissap frais', price: 500, stock: 100 },
    { merchantIdx: 0, businessIdx: 0, cat: 'boissons', name: 'Gingembre', price: 500, stock: 80 },
    { merchantIdx: 0, businessIdx: 0, cat: 'fast-food', name: 'Brochette poulet', price: 1500, stock: 60 },
    { merchantIdx: 0, businessIdx: 0, cat: 'patisserie', name: 'Gâteau chocolat', price: 2000, stock: 20 },
    // Supermarché Sahel
    { merchantIdx: 1, businessIdx: 2, cat: 'epicerie', name: 'Riz 25kg', price: 15000, stock: 200 },
    { merchantIdx: 1, businessIdx: 2, cat: 'epicerie', name: 'Huile 5L', price: 7500, stock: 150 },
    { merchantIdx: 1, businessIdx: 2, cat: 'epicerie', name: 'Lait concentré x12', price: 5500, stock: 100 },
    { merchantIdx: 1, businessIdx: 2, cat: 'epicerie', name: 'Sucre 1kg', price: 1200, stock: 300 },
    { merchantIdx: 1, businessIdx: 2, cat: 'boissons', name: 'Eau minérale x12', price: 3000, stock: 500 },
    // Pharmacie
    { merchantIdx: 2, businessIdx: 3, cat: 'pharmacies', name: 'Paracétamol 500mg', price: 500, stock: 500 },
    { merchantIdx: 2, businessIdx: 3, cat: 'pharmacies', name: 'Amoxicilline 1g', price: 2500, stock: 200 },
    { merchantIdx: 2, businessIdx: 3, cat: 'pharmacies', name: 'Vitamine C', price: 1500, stock: 300 },
    // Chez Kadi
    { merchantIdx: 4, businessIdx: 4, cat: 'plats-locaux', name: 'Poulet braisé', price: 4000, stock: 25 },
    { merchantIdx: 4, businessIdx: 4, cat: 'plats-locaux', name: 'Couscous poisson', price: 3500, stock: 20 },
    { merchantIdx: 4, businessIdx: 4, cat: 'boissons', name: 'Jus de mangue', price: 750, stock: 60 },
    // Tokyo Sushi
    { merchantIdx: 6, businessIdx: 5, cat: 'restaurants', name: 'Sashimi mixte', price: 8000, stock: 15 },
    { merchantIdx: 6, businessIdx: 5, cat: 'restaurants', name: 'Maki Californien x8', price: 4500, stock: 20 },
    { merchantIdx: 6, businessIdx: 5, cat: 'restaurants', name: 'Ramen poulet', price: 5000, stock: 25 },
    { merchantIdx: 6, businessIdx: 5, cat: 'restaurants', name: 'Edamame', price: 2000, stock: 40 },
    // Green Market
    { merchantIdx: 7, businessIdx: 6, cat: 'epicerie', name: 'Mangues bio 1kg', price: 2000, stock: 100 },
    { merchantIdx: 7, businessIdx: 6, cat: 'epicerie', name: 'Tomates bio 1kg', price: 800, stock: 150 },
    { merchantIdx: 7, businessIdx: 6, cat: 'epicerie', name: 'Poulet fermier', price: 5000, stock: 30 },
    // Boutique Fashion
    { merchantIdx: 3, businessIdx: undefined, cat: 'produits-beaute', name: 'Parfum premium', price: 25000, stock: 30 },
    { merchantIdx: 3, businessIdx: undefined, cat: 'produits-beaute', name: 'Crème visage bio', price: 8000, stock: 50 },
    { merchantIdx: 3, businessIdx: undefined, cat: 'electronique', name: 'Écouteurs Bluetooth', price: 15000, stock: 40 },
    { merchantIdx: 3, businessIdx: undefined, cat: 'electronique', name: 'Chargeur rapide', price: 7500, stock: 60 },
  ];

  for (const p of productData) {
    await db.product.create({
      data: {
        merchantId: createdMerchants[p.merchantIdx].id,
        businessId: p.businessIdx !== undefined ? createdBusinesses[p.businessIdx] : null,
        categoryId: createdCategories[p.cat],
        name: p.name,
        slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        price: p.price,
        comparePrice: p.price > 5000 ? p.price * 1.15 : undefined,
        stock: p.stock,
        isAvailable: true,
        isFeatured: Math.random() > 0.6,
        totalSold: Math.floor(Math.random() * 200) + 10,
      },
    });
  }
  console.log('  ✅ Products created');

  // === COUPONS ===
  await db.coupon.createMany({
    data: [
      { code: 'BIENVENUE', type: 'PERCENTAGE', value: 20, minOrder: 2000, maxUses: 1000, endDate: new Date(Date.now() + 90 * 86400000) },
      { code: 'LIVRAISON GRATUITE', type: 'FREE_DELIVERY', value: 0, minOrder: 5000, maxUses: 500, endDate: new Date(Date.now() + 60 * 86400000) },
      { code: 'RAPIGO500', type: 'FIXED', value: 500, minOrder: 3000, maxUses: 2000, endDate: new Date(Date.now() + 120 * 86400000) },
    ],
  });
  console.log('  ✅ Coupons created');

  // === SAMPLE ORDERS ===
  const statuses = ['DELIVERED', 'DELIVERED', 'DELIVERED', 'IN_TRANSIT', 'PREPARING', 'PENDING', 'CANCELLED', 'DELIVERED'];
  for (let i = 0; i < 8; i++) {
    const merchantIdx = i % createdMerchants.length;
    const clientIdx = i % createdClients.length;
    const subtotal = Math.floor(Math.random() * 15000) + 2000;
    const deliveryFee = i < 5 ? 500 : 0;
    const total = subtotal + deliveryFee;

    const order = await db.order.create({
      data: {
        orderNumber: `ORD-${String(1000 + i).padStart(6, '0')}`,
        clientId: createdClients[clientIdx].id,
        merchantId: createdMerchants[merchantIdx].id,
        driverId: createdDrivers[i % createdDrivers.length] || null,
        status: statuses[i],
        subtotal,
        deliveryFee,
        serviceFee: Math.floor(subtotal * 0.05),
        total,
        paymentMethod: ['CASH', 'ORANGE_MONEY', 'MOOV_MONEY', 'WALLET'][i % 4],
        paymentStatus: statuses[i] === 'DELIVERED' ? 'PAID' : statuses[i] === 'CANCELLED' ? 'REFUNDED' : 'PENDING',
        deliveryAddress: 'Bamako, Hamdallaye',
        deliveryCity: 'Bamako',
        deliveryQuartier: 'Hamdallaye',
        estimatedTime: 30 + Math.floor(Math.random() * 20),
        deliveredAt: statuses[i] === 'DELIVERED' ? new Date(Date.now() - (8 - i) * 86400000) : null,
        cancelledAt: statuses[i] === 'CANCELLED' ? new Date(Date.now() - 86400000) : null,
        createdAt: new Date(Date.now() - (8 - i) * 86400000),
      },
    });

    // Add order items
    const allProducts = await db.product.findMany({ take: 30 });
    if (allProducts.length > 0) {
      const product = allProducts[i % allProducts.length];
      await db.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          productName: product.name,
          quantity: Math.floor(Math.random() * 3) + 1,
          unitPrice: product.price,
          totalPrice: product.price * (Math.floor(Math.random() * 3) + 1),
        },
      });
    }

    // Create payment for delivered orders
    if (statuses[i] === 'DELIVERED') {
      await db.payment.create({
        data: {
          orderId: order.id,
          userId: createdClients[clientIdx].userId,
          amount: total,
          method: order.paymentMethod,
          status: 'COMPLETED',
          transactionRef: `TXN-${Date.now()}-${i}`,
          paidAt: new Date(Date.now() - (8 - i) * 86400000),
        },
      });
    }
  }
  console.log('  ✅ Orders created');

  // === SUBSCRIPTIONS ===
  for (let i = 0; i < 3; i++) {
    const planIdx = (i % 3) + 1; // Skip free plan
    await db.subscription.create({
      data: {
        merchantId: createdMerchants[i].id,
        planId: (await db.plan.findFirst({ where: { slug: ['starter', 'pro', 'business', 'enterprise'][planIdx] } }))!.id,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 86400000),
        autoRenew: i === 1,
      },
    });
  }
  console.log('  ✅ Subscriptions created');

  // === ADVERTISEMENTS ===
  await db.advertisement.createMany({
    data: [
      { merchantId: createdMerchants[0].id, title: 'Découvrez Le Terranga !', description: 'Plats traditionnels livrés chez vous', type: 'BANNER', position: 'HOME', endDate: new Date(Date.now() + 30 * 86400000), budget: 50000, impressions: 12500, clicks: 450 },
      { merchantId: createdMerchants[6].id, title: 'Tokyo Sushi - Nouveau !', description: 'Sushi authentique à Bamako', type: 'BANNER', position: 'HOME', endDate: new Date(Date.now() + 30 * 86400000), budget: 30000, impressions: 8200, clicks: 320 },
      { title: 'Livraison gratuite cette semaine', description: 'Sur toutes les commandes +5000 FCFA', type: 'POPUP', position: 'HOME', endDate: new Date(Date.now() + 7 * 86400000) },
    ],
  });
  console.log('  ✅ Advertisements created');

  // === NOTIFICATIONS ===
  for (let i = 0; i < 5; i++) {
    await db.notification.create({
      data: {
        userId: createdClients[i].userId,
        title: ['Commande confirmée', 'Livraison en cours', 'Promotion spéciale', 'Nouveau restaurant', 'Points fidélité'][i],
        message: ['Votre commande #1001 a été confirmée', 'Votre livreur est en route', '-20% avec le code BIENVENUE', 'Tokyo Sushi est maintenant disponible', 'Vous avez gagné 100 points'][i],
        type: ['ORDER', 'ORDER', 'PROMO', 'INFO', 'SYSTEM'][i],
        isRead: i > 2,
      },
    });
  }
  console.log('  ✅ Notifications created');

  // === SUPPORT TICKETS ===
  await db.supportTicket.createMany({
    data: [
      { userId: createdClients[0].userId, subject: 'Commande retardée', description: 'Ma commande est en retard de plus de 30 minutes', priority: 'HIGH' },
      { userId: createdClients[1].userId, subject: 'Produit manquant', description: 'Un produit manque dans ma commande', priority: 'MEDIUM', status: 'IN_PROGRESS' },
    ],
  });
  console.log('  ✅ Support tickets created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n--- Test Accounts ---');
  console.log('Admin:   admin@rapigo.ml / Admin@123');
  console.log('Client:  client1@rapigo.ml / Client@123');
  console.log('Merchant: terranga@rapigo.ml / Merchant@123');
  console.log('Driver:  driver1@rapigo.ml / Driver@123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });