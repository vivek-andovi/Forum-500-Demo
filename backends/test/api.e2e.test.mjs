/**
 * End-to-end API tests. They run against a live API on a freshly seeded database and
 * change data (profile edits, suspensions), so NEVER point them at a real database.
 *
 *   npm run db:seed && npm run build && PORT=4100 node dist/main &
 *   API_URL=http://localhost:4100/api npm run test:e2e
 *
 * CI (backend-ci-deploy.yml) does exactly this against a throwaway Postgres.
 * Add a test here whenever you fix a bug, so it stays fixed.
 */
import assert from 'node:assert/strict';
import { before, describe, test } from 'node:test';

const API = process.env.API_URL ?? 'http://localhost:4000/api';

async function call(method, path, token, body) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}
const get = (path, token) => call('GET', path, token);
const post = (path, token, body = {}) => call('POST', path, token, body);
const rows = (list) => list.items ?? list.data ?? list.rows ?? list;

async function login(email, password) {
  const res = await post('/auth/login', null, { email, password });
  assert.ok(res.status < 300 && res.data.accessToken, `login ${email} failed (${res.status}): ${res.data.message}`);
  return res.data.accessToken;
}

let admin;
let member; // anish@forum500.club, a published seed member

before(async () => {
  assert.equal((await get('/health')).status, 200, `API not reachable at ${API}`);
  admin = await login('admin@forum500.club', 'Admin@12345');
  member = await login('anish@forum500.club', 'Member@12345');
});

describe('privacy: members never receive other members’ contact details', () => {
  test('directory list omits email, phone, userId and profileDraft', async () => {
    const { data } = await get('/v1/members', member);
    assert.ok(data.length > 0);
    for (const m of data) {
      for (const field of ['email', 'phone', 'userId', 'profileDraft']) assert.ok(!(field in m), `${m.slug} exposes ${field}`);
    }
  });

  test('event hosts omit contact fields', async () => {
    const { data } = await get('/v1/events', member);
    const hosts = data.flatMap((e) => e.hosts ?? []).map((h) => h.member).filter(Boolean);
    assert.ok(hosts.length > 0, 'seed should have hosted events');
    for (const h of hosts) assert.ok(!('email' in h) && !('phone' in h), `${h.slug} exposes contact details`);
  });
});

describe('profile edits go live only after admin approval', () => {
  test('save draft → submit → approve', async () => {
    const live = (await get('/v1/members/anish', member)).data.headline;

    const draft = await call('PATCH', '/v1/me/profile', member, { headline: 'Draft headline' });
    assert.equal(draft.data.member.headline, live, 'draft must not change the live profile');
    assert.equal(draft.data.member.profileDraft.headline, 'Draft headline');
    assert.equal((await get('/v1/members/anish', member)).data.headline, live);

    const submitted = await post('/v1/me/profile/submit', member, { headline: 'Approved headline' });
    assert.equal(submitted.data.member.profileDraft, null, 'submitting replaces the draft');
    assert.equal(submitted.data.pendingRevision.status, 'pending');

    const revision = rows((await get('/admin/r/profile-revisions?status=pending', admin)).data)[0];
    const generic = await post(`/admin/r/profile-revisions/${revision.id}/status`, admin, { status: 'approved' });
    assert.equal(generic.status, 400, 'approval must go through the workflow endpoint');

    assert.ok((await post(`/admin/profile-revisions/${revision.id}/approve`, admin)).status < 300);
    assert.equal((await get('/v1/members/anish', member)).data.headline, 'Approved headline');
  });
});

describe('admin: workflow statuses', () => {
  test('applications: manual statuses allowed, decisions only via workflow', async () => {
    const app = rows((await get('/admin/r/applications', admin)).data).find((a) => ['new', 'in_review'].includes(a.status));
    assert.ok(app, 'seed should have an undecided application');
    assert.ok((await post(`/admin/r/applications/${app.id}/status`, admin, { status: 'in_review' })).status < 300);
    assert.equal((await post(`/admin/r/applications/${app.id}/status`, admin, { status: 'approved' })).status, 400);
  });
});

describe('auth: suspension', () => {
  test('a suspended user cannot reactivate with an invite link, and login does not reveal suspension', async () => {
    const user = rows((await get('/admin/r/users?search=helena', admin)).data)[0];
    const invite = await post(`/admin/users/${user.id}/send-invite`, admin);
    const token = new URL(invite.data.devLink).searchParams.get('token');
    await post(`/admin/r/users/${user.id}/status`, admin, { status: 'suspended' });

    const res = await post('/auth/set-password', null, { token, password: 'Another@Pass123' });
    assert.equal(res.status, 401);
    assert.equal((await get(`/admin/r/users/${user.id}`, admin)).data.status, 'suspended');

    const wrong = await post('/auth/login', null, { email: user.email, password: 'not-the-password' });
    assert.equal(wrong.data.message, 'Invalid email or password');
  });
});

describe('member dashboard', () => {
  test('emails are only those addressed to this member; In:Forum teaser is published only', async () => {
    const dash = (await get('/v1/dashboard', member)).data;
    const inbox = new Set((await get('/v1/emails', member)).data.map((e) => e.id));
    for (const e of dash.emails) assert.ok(inbox.has(e.id), `dashboard shows email ${e.id} not in the member's inbox`);
    for (const a of dash.inforumArticles) assert.equal(a.status, 'published');
  });
});

describe('audit columns + soft delete', () => {
  const del = (path, token) => call('DELETE', path, token);

  test('admin create/update stamp the actor; delete hides the record and frees its unique name', async () => {
    const created = await post('/admin/r/sectors', admin, { name: 'E2E Soft Delete', createdBy: 'ignored', deletedAt: '2020-01-01' });
    assert.equal(created.status, 201);
    assert.equal(created.data._relations.createdBy, 'admin@forum500.club');
    assert.equal(created.data.deletedAt, null);
    const updated = await call('PATCH', `/admin/r/sectors/${created.data.id}`, admin, { sortOrder: 3 });
    assert.equal(updated.data._relations.updatedBy, 'admin@forum500.club');

    assert.equal((await del(`/admin/r/sectors/${created.data.id}`, admin)).status, 200);
    assert.equal((await get(`/admin/r/sectors/${created.data.id}`, admin)).status, 404);
    assert.equal((await del(`/admin/r/sectors/${created.data.id}`, admin)).status, 404);
    const again = await post('/admin/r/sectors', admin, { name: 'E2E Soft Delete' });
    assert.equal(again.status, 201, 'a deleted record must not block its unique name');
  });

  test('unlike / like again revives the like instead of hitting the unique key', async () => {
    const post0 = (await get('/v1/feed', member)).data.posts[0];
    const states = [];
    for (let i = 0; i < 3; i++) states.push((await post(`/v1/feed/${post0.id}/like`, member)).data.liked);
    assert.deepEqual(states.slice(1), [!states[0], states[0]]);
  });

  test('deleting a member works (its uuid userId is cleared, not suffixed)', async () => {
    const m = rows((await get('/admin/r/members?pageSize=100', admin)).data).find((x) => x.userId && x.slug !== 'anish' && !x.slug.startsWith('helena'));
    assert.equal((await del(`/admin/r/members/${m.id}`, admin)).status, 200);
    assert.equal((await get(`/admin/r/members/${m.id}`, admin)).status, 404);
  });

  test('deleting an event hides it and its RSVPs from members', async () => {
    const event = rows((await get('/admin/r/events?pageSize=100', admin)).data).at(-1);
    assert.equal((await del(`/admin/r/events/${event.id}`, admin)).status, 200);
    assert.ok(!JSON.stringify((await get('/v1/events', member)).data).includes(event.id));
    assert.ok(!rows((await get(`/admin/r/event-rsvps?filter.eventId=${event.id}`, admin)).data).length);
  });
});
