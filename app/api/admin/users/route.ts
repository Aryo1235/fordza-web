import { NextResponse } from "next/server";
import { AdminService } from "@/backend/services/admin.service";
import bcrypt from "bcryptjs";

// GET: List all users
export async function GET() {
  try {
    const users = await AdminService.getAllUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    console.error("GET /api/admin/users error:", error.message);
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

    const newUser = await AdminService.create({
      username,
      password: hashedPassword,
      name,
      // @ts-ignore
      role,
      pin,
    });

    return NextResponse.json({
      success: true,
      message: "User berhasil dibuat",
      data: { id: newUser.id, username: newUser.username },
    });
  } catch (error: any) {
    console.error("POST /api/admin/users error:", error.message);
    
    if (error.code === "P2002") {
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
