import { NextResponse } from "next/server";
import { AdminService } from "@/backend/services/admin.service";
import bcrypt from "bcryptjs";

// PATCH: Update user
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { username, password, name, role, pin } = body;

    const data: any = {};
    if (username) data.username = username;
    if (name) data.name = name;
    if (role) data.role = role;
    if (pin) data.pin = pin;

    // Hash password jika ada perubahan
    if (password) {
      data.password = await bcrypt.hash(password, 12);
    }

    const updated = await AdminService.updateUser(id, data);

    return NextResponse.json({
      success: true,
      message: "User berhasil diperbarui",
      data: { id: updated.id, username: updated.username },
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/users/[id] error:", error.message);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui user" },
      { status: 500 }
    );
  }
}

// DELETE: Hapus user
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await AdminService.deleteUser(id);

    return NextResponse.json({
      success: true,
      message: "User berhasil dihapus",
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/users/[id] error:", error.message);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus user" },
      { status: 500 }
    );
  }
}
