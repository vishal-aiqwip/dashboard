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

export type TenantStatus = 'pending' | 'active' | 'blocked';

export type IdpTenant = {
  id: string;
  key: string;
  status: TenantStatus;
  auto_link: boolean;
  allowlist_domains: string[];
  created_at?: string;
  updated_at?: string;
  requested_by_email?: string;
  activated_at?: string;
  activated_by?: string;
};

export type AccessRequest = {
  id: string;
  provider: 'msal';
  tenant_id: string;
  user_oid: string;
  idp_email: string;
  idp_display_name?: string;
  mailbox_email?: string;
  domain?: string;
  requested_org_name?: string;
  state: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
  approved_at?: string;
  approved_by?: string;
};

export type UserWithClaims = {
  uid: string;
  email: string;
};

export const aiEmailAccessService = {
  listTenants: async (status?: TenantStatus): Promise<IdpTenant[]> => {
    try {
      const { data } = await axiosApi.get('/ai-email-access/tenants', {
        params: status ? { status } : undefined,
      });
      return (data as IdpTenant[]) ?? [];
    } catch (e) {
      throw err(e, 'Failed to fetch tenants');
    }
  },

  updateTenantPolicy: async (args: {
    tenant_id: string;
    status: TenantStatus;
    auto_link: boolean;
    allowlist_domains: string[];
  }): Promise<void> => {
    try {
      await axiosApi.patch(`/ai-email-access/tenants/${args.tenant_id}`, {
        status: args.status,
        auto_link: args.auto_link,
        allowlist_domains: args.allowlist_domains,
      });
    } catch (e) {
      throw err(e, 'Failed to update tenant policy');
    }
  },

  listAccessRequests: async (
    tenantId?: string,
    state?: 'pending' | 'approved' | 'rejected',
  ): Promise<AccessRequest[]> => {
    try {
      const { data } = await axiosApi.get('/ai-email-access/access-requests', {
        params: { tenant_id: tenantId, state },
      });
      return (data as AccessRequest[]) ?? [];
    } catch (e) {
      throw err(e, 'Failed to fetch access requests');
    }
  },

  updateAccessRequestState: async (args: {
    request_id: string;
    state: 'approved' | 'rejected';
  }): Promise<void> => {
    try {
      await axiosApi.patch(`/ai-email-access/access-requests/${args.request_id}`, {
        state: args.state,
      });
    } catch (e) {
      throw err(e, 'Failed to update access request');
    }
  },

  createIdentityLink: async (args: {
    provider: 'msal';
    tenant_id: string;
    user_oid: string;
    uid: string;
    idp_email?: string;
    idp_display_name?: string;
  }): Promise<void> => {
    try {
      await axiosApi.post('/ai-email-access/identity-links', args);
    } catch (e) {
      throw err(e, 'Failed to create identity link');
    }
  },

  upsertRoleGrant: async (args: {
    uid: string;
    scope_type: 'org';
    scope_id: string;
    role: 'orgAdmin' | 'member';
  }): Promise<void> => {
    try {
      await axiosApi.post('/api/roles/grants', args);
    } catch (e) {
      throw err(e, 'Failed to grant role');
    }
  },

  listUsersWithClaims: async (): Promise<UserWithClaims[]> => {
    try {
      const { data } = await axiosApi.get('/users-with-claims');
      return (data?.data?.users as UserWithClaims[]) ?? [];
    } catch (e) {
      throw err(e, 'Failed to fetch users');
    }
  },
};
