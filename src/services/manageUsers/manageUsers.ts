import { isAxiosError } from 'axios';
import { axiosApi } from '@/lib/axios';

const err = (e: unknown, fallback: string) => {
  if (isAxiosError(e)) {
    const msg = (e.response?.data as { message?: string } | undefined)?.message;
    if (msg) return new Error(msg);
  }
  if (e instanceof Error) return e;
  return new Error(fallback);
};

export type UserWithClaims = {
  uid: string;
  email: string;
  global_role_claims: string; // 'admin' | 'user' | ''
  org_roles_claims: Record<string, string>; // orgId -> role
  is_consultant: boolean;
};

export type UserOption = {
  uid: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
};

export type GlobalRole = 'admin' | 'user';
export type OrgRole = 'orgAdmin' | 'member';

export const manageUsersService = {
  listUsersWithClaims: async (): Promise<UserWithClaims[]> => {
    try {
      const { data } = await axiosApi.get('/users-with-claims');
      return (data?.data?.users ?? []) as UserWithClaims[];
    } catch (e) {
      throw err(e, 'Failed to fetch users');
    }
  },

  listUserOptions: async (): Promise<UserOption[]> => {
    try {
      const { data } = await axiosApi.get('/user-options');
      return (data?.data?.users ?? []) as UserOption[];
    } catch (e) {
      throw err(e, 'Failed to fetch user options');
    }
  },

  toggleConsultant: async (uid: string, is_consultant: boolean): Promise<void> => {
    try {
      await axiosApi.post(`/api/users/${uid}/consultant`, { is_consultant });
    } catch (e) {
      throw err(e, 'Failed to update consultant status');
    }
  },

  upsertRoleGrant: async (payload: {
    uid: string;
    scope_type: 'global' | 'org';
    scope_id: string;
    role: GlobalRole | OrgRole;
  }): Promise<void> => {
    try {
      await axiosApi.post('/api/roles/grants', payload);
    } catch (e) {
      throw err(e, 'Failed to update role');
    }
  },

  updateUserOrgRole: async (uid: string, org_id: string, role: OrgRole | null): Promise<void> => {
    try {
      await axiosApi.post('/update-user-org-roles', { uid, org_id, role });
    } catch (e) {
      throw err(e, 'Failed to update org role');
    }
  },
};
