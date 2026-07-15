"use server";

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

    // 4.1 Validasi Keaslian File Biner (Magic Numbers / File Signature)
    if (!isValidImageSignature(buffer)) {
      return {
        success: false,
        message: "File rusak atau format file asli bukan gambar yang diizinkan (PNG/JPG/WebP).",
      };
    }

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

/**
 * Memvalidasi apakah buffer memiliki signature file gambar yang valid (PNG, JPEG, WebP)
 */
function isValidImageSignature(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // 1. Check PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;
  if (isPng) return true;

  // 2. Check JPEG: FF D8 FF
  const isJpeg =
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;
  if (isJpeg) return true;

  // 3. Check WebP: RIFF (bytes 0-3) dan WEBP (bytes 8-11)
  const isRiff =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46;
  const isWebp =
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;
  if (isRiff && isWebp) return true;

  return false;
}

export async function deleteFileFromS3(fileKey: string) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
    });

    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error(`Gagal menghapus file ${fileKey}:`, error);
    return { success: false };
  }
}
