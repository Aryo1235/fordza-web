import { extractUniqueDimensions, buildProductVectors, findKNearest, euclideanDistance } from "./lib/knn";

// Fungsi untuk mencetak penjelasan bagaimana vektor dibentuk (One-Hot Encoding + Min-Max Normalization)
function printVectorBreakdown(product: any, vector: number[], dims: any) {
    let index = 0;

    // 1. Kategori
    const catValues = dims.categoryIds.map((c: string) => {
        const val = vector[index++];
        return `${c} = ${val}`;
    });
    console.log(`   * One-Hot Kategori : [ ${catValues.join(", ")} ] (Kategori produk: [${product.categoryIds.join(", ")}])`);

    // 2. Material
    const matValues = dims.materials.map((m: string) => {
        const val = vector[index++];
        return `${m} = ${val}`;
    });
    console.log(`   * One-Hot Material : [ ${matValues.join(", ")} ] (Material produk: "${product.material}")`);

    // 3. Insole
    const insValues = dims.insoles.map((i: string) => {
        const val = vector[index++];
        return `${i} = ${val}`;
    });
    console.log(`   * One-Hot Insole   : [ ${insValues.join(", ")} ] (Insole produk: "${product.insole}")`);

    // 4. Gender
    const genValues = dims.genders.map((g: string) => {
        const val = vector[index++];
        return `${g} = ${val}`;
    });
    console.log(`   * One-Hot Gender   : [ ${genValues.join(", ")} ] (Gender produk: "${product.gender}")`);

    // 5. Tipe Produk
    const typeValues = dims.types.map((t: string) => {
        const val = vector[index++];
        return `${t} = ${val}`;
    });
    console.log(`   * One-Hot Tipe     : [ ${typeValues.join(", ")} ] (Tipe produk: "${product.productType}")`);

    // 6. Harga
    const priceVal = vector[index++];
    const priceRange = dims.maxPrice - dims.minPrice;
    console.log(`   * Normalisasi Harga: ${priceVal.toFixed(4)}`);
    console.log(`     Rumus: (HargaProduk - HargaMin) / (HargaMax - HargaMin)`);
    console.log(`     Hitung: (Rp ${product.price.toLocaleString("id-ID")} - Rp ${dims.minPrice.toLocaleString("id-ID")}) / (Rp ${dims.maxPrice.toLocaleString("id-ID")} - Rp ${dims.minPrice.toLocaleString("id-ID")})`);
}

async function runTest() {
    console.log("=========================================================");
    console.log(" SIMULASI DETAIL PERHITUNGAN ALGORITMA KNN FORDZA WEB");
    console.log("=========================================================\n");

    try {
        // 1. Fetch data dari API backend lokal
        console.log("Membaca data asli dari Database Fordza...");
        const res = await fetch("http://localhost:3000/api/public/products?limit=100");
        const json = await res.json();
        const products = json.data;

        if (!products || products.length === 0) {
            console.log("Belum ada produk di database. Silakan jalankan seed data.");
            return;
        }

        // 2. Petakan data dari database ke format fitur KNN
        const mappedProducts = products.map((p: any) => ({
            id: p.id,
            name: p.name,
            categoryIds: p.categories?.map((c: any) => c.category?.name || c.name || "Default") || [],
            material: p.detail?.material || p.material || "Leather",
            insole: p.detail?.insole || p.insole || "unknown",
            gender: p.gender || "Man",
            productType: p.productType || p.detail?.productType || "Shoes",
            price: Number(p.price)
        }));

        // 3. Ekstraksi unique dimensions & buat vektor
        const dims = extractUniqueDimensions(mappedProducts);
        const vectors = buildProductVectors(mappedProducts, dims);

        // Bangun legend/kunci index untuk kebutuhan logging
        const legend = [
            ...dims.categoryIds.map(c => `Kategori: ${c}`),
            ...dims.materials.map(m => `Material: ${m}`),
            ...dims.insoles.map(i => `Insole: ${i}`),
            ...dims.genders.map(g => `Gender: ${g}`),
            ...dims.types.map(t => `Tipe Produk: ${t}`),
            "Skala Harga (Normalized)"
        ];

        // 4. Tentukan produk target (cari yang mengandung "boot safety", fallback ke produk pertama)
        let targetProduct = mappedProducts.find((p: any) => p.name.toLowerCase().includes("boot safety"));
        if (!targetProduct) {
            targetProduct = mappedProducts[0];
        }
        const targetVectorObj = vectors.find(v => v.id === targetProduct.id)!;

        console.log(`\n=========================================================`);
        console.log(`[TARGET PRODUK] : "${targetProduct.name}"`);
        console.log(`=========================================================`);
        console.log(`- Detail Asli  :`);
        console.log(`  * Kategori   :`, targetProduct.categoryIds);
        console.log(`  * Material   :`, targetProduct.material);
        console.log(`  * Insole     :`, targetProduct.insole);
        console.log(`  * Gender     :`, targetProduct.gender);
        console.log(`  * Tipe       :`, targetProduct.productType);
        console.log(`  * Harga      : Rp ${targetProduct.price.toLocaleString("id-ID")}`);
        console.log(`\n- Hasil Vektor Akhir:`, JSON.stringify(targetVectorObj.vector));
        console.log(`\n- Cara Vektor Target Terbentuk:`);
        printVectorBreakdown(targetProduct, targetVectorObj.vector, dims);

        console.log("\n=========================================================");
        console.log(" PROSES 1: PERHITUNGAN JARAK EUCLIDEAN SECARA DETIL");
        console.log("=========================================================");

        const distancesList: { name: string; distance: number; steps: string[] }[] = [];

        for (const candidate of mappedProducts) {
            if (candidate.id === targetProduct.id) continue;

            const candidateVectorObj = vectors.find(v => v.id === candidate.id)!;
            const vA = targetVectorObj.vector;
            const vB = candidateVectorObj.vector;

            console.log(`\n---------------------------------------------------------`);
            console.log(`-> Menghitung Jarak ke: "${candidate.name}"`);
            console.log(`---------------------------------------------------------`);
            console.log(`- Detail Asli  :`);
            console.log(`  * Kategori   :`, candidate.categoryIds);
            console.log(`  * Material   :`, candidate.material);
            console.log(`  * Insole     :`, candidate.insole);
            console.log(`  * Gender     :`, candidate.gender);
            console.log(`  * Tipe       :`, candidate.productType);
            console.log(`  * Harga      : Rp ${candidate.price.toLocaleString("id-ID")}`);
            console.log(`\n- Hasil Vektor Akhir:`, JSON.stringify(vB));

            console.log(`\n- Cara Vektor Terbentuk:`);
            printVectorBreakdown(candidate, vB, dims);

            console.log(`\n- Rumus Jarak Euclidean: d = sqrt( sum( (VectorTarget_i - VectorKandidat_i)^2 ) )`);
            console.log(`- Rincian Selisih Kuadrat Per Dimensi:`);

            let sumOfSquares = 0;
            const steps: string[] = [];

            for (let i = 0; i < vA.length; i++) {
                const diff = vA[i] - vB[i];
                const diffSquared = diff * diff;
                sumOfSquares += diffSquared;

                // Catat langkah matematika
                console.log(`  * Selisih [${legend[i]}]:`);
                console.log(`    (${vA[i]} - ${vB[i]})^2 = (${diff.toFixed(4)})^2 = ${diffSquared.toFixed(4)}`);
            }

            const distance = Math.sqrt(sumOfSquares);
            distancesList.push({
                name: candidate.name,
                distance,
                steps
            });

            console.log(`\n  * Total Penjumlahan Kuadrat Selisih (Sum of Squares) = ${sumOfSquares.toFixed(4)}`);
            console.log(`  * Jarak Akhir (Akar Kuadrat) = sqrt(${sumOfSquares.toFixed(4)}) = ${distance.toFixed(4)}`);
        }

        console.log("\n=========================================================");
        console.log(" PROSES 2: PERENGKINGAN & REKOMENDASI TERBAIK (KNN)");
        console.log("=========================================================");

        // Urutkan berdasarkan jarak terkecil (paling mirip)
        distancesList.sort((a, b) => a.distance - b.distance);

        // Ambil top K (misal K=3)
        const k = 3;
        const recommendations = distancesList.slice(0, k);

        console.log(`\nHasil Top ${k} Rekomendasi Terdekat untuk "${targetProduct.name}":`);
        recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. "${rec.name}"`);
            console.log(`   Jarak Euclidean: ${rec.distance.toFixed(4)} (Semakin mendekati 0 = semakin mirip)`);
        });

    } catch (error: any) {
        console.error("\n[ERROR] Gagal menjalankan simulasi.", error);
        console.log("Pastikan dev server Next.js Anda (npm run dev) sudah menyala di localhost:3000.");
    }
}

runTest();
