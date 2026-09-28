import { db } from '../lib/db';

async function main() {
  console.log('Resetting database to clean book slate...');
  await db.auditLog.deleteMany();
  await db.notification.deleteMany();
  await db.teamMatchScore.deleteMany();
  await db.matchTeam.deleteMany();
  await db.room.deleteMany();
  await db.match.deleteMany();
  await db.dispute.deleteMany();
  await db.penalty.deleteMany();
  await db.attendance.deleteMany();
  await db.group.deleteMany();
  await db.player.deleteMany();
  await db.team.deleteMany();
  await db.tournamentSettings.deleteMany();
  await db.scoringRule.deleteMany();
  await db.tournament.deleteMany();
  console.log('✅ Database is now completely empty (Clean Book).');
}

main()
  .catch((err) => {
    console.error('Error cleaning database:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
