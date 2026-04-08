import { NextResponse } from "next/server";
import { ProductService } from "@/services/products.db";
import { uploadFileToS3, deleteFileFromS3 } from "@/actions/upload";

// GET /api/admin/products/[id] — Admin: detail produk
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const product = await ProductService.getById(id);

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Produk tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// PUT /api/admin/products/[id] — Admin: update produk
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const uploadedImages: { url: string; key: string }[] = [];

  try {
    const { id } = await params;

    // Cek produk ada
    const existing = await ProductService.getById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Produk tidak ditemukan" },
        { status: 404 },
      );
    }

    const formData = await req.formData();

    // Parse categoryIds
    const categoryIdsRaw = formData.getAll("categoryIds");
    let categoryIds: string[] = [];
    if (categoryIdsRaw.length === 1 && (categoryIdsRaw[0] as string).includes(",")) {
      categoryIds = (categoryIdsRaw[0] as string).split(",").map((id) => id.trim());
    } else if (categoryIdsRaw.length > 0) {
      categoryIds = categoryIdsRaw as string[];
    }

    // Data update
    const updateData: any = {};
    const fields = [
      "name", "shortDescription", "productType", "gender",
      "description", "material", "closureType", "outsole",
      "origin", "notes", "careInstructions", "sizeTemplateId",
    ];

    for (const field of fields) {
      const value = formData.get(field);
      if (value !== null) updateData[field] = value;
    }

    // Price
    const price = formData.get("price");
    if (price !== null) updateData.price = parseFloat(price as string);

    // Stock
    const stock = formData.get("stock");
    if (stock !== null) updateData.stock = parseInt(stock as string, 10);

    // Flags
    if (formData.get("isPopular") !== null) updateData.isPopular = formData.get("isPopular") === "true";
    if (formData.get("isBestseller") !== null) updateData.isBestseller = formData.get("isBestseller") === "true";
    if (formData.get("isNew") !== null) updateData.isNew = formData.get("isNew") === "true";
    if (formData.get("isActive") !== null) updateData.isActive = formData.get("isActive") === "true";

    if (categoryIds.length > 0) updateData.categoryIds = categoryIds;

    // Upload gambar baru (jika ada)
    const images = formData.getAll("images");
    if (Array.isArray(images) && images.length > 0) {
      for (const file of images) {
        if (file instanceof File && file.size > 0) {
          const uploadFormData = new FormData();
          uploadFormData.append("file", file);
          const res = await uploadFileToS3(uploadFormData, "products");
          if (res.success) {
            uploadedImages.push({ url: res.url as string, key: res.fileName as string });
          }
        }
      }
      if (uploadedImages.length > 0) updateData.images = uploadedImages;
    }

    const product = await ProductService.update(id, updateData);

    return NextResponse.json(
      { success: true, message: "Produk berhasil diupdate", data: product },
      { status: 200 },
    );
  } catch (error: any) {
    if (uploadedImages.length > 0) {
      await Promise.all(uploadedImages.map((img) => deleteFileFromS3(img.key)));
    }

    return NextResponse.json(
      { success: false, message: "Gagal mengupdate produk", error: error.message },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/products/[id] — Admin: soft delete produk
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existing = await ProductService.getById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Produk tidak ditemukan" },
        { status: 404 },
      );
    }

    await ProductService.delete(id);

    return NextResponse.json(
      { success: true, message: "Produk berhasil dihapus (soft delete)" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
