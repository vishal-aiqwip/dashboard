import { isAxiosError } from 'axios';
import { axiosApi } from '@/lib/axios';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ConsultantWorkspace {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by_uid: string | null;
}

export type WorkspaceMemberRole = 'workspaceAdmin' | 'member';

export interface ConsultantWorkspaceMember {
  uid: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role: WorkspaceMemberRole;
  photo_url?: string | null;
}

export interface ReportChain {
  id: string;
  name: string;
  created_at?: string | null;
}

export interface ReportHotel {
  id: string;
  name: string;
  chain_id?: string | null;
  created_at?: string | null;
}

export interface WorkspaceAccessGrant {
  id: string;
  workspace_id: string;
  scope_type: 'chain' | 'hotel' | 'all';
  scope_id: string;
}

export interface AssessmentListItem {
  assessment_id: string;
  hotel_name: string;
  mailbox_email: string;
  status: string;
  consent_status: string | null;
  lookback_days: number;
  created_at: string | null;
  report_hotel_id: string | null;
  error_message: string | null;
}

export interface CreateAssessmentPayload {
  hotel_name: string;
  mailbox_email: string;
  lookback_days: number;
  report_hotel_id: string;
  consultant_workspace_id?: string | null;
}

export interface CreateAssessmentResponse {
  assessment_id: string;
  consent_url: string;
}

export interface EmailReportRow {
  report_id: string;
  hotel_id: string;
  hotel_name?: string | null;
  period_days?: number | null;
  generated_at?: string | null;
  created_at: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const apiErr = (e: unknown, fallback: string): Error => {
  if (isAxiosError(e)) {
    const d = e.response?.data as { message?: string; detail?: string } | undefined;
    const msg = d?.message ?? d?.detail;
    if (msg) return new Error(msg);
  }
  if (e instanceof Error) return e;
  return new Error(fallback);
};

function unwrap<T>(data: unknown): T {
  if (data && typeof data === 'object' && 'data' in data) {
    return (data as { data: T }).data;
  }
  return data as T;
}

// ── Service ────────────────────────────────────────────────────────────────────

export const reportAssessmentsService = {
  // ── Consultant Workspaces ──────────────────────────────────────────────────

  listWorkspaces: async (): Promise<ConsultantWorkspace[]> => {
    try {
      const { data } = await axiosApi.get<unknown>('/api/consultant-workspaces');
      const payload = unwrap<{ workspaces: ConsultantWorkspace[] }>(data);
      return payload.workspaces ?? [];
    } catch (e) {
      throw apiErr(e, 'Failed to fetch workspaces');
    }
  },

  getWorkspace: async (workspaceId: string): Promise<ConsultantWorkspace> => {
    try {
      const { data } = await axiosApi.get<unknown>(`/api/consultant-workspaces/${workspaceId}`);
      const payload = unwrap<{ workspace: ConsultantWorkspace }>(data);
      return payload.workspace;
    } catch (e) {
      throw apiErr(e, 'Failed to fetch workspace');
    }
  },

  getMyWorkspaces: async (): Promise<ConsultantWorkspace[]> => {
    try {
      const { data } = await axiosApi.get<unknown>('/api/consultant-workspaces/mine');
      const payload = unwrap<{ workspaces: ConsultantWorkspace[] }>(data);
      return payload.workspaces ?? [];
    } catch (e) {
      throw apiErr(e, 'Failed to fetch my workspaces');
    }
  },

  createWorkspace: async (payload: { name: string }): Promise<ConsultantWorkspace> => {
    try {
      const { data } = await axiosApi.post<unknown>('/api/consultant-workspaces', payload);
      const result = unwrap<{ workspace: ConsultantWorkspace }>(data);
      return result.workspace;
    } catch (e) {
      throw apiErr(e, 'Failed to create workspace');
    }
  },

  updateWorkspace: async (workspaceId: string, payload: { name?: string }): Promise<ConsultantWorkspace> => {
    try {
      const { data } = await axiosApi.patch<unknown>(`/api/consultant-workspaces/${workspaceId}`, payload);
      const result = unwrap<{ workspace: ConsultantWorkspace }>(data);
      return result.workspace;
    } catch (e) {
      throw apiErr(e, 'Failed to update workspace');
    }
  },

  deleteWorkspace: async (workspaceId: string): Promise<void> => {
    try {
      await axiosApi.delete(`/api/consultant-workspaces/${workspaceId}`);
    } catch (e) {
      throw apiErr(e, 'Failed to delete workspace');
    }
  },

  uploadWorkspaceLogo: async (workspaceId: string, file: File): Promise<ConsultantWorkspace> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await axiosApi.post<unknown>(
        `/api/consultant-workspaces/${workspaceId}/upload-logo`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      const result = unwrap<{ workspace: ConsultantWorkspace }>(data);
      return result.workspace;
    } catch (e) {
      throw apiErr(e, 'Failed to upload logo');
    }
  },

  deleteWorkspaceLogo: async (workspaceId: string): Promise<void> => {
    try {
      await axiosApi.delete(`/api/consultant-workspaces/${workspaceId}/delete-logo`);
    } catch (e) {
      throw apiErr(e, 'Failed to delete logo');
    }
  },

  // ── Workspace Members ──────────────────────────────────────────────────────

  getWorkspaceMembers: async (workspaceId: string): Promise<ConsultantWorkspaceMember[]> => {
    try {
      const { data } = await axiosApi.get<unknown>(`/api/consultant-workspaces/${workspaceId}/members`);
      const payload = unwrap<{ members: ConsultantWorkspaceMember[] }>(data);
      return payload.members ?? [];
    } catch (e) {
      throw apiErr(e, 'Failed to fetch members');
    }
  },

  inviteWorkspaceMember: async (workspaceId: string, payload: { email: string; role: WorkspaceMemberRole }): Promise<void> => {
    try {
      await axiosApi.post(`/api/consultant-workspaces/${workspaceId}/invite`, payload);
    } catch (e) {
      throw apiErr(e, 'Failed to invite member');
    }
  },

  removeWorkspaceMember: async (workspaceId: string, uid: string): Promise<void> => {
    try {
      await axiosApi.delete(`/api/consultant-workspaces/${workspaceId}/members/${uid}`);
    } catch (e) {
      throw apiErr(e, 'Failed to remove member');
    }
  },

  // ── Access Grants ──────────────────────────────────────────────────────────

  getWorkspaceAccessGrants: async (workspaceId: string): Promise<WorkspaceAccessGrant[]> => {
    try {
      const { data } = await axiosApi.get<unknown>('/api/workspace-access-grants', {
        params: { workspace_id: workspaceId },
      });
      const payload = unwrap<{ grants: WorkspaceAccessGrant[] }>(data);
      return payload.grants ?? [];
    } catch (e) {
      throw apiErr(e, 'Failed to fetch access grants');
    }
  },

  createAccessGrant: async (payload: { workspace_id: string; scope_type: string; scope_id: string }): Promise<WorkspaceAccessGrant> => {
    try {
      const { data } = await axiosApi.post<unknown>('/api/workspace-access-grants', payload);
      const result = unwrap<{ grant: WorkspaceAccessGrant }>(data);
      return result.grant;
    } catch (e) {
      throw apiErr(e, 'Failed to create access grant');
    }
  },

  deleteAccessGrant: async (grantId: string): Promise<void> => {
    try {
      await axiosApi.delete(`/api/workspace-access-grants/${grantId}`);
    } catch (e) {
      throw apiErr(e, 'Failed to delete access grant');
    }
  },

  // ── Report Chains ──────────────────────────────────────────────────────────

  listChains: async (workspaceId?: string | null): Promise<ReportChain[]> => {
    try {
      const params: Record<string, string> = {};
      if (workspaceId) params.workspace_id = workspaceId;
      const { data } = await axiosApi.get<unknown>('/api/report-chains', { params });
      const payload = unwrap<{ chains: ReportChain[] }>(data);
      return payload.chains ?? [];
    } catch (e) {
      throw apiErr(e, 'Failed to fetch chains');
    }
  },

  createChain: async (payload: { name: string; workspace_id?: string | null }): Promise<ReportChain> => {
    try {
      const body: Record<string, unknown> = { name: payload.name };
      if (payload.workspace_id) body.workspace_id = payload.workspace_id;
      const { data } = await axiosApi.post<unknown>('/api/report-chains', body);
      const result = unwrap<{ chain: ReportChain }>(data);
      return result.chain;
    } catch (e) {
      throw apiErr(e, 'Failed to create chain');
    }
  },

  updateChain: async (chainId: string, body: { name?: string }): Promise<ReportChain> => {
    try {
      const { data } = await axiosApi.patch<unknown>(`/api/report-chains/${chainId}`, body);
      const result = unwrap<{ chain: ReportChain }>(data);
      return result.chain;
    } catch (e) {
      throw apiErr(e, 'Failed to update chain');
    }
  },

  deleteChain: async (chainId: string): Promise<void> => {
    try {
      await axiosApi.delete(`/api/report-chains/${chainId}`);
    } catch (e) {
      throw apiErr(e, 'Failed to delete chain');
    }
  },

  // ── Report Hotels ──────────────────────────────────────────────────────────

  listHotels: async (chainId?: string | null, workspaceId?: string | null): Promise<ReportHotel[]> => {
    try {
      const params: Record<string, string> = {};
      if (chainId) params.chain_id = chainId;
      if (workspaceId) params.workspace_id = workspaceId;
      const { data } = await axiosApi.get<unknown>('/api/report-hotels', { params });
      const payload = unwrap<{ hotels: ReportHotel[] }>(data);
      return payload.hotels ?? [];
    } catch (e) {
      throw apiErr(e, 'Failed to fetch hotels');
    }
  },

  createHotel: async (payload: { name: string; chain_id?: string | null; workspace_id?: string | null }): Promise<ReportHotel> => {
    try {
      const body: Record<string, unknown> = { name: payload.name };
      if (payload.chain_id) body.chain_id = payload.chain_id;
      if (payload.workspace_id) body.workspace_id = payload.workspace_id;
      const { data } = await axiosApi.post<unknown>('/api/report-hotels', body);
      const result = unwrap<{ hotel: ReportHotel }>(data);
      return result.hotel;
    } catch (e) {
      throw apiErr(e, 'Failed to create hotel');
    }
  },

  updateHotel: async (hotelId: string, body: { name?: string; chain_id?: string | null }): Promise<ReportHotel> => {
    try {
      const { data } = await axiosApi.patch<unknown>(`/api/report-hotels/${hotelId}`, body);
      const result = unwrap<{ hotel: ReportHotel }>(data);
      return result.hotel;
    } catch (e) {
      throw apiErr(e, 'Failed to update hotel');
    }
  },

  deleteHotel: async (hotelId: string): Promise<void> => {
    try {
      await axiosApi.delete(`/api/report-hotels/${hotelId}`);
    } catch (e) {
      throw apiErr(e, 'Failed to delete hotel');
    }
  },

  // ── Assessments ────────────────────────────────────────────────────────────

  listAssessments: async (consultantWorkspaceId?: string | null): Promise<{ assessments: AssessmentListItem[] }> => {
    try {
      const params: Record<string, string> = {};
      if (consultantWorkspaceId) params.consultant_workspace_id = consultantWorkspaceId;
      const { data } = await axiosApi.get<unknown>('/api/report-assessments', { params });
      const payload = unwrap<{ assessments: AssessmentListItem[] }>(data);
      return { assessments: payload.assessments ?? [] };
    } catch (e) {
      throw apiErr(e, 'Failed to fetch assessments');
    }
  },

  createAssessment: async (payload: CreateAssessmentPayload): Promise<CreateAssessmentResponse> => {
    try {
      const body: Record<string, unknown> = {
        hotel_name: payload.hotel_name,
        mailbox_email: payload.mailbox_email,
        lookback_days: payload.lookback_days,
        report_hotel_id: payload.report_hotel_id,
      };
      if (payload.consultant_workspace_id) {
        body.consultant_workspace_id = payload.consultant_workspace_id;
      }
      const { data } = await axiosApi.post<unknown>('/api/report-assessments', body);
      const result = unwrap<CreateAssessmentResponse>(data);
      return result;
    } catch (e) {
      throw apiErr(e, 'Failed to create assessment');
    }
  },

  getAssessment: async (assessmentId: string): Promise<AssessmentListItem> => {
    try {
      const { data } = await axiosApi.get<unknown>(`/api/report-assessments/${assessmentId}`);
      return unwrap<AssessmentListItem>(data);
    } catch (e) {
      throw apiErr(e, 'Failed to fetch assessment');
    }
  },

  // ── Email Reports ──────────────────────────────────────────────────────────

  listEmailReports: async (params?: { limit?: number; offset?: number }): Promise<{ reports: EmailReportRow[]; total: number }> => {
    try {
      const { data } = await axiosApi.get<unknown>('/api/email-reports', { params });
      const payload = unwrap<{ reports: EmailReportRow[]; total: number }>(data);
      return { reports: payload.reports ?? [], total: payload.total ?? 0 };
    } catch (e) {
      throw apiErr(e, 'Failed to fetch email reports');
    }
  },

  getReportSnapshot: async (reportId: string, hotelId: string): Promise<EmailReportRow & { report_json?: Record<string, unknown> | null }> => {
    try {
      const { data } = await axiosApi.get<unknown>('/api/email-reports/snapshot', {
        params: { report_id: reportId, hotel_id: hotelId },
      });
      return unwrap<EmailReportRow & { report_json?: Record<string, unknown> | null }>(data);
    } catch (e) {
      throw apiErr(e, 'Failed to fetch report snapshot');
    }
  },
};
