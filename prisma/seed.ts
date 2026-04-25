import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const hash = (pw: string) => bcrypt.hash(pw, 10);

  const manager = await prisma.salesperson.upsert({
    where: { email: "manager@company.com" },
    update: {},
    create: {
      name: "김상사",
      email: "manager@company.com",
      password: await hash("password123"),
      department: "영업1팀",
      position: "과장",
    },
  });

  await prisma.salesperson.upsert({
    where: { email: "hong@company.com" },
    update: {},
    create: {
      name: "홍길동",
      email: "hong@company.com",
      password: await hash("password123"),
      department: "영업1팀",
      position: "사원",
      managerId: manager.id,
    },
  });

  await prisma.salesperson.upsert({
    where: { email: "kim@company.com" },
    update: {},
    create: {
      name: "김영업",
      email: "kim@company.com",
      password: await hash("password123"),
      department: "영업1팀",
      position: "사원",
      managerId: manager.id,
    },
  });

  await prisma.customer.upsert({
    where: { companyName: "(주)ABC상사" },
    update: {},
    create: {
      companyName: "(주)ABC상사",
      contactName: "이철수",
      phone: "02-1234-5678",
      email: "lee@abc.co.kr",
      industry: "제조업",
    },
  });

  await prisma.customer.upsert({
    where: { companyName: "DEF전자" },
    update: {},
    create: {
      companyName: "DEF전자",
      contactName: "박영희",
      phone: "031-234-5678",
      email: "park@def.co.kr",
      industry: "전자",
    },
  });

  console.log("Seed completed");
}

main().finally(() => prisma.$disconnect());
