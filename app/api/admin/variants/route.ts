import { NextResponse } from "next/server";
import { VariantRepository } from "@/backend/repositories/variants.repo";
import { handleError } from "@/lib/error-handler";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "20");

    const variants = await VariantRepository.searchAdmin(search, limit);

    return NextResponse.json({
      success: true,
      data: variants,
    });
  } catch (error: any) {
    return await handleError(error);
  }
}
