import { NextResponse } from "next/server";
import { RecommendationService } from "@/services/recommendation.db";

// GET /api/recommend/:id — Rekomendasi produk serupa (KNN)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const result = await RecommendationService.getRecommendations(id, 4);

    if (!result) {
      return NextResponse.json(
        { success: false, message: "Produk tidak ditemukan" },
        { status: 404 },
      );
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
    return NextResponse.json(
      {
        success: false,
        message: "Gagal menghitung rekomendasi",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
