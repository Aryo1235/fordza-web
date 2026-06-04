const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../postman/Fordza API - Complete Collection v3.postman_collection.json');
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

// Find Admin Folder
const adminFolder = data.item.find(i => i.name === 'Admin API' || i.name === 'Admin') || data;
const bannersFolder = (adminFolder.item || adminFolder).find(i => i.name === '🖼️ Banners (Admin)');

if (!bannersFolder) {
  console.log("Could not find Banners folder");
  process.exit(1);
}

const createReq = bannersFolder.item.find(i => i.name === 'Create Banner');
if (createReq) {
  createReq.request.body = {
    mode: "formdata",
    formdata: [
      { key: "title", value: "New Promo", type: "text" },
      { key: "linkUrl", value: "/products", type: "text" },
      { key: "image", type: "file", src: [] }
    ]
  };
  createReq.request.header = createReq.request.header.filter(h => h.key !== 'Content-Type');
}

const updateReq = bannersFolder.item.find(i => i.name === 'Update Banner');
if (updateReq) {
  updateReq.request.body = {
    mode: "formdata",
    formdata: [
      { key: "title", value: "Updated Promo", type: "text" },
      { key: "isActive", value: "true", type: "text" },
      { key: "image", type: "file", src: [] }
    ]
  };
  updateReq.request.header = updateReq.request.header.filter(h => h.key !== 'Content-Type');
}

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
console.log("Postman collection updated successfully!");
