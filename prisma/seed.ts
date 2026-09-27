import { resetDemoTournament } from '../lib/seed-service';
import { disconnectDb } from '../lib/db';

async function main() {
  console.log('🚀 Seeding BGMI Pro Invitational 2026 demo tournament...');
  const tournament = await resetDemoTournament();
  console.log(`✅ Successfully seeded tournament: "${tournament.name}" (ID: ${tournament.id})`);
}

main()
  .catch((err) => {
    console.error('❌ Failed to seed database:', err);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDb();
  });
