import { useQuery } from '@tanstack/react-query';

import { manageUsersService, type UserWithClaims, type UserOption } from '@/services/manageUsers/manageUsers';
import { organizationService, type OrgBrief } from '@/services/organizations/organizations';

export type MergedUser = {
  uid: string;
  email: string;
  displayName: string;
  global_role: string;
  org_roles: Record<string, string>;
  is_consultant: boolean;
};

export type UsersData = {
  users: MergedUser[];
  orgs: OrgBrief[];
  orgMap: Map<string, string>;
};

export const USERS_QUERY_KEY = ['manage-users'] as const;

function mergeUsers(claims: UserWithClaims[], options: UserOption[]): MergedUser[] {
  const optMap = new Map(options.map((o) => [o.uid, o]));
  return claims.map((c) => {
    const opt = optMap.get(c.uid);
    const first = opt?.first_name?.trim() ?? '';
    const last = opt?.last_name?.trim() ?? '';
    const displayName = [first, last].filter(Boolean).join(' ') || c.email.split('@')[0];
    return {
      uid: c.uid,
      email: c.email,
      displayName,
      global_role: c.global_role_claims || 'user',
      org_roles: c.org_roles_claims ?? {},
      is_consultant: c.is_consultant,
    };
  });
}

export function useUsersData() {
  return useQuery<UsersData>({
    queryKey: USERS_QUERY_KEY,
    queryFn: async () => {
      const [claims, options, orgs] = await Promise.all([
        manageUsersService.listUsersWithClaims(),
        manageUsersService.listUserOptions(),
        organizationService.listAll(),
      ]);
      const users = mergeUsers(claims, options);
      const orgMap = new Map(orgs.map((o) => [o.id, o.name]));
      return { users, orgs, orgMap };
    },
    staleTime: 60_000,
  });
}
