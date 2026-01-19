import { NextResponse } from "next/server";
import { sizeTemplateSchema } from "@/lib/zod-schemas";
import { SizeTemplateService } from "@//services/size-template.db";

export async function GET() {
  const data = await SizeTemplateService.getAll();
  return NextResponse.json({
    success: true,
    message: "Berhasil mengambil template",
    data,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = sizeTemplateSchema.safeParse(body);
    if (!validation.success)
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 },
      );

    const data = await SizeTemplateService.create(validation.data);
    return NextResponse.json(
      { success: true, message: "Template berhasil dibuat", data },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
