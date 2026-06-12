const fs = require('fs');
const path = require('path');

class SequenceBuilder {
  constructor(name) {
    this.name = name;
    this.actors = [];
    this.messages = [];
    this.currentY = 180;
    this.actorWidth = 100;
    this.actorGap = 200;
  }

  addActor(id, label, isActor = false) {
    this.actors.push({
      id,
      label,
      isActor,
      x: 60 + this.actors.length * this.actorGap,
      y: 80
    });
    return this;
  }

  addMessage(sourceId, targetId, label, isReturn = false) {
    const source = this.actors.find(a => a.id === sourceId);
    const target = this.actors.find(a => a.id === targetId);
    
    this.messages.push({
      id: `msg${this.messages.length + 1}`,
      sourceId,
      targetId,
      label,
      isReturn,
      y: this.currentY,
      sourceX: source.x + (source.isActor ? 20 : 50),
      targetX: target.x + (target.isActor ? 20 : 50)
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

    // Actors
    for (const actor of this.actors) {
      if (actor.isActor) {
        xml += `        <mxCell id="${actor.id}" value="${actor.label}" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">\n`;
        xml += `          <mxGeometry x="${actor.x}" y="${actor.y}" width="40" height="80" as="geometry" />\n`;
        xml += `        </mxCell>\n`;
      } else {
        xml += `        <mxCell id="${actor.id}" value="${actor.label}" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">\n`;
        xml += `          <mxGeometry x="${actor.x}" y="${actor.y}" width="100" height="60" as="geometry" />\n`;
        xml += `        </mxCell>\n`;
      }
      
      // Lifeline
      const lineX = actor.x + (actor.isActor ? 20 : 50);
      xml += `        <mxCell id="ll_${actor.id}" value="" style="endArrow=none;dashed=1;html=1;dashPattern=1 3;strokeWidth=2;" edge="1" parent="1">\n`;
      xml += `          <mxGeometry width="50" height="50" relative="1" as="geometry">\n`;
      xml += `            <mxPoint x="${lineX}" y="160" as="sourcePoint" />\n`;
      xml += `            <mxPoint x="${lineX}" y="${this.currentY + 60}" as="targetPoint" />\n`;
      xml += `          </mxGeometry>\n`;
      xml += `        </mxCell>\n`;
      
      // Activation box
      xml += `        <mxCell id="act_${actor.id}" value="" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">\n`;
      xml += `          <mxGeometry x="${lineX - 5}" y="180" width="10" height="${this.currentY - 180}" as="geometry" />\n`;
      xml += `        </mxCell>\n`;
    }

    // Messages
    for (let i = 0; i < this.messages.length; i++) {
      const msg = this.messages[i];
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
const knn = new SequenceBuilder("Sequence Diagram - KNN Recommender")
  .addActor("user", "User", true)
  .addActor("api", "API Route")
  .addActor("svc", "KNN Service")
  .addActor("db", "Database")
  .addMessage("user", "api", "GET /api/products/[id]/recommendations")
  .addMessage("api", "db", "Fetch Target Product")
  .addMessage("db", "api", "Return Target Product", true)
  .addMessage("api", "db", "Fetch All Active Products")
  .addMessage("db", "api", "Return All Products", true)
  .addMessage("api", "svc", "getRecommendations(target, all)")
  .addMessage("svc", "svc", "Calculate Euclidean Distances")
  .addMessage("svc", "svc", "Sort K-Nearest")
  .addMessage("svc", "api", "Return Top 4 Similar", true)
  .addMessage("api", "user", "Return JSON", true);

fs.writeFileSync("fordza-docs/diagrams/sequence-10-knn-recommender.drawio", knn.build());

// 2. Bulk Import
const bulk = new SequenceBuilder("Sequence Diagram - Bulk Import Produk")
  .addActor("admin", "Admin", true)
  .addActor("api", "API Route")
  .addActor("svc", "Product Service")
  .addActor("db", "Database")
  .addMessage("admin", "admin", "Parse Excel/CSV")
  .addMessage("admin", "api", "POST /api/admin/products/bulk-import")
  .addMessage("api", "svc", "bulkImport(products)")
  .addMessage("svc", "db", "Fetch Categories & Templates")
  .addMessage("db", "svc", "Return Data (Cache)", true)
  .addMessage("svc", "svc", "Smart Lookup IDs")
  .addMessage("svc", "db", "tx.product.create() Loop")
  .addMessage("db", "svc", "Commit / Catch Errors", true)
  .addMessage("svc", "api", "Return {success, failed, errors}", true)
  .addMessage("api", "admin", "Return Partial Success JSON", true);

fs.writeFileSync("fordza-docs/diagrams/sequence-11-bulk-import.drawio", bulk.build());

// 3. Bulk Stock
const stock = new SequenceBuilder("Sequence Diagram - Bulk Update Stock")
  .addActor("admin", "Admin", true)
  .addActor("api", "API Route")
  .addActor("svc", "Product Service")
  .addActor("db", "Database")
  .addMessage("admin", "api", "PATCH /api/admin/products/bulk-stock")
  .addMessage("api", "svc", "bulkUpdateStock(items)")
  .addMessage("svc", "db", "Start $transaction")
  .addMessage("db", "db", "tx.productSku.update(stock)")
  .addMessage("db", "db", "tx.skuStockLog.create()")
  .addMessage("db", "db", "tx.product.aggregate()")
  .addMessage("db", "db", "tx.stockLog.create()")
  .addMessage("db", "svc", "Transaction Commit Success", true)
  .addMessage("svc", "api", "Return Success", true)
  .addMessage("api", "admin", "Return 200 OK", true);

fs.writeFileSync("fordza-docs/diagrams/sequence-12-bulk-stock.drawio", stock.build());

// 4. Manage Categories
const cat = new SequenceBuilder("Sequence Diagram - Manage Categories")
  .addActor("admin", "Admin", true)
  .addActor("api", "API Route")
  .addActor("db", "Database")
  .addMessage("admin", "api", "POST /api/admin/categories")
  .addMessage("api", "db", "Create Category")
  .addMessage("db", "api", "Return Category ID", true)
  .addMessage("api", "admin", "Return 201 Created", true)
  .addMessage("admin", "api", "DELETE /api/admin/categories/[id]")
  .addMessage("api", "db", "Check Relations (Products)")
  .addMessage("db", "api", "Return Relation Error", true)
  .addMessage("api", "admin", "Return 400 Bad Request", true);

fs.writeFileSync("fordza-docs/diagrams/sequence-13-kelola-kategori.drawio", cat.build());
