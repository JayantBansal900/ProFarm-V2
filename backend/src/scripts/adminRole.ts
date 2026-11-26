/**
 * Grants or removes admin access from the command line. Sign-up never creates admins.
 *   npm run admin:grant  -- farmer@example.com
 *   npm run admin:revoke -- farmer@example.com
 */
import { prisma } from '../lib/prisma';
import { setRoleByEmail, type Role } from '../services/admin.service';

async function main() {
  const [command, email] = process.argv.slice(2);
  if ((command !== 'grant' && command !== 'revoke') || !email) {
    console.error('Usage: adminRole <grant|revoke> <email>');
    process.exitCode = 1;
    return;
  }
  const role: Role = command === 'grant' ? 'admin' : 'user';
  const result = await setRoleByEmail(email, role);
  const messages = {
    changed: command === 'grant' ? `${email} is now an admin. They must turn on two-step verification to use the admin panel.` : `${email} is no longer an admin.`,
    unchanged: `${email} already has the ${role} role. Nothing changed.`,
    not_found: `No account found for ${email}. Ask them to sign up first.`,
  };
  console.log(messages[result]);
  if (result === 'not_found') process.exitCode = 1;
}

main().catch((error) => { console.error('Failed:', error instanceof Error ? error.message : error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
