import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:3000';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const consoleErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', e => consoleErrors.push(e.message));

const R = {};
const LOG = [];

function log(msg) { console.log(msg); LOG.push(msg); }

try {
  // STEP 1: Landing
  log('=== 1. LANDING ===');
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  R.landing = page.url();
  log('URL: ' + R.landing);
  await page.screenshot({ path: '/home/z/my-project/v1-landing.png' });

  // STEP 2: Click Connexion (opens dialog modal)
  log('\n=== 2. CONNEXION ===');
  await page.locator('button:has-text("Connexion")').first().click({ timeout: 10000 });
  await page.waitForTimeout(2000);
  
  // Check if dialog appeared
  const dialogVisible = await page.locator('[role="dialog"]').isVisible().catch(() => false);
  log('Dialog visible: ' + dialogVisible);
  await page.screenshot({ path: '/home/z/my-project/v2-login.png' });

  // STEP 3: Fill credentials
  log('\n=== 3. CREDENTIALS ===');
  const emailEl = page.locator('#login-email, input[type="email"]').first();
  const passEl = page.locator('#login-password, input[type="password"]').first();
  await emailEl.waitFor({ timeout: 8000 });
  await emailEl.fill('diarramoussaka7@gmail.com');
  await passEl.fill('pispa2026');
  log('Credentials filled');
  await page.screenshot({ path: '/home/z/my-project/v2b-filled.png' });

  // Submit
  log('\n=== 3b. SUBMIT ===');
  await page.locator('[role="dialog"] button[type="submit"]').click({ timeout: 5000 }).catch(async () => {
    await page.locator('button:has-text("Se connecter")').click({ timeout: 5000 }).catch(() => {
      log('Fallback: pressing Enter');
      passEl.press('Enter');
    });
  });
  
  // Wait for admin dashboard
  log('\n=== 4. DASHBOARD ===');
  // Wait for sidebar/navigation or admin content
  try { await page.locator('aside, nav, [class*="sidebar"]').first().waitFor({ timeout: 20000 }); } catch(e) {}
  await page.waitForTimeout(4000);
  R.dashboard = page.url();
  log('URL: ' + R.dashboard);

  // STEP 5: HEADER COUNT
  log('\n=== 5. HEADER COUNT ===');
  R.headerCount = await page.evaluate(() => document.querySelectorAll('header').length);
  log('*** <header> elements: ' + R.headerCount + ' ***');
  
  await page.screenshot({ path: '/home/z/my-project/v3-dashboard.png', fullPage: true });

  // Dump all clickable elements
  log('\n=== 6. PAGE ELEMENTS ===');
  const elements = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('a, button, [role="tab"]'));
    return els.filter(e => e.offsetParent !== null).slice(0, 80).map(e => ({
      tag: e.tagName,
      role: e.getAttribute('role') || '',
      text: e.textContent.trim().substring(0, 50),
      href: e.getAttribute('href') || '',
    }));
  });
  elements.forEach(e => log(`  [${e.tag}] role=${e.role} "${e.text}" ${e.href}`));

  // STEP 7: SETTINGS
  log('\n=== 7. PARAMÈTRES ===');
  const settingsPatterns = [
    'text=Paramètres', 'text=Parametres', 'text=Param',
    'a:has-text("Paramètres")', '[href*="settings"]',
    'a:has-text("Parametres")', 'button:has-text("Param")',
  ];
  let settingsClicked = false;
  for (const sel of settingsPatterns) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 800 })) { await el.click(); settingsClicked = true; log('Clicked: ' + sel); break; }
    } catch(e) {}
  }
  if (!settingsClicked) log('⚠️  Paramètres not found');
  await page.waitForTimeout(2000);
  
  // STEP 8: INPUT COUNT
  let inputCount = await page.evaluate(() => document.querySelectorAll('input').length);
  R.settingsInitialInputs = inputCount;
  log('\n*** Settings input count (initial): ' + inputCount + ' ***');

  // STEP 9: TABS
  log('\n=== 9. SETTINGS TABS ===');
  R.tabs = {};
  for (const tName of ['Général', 'Commissions', 'Livraison', 'Paiement', 'Notifications', 'Apparence']) {
    let found = false;
    // Try role=tab
    try {
      const tab = page.locator(`[role="tab"]:has-text("${tName}")`).first();
      if (await tab.isVisible({ timeout: 800 })) { await tab.click(); found = true; }
    } catch(e) {}
    // Try button
    if (!found) {
      try {
        const tab = page.locator(`[role="tablist"] >> text="${tName}"`).first();
        if (await tab.isVisible({ timeout: 800 })) { await tab.click(); found = true; }
      } catch(e) {}
    }
    await page.waitForTimeout(800);
    const ic = await page.evaluate(() => document.querySelectorAll('input').length);
    R.tabs[tName] = { found, inputs: ic };
    log(`  "${tName}": found=${found}, inputs=${ic}`);
    if (found && ic > 0) {
      const safe = tName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').toLowerCase();
      await page.screenshot({ path: `/home/z/my-project/v4-${safe}.png` });
    }
  }
  R.maxSettingsInputs = Math.max(...Object.values(R.tabs).map(t => t.inputs));
  log('\n*** Max inputs across tabs: ' + R.maxSettingsInputs + ' ***');
  await page.screenshot({ path: '/home/z/my-project/v4-settings.png', fullPage: true });

  // STEP 10: UTILISATEURS
  log('\n=== 10. UTILISATEURS ===');
  for (const sel of ['text=Utilisateurs', 'a:has-text("Utilisateurs")', '[href*="users"]']) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 800 })) { await el.click(); log('Clicked: ' + sel); break; }
    } catch(e) {}
  }
  await page.waitForTimeout(2000);
  R.users = page.url();
  R.usersOk = !page.url().includes('error');
  log('URL: ' + R.users + ' OK: ' + R.usersOk);
  await page.screenshot({ path: '/home/z/my-project/v5-users.png', fullPage: true });

  // STEP 11: CATÉGORIES
  log('\n=== 11. CATÉGORIES ===');
  for (const sel of ['text=Catégories', 'a:has-text("Catégories")', '[href*="categor"]']) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 800 })) { await el.click(); log('Clicked: ' + sel); break; }
    } catch(e) {}
  }
  await page.waitForTimeout(2000);
  R.categories = page.url();
  R.categoriesOk = !page.url().includes('error');
  log('URL: ' + R.categories + ' OK: ' + R.categoriesOk);
  await page.screenshot({ path: '/home/z/my-project/v6-categories.png', fullPage: true });

  R.consoleErrors = consoleErrors.slice(0, 10);
  R.status = 'SUCCESS';

} catch(e) {
  R.error = e.message;
  R.status = 'FAILED';
  log('ERROR: ' + e.message);
  try { await page.screenshot({ path: '/home/z/my-project/v-error.png', fullPage: true }); } catch(ex) {}
} finally {
  await browser.close();
}

log('\n' + '═'.repeat(70));
log('FINAL REPORT');
log('═'.repeat(70));
log(JSON.stringify(R, null, 2));
process.exit(R.status === 'SUCCESS' ? 0 : 1);