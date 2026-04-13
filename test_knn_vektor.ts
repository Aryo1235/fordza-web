import { extractUniqueDimensions, buildProductVectors } from "./lib/knn";

async function runTest() {
  console.log("Membaca data asli dari Database Fordza...");
  
  try {
    // Kita panggil langsung API backend Anda yang sedang menyala! (Super Real)
    const res = await fetch("http://localhost:3000/api/public/products?limit=100");
    const json = await res.json();
    
    // Ambil 3 produk pertama
    const products = json.data.slice(0, 10); 

    if (products.length === 0) {
      console.log("Belum ada produk di database.");
      return;
    }

    // Petakan (Mapping) data asli agar masuk ke format KNN kita
    const mappedProducts = products.map((p: any) => {
      // Kita log 1 data awal untuk melihat wujud aslinya
      if (p.name === "Fordza Derby Shoes") console.log("RAW DATA DARI API:", JSON.stringify(p, null, 2));
      
      return {
        id: p.name, 
        // Ternyata data kategori di API ada di dalam array category.name
        categoryIds: p.categories?.map((c: any) => c.category?.name || c.name || "Default"),
        // Fitur ada di dalam p.material jika tidak ada di detail
        material: p.detail?.material || p.material || "Leather",
        gender: p.gender || "Man", 
        productType: p.productType || p.detail?.productType || "Shoes",
        price: Number(p.price)
      };
    });

    console.log("\n=== BUKTI 1: TOTAL FITUR (UNIQUE DIMENSIONS) DARI 3 PRODUK NYATA ===");
    const dims = extractUniqueDimensions(mappedProducts);
    console.log(`- Jum. Kategori Unik (${dims.categoryIds.length}):`, dims.categoryIds);
    console.log(`- Jum. Material Unik (${dims.materials.length}):`, dims.materials);
    console.log(`- Jum. Tipe Unik (${dims.types.length}):`, dims.types);
    console.log(`- Jum. Gender Unik (${dims.genders.length}):`, dims.genders);

    console.log("\n=== PANDUAN CARA MEMBACA ANGKA MATRIKS (KUNCI/LEGEND) ===");
    const legend = [
      ...dims.categoryIds.map(c => `[Kategori: ${c}]`),
      ...dims.materials.map(m => `[Material: ${m}]`),
      ...dims.genders.map(g => `[Gender: ${g}]`),
      ...dims.types.map(t => `[Tipe Produk: ${t}]`),
      "[Skala Harga (0.0 termurah - 1.0 termahal)]"
    ];
    legend.forEach((item, index) => console.log(`Urutan Angka ke-${index + 1}: ${item}`));

    console.log("\n=== BUKTI 2: HASIL MATRIKS NYATA DARI DATABASE ===");
    const vectors = buildProductVectors(mappedProducts, dims);
    console.log(JSON.stringify(vectors, null, 2));

  } catch(e) {
    console.error("Gagal terhubung ke localhost:3000. Pastikan npm run dev nyala.");
  }
}

runTest();
