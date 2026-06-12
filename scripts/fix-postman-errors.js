const fs = require('fs');
const path = require('path');

const collectionPath = path.join(__dirname, '../postman/Fordza-Complete.postman_collection.json');
const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

// Standard error response templates
const errorTemplates = {
  validation: (message = "Data tidak valid", errors = {}) => ({
    success: false,
    message,
    code: "VALIDATION_ERROR",
    errors,
    traceId: "req_example123"
  }),
  
  duplicate: (message = "Data sudah ada dalam sistem", field = null) => ({
    success: false,
    message,
    code: "DUPLICATE_ENTRY",
    ...(field && { field }),
    traceId: "req_example123"
  }),
  
  notFound: (message = "Data tidak ditemukan") => ({
    success: false,
    message,
    code: "NOT_FOUND",
    traceId: "req_example123"
  }),
  
  unauthorized: (message = "Unauthorized") => ({
    success: false,
    message,
    code: "UNAUTHORIZED",
    traceId: "req_example123"
  }),
  
  forbidden: (message = "Forbidden") => ({
    success: false,
    message,
    code: "FORBIDDEN",
    traceId: "req_example123"
  }),
  
  serverError: (message = "Terjadi kesalahan pada server") => ({
    success: false,
    message,
    code: "INTERNAL_SERVER_ERROR",
    traceId: "req_example123"
  })
};

// Product-specific error examples
const productErrors = {
  duplicateCode: {
    name: "409 Duplicate Product Code",
    status: "Conflict",
    code: 409,
    body: JSON.stringify(errorTemplates.duplicate("Kode produk sudah digunakan", "productCode"), null, 2),
    request: {
      body: {
        mode: "formdata",
        formdata: [
          { key: "productCode", value: "EXISTING-CODE", type: "text" },
          { key: "name", value: "Test Product", type: "text" },
          { key: "productType", value: "Sepatu", type: "text" },
          { key: "gender", value: "Pria", type: "text" },
          { key: "categoryIds", value: "cat-id-1", type: "text" },
          { key: "variants", value: JSON.stringify([{
            colorName: "Hitam",
            colorHex: "#000000",
            sizes: [{ size: "40", stock: 10, price: 500000 }]
          }]), type: "text" }
        ]
      }
    }
  },
  
  validationError: {
    name: "400 Validation Error",
    status: "Bad Request",
    code: 400,
    body: JSON.stringify(errorTemplates.validation("Data produk tidak valid", {
      productCode: ["Kode produk wajib diisi"],
      name: ["Nama produk wajib diisi"],
      variants: ["Minimal 1 varian wajib ditambahkan"]
    }), null, 2),
    request: {
      body: {
        mode: "formdata",
        formdata: [
          { key: "productCode", value: "", type: "text" },
          { key: "name", value: "", type: "text" }
        ]
      }
    }
  },
  
  notFound: {
    name: "404 Product Not Found",
    status: "Not Found",
    code: 404,
    body: JSON.stringify(errorTemplates.notFound("Produk tidak ditemukan"), null, 2)
  }
};

// Function to add error examples to a request
function addErrorExamples(item, errorTypes = []) {
  if (!item.response) item.response = [];
  
  errorTypes.forEach(errorType => {
    const errorExample = productErrors[errorType];
    if (!errorExample) return;
    
    const existingIndex = item.response.findIndex(r => r.name === errorExample.name);
    
    const example = {
      name: errorExample.name,
      originalRequest: {
        method: item.request.method,
        header: item.request.header || [],
        body: errorExample.request?.body || item.request.body,
        url: item.request.url
      },
      status: errorExample.status,
      code: errorExample.code,
      _postman_previewlanguage: "json",
      header: [
        { key: "Content-Type", value: "application/json" },
        { key: "x-request-id", value: "req_example123" }
      ],
      cookie: [],
      body: errorExample.body
    };
    
    if (existingIndex >= 0) {
      item.response[existingIndex] = example;
    } else {
      item.response.push(example);
    }
  });
}

// Recursive function to process all items
function processItems(items) {
  items.forEach(item => {
    if (item.item) {
      // It's a folder
      processItems(item.item);
    } else if (item.request) {
      // It's a request
      const url = item.request.url.raw || '';
      const method = item.request.method;
      
      // Products endpoints
      if (url.includes('/api/admin/products')) {
        if (method === 'POST' && !url.includes('[id]')) {
          addErrorExamples(item, ['validationError', 'duplicateCode']);
        } else if (method === 'PUT' && url.includes('[id]')) {
          addErrorExamples(item, ['validationError', 'duplicateCode', 'notFound']);
        } else if (method === 'GET' && url.includes('[id]')) {
          addErrorExamples(item, ['notFound']);
        } else if (method === 'DELETE') {
          addErrorExamples(item, ['notFound']);
        }
      }
      
      // Add standard 401 for authenticated endpoints
      if (url.includes('/api/admin/') && !url.includes('/auth/login')) {
        if (!item.response) item.response = [];
        const has401 = item.response.some(r => r.code === 401);
        if (!has401) {
          item.response.push({
            name: "401 Unauthorized",
            originalRequest: {
              method: item.request.method,
              header: [],
              body: item.request.body,
              url: item.request.url
            },
            status: "Unauthorized",
            code: 401,
            _postman_previewlanguage: "json",
            header: [
              { key: "Content-Type", value: "application/json" }
            ],
            cookie: [],
            body: JSON.stringify(errorTemplates.unauthorized("Token tidak valid atau sudah expired"), null, 2)
          });
        }
      }
    }
  });
}

// Process the collection
console.log('🔧 Fixing Postman collection error responses...');
processItems(collection.item);

// Update collection info
collection.info.description = `🚀 COMPLETE API Collection untuk Fordza-Web

✅ 200+ requests
✅ Proper error responses (400, 401, 404, 409, 500)
✅ Example responses di setiap request
✅ Nested folder structure
✅ Auto-save tokens & IDs

Version: 3.1.0
Last Updated: ${new Date().toISOString().split('T')[0]}`;

// Save the updated collection
fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
console.log('✅ Collection updated successfully!');
console.log(`📁 Saved to: ${collectionPath}`);
