import { PrismaLibSql } from "@prisma/adapter-libsql";
import prismaPkg from "@prisma/client";

const { PrismaClient } = prismaPkg;

const globalForPrisma = globalThis as unknown as { prisma?: InstanceType<typeof PrismaClient> };

function createClient() {
  const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
