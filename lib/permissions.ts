import { auth } from '@clerk/nextjs/server';

/**
 * Available permissions in the system
 * Aligned with role descriptions in NEXT_STEPS.md
 */
export type Permission =
  | 'leads:read'        // View leads
  | 'leads:write'       // Create/edit leads
  | 'leads:approve'     // Approve/reject leads
  | 'leads:delete'      // Delete leads
  | 'leads:export'      // Export lead data
  | 'leads:comment'     // Add comments/notes to leads
  | 'leads:view_all'    // View all leads (alias for leads:read)
  | 'leads:edit'        // Edit leads (alias for leads:write)
  | 'workflows:read'    // View workflow history
  | 'workflows:cancel'  // Cancel running workflows
  | 'team:invite'       // Invite new team members
  | 'team:manage'       // Full team management (remove, change roles)
  | 'org:manage'        // Manage organization settings
  | 'billing:manage'    // View and manage billing/subscription
  | 'analytics:view';   // View analytics and reports

/**
 * Role-based permission mappings
 * Defines which permissions each Clerk organization role has
 * See NEXT_STEPS.md for detailed role descriptions
 */
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  /**
   * org:admin (Owner/Administrator)
   * - Full control over the organization
   * - Can manage team members, billing, and all settings
   */
  'org:admin': [
    'leads:read',
    'leads:write',
    'leads:approve',
    'leads:delete',
    'leads:export',
    'leads:comment',
    'leads:view_all',
    'leads:edit',
    'workflows:read',
    'workflows:cancel',
    'team:invite',
    'team:manage',
    'org:manage',
    'billing:manage',
    'analytics:view',
  ],

  /**
   * org:manager (Team Manager)
   * - Can manage leads and approve them
   * - Can invite team members but cannot change admin roles
   * - Cannot modify billing or organization settings
   */
  'org:manager': [
    'leads:read',
    'leads:write',
    'leads:approve',
    'leads:export',
    'leads:comment',
    'leads:view_all',
    'leads:edit',
    'workflows:read',
    'team:invite',
    'analytics:view',
  ],

  /**
   * org:member (Standard User)
   * - Read-only access to leads
   * - Can add comments but cannot approve or export
   */
  'org:member': [
    'leads:read',
    'leads:comment',
    'workflows:read',
    'analytics:view',
  ],
};

/**
 * Check if the current user has a specific permission
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const { orgRole } = await auth();

  if (!orgRole) {
    return false;
  }

  const allowedPermissions = ROLE_PERMISSIONS[orgRole] || [];
  return allowedPermissions.includes(permission);
}

/**
 * Require a specific permission - throws error if user doesn't have it
 */
export async function requirePermission(permission: Permission): Promise<void> {
  const allowed = await hasPermission(permission);

  if (!allowed) {
    throw new Error(`Forbidden: Missing required permission '${permission}'`);
  }
}

/**
 * Get the current user's organization role
 */
export async function getOrgRole(): Promise<string | null> {
  const { orgRole } = await auth();
  return orgRole ?? null;
}

/**
 * Check if the current user has any of the specified permissions
 */
export async function hasAnyPermission(...permissions: Permission[]): Promise<boolean> {
  for (const permission of permissions) {
    if (await hasPermission(permission)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if the current user has all of the specified permissions
 */
export async function hasAllPermissions(...permissions: Permission[]): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await hasPermission(permission))) {
      return false;
    }
  }
  return true;
}

/**
 * Get all permissions for the current user's role
 */
export async function getUserPermissions(): Promise<Permission[]> {
  const { orgRole } = await auth();

  if (!orgRole) {
    return [];
  }

  return ROLE_PERMISSIONS[orgRole] || [];
}
