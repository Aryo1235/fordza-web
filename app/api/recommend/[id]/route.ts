import { NextResponse } from "next/server";
import { RecommendationService } from "@/backend/services/recommendation.service";
import { handleError } from "@/lib/error-handler";
import { AppError } from "@/lib/error-handler";

// GET /api/recommend/:id — Rekomendasi produk serupa (KNN)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const result = await RecommendationService.getRecommendations(id, 4);

    if (!result) {
      throw new AppError("Produk tidak ditemukan atau tidak memiliki rekomendasi", 404, "NOT_FOUND");
    }

    return NextResponse.json(
      {
        success: true,
        message: "Rekomendasi produk berhasil dihitung",
        data: result,
      },
      { status: 200 },
    );
  } catch (error: any) {
    return await handleError(error);
  }
}


