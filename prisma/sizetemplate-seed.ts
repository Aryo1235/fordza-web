import { PrismaClient } from "../app/generated/prisma/client";

export async function seedSizeTemplates(prisma: PrismaClient) {
    const templates = [
        {
            name: "Sepatu EU",
            type: "shoes",
            sizes: ["38", "39", "40", "41", "42", "43", "44"],
        },
        {
            name: "Apparel Shirt",
            type: "apparel",
            sizes: ["S", "M", "L", "XL", "XXL"],
        },
        {
            name: "Free Size",
            type: "accessories",
            sizes: ["Free Size"],
        },
    ];
    for (const template of templates) {
        const existing = await prisma.sizeTemplate.findFirst({
            where: {
                name: template.name,
                type: template.type,
            },
        });

        if (!existing) {
            await prisma.sizeTemplate.create({
                data: template,
            });
        }
    }

    console.log("✅ Size Template selesai");
}