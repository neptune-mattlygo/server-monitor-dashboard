import type { Profile } from '@/lib/supabase';

export type UserRole = 'admin' | 'editor' | 'viewer';

// Check if user has specific role
export function hasRole(user: Profile | null, requiredRole: UserRole): boolean {
  if (!user) return false;

  const roleHierarchy: Record<UserRole, number> = {
    admin: 3,
    editor: 2,
    viewer: 1,
  };

  const userLevel = roleHierarchy[user.role];
  const requiredLevel = roleHierarchy[requiredRole];

  return userLevel >= requiredLevel;
}

// Check if user is admin
export function isAdmin(user: Profile | null): boolean {
  return hasRole(user, 'admin');
}

// Check if user is editor or admin
export function isEditor(user: Profile | null): boolean {
  return hasRole(user, 'editor');
}

// Check if user can create resource
export function canCreate(user: Profile | null, resourceType: string): boolean {
  if (!user) return false;

  switch (resourceType) {
    case 'server':
    case 'host':
      return hasRole(user, 'editor');
    case 'user':
    case 'webhook':
      return hasRole(user, 'admin');
    default:
      return false;
  }
}

// Check if user can update resource
export function canUpdate(user: Profile | null, resourceType: string): boolean {
  if (!user) return false;

  switch (resourceType) {
    case 'server':
    case 'host':
      return hasRole(user, 'editor');
    case 'user':
    case 'webhook':
      return hasRole(user, 'admin');
    default:
      return false;
  }
}

// Check if user can delete resource
export function canDelete(user: Profile | null, resourceType: string): boolean {
  if (!user) return false;

  // Only admins can delete
  return hasRole(user, 'admin');
}

// Check if user can view resource
export function canView(user: Profile | null, resourceType: string): boolean {
  if (!user) return false;

  // All authenticated users can view servers, hosts, events
  if (['server', 'host', 'event'].includes(resourceType)) {
    return true;
  }

  // Only admins can view users, webhooks, audit logs
  if (['user', 'webhook', 'audit'].includes(resourceType)) {
    return hasRole(user, 'admin');
  }

  return false;
}

// Get role badge color
export function getRoleBadgeColor(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800';
    case 'editor':
      return 'bg-blue-100 text-blue-800';
    case 'viewer':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Get role display name
export function getRoleDisplayName(role: UserRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
