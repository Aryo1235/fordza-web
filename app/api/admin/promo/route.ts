import { NextResponse } from "next/server";
import { PromoService } from "@/backend/services/promo.service";

export async function GET() {
  try {
    const promos = await PromoService.getAll();
    return NextResponse.json({
      success: true,
      data: promos
    });
  } catch (error: any) {
    console.error("GET PROMO ERROR:", error.message);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil daftar promo" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    const body = await req.json();
    
    const promo = await PromoService.create(body, userId);
    
    return NextResponse.json({
      success: true,
      data: promo
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST PROMO ERROR:", error.message);
    const isDeny = error.message.includes("Akses Ditolak");
    return NextResponse.json(
      { success: false, message: isDeny ? error.message : "Gagal membuat promo baru. Pastikan semua data valid." },
      { status: isDeny ? 403 : 500 }
    );
  }
}
