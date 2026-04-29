import { NextResponse } from "next/server";
import { PromoService } from "@/backend/services/promo.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const promo = await PromoService.getById(id);
    if (!promo) {
      return NextResponse.json(
        { success: false, message: "Promo tidak ditemukan" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: promo });
  } catch (error: any) {
    console.error("GET PROMO ID ERROR:", error.message);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data promo" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = req.headers.get("x-user-id");
    const body = await req.json();
    
    const promo = await PromoService.update(id, body, userId);
    
    return NextResponse.json({ success: true, data: promo });
  } catch (error: any) {
    console.error("PATCH PROMO ERROR:", error.message);
    const isDeny = error.message.includes("Akses Ditolak");
    return NextResponse.json(
      { success: false, message: isDeny ? error.message : "Gagal memperbarui promo. Silakan periksa kembali data Anda." },
      { status: isDeny ? 403 : 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = req.headers.get("x-user-id");
    
    await PromoService.delete(id, userId);
    
    return NextResponse.json({ success: true, message: "Promo berhasil dihapus" });
  } catch (error: any) {
    console.error("DELETE PROMO ERROR:", error.message);
    const isDeny = error.message.includes("Akses Ditolak");
    return NextResponse.json(
      { success: false, message: isDeny ? error.message : "Gagal menghapus promo" },
      { status: isDeny ? 403 : 500 }
    );
  }
}
