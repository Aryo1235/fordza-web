import { NextResponse } from "next/server";
import { PromoService } from "@/backend/services/promo.service";
import { handleError } from "@/lib/error-handler";

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
    return await handleError(error);
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
    return await handleError(error);
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
    return await handleError(error);
  }
}
