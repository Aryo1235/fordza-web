import { NextResponse } from "next/server";
import { AppError } from "./errors";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export function handleError(error: unknown) {
  // Custom AppError
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  // Zod validation error
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        message: "Validation error",
        code: "VALIDATION_ERROR",
        details: error.errors,
      },
      { status: 400 }
    );
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          message: "Data sudah ada",
          code: "DUPLICATE_ERROR",
          details: error.meta,
        },
        { status: 409 }
      );
    }

    // Record not found
    if (error.code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          message: "Data tidak ditemukan",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Foreign key constraint violation
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          message: "Data terkait tidak ditemukan",
          code: "FOREIGN_KEY_ERROR",
        },
        { status: 400 }
      );
    }
  }

  // Unknown error
  console.error("Unhandled error:", error);
  return NextResponse.json(
    {
      success: false,
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    },
    { status: 500 }
  );
}
