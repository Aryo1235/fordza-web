import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper: Generate nomor invoice unik harian
async function generateInvoiceNo(): Promise<string> {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, ""); // "20260408"

  // Hitung transaksi yang sudah ada hari ini
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const count = await prisma.transaction.count({
    where: {
      createdAt: { gte: startOfDay, lte: endOfDay },
    },
  });

  const sequence = String(count + 1).padStart(4, "0"); // "0001"
  return `FDZ-${datePart}-${sequence}`;
}

// GET: Riwayat transaksi
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: any = {};

    if (search) {
      where.invoiceNo = { contains: search, mode: "insensitive" };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          kasir: { select: { name: true, username: true } },
          items: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: transactions.map((t) => ({
        ...t,
        totalPrice: Number(t.totalPrice),
        amountPaid: Number(t.amountPaid),
        change: Number(t.change),
        items: t.items.map((i) => ({
          ...i,
          priceAtSale: Number(i.priceAtSale),
        })),
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error("GET /api/kasir/transactions error:", error.message);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil riwayat transaksi" },
      { status: 500 },
    );
  }
}

// POST: Proses transaksi baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, amountPaid } = body;

    // Ambil kasir ID dari header (diset oleh middleware)
    const kasirId = request.headers.get("x-user-id");

    if (!kasirId) {
      return NextResponse.json(
        { success: false, message: "Sesi kasir tidak valid" },
        { status: 401 },
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Keranjang belanja kosong" },
        { status: 400 },
      );
    }

    if (!amountPaid || amountPaid <= 0) {
      return NextResponse.json(
        { success: false, message: "Nominal pembayaran tidak valid" },
        { status: 400 },
      );
    }

    // Ambil data produk dari DB untuk validasi stok & harga
    const productIds = items.map((i: any) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    // Hitung total & validasi stok
    let totalPrice = 0;
    const validatedItems: { productId: string; quantity: number; priceAtSale: number; productName: string }[] = [];

    for (const item of items) {
      const dbProduct = dbProducts.find((p) => p.id === item.productId);

      if (!dbProduct) {
        return NextResponse.json(
          { success: false, message: `Produk tidak ditemukan: ${item.productId}` },
          { status: 400 },
        );
      }

      if (dbProduct.stock < item.quantity) {
        return NextResponse.json(
          { success: false, message: `Stok ${dbProduct.name} tidak cukup (tersisa ${dbProduct.stock})` },
          { status: 400 },
        );
      }

      const price = Number(dbProduct.price);
      totalPrice += price * item.quantity;

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtSale: price,
        productName: dbProduct.name,
      });
    }

    if (amountPaid < totalPrice) {
      return NextResponse.json(
        { success: false, message: "Nominal pembayaran kurang dari total belanja" },
        { status: 400 },
      );
    }

    const change = amountPaid - totalPrice;
    const invoiceNo = await generateInvoiceNo();

    // ACID Transaction: simpan + kurangi stok dalam 1 operasi atomic
    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Buat record Transaction
      const newTransaction = await tx.transaction.create({
        data: {
          invoiceNo,
          totalPrice,
          amountPaid,
          change,
          status: "PAID",
          kasirId,
          items: {
            create: validatedItems.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              priceAtSale: i.priceAtSale,
              productName: i.productName,
            })),
          },
        },
        include: {
          items: true,
          kasir: { select: { name: true, username: true } },
        },
      });

      // 2. Kurangi stok masing-masing produk
      await Promise.all(
        validatedItems.map((i) =>
          tx.product.update({
            where: { id: i.productId },
            data: { stock: { decrement: i.quantity } },
          }),
        ),
      );

      return newTransaction;
    });

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil",
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
    console.error("POST /api/kasir/transactions error:", error.message);
    return NextResponse.json(
      { success: false, message: "Gagal memproses transaksi" },
      { status: 500 },
    );
  }
}
