import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed Rapigo Mali V2.7 — Supabase PostgreSQL...');

  // ============================================
  // NETTOYAGE COMPLET
  // ============================================
  const tableNames = [
    'auditLog', 'driverLocation', 'transaction', 'wallet', 'message', 'chat',
    'notification', 'rating', 'delivery', 'payment', 'orderItem', 'order',
    'couponUsage', 'coupon', 'referral', 'favorite', 'product', 'deliveryZone',
    'merchantPaymentConfig', 'subscription', 'advertisement', 'supportTicket',
    'report', 'client', 'driver', 'merchant', 'category', 'plan', 'setting', 'user',
  ];

  for (const table of tableNames) {
    await (prisma as unknown as Record<string, { deleteMany: () => Promise<unknown> }>)[table].deleteMany();
  }
  console.log('✅ Données nettoyées');

  // ============================================
  // SUPER ADMINISTRATEUR - Mr. Diarra Moussa
  // Impossible à supprimer, bloquer ou désactiver
  // ============================================
  const adminPassword = await bcrypt.hash('pispa2026', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'diarramoussaka7@gmail.com',
      phone: '+22377163862',
      password: adminPassword,
      firstName: 'Diarra',
      lastName: 'Moussa',
      role: 'SUPER_ADMIN',
      isSuperAdmin: true,
      isVerified: true,
      isActive: true,
    },
  });

  await prisma.wallet.create({
    data: { userId: admin.id, balance: 0 },
  });
  console.log('✅ Super Admin créé :', admin.email);

  // ============================================
  // PARAMÈTRES SYSTÈME
  // ============================================
  const settings = [
    // Général
    { key: 'app_name', value: 'Rapigo Mali', type: 'STRING', group: 'GENERAL' },
    { key: 'app_slogan', value: 'Rapide, Fiable, Partout au Mali.', type: 'STRING', group: 'GENERAL' },
    { key: 'app_currency', value: 'XOF', type: 'STRING', group: 'GENERAL' },
    { key: 'app_country', value: 'Mali', type: 'STRING', group: 'GENERAL' },
    { key: 'default_city', value: 'Bamako', type: 'STRING', group: 'GENERAL' },
    { key: 'support_email', value: 'diarramoussaka7@gmail.com', type: 'STRING', group: 'GENERAL' },
    { key: 'support_phone', value: '+223 77 16 38 62', type: 'STRING', group: 'GENERAL' },
    { key: 'support_whatsapp', value: '+22377163862', type: 'STRING', group: 'GENERAL' },
    { key: 'support_developer', value: 'Mr. Diarra Moussa', type: 'STRING', group: 'GENERAL' },
    { key: 'version', value: '2.7.0', type: 'STRING', group: 'GENERAL' },

    // Commission
    { key: 'default_commission_rate', value: '10', type: 'NUMBER', group: 'COMMISSION' },
    { key: 'min_commission', value: '0', type: 'NUMBER', group: 'COMMISSION' },
    { key: 'driver_commission_rate', value: '15', type: 'NUMBER', group: 'COMMISSION' },

    // Livraison
    { key: 'default_delivery_fee', value: '500', type: 'NUMBER', group: 'DELIVERY' },
    { key: 'max_delivery_radius', value: '15', type: 'NUMBER', group: 'DELIVERY' },
    { key: 'free_delivery_threshold', value: '5000', type: 'NUMBER', group: 'DELIVERY' },

    // Paiement
    { key: 'payment_methods_enabled', value: '["CASH","ORANGE_MONEY","MOOV_MONEY","WAVE","VISA","MASTERCARD","QR_CODE"]', type: 'JSON', group: 'PAYMENT' },
    { key: 'cash_on_delivery_enabled', value: 'true', type: 'BOOLEAN', group: 'PAYMENT' },
    { key: 'payment_proof_required', value: 'true', type: 'BOOLEAN', group: 'PAYMENT' },

    // Sécurité
    { key: 'max_login_attempts', value: '5', type: 'NUMBER', group: 'SECURITY' },
    { key: 'session_duration_hours', value: '168', type: 'NUMBER', group: 'SECURITY' },

    // Notification
    { key: 'notification_push_enabled', value: 'true', type: 'BOOLEAN', group: 'NOTIFICATION' },

    // Abonnement
    { key: 'subscription_model', value: 'LIFETIME', type: 'STRING', group: 'SUBSCRIPTION' },
    { key: 'premium_price', value: '4000', type: 'NUMBER', group: 'SUBSCRIPTION' },
  ];

  for (const setting of settings) {
    await prisma.setting.create({ data: setting });
  }
  console.log(`✅ ${settings.length} paramètres créés`);

  // ============================================
  // CATÉGORIES OFFICIELLES (8)
  // ============================================
  const categories = [
    { name: 'Restaurants', slug: 'restaurants', icon: '🍽️', sortOrder: 1 },
    { name: 'Supermarchés', slug: 'supermarches', icon: '🛒', sortOrder: 2 },
    { name: 'Pharmacies', slug: 'pharmacies', icon: '💊', sortOrder: 3 },
    { name: 'Boutiques', slug: 'boutiques', icon: '🛍️', sortOrder: 4 },
    { name: 'Électronique', slug: 'electronique', icon: '📱', sortOrder: 5 },
    { name: 'Mode', slug: 'mode', icon: '👕', sortOrder: 6 },
    { name: 'Beauté', slug: 'beaute', icon: '✨', sortOrder: 7 },
    { name: 'Colis', slug: 'colis', icon: '📦', sortOrder: 8 },
  ];

  for (const cat of categories) {
    await prisma.category.create({ data: { ...cat, isActive: true } });
  }
  console.log(`✅ ${categories.length} catégories créées`);

  // ============================================
  // VILLES (5)
  // ============================================
  const cities = [
    {
      name: 'Bamako',
      quartiers: JSON.stringify([
        'Badalabougou', 'Baco Djicoroni', 'Banconi', 'Boulkassoumbougou',
        'Daoudabougou', 'Djicoroni Para', 'Faladiè', 'Hamdallaye',
        'Kalaban-Coura', 'Korofina', 'Lafiabougou', 'Mahamana',
        'Missabougou', 'Niamakoro', 'Quinzambougou', 'Sabalibougou',
        'Sekoro', 'Sotuba', 'Tokorou', 'Yirimadio',
      ]),
    },
    {
      name: 'Ségou',
      quartiers: JSON.stringify(['Ségou ville', 'Sokolo', 'Markala', 'San']),
    },
    {
      name: 'Kayes',
      quartiers: JSON.stringify(['Kayes ville', 'Kita', 'Nioro', 'Diéma']),
    },
    {
      name: 'Mopti',
      quartiers: JSON.stringify(['Mopti ville', 'Djenné', 'Sévaré', 'Bandiagara']),
    },
    {
      name: 'Sikasso',
      quartiers: JSON.stringify(['Sikasso ville', 'Koutiala', 'Bougouni', 'Kolondiéba']),
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
  console.log(`✅ ${cities.length} villes configurées`);

  // ============================================
  // PLAN UNIQUE À VIE - PREMIUM LIFETIME
  // ============================================
  await prisma.plan.create({
    data: {
      name: 'Rapigo Mali Premium',
      slug: 'premium_lifetime',
      price: 4000,
      duration: 36500, // 100 ans = vie
      features: JSON.stringify([
        'Accès Premium à vie',
        'Produits illimités',
        'Commandes illimitées',
        'Coupons illimités',
        'Statistiques avancées',
        'Support prioritaire',
        'Badge vérifié',
        'Zones de livraison multiples',
        'Configuration paiement complète',
      ]),
      maxProducts: null,
      maxOrders: null,
      maxCoupons: null,
      priority: 10,
      isActive: true,
    },
  });
  console.log('✅ Plan Premium à vie créé — 4 000 FCFA');

  console.log('\n🎉 Rapigo Mali V2.7 — Seed terminé !');
  console.log('📧 Super Admin : diarramoussaka7@gmail.com');
  console.log('📱 Téléphone : +223 77 16 38 62');
  console.log('🔑 Mot de passe : pispa2026');
  console.log('💎 Plan Premium à vie : 4 000 FCFA');
  console.log('🏙️  Villes : Bamako, Ségou, Kayes, Mopti, Sikasso');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });