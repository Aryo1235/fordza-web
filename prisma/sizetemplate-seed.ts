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
        {
            name: "Parfum Standard",
            type: "Parfum",
            sizes: ["30ml", "50ml", "100ml"],
            measurements: {
                "30ml": { volume: "30", berat: "100" },
                "50ml": { volume: "50", berat: "150" },
                "100ml": { volume: "100", berat: "250" }
            }
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