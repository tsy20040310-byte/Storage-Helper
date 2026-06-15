import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { phone: "13800000000" },
    update: {},
    create: {
      phone: "13800000000",
      role: "client",
      profile: {
        create: {
          nickname: "client-demo",
          gender: "female",
          cityCode: "110100"
        }
      }
    }
  });

  await prisma.user.upsert({
    where: { phone: "13900000000" },
    update: {},
    create: {
      phone: "13900000000",
      role: "organizer",
      profile: {
        create: {
          nickname: "organizer-demo",
          gender: "female",
          cityCode: "110100"
        }
      }
    }
  });
}

main().finally(async () => {
  await prisma.$disconnect();
});
