// Script to generate complete Postman collection
// Run: node scripts/generate-postman-collection.js

const fs = require('fs');
const path = require('path');

const collection = {
  info: {
    name: "Fordza API - Complete Collection",
    description: "Complete API collection for Fordza-Web E-Commerce & POS System\n\nIncludes:\n- All endpoints (Auth, Products, Categories, Banners, POS, Public, etc.)\n- Error scenarios (401, 400, 404, 429, 403, 409)\n- Auto-save tokens\n- Test scripts\n- Example responses\n\nVersion: 2.0.0\nLast Updated: 2026-05-20",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  auth: {
    type: "bearer",
    bearer: [{ key: "token", value: "{{access_token}}", type: "string" }]
  },
  item: []
};

// Helper functions
const createSuccessTest = (statusCode = 200) => ({
  listen: "test",
  script: {
    exec: [
      `pm.test('Status code is ${statusCode}', function () {`,
      `    pm.response.to.have.status(${statusCode});`,
      `});`,
      ``,
      `pm.test('Response has success true', function () {`,
      `    const response = pm.response.json();`,
      `    pm.expect(response.success).to.be.true;`,
      `});`
    ]
  }
});

const createErrorTest = (statusCode, errorMessage = null) => ({
  listen: "test",
  script: {
    exec: [
      `pm.test('Status code is ${statusCode}', function () {`,
      `    pm.response.to.have.status(${statusCode});`,
      `});`,
      ``,
      `pm.test('Response has success false', function () {`,
      `    const response = pm.response.json();`,
      `    pm.expect(response.success).to.be.false;`,
      `});`,
      ...(errorMessage ? [
        ``,
        `pm.test('Response contains error message', function () {`,
        `    const response = pm.response.json();`,
        `    pm.expect(response.message).to.include('${errorMessage}');`,
        `});`
      ] : [])
    ]
  }
});

const createRequest = (name, method, path, body = null, auth = true, description = "") => {
  const request = {
    name,
    request: {
      method,
      header: method !== "GET" ? [{ key: "Content-Type", value: "application/json" }] : [],
      url: {
        raw: `{{base_url}}${path}`,
        host: ["{{base_url}}"],
        path: path.split('/').filter(p => p)
      },
      description
    }
  };

  if (!auth) {
    request.request.auth = { type: "noauth" };
  }

  if (body) {
    request.request.body = {
      mode: "raw",
      raw: JSON.stringify(body, null, 2)
    };
  }

  return request;
};

// AUTH FOLDER
const authFolder = {
  name: "🔐 Auth",
  item: [
    {
      ...createRequest("✅ Login (Success)", "POST", "/api/admin/auth/login", {
        username: "{{admin_username}}",
        password: "{{admin_password}}"
      }, false, "Login dengan credentials admin default.\n\n**Success Response (200):**\n```json\n{\n  \"success\": true,\n  \"data\": {\n    \"id\": \"...\",\n    \"username\": \"admin\",\n    \"role\": \"ADMIN\",\n    \"accessToken\": \"...\",\n    \"refreshToken\": \"...\"\n  }\n}\n```"),
      event: [{
        listen: "test",
        script: {
          exec: [
            "pm.test('Status code is 200', function () {",
            "    pm.response.to.have.status(200);",
            "});",
            "",
            "pm.test('Response contains tokens', function () {",
            "    const response = pm.response.json();",
            "    pm.expect(response.data).to.have.property('accessToken');",
            "    pm.expect(response.data).to.have.property('refreshToken');",
            "});",
            "",
            "// Auto-save tokens",
            "if (pm.response.code === 200) {",
            "    const response = pm.response.json();",
            "    pm.environment.set('access_token', response.data.accessToken);",
            "    pm.environment.set('refresh_token', response.data.refreshToken);",
            "    pm.environment.set('user_id', response.data.id);",
            "    pm.environment.set('user_role', response.data.role);",
            "    console.log('✅ Tokens saved to environment');",
            "}"
          ]
        }
      }]
    },
    {
      ...createRequest("❌ Login (Invalid Credentials)", "POST", "/api/admin/auth/login", {
        username: "admin",
        password: "wrongpassword"
      }, false, "Test error: Invalid credentials\n\n**Error Response (401):**\n```json\n{\n  \"success\": false,\n  \"message\": \"Username atau password salah\"\n}\n```"),
      event: [createErrorTest(401, "Username atau password salah")]
    },
    {
      ...createRequest("❌ Login (Validation Error)", "POST", "/api/admin/auth/login", {
        username: "",
        password: ""
      }, false, "Test error: Empty fields"),
      event: [createErrorTest(400)]
    },
    {
      ...createRequest("✅ Refresh Token", "POST", "/api/admin/auth/refresh", {
        refreshToken: "{{refresh_token}}"
      }, false),
      event: [{
        listen: "test",
        script: {
          exec: [
            "pm.test('Status code is 200', function () {",
            "    pm.response.to.have.status(200);",
            "});",
            "",
            "if (pm.response.code === 200) {",
            "    const response = pm.response.json();",
            "    pm.environment.set('access_token', response.data.accessToken);",
            "    console.log('✅ New access token saved');",
            "}"
          ]
        }
      }]
    },
    {
      ...createRequest("✅ Get Me", "GET", "/api/admin/auth/me"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("❌ Get Me (Unauthorized)", "GET", "/api/admin/auth/me", null, false),
      event: [createErrorTest(401)]
    },
    {
      ...createRequest("✅ Logout", "POST", "/api/admin/auth/logout"),
      event: [{
        listen: "test",
        script: {
          exec: [
            "pm.test('Status code is 200', function () {",
            "    pm.response.to.have.status(200);",
            "});",
            "",
            "if (pm.response.code === 200) {",
            "    pm.environment.set('access_token', '');",
            "    pm.environment.set('refresh_token', '');",
            "    console.log('✅ Tokens cleared');",
            "}"
          ]
        }
      }]
    }
  ]
};

// HEALTH FOLDER
const healthFolder = {
  name: "🏥 Health",
  item: [
    {
      ...createRequest("✅ Health Check", "GET", "/api/health", null, false, "Health check endpoint untuk monitoring"),
      event: [{
        listen: "test",
        script: {
          exec: [
            "pm.test('Status code is 200', function () {",
            "    pm.response.to.have.status(200);",
            "});",
            "",
            "pm.test('Application is healthy', function () {",
            "    const response = pm.response.json();",
            "    pm.expect(response.status).to.eql('healthy');",
            "    pm.expect(response.database).to.eql('connected');",
            "});"
          ]
        }
      }]
    }
  ]
};

// PRODUCTS FOLDER
const productsFolder = {
  name: "📦 Products (Admin)",
  item: [
    {
      ...createRequest("✅ List Products", "GET", "/api/admin/products?page=1&limit=10", null, true, "List semua produk dengan pagination"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ List Products (With Search)", "GET", "/api/admin/products?search=oxford&page=1&limit=10"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Get Product by ID", "GET", "/api/admin/products/{{product_id}}"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("❌ Get Product (Not Found)", "GET", "/api/admin/products/invalid-id-123"),
      event: [createErrorTest(404)]
    },
    {
      ...createRequest("❌ List Products (Unauthorized)", "GET", "/api/admin/products", null, false),
      event: [createErrorTest(401)]
    }
  ]
};

// CATEGORIES FOLDER
const categoriesFolder = {
  name: "🎨 Categories (Admin)",
  item: [
    {
      ...createRequest("✅ List Categories", "GET", "/api/admin/categories"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Get Category by ID", "GET", "/api/admin/categories/{{category_id}}"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("❌ Get Category (Not Found)", "GET", "/api/admin/categories/invalid-id"),
      event: [createErrorTest(404)]
    },
    {
      ...createRequest("❌ List Categories (Unauthorized)", "GET", "/api/admin/categories", null, false),
      event: [createErrorTest(401)]
    }
  ]
};

// BANNERS FOLDER
const bannersFolder = {
  name: "🖼️ Banners (Admin)",
  item: [
    {
      ...createRequest("✅ List Banners", "GET", "/api/admin/banners"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Get Banner by ID", "GET", "/api/admin/banners/{{banner_id}}"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("❌ Get Banner (Not Found)", "GET", "/api/admin/banners/invalid-id"),
      event: [createErrorTest(404)]
    }
  ]
};

// TESTIMONIALS FOLDER
const testimonialsFolder = {
  name: "💬 Testimonials (Admin)",
  item: [
    {
      ...createRequest("✅ List Testimonials", "GET", "/api/admin/testimonials"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ List Testimonials (By Product)", "GET", "/api/admin/testimonials?productId={{product_id}}"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Create Testimonial", "POST", "/api/admin/testimonials", {
        productId: "{{product_id}}",
        customerName: "John Doe",
        rating: 5,
        content: "Produk sangat bagus!",
        isActive: true
      }),
      event: [createSuccessTest(201)]
    },
    {
      ...createRequest("❌ Create Testimonial (Validation Error)", "POST", "/api/admin/testimonials", {
        productId: "",
        customerName: "",
        rating: 0
      }),
      event: [createErrorTest(400)]
    }
  ]
};

// SIZE TEMPLATES FOLDER
const sizeTemplatesFolder = {
  name: "📏 Size Templates (Admin)",
  item: [
    {
      ...createRequest("✅ List Size Templates", "GET", "/api/admin/size-templates"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Get Size Template by ID", "GET", "/api/admin/size-templates/{{size_template_id}}"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Create Size Template", "POST", "/api/admin/size-templates", {
        name: "EU Size",
        type: "shoes",
        sizes: ["39", "40", "41"],
        measurements: {
          "39": { "insoleLength": "25", "insoleWidth": "9" },
          "40": { "insoleLength": "26", "insoleWidth": "9.5" },
          "41": { "insoleLength": "27", "insoleWidth": "10" }
        }
      }),
      event: [createSuccessTest(201)]
    }
  ]
};

// PROMO FOLDER
const promoFolder = {
  name: "🎁 Promo (Admin)",
  item: [
    {
      ...createRequest("✅ List Promos", "GET", "/api/admin/promo"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Get Promo by ID", "GET", "/api/admin/promo/{{promo_id}}"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Create Promo (Global)", "POST", "/api/admin/promo", {
        name: "Diskon 20% Semua Produk",
        description: "Promo akhir tahun",
        type: "PERCENTAGE",
        value: 20,
        targetType: "GLOBAL",
        targetIds: [],
        minPurchase: 0,
        isActive: true,
        startDate: "2026-05-01T00:00:00.000Z",
        endDate: "2026-12-31T23:59:59.000Z"
      }),
      event: [createSuccessTest(201)]
    },
    {
      ...createRequest("❌ Create Promo (Validation Error)", "POST", "/api/admin/promo", {
        name: "",
        type: "INVALID_TYPE"
      }),
      event: [createErrorTest(400)]
    }
  ]
};

// USERS FOLDER
const usersFolder = {
  name: "👥 Users (Admin)",
  item: [
    {
      ...createRequest("✅ List Users", "GET", "/api/admin/users"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ List Cashiers", "GET", "/api/admin/cashiers"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Create User (Kasir)", "POST", "/api/admin/users", {
        username: "kasir1",
        password: "password123",
        name: "Kasir Satu",
        role: "KASIR",
        pin: "1234"
      }),
      event: [createSuccessTest(201)]
    },
    {
      ...createRequest("❌ Create User (Duplicate Username)", "POST", "/api/admin/users", {
        username: "admin",
        password: "password123",
        role: "ADMIN"
      }),
      event: [createErrorTest(409)]
    }
  ]
};

// STOCK MANAGEMENT FOLDER
const stockFolder = {
  name: "📊 Stock Management (Admin)",
  item: [
    {
      ...createRequest("✅ Get Stock Logs", "GET", "/api/admin/stock/logs?page=1&limit=20"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Get Stock Logs (By Product)", "GET", "/api/admin/stock/logs?productId={{product_id}}"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Get SKU Stock Logs", "GET", "/api/admin/stock/logs/sku?page=1&limit=20"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Export Stock Logs", "GET", "/api/admin/stock/logs/export"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Export SKU Stock Logs", "GET", "/api/admin/stock/logs/sku/export"),
      event: [createSuccessTest()]
    }
  ]
};

// REPORTS FOLDER
const reportsFolder = {
  name: "📈 Reports (Admin)",
  item: [
    {
      ...createRequest("✅ Sales Summary", "GET", "/api/admin/reports"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Sales Summary (Date Range)", "GET", "/api/admin/reports?startDate=2026-05-01&endDate=2026-05-20"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Sales by Items", "GET", "/api/admin/reports/items?page=1&limit=20"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Export Summary", "GET", "/api/admin/reports/export/summary"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Export Items", "GET", "/api/admin/reports/export/items"),
      event: [createSuccessTest()]
    }
  ]
};

// SHIFTS FOLDER
const shiftsFolder = {
  name: "⏰ Shifts (Admin/Kasir)",
  item: [
    {
      ...createRequest("✅ Get Current Shift", "GET", "/api/admin/shifts/current"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Open Shift", "POST", "/api/admin/shifts/open", {
        startingCash: 500000
      }),
      event: [createSuccessTest(201)]
    },
    {
      ...createRequest("❌ Open Shift (Already Open)", "POST", "/api/admin/shifts/open", {
        startingCash: 500000
      }),
      event: [createErrorTest(409, "Shift sudah dibuka")]
    },
    {
      ...createRequest("✅ Close Shift", "POST", "/api/admin/shifts/close", {
        actualEndingCash: 5500000,
        notes: "Shift berjalan lancar"
      }),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("❌ Close Shift (No Open Shift)", "POST", "/api/admin/shifts/close", {
        actualEndingCash: 0
      }),
      event: [createErrorTest(400, "Tidak ada shift")]
    }
  ]
};

// POS/KASIR FOLDER
const posFolder = {
  name: "💳 POS/Kasir",
  item: [
    {
      ...createRequest("✅ List Products (POS)", "GET", "/api/kasir/products?page=1&limit=20"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ List Products (POS with Search)", "GET", "/api/kasir/products?search=oxford"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Checkout", "POST", "/api/kasir/transactions", {
        items: [
          {
            productId: "{{product_id}}",
            variantId: "{{variant_id}}",
            skuId: "{{sku_id}}",
            quantity: 1,
            basePriceAtSale: 680000,
            discountAmount: 170000,
            gimmickPriceAtSale: null,
            promoName: "Diskon 20%"
          }
        ],
        totalPrice: 680000,
        amountPaid: 700000,
        change: 20000,
        customerName: "John Doe",
        customerPhone: "081234567890"
      }),
      event: [{
        listen: "test",
        script: {
          exec: [
            "pm.test('Status code is 201', function () {",
            "    pm.response.to.have.status(201);",
            "});",
            "",
            "if (pm.response.code === 201) {",
            "    const response = pm.response.json();",
            "    pm.environment.set('transaction_id', response.data.id);",
            "    console.log('✅ Transaction ID saved');",
            "}"
          ]
        }
      }]
    },
    {
      ...createRequest("❌ Checkout (No Open Shift)", "POST", "/api/kasir/transactions", {
        items: [],
        totalPrice: 0,
        amountPaid: 0,
        change: 0
      }),
      event: [createErrorTest(400, "shift")]
    },
    {
      ...createRequest("✅ List Transactions", "GET", "/api/kasir/transactions?page=1&limit=20"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Get Transaction by ID", "GET", "/api/kasir/transactions/{{transaction_id}}"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Verify Admin PIN", "POST", "/api/kasir/auth/verify-pin", {
        pin: "{{admin_pin}}"
      }),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("❌ Verify Admin PIN (Invalid)", "POST", "/api/kasir/auth/verify-pin", {
        pin: "9999"
      }),
      event: [createErrorTest(401, "PIN salah")]
    },
    {
      ...createRequest("✅ Void Transaction", "PATCH", "/api/kasir/transactions/{{transaction_id}}", {
        adminPin: "{{admin_pin}}",
        cancelReason: "Salah input"
      }),
      event: [createSuccessTest()]
    }
  ]
};

// TRANSACTIONS FOLDER
const transactionsFolder = {
  name: "🧾 Transactions (Admin)",
  item: [
    {
      ...createRequest("✅ List Transactions", "GET", "/api/admin/transactions?page=1&limit=20"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ List Transactions (By Status)", "GET", "/api/admin/transactions?status=PAID"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ List Transactions (By Kasir)", "GET", "/api/admin/transactions?kasirId={{user_id}}"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Get Transaction by ID", "GET", "/api/admin/transactions/{{transaction_id}}"),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Export Transactions", "GET", "/api/admin/transactions/export"),
      event: [createSuccessTest()]
    }
  ]
};

// PUBLIC API FOLDER
const publicFolder = {
  name: "🌐 Public API",
  item: [
    {
      ...createRequest("✅ List Products (Public)", "GET", "/api/public/products?page=1&limit=12", null, false),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ List Products (With Filters)", "GET", "/api/public/products?gender=Man&sortBy=cheapest&page=1&limit=12", null, false),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Get Product Detail (Public)", "GET", "/api/public/products/{{product_id}}", null, false),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("❌ Get Product (Not Found)", "GET", "/api/public/products/invalid-id", null, false),
      event: [createErrorTest(404)]
    },
    {
      ...createRequest("✅ List Categories (Public)", "GET", "/api/public/categories", null, false),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ List Banners (Public)", "GET", "/api/public/banners", null, false),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ List Testimonials (Public)", "GET", "/api/public/testimonials", null, false),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ List Size Templates (Public)", "GET", "/api/public/size-templates", null, false),
      event: [createSuccessTest()]
    },
    {
      ...createRequest("✅ Get Recommendations", "GET", "/api/recommend/{{product_id}}", null, false),
      event: [createSuccessTest()]
    }
  ]
};

// Add all folders to collection
collection.item.push(authFolder);
collection.item.push(healthFolder);
collection.item.push(productsFolder);
collection.item.push(categoriesFolder);
collection.item.push(bannersFolder);
collection.item.push(testimonialsFolder);
collection.item.push(sizeTemplatesFolder);
collection.item.push(promoFolder);
collection.item.push(usersFolder);
collection.item.push(stockFolder);
collection.item.push(reportsFolder);
collection.item.push(shiftsFolder);
collection.item.push(posFolder);
collection.item.push(transactionsFolder);
collection.item.push(publicFolder);

// Write to file
const outputPath = path.join(__dirname, '..', 'postman', 'Fordza-Complete.postman_collection.json');
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));

console.log('✅ Postman collection generated successfully!');
console.log(`📁 File: ${outputPath}`);
console.log(`📊 Total folders: ${collection.item.length}`);
console.log(`📊 Total requests: ${collection.item.reduce((sum, folder) => sum + folder.item.length, 0)}`);
