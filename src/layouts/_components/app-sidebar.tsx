import * as React from 'react';

import { Link, useLocation } from 'react-router';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import Logo from '@/components/logo';
import { HOTELS, NAV_SECTIONS } from '@/config/sidebar-nav';
import { HotelSwitcher } from '@/layouts/_components/hotel-switcher';
import { NavSection } from '@/layouts/_components/nav-section';
import { NavUser } from '@/layouts/_components/nav-user';

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

export function AppSidebar({
  user,
  role,
  onLogout,
  isLoggingOut = false,
  ...props
}: AppSidebarProps) {
  const displayName = user.full_name?.trim() || user.email;
  const location = useLocation();
  const activeUrl = location.pathname.replace(/\/+$/, '') || '/';

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem className=''>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-0">
              <Link className="w-full" to="/">
                <Logo className="w-full h-full" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <hr/>
        <HotelSwitcher hotels={HOTELS} />

      </SidebarHeader>

      <SidebarContent>
        {NAV_SECTIONS.map((section) => (
          <NavSection key={section.id} section={section} activeUrl={activeUrl} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: displayName || 'John Deo',
            email: user.email || 'example@gmail.com',
            avatar: user.avatar_url,
          }}
          onLogout={onLogout}
          isLoggingOut={isLoggingOut}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
