const fs = require('fs');

class SequenceBuilder {
  constructor(name) {
    this.name = name;
    this.actors = [];
    this.messages = [];
    this.notes = [];
    this.currentY = 180;
    this.xPositions = {
      'actor': 60,
      'customer': 60,
      'admin': 60,
      'ui': 200,
      'api': 400,
      'service': 600,
      'knn': 800,
      'db': 1000
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
    } else if (type === 's3') {
      style = "ellipse;shape=cloud;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;";
      width = 100;
      height = 60;
    }

    // Custom overrides for specific node IDs X positions
    let x = this.xPositions[type];
    if (id === 'db' && type === 'db') {
      // If s3 is not present, database can be at 800
      x = this.actors.some(a => a.id === 's3') ? 1000 : (this.actors.some(a => a.id === 'knn') ? 1000 : 800);
    }
    if (id === 'knn' && type === 'service') {
      x = 800; // Place KNN service at 800
    }

    this.actors.push({
      id,
      label: label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
      type,
      style,
      width,
      height,
      x: x || 200,
      y: 80
    });
    return this;
  }

  addMessage(sourceId, targetId, label, isReturn = false) {
    const source = this.actors.find(a => a.id === sourceId);
    const target = this.actors.find(a => a.id === targetId);
    
    if (!source || !target) {
      throw new Error(`Source "${sourceId}" or Target "${targetId}" not found in diagram "${this.name}"`);
    }
    
    const sourceCenter = source.x + (source.width / 2);
    const targetCenter = target.x + (target.width / 2);
    
    const msgNum = this.messages.length + 1;

    // Special handling to make self-calls/loops render nicely
    let pointsString = "";
    let srcX = sourceCenter;
    let tgtX = targetCenter;
    let targetY = this.currentY;

    if (sourceId === targetId) {
      srcX = sourceCenter;
      tgtX = sourceCenter;
      targetY = this.currentY + 20;
      pointsString = `            <Array as="points">\n              <mxPoint x="${sourceCenter + 70}" y="${this.currentY}" />\n              <mxPoint x="${sourceCenter + 70}" y="${targetY}" />\n            </Array>\n`;
    }

    this.messages.push({
      id: `msg${msgNum}`,
      sourceId,
      targetId,
      label: `${msgNum}: ${label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}`,
      isReturn,
      y: this.currentY,
      targetY,
      sourceX: srcX,
      targetX: tgtX,
      pointsString
    });
    
    this.currentY += (sourceId === targetId) ? 40 : 40;
    return this;
  }

  addNote(value, x, y, width = 220, height = 120) {
    this.notes.push({
      id: `note_${this.notes.length + 1}`,
      value: value.replace(/\n/g, '&#xa;').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
      x,
      y,
      width,
      height
    });
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

    // Nodes & Lifelines
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
      
      // Activation box
      const actorMsgs = this.messages.filter(m => m.targetId === actor.id || m.sourceId === actor.id);
      if (actorMsgs.length > 0 && actor.type !== 'actor') {
         const firstMsg = actorMsgs[0];
         const lastMsg = actorMsgs[actorMsgs.length - 1];
         
         const actTop = firstMsg.y - 10;
         const actHeight = (lastMsg.targetY || lastMsg.y) - firstMsg.y + 20;
         
         const actStyle = actor.style.includes('shape=cylinder3') ? 'rounded=0;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;' : actor.style;
         xml += `        <mxCell id="act_${actor.id}" value="" style="${actStyle.replace('shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;', 'rounded=0;whiteSpace=wrap;html=1;')}" vertex="1" parent="1">\n`;
         xml += `          <mxGeometry x="${lineX - 5}" y="${actTop}" width="10" height="${actHeight}" as="geometry" />\n`;
         xml += `        </mxCell>\n`;
      }
    }

    // Messages
    for (const msg of this.messages) {
      let arrowStyle = msg.isReturn ? "endArrow=open;endFill=0;html=1;dashed=1;" : "endArrow=block;endFill=1;html=1;";
      if (msg.sourceId === msg.targetId) {
        arrowStyle = "edgeStyle=orthogonalEdgeStyle;html=1;align=left;verticalAlign=bottom;endArrow=block;rounded=0;";
      }
      xml += `        <mxCell id="${msg.id}" value="${msg.label}" style="${arrowStyle}" edge="1" parent="1">\n`;
      xml += `          <mxGeometry x="-0.2" y="10" relative="1" as="geometry">\n`;
      xml += `            ${msg.pointsString || ''}`;
      xml += `            <mxPoint x="${msg.sourceX}" y="${msg.y}" as="sourcePoint" />\n`;
      xml += `            <mxPoint x="${msg.targetX}" y="${msg.targetY || msg.y}" as="targetPoint" />\n`;
      xml += `            <mxPoint as="offset" />\n`;
      xml += `          </mxGeometry>\n`;
      xml += `        </mxCell>\n`;
    }

    // Notes
    for (const note of this.notes) {
      xml += `        <mxCell id="${note.id}" parent="1" style="shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;darkOpacity=0.05;fillColor=#fff2cc;strokeColor=#d6b656;size=15;" value="${note.value}" vertex="1">\n`;
      xml += `          <mxGeometry x="${note.x}" y="${note.y}" width="${note.width}" height="${note.height}" as="geometry" />\n`;
      xml += `        </mxCell>\n`;
    }

    xml += `      </root>\n`;
    xml += `    </mxGraphModel>\n`;
    xml += `  </diagram>\n`;
    xml += `</mxfile>`;

    return xml;
  }
}

// ----------------------------------------------------
// 1. CREATE PRODUCT FLOW
// ----------------------------------------------------
const createProd = new SequenceBuilder("Sequence Diagram - Tambah Produk (Create Product)")
  .addNode("admin", "Admin", "actor")
  .addNode("ui", "Product Form", "ui")
  .addNode("api", "API Route", "api")
  .addNode("s3", "AWS S3", "s3")
  .addNode("svc", "Product Service", "service")
  .addNode("db", "Database", "db")
  .addMessage("admin", "ui", "Input data produk & upload gambar")
  .addMessage("ui", "api", "POST /api/admin/products (Multipart FormData)")
  .addMessage("api", "api", "Validate data (Zod & check categoryIds/sizeTemplateId)")
  .addMessage("api", "s3", "uploadFileToS3() (Upload main & variant images)")
  .addMessage("s3", "api", "Return uploaded image keys & URLs", true)
  .addMessage("api", "svc", "create(data)")
  .addMessage("svc", "db", "Begin transaction")
  .addMessage("svc", "db", "tx.product.create() (Save product, details, variants, SKUs)")
  .addMessage("svc", "db", "Log initial stock (tx.skuStockLog & tx.stockLog)")
  .addMessage("svc", "db", "Commit transaction")
  .addMessage("db", "svc", "Commit success", true)
  .addMessage("svc", "api", "Return created product", true)
  .addMessage("api", "ui", "Return 201 Created (product data)", true)
  .addMessage("ui", "admin", "Tampilkan notifikasi sukses & redirect", true)
  .addNote(
    "Catatan Rollback S3:\nJika transaksi database di ProductService.create gagal, API Route akan menangkap error (catch block) lalu menghapus kembali file gambar yang baru saja terupload ke AWS S3 menggunakan deleteFileFromS3().",
    1100, 200, 240, 150
  )
  .addNote(
    "Catatan Transaksional:\nProses upload gambar ke S3 dan penyimpanan records ke DB dilakukan secara inline (berbarengan) dalam satu request handler POST.",
    1100, 380, 240, 110
  );

fs.writeFileSync("fordza-docs/diagrams/sequence-03-create-product.drawio", createProd.build());
console.log("Updated: sequence-03-create-product.drawio");

// ----------------------------------------------------
// 2. EDIT PRODUCT FLOW (Decoupled S3 & Variants Upload)
// ----------------------------------------------------
const editProd = new SequenceBuilder("Sequence Diagram - Edit Produk (Update)")
  .addNode("admin", "Admin", "actor")
  .addNode("ui", "Product Form", "ui")
  .addNode("api", "API Route", "api")
  .addNode("svc", "Product Service", "service")
  .addNode("db", "Database", "db")
  .addMessage("admin", "ui", "Ubah data produk & klik Simpan")
  .addMessage("ui", "api", "PUT /api/admin/products/[id] (FormData)")
  .addMessage("api", "api", "Validate fields & relation IDs")
  .addMessage("api", "svc", "update(id, data, operatorId)")
  .addMessage("svc", "db", "Begin transaction")
  .addMessage("svc", "db", "Update product & productDetail fields")
  .addMessage("svc", "db", "Re-create category connections")
  .addMessage("svc", "db", "If deactivating: cascade isActive=false to variants & SKUs")
  .addMessage("svc", "db", "Recalculate product total stock & min base price")
  .addMessage("svc", "db", "Create stockLog / skuStockLog entries for adjustments")
  .addMessage("svc", "db", "Commit transaction")
  .addMessage("db", "svc", "Commit success & return updated product", true)
  .addMessage("svc", "api", "Return updated product data", true)
  .addMessage("api", "ui", "Return 200 OK (updated data)", true)
  .addMessage("ui", "admin", "Tampilkan notifikasi sukses", true)
  .addNote(
    "Decoupled Image & Variant Management:\nUnggah/hapus gambar produk diproses terpisah secara instan (Auto Save) via POST/DELETE /api/admin/products/[id]/images saat admin berinteraksi dengan dropzone di UI.\n\nTombol 'Simpan Data Produk' hanya mengirim data teks dan kategori ke endpoint PUT /api/admin/products/[id] tanpa beban file gambar.",
    900, 180, 240, 200
  );

fs.writeFileSync("fordza-docs/diagrams/sequence-18-edit-product.drawio", editProd.build());
console.log("Updated: sequence-18-edit-product.drawio");

// ----------------------------------------------------
// 3. DELETE PRODUCT FLOW
// ----------------------------------------------------
const deleteProd = new SequenceBuilder("Sequence Diagram - Hapus Produk (Soft Delete)")
  .addNode("admin", "Admin", "actor")
  .addNode("ui", "Product List", "ui")
  .addNode("api", "API Route", "api")
  .addNode("svc", "Product Service", "service")
  .addNode("db", "Database", "db")
  .addMessage("admin", "ui", "Klik hapus produk & konfirmasi")
  .addMessage("ui", "api", "DELETE /api/admin/products/[id]")
  .addMessage("api", "svc", "delete(id, operatorId)")
  .addMessage("svc", "db", "Begin transaction")
  .addMessage("svc", "db", "Retrieve existing stock & variant colors for audit logs")
  .addMessage("db", "svc", "Return current stock & variant data", true)
  .addMessage("svc", "db", "Create logs: delta = -stock (type: ADJUSTMENT) in skuStockLog & stockLog")
  .addMessage("svc", "db", "tx.productSku.updateMany(isActive=false, deletedAt=now)")
  .addMessage("svc", "db", "tx.productVariant.updateMany(isActive=false, deletedAt=now)")
  .addMessage("svc", "db", "tx.product.update(isActive=false, stock=0, deletedAt=now)")
  .addMessage("svc", "db", "Commit transaction")
  .addMessage("db", "svc", "Commit success", true)
  .addMessage("svc", "api", "Return success status", true)
  .addMessage("api", "ui", "Return 200 OK", true)
  .addMessage("ui", "admin", "Tampilkan notifikasi sukses & refresh tabel", true)
  .addNote(
    "Hanya Edit Status (Soft Delete):\nSistem tidak menghapus data secara fisik (hard delete) atau menghapus file di S3. Operasi delete ini adalah update status (isActive=false, deletedAt=now, stock=0) ditambah pencatatan log adjustment stok.",
    1100, 200, 240, 150
  );

fs.writeFileSync("fordza-docs/diagrams/sequence-19-delete-product.drawio", deleteProd.build());
console.log("Updated: sequence-19-delete-product.drawio");

// ----------------------------------------------------
// 4. VIEW PRODUCT DETAIL FLOW (With Asymmetric KNN Load)
// ----------------------------------------------------
const viewProd = new SequenceBuilder("Sequence Diagram - Lihat Detail Produk (Customer)")
  .addNode("customer", "Customer", "actor")
  .addNode("ui", "Product Page", "ui")
  .addNode("api", "API Route", "api")
  .addNode("svc", "Product Service", "service")
  .addNode("knn", "KNN Service", "service")
  .addNode("db", "Database", "db")
  .addMessage("customer", "ui", "Klik produk di katalog")
  .addMessage("ui", "api", "GET /api/public/products/[id]")
  .addMessage("api", "svc", "getById(id)")
  .addMessage("svc", "db", "Query product details & variants data")
  .addMessage("db", "svc", "Return product record", true)
  .addMessage("svc", "api", "Return product data", true)
  .addMessage("api", "ui", "Return 200 OK (Product data)", true)
  .addMessage("ui", "ui", "Render product info & show skeleton loader")
  .addMessage("ui", "api", "GET /api/recommend/[id] (Async KNN Fetch)")
  .addMessage("api", "knn", "getRecommendations(id, 6)")
  .addMessage("knn", "db", "Query all active products for vectors")
  .addMessage("db", "knn", "Return active products data", true)
  .addMessage("knn", "knn", "Compute Euclidean Distance & Sort K-Nearest")
  .addMessage("knn", "api", "Return top 6 recommended products", true)
  .addMessage("api", "ui", "Return 200 OK (Recommendations JSON)", true)
  .addMessage("ui", "customer", "Render Produk Serupa section & match badges", true)
  .addNote(
    "Arsitektur Pemuatan Asimetris (Asymmetric Loading):\nUntuk mencegah kelambatan pemuatan halaman (*page blocking*), kueri KNN dipisah menjadi API terpisah (/api/recommend/[id]). Halaman produk utama termuat secara instan (langkah 1-7), sedangkan modul rekomendasi KNN dimuat secara asinkronus (langkah 9-15).",
    1100, 180, 250, 190
  );

fs.writeFileSync("fordza-docs/diagrams/sequence-04-view-product.drawio", viewProd.build());
console.log("Updated: sequence-04-view-product.drawio");
