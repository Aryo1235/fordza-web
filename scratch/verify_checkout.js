const fs = require('fs');
const xml = fs.readFileSync('fordza-docs/diagrams/activity-06-checkout.drawio', 'utf8');

const edgeCount = (xml.match(/edge="1"/g) || []).length;
const waypointSets = (xml.match(/<Array as="points">/g) || []).length;

// Check for unescaped ampersands (bad XML)
const badAmp = /&(?!(amp|lt|gt|quot|apos);)/.test(xml);

console.log('=== activity-06-checkout.drawio Verification ===');
console.log('Total edge connectors :', edgeCount);
console.log('Edges with waypoints  :', waypointSets);
console.log('XML entity OK         :', !badAmp);
console.log('File size (bytes)     :', xml.length);

// Extract and display all waypoint coordinates
const allArrays = xml.match(/<Array as="points">[\s\S]*?<\/Array>/g) || [];
console.log('\n--- Waypoint Details ---');
allArrays.forEach((arr, i) => {
  const pts = arr.match(/x="[0-9]+" y="[0-9]+"/g) || [];
  console.log(`  Set ${i+1}: ${pts.join(' -> ')}`);
});
