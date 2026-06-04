import { NextResponse } from "next/server";
import { PromoService } from "@/backend/services/promo.service";
import { handleError } from "@/lib/error-handler";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const categories = await PromoService.getCategoriesForPromoSelection();

    return NextResponse.json(
      {
        success: true,
        message: "Berhasil mengambil daftar kategori untuk promo",
        data: categories,
      },
      { status: 200 },
    );
  } catch (error: any) {
    return await handleError(error);
  }
}
