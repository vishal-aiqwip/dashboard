import * as React from 'react';

import {
  IconDashboard,
  IconLayoutDashboard,
  IconServer,
  IconUsers
} from '@tabler/icons-react';
import { Link } from 'react-router';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import { CONFIG } from '@/config';
import { NavMain } from '@/layouts/_components/nav-main';
import { NavUser } from '@/layouts/_components/nav-user';
import { Bot } from 'lucide-react';
import Logo from '@/components/logo';




const adminNav = [
  { title: 'Dashboard', url: '/dashboard', icon: IconLayoutDashboard },
  { title: 'Agent List', url: '/dashboard/agents', icon: Bot },
  { title: 'Users', url: '/dashboard/users', icon: IconUsers },
  { title: 'AI Providers', url: '/dashboard/ai-providers', icon: IconServer },
  // { title: 'Prompts', url: '/dashboard/prompts', icon: IconMessage },
];

const userNav = [
  { title: 'Dashboard', url: '/dashboard', icon: IconDashboard },
  { title: 'Agent List', url: '/dashboard/agents', icon: Bot },
  { title: 'AI Providers', url: '/dashboard/ai-providers', icon: IconServer },
];

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  role: 'admin' | 'user' | null;
  onLogout: () => void;
  isLoggingOut?: boolean;
};



export function AppSidebar({ user, role, onLogout, isLoggingOut = false, ...props }: AppSidebarProps) {
  const displayName = user.full_name?.trim() || user.email;
  const navItems = role === 'admin' ? adminNav : userNav;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>

          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-0  "
            >
              <Link className='w-full ' to="/">
                {/* <IconInnerShadowTop className="!size-5" /> */}
                {/* <div className="bg-primary flex size-6 items-center justify-center rounded-md">
                  <svg
                    viewBox="0 0 128 128"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-primary-foreground size-8"
                  >
                    <path d="M63.6734 24.8486V49.3899C63.6734 57.4589 57.1322 64.0001 49.0632 64.0001H25.2041" stroke="currentColor" strokeWidth="8.11681" />
                    <path d="M64.3266 103.152L64.3266 78.6106C64.3266 70.5416 70.8678 64.0003 78.9368 64.0003L102.796 64.0004" stroke="currentColor" strokeWidth="8.11681" />
                    <line x1="93.3468" y1="35.6108" x2="76.555" y2="52.205" stroke="currentColor" strokeWidth="8.11681" />
                    <line x1="51.7697" y1="77.0624" x2="34.9778" y2="93.6567" stroke="currentColor" strokeWidth="8.11681" />
                    <line x1="50.9584" y1="51.3189" x2="34.2651" y2="34.6256" stroke="currentColor" strokeWidth="8.11681" />
                    <line x1="93.1625" y1="93.6397" x2="76.4692" y2="76.9464" stroke="currentColor" strokeWidth="8.11681" />
                  </svg>
                </div>
                <span className="text-base font-semibold">{CONFIG.APP_NAME}</span> */}
                 <Logo className = "w-full h-full" 
                 
                 />

              
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
      
        <NavUser
          user={{ name: displayName || "John Deo", email: user.email || "example@gmail.com", avatar: user.avatar_url }}
          onLogout={onLogout}
          isLoggingOut={isLoggingOut}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
