import { PrismaClient, Role } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";

export async function seedAdmin(prisma: PrismaClient) {
    const hashedPassword = await bcrypt.hash("fordza2026", 12);

    const accounts = [
        {
            username: "admin",
            password: hashedPassword,
            name: "Admin Fordza",
            role: Role.ADMIN,
            pin: "123456",
        },
        {
            username: "kasir",
            password: hashedPassword,
            name: "Kasir",
            role: Role.KASIR,
            pin: "223344",
        },
    ];

    for (const account of accounts) {
        await prisma.admin.upsert({
            where: {
                username: account.username,
            },
            update: {},
            create: account,
        });
    }

    console.log("✅ Admin & Kasir berhasil di-seed");
}