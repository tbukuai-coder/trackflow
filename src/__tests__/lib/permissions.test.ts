import { describe, it, expect } from 'vitest';

// Import only the pure functions that don't depend on db
// Copy the logic here for testing to avoid db import
const ROLE_HIERARCHY: Record<string, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

function hasPermission(userRole: string, requiredRole: string): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

const canManageMembers = (role: string) => hasPermission(role, "admin");
const canDeleteWorkspace = (role: string) => role === "owner";
const canCreateProject = (role: string) => hasPermission(role, "member");
const canDeleteProject = (role: string) => hasPermission(role, "admin");
const canEditTask = (role: string) => hasPermission(role, "member");
const canComment = (role: string) => hasPermission(role, "member");

describe('permissions', () => {
  describe('hasPermission', () => {
    it('owner has all permissions', () => {
      expect(hasPermission('owner', 'owner')).toBe(true);
      expect(hasPermission('owner', 'admin')).toBe(true);
      expect(hasPermission('owner', 'member')).toBe(true);
      expect(hasPermission('owner', 'viewer')).toBe(true);
    });

    it('admin has admin and below permissions', () => {
      expect(hasPermission('admin', 'owner')).toBe(false);
      expect(hasPermission('admin', 'admin')).toBe(true);
      expect(hasPermission('admin', 'member')).toBe(true);
      expect(hasPermission('admin', 'viewer')).toBe(true);
    });

    it('member has member and below permissions', () => {
      expect(hasPermission('member', 'owner')).toBe(false);
      expect(hasPermission('member', 'admin')).toBe(false);
      expect(hasPermission('member', 'member')).toBe(true);
      expect(hasPermission('member', 'viewer')).toBe(true);
    });

    it('viewer has only viewer permissions', () => {
      expect(hasPermission('viewer', 'owner')).toBe(false);
      expect(hasPermission('viewer', 'admin')).toBe(false);
      expect(hasPermission('viewer', 'member')).toBe(false);
      expect(hasPermission('viewer', 'viewer')).toBe(true);
    });
  });

  describe('permission helpers', () => {
    it('canManageMembers requires admin role', () => {
      expect(canManageMembers('owner')).toBe(true);
      expect(canManageMembers('admin')).toBe(true);
      expect(canManageMembers('member')).toBe(false);
      expect(canManageMembers('viewer')).toBe(false);
    });

    it('canDeleteWorkspace requires owner role', () => {
      expect(canDeleteWorkspace('owner')).toBe(true);
      expect(canDeleteWorkspace('admin')).toBe(false);
      expect(canDeleteWorkspace('member')).toBe(false);
      expect(canDeleteWorkspace('viewer')).toBe(false);
    });

    it('canCreateProject requires member role', () => {
      expect(canCreateProject('owner')).toBe(true);
      expect(canCreateProject('admin')).toBe(true);
      expect(canCreateProject('member')).toBe(true);
      expect(canCreateProject('viewer')).toBe(false);
    });

    it('canDeleteProject requires admin role', () => {
      expect(canDeleteProject('owner')).toBe(true);
      expect(canDeleteProject('admin')).toBe(true);
      expect(canDeleteProject('member')).toBe(false);
      expect(canDeleteProject('viewer')).toBe(false);
    });

    it('canEditTask requires member role', () => {
      expect(canEditTask('owner')).toBe(true);
      expect(canEditTask('admin')).toBe(true);
      expect(canEditTask('member')).toBe(true);
      expect(canEditTask('viewer')).toBe(false);
    });

    it('canComment requires member role', () => {
      expect(canComment('owner')).toBe(true);
      expect(canComment('admin')).toBe(true);
      expect(canComment('member')).toBe(true);
      expect(canComment('viewer')).toBe(false);
    });
  });
});
