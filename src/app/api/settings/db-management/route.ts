import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth';

// Ordered deletion list respecting FK constraints
const DELETE_ORDER = [
  'auditLog',
  'driverLocation',
  'transaction',
  'wallet',
  'message',
  'chat',
  'notification',
  'rating',
  'delivery',
  'payment',
  'orderItem',
  'order',
  'couponUsage',
  'coupon',
  'referral',
  'favorite',
  'product',
  'deliveryZone',
  'merchantPaymentConfig',
  'subscription',
  'advertisement',
  'supportTicket',
  'report',
  'client',
  'driver',
  'merchant',
  'category',
  'plan',
  'setting',
] as const;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé - Super administrateur uniquement' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body as { action?: string };

    if (!action || !['export', 'backup', 'reset'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide. Actions possibles: export, backup, reset' }, { status: 400 });
    }

    switch (action) {
      case 'export':
        return handleExport();
      case 'backup':
        return handleBackup();
      case 'reset':
        return handleReset();
      default:
        return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
    }
  } catch (error) {
    console.error('DB Management error:', error);
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 });
  }
}

async function handleExport() {
  try {
    const data: Record<string, unknown> = {};

    for (const model of DELETE_ORDER) {
      // @ts-expect-error dynamic model access
      data[model] = await db[model].findMany();
    }

    data.exportedAt = new Date().toISOString();
    data.version = 'Rapigo Mali V2.2';

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: "Erreur lors de l'export de la base de données" }, { status: 500 });
  }
}

async function handleBackup() {
  try {
    const data: Record<string, unknown> = {};

    for (const model of DELETE_ORDER) {
      // @ts-expect-error dynamic model access
      data[model] = await db[model].findMany();
    }

    data.backupAt = new Date().toISOString();
    data.version = 'Rapigo Mali V2.2';

    // In a production environment this would save to cloud storage.
    // For now we return the data so the admin can download it.
    return NextResponse.json({
      message: 'Sauvegarde créée avec succès',
      data,
      size: JSON.stringify(data).length,
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
  }
}

async function handleReset() {
  try {
    // 1. Delete all data in FK-safe order
    for (const model of DELETE_ORDER) {
      // @ts-expect-error dynamic model access
      await db[model].deleteMany({});
    }

    // 2. Re-create default plans
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
      await db.plan.create({ data: plan });
    }

    // 3. Re-create default categories
    const categories = [
      { name: 'Restaurants', slug: 'restaurants', icon: 'UtensilsCrossed', sortOrder: 1 },
      { name: 'Fast Food', slug: 'fast-food', icon: 'Burger', sortOrder: 2 },
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
      await db.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          sortOrder: cat.sortOrder,
          isActive: true,
        },
      });
    }

    // 4. Re-create system settings
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
      await db.setting.create({ data: setting });
    }

    // Cities
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
    ];

    for (const city of cities) {
      await db.setting.create({
        data: {
          key: `city_${city.name.toLowerCase().replace(/\s/g, '_')}`,
          value: JSON.stringify(city),
          type: 'JSON',
          group: 'GENERAL',
        },
      });
    }

    return NextResponse.json({
      message: 'Base de données réinitialisée avec succès',
      preserved: {
        superAdmin: true,
        plans: plans.length,
        categories: categories.length,
        settings: settings.length + cities.length,
      },
    });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: 'Erreur lors de la réinitialisation de la base de données' }, { status: 500 });
  }
}