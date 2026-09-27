import { db } from "../src/lib/db";

async function main() {
  const church = await db.church.upsert({
    where: { id: "demo-church" },
    update: {},
    create: { id: "demo-church", name: "Demo Church" },
  });
  console.log(`Seed ok: ${church.name} (${church.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
