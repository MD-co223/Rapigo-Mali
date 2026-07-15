import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Rapigo Mali V2.0...');

  // Clean all data (except we just created fresh DB, but be safe)
  await prisma.auditLog.deleteMany();
  await prisma.driverLocation.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.couponUsage.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.product.deleteMany();
  await prisma.deliveryZone.deleteMany();
  await prisma.merchantPaymentConfig.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.advertisement.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.report.deleteMany();
  await prisma.client.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.category.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  // ============================================
  // SUPER ADMINISTRATOR
  // ============================================
  const adminPassword = await bcrypt.hash('pispa2026', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'diarramoussaka7@gmail.com',
      phone: '+22370000000',
      password: adminPassword,
      firstName: 'Super',
      lastName: 'Administrateur',
      role: 'ADMIN',
      isSuperAdmin: true,
      isVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Super Admin created:', admin.email);

  // ============================================
  // PLANS D'ABONNEMENT
  // ============================================
  const plans = [
    {
      name: 'Starter',
      slug: 'starter',
      price: 0,
      duration: 30,
      features: JSON.stringify(['5 produits maximum', 'Commandes illimitées', 'Support email']),
      maxProducts: 5,
      maxOrders: null,
      maxCoupons: 1,
      priority: 0,
    },
    {
      name: 'Pro',
      slug: 'pro',
      price: 15000,
      duration: 30,
      features: JSON.stringify(['50 produits maximum', 'Commandes illimitées', '5 coupons', 'Support prioritaire', 'Statistiques avancées']),
      maxProducts: 50,
      maxOrders: null,
      maxCoupons: 5,
      priority: 10,
    },
    {
      name: 'Business',
      slug: 'business',
      price: 35000,
      duration: 30,
      features: JSON.stringify(['200 produits maximum', 'Commandes illimitées', 'Coupons illimités', 'Support dédié', 'Statistiques avancées', 'Publicités', 'Livraison multi-zones']),
      maxProducts: 200,
      maxOrders: null,
      maxCoupons: null,
      priority: 20,
    },
    {
      name: 'Enterprise',
      slug: 'enterprise',
      price: 75000,
      duration: 30,
      features: JSON.stringify(['Produits illimités', 'Commandes illimitées', 'Coupons illimités', 'Support 24/7', 'Statistiques complètes', 'Publicités prioritaires', 'API access', 'Livraison multi-zones', 'Badge vérifié']),
      maxProducts: null,
      maxOrders: null,
      maxCoupons: null,
      priority: 30,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.create({ data: plan });
  }
  console.log(`✅ ${plans.length} plans created`);

  // ============================================
  // CATEGORIES
  // ============================================
  const categories = [
    { name: 'Restaurants', slug: 'restaurants', icon: 'UtensilsCrossed', sortOrder: 1 },
    { name: 'Fast Food', slug: 'fast-food', icon: 'Burger', sortOrder: 2, parentId: undefined },
    { name: 'Plats locaux', slug: 'plats-locaux', icon: 'Soup', sortOrder: 3 },
    { name: 'Pâtisserie', slug: 'patisserie', icon: 'Cake', sortOrder: 4 },
    { name: 'Boissons', slug: 'boissons', icon: 'Wine', sortOrder: 5 },
    { name: 'Supermarchés', slug: 'supermarches', icon: 'ShoppingCart', sortOrder: 6 },
    { name: 'Épicerie', slug: 'epicerie', icon: 'Store', sortOrder: 7 },
    { name: 'Fruits & Légumes', slug: 'fruits-legumes', icon: 'Apple', sortOrder: 8 },
    { name: 'Pharmacies', slug: 'pharmacies', icon: 'Pill', sortOrder: 9 },
    { name: 'Boutiques', slug: 'boutiques', icon: 'ShoppingBag', sortOrder: 10 },
    { name: 'Électronique', slug: 'electronique', icon: 'Smartphone', sortOrder: 11 },
    { name: 'Mode & Vêtements', slug: 'mode-vetements', icon: 'Shirt', sortOrder: 12 },
    { name: 'Beauté & Santé', slug: 'beaute-sante', icon: 'Sparkles', sortOrder: 13 },
    { name: 'Colis & Envois', slug: 'colis-envois', icon: 'Package', sortOrder: 14 },
    { name: 'Services', slug: 'services', icon: 'Wrench', sortOrder: 15 },
  ];

  for (const cat of categories) {
    await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });
  }
  console.log(`✅ ${categories.length} categories created`);

  // ============================================
  // SYSTEM SETTINGS
  // ============================================
  const settings = [
    // General
    { key: 'app_name', value: 'Rapigo Mali', type: 'STRING', group: 'GENERAL' },
    { key: 'app_currency', value: 'XOF', type: 'STRING', group: 'GENERAL' },
    { key: 'app_country', value: 'Mali', type: 'STRING', group: 'GENERAL' },
    { key: 'default_city', value: 'Bamako', type: 'STRING', group: 'GENERAL' },
    { key: 'support_email', value: 'support@rapigo.ml', type: 'STRING', group: 'GENERAL' },
    { key: 'support_phone', value: '+22370000001', type: 'STRING', group: 'GENERAL' },
    
    // Commission
    { key: 'default_commission_rate', value: '10', type: 'NUMBER', group: 'COMMISSION' },
    { key: 'min_commission', value: '0', type: 'NUMBER', group: 'COMMISSION' },
    { key: 'driver_commission_rate', value: '15', type: 'NUMBER', group: 'COMMISSION' },
    
    // Delivery
    { key: 'default_delivery_fee', value: '500', type: 'NUMBER', group: 'DELIVERY' },
    { key: 'max_delivery_radius', value: '15', type: 'NUMBER', group: 'DELIVERY' },
    { key: 'free_delivery_threshold', value: '5000', type: 'NUMBER', group: 'DELIVERY' },
    
    // Payment
    { key: 'payment_methods_enabled', value: '["CASH","ORANGE_MONEY","MOOV_MONEY","WAVE","VISA","MASTERCARD","QR_CODE"]', type: 'JSON', group: 'PAYMENT' },
    { key: 'cash_on_delivery_enabled', value: 'true', type: 'BOOLEAN', group: 'PAYMENT' },
    { key: 'payment_proof_required', value: 'true', type: 'BOOLEAN', group: 'PAYMENT' },
    
    // Security
    { key: 'max_login_attempts', value: '5', type: 'NUMBER', group: 'SECURITY' },
    { key: 'session_duration_hours', value: '168', type: 'NUMBER', group: 'SECURITY' },
    { key: 'otp_expiry_minutes', value: '10', type: 'NUMBER', group: 'SECURITY' },
    
    // Notification
    { key: 'notification_email_enabled', value: 'false', type: 'BOOLEAN', group: 'NOTIFICATION' },
    { key: 'notification_sms_enabled', value: 'false', type: 'BOOLEAN', group: 'NOTIFICATION' },
    { key: 'notification_push_enabled', value: 'true', type: 'BOOLEAN', group: 'NOTIFICATION' },
  ];

  for (const setting of settings) {
    await prisma.setting.create({ data: setting });
  }
  console.log(`✅ ${settings.length} settings created`);

  // ============================================
  // DEFAULT CITIES & QUARTIERS (in settings)
  // ============================================
  const cities = [
    {
      name: 'Bamako',
      quartiers: JSON.stringify([
        'Badalabougou', 'Baco Djicoroni', 'Banconi', 'Boulkassoumbougou',
        'Daoudabougou', 'Djicoroni Para', 'Faladiè', 'Hamdallaye',
        'Kalaban-Coura', 'Korofina', 'Lafiabougou', 'Mahamana',
        'Missabougou', 'Niamakoro', 'Quinzambougou', 'Sabalibougou',
        'Sekoro', 'Sotuba', 'Tokorou', 'Yirimadio'
      ]),
    },
    {
      name: 'Ségou',
      quartiers: JSON.stringify(['Ségou ville', 'Sokolo', 'Markala', 'San']),
    },
  ];

  for (const city of cities) {
    await prisma.setting.create({
      data: {
        key: `city_${city.name.toLowerCase().replace(/\s/g, '_')}`,
        value: JSON.stringify(city),
        type: 'JSON',
        group: 'GENERAL',
      },
    });
  }
  console.log(`✅ ${cities.length} cities configured`);

  console.log('\n🎉 Rapigo Mali V2.1 seeded successfully!');
  console.log('📧 Admin: diarramoussaka7@gmail.com');
  console.log('🔑 All other data is empty — ready for real data entry.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });