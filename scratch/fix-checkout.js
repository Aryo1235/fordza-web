const fs = require('fs');
const path = require('path');

const postmanDir = path.join(__dirname, '../postman');
const files = fs.readdirSync(postmanDir).filter(f => f.endsWith('.json'));

function findFolder(items, name) {
  for (let item of items) {
    if (item.name === name && item.item) return item;
    if (item.item) {
      const found = findFolder(item.item, name);
      if (found) return found;
    }
  }
  return null;
}

for (const filename of files) {
  if (filename.includes('environment')) continue;
  
  const file = path.join(postmanDir, filename);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    continue;
  }
  
  let modified = false;

  const openShiftFolder = findFolder(data.item || [], 'Open Shift');
  if (openShiftFolder && openShiftFolder.item && openShiftFolder.item.length > 0) {
    for (let req of openShiftFolder.item) {
      if (req.request) {
        req.request.body = {
          mode: "raw",
          raw: JSON.stringify({
            startingCash: 500000,
            notes: "Modal awal dari brankas"
          }, null, 2),
          options: {
            raw: { language: "json" }
          }
        };
        modified = true;
        console.log(`Updated Open Shift request in folder: ${req.name}`);
      }
    }
  } else {
    // If it's not a folder, it might be a direct request (Fordza-API.postman_collection.json)
    function findReq(items, name) {
      for (let item of items) {
        if (item.name === name && item.request) return item;
        if (item.item) {
          const found = findReq(item.item, name);
          if (found) return found;
        }
      }
      return null;
    }
    
    const req = findReq(data.item || [], 'Open Shift');
    if (req && req.request) {
      req.request.body = {
        mode: "raw",
        raw: JSON.stringify({
          startingCash: 500000,
          notes: "Modal awal dari brankas"
        }, null, 2),
        options: {
          raw: { language: "json" }
        }
      };
      modified = true;
      console.log(`Updated Open Shift direct request in ${filename}`);
    }
  }

  if (modified) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  }
}

console.log("Postman Open Shift fixed successfully!");
