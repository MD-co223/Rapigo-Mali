import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { readFileSync } from 'fs';
import path from 'path';
import jsPDF from 'jspdf';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    const order = await db.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: true,
        client: { include: { user: { select: { firstName: true, lastName: true, phone: true, email: true } } } },
        merchant: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
        driver: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    if (order.status !== 'DELIVERED') {
      return NextResponse.json({ error: 'La facture n\'est disponible que pour les commandes livrées' }, { status: 400 });
    }

    // Authorization: CLIENT (own), MERCHANT (own), ADMIN (all)
    const client = await db.client.findUnique({ where: { userId: auth.userId } });
    const merchant = await db.merchant.findUnique({ where: { userId: auth.userId } });
    const isAdmin = auth.role === 'ADMIN' || auth.isSuperAdmin;

    const isAuthorized =
      isAdmin ||
      (client && client.id === order.clientId) ||
      (merchant && merchant.id === order.merchantId);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Load logo as base64
    let logoBase64 = '';
    try {
      const logoPath = path.join(process.cwd(), 'public', 'app-icon.png');
      const logoBuffer = readFileSync(logoPath);
      logoBase64 = 'data:image/png;base64,' + logoBuffer.toString('base64');
    } catch {
      // Logo not found, skip
    }

    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Colors
    const emerald = [16, 120, 72] as [number, number, number]; // #107848
    const darkGray = [60, 60, 60] as [number, number, number];
    const midGray = [120, 120, 120] as [number, number, number];
    const lightGray = [200, 200, 200] as [number, number, number];

    // ── Header: Logo + Title ──
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', margin, y, 18, 18);
    }
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...emerald);
    doc.text('RAPIGO MALI', logoBase64 ? margin + 24 : margin, y + 12);

    doc.setFontSize(9);
    doc.setTextColor(...midGray);
    doc.text('Votre plateforme de livraison N\u00b01 au Mali', logoBase64 ? margin + 24 : margin, y + 18);

    // Invoice number + date on right
    doc.setFontSize(11);
    doc.setTextColor(...darkGray);
    doc.text(`Facture : FAC-${order.orderNumber}`, pageWidth - margin, y + 6, { align: 'right' });
    doc.setFontSize(9);
    doc.setTextColor(...midGray);
    const issueDate = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.createdAt);
    doc.text(`Date : ${issueDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageWidth - margin, y + 13, { align: 'right' });
    doc.text(`Commande : ${order.orderNumber}`, pageWidth - margin, y + 19, { align: 'right' });

    y += 30;

    // Divider
    doc.setDrawColor(...emerald);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // ── Client Info ──
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...emerald);
    doc.text('CLIENT', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...darkGray);
    doc.text(`${order.client.user.firstName} ${order.client.user.lastName}`, margin, y); y += 5;
    doc.text(`Email : ${order.client.user.email}`, margin, y); y += 5;
    doc.text(`T\u00e9l : ${order.client.user.phone}`, margin, y); y += 10;

    // ── Merchant Info ──
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...emerald);
    doc.text('COMMER\u00c7ANT', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...darkGray);
    doc.text(order.merchant.businessName, margin, y); y += 5;
    doc.text(`Adresse : ${order.merchant.address || 'N/A'}`, margin, y); y += 5;
    doc.text(`T\u00e9l : ${order.merchant.phone || 'N/A'}`, margin, y); y += 10;

    // ── Driver Info ──
    if (order.driver) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...emerald);
      doc.text('LIVREUR', margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...darkGray);
      doc.text(`${order.driver.user.firstName} ${order.driver.user.lastName}`, margin, y); y += 5;
      doc.text(`T\u00e9l : ${order.driver.user.phone}`, margin, y); y += 10;
    }

    // Divider
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // ── Items Table ──
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...emerald);
    doc.text('D\u00c9TAIL DES ARTICLES', margin, y);
    y += 7;

    // Table header
    const colX = [margin, margin + 70, pageWidth - margin - 20, pageWidth - margin];
    doc.setFillColor(240, 248, 243);
    doc.rect(margin, y - 4, pageWidth - 2 * margin, 8, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.text('Article', colX[0], y + 1);
    doc.text('Qt\u00e9', colX[1], y + 1, { align: 'center' });
    doc.text('Prix unitaire', colX[2], y + 1, { align: 'right' });
    doc.text('Total', colX[3], y + 1, { align: 'right' });
    y += 8;

    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...darkGray);
    for (const item of order.items) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.text(item.productName || 'Article', colX[0], y);
      doc.text(String(item.quantity), colX[1], y, { align: 'center' });
      doc.text(formatFCFA(item.unitPrice), colX[2], y, { align: 'right' });
      doc.text(formatFCFA(item.totalPrice), colX[3], y, { align: 'right' });
      y += 6;
    }

    // Divider
    doc.setDrawColor(...lightGray);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 8;

    // ── Totals ──
    const totalsX = pageWidth - margin;
    doc.setFontSize(9);
    doc.setTextColor(...midGray);
    doc.text('Sous-total', totalsX, y, { align: 'right' });
    doc.text(formatFCFA(order.subtotal), totalsX - 55, y, { align: 'right' });
    y += 6;

    doc.text('Frais de livraison', totalsX, y, { align: 'right' });
    doc.text(formatFCFA(order.deliveryFee), totalsX - 55, y, { align: 'right' });
    y += 6;

    if (order.discount > 0) {
      doc.setTextColor(...emerald);
      doc.text('Remise', totalsX, y, { align: 'right' });
      doc.text(`-${formatFCFA(order.discount)}`, totalsX - 55, y, { align: 'right' });
      y += 6;
    }

    // TVA line
    doc.setTextColor(...midGray);
    doc.text('TVA', totalsX, y, { align: 'right' });
    doc.text('0 FCFA', totalsX - 55, y, { align: 'right' });
    y += 6;

    // TVA note
    doc.setFontSize(7);
    doc.setTextColor(...midGray);
    doc.text('TVA non applicable \u2014 article XXX du CGI du Mali', totalsX - 55, y, { align: 'right' });
    y += 8;

    // Total bold line
    doc.setDrawColor(...emerald);
    doc.setLineWidth(0.5);
    doc.line(totalsX - 60, y - 1, totalsX, y - 1);
    y += 4;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...emerald);
    doc.text('TOTAL', totalsX, y, { align: 'right' });
    doc.text(formatFCFA(order.total) + ' FCFA', totalsX - 55, y, { align: 'right' });
    y += 10;

    // ── Payment Info ──
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.text('MODE DE PAIEMENT', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const paymentLabels: Record<string, string> = {
      CASH: 'Esp\u00e8ces', ORANGE_MONEY: 'Orange Money', MOOV_MONEY: 'Moov Money',
      WAVE: 'Wave', VISA: 'Visa', MASTERCARD: 'Mastercard', QR_CODE: 'QR Code', WALLET: 'Portefeuille',
    };
    doc.text(`M\u00e9thode : ${paymentLabels[order.paymentMethod] || order.paymentMethod}`, margin, y); y += 5;
    doc.text(`Statut : PAY\u00c9`, margin, y); y += 12;

    // ── Reference Block (QR code replacement) ──
    doc.setFillColor(245, 245, 245);
    const refBlockY = y;
    const refBlockH = 22;
    doc.rect(margin, refBlockY, pageWidth - 2 * margin, refBlockH, 'F');
    doc.setDrawColor(...lightGray);
    doc.rect(margin, refBlockY, pageWidth - 2 * margin, refBlockH, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.text('R\u00c9F\u00c9RENCE', margin + 5, refBlockY + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`FAC-${order.orderNumber}`, margin + 5, refBlockY + 17);
    doc.setFontSize(7);
    doc.setTextColor(...midGray);
    doc.text(`ID: ${order.id}`, margin + 60, refBlockY + 17);

    y = refBlockY + refBlockH + 10;

    // ── Footer ──
    doc.setDrawColor(...emerald);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;

    doc.setFontSize(8);
    doc.setTextColor(...emerald);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapigo Mali \u2014 Votre plateforme de livraison N\u00b01 au Mali', pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.setTextColor(...midGray);
    doc.setFont('helvetica', 'normal');
    doc.text('Merci pour votre confiance !', pageWidth / 2, y, { align: 'center' });

    // Return PDF as binary
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-${order.orderNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json({ error: 'Erreur lors de la g\u00e9n\u00e9ration de la facture' }, { status: 500 });
  }
}

function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount);
}