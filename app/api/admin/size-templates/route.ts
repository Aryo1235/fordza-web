import { NextResponse } from "next/server";
import { sizeTemplateSchema } from "@/lib/zod-schemas";
import { SizeTemplateService } from "@/backend/services/size-template.service";
import { handleError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import { headers } from "next/headers";

// GET /api/admin/size-templates — Admin: semua template ukuran
export async function GET() {
  try {
    const data = await SizeTemplateService.getAll();

    return NextResponse.json({
      success: true,
      message: "Berhasil mengambil template",
      data,
    });
  } catch (error: any) {
    return await handleError(error);
  }
}

// POST /api/admin/size-templates — Admin: buat template baru
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = { data: sizeTemplateSchema.parse(body) };


    const data = await SizeTemplateService.create(validation.data);

    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";

    logger.info({ traceId, templateId: data.id, name: data.name }, "Size template created successfully");

    return NextResponse.json(
      { success: true, message: "Template berhasil dibuat", data },
      { status: 201 },
    );
  } catch (error: any) {
    return await handleError(error);
  }
}
