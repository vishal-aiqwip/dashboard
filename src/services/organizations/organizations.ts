import { isAxiosError } from 'axios';
import { axiosApi } from '@/lib/axios';

type ApiResponse<T> = {
  status: boolean;
  message: string;
  data?: T;
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error)) {
    const d = error.response?.data as { message?: string } | undefined;
    if (d?.message) return d.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export type OrgBrief = {
  id: string;
  name: string;
  timezone: string;
};

export type OrgAddress = {
  street_address: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
};

export type CreateOrgPayload = {
  organization_name: string;
  address: OrgAddress;
  created_by: string;
  timezone: string;
};

export type OrgMember = {
  uid: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: 'orgAdmin' | 'member';
  status: 'active' | 'pending';
  photo_url: string | null;
};

export type InvitePayload = {
  first_name: string;
  last_name: string;
  email: string;
  role: 'orgAdmin' | 'member';
};

export const organizationService = {
  listAll: async (): Promise<OrgBrief[]> => {
    try {
      const { data } = await axiosApi.get<ApiResponse<{ organizations: OrgBrief[] }>>(
        '/organizations/admin',
      );
      return data.data?.organizations ?? [];
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch organizations'));
    }
  },

  create: async (payload: CreateOrgPayload): Promise<OrgBrief> => {
    try {
      const { data } = await axiosApi.post<ApiResponse<{ organization: OrgBrief & Record<string, unknown> }>>(
        '/organizations',
        payload,
      );
      const org = data.data?.organization;
      if (!org) throw new Error('No organization returned');
      return { id: org.id, name: org.organization_name as string ?? org.name, timezone: org.timezone as string ?? 'UTC' };
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create organization'));
    }
  },

  getMembers: async (orgId: string): Promise<OrgMember[]> => {
    try {
      const { data } = await axiosApi.get<ApiResponse<{ members: OrgMember[] }>>(
        `/organizations/${orgId}/members`,
      );
      return data.data?.members ?? [];
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch members'));
    }
  },

  updateMemberRole: async (orgId: string, uid: string, role: 'orgAdmin' | 'member'): Promise<void> => {
    try {
      await axiosApi.patch(`/organizations/${orgId}/members/${uid}/role`, { role });
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update role'));
    }
  },

  removeMember: async (orgId: string, uid: string): Promise<void> => {
    try {
      await axiosApi.delete(`/organizations/${orgId}/members/${uid}`);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to remove member'));
    }
  },

  inviteMembers: async (orgId: string, invites: InvitePayload[]): Promise<void> => {
    try {
      await axiosApi.post(`/organizations/${orgId}/members/invite`, { invites });
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to send invite'));
    }
  },
};
