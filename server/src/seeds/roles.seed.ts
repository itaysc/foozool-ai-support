import { PermissionModel } from '../schemas/permission.schema';
import { RoleModel } from '../schemas/role.schema';
import { SeedTrackModel } from '../schemas/seedTrack.schema';

// Core permission keys. Extend as needed.
const basePermissions: string[] = [
  'auth:token.create',
  'users:read', 'users:create', 'users:update', 'users:delete',
  'organizations:read', 'organizations:update',
  'tickets:read', 'tickets:update', 'tickets:predict',
  'customers:read', 'customers:create', 'customers:update', 'customers:delete',
  'solutions:read', 'solutions:create', 'solutions:update', 'solutions:delete',
  'insights:read', 'insights:export', 'insights:meeting-prep',
  'slack:write',
  'anomalies:read', 'anomalies:recompute',
  'surveys:read', 'surveys:update', 'surveys:delete',
  'industries:read',
  'bots:read', 'bots:create', 'bots:update', 'bots:delete',
  'ai:thresholds:read', 'ai:thresholds:create', 'ai:thresholds:update', 'ai:thresholds:delete',
  'ai:logs:read', 'ai:actions:execute',
  'ai:customer-tiers:read', 'ai:customer-tiers:create', 'ai:customer-tiers:update',
  'model:train', 'model:stubdata:load',
  'jobs:trigger', 'predictions:read',
  'search:read',
  'webhooks:manage', 'crm:webhooks:manage', 'google:connect',
  'crm:read', 'crm:update',
  'news:read',
  'roles:read', 'roles:create', 'roles:update', 'roles:delete',
  'permissions:read', 'permissions:assign',
  'migrations:run', 'seeds:run',
];

const roleDefinitions: Array<{ name: string; description?: string; permissions: string[] }> = [
  {
    name: 'admin',
    description: 'Full access to all resources',
    permissions: [],
  },
  {
    name: 'manager',
    description: 'Manage users, customers, features, bots, and insights',
    permissions: [
      'users:read', 'users:create', 'users:update',
      'customers:read', 'customers:create', 'customers:update', 'customers:delete',
      'solutions:read', 'solutions:create', 'solutions:update', 'solutions:delete',
      'bots:read', 'bots:create', 'bots:update', 'bots:delete',
      'insights:read', 'insights:export', 'insights:meeting-prep', 'slack:write', 'news:read',
      'anomalies:read',
      'surveys:read', 'surveys:update', 'surveys:delete',
      'ai:thresholds:read', 'ai:thresholds:create', 'ai:thresholds:update', 'ai:thresholds:delete',
      'ai:logs:read', 'ai:customer-tiers:read', 'ai:customer-tiers:create', 'ai:customer-tiers:update',
      'predictions:read', 'search:read',
      'crm:read', 'crm:update',
    ],
  },
  {
    name: 'analyst',
    description: 'Read-only insights and analytics',
    permissions: [
      'insights:read', 'insights:export', 'insights:meeting-prep', 'anomalies:read', 'predictions:read', 'tickets:read',
      'customers:read', 'solutions:read', 'ai:logs:read', 'search:read', 'industries:read', 'news:read',
      'surveys:read',
    ],
  },
  {
    name: 'agent',
    description: 'Work tickets and customer updates',
    permissions: [
      'tickets:read', 'tickets:update', 'customers:read', 'customers:update', 'insights:read', 'search:read',
    ],
  },
  {
    name: 'ai_operator',
    description: 'Operate autonomous AI actions under guardrails',
    permissions: [
      'ai:actions:execute', 'ai:thresholds:read', 'ai:thresholds:update', 'ai:logs:read', 'tickets:read', 'customers:read', 'ai:customer-tiers:read',
    ],
  },
];

export async function seedRoles(): Promise<void> {
  const already = await SeedTrackModel.findOne({ name: 'roles', status: 'success' });
  if (already) return;

  // Idempotently upsert permissions
  for (const key of basePermissions) {
    await PermissionModel.updateOne(
      { key },
      { $setOnInsert: { key, name: key, description: '' } },
      { upsert: true }
    );
  }

  // Idempotently upsert roles
  for (const def of roleDefinitions) {
    await RoleModel.updateOne(
      { name: def.name },
      { $set: { description: def.description, permissions: def.permissions } },
      { upsert: true }
    );
  }

  await SeedTrackModel.create({ name: 'roles', date: new Date(), status: 'success' });
}


