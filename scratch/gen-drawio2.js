const fs = require('fs');

class SequenceBuilder {
  constructor(name) {
    this.name = name;
    this.actors = [];
    this.messages = [];
    this.currentY = 180;
    this.xPositions = {
      'actor': 60,
      'ui': 200,
      'api': 400,
      'service': 600,
      'db': 800
    };
  }

  addNode(id, label, type) {
    let style = "";
    let width = 100;
    let height = 60;
    
    if (type === 'actor') {
      style = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#d5e8d4;strokeColor=#82b366;";
      width = 40;
      height = 80;
    } else if (type === 'ui') {
      style = "rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;";
    } else if (type === 'api') {
      style = "rounded=0;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;";
    } else if (type === 'service') {
      style = "rounded=0;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;";
    } else if (type === 'db') {
      style = "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#f8cecc;strokeColor=#b85450;";
      width = 80;
      height = 80;
    }

    this.actors.push({
      id,
      label: label.replace(/&/g, '&amp;'),
      type,
      style,
      width,
      height,
      x: this.xPositions[type],
      y: 80
    });
    return this;
  }

  addMessage(sourceId, targetId, label, isReturn = false) {
    const source = this.actors.find(a => a.id === sourceId);
    const target = this.actors.find(a => a.id === targetId);
    
    const sourceCenter = source.x + (source.width / 2);
    const targetCenter = target.x + (target.width / 2);
    
    const msgNum = this.messages.length + 1;

    this.messages.push({
      id: `msg${msgNum}`,
      sourceId,
      targetId,
      label: `${msgNum}: ${label.replace(/&/g, '&amp;')}`,
      isReturn,
      y: this.currentY,
      sourceX: sourceCenter,
      targetX: targetCenter
    });
    this.currentY += 40;
    return this;
  }

  build() {
    let xml = `<mxfile host="app.diagrams.net" agent="5.0" version="21.0.0" type="device">\n`;
    xml += `  <diagram name="${this.name}" id="diagram-1">\n`;
    xml += `    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="900" math="0" shadow="0">\n`;
    xml += `      <root>\n`;
    xml += `        <mxCell id="0" />\n`;
    xml += `        <mxCell id="1" parent="0" />\n`;

    // Title
    xml += `        <mxCell id="title" value="${this.name}" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=16;fontStyle=1" vertex="1" parent="1">\n`;
    xml += `          <mxGeometry x="300" y="20" width="500" height="30" as="geometry" />\n`;
    xml += `        </mxCell>\n`;

    // Nodes
    for (const actor of this.actors) {
      xml += `        <mxCell id="${actor.id}" value="${actor.label}" style="${actor.style}" vertex="1" parent="1">\n`;
      xml += `          <mxGeometry x="${actor.x}" y="${actor.y}" width="${actor.width}" height="${actor.height}" as="geometry" />\n`;
      xml += `        </mxCell>\n`;
      
      // Lifeline
      const lineX = actor.x + (actor.width / 2);
      const llBottom = this.currentY + 60;
      xml += `        <mxCell id="ll_${actor.id}" value="" style="endArrow=none;dashed=1;html=1;dashPattern=1 3;strokeWidth=2;" edge="1" parent="1">\n`;
      xml += `          <mxGeometry width="50" height="50" relative="1" as="geometry">\n`;
      xml += `            <mxPoint x="${lineX}" y="180" as="sourcePoint" />\n`;
      xml += `            <mxPoint x="${lineX}" y="${llBottom}" as="targetPoint" />\n`;
      xml += `          </mxGeometry>\n`;
      xml += `        </mxCell>\n`;
      
      // We will skip Activation boxes to keep it simpler and avoid overlaps or complex logic,
      // as messages alone indicate the flow perfectly in simpler draw.io seq diagrams.
      // But user's template had them. Let's add one big activation box per actor that receives messages.
      const firstMsg = this.messages.find(m => m.targetId === actor.id || m.sourceId === actor.id);
      if (firstMsg && actor.type !== 'actor') {
         const actTop = 190;
         const actHeight = this.currentY - 190;
         const actStyle = actor.style.includes('shape=cylinder3') ? 'rounded=0;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;' : actor.style;
         xml += `        <mxCell id="act_${actor.id}" value="" style="${actStyle.replace('shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;', 'rounded=0;whiteSpace=wrap;html=1;')}" vertex="1" parent="1">\n`;
         xml += `          <mxGeometry x="${lineX - 5}" y="${actTop}" width="10" height="${actHeight}" as="geometry" />\n`;
         xml += `        </mxCell>\n`;
      }
    }

    // Messages
    for (const msg of this.messages) {
      const arrowStyle = msg.isReturn ? "endArrow=open;endFill=0;html=1;dashed=1;" : "endArrow=block;endFill=1;html=1;";
      xml += `        <mxCell id="${msg.id}" value="${msg.label}" style="${arrowStyle}" edge="1" parent="1">\n`;
      xml += `          <mxGeometry x="-0.2" y="10" relative="1" as="geometry">\n`;
      xml += `            <mxPoint x="${msg.sourceX}" y="${msg.y}" as="sourcePoint" />\n`;
      xml += `            <mxPoint x="${msg.targetX}" y="${msg.y}" as="targetPoint" />\n`;
      xml += `            <mxPoint as="offset" />\n`;
      xml += `          </mxGeometry>\n`;
      xml += `        </mxCell>\n`;
    }

    xml += `      </root>\n`;
    xml += `    </mxGraphModel>\n`;
    xml += `  </diagram>\n`;
    xml += `</mxfile>`;

    return xml;
  }
}

// 1. KNN Recommender
const knn = new SequenceBuilder("Sequence Diagram - Rekomendasi Produk (KNN)")
  .addNode("user", "Pelanggan", "actor")
  .addNode("ui", "Katalog UI", "ui")
  .addNode("api", "API Route", "api")
  .addNode("svc", "KNN Service", "service")
  .addNode("db", "Database", "db")
  .addMessage("user", "ui", "Klik produk")
  .addMessage("ui", "api", "GET /api/products/[id]/recommendations")
  .addMessage("api", "db", "Find target product")
  .addMessage("db", "api", "Return target product", true)
  .addMessage("api", "db", "Find all active products")
  .addMessage("db", "api", "Return products", true)
  .addMessage("api", "svc", "getRecommendations(target, all)")
  .addMessage("svc", "svc", "Calculate Euclidean Distances")
  .addMessage("svc", "svc", "Sort K-Nearest")
  .addMessage("svc", "api", "Return top 4 products", true)
  .addMessage("api", "ui", "Return recommendations JSON", true)
  .addMessage("ui", "user", "Tampilkan produk serupa", true);

fs.writeFileSync("fordza-docs/diagrams/sequence-10-knn-recommender.drawio", knn.build());

// 2. Bulk Import
const bulk = new SequenceBuilder("Sequence Diagram - Kelola Produk (Bulk Import)")
  .addNode("admin", "Admin", "actor")
  .addNode("ui", "Upload UI", "ui")
  .addNode("api", "API Route", "api")
  .addNode("svc", "Product\\nService", "service")
  .addNode("db", "Database", "db")
  .addMessage("admin", "ui", "Upload Excel/CSV")
  .addMessage("ui", "ui", "Parse to JSON Array")
  .addMessage("ui", "api", "POST /api/admin/products/bulk-import")
  .addMessage("api", "svc", "bulkImport(products)")
  .addMessage("svc", "db", "Fetch categories & templates")
  .addMessage("db", "svc", "Return data", true)
  .addMessage("svc", "svc", "Smart Lookup names to IDs")
  .addMessage("svc", "db", "tx.product.create() in loop")
  .addMessage("db", "svc", "Return success or error", true)
  .addMessage("svc", "api", "Return results (success, failed, errors)", true)
  .addMessage("api", "ui", "Return partial success JSON", true)
  .addMessage("ui", "admin", "Tampilkan highlight error", true);

fs.writeFileSync("fordza-docs/diagrams/sequence-11-bulk-import.drawio", bulk.build());

// 3. Bulk Stock
const stock = new SequenceBuilder("Sequence Diagram - Kelola Stok (Bulk Update)")
  .addNode("admin", "Admin", "actor")
  .addNode("ui", "Stock UI", "ui")
  .addNode("api", "API Route", "api")
  .addNode("svc", "Product\\nService", "service")
  .addNode("db", "Database", "db")
  .addMessage("admin", "ui", "Submit stock changes")
  .addMessage("ui", "api", "PATCH /api/admin/products/bulk-stock")
  .addMessage("api", "svc", "bulkUpdateStock(items)")
  .addMessage("svc", "db", "Begin transaction")
  .addMessage("svc", "db", "Update productSku stock")
  .addMessage("svc", "db", "Create skuStockLog")
  .addMessage("svc", "db", "Update master product stock")
  .addMessage("svc", "db", "Create stockLog")
  .addMessage("db", "svc", "Cek Validitas ID (alt)", true)
  .addMessage("svc", "db", "Commit transaction (Jika Valid)")
  .addMessage("db", "svc", "Commit success", true)
  .addMessage("svc", "api", "Return success", true)
  .addMessage("api", "ui", "Return 200 OK", true)
  .addMessage("svc", "db", "Rollback transaction (Jika ID Salah)")
  .addMessage("svc", "api", "Throw AppError(NOT_FOUND)", true)
  .addMessage("api", "ui", "Return JSON Error 404", true)
  .addMessage("ui", "admin", "Tampilkan Notifikasi Error/Sukses", true);

fs.writeFileSync("fordza-docs/diagrams/sequence-12-bulk-stock.drawio", stock.build());

// 4. Manage Categories
const cat = new SequenceBuilder("Sequence Diagram - Kelola Kategori (Hapus)")
  .addNode("admin", "Admin", "actor")
  .addNode("ui", "Category UI", "ui")
  .addNode("api", "API Route", "api")
  .addNode("svc", "Category\\nService", "service")
  .addNode("db", "Database", "db")
  .addMessage("admin", "ui", "Klik hapus kategori")
  .addMessage("ui", "api", "DELETE /api/admin/categories/[id]")
  .addMessage("api", "svc", "deleteCategory(id)")
  .addMessage("svc", "db", "Check product relations (count)")
  .addMessage("db", "svc", "Return product count", true)
  .addMessage("svc", "svc", "Validasi Produk Terkait (alt)")
  .addMessage("svc", "api", "Throw AppError (Jika > 0)", true)
  .addMessage("api", "ui", "Return JSON Error 400", true)
  .addMessage("ui", "admin", "Tampilkan Notifikasi Error", true)
  .addMessage("svc", "db", "Soft Delete (Jika count = 0)")
  .addMessage("db", "svc", "Category soft-deleted", true)
  .addMessage("svc", "api", "Return success", true)
  .addMessage("api", "ui", "Return 200 OK", true)
  .addMessage("ui", "admin", "Tampilkan tabel ter-update", true);

fs.writeFileSync("fordza-docs/diagrams/sequence-13-kelola-kategori.drawio", cat.build());

// 5. Size Template
const sizeTpl = new SequenceBuilder("Sequence Diagram - Kelola Size Template (Create)")
  .addNode("admin", "Admin", "actor")
  .addNode("ui", "Size UI", "ui")
  .addNode("api", "API Route", "api")
  .addNode("svc", "SizeTemplate\\nService", "service")
  .addNode("db", "Database", "db")
  .addMessage("admin", "ui", "Input Nama & Daftar Ukuran")
  .addMessage("ui", "api", "POST /api/admin/size-templates")
  .addMessage("api", "svc", "createTemplate(data)")
  .addMessage("svc", "db", "Check nama duplikat")
  .addMessage("db", "svc", "Return hasil", true)
  .addMessage("svc", "svc", "Validasi (alt)")
  .addMessage("svc", "api", "Throw AppError (Jika duplikat)", true)
  .addMessage("api", "ui", "Return JSON Error 400", true)
  .addMessage("ui", "admin", "Tampilkan Error Duplikat", true)
  .addMessage("svc", "db", "Insert ke tabel SizeTemplate (Jika aman)")
  .addMessage("db", "svc", "Insert success", true)
  .addMessage("svc", "api", "Return inserted data", true)
  .addMessage("ui", "admin", "Tampilkan notifikasi sukses", true);

fs.writeFileSync("fordza-docs/diagrams/sequence-14-size-template.drawio", sizeTpl.build());

// 6. Kelola Admin (User Management)
const userMgmt = new SequenceBuilder("Sequence Diagram - Kelola Pengguna (Admin/Kasir)")
  .addNode("admin", "Super Admin", "actor")
  .addNode("ui", "User UI", "ui")
  .addNode("api", "API Route", "api")
  .addNode("svc", "Admin\\nService", "service")
  .addNode("db", "Database", "db")
  .addMessage("admin", "ui", "Input Data Kasir Baru (Email, Password, Role)")
  .addMessage("ui", "api", "POST /api/admin/users")
  .addMessage("api", "svc", "createAdmin(data)")
  .addMessage("svc", "db", "Check email exist")
  .addMessage("db", "svc", "Return email count", true)
  .addMessage("svc", "svc", "Validasi (alt)")
  .addMessage("svc", "api", "Throw AppError (Email sudah dipakai)", true)
  .addMessage("api", "ui", "Return JSON Error 400", true)
  .addMessage("ui", "admin", "Tampilkan Error Email", true)
  .addMessage("svc", "svc", "Hash Password (Jika aman)")
  .addMessage("svc", "db", "Insert Admin Data")
  .addMessage("db", "svc", "Insert success", true)
  .addMessage("svc", "api", "Return inserted data", true)
  .addMessage("api", "ui", "Return 201 Created", true)
  .addMessage("ui", "admin", "Tampilkan Notifikasi Akun Berhasil Dibuat", true);

fs.writeFileSync("fordza-docs/diagrams/sequence-15-kelola-admin.drawio", userMgmt.build());

// 7. Riwayat Stok (Stock Ledger)
const stockLog = new SequenceBuilder("Sequence Diagram - Riwayat Stok (Stock Ledger)")
  .addNode("admin", "Admin / Kasir", "actor")
  .addNode("ui", "Stock UI", "ui")
  .addNode("api", "API Route", "api")
  .addNode("svc", "StockLog\\nService", "service")
  .addNode("db", "Database", "db")
  .addMessage("admin", "ui", "Akses menu Riwayat Stok & Filter Tanggal")
  .addMessage("ui", "api", "GET /api/admin/stock-logs?startDate=...&endDate=...")
  .addMessage("api", "svc", "getStockLogs(filters)")
  .addMessage("svc", "db", "Query StockLog & Relasi (Product, Admin)")
  .addMessage("db", "svc", "Return logs & pagination", true)
  .addMessage("svc", "api", "Return mapped data", true)
  .addMessage("api", "ui", "Return JSON Data (200 OK)", true)
  .addMessage("ui", "admin", "Render Tabel Riwayat Pergerakan Stok", true);

fs.writeFileSync("fordza-docs/diagrams/sequence-16-riwayat-stok.drawio", stockLog.build());

// 8. Kelola Banner (CMS)
const banner = new SequenceBuilder("Sequence Diagram - Kelola Banner Promo")
  .addNode("admin", "Admin", "actor")
  .addNode("ui", "CMS UI", "ui")
  .addNode("api", "API Route", "api")
  .addNode("svc", "Banner\\nService", "service")
  .addNode("db", "Database/Storage", "db")
  .addMessage("admin", "ui", "Upload Gambar Banner & Isi Link")
  .addMessage("ui", "api", "POST /api/admin/banners (FormData)")
  .addMessage("api", "svc", "uploadAndCreateBanner(data, file)")
  .addMessage("svc", "db", "Upload image to Supabase Storage")
  .addMessage("db", "svc", "Return public URL", true)
  .addMessage("svc", "db", "Insert ke tabel Banner")
  .addMessage("db", "svc", "Insert success", true)
  .addMessage("svc", "api", "Return banner data", true)
  .addMessage("api", "ui", "Return 201 Created", true)
  .addMessage("ui", "admin", "Tampilkan Notifikasi Banner Berhasil Diunggah", true);

fs.writeFileSync("fordza-docs/diagrams/sequence-17-kelola-banner.drawio", banner.build());
