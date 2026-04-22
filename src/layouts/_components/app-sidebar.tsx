import * as React from 'react';
import { useState } from 'react';

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
import { ScrollArea } from '@/components/ui/scroll-area';
import { HOTELS, NAV_SECTIONS } from '@/config/sidebar-nav';
import { HotelSwitcher } from '@/layouts/_components/hotel-switcher';
import { NavSection, isItemActive } from '@/layouts/_components/nav-section';
import { NavUser } from '@/layouts/_components/nav-user';

function findActiveSectionId(activeUrl: string): string | null {
  const match = NAV_SECTIONS.find((s) => s.items.some((i) => isItemActive(i.url, activeUrl)));
  return match?.id ?? null;
}

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

  const activeSectionId = findActiveSectionId(activeUrl);
  const [openSectionId, setOpenSectionId] = useState<string | null>(activeSectionId);
  const [prevActiveSectionId, setPrevActiveSectionId] = useState<string | null>(activeSectionId);

  if (activeSectionId !== prevActiveSectionId) {
    setPrevActiveSectionId(activeSectionId);
    if (activeSectionId) setOpenSectionId(activeSectionId);
  }

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

      <SidebarContent className="gap-0 overflow-hidden">
        <ScrollArea className="h-full w-full py-2">
          {NAV_SECTIONS.map((section) => (
            <NavSection
              key={section.id}
              section={section}
              activeUrl={activeUrl}
              isOpen={openSectionId === section.id}
              onOpenChange={(open) => setOpenSectionId(open ? section.id : null)}
            />
          ))}
        </ScrollArea>
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
