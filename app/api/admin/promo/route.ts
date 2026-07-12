import { NextResponse } from "next/server";
import { PromoService } from "@/backend/services/promo.service";
import { handleError } from "@/lib/error-handler";

export async function GET() {
  try {
    const promos = await PromoService.getAll();
    return NextResponse.json({
      success: true,
      data: promos
    });
  } catch (error: any) {
    return await handleError(error);
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
    return await handleError(error);
  }
}
