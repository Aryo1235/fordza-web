const fs = require('fs');

// ============================================================
// Chen Notation ERD Generator — Fordza Web
// Style: Dark Blue theme (sesuai contoh gambar)
// Fix: labelBackgroundColor=none + background rectangle
// ============================================================

const ENTITY_STYLE  = 'rounded=0;whiteSpace=wrap;html=1;fillColor=#1b2d4a;strokeColor=#4a90c4;fontColor=#ffffff;fontStyle=1;fontSize=11;align=center;';
const ATTR_STYLE    = 'ellipse;whiteSpace=wrap;html=1;fillColor=#1b2d4a;strokeColor=#4a90c4;fontColor=#ffffff;fontSize=9;align=center;';
const ATTR_PK_STYLE = 'ellipse;whiteSpace=wrap;html=1;fillColor=#1b2d4a;strokeColor=#4a90c4;fontColor=#ffffff;fontSize=9;align=center;fontStyle=4;';
const REL_STYLE     = 'rhombus;whiteSpace=wrap;html=1;fillColor=#1b2d4a;strokeColor=#4a90c4;fontColor=#ffffff;fontSize=10;align=center;';
// FIX: tambah labelBackgroundColor=none dan labelBorderColor=none agar angka kardinality tidak punya kotak putih
const LINE_STYLE    = 'endArrow=none;html=1;strokeColor=#4a90c4;strokeWidth=1.5;labelBackgroundColor=none;labelBorderColor=none;';
const CARD_STYLE    = 'endArrow=none;html=1;strokeColor=#4a90c4;strokeWidth=1.5;fontColor=#ffffff;fontStyle=1;fontSize=10;labelBackgroundColor=none;labelBorderColor=none;';
const BG_STYLE      = 'rounded=0;whiteSpace=wrap;html=1;fillColor=#0a1628;strokeColor=none;';

const EW = 150, EH = 60;
const AW = 118, AH = 36;
const RW = 130, RH = 72;

let cells = [];
let idN = 2;
function nid() { return `erd${idN++}`; }

// ── Primitive builders ─────────────────────────────────────

// FIX: background rectangle besar supaya warna gelap terlihat di semua viewer
function addBackground(w, h) {
  const id = nid();
  cells.push(`<mxCell id="${id}" value="" style="${BG_STYLE}" vertex="1" parent="1"><mxGeometry x="0" y="0" width="${w}" height="${h}" as="geometry"/></mxCell>`);
}

function addEntity(label, cx, cy) {
  const id = nid();
  cells.push(`<mxCell id="${id}" value="${label}" style="${ENTITY_STYLE}" vertex="1" parent="1"><mxGeometry x="${cx-EW/2}" y="${cy-EH/2}" width="${EW}" height="${EH}" as="geometry"/></mxCell>`);
  return id;
}

function addAttr(label, cx, cy, pk=false) {
  const id = nid();
  cells.push(`<mxCell id="${id}" value="${label}" style="${pk ? ATTR_PK_STYLE : ATTR_STYLE}" vertex="1" parent="1"><mxGeometry x="${cx-AW/2}" y="${cy-AH/2}" width="${AW}" height="${AH}" as="geometry"/></mxCell>`);
  return id;
}

function addRel(label, cx, cy) {
  const id = nid();
  cells.push(`<mxCell id="${id}" value="${label}" style="${REL_STYLE}" vertex="1" parent="1"><mxGeometry x="${cx-RW/2}" y="${cy-RH/2}" width="${RW}" height="${RH}" as="geometry"/></mxCell>`);
  return id;
}

function addLine(src, tgt) {
  cells.push(`<mxCell id="${nid()}" value="" style="${LINE_STYLE}" edge="1" source="${src}" target="${tgt}" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>`);
}

// Edge dengan kardinality label dekat source atau target
function addLineCard(src, tgt, srcCard, tgtCard) {
  if (srcCard) {
    cells.push(`<mxCell id="${nid()}" value="${srcCard}" style="${CARD_STYLE}" edge="1" source="${src}" target="${tgt}" parent="1"><mxGeometry x="-0.85" relative="1" as="geometry"><mxPoint as="offset"/></mxGeometry></mxCell>`);
  }
  if (tgtCard) {
    cells.push(`<mxCell id="${nid()}" value="${tgtCard}" style="${CARD_STYLE}" edge="1" source="${src}" target="${tgt}" parent="1"><mxGeometry x="0.85" relative="1" as="geometry"><mxPoint as="offset"/></mxGeometry></mxCell>`);
  }
  addLine(src, tgt);
}

// Entity + atribut melingkar di sekelilingnya (Chen style)
function entityWithAttrs(label, cx, cy, attrs, radius=155) {
  const eid = addEntity(label, cx, cy);
  const n = attrs.length;
  attrs.forEach((a, i) => {
    const angle = (2 * Math.PI * i / n) - Math.PI / 2;
    const ax = Math.round(cx + radius * Math.cos(angle));
    const ay = Math.round(cy + radius * Math.sin(angle));
    const aid = addAttr(a.name, ax, ay, a.pk || false);
    addLine(eid, aid);
  });
  return eid;
}

// ─────────────────────────────────────────────────────────────
// BACKGROUND DULU (harus jadi elemen pertama / paling bawah)
// ─────────────────────────────────────────────────────────────
const PAGE_W = 4500;
const PAGE_H = 3300;
addBackground(PAGE_W, PAGE_H);

// ─────────────────────────────────────────────────────────────
// ENTITIES
// ─────────────────────────────────────────────────────────────

// ROW 1 (cy=420): Admin / Operations
const ADMIN = entityWithAttrs('Admin', 430, 420, [
  { name: 'id', pk: true },
  { name: 'username' },
  { name: 'name' },
  { name: 'role' },
  { name: 'pin' },
  { name: 'password' },
], 165);

const SHIFT = entityWithAttrs('CashierShift', 1280, 420, [
  { name: 'id', pk: true },
  { name: 'status' },
  { name: 'start_time' },
  { name: 'end_time' },
  { name: 'starting_cash' },
  { name: 'actual_ending_cash' },
], 165);

const TX = entityWithAttrs('Transaction', 2200, 420, [
  { name: 'id', pk: true },
  { name: 'invoice_no' },
  { name: 'status' },
  { name: 'payment_method' },
  { name: 'total_price' },
  { name: 'amount_paid' },
], 165);

const TX_ITEM = entityWithAttrs('TransactionItem', 3150, 420, [
  { name: 'id', pk: true },
  { name: 'quantity' },
  { name: 'price_at_sale' },
  { name: 'discount_amount' },
  { name: 'promo_name' },
], 155);

// ROW 2 (cy=1250): Product Core
const PROMO = entityWithAttrs('Promo', 430, 1250, [
  { name: 'id', pk: true },
  { name: 'name' },
  { name: 'type' },
  { name: 'value' },
  { name: 'target_type' },
  { name: 'is_active' },
], 165);

const CATEGORY = entityWithAttrs('Category', 1280, 1250, [
  { name: 'id', pk: true },
  { name: 'name' },
  { name: 'is_active' },
  { name: 'order' },
], 155);

const PRODUCT = entityWithAttrs('Product', 2200, 1250, [
  { name: 'id', pk: true },
  { name: 'product_code' },
  { name: 'name' },
  { name: 'price' },
  { name: 'stock' },
  { name: 'gender' },
  { name: 'is_active' },
], 175);

const PROD_DETAIL = entityWithAttrs('ProductDetail', 3150, 1250, [
  { name: 'id', pk: true },
  { name: 'description' },
  { name: 'material' },
  { name: 'insole' },
  { name: 'notes' },
], 155);

const SIZE_TPL = entityWithAttrs('SizeTemplate', 4050, 1250, [
  { name: 'id', pk: true },
  { name: 'name' },
  { name: 'type' },
  { name: 'sizes' },
], 155);

// ROW 3 (cy=2080): Variant / Testimonial / Banner
const TESTIMONIAL = entityWithAttrs('Testimonial', 1280, 2080, [
  { name: 'id', pk: true },
  { name: 'customer_name' },
  { name: 'rating' },
  { name: 'content' },
], 155);

const VARIANT = entityWithAttrs('ProductVariant', 2200, 2080, [
  { name: 'id', pk: true },
  { name: 'variant_code' },
  { name: 'color' },
  { name: 'base_price' },
  { name: 'comparison_price' },
], 155);

const BANNER = entityWithAttrs('Banner', 3150, 2080, [
  { name: 'id', pk: true },
  { name: 'title' },
  { name: 'image_url' },
  { name: 'is_active' },
], 150);

// ROW 4 (cy=2900): SKU / Logs
const STOCK_LOG = entityWithAttrs('StockLog', 430, 2900, [
  { name: 'id', pk: true },
  { name: 'delta' },
  { name: 'current_stock' },
  { name: 'type' },
], 145);

const SKU_LOG = entityWithAttrs('SkuStockLog', 1280, 2900, [
  { name: 'id', pk: true },
  { name: 'delta' },
  { name: 'size' },
  { name: 'color' },
  { name: 'type' },
], 145);

const SKU = entityWithAttrs('ProductSku', 2200, 2900, [
  { name: 'id', pk: true },
  { name: 'size' },
  { name: 'stock' },
  { name: 'price_override' },
], 145);

const SKU_SUMMARY = entityWithAttrs('SkuSalesSummary', 3150, 2900, [
  { name: 'id', pk: true },
  { name: 'date' },
  { name: 'total_qty' },
  { name: 'total_revenue' },
  { name: 'total_discount' },
], 155);

// ─────────────────────────────────────────────────────────────
// RELATIONSHIPS (diamonds)
// ─────────────────────────────────────────────────────────────

const r1 = addRel('membuka', 855, 420);
addLineCard(ADMIN, r1, '1', '');
addLineCard(r1, SHIFT, '', 'N');

const r2 = addRel('menampung', 1740, 420);
addLineCard(SHIFT, r2, '1', '');
addLineCard(r2, TX, '', 'N');

const r3 = addRel('memiliki item', 2675, 420);
addLineCard(TX, r3, '1', '');
addLineCard(r3, TX_ITEM, '', 'N');

const r4 = addRel('memproses', 1310, 770);
addLineCard(ADMIN, r4, '1', '');
addLineCard(r4, TX, '', 'N');

const r5 = addRel('mengelola', 430, 835);
addLineCard(ADMIN, r5, '1', '');
addLineCard(r5, PROMO, '', 'N');

const r6 = addRel('dikategorikan', 1740, 1250);
addLineCard(CATEGORY, r6, 'N', '');
addLineCard(r6, PRODUCT, '', 'N');

const r7 = addRel('memiliki detail', 2675, 1250);
addLineCard(PRODUCT, r7, '1', '');
addLineCard(r7, PROD_DETAIL, '', '1');

const r8 = addRel('pakai template', 3600, 1250);
addLine(PROD_DETAIL, r8);
addLine(r8, SIZE_TPL);

const r9 = addRel('memiliki varian', 2200, 1665);
addLineCard(PRODUCT, r9, '1', '');
addLineCard(r9, VARIANT, '', 'N');

const r10 = addRel('menerima ulasan', 1740, 1665);
addLineCard(PRODUCT, r10, '1', '');
addLineCard(r10, TESTIMONIAL, '', 'N');

const r11 = addRel('kelola banner', 2200, 835);
addLineCard(ADMIN, r11, '1', '');
addLineCard(r11, BANNER, '', 'N');

const r12 = addRel('memiliki ukuran', 2200, 2490);
addLineCard(VARIANT, r12, '1', '');
addLineCard(r12, SKU, '', 'N');

const r13 = addRel('terjual sebagai', 2675, 1665);
addLineCard(SKU, r13, '1', '');
addLineCard(r13, TX_ITEM, '', 'N');

const r14 = addRel('dicatat stok', 855, 2075);
addLineCard(PRODUCT, r14, '1', '');
addLineCard(r14, STOCK_LOG, '', 'N');

const r15 = addRel('dicatat SKU', 1740, 2900);
addLineCard(SKU, r15, '1', '');
addLineCard(r15, SKU_LOG, '', 'N');

const r16 = addRel('dirangkum OLAP', 2675, 2900);
addLineCard(SKU, r16, '1', '');
addLineCard(r16, SKU_SUMMARY, '', 'N');

// ─────────────────────────────────────────────────────────────
// BUILD XML
// FIX: page="0" menghapus page outline putih, background gelap terlihat
// ─────────────────────────────────────────────────────────────

const xml = `<mxfile host="app.diagrams.net" agent="5.0" version="21.0.0">
  <diagram name="ERD Fordza Web - Chen Notation" id="erd-fordza-chen">
    <mxGraphModel dx="1422" dy="794" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" pageWidth="${PAGE_W}" pageHeight="${PAGE_H}" math="0" shadow="0" background="#0a1628">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        ${cells.join('\n        ')}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

fs.writeFileSync('fordza-docs/diagrams/erd-fordza-chen.drawio', xml);
console.log(`Generated: erd-fordza-chen.drawio`);
console.log(`Total cells: ${cells.length}`);
