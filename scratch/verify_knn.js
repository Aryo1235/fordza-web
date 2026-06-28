const fs = require('fs');
const xml = fs.readFileSync('fordza-docs/diagrams/activity-08-customer-knn.drawio', 'utf8');

const edgeCount = (xml.match(/edge="1"/g) || []).length;
const waypointSets = (xml.match(/<Array as="points">/g) || []).length;
const vertexCount = (xml.match(/vertex="1"/g) || []).length;
const badAmp = /&(?!(amp|lt|gt|quot|apos);)/.test(xml);

console.log('=== activity-08-customer-knn.drawio Verification ===');
console.log('Total vertices (nodes):', vertexCount);
console.log('Total edge connectors :', edgeCount);
console.log('Edges with waypoints  :', waypointSets);
console.log('XML entity OK         :', !badAmp);
console.log('File size (bytes)     :', xml.length);

// Check key nodes exist
const keyNodes = [
  'act_open_cat', 'act_req_cat', 'db_cat', 'act_browse',
  'act_click', 'act_fetch_det', 'db_det', 'act_render', 'act_read',
  'act_knn_fire', 'db_knn_one', 'act_find_tgt', 'act_feat_map',
  'act_ext_dim', 'act_vectorize', 'act_knn_dist', 'act_fmt_out',
  'act_show', 'end'
];

console.log('\n--- Node Existence Check ---');
keyNodes.forEach(id => {
  const exists = xml.includes(`id="${id}"`);
  console.log(`  ${exists ? '✓' : '✗'} ${id}`);
});

// Show label snippets to verify content
const allArrays = xml.match(/<Array as="points">[\s\S]*?<\/Array>/g) || [];
console.log('\n--- Waypoint Sets ---');
allArrays.forEach((arr, i) => {
  const pts = arr.match(/x="[0-9]+" y="[0-9]+"/g) || [];
  console.log(`  Set ${i+1}: ${pts.join(' -> ')}`);
});
