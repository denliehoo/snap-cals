import { PrismaClient } from ".prisma/admin-client";

const adminPrisma = new PrismaClient();

export default adminPrisma;
