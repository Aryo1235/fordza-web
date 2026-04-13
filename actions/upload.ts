import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";
import { v4 as uuidv4 } from "uuid";

export async function uploadFileToS3(
  formData: FormData,
  folder: string = "products",
) {
  try {
    const requiredEnv = [
      "S3_BUCKET_NAME",
      "NEXT_PUBLIC_STORAGE_URL",
      "S3_REGION",
      "S3_ENDPOINT",
      "S3_ACCESS_KEY_ID",
      "S3_SECRET_ACCESS_KEY",
    ] as const;

    const missingEnv = requiredEnv.filter((name) => !process.env[name]);
    if (missingEnv.length > 0) {
      return {
        success: false,
        message: `Konfigurasi server belum lengkap: ${missingEnv.join(", ")}`,
      };
    }

    // 1. Ambil file dari FormData
    const file = formData.get("file") as File;
    if (!file) return { success: false, message: "Tidak ada file" };

    // 2. Validasi tipe file (harus gambar)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        message: "Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP.",
      };
    }

    // 3. Validasi ukuran file (max 2MB)
    // Gambar harus dikompres di browser sebelum upload!
    const MAX_SIZE_MB = 2;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return {
        success: false,
        message: `Ukuran file terlalu besar (${(file.size / 1024 / 1024).toFixed(1)}MB). Maksimal ${MAX_SIZE_MB}MB. Kompres gambar terlebih dahulu.`,
      };
    }

    // 4. Persiapan Buffer & Nama File
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileExtension = file.name.split(".").pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    // 5. Perintah Upload (Gunakan S3_BUCKET_NAME sesuai .env kamu)
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME, // <--- UBAH INI (Sesuai .env)
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });

    // 6. Kirim ke Supabase
    await s3Client.send(command);

    // 7. Susun URL Publik (Gunakan NEXT_PUBLIC_STORAGE_URL sesuai .env kamu)
    // Sesuai .env kamu: https://.../public/fordza-images/fileName
    const publicUrl = `${process.env.NEXT_PUBLIC_STORAGE_URL}/${fileName}`;

    return {
      success: true,
      url: publicUrl,
      fileName: fileName,
    };
  } catch (error: any) {
    console.error("Upload error:", error);
    return { success: false, message: error.message };
  }
}

export async function deleteFileFromS3(fileKey: string) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
    });

    await s3Client.send(command);
    console.log(`Rollback: Berhasil menghapus ${fileKey}`);
    return { success: true };
  } catch (error) {
    console.error(`Gagal menghapus file ${fileKey}:`, error);
    return { success: false };
  }
}
