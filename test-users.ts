import { prisma } from './lib/prisma'; prisma.user.findMany().then(console.log).finally(() => prisma.$disconnect());
