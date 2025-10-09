// lib/prisma.js
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// ✅ Reuse Prisma client during hot reloads (development)
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"], // or ['query'] if you need verbose logs
  });

// ✅ Optional health check helper (you can call this manually)
export async function checkConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("❌ Database connection lost, reconnecting...");
    try {
      await prisma.$disconnect();
      globalForPrisma.prisma = new PrismaClient();
      console.log("✅ Reconnected to database successfully");
    } catch (reconnectError) {
      console.error("⚠️ Reconnection failed:", reconnectError);
    }
    return false;
  }
}

// ✅ Ensure singleton pattern for dev (to avoid too many connections)
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
