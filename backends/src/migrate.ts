import { execFileSync } from 'child_process';
import { join } from 'path';

/**
 * Lambda that applies database migrations (`prisma migrate deploy`). Same image as the API, different handler:
 * the API itself never migrates on start, because many Lambda instances could start at once.
 *
 *   aws lambda invoke --function-name forum500-dev-migrate out.json             → migrate deploy
 *   aws lambda invoke --function-name forum500-dev-migrate \
 *     --cli-binary-format raw-in-base64-out --payload '{"action":"status"}' out.json  → migrate status
 */
export const handler = async (event: { action?: 'deploy' | 'status' } = {}) => {
  const action = event.action === 'status' ? 'status' : 'deploy';
  const cli = join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js');
  try {
    const output = execFileSync(process.execPath, [cli, 'migrate', action], {
      encoding: 'utf8',
      // Lambda only allows writes under /tmp.
      env: { ...process.env, HOME: '/tmp', PRISMA_HIDE_UPDATE_MESSAGE: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    console.log(output);
    return { ok: true, action, output };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; message: string };
    const output = `${err.stdout ?? ''}\n${err.stderr ?? ''}`.trim() || err.message;
    console.error(output);
    // `status` exits non-zero when migrations are pending; that is an answer, not a failure.
    return { ok: action === 'status', action, output };
  }
};
