const fs = require('fs');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;
  for (const r of replacements) {
    content = content.replace(r.from, r.to);
  }
  if (original !== content) {
    fs.writeFileSync(filePath, content);
    console.log('Updated', filePath);
  }
}

const files = [
  {
    path: 'app/api/admin/variants/[variantId]/route.ts',
    replacements: [
      { from: /throw new AppError\("Varian tidak ditemukan", 404\);/g, to: 'throw new AppError("Varian tidak ditemukan", 404, "NOT_FOUND");' },
      { from: 'throw new AppError(`Kode varian "${newCode}" sudah dipakai. Silakan ganti nama warna atau kode custom agar unik.`, 409);', to: 'throw new AppError(`Kode varian "${newCode}" sudah dipakai. Silakan ganti nama warna atau kode custom agar unik.`, 409, "CONFLICT");' }
    ]
  },
  {
    path: 'app/api/admin/skus/[skuId]/route.ts',
    replacements: [
      { from: /throw new AppError\("SKU tidak ditemukan", 404\);/g, to: 'throw new AppError("SKU tidak ditemukan", 404, "NOT_FOUND");' }
    ]
  },
  {
    path: 'app/api/admin/shifts/current/route.ts',
    replacements: [
      { from: 'throw new AppError("Tidak ada session", 401);', to: 'throw new AppError("Tidak ada session", 401, "UNAUTHORIZED");' },
      { from: 'throw new AppError("Token tidak valid", 401);', to: 'throw new AppError("Token tidak valid", 401, "UNAUTHORIZED");' }
    ]
  },
  {
    path: 'app/api/admin/variants/[variantId]/skus/route.ts',
    replacements: [
      { from: 'throw new AppError("Varian tidak ditemukan", 404);', to: 'throw new AppError("Varian tidak ditemukan", 404, "NOT_FOUND");' }
    ]
  },
  {
    path: 'app/api/admin/shifts/open/route.ts',
    replacements: [
      { from: 'throw new AppError("Tidak ada session", 401);', to: 'throw new AppError("Tidak ada session", 401, "UNAUTHORIZED");' },
      { from: 'throw new AppError("Token tidak valid", 401);', to: 'throw new AppError("Token tidak valid", 401, "UNAUTHORIZED");' },
      { from: 'throw new AppError("Modal Awal nominal tidak valid", 400);', to: 'throw new AppError("Modal Awal nominal tidak valid", 400, "INVALID_INPUT");' }
    ]
  },
  {
    path: 'app/api/admin/reports/route.ts',
    replacements: [
      { from: "throw new AppError(\"Parameter 'from' dan 'to' wajib ada\", 400);", to: "throw new AppError(\"Parameter 'from' dan 'to' wajib ada\", 400, \"MISSING_PARAMETER\");" }
    ]
  },
  {
    path: 'app/api/admin/reports/items/route.ts',
    replacements: [
      { from: "throw new AppError(\"Parameter 'from' dan 'to' wajib ada\", 400);", to: "throw new AppError(\"Parameter 'from' dan 'to' wajib ada\", 400, \"MISSING_PARAMETER\");" }
    ]
  },
  {
    path: 'app/api/admin/shifts/close/route.ts',
    replacements: [
      { from: 'throw new AppError("Tidak ada session", 401);', to: 'throw new AppError("Tidak ada session", 401, "UNAUTHORIZED");' },
      { from: 'throw new AppError("Token tidak valid", 401);', to: 'throw new AppError("Token tidak valid", 401, "UNAUTHORIZED");' },
      { from: 'throw new AppError("Uang Fisik nominal tidak valid", 400);', to: 'throw new AppError("Uang Fisik nominal tidak valid", 400, "INVALID_INPUT");' }
    ]
  },
  {
    path: 'app/api/admin/categories/[id]/route.ts',
    replacements: [
      { from: /throw new AppError\("Kategori tidak ditemukan", 404\);/g, to: 'throw new AppError("Kategori tidak ditemukan", 404, "NOT_FOUND");' }
    ]
  },
  {
    path: 'app/api/admin/products/[id]/route.ts',
    replacements: [
      { from: /throw new AppError\("Produk tidak ditemukan", 404\);/g, to: 'throw new AppError("Produk tidak ditemukan", 404, "NOT_FOUND");' }
    ]
  },
  {
    path: 'app/api/admin/products/[id]/variants/route.ts',
    replacements: [
      { from: /throw new AppError\("Produk tidak ditemukan", 404\);/g, to: 'throw new AppError("Produk tidak ditemukan", 404, "NOT_FOUND");' },
      { from: 'throw new AppError(`Kode varian "${variantCode}" sudah dipakai. Silakan ganti nama warna atau kode custom agar unik.`, 409);', to: 'throw new AppError(`Kode varian "${variantCode}" sudah dipakai. Silakan ganti nama warna atau kode custom agar unik.`, 409, "CONFLICT");' }
    ]
  },
  {
    path: 'app/api/admin/banners/[id]/route.ts',
    replacements: [
      { from: /throw new AppError\("Banner tidak ditemukan", 404\);/g, to: 'throw new AppError("Banner tidak ditemukan", 404, "NOT_FOUND");' }
    ]
  }
];

for (const f of files) {
  try {
    replaceInFile(f.path, f.replacements);
  } catch (err) {
    console.error('Error on', f.path, err.message);
  }
}
