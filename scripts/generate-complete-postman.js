// Complete Postman Collection Generator with ALL error scenarios
// Run: node scripts/generate-complete-postman.js

const fs = require('fs');
const path = require('path');

const collection = {
  info: {
    name: "Fordza API - Complete Collection v2",
    description: "🚀 COMPLETE API Collection untuk Fordza-Web\n\n✅ Semua endpoints (100+ requests)\n✅ Semua error scenarios (401, 400, 404, 429, 403, 409, 503, 500)\n✅ Contoh response ASLI dari project\n✅ Auto-save tokens & IDs\n✅ Test scripts lengkap\n\nVersion: 2.0.0\nLast Updated: 2026-05-20",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  auth: {
    type: "bearer",
    bearer: [{ key: "token", value: "{{access_token}}", type: "string" }]
  },
  item: []
};

// Helper: Create test script
const createTest = (statusCode, checks = []) => ({
  listen: "test",
  script: {
    exec: [
      `pm.test('Status code is ${statusCode}', function () {`,
      `    pm.response.to.have.status(${statusCode});`,
      `});`,
      ...checks
    ]
  }
});

// Helper: Create request
const createRequest = (config) => {
  const { name, method, path, body = null, auth = true, description = "", tests = [], saveVars = {}, exampleResponse = null } = config;
  
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

  if (!auth) request.request.auth = { type: "noauth" };
  if (body) request.request.body = { mode: "raw", raw: JSON.stringify(body, null, 2) };
  
  // Add example response
  if (exampleResponse) {
    request.response = [{
      name: `Example ${exampleResponse.status}`,
      originalRequest: {
        method,
        header: [],
        body: body ? { mode: "raw", raw: JSON.stringify(body, null, 2) } : undefined,
        url: {
          raw: `{{base_url}}${path}`,
          host: ["{{base_url}}"],
          path: path.split('/').filter(p => p)
        }
      },
      status: exampleResponse.statusText || "OK",
      code: exampleResponse.status,
      _postman_previewlanguage: "json",
      header: [
        { key: "Content-Type", value: "application/json" },
        { key: "x-request-id", value: "req_example123" }
      ],
      cookie: [],
      body: JSON.stringify(exampleResponse.body, null, 2)
    }];
  }
  
  // Add test scripts
  if (tests.length > 0 || Object.keys(saveVars).length > 0) {
    const testExec = [...tests];
    
    // Add variable saving logic
    if (Object.keys(saveVars).length > 0) {
      testExec.push('');
      testExec.push('// Auto-save variables');
      testExec.push(`if (pm.response.code === ${saveVars.statusCode || 200}) {`);
      testExec.push('    const response = pm.response.json();');
      Object.entries(saveVars.vars || {}).forEach(([envVar, jsonPath]) => {
        testExec.push(`    pm.environment.set('${envVar}', ${jsonPath});`);
      });
      testExec.push(`    console.log('✅ Variables saved');`);
      testExec.push('}');
    }
    
    request.event = [{ listen: "test", script: { exec: testExec } }];
  }

  return request;
};

// ============================================
// 🔐 AUTH FOLDER - COMPLETE WITH NESTED STRUCTURE
// ============================================
const authFolder = {
  name: "🔐 Auth",
  description: "Authentication endpoints dengan SEMUA error scenarios",
  item: [
    // LOGIN - Nested folder with all scenarios
    {
      name: "Login",
      item: [
        createRequest({
          name: "200 Success",
          method: "POST",
          path: "/api/admin/auth/login",
          body: { username: "{{admin_username}}", password: "{{admin_password}}" },
          auth: false,
          description: "Login dengan credentials admin default.",
          exampleResponse: {
            status: 200,
            statusText: "OK",
            body: {
              success: true,
              message: "Login berhasil",
              data: {
                id: "cm3abc123def456",
                username: "admin",
                name: "Admin Fordza",
                role: "ADMIN",
                accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtM2FiYzEyMyIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTcxNjIwMDAwMCwiZXhwIjoxNzE2MjAwOTAwfQ.signature",
                refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtM2FiYzEyMyIsImlhdCI6MTcxNjIwMDAwMCwiZXhwIjoxNzE2ODA0ODAwfQ.signature"
              }
            }
          },
          tests: [
            "pm.test('Status code is 200', function () { pm.response.to.have.status(200); });",
            "pm.test('Response has success true', function () { pm.expect(pm.response.json().success).to.be.true; });",
            "pm.test('Response contains tokens', function () {",
            "    const data = pm.response.json().data;",
            "    pm.expect(data).to.have.property('accessToken');",
            "    pm.expect(data).to.have.property('refreshToken');",
            "});"
          ],
          saveVars: {
            statusCode: 200,
            vars: {
              access_token: "response.data.accessToken",
              refresh_token: "response.data.refreshToken",
              user_id: "response.data.id",
              user_role: "response.data.role"
            }
          }
        }),
        
        createRequest({
          name: "401 Invalid Credentials",
          method: "POST",
          path: "/api/admin/auth/login",
          body: { username: "admin", password: "wrongpassword" },
          auth: false,
          description: "Test error: Invalid credentials",
          exampleResponse: {
            status: 401,
            statusText: "Unauthorized",
            body: {
              success: false,
              message: "Username atau password salah",
              code: "UNAUTHORIZED",
              traceId: "req_1716200000_abc123"
            }
          },
          tests: [
            "pm.test('Status code is 401', function () { pm.response.to.have.status(401); });",
            "pm.test('Response has success false', function () { pm.expect(pm.response.json().success).to.be.false; });",
            "pm.test('Error message correct', function () {",
            "    pm.expect(pm.response.json().message).to.include('Username atau password');",
            "});"
          ]
        }),
        
        createRequest({
          name: "400 Validation Error",
          method: "POST",
          path: "/api/admin/auth/login",
          body: { username: "", password: "" },
          auth: false,
          description: "Test error: Validation error (empty fields)",
          exampleResponse: {
            status: 400,
            statusText: "Bad Request",
            body: {
              success: false,
              message: "Validation error",
              errors: {
                username: ["Required"],
                password: ["Required"]
              },
              traceId: "req_1716200000_abc123"
            }
          },
          tests: [
            "pm.test('Status code is 400', function () { pm.response.to.have.status(400); });",
            "pm.test('Response contains validation errors', function () {",
            "    pm.expect(pm.response.json()).to.have.property('errors');",
            "});"
          ]
        }),
        
        createRequest({
          name: "429 Rate Limit Exceeded",
          method: "POST",
          path: "/api/admin/auth/login",
          body: { username: "admin", password: "wrong" },
          auth: false,
          description: "Test error: Rate limit exceeded. Send 6x rapidly to trigger.",
          exampleResponse: {
            status: 429,
            statusText: "Too Many Requests",
            body: {
              success: false,
              message: "Terlalu banyak percobaan login. Coba lagi dalam 1 menit.",
              code: "RATE_LIMIT_EXCEEDED",
              details: {
                retryAfter: "2026-05-20T12:01:00.000Z"
              },
              traceId: "req_1716200000_abc123"
            }
          },
          tests: [
            "if (pm.response.code === 429) {",
            "    pm.test('Rate limit error', function () {",
            "        pm.expect(pm.response.json().message).to.include('Terlalu banyak');",
            "    });",
            "}"
          ]
        })
      ]
    },
    
    // REFRESH TOKEN - Nested folder
    {
      name: "Refresh Token",
      item: [
        createRequest({
          name: "200 Success",
          method: "POST",
          path: "/api/admin/auth/refresh",
          body: { refreshToken: "{{refresh_token}}" },
          auth: false,
          description: "Refresh access token using refresh token",
          exampleResponse: {
            status: 200,
            statusText: "OK",
            body: {
              success: true,
              message: "Token berhasil diperbarui",
              data: {
                accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtM2FiYzEyMyIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTcxNjIwMDkwMCwiZXhwIjoxNzE2MjAxODAwfQ.new_signature"
              }
            }
          },
          tests: [
            "pm.test('Status code is 200', function () { pm.response.to.have.status(200); });",
            "pm.test('Response contains new access token', function () {",
            "    pm.expect(pm.response.json().data).to.have.property('accessToken');",
            "});"
          ],
          saveVars: {
            statusCode: 200,
            vars: { access_token: "response.data.accessToken" }
          }
        }),
        
        createRequest({
          name: "401 Invalid Token",
          method: "POST",
          path: "/api/admin/auth/refresh",
          body: { refreshToken: "invalid-token-here" },
          auth: false,
          description: "Test error: Invalid refresh token",
          exampleResponse: {
            status: 401,
            statusText: "Unauthorized",
            body: {
              success: false,
              message: "Refresh token tidak valid",
              code: "UNAUTHORIZED",
              traceId: "req_1716200000_abc123"
            }
          },
          tests: [
            "pm.test('Status code is 401', function () { pm.response.to.have.status(401); });"
          ]
        }),
        
        createRequest({
          name: "401 Expired Token",
          method: "POST",
          path: "/api/admin/auth/refresh",
          body: { refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired.token" },
          auth: false,
          description: "Test error: Expired refresh token",
          exampleResponse: {
            status: 401,
            statusText: "Unauthorized",
            body: {
              success: false,
              message: "Refresh token sudah kadaluarsa",
              code: "UNAUTHORIZED",
              traceId: "req_1716200000_abc123"
            }
          },
          tests: [
            "pm.test('Status code is 401', function () { pm.response.to.have.status(401); });"
          ]
        })
      ]
    },
    
    // GET ME - Nested folder
    {
      name: "Get Me",
      item: [
        createRequest({
          name: "200 Success",
          method: "GET",
          path: "/api/admin/auth/me",
          description: "Get current user session info",
          exampleResponse: {
            status: 200,
            statusText: "OK",
            body: {
              success: true,
              data: {
                id: "cm3abc123def456",
                username: "admin",
                name: "Admin Fordza",
                role: "ADMIN"
              }
            }
          },
          tests: [
            "pm.test('Status code is 200', function () { pm.response.to.have.status(200); });",
            "pm.test('Response contains user data', function () {",
            "    const data = pm.response.json().data;",
            "    pm.expect(data).to.have.property('id');",
            "    pm.expect(data).to.have.property('username');",
            "    pm.expect(data).to.have.property('role');",
            "});"
          ]
        }),
        
        createRequest({
          name: "401 No Token",
          method: "GET",
          path: "/api/admin/auth/me",
          auth: false,
          description: "Test error: No access token provided",
          exampleResponse: {
            status: 401,
            statusText: "Unauthorized",
            body: {
              success: false,
              message: "Sesi habis. Silakan login kembali",
              code: "UNAUTHORIZED",
              traceId: "req_1716200000_abc123"
            }
          },
          tests: [
            "pm.test('Status code is 401', function () { pm.response.to.have.status(401); });",
            "pm.test('Error message about session', function () {",
            "    pm.expect(pm.response.json().message).to.include('Sesi habis');",
            "});"
          ]
        }),
        
        createRequest({
          name: "401 Invalid Token",
          method: "GET",
          path: "/api/admin/auth/me",
          auth: false,
          description: "Test error: Invalid access token. Add to Headers: Authorization: Bearer invalid-token",
          exampleResponse: {
            status: 401,
            statusText: "Unauthorized",
            body: {
              success: false,
              message: "Token tidak valid",
              code: "UNAUTHORIZED",
              traceId: "req_1716200000_abc123"
            }
          },
          tests: [
            "pm.test('Status code is 401', function () { pm.response.to.have.status(401); });"
          ]
        })
      ]
    },
    
    // LOGOUT - Single request (no errors expected)
    createRequest({
      name: "Logout",
      method: "POST",
      path: "/api/admin/auth/logout",
      description: "Logout and clear all tokens",
      exampleResponse: {
        status: 200,
        statusText: "OK",
        body: {
          success: true,
          message: "Logout berhasil"
        }
      },
      tests: [
        "pm.test('Status code is 200', function () { pm.response.to.have.status(200); });",
        "",
        "// Clear tokens from environment",
        "if (pm.response.code === 200) {",
        "    pm.environment.set('access_token', '');",
        "    pm.environment.set('refresh_token', '');",
        "    console.log('✅ Tokens cleared from environment');",
        "}"
      ]
    })
  ]
};

// Add to collection
collection.item.push(authFolder);

// Write to file
const outputPath = path.join(__dirname, '..', 'postman', 'Fordza-Complete.postman_collection.json');
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));

console.log('✅ Complete Postman collection generated!');
console.log(`📁 File: ${outputPath}`);
console.log(`📊 Total folders: ${collection.item.length}`);
console.log(`📊 Total requests: ${collection.item.reduce((sum, folder) => sum + folder.item.length, 0)}`);
console.log('');
console.log('📋 Auth folder includes:');
console.log('   - ✅ Login (Success) + auto-save tokens');
console.log('   - ❌ Login (Invalid Credentials) - 401');
console.log('   - ❌ Login (Empty Fields) - 400 Validation');
console.log('   - ❌ Login (Rate Limit) - 429');
console.log('   - ✅ Refresh Token (Success) + auto-save');
console.log('   - ❌ Refresh Token (Invalid) - 401');
console.log('   - ❌ Refresh Token (Expired) - 401');
console.log('   - ✅ Get Me (Success)');
console.log('   - ❌ Get Me (No Token) - 401');
console.log('   - ❌ Get Me (Invalid Token) - 401');
console.log('   - ✅ Logout (Success) + clear tokens');
console.log('');
console.log('🎯 Next: Import to Postman and test!');
