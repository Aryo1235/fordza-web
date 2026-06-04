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
            productCode: 'FRD-GAGAL-01',
            name: 'Sepatu Gagal Karena Template',
            shortDescription: 'Pasti gagal',
            description: 'Pasti gagal',
            material: 'Kulit Sapi',
            productType: 'shoes',
            gender: 'Man',
            isPopular: false,
            isBestseller: false,
            isNew: true,
            categoryIds: ['Sepatu Casual'],
            sizeTemplateId: 'TEMPLATE ASAL ASALAN YANG PASTI GAGAL',
            variants: [
              {
                color: 'Hitam',
                basePrice: 550000,
                skus: [
                  { size: '40', stock: 10 }
                ]
              }
            ]
          },
          {
            productCode: 'FRD-SUKSES-02',
            name: 'Sepatu Sukses Masuk DB',
            shortDescription: 'Pasti sukses',
            description: 'Pasti sukses',
            material: 'Kulit Sapi',
            productType: 'shoes',
            gender: 'Man',
            isPopular: false,
            isBestseller: false,
            isNew: true,
            categoryIds: ['Sepatu Casual'],
            sizeTemplateId: 'Template Sepatu Pria (EU)',
            variants: [
              {
                color: 'Coklat',
                basePrice: 650000,
                skus: [
                  { size: '41', stock: 5 }
                ]
              }
            ]
          }
        ], null, 2);
        modified = true;
     }
  }
  if (item.item) item.item.forEach(fixBulkJson);
}

fixBulkJson(data);

if (modified) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
  console.log('Fixed Bulk Endpoints with 2 products in Postman.');
}
