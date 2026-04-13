"use client";

import { useState } from "react";
import { uploadFileToS3 } from "@/actions/upload";

export default function TestPage() {
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState("");

  async function handleTest(formData: FormData) {
    setLoading(true);
    // Kita coba upload ke folder 'products'
    const result = await uploadFileToS3(formData, "products");
    setLoading(false);

    if (result.success) {
      setResultUrl(result.url || "");
      alert("Berhasil! Cek dashboard Supabase kamu.");
    } else {
      alert("Gagal: " + result.message);
    }
  }

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-5">Uji Coba Upload Fordza</h1>
      <form action={handleTest} className="flex flex-col gap-4 max-w-sm">
        <input
          type="file"
          name="file"
          accept="image/*"
          required
          className="border p-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white p-2 rounded disabled:bg-gray-400"
        >
          {loading ? "Menunggah..." : "Upload ke Folder Products"}
        </button>
      </form>

      {resultUrl && (
        <div className="mt-10">
          <p className="font-semibold">
            Link yang akan masuk ke Database Neon:
          </p>
          <code className="block bg-gray-100 p-2 text-xs break-all mb-4">
            {resultUrl}
          </code>
          <img
            src={resultUrl}
            alt="Preview"
            className="w-64 border shadow-md"
          />
        </div>
      )}
    </div>
  );
}
