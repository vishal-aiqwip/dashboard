import { useLocation } from 'react-router';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from './themeToggle';

const breadcrumbLabelByPath: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/agents': 'Agent List',
  '/dashboard/ai-providers': 'AI Providers ',
  '/dashboard/users': 'Users',
  '/dashboard/prompts': 'Prompts',

  '/dashboard/permissions': 'Permissions',
  '/dashboard/roles': 'Roles'
};

function getBreadcrumbLabel(pathname: string): string {
  // Exact match first
  if (breadcrumbLabelByPath[pathname]) return breadcrumbLabelByPath[pathname];

  // Agent sub-routes: /dashboard/agents/:id/<page>
  const agentMatch = pathname.match(/\/dashboard\/agents\/[^/]+\/(\w[\w-]*)/);
  if (agentMatch) {
    const page = agentMatch[1];
    const labels: Record<string, string> = {
      chat: 'Chat',
      insights: 'Insights',
      'knowledge-base': 'Knowledge Base',
      edit: 'Settings',
    };
    return labels[page] ?? 'Agent';
  }

  if (pathname.startsWith('/dashboard/org/')) return 'Edit Organization';

  return 'Dashboard';
}

export function SiteHeader() {
  const location = useLocation();

  const breadcrumbLabel = getBreadcrumbLabel(location.pathname);

  return (
    <header className="bg-sidebar flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{breadcrumbLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      {/* <div className='mr-4'>
         <ThemeToggle />
      </div> */}
    </header>

    
  );
}
