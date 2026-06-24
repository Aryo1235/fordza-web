const fs = require('fs');
const xml = fs.readFileSync('fordza-docs/diagrams/activity-07-shift-void.drawio', 'utf8');

const edgeCount = (xml.match(/edge="1"/g) || []).length;
const waypointSets = (xml.match(/<Array as="points">/g) || []).length;
const badAmp = /&(?!(amp|lt|gt|quot|apos);)/.test(xml);

console.log('=== activity-07-shift-void.drawio Verification ===');
console.log('Total edge connectors :', edgeCount);
console.log('Edges with waypoints  :', waypointSets);
console.log('XML entity OK         :', !badAmp);
console.log('File size (bytes)     :', xml.length);

const allArrays = xml.match(/<Array as="points">[\s\S]*?<\/Array>/g) || [];
console.log('\n--- Waypoint Sets ---');
allArrays.forEach((arr, i) => {
  const pts = arr.match(/x="[0-9]+" y="[0-9]+"/g) || [];
  console.log(`  Set ${i+1}: ${pts.join(' -> ')}`);
});

// Show element y-positions to verify spacing
const yValues = [];
const yMatches = xml.matchAll(/y="([0-9]+)" width=/g);
for (const m of yMatches) yValues.push(parseInt(m[1]));
const unique = [...new Set(yValues)].sort((a,b) => a-b);
console.log('\n--- Element Y positions ---');
console.log(unique.join(', '));
