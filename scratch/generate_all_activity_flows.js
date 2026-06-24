const fs = require('fs');

class ActivityBuilder {
  constructor(name) {
    this.name = name;
    this.elements = [];
    this.edges = [];
    this.xPositions = {
      'actor': 140,   // Center of Column 1 (40 to 240, width = 200)
      'system': 390,  // Center of Column 2 (240 to 540, width = 300)
      'db': 660       // Center of Column 3 (540 to 780, width = 240)
    };
    this.colors = {
      'actor': { fill: '#dae8fc', stroke: '#6c8ebf' }, // Blue
      'system': { fill: '#d5e8d4', stroke: '#82b366' }, // Green
      'db': { fill: '#f8cecc', stroke: '#b85450' } // Red
    };
  }

  addHeader(titleActor, titleSystem, titleDb) {
    // Header boxes for columns (width matches columns: 200 + 300 + 240 = 740 total width)
    if (titleActor) {
      this.elements.push({
        id: 'hdr_actor',
        type: 'header',
        label: titleActor,
        x: 40,
        y: 40,
        width: 200,
        height: 40,
        style: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;fontStyle=1;align=center;strokeWidth=1;'
      });
    }
    if (titleSystem) {
      this.elements.push({
        id: 'hdr_system',
        type: 'header',
        label: titleSystem,
        x: 240,
        y: 40,
        width: 300,
        height: 40,
        style: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;fontStyle=1;align=center;strokeWidth=1;'
      });
    }
    if (titleDb) {
      this.elements.push({
        id: 'hdr_db',
        type: 'header',
        label: titleDb,
        x: 540,
        y: 40,
        width: 240,
        height: 40,
        style: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;fontStyle=1;align=center;strokeWidth=1;'
      });
    }

    return this;
  }

  addStart(column, y, xOffset = 0) {
    this.elements.push({
      id: 'start',
      type: 'start',
      x: this.xPositions[column] - 15 + xOffset,
      y: y,
      width: 30,
      height: 30,
      style: 'ellipse;html=1;shape=startState;fillColor=#000000;strokeColor=none;'
    });
    return this;
  }

  addAction(id, label, column, y, width = 160, height = 50, xOffset = 0) {
    const color = this.colors[column];
    this.elements.push({
      id,
      type: 'action',
      label: label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
      x: this.xPositions[column] - (width / 2) + xOffset,
      y: y,
      width,
      height,
      style: `rounded=1;whiteSpace=wrap;html=1;arcSize=30;fillColor=${color.fill};strokeColor=${color.stroke};`
    });
    return this;
  }

  addDecision(id, label, column, y, width = 80, height = 80, xOffset = 0) {
    this.elements.push({
      id,
      type: 'decision',
      label: label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
      x: this.xPositions[column] - (width / 2) + xOffset,
      y: y,
      width,
      height,
      style: 'rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;'
    });
    return this;
  }

  addEnd(id, column, y, xOffset = 0) {
    this.elements.push({
      id,
      type: 'end',
      x: this.xPositions[column] - 15 + xOffset,
      y: y,
      width: 30,
      height: 30,
      style: 'ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#000000;'
    });
    return this;
  }

  addEdge(sourceId, targetId, label = "", points = [], exit = "", entry = "") {
    let edgeStyle = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;";
    if (exit || entry) {
      edgeStyle += `exitX=${exit};entryX=${entry};`;
    }
    this.edges.push({
      id: `edge_${this.edges.length + 1}`,
      sourceId,
      targetId,
      label: label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
      style: edgeStyle,
      points
    });
    return this;
  }

  build(customHeight = 960) {
    // Generate solid boundary lines of the swimlane pool
    const poolLines = [
      // Left border of the pool
      { id: 'pool_left', label: '', x: 40, y: 80, width: 1, height: customHeight - 140, style: 'line;strokeWidth=1;fillColor=none;align=left;dashed=0;strokeColor=#666666;direction=south;' },
      // Divider 1 (Actor / System boundary)
      { id: 'pool_div1', label: '', x: 240, y: 80, width: 1, height: customHeight - 140, style: 'line;strokeWidth=1;fillColor=none;align=left;dashed=0;strokeColor=#666666;direction=south;' },
      // Divider 2 (System / Database boundary)
      { id: 'pool_div2', label: '', x: 540, y: 80, width: 1, height: customHeight - 140, style: 'line;strokeWidth=1;fillColor=none;align=left;dashed=0;strokeColor=#666666;direction=south;' },
      // Right border of the pool
      { id: 'pool_right', label: '', x: 780, y: 80, width: 1, height: customHeight - 140, style: 'line;strokeWidth=1;fillColor=none;align=left;dashed=0;strokeColor=#666666;direction=south;' },
      // Bottom border closing the pool
      { id: 'pool_bottom', label: '', x: 40, y: customHeight - 60, width: 740, height: 1, style: 'line;strokeWidth=1;fillColor=none;align=left;dashed=0;strokeColor=#666666;direction=east;' }
    ];

    let xml = `<mxfile host="app.diagrams.net" agent="5.0" version="21.0.0" type="device">\n`;
    xml += `  <diagram name="${this.name.replace(/&/g, '&amp;')}" id="diagram-1">\n`;
    xml += `    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="${customHeight}" math="0" shadow="0">\n`;
    xml += `      <root>\n`;
    xml += `        <mxCell id="0" />\n`;
    xml += `        <mxCell id="1" parent="0" />\n`;

    // Elements
    for (const elem of this.elements) {
      xml += `        <mxCell id="${elem.id}" value="${elem.label || ''}" style="${elem.style}" vertex="1" parent="1">\n`;
      xml += `          <mxGeometry x="${elem.x}" y="${elem.y}" width="${elem.width}" height="${elem.height}" as="geometry" />\n`;
      xml += `        </mxCell>\n`;
    }

    // Pool lines
    for (const pl of poolLines) {
      xml += `        <mxCell id="${pl.id}" value="${pl.label}" style="${pl.style}" vertex="1" parent="1">\n`;
      xml += `          <mxGeometry x="${pl.x}" y="${pl.y}" width="${pl.width}" height="${pl.height}" as="geometry" />\n`;
      xml += `        </mxCell>\n`;
    }

    // Edges
    for (const edge of this.edges) {
      xml += `        <mxCell id="${edge.id}" value="${edge.label || ''}" style="${edge.style}" edge="1" parent="1" source="${edge.sourceId}" target="${edge.targetId}">\n`;
      xml += `          <mxGeometry relative="1" as="geometry">\n`;
      if (edge.points && edge.points.length > 0) {
        xml += `            <Array as="points">\n`;
        for (const pt of edge.points) {
          xml += `              <mxPoint x="${pt.x}" y="${pt.y}" />\n`;
        }
        xml += `            </Array>\n`;
      }
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

// ============================================================================
// 1. LOGIN ACTIVITY DIAGRAM
// ============================================================================
const actLogin = new ActivityBuilder("Activity Diagram - Login & Autentikasi")
  .addHeader("User (Admin/Kasir)", "Sistem (Backend)", "Database")
  .addStart("actor", 100)
  .addAction("act_input", "Input Username & Password", "actor", 140)
  .addAction("act_check_limit", "Cek Login Rate Limit (5x/menit)", "system", 140)
  .addDecision("dec_limit", "Limit Terpenuhi?", "system", 220)
  .addAction("act_error_429", "Tampilkan Error 429\n(Rate Limit Exceeded)", "system", 235, 180, 50, 130) // Shifted right
  .addAction("act_validate", "Validasi Keberadaan Input (Zod)", "system", 330)
  .addDecision("dec_validate", "Valid?", "system", 410)
  .addAction("act_error_400", "Kembalikan Error 400\n(Bad Request)", "system", 425, 180, 50, 130) // Shifted right
  .addAction("act_search_db", "Cari Admin berdasarkan Username", "system", 520)
  .addAction("db_search", "Query Admin by Username", "db", 520)
  .addDecision("dec_exist", "User Ditemukan?", "system", 600)
  .addAction("act_error_401_user", "Kembalikan Error 401\n(Wrong Username)", "system", 615, 180, 50, 130) // Shifted right
  .addAction("act_verify_pwd", "Verifikasi Hash Password", "system", 710)
  .addDecision("dec_pwd", "Password Cocok?", "system", 780)
  .addAction("act_error_401_pwd", "Kembalikan Error 401\n(Wrong Password)", "system", 795, 180, 50, 130) // Shifted right
  .addAction("act_gen_token", "Generate JWT Access & Refresh Token", "system", 880, 200, 50)
  .addAction("act_set_cookie", "Set HttpOnly Cookies & Kirim 200 OK", "system", 960, 200, 50)
  .addAction("act_redirect", "Redirect ke Dashboard sesuai Role", "actor", 960, 180, 50)
  .addEnd("end", "actor", 1050)

  // Edges
  .addEdge("start", "act_input")
  .addEdge("act_input", "act_check_limit")
  .addEdge("act_check_limit", "dec_limit")
  .addEdge("dec_limit", "act_error_429", "Y (No)", [], "1", "0.5")
  .addEdge("dec_limit", "act_validate", "T (Yes)", [], "0.5", "0.5")
  .addEdge("act_error_429", "act_input", "Kembali", [ { x: 520, y: 115 }, { x: 140, y: 115 } ], "0.5", "0.5")
  .addEdge("act_validate", "dec_validate")
  .addEdge("dec_validate", "act_error_400", "T (No)", [], "1", "0.5")
  .addEdge("dec_validate", "act_search_db", "Y (Yes)", [], "0.5", "0.5")
  .addEdge("act_error_400", "act_input", "Kembali", [ { x: 520, y: 115 }, { x: 140, y: 115 } ], "0.5", "0.5")
  .addEdge("act_search_db", "db_search")
  .addEdge("db_search", "dec_exist", "", [], "0.5", "1")
  .addEdge("dec_exist", "act_error_401_user", "T (No)", [], "1", "0.5")
  .addEdge("dec_exist", "act_verify_pwd", "Y (Yes)", [], "0.5", "0.5")
  .addEdge("act_error_401_user", "act_input", "Kembali", [ { x: 520, y: 115 }, { x: 140, y: 115 } ], "0.5", "0.5")
  .addEdge("act_verify_pwd", "dec_pwd")
  .addEdge("dec_pwd", "act_error_401_pwd", "T (No)", [], "1", "0.5")
  .addEdge("dec_pwd", "act_gen_token", "Y (Yes)", [], "0.5", "0.5")
  .addEdge("act_error_401_pwd", "act_input", "Kembali", [ { x: 520, y: 115 }, { x: 140, y: 115 } ], "0.5", "0.5")
  .addEdge("act_gen_token", "act_set_cookie")
  .addEdge("act_set_cookie", "act_redirect")
  .addEdge("act_redirect", "end");

fs.writeFileSync("fordza-docs/diagrams/activity-01-login.drawio", actLogin.build(1120));
console.log("Generated: activity-01-login.drawio");


// ============================================================================
// 2a. CREATE MASTER DATA
// ============================================================================
const actCreateMaster = new ActivityBuilder("Activity Diagram - Tambah Data Master")
  .addHeader("Admin", "Sistem (Backend)", "Database")
  .addStart("actor", 100)
  .addAction("act_menu", "Pilih Menu Kelola & Pilih Tambah Baru", "actor", 140, 200, 50)
  .addAction("act_form", "Isi Form Data Baru & Upload Gambar", "actor", 220, 200, 50)
  .addAction("act_submit", "Klik Simpan", "actor", 300)
  .addAction("act_val", "Validasi Data Input (Zod Schema)", "system", 300)
  .addDecision("dec_val", "Valid?", "system", 380)
  .addAction("act_error_val", "Tampilkan Pesan Error Validasi", "system", 395, 180, 50, 130) // Shifted right
  .addAction("act_save_sys", "Mulai DB Transaction & Simpan Data", "system", 490, 200, 50)
  .addAction("db_save", "prisma.[entity].create()", "db", 490)
  .addAction("act_success_sys", "Kirim Respon Sukses 201 Created", "system", 580, 200, 50)
  .addAction("act_success_ui", "Tampilkan Toast Sukses & Refresh Tabel", "actor", 580, 220, 50)
  .addEnd("end", "actor", 670)

  // Edges
  .addEdge("start", "act_menu")
  .addEdge("act_menu", "act_form")
  .addEdge("act_form", "act_submit")
  .addEdge("act_submit", "act_val")
  .addEdge("act_val", "dec_val")
  .addEdge("dec_val", "act_error_val", "T (No)", [], "1", "0.5")
  .addEdge("dec_val", "act_save_sys", "Y (Yes)", [], "0.5", "0.5")
  .addEdge("act_error_val", "act_form", "Kembali", [ { x: 520, y: 195 }, { x: 140, y: 195 } ], "0.5", "0.5")
  .addEdge("act_save_sys", "db_save")
  .addEdge("db_save", "act_success_sys", "", [], "0.5", "1")
  .addEdge("act_success_sys", "act_success_ui")
  .addEdge("act_success_ui", "end");

fs.writeFileSync("fordza-docs/diagrams/activity-02a-create-master.drawio", actCreateMaster.build(740));
console.log("Generated: activity-02a-create-master.drawio");


// ============================================================================
// 2b. READ MASTER DATA
// ============================================================================
const actReadMaster = new ActivityBuilder("Activity Diagram - Lihat Data Master")
  .addHeader("Admin", "Sistem (Backend)", "Database")
  .addStart("actor", 100)
  .addAction("act_view_list", "Buka Halaman List Data Master", "actor", 140, 200, 50)
  .addAction("act_filter", "Terapkan Filter / Pencarian", "actor", 220)
  .addAction("act_get_list", "Kirim GET Request List Data", "system", 220)
  .addAction("db_list", "prisma.[entity].findMany()", "db", 220)
  .addAction("act_render_list", "Render Tabel Data & Pagination", "system", 300)
  .addAction("act_click_row", "Klik Salah Satu Baris untuk Detail", "actor", 380, 200, 50)
  .addAction("act_get_detail", "Kirim GET Request Detail by ID", "system", 380, 200, 50)
  .addAction("db_detail", "prisma.[entity].findFirst()", "db", 380)
  .addAction("act_render_detail", "Render Modal / Halaman Detail", "system", 460, 200, 50)
  .addAction("act_view_detail", "Lihat Informasi Detail Lengkap", "actor", 460, 200, 50)
  .addEnd("end", "actor", 540)

  // Edges
  .addEdge("start", "act_view_list")
  .addEdge("act_view_list", "act_filter")
  .addEdge("act_filter", "act_get_list")
  .addEdge("act_get_list", "db_list")
  .addEdge("db_list", "act_render_list", "", [], "0.5", "1")
  .addEdge("act_render_list", "act_click_row", "", [], "0.5", "0.5")
  .addEdge("act_click_row", "act_get_detail")
  .addEdge("act_get_detail", "db_detail")
  .addEdge("db_detail", "act_render_detail", "", [], "0.5", "1")
  .addEdge("act_render_detail", "act_view_detail")
  .addEdge("act_view_detail", "end");

fs.writeFileSync("fordza-docs/diagrams/activity-02b-read-master.drawio", actReadMaster.build(600));
console.log("Generated: activity-02b-read-master.drawio");


// ============================================================================
// 2c. UPDATE MASTER DATA
// ============================================================================
const actUpdateMaster = new ActivityBuilder("Activity Diagram - Ubah Data Master")
  .addHeader("Admin", "Sistem (Backend)", "Database")
  .addStart("actor", 100)
  .addAction("act_edit", "Klik Edit pada Salah Satu Data", "actor", 140, 200, 50)
  .addAction("act_load", "Load Data Lama & Tampilkan di Form", "system", 140, 200, 50)
  .addAction("act_change", "Ubah Field Input Data", "actor", 220)
  .addAction("act_submit", "Klik Update", "actor", 300)
  .addAction("act_val", "Validasi Form Edit (Zod Schema)", "system", 300)
  .addDecision("dec_val", "Valid?", "system", 380)
  .addAction("act_error_val", "Tampilkan Pesan Error Validasi", "system", 395, 180, 50, 130) // Shifted right
  .addAction("act_save_sys", "Mulai DB Transaction & Update Data", "system", 490, 200, 50)
  .addAction("db_save", "prisma.[entity].update()", "db", 490)
  .addAction("act_success_sys", "Kirim Respon Sukses 200 OK", "system", 580, 200, 50)
  .addAction("act_success_ui", "Tampilkan Toast Sukses & Kembali", "actor", 580, 200, 50)
  .addEnd("end", "actor", 670)

  // Edges
  .addEdge("start", "act_edit")
  .addEdge("act_edit", "act_load")
  .addEdge("act_load", "act_change", "", [], "0.5", "0.5")
  .addEdge("act_change", "act_submit")
  .addEdge("act_submit", "act_val")
  .addEdge("act_val", "dec_val")
  .addEdge("dec_val", "act_error_val", "T (No)", [], "1", "0.5")
  .addEdge("dec_val", "act_save_sys", "Y (Yes)", [], "0.5", "0.5")
  .addEdge("act_error_val", "act_change", "Kembali", [ { x: 520, y: 195 }, { x: 140, y: 195 } ], "0.5", "0.5")
  .addEdge("act_save_sys", "db_save")
  .addEdge("db_save", "act_success_sys", "", [], "0.5", "1")
  .addEdge("act_success_sys", "act_success_ui")
  .addEdge("act_success_ui", "end");

fs.writeFileSync("fordza-docs/diagrams/activity-02c-update-master.drawio", actUpdateMaster.build(740));
console.log("Generated: activity-02c-update-master.drawio");


// ============================================================================
// 2d. DELETE MASTER DATA
// ============================================================================
const actDeleteMaster = new ActivityBuilder("Activity Diagram - Hapus Data Master")
  .addHeader("Admin", "Sistem (Backend)", "Database")
  .addStart("actor", 100)
  .addAction("act_click_del", "Klik Tombol Hapus pada Baris Tabel", "actor", 140, 200, 50)
  .addAction("act_show_dialog", "Tampilkan Dialog Konfirmasi Hapus", "system", 140, 200, 50)
  .addDecision("dec_confirm", "Konfirmasi?", "actor", 220)
  .addAction("act_send_del", "Kirim DELETE/PATCH Request", "actor", 320, 180, 50)
  .addAction("act_delete_sys", "Proses Deaktifasi Status (isActive=false)", "system", 320, 220, 50)
  .addAction("db_delete", "prisma.[entity].update()", "db", 320)
  .addAction("act_success_sys", "Kirim Respon Sukses Hapus", "system", 400, 200, 50)
  .addAction("act_success_ui", "Hapus Baris dari Tabel & Toast Sukses", "actor", 400, 220, 50)
  .addEnd("end", "actor", 480)

  // Edges
  .addEdge("start", "act_click_del")
  .addEdge("act_click_del", "act_show_dialog")
  .addEdge("act_show_dialog", "dec_confirm", "", [], "0.5", "0.5")
  .addEdge("dec_confirm", "act_send_del", "Y (Ya)", [], "0.5", "0.5")
  .addEdge("dec_confirm", "end", "T (Tidak)", [ { x: 180, y: 260 }, { x: 140, y: 260 } ], "1", "0.5")
  .addEdge("act_send_del", "act_delete_sys")
  .addEdge("act_delete_sys", "db_delete")
  .addEdge("db_delete", "act_success_sys", "", [], "0.5", "1")
  .addEdge("act_success_sys", "act_success_ui")
  .addEdge("act_success_ui", "end");

fs.writeFileSync("fordza-docs/diagrams/activity-02d-delete-master.drawio", actDeleteMaster.build(550));
console.log("Generated: activity-02d-delete-master.drawio");


// ============================================================================
// 3. BULK IMPORT PRODUCTS
// ============================================================================
const actBulkImport = new ActivityBuilder("Activity Diagram - Impor Produk Massal")
  .addHeader("Admin", "Sistem (UI/Backend)", "Database")
  .addStart("actor", 100)
  .addAction("act_prep", "Siapkan File Excel/CSV Produk", "actor", 140, 180, 50)
  .addAction("act_upload", "Unggah File ke Dropzone", "actor", 220)
  .addAction("act_parse", "Parsing Excel ke JSON Array", "system", 220)
  .addDecision("dec_format", "Format Kolom Sesuai?", "system", 300)
  .addAction("act_err_format", "Notifikasi Format Kolom Salah", "system", 315, 200, 50, 130) // Shifted right
  .addAction("act_send_req", "Kirim POST /api/admin/products/bulk-import", "system", 410, 200, 50)
  .addAction("act_lookup", "Smart Lookup: Konversi Kategori ke ID", "system", 490, 200, 50)
  .addAction("db_lookup", "Query database Categories & Templates", "db", 490, 200, 50)
  .addAction("act_transaction", "Begin Transaction & Looping Penyimpanan", "system", 580, 220, 50)
  .addAction("db_insert", "Insert Product, Variant, SKU & Stock Log", "db", 660, 200, 50)
  .addDecision("dec_save", "Semua Data Lolos Validasi?", "system", 740, 100, 100)
  .addAction("act_commit", "Commit Transaction", "system", 860)
  .addAction("db_commit", "Database Commit", "db", 860)
  .addAction("act_rollback", "Rollback Transaction & Kumpulkan Error", "system", 755, 220, 50, 130) // Shifted right
  .addAction("act_response", "Kembalikan Hasil Impor (Sukses & Error Log)", "system", 940, 220, 50)
  .addAction("act_show_res", "Tampilkan Ringkasan Impor & Highlight Error", "actor", 940, 200, 50)
  .addEnd("end", "actor", 1030)

  // Edges
  .addEdge("start", "act_prep")
  .addEdge("act_prep", "act_upload")
  .addEdge("act_upload", "act_parse")
  .addEdge("act_parse", "dec_format")
  .addEdge("dec_format", "act_err_format", "T (No)", [], "1", "0.5")
  .addEdge("dec_format", "act_send_req", "Y (Yes)")
  .addEdge("act_err_format", "act_prep", "Kembali", [ { x: 520, y: 195 }, { x: 140, y: 195 } ], "0.5", "0.5")
  .addEdge("act_send_req", "act_lookup")
  .addEdge("act_lookup", "db_lookup")
  .addEdge("db_lookup", "act_transaction", "", [], "0.5", "1")
  .addEdge("act_transaction", "db_insert")
  .addEdge("db_insert", "dec_save", "", [], "0.5", "1")
  .addEdge("dec_save", "act_commit", "Y (Semua)", [], "0.5", "0.5")
  .addEdge("dec_save", "act_rollback", "T (Ada Error)", [], "1", "0.5")
  .addEdge("act_commit", "db_commit")
  .addEdge("db_commit", "act_response", "", [], "0.5", "1")
  .addEdge("act_rollback", "act_response", "", [ { x: 520, y: 910 } ])
  .addEdge("act_response", "act_show_res")
  .addEdge("act_show_res", "end");

fs.writeFileSync("fordza-docs/diagrams/activity-03-bulk-import.drawio", actBulkImport.build(1090));
console.log("Generated: activity-03-bulk-import.drawio");


// ============================================================================
// 4. STOCK OPNAME / BULK UPDATE STOCK
// ============================================================================
const actStockOpname = new ActivityBuilder("Activity Diagram - Penyesuaian Stok Massal")
  .addHeader("Admin", "Sistem (UI/Backend)", "Database")
  .addStart("actor", 100)
  .addAction("act_view", "Buka Halaman Penyesuaian Stok", "actor", 140, 200, 50)
  .addAction("act_input", "Input Selisih/Stok Baru di Tabel", "actor", 220, 200, 50)
  .addAction("act_submit", "Klik Simpan Perubahan Stok", "actor", 300, 180, 50)
  .addAction("act_send", "PATCH /api/admin/stock/opname", "system", 300, 180, 50)
  .addAction("act_tx", "Mulai Transaksi Database", "system", 380)
  .addAction("act_update_sku", "Update Stok productSku & Catat skuStockLog (ADJUSTMENT)", "system", 460, 220, 50)
  .addAction("db_sku", "prisma.productSku.update()", "db", 460, 180, 50)
  .addAction("act_update_prod", "Hitung Ulang Total Stok Master & Catat stockLog", "system", 540, 220, 50)
  .addAction("db_prod", "prisma.product.update()", "db", 540, 180, 50)
  .addDecision("dec_valid", "Semua SKU ID Valid?", "system", 620)
  .addAction("act_commit", "Commit Transaction & Simpan Log", "system", 710, 200, 50)
  .addAction("db_commit", "Database Commit", "db", 710)
  .addAction("act_rollback", "Rollback Transaction & Throw AppError 404", "system", 635, 220, 50, 130) // Shifted right
  .addAction("act_res_error", "Kirim Respon Gagal (ID Tidak Valid)", "system", 790, 220, 50, 130) // Shifted right
  .addAction("act_res_ok", "Kirim Respon Sukses 200 OK", "system", 870, 200, 50)
  .addAction("act_notify", "Tampilkan Notifikasi Ke Layar Admin", "actor", 870, 200, 50)
  .addEnd("end", "actor", 960)

  // Edges
  .addEdge("start", "act_view")
  .addEdge("act_view", "act_input")
  .addEdge("act_input", "act_submit")
  .addEdge("act_submit", "act_send")
  .addEdge("act_send", "act_tx")
  .addEdge("act_tx", "act_update_sku")
  .addEdge("act_update_sku", "db_sku")
  .addEdge("db_sku", "act_update_prod", "", [], "0.5", "1")
  .addEdge("act_update_prod", "db_prod")
  .addEdge("db_prod", "dec_valid", "", [], "0.5", "1")
  .addEdge("dec_valid", "act_commit", "Y (Valid)", [], "0.5", "0.5")
  .addEdge("dec_valid", "act_rollback", "T (Ada ID Salah)", [], "1", "0.5")
  .addEdge("act_commit", "db_commit")
  .addEdge("db_commit", "act_res_ok", "", [], "0.5", "1")
  .addEdge("act_rollback", "act_res_error")
  .addEdge("act_res_error", "act_notify", "", [ { x: 520, y: 840 } ])
  .addEdge("act_res_ok", "act_notify")
  .addEdge("act_notify", "end");

fs.writeFileSync("fordza-docs/diagrams/activity-04-stock-opname.drawio", actStockOpname.build(1020));
console.log("Generated: activity-04-stock-opname.drawio");


// ============================================================================
// 5. SALES REPORT
// ============================================================================
const actSalesReport = new ActivityBuilder("Activity Diagram - Laporan Penjualan")
  .addHeader("Admin", "Sistem (UI/Backend)", "Database")
  .addStart("actor", 100)
  .addAction("act_open", "Buka Dashboard Laporan", "actor", 140)
  .addAction("act_filter", "Pilih Rentang Tanggal", "actor", 220)
  .addAction("act_send", "GET /api/admin/reports", "system", 220)
  .addAction("act_query", "Ambil Data Transaksi & Detail Item Terjual", "system", 300, 200, 50)
  .addAction("db_query", "Query transactions where status != DRAFT", "db", 300, 200, 50)
  .addAction("act_calc", "Kalkulasi Ringkasan (Omset, Diskon, Void, Terjual)", "system", 390, 220, 50)
  .addAction("act_render", "Tampilkan Grafik Omset & Tabel Data Item", "system", 470, 220, 50)
  .addAction("act_display", "Lihat Visualisasi Laporan Penjualan", "actor", 470, 200, 50)
  .addDecision("dec_export", "Ekspor Laporan?", "actor", 550)
  .addAction("act_export_req", "Klik Ekspor (Excel/PDF)", "actor", 640)
  .addAction("act_export_api", "GET /api/admin/reports/export", "system", 640)
  .addAction("act_gen_file", "Generate File Buffer (Excel/PDF)", "system", 720, 200, 50)
  .addAction("act_download", "Unduh Laporan Luring (Offline)", "actor", 720, 180, 50)
  .addEnd("end", "actor", 820)

  // Edges
  .addEdge("start", "act_open")
  .addEdge("act_open", "act_filter")
  .addEdge("act_filter", "act_send")
  .addEdge("act_send", "act_query")
  .addEdge("act_query", "db_query")
  .addEdge("db_query", "act_calc", "", [], "0.5", "1")
  .addEdge("act_calc", "act_render")
  .addEdge("act_render", "act_display")
  .addEdge("act_display", "dec_export")
  .addEdge("dec_export", "act_export_req", "Y (Ya)", [], "0.5", "0.5")
  .addEdge("dec_export", "end", "T (Tidak)", [ { x: 140, y: 770 } ], "1", "0.5")
  .addEdge("act_export_req", "act_export_api")
  .addEdge("act_export_api", "act_gen_file")
  .addEdge("act_gen_file", "act_download")
  .addEdge("act_download", "end");

fs.writeFileSync("fordza-docs/diagrams/activity-05-sales-report.drawio", actSalesReport.build(880));
console.log("Generated: activity-05-sales-report.drawio");


// ============================================================================
// 6. CHECKOUT TRANSACTION POS
// ============================================================================
const actCheckout = new ActivityBuilder("Activity Diagram - Transaksi POS (Checkout)")
  .addHeader("Kasir", "Sistem POS (POS/Backend)", "Database")
  .addStart("actor", 100)
  
  // Shift Check (At the very beginning)
  .addAction("act_check_shift", "Verifikasi Laci Shift Kasir Aktif", "system", 140, 200, 50)
  .addAction("db_shift", "Query Open Shift by Kasir ID", "db", 140)
  .addDecision("dec_shift", "Shift Aktif?", "system", 220)
  .addAction("act_err_shift", "Tampilkan Error (Harus Buka Shift)", "system", 235, 200, 50, 130) // Shifted right

  // Main POS Flow (If Shift Active)
  .addAction("act_cart", "Masukkan Produk ke Keranjang POS", "actor", 320, 200, 50)
  .addAction("act_val_stock", "Cek Ketersediaan Stok SKU Fisik", "system", 320, 200, 50)
  .addAction("db_stock", "Query SKU/Product Stock", "db", 320)
  .addDecision("dec_stock", "Stok Cukup?", "system", 400)
  .addAction("act_err_stock", "Tampilkan Error (Stok Tidak Cukup)", "system", 415, 200, 50, 130) // Shifted right
  
  // Promo Calculation
  .addAction("act_promo", "Cari Promo Aktif (Variant -> Product -> Category -> Global)", "system", 500, 240, 55)
  .addAction("db_promo", "Query Active Promos", "db", 500)
  .addDecision("dec_promo", "Memenuhi minPurchase?", "system", 590, 100, 80)
  .addAction("act_apply_promo", "Hitung & Terapkan Potongan Harga", "system", 690, 200, 50)
  .addAction("act_no_promo", "Gunakan Harga Normal", "system", 605, 160, 50, 130) // Shifted right

  // Auth Threshold
  .addDecision("dec_auth", "Total Diskon > Rp 300.000?", "system", 780, 100, 80)
  .addAction("act_input_pin", "Minta PIN Otorisasi Admin", "actor", 875)
  .addAction("act_verify_pin", "Verifikasi PIN Admin di DB", "system", 875)
  .addAction("db_pin", "Query Admin by PIN", "db", 875)
  .addDecision("dec_pin", "PIN Valid?", "system", 960)
  .addAction("act_err_pin", "Tampilkan Error PIN Salah", "system", 975, 160, 50, 130) // Shifted right

  // Payment
  .addAction("act_payment", "Pilih Pembayaran & Input Nominal Diterima", "actor", 1060, 220, 50)
  .addDecision("dec_pay", "Nominal >= Total Belanja?", "system", 1140, 100, 80)
  .addAction("act_err_pay", "Tampilkan Error (Uang Kurang)", "system", 1155, 180, 50, 130) // Shifted right
  
  // Save Transaction
  .addAction("act_save", "Simpan Transaksi, Potong Stok & Buat Logs", "system", 1250, 220, 50)
  .addAction("db_save", "Insert Transaction, Update Stock & Write logs", "db", 1250, 220, 50)
  .addAction("act_print", "Cetak Invoice Belanja (POS Printer)", "actor", 1330, 200, 50)
  .addEnd("end", "actor", 1410)

  // Edges
  .addEdge("start", "act_check_shift")
  .addEdge("act_check_shift", "db_shift")
  .addEdge("db_shift", "dec_shift", "", [], "0.5", "1")
  .addEdge("dec_shift", "act_err_shift", "T (Tidak)", [], "1", "0.5")
  // act_err_shift → end: Route down the right side (db column) then cut left to actor end
  .addEdge("act_err_shift", "end", "Selesai", [ { x: 660, y: 270 }, { x: 660, y: 1430 }, { x: 125, y: 1430 } ], "0.5", "0.5")

  .addEdge("dec_shift", "act_cart", "Y (Ada)", [], "0.5", "0.5")
  .addEdge("act_cart", "act_val_stock")
  .addEdge("act_val_stock", "db_stock")
  .addEdge("db_stock", "dec_stock", "", [], "0.5", "1")
  .addEdge("dec_stock", "act_err_stock", "T (No)", [], "1", "0.5")
  // act_err_stock → act_cart: loop back via right column, then swing left back to actor
  .addEdge("act_err_stock", "act_cart", "Kembali", [ { x: 660, y: 440 }, { x: 660, y: 345 }, { x: 125, y: 345 } ], "0.5", "0.5")

  .addEdge("dec_stock", "act_promo", "Y (Yes)")
  .addEdge("act_promo", "db_promo")
  .addEdge("db_promo", "dec_promo", "", [], "0.5", "1")
  .addEdge("dec_promo", "act_apply_promo", "Y (Yes)", [], "0.5", "0.5")
  .addEdge("dec_promo", "act_no_promo", "T (No)", [], "1", "0.5")
  // Merge both promo paths into dec_auth with DISTINCT waypoints to avoid overlap
  .addEdge("act_apply_promo", "dec_auth", "", [ { x: 390, y: 740 }, { x: 390, y: 800 } ])
  .addEdge("act_no_promo", "dec_auth", "", [ { x: 480, y: 665 }, { x: 480, y: 800 } ])

  // dec_auth → act_payment (skip PIN): straight down in system column
  .addEdge("dec_auth", "act_payment", "T (Tidak)", [], "0.5", "0.5")
  // dec_auth → act_input_pin (require PIN): route left to actor column
  .addEdge("dec_auth", "act_input_pin", "Y (Ya)", [ { x: 350, y: 840 }, { x: 125, y: 840 } ], "1", "0.5")
  .addEdge("act_input_pin", "act_verify_pin")
  .addEdge("act_verify_pin", "db_pin")
  .addEdge("db_pin", "dec_pin", "", [], "0.5", "1")
  // dec_pin → act_payment (PIN valid): route right back to system column at payment y
  .addEdge("dec_pin", "act_payment", "Y (Valid)", [ { x: 350, y: 1000 }, { x: 350, y: 1085 } ], "0.5", "0.5")
  .addEdge("dec_pin", "act_err_pin", "T (Salah)", [], "1", "0.5")
  // act_err_pin → act_input_pin: tight local loop within actor column
  .addEdge("act_err_pin", "act_input_pin", "Kembali", [ { x: 660, y: 1000 }, { x: 660, y: 900 }, { x: 125, y: 900 } ], "0.5", "0.5")

  .addEdge("act_payment", "dec_pay")
  .addEdge("dec_pay", "act_save", "Y (Pas/Lebih)", [], "0.5", "0.5")
  .addEdge("dec_pay", "act_err_pay", "T (Uang Kurang)", [], "1", "0.5")
  // act_err_pay → act_payment: tight loop via right side then back to actor
  .addEdge("act_err_pay", "act_payment", "Kembali", [ { x: 660, y: 1180 }, { x: 660, y: 1085 }, { x: 125, y: 1085 } ], "0.5", "0.5")

  .addEdge("act_save", "db_save")
  .addEdge("db_save", "act_print", "", [], "0.5", "1")
  .addEdge("act_print", "end");

fs.writeFileSync("fordza-docs/diagrams/activity-06-checkout.drawio", actCheckout.build(1480));
console.log("Generated: activity-06-checkout.drawio");


// ============================================================================
// 7. SHIFT MANAGEMENT & VOID POS
// ============================================================================
const actShiftVoid = new ActivityBuilder("Activity Diagram - Shift & Void POS")
  .addHeader("Kasir", "Sistem (POS/Backend)", "Database")
  .addStart("actor", 80)
  .addDecision("dec_opt", "Pilih Menu POS", "actor", 120)

  // ── SECTION A: Buka Shift (y: 200 – 340) ───────────────────────────────────
  .addAction("act_open_shift", "Pilih Menu Buka Shift & Input Modal Awal", "actor", 200, 200, 55)
  .addAction("act_save_open", "POST /api/pos/shift/open — Simpan Shift Baru (OPEN)", "system", 200, 220, 55)
  .addAction("db_open", "prisma.shift.create()", "db", 200, 180, 55)

  // ── SECTION B: Tutup Shift (y: 420 – 600) ──────────────────────────────────
  .addAction("act_close_shift", "Pilih Tutup Shift & Input Uang Laci Aktual", "actor", 420, 200, 55)
  .addAction("act_calc_shift", "PATCH /api/pos/shift/close — Hitung Selisih Laci Otomatis", "system", 420, 230, 55)
  .addAction("act_save_close", "Update Shift ke DB (Status CLOSED & Selisih)", "system", 500, 220, 55)
  .addAction("db_close", "prisma.shift.update()", "db", 500, 180, 55)
  .addAction("act_print_shift", "Cetak Laporan Penutupan Shift", "actor", 580, 180, 55)

  // ── SECTION C: Void Transaksi (y: 680 – 960) ───────────────────────────────
  .addAction("act_void_select", "Pilih Transaksi dari Daftar & Klik Void", "actor", 680, 200, 55)
  .addAction("act_void_pin", "Input PIN Otorisasi & Alasan Void", "actor", 760, 180, 55)
  .addAction("act_void_verify", "POST /api/pos/void — Validasi PIN Admin", "system", 760, 220, 55)
  .addAction("db_void_check", "Query Admin PIN & Ambil Data Transaksi", "db", 760, 220, 55)
  .addDecision("dec_void_valid", "PIN Valid?", "system", 845, 90, 80)
  .addAction("act_void_err", "Tampilkan Error: PIN Salah", "system", 860, 180, 50, 140)
  .addAction("act_void_exec", "Update status=VOID, Restore Stok & Catat Log", "system", 950, 230, 55)
  .addAction("db_void_exec", "prisma.transaction.update() & productSku.update()", "db", 950, 220, 55)

  // ── SECTION D: Convergence / End (y: 1040 – 1120) ──────────────────────────
  .addAction("act_success", "Tampilkan Notifikasi Berhasil ke Layar Kasir", "system", 1040, 220, 55)
  .addEnd("end", "actor", 1060)

  // ── EDGES ───────────────────────────────────────────────────────────────────
  .addEdge("start", "dec_opt")

  // Branch A: Buka Shift
  .addEdge("dec_opt", "act_open_shift", "Buka Shift", [], "0.5", "0.5")
  .addEdge("act_open_shift", "act_save_open")
  .addEdge("act_save_open", "db_open")
  .addEdge("db_open", "act_success", "", [ { x: 760, y: 255 }, { x: 760, y: 1065 }, { x: 500, y: 1065 } ], "0.5", "0.5")

  // Branch B: Tutup Shift
  .addEdge("dec_opt", "act_close_shift", "Tutup Shift", [ { x: 60, y: 160 }, { x: 60, y: 448 } ], "0.5", "0.5")
  .addEdge("act_close_shift", "act_calc_shift")
  .addEdge("act_calc_shift", "act_save_close")
  .addEdge("act_save_close", "db_close")
  .addEdge("db_close", "act_print_shift", "", [], "0.5", "1")
  .addEdge("act_print_shift", "act_success", "", [ { x: 60, y: 608 }, { x: 60, y: 1065 }, { x: 280, y: 1065 } ])

  // Branch C: Void Transaksi
  .addEdge("dec_opt", "act_void_select", "Void Transaksi", [ { x: 60, y: 160 }, { x: 60, y: 708 } ], "0.5", "0.5")
  .addEdge("act_void_select", "act_void_pin")
  .addEdge("act_void_pin", "act_void_verify")
  .addEdge("act_void_verify", "db_void_check")
  .addEdge("db_void_check", "dec_void_valid", "", [], "0.5", "1")
  .addEdge("dec_void_valid", "act_void_exec", "Y (Valid)", [], "0.5", "0.5")
  .addEdge("dec_void_valid", "act_void_err", "T (Salah)", [], "1", "0.5")
  .addEdge("act_void_err", "act_void_pin", "Coba Lagi", [ { x: 760, y: 885 }, { x: 760, y: 788 }, { x: 125, y: 788 } ], "0.5", "0.5")
  .addEdge("act_void_exec", "db_void_exec")
  .addEdge("db_void_exec", "act_success", "", [ { x: 660, y: 1005 }, { x: 660, y: 1065 }, { x: 500, y: 1065 } ], "0.5", "0.5")

  .addEdge("act_success", "end");

fs.writeFileSync("fordza-docs/diagrams/activity-07-shift-void.drawio", actShiftVoid.build(1150));
console.log("Generated: activity-07-shift-void.drawio");


// ============================================================================
// 8. CUSTOMER CATALOG & KNN RECOMMENDATION (Accurate Implementation)
// ============================================================================
const actCustomerKnn = new ActivityBuilder("Activity Diagram - Katalog Produk & Rekomendasi KNN")
  .addHeader("Customer", "Sistem (Frontend / Backend)", "Database / KNN Engine")
  .addStart("actor", 80)

  // ── SECTION 1: KATALOG (y: 120–250) ────────────────────────────────────────
  .addAction("act_open_cat",  "Buka Katalog & Terapkan Filter Produk", "actor", 120, 210, 55)
  .addAction("act_req_cat",   "GET /api/public/products (search, gender, categoryIds, minPrice, maxPrice, sortBy)", "system", 120, 260, 55)
  .addAction("db_cat",        "Query Products WHERE isActive=true + Filters & Pagination", "db", 120, 240, 55)
  .addAction("act_browse",    "Telusuri Hasil Katalog & Pilih Produk yang Diminati", "actor", 230, 200, 55)

  // ── SECTION 2: PRODUCT DETAIL (y: 320–510) ─────────────────────────────────
  // Catatan: promo & finalPrice sudah ter-embed di data varian dari products.repo.ts
  // Tidak ada roundtrip DB terpisah untuk promo di endpoint ini
  .addAction("act_click",     "Klik Produk — Halaman Detail Mulai Dimuat", "actor", 320, 200, 55)
  .addAction("act_fetch_det", "GET /api/public/products/[id]", "system", 320, 220, 55)
  .addAction("db_det",        "Query Produk + Varian + SKU (finalPrice & promoName sudah ter-embed dari repo layer)", "db", 320, 250, 55)
  .addAction("act_render",    "Render Detail: finalPrice, promoName, highestPrice, galeri, stok per ukuran", "system", 420, 250, 55)
  .addAction("act_read",      "Membaca Info Produk, Pilih Warna & Ukuran", "actor", 510, 200, 55)

  // ── SECTION 3: KNN ASYNC (y: 610–1120) ─────────────────────────────────────
  // Catatan: dipanggil PARALEL dengan Section 2 oleh React Query (useRelatedProducts hook)
  // Tidak menunggu product detail selesai
  .addAction("act_knn_fire",  "React Query: GET /api/recommend/[id] (async, paralel saat halaman dimuat)", "system", 610, 270, 55)
  .addAction("db_knn_one",    "prisma.product.findMany(isActive:true) — 1 Query Semua Produk Aktif", "db", 610, 250, 55)
  .addAction("act_find_tgt",  "Find targetProduct dari array di memori (.find() — bukan query DB tambahan)", "system", 710, 260, 55)
  .addAction("act_feat_map",  "Map ke ProductFeature[] — categoryIds, material, insole, gender, productType, price", "system", 800, 270, 55)
  .addAction("act_ext_dim",   "extractUniqueDimensions() — Bangun Dimensi Adaptif untuk One-Hot Encoding", "system", 890, 270, 55)
  .addAction("act_vectorize", "buildProductVectors() — One-Hot Encode Kategori + Min-Max Normalisasi Harga", "system", 980, 270, 55)
  .addAction("act_knn_dist",  "findKNearest() — Hitung Euclidean Distance, Ambil K=4 Terdekat", "system", 1070, 270, 55)
  .addAction("act_fmt_out",   "Format Output: Gabung Data Produk + distance Score (4 desimal)", "system", 1160, 250, 55)

  // ── SECTION 4: CONVERGENCE (y: 1250–1350) ──────────────────────────────────
  .addAction("act_show",      "Tampilkan Carousel Produk Serupa & Badge Skor Kemiripan", "actor", 1250, 240, 55)
  .addEnd("end", "actor", 1360)

  // ── EDGES ───────────────────────────────────────────────────────────────────
  .addEdge("start", "act_open_cat")

  // Section 1: Catalog
  .addEdge("act_open_cat",  "act_req_cat")
  .addEdge("act_req_cat",   "db_cat")
  .addEdge("db_cat",        "act_browse",   "", [], "0.5", "1")
  .addEdge("act_browse",    "act_click")

  // Section 2: Product Detail
  .addEdge("act_click",     "act_fetch_det")
  .addEdge("act_fetch_det", "db_det")
  .addEdge("db_det",        "act_render",   "", [], "0.5", "1")
  .addEdge("act_render",    "act_read")

  // Section 3: KNN async — dari act_read menuju KNN pipeline
  // (representasi sequential; async terjadi saat halaman mount)
  .addEdge("act_read",      "act_knn_fire", "async (paralel saat halaman mount)")
  .addEdge("act_knn_fire",  "db_knn_one")
  .addEdge("db_knn_one",    "act_find_tgt", "", [], "0.5", "1")
  .addEdge("act_find_tgt",  "act_feat_map")
  .addEdge("act_feat_map",  "act_ext_dim")
  .addEdge("act_ext_dim",   "act_vectorize")
  .addEdge("act_vectorize", "act_knn_dist")
  .addEdge("act_knn_dist",  "act_fmt_out")

  // Section 4: Convergence — dari format output ke actor show
  .addEdge("act_fmt_out",   "act_show",     "", [ { x: 390, y: 1200 }, { x: 140, y: 1200 } ])
  .addEdge("act_show",      "end");

fs.writeFileSync("fordza-docs/diagrams/activity-08-customer-knn.drawio", actCustomerKnn.build(1430));
console.log("Generated: activity-08-customer-knn.drawio");

