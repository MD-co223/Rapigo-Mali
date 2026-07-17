'use client';
import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, MapPin, CreditCard, Crown, Tag,
  Headphones, User, Plus, Pencil, Trash2, Star, Upload, ChevronLeft,
  Menu, LogOut, Bell, Loader2, CheckCircle2, Clock, Send, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SupportContact } from '@/components/support-contact';
import {
  useMerchantNav, useAuthStore, useSpaceStore, apiFetch, formatPrice,
  ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, BUSINESS_TYPES, PAYMENT_METHODS
} from '@/lib/store';
import type { MerchantView } from '@/lib/store';

const EASE = [0, 0, 0.2, 1] as const;
const TR = { duration: 0.3, ease: EASE };
const M_STEPS = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'];
const M_STEP_L = ['En attente', 'Confirmée', 'En préparation', 'Prête'];
const SUB_METHODS = ['ORANGE_MONEY', 'MOOV_MONEY', 'WAVE', 'CASH'];
const SUB_FEATURES = [
  'Produits illimités', 'Commandes illimitées', 'Coupons illimités',
  'Statistiques avancées', 'Support prioritaire', 'Badge vérifié',
  'Zones multiples', 'Configuration paiement',
];
const VL: Record<string, string> = {
  dashboard: 'Tableau de bord', products: 'Produits', 'add-product': 'Produit',
  orders: 'Commandes', 'order-detail': 'Commande', stats: 'Statistiques',
  'payment-config': 'Moyens de paiement', 'delivery-zones': 'Zones de livraison',
  subscription: 'Abonnement', support: 'Support', notifications: 'Notifications',
  profile: 'Mon profil', coupons: 'Coupons', marketing: 'Marketing',
  billing: 'Facturation', settings: 'Paramètres', chat: 'Discussion',
};

function Sp() { return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>; }
function Mt({ m }: { m: string }) { return <div className="text-center py-16 text-muted-foreground"><p>{m}</p></div>; }

export default function MerchantApp() {
  const { view, data, navigate, goBack } = useMerchantNav();
  const { user, logout } = useAuthStore();
  const { setSpace } = useSpaceStore();

  const [merchant, setMerchant] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderDet, setOrderDet] = useState<Record<string, any>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [payCfg, setPayCfg] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [pf, setPf] = useState<Record<string, any>>({});
  const [supps, setSupps] = useState<{ name: string; price: string }[]>([]);
  const [zf, setZf] = useState<Record<string, any>>({ city: '', neighborhood: '', fee: '' });
  const [cf, setCf] = useState<Record<string, any>>({ code: '', type: 'PERCENTAGE', value: '', minOrder: '', maxUses: '', endDate: '' });
  const [ticket, setTicket] = useState({ subject: '', message: '' });
  const [prof, setProf] = useState<Record<string, any>>({});
  const [dlg, setDlg] = useState('');
  const [subMethod, setSubMethod] = useState('');
  const [subProof, setSubProof] = useState('');
  const [subDone, setSubDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const proofRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const isPremium = merchant?.isPremium || merchant?.subscription?.status === 'ACTIVE';
  const mid = merchant?.id;

  // Fetch merchant
  useEffect(() => {
    apiFetch<any>('/api/merchants/me').then(r => { if (r.data) setMerchant(r.data.merchant || r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Fetch view data
  useEffect(() => {
    if (!mid) return;
    if (view === 'dashboard') {
      apiFetch<any>('/api/stats/merchant').then(r => r.data && setStats(r.data));
      apiFetch<any>('/api/orders?merchantId=' + mid + '&limit=5').then(r => r.data && setOrders(r.data.orders || r.data || []));
    }
    if (view === 'products') {
      apiFetch<any>('/api/products?merchantId=' + mid).then(r => r.data && setProducts(r.data.products || r.data || []));
      apiFetch<any>('/api/categories').then(r => r.data && setCategories(r.data.categories || r.data || []));
    }
    if (view === 'orders') {
      apiFetch<any>('/api/orders?merchantId=' + mid).then(r => r.data && setOrders(r.data.orders || r.data || []));
    }
    if (view === 'order-detail' && data?.id) {
      apiFetch<any>('/api/orders/' + data.id).then(r => r.data && setOrderDet(r.data.order || r.data));
    }
    if (view === 'add-product') {
      apiFetch<any>('/api/categories').then(r => r.data && setCategories(r.data.categories || r.data || []));
      if (data?.id) {
        apiFetch<any>('/api/products/' + data.id).then(r => {
          if (r.data) {
            const p = r.data.product || r.data;
            setPf(p);
            try { const s = typeof p.supplements === 'string' ? JSON.parse(p.supplements) : p.supplements; setSupps((s || []).map((x: any) => ({ name: x.name || '', price: String(x.price || '') }))); } catch { setSupps([]); }
          }
        });
      } else { Promise.resolve().then(() => { setPf({ name: '', price: '', shortDescription: '', longDescription: '', categoryId: '', stock: '', isAvailable: true, isFeatured: false, image: '' }); setSupps([]); }); }
    }
    if (view === 'delivery-zones') {
      apiFetch<any>('/api/merchants/' + mid + '/delivery-zones').then(r => r.data && setZones(r.data.zones || r.data || []));
    }
    if (view === 'payment-config') {
      apiFetch<any>('/api/merchants/' + mid + '/payment-config').then(r => {
        if (r.data) { const d = r.data.methods || r.data; setPayCfg(Array.isArray(d) ? d : []); }
      });
    }
    if (view === 'coupons') {
      apiFetch<any>('/api/coupons?merchantId=' + mid).then(r => r.data && setCoupons(r.data.coupons || r.data || []));
    }
    if (view === 'notifications') {
      apiFetch<any>('/api/notifications').then(r => r.data && setNotifs(r.data.notifications || r.data || []));
    }
    if (view === 'profile') {
      apiFetch<any>('/api/merchants/me').then(r => { if (r.data) { const m = r.data.merchant || r.data; setProf(m); } });
    }
    if (view === 'subscription') { Promise.resolve().then(() => { setSubMethod(''); setSubProof(''); setSubDone(false); }); }
  }, [view, data, mid]);

  const handleLogout = () => { logout(); setSpace('landing'); };

  const saveProduct = async () => {
    setSaving(true);
    const body = { ...pf, price: Number(pf.price) || 0, stock: Number(pf.stock) || 0, merchantId: mid, supplements: JSON.stringify(supps.filter(s => s.name)) };
    const url = data?.id ? '/api/products/' + data.id : '/api/products';
    const r = await apiFetch<any>(url, { method: data?.id ? 'PUT' : 'POST', body: JSON.stringify(body) });
    setSaving(false);
    if (r.data) navigate('products');
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    await apiFetch('/api/products/' + id, { method: 'DELETE' });
    setProducts(prev => prev.filter((p: any) => p.id !== id));
  };

  const updateOrderStatus = async (id: string, status: string) => {
    const r = await apiFetch<any>('/api/orders/' + id, { method: 'PUT', body: JSON.stringify({ status }) });
    if (r.data) {
      if (view === 'orders') setOrders(prev => prev.map((o: any) => o.id === id ? { ...o, status } : o));
      if (view === 'order-detail') setOrderDet(prev => ({ ...prev, status }));
    }
  };

  const handleProof = async (orderId: string, status: string) => {
    const r = await apiFetch<any>('/api/orders/' + orderId + '/payment-proof', { method: 'PUT', body: JSON.stringify({ status }) });
    if (r.data) setOrderDet(prev => ({ ...prev, paymentStatus: status }));
  };

  const saveZone = async () => {
    setSaving(true);
    const r = await apiFetch<any>('/api/merchants/' + mid + '/delivery-zones', { method: 'POST', body: JSON.stringify({ ...zf, fee: Number(zf.fee) || 0 }) });
    setSaving(false);
    if (r.data) { setZones(prev => [...prev, r.data.zone || r.data]); setZf({ city: '', neighborhood: '', fee: '' }); setDlg(''); }
  };

  const toggleZone = async (z: any) => {
    await apiFetch('/api/merchants/' + mid + '/delivery-zones/' + z.id, { method: 'PUT', body: JSON.stringify({ isActive: !z.isActive }) });
    setZones(prev => prev.map((zz: any) => zz.id === z.id ? { ...zz, isActive: !z.isActive } : zz));
  };

  const savePayConfig = async () => {
    setSaving(true);
    await apiFetch('/api/merchants/' + mid + '/payment-config', { method: 'PUT', body: JSON.stringify({ methods: payCfg }) });
    setSaving(false);
  };

  const submitSub = async () => {
    if (!subProof) return;
    setSaving(true);
    const r = await apiFetch<any>('/api/subscriptions', { method: 'POST', body: JSON.stringify({ paymentMethod: subMethod, paymentProof: subProof }) });
    setSaving(false);
    if (r.data) setSubDone(true);
  };

  const saveCoupon = async () => {
    setSaving(true);
    const body = { ...cf, value: Number(cf.value) || 0, minOrder: Number(cf.minOrder) || 0, maxUses: Number(cf.maxUses) || 0, merchantId: mid };
    const r = await apiFetch<any>('/api/coupons', { method: 'POST', body: JSON.stringify(body) });
    setSaving(false);
    if (r.data) { setCoupons(prev => [...prev, r.data.coupon || r.data]); setCf({ code: '', type: 'PERCENTAGE', value: '', minOrder: '', maxUses: '', endDate: '' }); setDlg(''); }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Supprimer ce coupon ?')) return;
    await apiFetch('/api/coupons/' + id, { method: 'DELETE' });
    setCoupons(prev => prev.filter((c: any) => c.id !== id));
  };

  const sendTicket = async () => {
    if (!ticket.subject || !ticket.message) return;
    setSaving(true);
    await apiFetch('/api/support', { method: 'POST', body: JSON.stringify({ subject: ticket.subject, message: ticket.message }) });
    setSaving(false);
    setTicket({ subject: '', message: '' });
  };

  const markRead = async (id: string) => {
    await apiFetch('/api/notifications/' + id + '/read', { method: 'PUT' });
    setNotifs(prev => prev.map((n: any) => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await apiFetch('/api/notifications/read-all', { method: 'PUT' });
    setNotifs(prev => prev.map((n: any) => ({ ...n, isRead: true })));
  };

  const saveProfile = async () => {
    setSaving(true);
    const r = await apiFetch<any>('/api/merchants/me', { method: 'PUT', body: JSON.stringify(prof) });
    setSaving(false);
    if (r.data) { const m = r.data.merchant || r.data; setMerchant(prev => ({ ...prev, ...m })); }
  };

  const readFile = (e: React.ChangeEvent<HTMLInputElement>, cb: (v: string) => void) => {
    const f = e.target.files?.[0]; if (!f) return;
    const rd = new FileReader(); rd.onload = () => cb(rd.result as string); rd.readAsDataURL(f);
  };

  // Nav items
  const navItems = [
    { v: 'dashboard' as MerchantView, icon: LayoutDashboard, l: 'Tableau de bord' },
    { v: 'products' as MerchantView, icon: Package, l: 'Produits' },
    { v: 'orders' as MerchantView, icon: ShoppingCart, l: 'Commandes' },
    { v: 'delivery-zones' as MerchantView, icon: MapPin, l: 'Zones de livraison' },
    { v: 'payment-config' as MerchantView, icon: CreditCard, l: 'Moyens de paiement' },
    ...(!isPremium ? [{ v: 'subscription' as MerchantView, icon: Crown, l: 'Abonnement Premium' }] : []),
    { v: 'coupons' as MerchantView, icon: Tag, l: 'Coupons' },
    { v: 'support' as MerchantView, icon: Headphones, l: 'Support' },
    { v: 'profile' as MerchantView, icon: User, l: 'Mon profil' },
  ];

  const bottomNav = [
    { v: 'dashboard' as MerchantView, icon: LayoutDashboard, l: 'Accueil' },
    { v: 'products' as MerchantView, icon: Package, l: 'Produits' },
    { v: 'orders' as MerchantView, icon: ShoppingCart, l: 'Commandes' },
    ...(!isPremium ? [{ v: 'subscription' as MerchantView, icon: Crown, l: 'Abonnement' }] : []),
    { v: 'profile' as MerchantView, icon: User, l: 'Profil' },
  ];

  const renderNav = (onClose?: () => void) => (
    <nav className="flex-1 py-2 overflow-y-auto">
      {navItems.map(it => (
        <button key={it.v} onClick={() => { navigate(it.v); onClose?.(); setMobileMenu(false); }}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${view === it.v ? 'bg-emerald-800 font-medium' : 'hover:bg-emerald-600/50'}`}>
          <it.icon className="h-5 w-5 shrink-0" /> {it.l}
        </button>
      ))}
    </nav>
  );

  // VIEWS
  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Bienvenue, {merchant.name || user?.firstName}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: 'Produits actifs', v: stats.totalProducts ?? stats.activeProducts ?? 0, i: Package, c: 'text-emerald-600 bg-emerald-50' },
          { l: 'Commandes aujourd\'hui', v: stats.ordersToday ?? 0, i: ShoppingCart, c: 'text-orange-600 bg-orange-50' },
          { l: 'Revenus du mois', v: formatPrice(stats.revenueThisMonth ?? 0), i: '💰', c: 'text-yellow-600 bg-yellow-50' },
          { l: 'Note moyenne', v: (stats.averageRating ?? 0).toFixed(1), i: Star, c: 'text-pink-600 bg-pink-50' },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{s.l}</span>
              <div className={`p-2 rounded-lg ${s.c}`}>
                {typeof s.i === 'string' ? <span className="text-lg">{s.i}</span> : <s.i className="h-4 w-4" />}
              </div>
            </div>
            <p className="text-xl font-bold">{s.v}</p>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Commandes récentes</CardTitle></CardHeader>
        <CardContent>
          {!orders.length ? <Mt m="Aucune commande" /> : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {orders.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => navigate('order-detail', { id: o.id })}>
                  <div>
                    <p className="text-sm font-medium">#{o.orderNumber || o.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{o.customerName || 'Client'} · {new Date(o.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatPrice(o.total || 0)}</p>
                    <Badge variant="secondary" className="text-[10px]">{ORDER_STATUS_LABELS[o.status] || o.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Produits</h2>
        <Button onClick={() => navigate('add-product')} className="gap-1"><Plus className="h-4 w-4" /> Ajouter</Button>
      </div>
      {!products.length ? <Mt m="Aucun produit" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p: any) => (
            <Card key={p.id} className="overflow-hidden">
              {p.image ? <img src={p.image} alt={p.name} className="h-32 w-full object-cover bg-gray-100" /> : <div className="h-32 bg-gray-100 flex items-center justify-center text-muted-foreground text-sm">Image</div>}
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-sm line-clamp-1">{p.name}</h3>
                  <Switch checked={p.isAvailable} onCheckedChange={async (v) => {
                    await apiFetch('/api/products/' + p.id, { method: 'PUT', body: JSON.stringify({ isAvailable: v }) });
                    setProducts(prev => prev.map((pp: any) => pp.id === p.id ? { ...pp, isAvailable: v } : pp));
                  }} />
                </div>
                <p className="text-emerald-700 font-bold text-sm">{formatPrice(p.price || 0)}</p>
                <p className="text-xs text-muted-foreground">Stock : {p.stock ?? 0}</p>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="gap-1 flex-1" onClick={() => navigate('add-product', { id: p.id })}><Pencil className="h-3 w-3" /> Modifier</Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => deleteProduct(p.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderAddProduct = () => (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        {data?.id && <Button variant="ghost" size="icon" onClick={goBack}><ChevronLeft className="h-5 w-5" /></Button>}
        <h2 className="text-xl font-bold">{data?.id ? 'Modifier le produit' : 'Ajouter un produit'}</h2>
      </div>
      <Card><CardContent className="p-4 space-y-4">
        <div><Label>Nom</Label><Input value={pf.name || ''} onChange={e => setPf(p => ({ ...p, name: e.target.value }))} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Prix (FCFA)</Label><Input type="number" value={pf.price ?? ''} onChange={e => setPf(p => ({ ...p, price: e.target.value }))} /></div>
          <div><Label>Stock</Label><Input type="number" value={pf.stock ?? ''} onChange={e => setPf(p => ({ ...p, stock: e.target.value }))} /></div>
        </div>
        <div><Label>Catégorie</Label>
          <Select value={pf.categoryId || ''} onValueChange={v => setPf(p => ({ ...p, categoryId: v }))}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
            <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Description courte</Label><Textarea value={pf.shortDescription || ''} onChange={e => setPf(p => ({ ...p, shortDescription: e.target.value }))} rows={2} /></div>
        <div><Label>Description longue</Label><Textarea value={pf.longDescription || ''} onChange={e => setPf(p => ({ ...p, longDescription: e.target.value }))} rows={3} /></div>
        <div><Label>URL de l&apos;image</Label><Input value={pf.image || ''} onChange={e => setPf(p => ({ ...p, image: e.target.value }))} placeholder="https://..." /></div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm"><Switch checked={pf.isAvailable ?? true} onCheckedChange={v => setPf(p => ({ ...p, isAvailable: v }))} /> Disponible</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={pf.isFeatured ?? false} onCheckedChange={v => setPf(p => ({ ...p, isFeatured: v }))} /> Mis en avant</label>
        </div>
        <div>
          <Label>Suppléments</Label>
          <div className="space-y-2 mt-2">
            {supps.map((s, i) => (
              <div key={i} className="flex gap-2">
                <Input value={s.name} onChange={e => setSupps(prev => prev.map((ss, j) => j === i ? { ...ss, name: e.target.value } : ss))} placeholder="Nom" className="flex-1" />
                <Input value={s.price} onChange={e => setSupps(prev => prev.map((ss, j) => j === i ? { ...ss, price: e.target.value } : ss))} placeholder="Prix" type="number" className="w-28" />
                <Button variant="ghost" size="icon" onClick={() => setSupps(prev => prev.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setSupps(prev => [...prev, { name: '', price: '' }])}><Plus className="h-3 w-3" /> Ajouter un supplément</Button>
          </div>
        </div>
        <Button className="w-full" onClick={saveProduct} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (data?.id ? 'Enregistrer' : 'Ajouter le produit')}</Button>
      </CardContent></Card>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Commandes</h2>
      {!orders.length ? <Mt m="Aucune commande" /> : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left"><tr>
                <th className="px-4 py-3 font-medium">N°</th><th className="px-4 py-3 font-medium hidden sm:table-cell">Client</th>
                <th className="px-4 py-3 font-medium">Montant</th><th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Date</th><th className="px-4 py-3 font-medium">Actions</th>
              </tr></thead>
              <tbody className="divide-y">
                {orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate('order-detail', { id: o.id })}>
                    <td className="px-4 py-3 font-medium">#{o.orderNumber || o.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{o.customerName || 'Client'}</td>
                    <td className="px-4 py-3">{formatPrice(o.total || 0)}</td>
                    <td className="px-4 py-3"><Badge variant="secondary">{ORDER_STATUS_LABELS[o.status] || o.status}</Badge></td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR') : ''}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {o.status === 'PENDING' && <Button size="sm" className="gap-1" onClick={() => updateOrderStatus(o.id, 'CONFIRMED')}>Accepter</Button>}
                      {o.status === 'CONFIRMED' && <Button size="sm" className="gap-1" onClick={() => updateOrderStatus(o.id, 'PREPARING')}>En préparation</Button>}
                      {o.status === 'PREPARING' && <Button size="sm" className="gap-1" onClick={() => updateOrderStatus(o.id, 'READY')}>Prête</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );

  const renderOrderDetail = () => {
    const o = orderDet;
    if (!o.id) return <Mt m="Commande introuvable" />;
    const stepIdx = M_STEPS.indexOf(o.status);
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}><ChevronLeft className="h-5 w-5" /></Button>
          <h2 className="text-xl font-bold">Commande #{o.orderNumber || o.id.slice(0, 8)}</h2>
        </div>
        <Card><CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{ORDER_STATUS_LABELS[o.status] || o.status}</Badge>
            {o.paymentStatus && <Badge variant="outline">{PAYMENT_STATUS_LABELS[o.paymentStatus] || o.paymentStatus}</Badge>}
          </div>
          <div className="flex gap-1">{M_STEPS.map((_, i) => (
            <div key={i} className="flex-1 h-2 rounded-full transition-colors" style={{ backgroundColor: i <= stepIdx ? '#059669' : '#e5e7eb' }} />
          ))}</div>
          <div className="flex justify-between text-[10px] text-muted-foreground">{M_STEP_L.map(l => <span key={l}>{l}</span>)}</div>
          {o.status === 'PENDING' && <Button onClick={() => updateOrderStatus(o.id, 'CONFIRMED')} className="w-full">Accepter la commande</Button>}
          {o.status === 'CONFIRMED' && <Button onClick={() => updateOrderStatus(o.id, 'PREPARING')} className="w-full">Passer en préparation</Button>}
          {o.status === 'PREPARING' && <Button onClick={() => updateOrderStatus(o.id, 'READY')} className="w-full">Marquer comme prête</Button>}
        </CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">Articles</CardTitle></CardHeader><CardContent>
          <div className="space-y-2">{(o.items || []).map((it: any, i: number) => (
            <div key={i} className="flex justify-between text-sm"><span>{it.name} x{it.quantity}</span><span className="font-medium">{formatPrice((it.price || 0) * (it.quantity || 1))}</span></div>
          ))}</div>
          <div className="border-t mt-3 pt-3 flex justify-between font-bold">
            <span>Total</span><span>{formatPrice(o.total || 0)}</span>
          </div>
        </CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">Client</CardTitle></CardHeader><CardContent className="space-y-1 text-sm">
          <p><span className="text-muted-foreground">Nom :</span> {o.customerName || 'N/A'}</p>
          <p><span className="text-muted-foreground">Téléphone :</span> {o.customerPhone || 'N/A'}</p>
          <p><span className="text-muted-foreground">Adresse :</span> {o.deliveryAddress || o.address || 'N/A'}</p>
          {o.paymentMethod && <p><span className="text-muted-foreground">Paiement :</span> {PAYMENT_METHODS[o.paymentMethod] || o.paymentMethod}</p>}
          {o.notes && <p><span className="text-muted-foreground">Notes :</span> {o.notes}</p>}
        </CardContent></Card>
        {o.paymentProof && (
          <Card><CardHeader className="pb-3"><CardTitle className="text-base">Preuve de paiement</CardTitle></CardHeader><CardContent className="space-y-3">
            {o.paymentProof.startsWith('data:') ? <img src={o.paymentProof} alt="Preuve" className="max-h-48 rounded-lg border" />
              : <a href={o.paymentProof} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline text-sm">Voir la preuve</a>}
            {o.paymentStatus === 'UPLOADED' && (
              <div className="flex gap-2">
                <Button size="sm" className="gap-1" onClick={() => handleProof(o.id, 'ACCEPTED')}><CheckCircle2 className="h-4 w-4" /> Accepter</Button>
                <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleProof(o.id, 'REJECTED')}><X className="h-4 w-4" /> Refuser</Button>
              </div>
            )}
          </CardContent></Card>
        )}
      </div>
    );
  };

  const renderDeliveryZones = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Zones de livraison</h2>
        <Button className="gap-1" onClick={() => setDlg('zone')}><Plus className="h-4 w-4" /> Ajouter</Button>
      </div>
      {!zones.length ? <Mt m="Aucune zone configurée" /> : (
        <Card className="overflow-hidden"><div className="overflow-x-auto">
          <table className="w-full text-sm"><thead className="bg-gray-50 text-left"><tr>
            <th className="px-4 py-3 font-medium">Ville</th><th className="px-4 py-3 font-medium">Quartier</th>
            <th className="px-4 py-3 font-medium">Frais</th><th className="px-4 py-3 font-medium">Statut</th>
          </tr></thead><tbody className="divide-y">
            {zones.map((z: any) => (
              <tr key={z.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{z.city}</td><td className="px-4 py-3">{z.neighborhood}</td>
                <td className="px-4 py-3">{formatPrice(z.fee || 0)}</td>
                <td className="px-4 py-3"><Switch checked={z.isActive ?? true} onCheckedChange={() => toggleZone(z)} /></td>
              </tr>
            ))}
          </tbody></table>
        </div></Card>
      )}
      <Dialog open={dlg === 'zone'} onOpenChange={() => setDlg('')}>
        <DialogContent><DialogHeader><DialogTitle>Nouvelle zone de livraison</DialogTitle><DialogDescription>Ajouter une zone avec ses frais de livraison</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Ville</Label><Input value={zf.city} onChange={e => setZf(p => ({ ...p, city: e.target.value }))} /></div>
            <div><Label>Quartier</Label><Input value={zf.neighborhood} onChange={e => setZf(p => ({ ...p, neighborhood: e.target.value }))} /></div>
            <div><Label>Frais (FCFA)</Label><Input type="number" value={zf.fee} onChange={e => setZf(p => ({ ...p, fee: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={saveZone} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderPaymentConfig = () => (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-xl font-bold">Moyens de paiement</h2>
      {!payCfg.length ? <Mt m="Aucune méthode configurée" /> : (
        <div className="space-y-3">
          {payCfg.map((m: any, i: number) => (
            <Card key={i}><CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{PAYMENT_METHODS[m.method] || m.method}</h3>
                <Switch checked={m.enabled ?? false} onCheckedChange={v => setPayCfg(prev => prev.map((mm, j) => j === i ? { ...mm, enabled: v } : mm))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label className="text-xs">Numéro de téléphone</Label><Input value={m.phoneNumber || ''} onChange={e => setPayCfg(prev => prev.map((mm, j) => j === i ? { ...mm, phoneNumber: e.target.value } : mm))} placeholder="+223 ..." /></div>
                <div><Label className="text-xs">Nom du compte</Label><Input value={m.accountName || ''} onChange={e => setPayCfg(prev => prev.map((mm, j) => j === i ? { ...mm, accountName: e.target.value } : mm))} /></div>
              </div>
              <div><Label className="text-xs">Instructions</Label><Textarea value={m.instructions || ''} onChange={e => setPayCfg(prev => prev.map((mm, j) => j === i ? { ...mm, instructions: e.target.value } : mm))} rows={2} /></div>
            </CardContent></Card>
          ))}
          <Button className="w-full" onClick={savePayConfig} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer la configuration'}</Button>
        </div>
      )}
    </div>
  );

  const renderSubscription = () => (
    <div className="space-y-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-center">Abonnement Premium</h2>
      {isPremium ? (
        <Card className="border-emerald-200 bg-emerald-50"><CardContent className="p-6 text-center space-y-3">
          <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
          <h3 className="text-lg font-bold text-emerald-800">Compte Premium actif</h3>
          <p className="text-sm text-emerald-700">Accès à vie à toutes les fonctionnalités premium.</p>
          <div className="pt-2 space-y-1 text-sm text-emerald-600">{SUB_FEATURES.map(f => <p key={f}>✅ {f}</p>)}</div>
        </CardContent></Card>
      ) : subDone ? (
        <Card className="border-emerald-200 bg-emerald-50"><CardContent className="p-6 text-center space-y-3">
          <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
          <h3 className="text-lg font-bold">Demande envoyée</h3>
          <p className="text-sm text-muted-foreground">Votre preuve de paiement a été envoyée. Vous serez notifié après validation.</p>
        </CardContent></Card>
      ) : (
        <Card><CardContent className="p-6 space-y-4">
          <div className="text-center">
            <Crown className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
            <h3 className="text-lg font-bold">Rapigo Mali Premium</h3>
            <p className="text-2xl font-bold text-emerald-700 mt-1">4 000 FCFA</p>
            <Badge variant="secondary" className="mt-1">À VIE</Badge>
          </div>
          <div className="space-y-1 text-sm">{SUB_FEATURES.map(f => <p key={f} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> {f}</p>)}</div>
          <div className="border-t pt-4">
            {!subMethod ? (<>
              <Label className="mb-2 block">Choisissez votre moyen de paiement</Label>
              <div className="grid grid-cols-2 gap-2">
                {SUB_METHODS.map(m => (
                  <Button key={m} variant="outline" className="justify-start" onClick={() => setSubMethod(m)}>{PAYMENT_METHODS[m]}</Button>
                ))}
              </div>
            </>) : (<>
              <div className="bg-emerald-50 rounded-lg p-4 text-center space-y-2">
                <p className="text-sm font-medium">Envoyez <strong>4 000 FCFA</strong> via <strong>{PAYMENT_METHODS[subMethod]}</strong></p>
                <p className="text-xs text-muted-foreground">puis téléchargez la capture d&apos;écran de votre paiement ci-dessous.</p>
              </div>
              <input type="file" accept="image/*" className="hidden" ref={proofRef} onChange={e => readFile(e, setSubProof)} />
              {subProof ? <div className="relative"><img src={subProof} alt="Preuve" className="max-h-40 rounded-lg border" />
                <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => setSubProof('')}><X className="h-3 w-3" /></Button></div>
                : <Button variant="outline" className="w-full gap-2" onClick={() => proofRef.current?.click()}><Upload className="h-4 w-4" /> Télécharger la preuve</Button>}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setSubMethod(''); setSubProof(''); }}>Retour</Button>
                <Button className="flex-1" disabled={!subProof || saving} onClick={submitSub}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Envoyer</>}
                </Button>
              </div>
            </>)}
          </div>
        </CardContent></Card>
      )}
    </div>
  );

  const renderCoupons = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Coupons</h2>
        <Button className="gap-1" onClick={() => setDlg('coupon')}><Plus className="h-4 w-4" /> Créer</Button>
      </div>
      {!coupons.length ? <Mt m="Aucun coupon" /> : (
        <div className="space-y-2">{coupons.map((c: any) => (
          <Card key={c.id}><CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="font-mono font-bold text-sm">{c.code}</p>
              <p className="text-xs text-muted-foreground">{c.type === 'PERCENTAGE' ? c.value + '%' : c.type === 'FREE_DELIVERY' ? 'Livraison gratuite' : formatPrice(c.value || 0)} · Max {c.maxUses ?? '∞'} · Expire {c.endDate ? new Date(c.endDate).toLocaleDateString('fr-FR') : 'Jamais'}</p>
            </div>
            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteCoupon(c.id)}><Trash2 className="h-4 w-4" /></Button>
          </CardContent></Card>
        ))}</div>
      )}
      <Dialog open={dlg === 'coupon'} onOpenChange={() => setDlg('')}>
        <DialogContent><DialogHeader><DialogTitle>Nouveau coupon</DialogTitle><DialogDescription>Créer un code promo pour vos clients</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Code</Label><Input value={cf.code} onChange={e => setCf(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="PROMO2025" /></div>
            <div><Label>Type</Label>
              <Select value={cf.type} onValueChange={v => setCf(p => ({ ...p, type: v }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Pourcentage (%)</SelectItem>
                  <SelectItem value="FIXED">Montant fixe (FCFA)</SelectItem>
                  <SelectItem value="FREE_DELIVERY">Livraison gratuite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valeur</Label><Input type="number" value={cf.value} onChange={e => setCf(p => ({ ...p, value: e.target.value }))} /></div>
              <div><Label>Commande min (FCFA)</Label><Input type="number" value={cf.minOrder} onChange={e => setCf(p => ({ ...p, minOrder: e.target.value }))} /></div>
            </div>
            <div><Label>Utilisations max</Label><Input type="number" value={cf.maxUses} onChange={e => setCf(p => ({ ...p, maxUses: e.target.value }))} /></div>
            <div><Label>Date d&apos;expiration</Label><Input type="date" value={cf.endDate} onChange={e => setCf(p => ({ ...p, endDate: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={saveCoupon} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Créer le coupon'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderSupport = () => (
    <div className="space-y-6 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-center">Support</h2>
      <SupportContact />
      <Card><CardHeader className="pb-3"><CardTitle className="text-base">Envoyer un ticket</CardTitle></CardHeader><CardContent className="space-y-3">
        <div><Label>Sujet</Label><Input value={ticket.subject} onChange={e => setTicket(p => ({ ...p, subject: e.target.value }))} /></div>
        <div><Label>Message</Label><Textarea value={ticket.message} onChange={e => setTicket(p => ({ ...p, message: e.target.value }))} rows={4} /></div>
        <Button className="w-full gap-1" onClick={sendTicket} disabled={saving || !ticket.subject || !ticket.message}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Envoyer</>}
        </Button>
      </CardContent></Card>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Notifications</h2>
        {notifs.some((n: any) => !n.isRead) && <Button variant="outline" size="sm" onClick={markAllRead}>Tout marquer lu</Button>}
      </div>
      {!notifs.length ? <Mt m="Aucune notification" /> : (
        <div className="space-y-2">{notifs.map((n: any) => (
          <Card key={n.id} className={`cursor-pointer transition-colors ${!n.isRead ? 'bg-emerald-50 border-emerald-200' : ''}`} onClick={() => markRead(n.id)}>
            <CardContent className="p-3 flex items-start gap-3">
              <Bell className={`h-4 w-4 mt-0.5 shrink-0 ${!n.isRead ? 'text-emerald-600' : 'text-muted-foreground'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.isRead ? 'font-medium' : ''}`}>{n.title}</p>
                {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                {n.createdAt && <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>}
              </div>
            </CardContent>
          </Card>
        ))}</div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-xl font-bold">Mon profil</h2>
      <Card><CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-4">
          {prof.logo ? <img src={prof.logo} alt="Logo" className="h-16 w-16 rounded-full object-cover bg-gray-100" />
            : <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl">{(prof.name || '?')[0]}</div>}
          <div>
            <input type="file" accept="image/*" className="hidden" ref={logoRef} onChange={e => readFile(e, v => setProf(p => ({ ...p, logo: v })))} />
            <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()} className="gap-1"><Upload className="h-3 w-3" /> Changer le logo</Button>
          </div>
        </div>
        <div><Label>Nom du commerce</Label><Input value={prof.name || ''} onChange={e => setProf(p => ({ ...p, name: e.target.value }))} /></div>
        <div><Label>Type de commerce</Label>
          <Select value={prof.type || ''} onValueChange={v => setProf(p => ({ ...p, type: v }))}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
            <SelectContent>{Object.entries(BUSINESS_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Description</Label><Textarea value={prof.description || ''} onChange={e => setProf(p => ({ ...p, description: e.target.value }))} rows={3} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>Adresse</Label><Input value={prof.address || ''} onChange={e => setProf(p => ({ ...p, address: e.target.value }))} /></div>
          <div><Label>Téléphone</Label><Input value={prof.phone || ''} onChange={e => setProf(p => ({ ...p, phone: e.target.value }))} /></div>
        </div>
        <div><Label>Horaires d&apos;ouverture</Label><Input value={prof.operatingHours || ''} onChange={e => setProf(p => ({ ...p, operatingHours: e.target.value }))} placeholder="Lun-Sam 8h-22h" /></div>
        <Button className="w-full" onClick={saveProfile} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}</Button>
      </CardContent></Card>
    </div>
  );

  const renderView = () => {
    switch (view) {
      case 'dashboard': return renderDashboard();
      case 'products': return renderProducts();
      case 'add-product': return renderAddProduct();
      case 'orders': return renderOrders();
      case 'order-detail': return renderOrderDetail();
      case 'delivery-zones': return renderDeliveryZones();
      case 'payment-config': return renderPaymentConfig();
      case 'subscription': return renderSubscription();
      case 'coupons': return renderCoupons();
      case 'support': return renderSupport();
      case 'notifications': return renderNotifications();
      case 'profile': return renderProfile();
      default: return <Mt m="Vue non disponible" />;
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  if (!merchant?.isApproved) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full"><CardContent className="p-6 space-y-4 text-center">
        <Clock className="h-12 w-12 text-yellow-500 mx-auto" />
        <h2 className="text-lg font-bold">Compte en attente de validation</h2>
        <p className="text-sm text-muted-foreground">Votre compte commerçant est en cours de vérification par notre équipe. Vous serez notifié dès qu&apos;il sera activé.</p>
        <SupportContact variant="compact" />
        <Button variant="outline" className="w-full" onClick={handleLogout}>Se déconnecter</Button>
      </CardContent></Card>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-emerald-700 text-white shrink-0">
        <div className="flex items-center gap-3 px-4 h-16 border-b border-emerald-600"><img src="/logo.svg" alt="Rapigo" className="h-8" /><span className="font-bold text-lg">Rapigo Mali</span></div>
        {renderNav()}
        <div className="p-4 border-t border-emerald-600">
          <p className="text-sm text-emerald-200 truncate">{merchant.name || user?.firstName}</p>
          {isPremium && <p className="text-xs text-yellow-300 flex items-center gap-1 mt-1"><Crown className="h-3 w-3" /> Premium</p>}
          <Button variant="ghost" className="text-white hover:bg-emerald-600 w-full justify-start mt-2 gap-2" onClick={handleLogout}><LogOut className="h-4 w-4" /> Déconnexion</Button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="lg:hidden h-14 flex items-center px-4 bg-white border-b sticky top-0 z-30 gap-2">
          <Button variant="ghost" size="icon" onClick={() => setMobileMenu(true)}><Menu className="h-5 w-5" /></Button>
          <h1 className="font-semibold text-sm truncate">{VL[view] || 'Espace Commerçant'}</h1>
          <div className="ml-auto">
            <Button variant="ghost" size="icon" onClick={() => navigate('notifications')} className="relative">
              <Bell className="h-5 w-5" />
              {notifs.filter((n: any) => !n.isRead).length > 0 && <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full" />}
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-y-auto">
          <AnimatePresence mode="wait"><motion.div key={view} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={TR}>{renderView()}</motion.div></AnimatePresence>
        </main>
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t h-16 flex items-center justify-around z-30 safe-area-inset-bottom">
          {bottomNav.map(it => (
            <button key={it.v} onClick={() => navigate(it.v)} className={`flex flex-col items-center gap-0.5 px-2 py-1 min-w-0 ${view === it.v ? 'text-emerald-700' : 'text-gray-400'}`}>
              <it.icon className="h-5 w-5" /><span className="text-[10px] leading-tight truncate max-w-16">{it.l}</span>
            </button>
          ))}
        </nav>
      </div>
      <Sheet open={mobileMenu} onOpenChange={setMobileMenu}>
        <SheetContent side="left" className="w-72 bg-emerald-700 text-white border-none p-0">
          <div className="flex items-center gap-3 px-4 h-16 border-b border-emerald-600"><img src="/logo.svg" alt="Rapigo" className="h-8" /><span className="font-bold text-lg">Rapigo Mali</span></div>
          {renderNav(() => setMobileMenu(false))}
          <div className="p-4 border-t border-emerald-600">
            <p className="text-sm text-emerald-200">{merchant.name || user?.firstName}</p>
            <Button variant="ghost" className="text-white hover:bg-emerald-600 w-full justify-start mt-2 gap-2" onClick={() => { handleLogout(); setMobileMenu(false); }}><LogOut className="h-4 w-4" /> Déconnexion</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}