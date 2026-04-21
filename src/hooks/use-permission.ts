import { useAppSelector } from '@/redux/hooks';

/**
 * Returns true if the current user has the given permission code.
 * Permission codes: users.*, profiles.*, prompts.*, ai_providers.*, reports.*
 */
export function useHasPermission(permissionCode: string): boolean {
  return useAppSelector((state: { session: { permissions: string[] } }) =>
    state.session.permissions.includes(permissionCode)
  );
}

/**
 * Returns true if the current user has ALL of the given permission codes.
 */
export function useHasAllPermissions(...codes: string[]): boolean {
  return useAppSelector((state: { session: { permissions: string[] } }) =>
    codes.every((code) => state.session.permissions.includes(code))
  );
}
