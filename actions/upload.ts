import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";
import { v4 as uuidv4 } from "uuid";

export async function uploadFileToS3(
  formData: FormData,
  folder: string = "products",
) {
  try {
    // 1. Ambil file dari FormData
    const file = formData.get("file") as File;
    if (!file) return { success: false, message: "Tidak ada file" };

    // 2. Persiapan Buffer & Nama File
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileExtension = file.name.split(".").pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    // 3. Perintah Upload (Gunakan S3_BUCKET_NAME sesuai .env kamu)
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME, // <--- UBAH INI (Sesuai .env)
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });

    // 4. Kirim ke Supabase
    await s3Client.send(command);

    // 5. Susun URL Publik (Gunakan NEXT_PUBLIC_STORAGE_URL sesuai .env kamu)
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
