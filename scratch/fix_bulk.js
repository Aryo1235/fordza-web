const fs = require('fs');
const path = 'postman/Fordza API - Complete Collection v3.postman_collection.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

let modified = false;

function fixBulkJson(item) {
  if (item.request && item.request.body && item.request.body.mode === 'raw') {
     const urlStr = typeof item.request.url === 'string' ? item.request.url : (item.request.url?.raw || '');
     if (urlStr.includes('bulk-import')) {
        item.request.body.options = { raw: { language: 'json' } };
        item.request.body.raw = JSON.stringify([
          {
            productCode: 'FRD-M-001',
            name: 'Sepatu Kulit Asli',
            shortDescription: 'Sepatu pantofel premium',
            description: 'Sepatu kulit asli buatan Garut',
            material: 'Kulit Sapi Asli',
            productType: 'shoes',
            gender: 'Man',
            isPopular: false,
            isBestseller: false,
            isNew: true,
            categoryIds: ['Sepatu Casual'],
            sizeTemplateId: 'Template Sepatu Pria',
            variants: [
              {
                color: 'Hitam',
                basePrice: 550000,
                skus: [
                  { size: '40', stock: 10 },
                  { size: '41', stock: 15 }
                ]
              }
            ]
          }
        ], null, 2);
        modified = true;
     } else if (urlStr.includes('bulk-stock')) {
        item.request.body.options = { raw: { language: 'json' } };
        item.request.body.raw = JSON.stringify({
          items: [
            { id: '<isi_dengan_id_sku_atau_produk>', stock: 50 },
            { id: '<isi_dengan_id_sku_atau_produk_2>', stock: 25 }
          ]
        }, null, 2);
        modified = true;
     }
  }
  if (item.item) item.item.forEach(fixBulkJson);
}

fixBulkJson(data);

if (modified) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
  console.log('Fixed Bulk Endpoints to JSON in Postman.');
}
