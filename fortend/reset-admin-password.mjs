import { hashPassword } from "better-auth/crypto";
import pg from "pg";

const newPassword = process.argv[2];
if (!newPassword) {
  console.error("Please provide a new password! Example:\nnode reset-admin-password.mjs 'MyNewPassword123'");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_JGCUhO9KwMq5@ep-divine-credit-a1c964uz-pooler.ap-southeast-1.aws.neon.tech/chatbot?sslmode=require";

async function resetPassword() {
  const pool = new pg.Pool({ connectionString });
  const hashedPassword = await hashPassword(newPassword);

  const client = await pool.connect();
  try {
    const res = await client.query(
      `UPDATE account SET password = $1 WHERE "userId" IN (SELECT id FROM "user" WHERE email = 'admin@zeva.app')`,
      [hashedPassword]
    );

    if (res.rowCount === 0) {
      console.log("No account found for admin@zeva.app. Please make sure the user exists first.");
    } else {
      console.log(`✅ Success! Password for admin@zeva.app has been changed to '${newPassword}'.`);
    }
  } catch (err) {
    console.error("❌ Failed to update password:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

resetPassword();
