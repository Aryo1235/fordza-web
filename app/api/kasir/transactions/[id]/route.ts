import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Detail satu transaksi
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        items: true,
        kasir: { select: { name: true, username: true, role: true } },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: "Transaksi tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...transaction,
        totalPrice: Number(transaction.totalPrice),
        amountPaid: Number(transaction.amountPaid),
        change: Number(transaction.change),
        items: transaction.items.map((i) => ({
          ...i,
          priceAtSale: Number(i.priceAtSale),
        })),
      },
    });
  } catch (error: any) {
    console.error("GET /api/kasir/transactions/[id] error:", error.message);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil detail transaksi" },
      { status: 500 },
    );
  }
}

// PATCH: VOID transaksi (hanya ADMIN)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const role = request.headers.get("x-user-role");

    if (role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Hanya Admin yang dapat membatalkan transaksi" },
        { status: 403 },
      );
    }

    const transaction = await prisma.transaction.findUnique({ where: { id } });

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: "Transaksi tidak ditemukan" },
        { status: 404 },
      );
    }

    if (transaction.status === "VOID") {
      return NextResponse.json(
        { success: false, message: "Transaksi sudah berstatus VOID" },
        { status: 400 },
      );
    }

    // VOID: kembalikan stok
    const items = await prisma.transactionItem.findMany({ where: { transactionId: id } });

    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id },
        data: { status: "VOID" },
      });

      await Promise.all(
        items.map((i) =>
          tx.product.update({
            where: { id: i.productId },
            data: { stock: { increment: i.quantity } },
          }),
        ),
      );
    });

    return NextResponse.json({ success: true, message: "Transaksi berhasil di-VOID dan stok dikembalikan" });
  } catch (error: any) {
    console.error("PATCH /api/kasir/transactions/[id] error:", error.message);
    return NextResponse.json(
      { success: false, message: "Gagal membatalkan transaksi" },
      { status: 500 },
    );
  }
}
