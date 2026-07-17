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

// Default data for reset (matches seed.ts exactly)
const DEFAULT_PLANS = [
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

const DEFAULT_CATEGORIES = [
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

const DEFAULT_SETTINGS = [
  { key: 'app_name', value: 'Rapigo Mali', type: 'STRING', group: 'GENERAL' },
  { key: 'app_currency', value: 'XOF', type: 'STRING', group: 'GENERAL' },
  { key: 'app_country', value: 'Mali', type: 'STRING', group: 'GENERAL' },
  { key: 'default_city', value: 'Bamako', type: 'STRING', group: 'GENERAL' },
  { key: 'support_email', value: 'diarramoussaka7@gmail.com', type: 'STRING', group: 'GENERAL' },
  { key: 'support_phone', value: '+223 77 16 38 62', type: 'STRING', group: 'GENERAL' },
  { key: 'support_developer', value: 'Mr. Diarra Moussa', type: 'STRING', group: 'GENERAL' },
  { key: 'default_commission_rate', value: '10', type: 'NUMBER', group: 'COMMISSION' },
  { key: 'min_commission', value: '0', type: 'NUMBER', group: 'COMMISSION' },
  { key: 'driver_commission_rate', value: '15', type: 'NUMBER', group: 'COMMISSION' },
  { key: 'default_delivery_fee', value: '500', type: 'NUMBER', group: 'DELIVERY' },
  { key: 'max_delivery_radius', value: '15', type: 'NUMBER', group: 'DELIVERY' },
  { key: 'free_delivery_threshold', value: '5000', type: 'NUMBER', group: 'DELIVERY' },
  { key: 'payment_methods_enabled', value: '["CASH","ORANGE_MONEY","MOOV_MONEY","WAVE","VISA","MASTERCARD","QR_CODE"]', type: 'JSON', group: 'PAYMENT' },
  { key: 'cash_on_delivery_enabled', value: 'true', type: 'BOOLEAN', group: 'PAYMENT' },
  { key: 'payment_proof_required', value: 'true', type: 'BOOLEAN', group: 'PAYMENT' },
  { key: 'max_login_attempts', value: '5', type: 'NUMBER', group: 'SECURITY' },
  { key: 'session_duration_hours', value: '168', type: 'NUMBER', group: 'SECURITY' },
  { key: 'otp_expiry_minutes', value: '10', type: 'NUMBER', group: 'SECURITY' },
  { key: 'notification_email_enabled', value: 'false', type: 'BOOLEAN', group: 'NOTIFICATION' },
  { key: 'notification_sms_enabled', value: 'false', type: 'BOOLEAN', group: 'NOTIFICATION' },
  { key: 'notification_push_enabled', value: 'true', type: 'BOOLEAN', group: 'NOTIFICATION' },
];

const DEFAULT_CITIES = [
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

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé - Super administrateur uniquement' }, { status: 401 });
    }

    const body = await request.json();
    const { action, format } = body as { action?: string; format?: string };

    if (!action || !['export', 'backup', 'reset', 'import'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide. Actions possibles : export, backup, reset, import' }, { status: 400 });
    }

    switch (action) {
      case 'export':
        return handleExport(format || 'json');
      case 'backup':
        return handleBackup();
      case 'reset':
        return handleReset();
      case 'import':
        return handleImport(body);
      default:
        return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
    }
  } catch (error) {
    console.error('DB Management error:', error);
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 });
  }
}

// All models for data collection (export/backup) - includes user
const ALL_MODELS = ['user', ...DELETE_ORDER] as const;

async function collectAllData(): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {};
  for (const model of ALL_MODELS) {
    // @ts-expect-error dynamic model access
    data[model] = await db[model].findMany();
  }
  return data;
}

async function handleExport(format: string) {
  try {
    const data = await collectAllData();
    data.exportedAt = new Date().toISOString();
    data.version = 'Rapigo Mali V2.3';

    if (format === 'csv') {
      // Generate CSV for key tables
      const csvParts: string[] = [];

      for (const [modelKey, rows] of Object.entries(data)) {
        if (!Array.isArray(rows) || rows.length === 0) continue;
        if (typeof modelKey !== 'string' || modelKey === 'exportedAt' || modelKey === 'version') continue;

        const headers = Object.keys(rows[0] as Record<string, unknown>);
        const csvRows = (rows as Record<string, unknown>[]).map(row =>
          headers.map(h => {
            const val = String(row[h] ?? '');
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
          }).join(',')
        );

        csvParts.push(`\n=== ${modelKey.toUpperCase()} ===\n`);
        csvParts.push(headers.join(','));
        csvParts.push(csvRows.join('\n'));
      }

      const csvContent = csvParts.join('\n');
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="rapigo-mali-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Default: JSON export
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="rapigo-mali-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: "Erreur lors de l'export" }, { status: 500 });
  }
}

async function handleBackup() {
  try {
    const data = await collectAllData();
    data.backupAt = new Date().toISOString();
    data.version = 'Rapigo Mali V2.3';

    // Create audit log for backup
    const auth = await requireSuperAdmin(new NextRequest('http://localhost'));
    if (auth) {
      await db.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'BACKUP',
          entity: 'DATABASE',
          details: JSON.stringify({ size: JSON.stringify(data).length, tables: Object.keys(data) }),
        },
      });
    }

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="rapigo-mali-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
  }
}

async function handleReset() {
  try {
    // 1. Preserve Super Admin info before deletion
    const superAdmin = await db.user.findFirst({ where: { isSuperAdmin: true } });
    let superAdminData: { email: string; phone: string; password: string; firstName: string; lastName: string } | null = null;

    if (superAdmin) {
      superAdminData = {
        email: superAdmin.email,
        phone: superAdmin.phone,
        password: superAdmin.password, // already hashed
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
      };
    }

    // 2. Delete all data in FK-safe order
    for (const model of DELETE_ORDER) {
      // @ts-expect-error dynamic model access
      await db[model].deleteMany({});
    }

    // 3. Re-create Super Admin
    if (superAdminData) {
      await db.user.create({
        data: {
          ...superAdminData,
          role: 'ADMIN',
          isSuperAdmin: true,
          isVerified: true,
          isActive: true,
        },
      });
    }

    // 4. Re-create default plans
    for (const plan of DEFAULT_PLANS) {
      await db.plan.create({ data: plan });
    }

    // 5. Re-create default categories
    for (const cat of DEFAULT_CATEGORIES) {
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

    // 6. Re-create system settings
    for (const setting of DEFAULT_SETTINGS) {
      await db.setting.create({ data: setting });
    }

    // 7. Re-create cities
    for (const city of DEFAULT_CITIES) {
      await db.setting.create({
        data: {
          key: `city_${city.name.toLowerCase().replace(/\s/g, '_')}`,
          value: JSON.stringify(city),
          type: 'JSON',
          group: 'GENERAL',
        },
      });
    }

    // 8. Create audit log for reset
    if (superAdmin) {
      await db.auditLog.create({
        data: {
          userId: superAdmin.id,
          action: 'RESET',
          entity: 'DATABASE',
          details: JSON.stringify({ preservedSuperAdmin: true, plans: DEFAULT_PLANS.length, categories: DEFAULT_CATEGORIES.length, settings: DEFAULT_SETTINGS.length + DEFAULT_CITIES.length }),
        },
      });
    }

    return NextResponse.json({
      message: 'Base de données réinitialisée avec succès',
      preserved: {
        superAdmin: !!superAdminData,
        plans: DEFAULT_PLANS.length,
        categories: DEFAULT_CATEGORIES.length,
        settings: DEFAULT_SETTINGS.length + DEFAULT_CITIES.length,
      },
    });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: 'Erreur lors de la réinitialisation' }, { status: 500 });
  }
}

async function handleImport(body: Record<string, unknown>) {
  try {
    const { data } = body as { data?: Record<string, unknown> };
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Données de sauvegarde requises' }, { status: 400 });
    }

    // 1. Delete all data in FK-safe order (except Super Admin)
    const superAdmin = await db.user.findFirst({ where: { isSuperAdmin: true } });
    const superAdminData = superAdmin ? {
      email: superAdmin.email,
      phone: superAdmin.phone,
      password: superAdmin.password,
      firstName: superAdmin.firstName,
      lastName: superAdmin.lastName,
    } : null;

    for (const model of DELETE_ORDER) {
      // @ts-expect-error dynamic model access
      await db[model].deleteMany({});
    }

    // 2. Re-create Super Admin
    if (superAdminData) {
      await db.user.create({
        data: {
          ...superAdminData,
          role: 'ADMIN',
          isSuperAdmin: true,
          isVerified: true,
          isActive: true,
        },
      });
    }

    // 3. Restore data for each model (respecting FK order)
    const importableModels = ['plan', 'category', 'setting', 'user', 'client', 'merchant', 'driver', 'product', 'deliveryZone', 'merchantPaymentConfig', 'order', 'orderItem', 'payment', 'delivery', 'notification', 'supportTicket', 'auditLog', 'wallet', 'transaction', 'coupon', 'couponUsage', 'favorite', 'rating', 'chat', 'message', 'referral', 'advertisement', 'report', 'driverLocation'];

    let restoredCount = 0;
    const errors: string[] = [];

    for (const model of importableModels) {
      const modelKey = model.charAt(0).toUpperCase() + model.slice(1);
      const rows = data[modelKey] as Record<string, unknown>[] | undefined;
      if (!rows || !Array.isArray(rows) || rows.length === 0) continue;

      try {
        for (const row of rows) {
          // Skip Super Admin user (already re-created)
          if (model === 'user' && (row as Record<string, unknown>).isSuperAdmin) continue;
          // Clean auto-generated fields that might conflict
          const cleanRow = { ...row };
          delete (cleanRow as Record<string, unknown>).__typename;
          await (db as unknown as Record<string, { create: (args: { data: unknown }) => Promise<unknown> }>)[model].create({ data: cleanRow });
          restoredCount++;
        }
      } catch (err) {
        errors.push(`${model}: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      }
    }

    // 4. Audit log for import
    if (superAdmin) {
      await db.auditLog.create({
        data: {
          userId: superAdmin.id,
          action: 'IMPORT',
          entity: 'DATABASE',
          details: JSON.stringify({ restoredRecords: restoredCount, errors: errors.length, sourceVersion: (data.version as string) || 'inconnue' }),
        },
      });
    }

    return NextResponse.json({
      message: 'Import terminé',
      restoredRecords: restoredCount,
      errors: errors.length > 0 ? errors : undefined,
      preservedSuperAdmin: !!superAdminData,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: "Erreur lors de l'import" }, { status: 500 });
  }
}