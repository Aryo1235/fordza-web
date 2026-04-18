import { NextResponse } from "next/server";
import { AdminService } from "@/backend/services/admin.service";
import { Role } from "@/app/generated/prisma/client";
import bcrypt from "bcryptjs";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

// GET: List all users
export async function GET() {
  try {
    const users = await AdminService.getAllUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error("GET /api/admin/users error:", errorMessage);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil daftar user" },
      { status: 500 }
    );
  }
}

// POST: Create new user
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, name, role, pin } = body;

    if (!username || !password || !role) {
      return NextResponse.json(
        { success: false, message: "Username, password, dan role wajib diisi" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const hashedPin = pin ? await bcrypt.hash(String(pin), 12) : undefined;

    const normalizedRole = role === "ADMIN" ? Role.ADMIN : Role.KASIR;

    const newUser = await AdminService.create({
      username,
      password: hashedPassword,
      name,
      role: normalizedRole,
      pin: hashedPin,
    });

    return NextResponse.json({
      success: true,
      message: "User berhasil dibuat",
      data: { id: newUser.id, username: newUser.username },
    });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error("POST /api/admin/users error:", errorMessage);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { success: false, message: "Username sudah digunakan" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Gagal membuat user" },
      { status: 500 }
    );
  }
}
