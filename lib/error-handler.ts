import { NextResponse } from "next/server";
import { AppError } from "./errors";
export { AppError };
import { ZodError } from "zod";
import { Prisma } from "../app/generated/prisma";
import { logger } from "./logger";
import { headers } from "next/headers";

export async function handleError(error: unknown) {
  const headerList = await headers();
  const traceId = headerList.get("x-request-id") || "unknown";

  // Custom AppError
  if (error instanceof AppError) {
    logger.warn({ traceId, code: error.code, details: error.details }, error.message);

    // Extract 'field' from details to present at the root level if requested
    const field = error.details && typeof error.details === 'object' && 'field' in error.details
      ? error.details.field
      : undefined;

    return NextResponse.json(
      {
        success: false,
        message: error.message,
        code: error.code,
        ...(field ? { field } : {}),
        ...(error.details && !field ? { details: error.details } : {}),
        traceId,
      },
      { status: error.statusCode }
    );
  }

  // Zod validation error
  if (error instanceof ZodError) {
    logger.warn({ traceId, details: error.issues }, "Validation error occurred");
    return NextResponse.json(
      {
        success: false,
        message: "Validation error",
        code: "VALIDATION_ERROR",
        errors: error.flatten().fieldErrors,
        traceId,
      },
      { status: 400 }
    );
  }

  // Prisma unique constraint error
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = error.meta?.target as string[] | string | undefined;
      console.log("DEBUG P2002 TARGET:", target); // DEBUGGING!

      let message = "Data sudah ada dalam sistem";

      const targetStr = Array.isArray(target) ? target.join(",") : (target || "");
      const errorMsg = error.message || "";
      const searchStr = (targetStr + " " + errorMsg).toLowerCase();

      if (searchStr.includes("productcode") || searchStr.includes("product_code")) {
        message = "Kode produk sudah digunakan";
      } else if (searchStr.includes("username")) {
        message = "Username sudah digunakan";
      } else if (searchStr.includes("email")) {
        message = "Email sudah terdaftar";
      } else if (searchStr.includes("variant_code")) {
        message = "Kode varian sudah digunakan";
      } else if (searchStr.includes("invoice_no")) {
        message = "Nomor invoice sudah digunakan";
      }

      let extractedField = Array.isArray(target) ? target[0] : target;
      if (!extractedField && error.message) {
        const match = error.message.match(/fields: \(`(.*?)`\)/) || error.message.match(/constraint: `(.*?)`/);
        if (match && match[1]) extractedField = match[1];
      }

      logger.warn({ traceId, extractedField }, "Duplicate entry error");
      return NextResponse.json(
        {
          success: false,
          message,
          code: "DUPLICATE_ENTRY",
          field: extractedField,
          traceId,
        },
        { status: 409 }
      );
    }


    if (error.code === "P2025") {
      const cause = error.meta?.cause as string | undefined;
      const modelName = error.meta?.modelName as string | undefined;

      // Deteksi jika P2025 karena gagal melakukan 'connect' ke tabel relasi (misal kategori tidak ada)
      if (cause && (cause.includes("nested connect") || cause.includes("relation"))) {
        logger.warn({ traceId, cause, modelName }, "Invalid reference during connect");
        return NextResponse.json(
          {
            success: false,
            message: "Data referensi tidak valid atau tidak ditemukan",
            code: "INVALID_REFERENCE",
            details: cause,
            traceId,
          },
          { status: 400 }
        );
      }

      logger.warn({ traceId, cause, modelName }, "Record not found");
      return NextResponse.json(
        {
          success: false,
          message: "Data tidak ditemukan",
          code: "NOT_FOUND",
          details: cause || (modelName ? `${modelName} not found` : undefined),
          traceId,
        },
        { status: 404 }
      );
    }

    if (error.code === "P2003") {
      const target = error.meta?.field_name as string | undefined;
      logger.warn({ traceId, target }, "Foreign key constraint failed");
      return NextResponse.json(
        {
          success: false,
          message: "Data referensi tidak valid atau tidak ditemukan",
          code: "INVALID_REFERENCE",
          field: target,
          traceId,
        },
        { status: 400 }
      );
    }
  }

  // Database Connection Error or other Prisma Errors
  if (error instanceof Prisma.PrismaClientInitializationError || error instanceof Prisma.PrismaClientRustPanicError) {
    logger.error({ traceId, error: (error as any).message }, "Database connection error");
    return NextResponse.json(
      {
        success: false,
        message: "Gagal terhubung ke database",
        code: "DATABASE_ERROR",
        traceId,
      },
      { status: 503 }
    );
  }

  // Default error
  const message = error instanceof Error ? error.message : "Internal Server Error";
  const lowerMessage = message.toLowerCase();

  // Tangkap error parsing payload (FormData / JSON yang formatnya salah)
  if (
    lowerMessage.includes("failed to fetch") ||
    lowerMessage.includes("boundary not found") ||
    lowerMessage.includes("unexpected end of form") ||
    lowerMessage.includes("unexpected token") ||
    lowerMessage.includes("invalid json") ||
    lowerMessage.includes("multipart/form-data")
  ) {
    logger.warn({ traceId, error: message }, "Invalid request payload format");
    return NextResponse.json(
      {
        success: false,
        message: "Format request tidak valid (Harap cek apakah harus menggunakan JSON atau FormData)",
        code: "INVALID_PAYLOAD_FORMAT",
        traceId,
      },
      { status: 400 }
    );
  }

  logger.error({ traceId, stack: error instanceof Error ? error.stack : undefined }, message);

  return NextResponse.json(
    {
      success: false,
      message: "Terjadi kesalahan pada server",
      code: "INTERNAL_SERVER_ERROR",
      traceId,
    },
    { status: 500 }
  );
}
