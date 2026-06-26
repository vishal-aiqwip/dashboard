import { Link, useLocation } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import { organizationService } from '@/services/organizations/organizations';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from './themeToggle';

/* ---------- static label map ---------- */

const breadcrumbLabelByPath: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/agents': 'Agent List',
  '/dashboard/ai-providers': 'AI Providers ',
  '/dashboard/users': 'Users',
  '/dashboard/prompts': 'Prompts',
  '/dashboard/permissions': 'Permissions',
  '/dashboard/roles': 'Roles',
  '/dashboard/manage-hotels': 'Manage Hotels',
  '/dashboard/manage-users': 'Manage Users',
  '/dashboard/onboarding': 'Onboarding',
  '/dashboard/email-performance': 'Email Performance',
  '/dashboard/email-training-center': 'Email Training Center',
  '/dashboard/report-assessments': 'Report Assessments',
  '/dashboard/profile': 'Profile',
};

/* ---------- breadcrumb segment type ---------- */

type Crumb =
  | { type: 'link'; label: string; to: string }
  | { type: 'page'; label: string };

function useBreadcrumbs(): Crumb[] {
  const { pathname } = useLocation();

  const hotelUsersMatch = pathname.match(/^\/dashboard\/manage-hotels\/([^/]+)\/users$/);
  const orgId = hotelUsersMatch?.[1] ?? null;

  // Always call the hook — only fetches when enabled
  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationService.listAll,
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  if (hotelUsersMatch && orgId) {
    const hotelName = orgs?.find((o) => o.id === orgId)?.name ?? orgId;
    return [
      { type: 'link', label: 'Manage Hotels', to: '/dashboard/manage-hotels' },
      { type: 'link', label: hotelName, to: '/dashboard/manage-hotels' },
      { type: 'page', label: 'Users' },
    ];
  }

  // /dashboard/manage-hotels
  if (pathname === '/dashboard/manage-hotels') {
    return [{ type: 'page', label: 'Manage Hotels' }];
  }

  // Agent sub-routes
  const agentMatch = pathname.match(/\/dashboard\/agents\/[^/]+\/(\w[\w-]*)/);
  if (agentMatch) {
    const labels: Record<string, string> = {
      chat: 'Chat',
      insights: 'Insights',
      'knowledge-base': 'Knowledge Base',
      edit: 'Settings',
    };
    return [{ type: 'page', label: labels[agentMatch[1]] ?? 'Agent' }];
  }

  if (pathname.startsWith('/dashboard/org/')) {
    return [{ type: 'page', label: 'Edit Organization' }];
  }

  const label = breadcrumbLabelByPath[pathname] ?? 'Dashboard';
  return [{ type: 'page', label }];
}

/* ========================================================================== */

export function SiteHeader() {
  const crumbs = useBreadcrumbs();

  return (
    <header className="bg-sidebar flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((crumb, i) => (
              <BreadcrumbItem key={i}>
                {crumb.type === 'link' ? (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.to}>{crumb.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                )}
                {i < crumbs.length - 1 && <BreadcrumbSeparator />}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="mr-4">
        <ThemeToggle />
      </div>
    </header>
  );
}
