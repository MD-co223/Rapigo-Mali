import { db } from '../src/lib/db';
import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log('🌱 Seeding Rapigo Mali database (minimal)...');

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

  // === ADMIN USER (ONLY) ===
  const adminPassword = await hashPassword('Admin@123');
  await db.user.create({
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
  console.log('  ✅ Admin user created (admin@rapigo.ml / Admin@123)');

  // === BASIC SETTINGS ===
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
    { name: 'Starter', slug: 'starter', price: 0, duration: 30, maxProducts: 20, priority: 0, features: JSON.stringify(['Profil boutique', '20 produits', 'Commandes basiques']) },
    { name: 'Pro', slug: 'pro', price: 15000, duration: 30, maxProducts: 100, priority: 1, features: JSON.stringify(['Profil boutique premium', '100 produits', 'Statistiques avancées', 'Support prioritaire', 'Publicités']) },
    { name: 'Business', slug: 'business', price: 35000, duration: 30, maxProducts: 500, priority: 2, features: JSON.stringify(['Tout Pro', '500 produits', 'API access', 'Gestionnaire dédié', 'Marketing avancé', 'Badge vérifié']) },
    { name: 'Enterprise', slug: 'enterprise', price: 75000, duration: 30, maxProducts: 9999, priority: 3, features: JSON.stringify(['Tout Business', 'Produits illimités', 'Intégration complète', 'Account manager', 'Analytics premium', 'SLA garanti']) },
  ];

  for (const p of plans) {
    await db.plan.create({ data: p });
  }
  console.log('  ✅ Plans created');

  // === CATEGORIES (empty structure, user will fill content) ===
  const categories = [
    { name: 'Restaurants', slug: 'restaurants', icon: '🍽️', sortOrder: 1 },
    { name: 'Supermarchés', slug: 'supermarches', icon: '🛒', sortOrder: 2 },
    { name: 'Pharmacies', slug: 'pharmacies', icon: '💊', sortOrder: 3 },
    { name: 'Boutiques', slug: 'boutiques', icon: '🛍️', sortOrder: 4 },
    { name: 'Colis', slug: 'colis', icon: '📦', sortOrder: 5 },
    { name: 'Boissons', slug: 'boissons', icon: '🥤', sortOrder: 6 },
    { name: 'Plats locaux', slug: 'plats-locaux', icon: '🍛', sortOrder: 7 },
    { name: 'Fast Food', slug: 'fast-food', icon: '🍔', sortOrder: 8 },
    { name: 'Pâtisserie', slug: 'patisserie', icon: '🧁', sortOrder: 9 },
    { name: 'Épicerie', slug: 'epicerie', icon: '🛒', sortOrder: 10 },
    { name: 'Produits de beauté', slug: 'produits-beaute', icon: '💄', sortOrder: 11 },
    { name: 'Électronique', slug: 'electronique', icon: '📱', sortOrder: 12 },
  ];

  for (const c of categories) {
    await db.category.create({ data: c });
  }
  console.log('  ✅ Categories created (empty - no merchants, products, or users)');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n--- Test Account ---');
  console.log('Admin:   admin@rapigo.ml / Admin@123');
  console.log('\n💡 Register new accounts via the app to add merchants, drivers, and clients.');
  console.log('💡 The platform is empty - add your own data through the admin panel.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });