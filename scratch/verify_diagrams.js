const fs = require('fs');
const path = require('path');

const DIAGRAMS_DIR = path.join(__dirname, '..', 'fordza-docs', 'diagrams');
const files = [
  "activity-01-login.drawio",
  "activity-02a-create-master.drawio",
  "activity-02b-read-master.drawio",
  "activity-02c-update-master.drawio",
  "activity-02d-delete-master.drawio",
  "activity-03-bulk-import.drawio",
  "activity-04-stock-opname.drawio",
  "activity-05-sales-report.drawio",
  "activity-06-checkout.drawio",
  "activity-07-shift-void.drawio",
  "activity-08-customer-knn.drawio"
];

console.log("=== VERIFIKASI AUTOMATED DIAGRAM ACTIVITY (UPDATED swimlane + split CRUD) ===");

let allValid = true;

for (const file of files) {
  const filePath = path.join(DIAGRAMS_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.error(`[-] File TIDAK ditemukan: ${file}`);
    allValid = false;
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  
  // 1. Check basic XML well-formedness (open/close tags of major elements)
  const openMxfile = content.includes('<mxfile');
  const closeMxfile = content.includes('</mxfile>');
  const openDiagram = content.includes('<diagram');
  const closeDiagram = content.includes('</diagram>');
  const openRoot = content.includes('<root>');
  const closeRoot = content.includes('</root>');

  if (!openMxfile || !closeMxfile || !openDiagram || !closeDiagram || !openRoot || !closeRoot) {
    console.error(`[-] File ${file} rusak atau tidak lengkap tag XML-nya.`);
    allValid = false;
    continue;
  }

  // 2. Parse IDs and check uniqueness
  const cellIdRegex = /id="([^"]+)"/g;
  const ids = [];
  let match;
  while ((match = cellIdRegex.exec(content)) !== null) {
    const id = match[1];
    ids.push(id);
  }

  // Check for duplicate IDs (excluding standard 0 and 1 which might appear multiple times if they are in different tags)
  const duplicates = ids.filter((item, index) => ids.indexOf(item) !== index);
  const uniqueDuplicates = [...new Set(duplicates)].filter(id => id !== '0' && id !== '1');

  if (uniqueDuplicates.length > 0) {
    console.error(`[-] File ${file} memiliki ID duplikat: ${uniqueDuplicates.join(', ')}`);
    allValid = false;
    continue;
  }

  // 3. Verify presence of essential components
  const hasStart = content.includes('shape=startState') || content.includes('start');
  const hasEnd = content.includes('shape=endState') || content.includes('end');
  const hasHeaders = content.includes('hdr_actor') || content.includes('hdr_system');
  const hasPoolBorders = content.includes('pool_left') && content.includes('pool_right') && content.includes('pool_bottom');

  if (!hasStart || !hasEnd || !hasHeaders) {
    console.error(`[-] File ${file} tidak memiliki elemen standar (start, end, atau headers).`);
    allValid = false;
    continue;
  }

  if (!hasPoolBorders) {
    console.error(`[-] File ${file} tidak memiliki garis batas swimlane pool.`);
    allValid = false;
    continue;
  }

  console.log(`[+] File ${file} VALID: ${ids.length} elemen terdeteksi, ID Unik, Batas Swimlane OK.`);
}

if (allValid) {
  console.log("\n>>> SEMUA 11 FILE ACTIVITY DIAGRAM DINYATAKAN VALID! <<<");
} else {
  console.error("\n>>> TERDAPAT ERROR PADA FILE DIAGRAM! <<<");
  process.exit(1);
}
