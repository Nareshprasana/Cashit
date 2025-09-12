// File: prisma/seed.js

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 🔑 Pre-hash passwords
  const adminPassword = await bcrypt.hash("admin123", 10);
  const agentPassword = await bcrypt.hash("agent123", 10);

  // Admin
  await prisma.user.upsert({
    where: { email: "nareshprasanna965@gmail.com" },
    update: {},
    create: {
      name: "Admin",
      username: "admin",
      email: "nareshprasanna965@gmail.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Agent
  await prisma.user.upsert({
    where: { email: "agent@example.com" },
    update: {},
    create: {
      name: "Agent User",
      username: "agent1",
      email: "agent@example.com",
      password: agentPassword,
      role: "AGENT",
    },
  });

  console.log("✅ Admin and Agent seeded.");
}

main()
  .catch((error) => {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
