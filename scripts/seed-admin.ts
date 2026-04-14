import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Missing DATABASE_URL_UNPOOLED or DATABASE_URL in environment');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'devstack@mountaincre8.com';
  const username = 'devstack@mountaincre8.com';
  const password = 'PSWD]]20226';
  const role = 'admin';

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashed,
      role,
    },
    create: {
      username,
      email,
      password: hashed,
      role,
    },
  });

  console.log(`Admin user seeded: ${user.email} (role: ${user.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
