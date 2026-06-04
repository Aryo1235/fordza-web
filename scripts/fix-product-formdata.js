const fs = require('fs');
const path = require('path');

const collectionPath = path.join(__dirname, '../postman/Fordza-Complete.postman_collection.json');
const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

// Complete formdata template with images
const productFormDataSuccess = [
  { key: "productCode", value: "PROD-{{$randomInt}}", type: "text", description: "Kode unik produk" },
  { key: "name", value: "Sepatu Test {{$randomInt}}", type: "text", description: "Nama produk" },
  { key: "shortDescription", value: "Sepatu casual untuk pria", type: "text" },
  { key: "productType", value: "Sepatu", type: "text", description: "Sepatu, Sandal, Tas, dll" },
  { key: "gender", value: "Pria", type: "text", description: "Pria, Wanita, Unisex" },
  { key: "categoryIds", value: "{{category_id}}", type: "text", description: "Comma-separated category IDs" },
  { key: "description", value: "Deskripsi lengkap produk dengan detail material dan fitur", type: "text" },
  { key: "material", value: "Kulit Sintetis", type: "text" },
  { key: "outsole", value: "Rubber", type: "text" },
  { key: "insole", value: "EVA Foam", type: "text" },
  { key: "closureType", value: "Tali", type: "text" },
  { key: "origin", value: "Indonesia", type: "text" },
  { key: "notes", value: "Catatan tambahan", type: "text" },
  { key: "isPopular", value: "false", type: "text" },
  { key: "isBestseller", value: "false", type: "text" },
  { key: "isNew", value: "true", type: "text" },
  { key: "isActive", value: "true", type: "text" },
  { 
    key: "variants", 
    value: JSON.stringify([
      {
        colorName: "Hitam",
        colorHex: "#000000",
        imageFileIndex: 0,
        sizes: [
          { size: "39", stock: 10, price: 500000 },
          { size: "40", stock: 15, price: 500000 },
          { size: "41", stock: 12, price: 500000 }
        ]
      },
      {
        colorName: "Putih",
        colorHex: "#FFFFFF",
        imageFileIndex: 1,
        sizes: [
          { size: "39", stock: 8, price: 500000 },
          { size: "40", stock: 10, price: 500000 }
        ]
      }
    ]), 
    type: "text",
    description: "JSON array of variants with imageFileIndex"
  },
  { key: "images", value: "", type: "file", description: "Product main images (multiple files allowed)" },
  { key: "images", value: "", type: "file", description: "Product image 2 (optional)" },
  { key: "variant_images_0", value: "", type: "file", description: "Variant Hitam image" },
  { key: "variant_images_1", value: "", type: "file", description: "Variant Putih image" }
];

const productFormDataDuplicate = [
  { key: "productCode", value: "EXISTING-CODE", type: "text", description: "Use existing product code to trigger 409" },
  { key: "name", value: "Test Product", type: "text" },
  { key: "productType", value: "Sepatu", type: "text" },
  { key: "gender", value: "Pria", type: "text" },
  { key: "categoryIds", value: "{{category_id}}", type: "text" },
  { 
    key: "variants", 
    value: JSON.stringify([{
      colorName: "Hitam",
      colorHex: "#000000",
      sizes: [{ size: "40", stock: 10, price: 500000 }]
    }]), 
    type: "text"
  },
  { key: "images", value: "", type: "file", description: "Optional" }
];

const productFormDataValidation = [
  { key: "productCode", value: "", type: "text", description: "Empty - should error" },
  { key: "name", value: "", type: "text", description: "Empty - should error" },
  { key: "productType", value: "", type: "text", description: "Empty - should error" },
  { key: "gender", value: "Pria", type: "text" }
];

const productFormDataNoVariants = [
  { key: "productCode", value: "PROD-TEST", type: "text" },
  { key: "name", value: "Test Product", type: "text" },
  { key: "productType", value: "Sepatu", type: "text" },
  { key: "gender", value: "Pria", type: "text" },
  { key: "categoryIds", value: "{{category_id}}", type: "text" },
  { key: "variants", value: "[]", type: "text", description: "Empty array - should error" }
];

function findAndFixProductRequests(items) {
  items.forEach(item => {
    if (item.item) {
      // It's a folder
      findAndFixProductRequests(item.item);
    } else if (item.request) {
      // It's a request
      const url = item.request.url?.raw || '';
      const method = item.request.method;
      const name = item.name.toLowerCase();
      
      // Only fix POST /api/admin/products (not [id])
      if (url.includes('/api/admin/products') && method === 'POST' && !url.includes('[id]') && !url.includes('bulk')) {
        
        let formdata;
        if (name.includes('duplicate') || name.includes('409')) {
          formdata = productFormDataDuplicate;
        } else if (name.includes('validation') || name.includes('400')) {
          formdata = productFormDataValidation;
        } else if (name.includes('variant') && name.includes('empty')) {
          formdata = productFormDataNoVariants;
        } else if (name.includes('success') || name.includes('200')) {
          formdata = productFormDataSuccess;
        } else {
          // Default to success template
          formdata = productFormDataSuccess;
        }
        
        // Update request body
        item.request.body = {
          mode: "formdata",
          formdata: JSON.parse(JSON.stringify(formdata)) // Deep clone
        };
        
        // Remove Content-Type header (let Postman auto-set for multipart)
        if (item.request.header) {
          item.request.header = item.request.header.filter(h => 
            h.key.toLowerCase() !== 'content-type'
          );
        }
        
        // Update example responses
        if (item.response) {
          item.response.forEach(response => {
            if (response.originalRequest && response.originalRequest.body) {
              response.originalRequest.body = {
                mode: "formdata",
                formdata: JSON.parse(JSON.stringify(formdata))
              };
            }
          });
        }
        
        console.log(`✅ Fixed: ${item.name}`);
      }
    }
  });
}

console.log('🔧 Fixing product creation requests with proper formdata...\n');
findAndFixProductRequests(collection.item);

// Update collection version
collection.info.description = collection.info.description.replace(/Version: [\d.]+/, 'Version: 3.1.1');
collection.info.description = collection.info.description.replace(/Last Updated: [\d-]+/, `Last Updated: ${new Date().toISOString().split('T')[0]}`);

// Save
fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
console.log('\n✅ Collection updated successfully!');
console.log(`📁 Saved to: ${collectionPath}`);
console.log('\n📝 FormData fields added:');
console.log('   - images (file) - Product main images');
console.log('   - variant_images_0 (file) - Variant 1 image');
console.log('   - variant_images_1 (file) - Variant 2 image');
console.log('   - variants (JSON) - With imageFileIndex field');
