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
      
      // Activation box
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

// 1. Edit Product
const editProd = new SequenceBuilder("Sequence Diagram - Edit Produk (Update)")
  .addNode("admin", "Admin", "actor")
  .addNode("ui", "Product Form", "ui")
  .addNode("api", "API Route", "api")
  .addNode("svc", "Product Service", "service")
  .addNode("db", "Database", "db")
  .addMessage("admin", "ui", "Ubah data produk & submit")
  .addMessage("ui", "api", "PATCH /api/admin/products/[id]")
  .addMessage("api", "svc", "update(id, data, operatorId)")
  .addMessage("svc", "db", "Begin transaction")
  .addMessage("svc", "db", "Update tabel Product & ProductDetail")
  .addMessage("svc", "db", "Update categories & images")
  .addMessage("svc", "db", "Cek status isActive (Jika dinonaktifkan)")
  .addMessage("svc", "db", "tx.productVariant/Sku.updateMany(isActive=false)")
  .addMessage("svc", "db", "Recalculate total stock & min price")
  .addMessage("svc", "db", "Create skuStockLog & stockLog (Jika stock delta != 0)")
  .addMessage("svc", "db", "Commit transaction")
  .addMessage("db", "svc", "Commit success", true)
  .addMessage("svc", "api", "Return updated product", true)
  .addMessage("api", "ui", "Return 200 OK (updated data)", true)
  .addMessage("ui", "admin", "Tampilkan notifikasi sukses", true);

fs.writeFileSync("fordza-docs/diagrams/sequence-18-edit-product.drawio", editProd.build());
console.log("Created: sequence-18-edit-product.drawio");

// 2. Delete Product (Soft Delete)
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
  .addMessage("svc", "db", "Find product & check stock")
  .addMessage("db", "svc", "Return product stock data", true)
  .addMessage("svc", "db", "Create logs: delta = -stock (type: ADJUSTMENT)")
  .addMessage("svc", "db", "tx.productSku.updateMany(isActive=false, deletedAt=now)")
  .addMessage("svc", "db", "tx.productVariant.updateMany(isActive=false, deletedAt=now)")
  .addMessage("svc", "db", "tx.product.update(isActive=false, stock=0, deletedAt=now)")
  .addMessage("svc", "db", "Commit transaction")
  .addMessage("db", "svc", "Commit success", true)
  .addMessage("svc", "api", "Return success product state", true)
  .addMessage("api", "ui", "Return 200 OK", true)
  .addMessage("ui", "admin", "Tampilkan notifikasi sukses & refresh tabel", true);

fs.writeFileSync("fordza-docs/diagrams/sequence-19-delete-product.drawio", deleteProd.build());
console.log("Created: sequence-19-delete-product.drawio");
