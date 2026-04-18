/**
 * =============================================================
 * KNN (K-Nearest Neighbor) Content-Based Filtering
 * =============================================================
 *
 * Module ini berisi fungsi-fungsi pure untuk:
 * 1. Ekstraksi Fitur Unik (Kategori, Material, Gender, dan Tipe Produk)
 * 2. Vektorisasi dengan One-Hot Encoding + Min-Max Normalization Harga
 * 3. Perhitungan Euclidean Distance
 * 4. Pencarian K-Tetangga Terdekat
 *
 * Digunakan untuk merekomendasikan "Produk Serupa" berdasarkan
 * kemiripan yang jauh lebih adil tanpa asumsi urutan/tingkatan (Ordinal Bias).
 */

// ============================================================
//  TIPE DATA
// ============================================================

/** Representasi produk dari database yang siap diproses */
export interface ProductFeature {
  id: string;
  categoryIds: string[]; // Array ID kategori produk
  material: string; // Detail material produk (gabungan atau override)
  gender: string; // Gender produk (dari Product)
  productType: string; // Tipe produk (dari Product)
  price: number; // Harga produk (angka mentah)
}

/** Produk yang sudah dikonversi ke Multi-Dimensional Vector numerik (One-Hot + Harga) */
export interface ProductVector {
  id: string;
  vector: number[]; // [is_cat_A, ..., is_mat_A, ..., is_gender_A, ..., is_type_A, ..., price_normalized]
}

/** Hasil perhitungan jarak antara 2 produk */
export interface DistanceResult {
  id: string;
  distance: number; // Jarak Euclidean (semakin kecil = semakin mirip)
}

// ============================================================
//  LANGKAH 1: EKSTRAKSI FITUR (MENDATA KEMUNGKINAN DARI DATABASE)
// ============================================================

/**
 * Mengambil daftar unik dari semua fitur nominal yang ada,
 * sekaligus menghitung batas harga Minimum dan Maksimum.
 */
export function extractUniqueDimensions(products: ProductFeature[]) {
  // 1. Kumpulkan Category Unik
  const categoryIds = Array.from(
    new Set(products.flatMap((p) => p.categoryIds)),
  ).sort();

  // 2. Kumpulkan Material Unik
  const materials = Array.from(
    new Set(products.map((p) => p.material.toLowerCase().trim())),
  ).sort();

  // 3. Kumpulkan Gender Unik
  const genders = Array.from(
    new Set(products.map((p) => p.gender.toLowerCase().trim())),
  ).sort();

  // 4. Kumpulkan Product Type Unik
  const types = Array.from(
    new Set(products.map((p) => p.productType.toLowerCase().trim())),
  ).sort();

  // 5. Cari rentang Harga
  const prices = products.map((p) => p.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  return { categoryIds, materials, genders, types, minPrice, maxPrice };
}

// ============================================================
//  LANGKAH 2: VEKTORISASI DATA (ONE-HOT ENCODING + NORMALISASI)
// ============================================================

/**
 * Membangun vektor berdimensi adaptif untuk setiap produk menggunakan ONE-HOT ENCODING.
 * Ini memastikan keadilan pada data Nominal, menghilangkan distorsi "Label Encoding".
 *
 * Contoh hasil produk:
 * Kategori yang cocok = 1, sisanya = 0.
 * Material yang cocok = 1, sisanya = 0.
 * Harga = Skala 0.0 s/d 1.0 (Min-Max Normalized)
 */
export function buildProductVectors(
  products: ProductFeature[],
  dimensions: ReturnType<typeof extractUniqueDimensions>,
): ProductVector[] {
  const { categoryIds, materials, genders, types, minPrice, maxPrice } =
    dimensions;
  const priceRange = maxPrice - minPrice;

  return products.map((product) => {
    const vector: number[] = [];
    // Set mempercepat pengecekan membership kategori saat one-hot encoding.
    // Ini membantu ketika jumlah produk/kategori bertambah besar.
    const productCategorySet = new Set(product.categoryIds);

    // [1] One-Hot Encode: Kategori
    for (const catId of categoryIds) {
      vector.push(productCategorySet.has(catId) ? 1 : 0);
    }

    // [2] One-Hot Encode: Material
    const productMaterial = product.material.toLowerCase().trim();
    for (const mat of materials) {
      vector.push(productMaterial === mat ? 1 : 0);
    }

    // [3] One-Hot Encode: Gender
    const productGender = product.gender.toLowerCase().trim();
    for (const gen of genders) {
      vector.push(productGender === gen ? 1 : 0);
    }

    // [4] One-Hot Encode: Tipe Produk
    const productType = product.productType.toLowerCase().trim();
    for (const pt of types) {
      vector.push(productType === pt ? 1 : 0);
    }

    // [5] Normalisasi Harga (Min-Max Scaler)
    const normalizedPrice =
      priceRange === 0 ? 0 : (product.price - minPrice) / priceRange;
    vector.push(normalizedPrice);

    return { id: product.id, vector };
  });
}

// ============================================================
//  LANGKAH 3: PERHITUNGAN EUCLIDEAN DISTANCE
// ============================================================

/**
 * Menghitung Jarak Euclidean (Pitagoras Multi-Dimensi).
 * Digunakan untuk perengkingan kemiripan berbasis kedekatan nilai Vektor.
 */
export function euclideanDistance(
  vectorA: number[],
  vectorB: number[],
): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error("Kedua vektor harus memiliki dimensi yang sama");
  }

  let sumOfSquares = 0;
  for (let i = 0; i < vectorA.length; i++) {
    const diff = vectorA[i] - vectorB[i];
    sumOfSquares += diff * diff;
  }

  return Math.sqrt(sumOfSquares);
}

// ============================================================
//  LANGKAH 4: PENCARIAN KNN TERDEKAT
// ============================================================

/**
 * Menghitung jarak Target ke SEMUA produk menggunakan rumus Euclidean Distance,
 * lalu mengembalikan "k" jumlah tetangga terdekat dengan jarak paling minimum.
 *
 * @param targetId ID Produk yang sedang dilihat User.
 * @param vectors List Vektor (Biner One-Hot) milik seluruh katalog Produk (termasuk Target).
 * @param k Jumlah "Produk Serupa" / Rekomendasi yang akan dikembalikan (Default: 4).
 */
export function findKNearest(
  targetId: string,
  vectors: ProductVector[],
  k: number = 4,
): DistanceResult[] {
  const targetVector = vectors.find((v) => v.id === targetId);
  if (!targetVector) {
    throw new Error(`Produk target dengan ID "${targetId}" tidak ditemukan`);
  }

  const distances: DistanceResult[] = [];
  for (const candidate of vectors) {
    if (candidate.id === targetId) continue;

    const distance = euclideanDistance(targetVector.vector, candidate.vector);
    distances.push({
      id: candidate.id,
      distance,
    });
  }

  // Urutkan jarak Euclidean terkecil ke terbesar
  distances.sort((a, b) => a.distance - b.distance);

  return distances.slice(0, k);
}
