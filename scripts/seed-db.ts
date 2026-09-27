import { seedDemoTournament } from '../lib/seed-service';

async function main() {
  console.log('Seeding BGMI Pro Invitational 2026 demo tournament...');
  const tournament = await seedDemoTournament();
  console.log(`✅ Successfully seeded: ${tournament.name} (ID: ${tournament.id})`);
}

main().catch((err) => {
  console.error('Failed to seed:', err);
  process.exit(1);
});
