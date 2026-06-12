const fs = require('fs');

const files = [
  'postman/Fordza-Complete.postman_collection.json',
  'postman/Fordza-API.postman_collection.json'
];

for (const f of files) {
  if (!fs.existsSync(f)) continue;

  let raw = fs.readFileSync(f, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch(e) {
    console.log('Error parsing', f);
    continue;
  }

  let modified = false;

  function processItem(item) {
    if (item.request && item.request.method === 'POST') {
      const urlStr = typeof item.request.url === 'string' ? item.request.url : (item.request.url?.raw || '');
      
      // Target the create product endpoints
      if (urlStr.includes('/api/admin/products') && !urlStr.includes('/variants')) {
        if (item.request.body && item.request.body.formdata) {
          
          // Fix sizeTemplateId
          const hasSizeTemplate = item.request.body.formdata.some(x => x.key === 'sizeTemplateId');
          if (!hasSizeTemplate) {
            item.request.body.formdata.push({
              key: 'sizeTemplateId',
              value: '{{size_template_id}}', // using Postman variable placeholder
              type: 'text'
            });
            modified = true;
            console.log('Added sizeTemplateId to', item.name);
          }

          // Ensure productType is valid
          const ptField = item.request.body.formdata.find(x => x.key === 'productType');
          if (ptField && ptField.value === 'Shoes') {
            ptField.value = 'shoes'; // must be lowercase
            modified = true;
            console.log('Fixed productType to lowercase in', item.name);
          }

        }
      }
    }

    if (item.item) {
      item.item.forEach(processItem);
    }
  }

  processItem(data);

  if (modified) {
    fs.writeFileSync(f, JSON.stringify(data, null, 2));
    console.log('Saved changes to', f);
  }
}
