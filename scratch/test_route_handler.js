// Setup env variables manually at the absolute top
require("dotenv").config();

const { GET } = require("../app/api/admin/size-templates/[id]/route.ts");
const { PrismaClient } = require("../app/generated/prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

async function run() {
  try {
    const templates = await prisma.sizeTemplate.findMany({
      take: 1,
    });
    
    if (templates.length === 0) {
      console.log("No templates found in DB.");
      return;
    }
    
    const id = templates[0].id;
    console.log("Testing API route for template ID:", id);

    // Mock Next.js Request object
    const req = {
      url: `http://localhost:3000/api/admin/size-templates/${id}?page=1&limit=5`
    };
    
    const params = Promise.resolve({ id });
    
    const response = await GET(req, { params });
    const json = await response.json();
    
    console.log("API Handler Response status:", response.status);
    console.log("API Handler Response JSON:");
    console.log(JSON.stringify(json, null, 2));
    
  } catch (error) {
    console.error("Error executing API handler test:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
