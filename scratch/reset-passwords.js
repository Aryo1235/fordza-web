const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  try {
    console.log("🔄 Resetting database user credentials...");
    const hashedPassword = await bcrypt.hash("fordza2026", 12);

    // Reset admin user
    const adminCheck = await pool.query("SELECT id FROM admins WHERE username = 'admin'");
    if (adminCheck.rows.length > 0) {
      await pool.query(
        "UPDATE admins SET password = $1, role = 'ADMIN', pin = '123456', name = 'Admin Fordza' WHERE username = 'admin'",
        [hashedPassword]
      );
      console.log("✅ Admin user credentials updated successfully.");
    } else {
      await pool.query(
        "INSERT INTO admins (id, username, password, role, pin, name, created_at, updated_at) VALUES ('admin-id', 'admin', $1, 'ADMIN', '123456', 'Admin Fordza', NOW(), NOW())",
        [hashedPassword]
      );
      console.log("✅ Admin user created successfully.");
    }

    // Reset kasir user
    const kasirCheck = await pool.query("SELECT id FROM admins WHERE username = 'kasir'");
    if (kasirCheck.rows.length > 0) {
      await pool.query(
        "UPDATE admins SET password = $1, role = 'KASIR', pin = '223344', name = 'Kasir Toko' WHERE username = 'kasir'",
        [hashedPassword]
      );
      console.log("✅ Kasir user credentials updated successfully.");
    } else {
      await pool.query(
        "INSERT INTO admins (id, username, password, role, pin, name, created_at, updated_at) VALUES ('kasir-id', 'kasir', $1, 'KASIR', '223344', 'Kasir Toko', NOW(), NOW())",
        [hashedPassword]
      );
      console.log("✅ Kasir user created successfully.");
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error resetting credentials:", err);
    process.exit(1);
  }
}

main();
