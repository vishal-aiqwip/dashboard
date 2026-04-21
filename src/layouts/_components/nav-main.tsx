import type { ComponentType } from 'react';
import { Link, useLocation } from 'react-router';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';

export function NavMain({
  items
}: {
  items: {
    title: string;
    url: string;
    icon?: ComponentType<any>;
  }[];
}) {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/, '') || '/';

  const isItemActive = (url: string) => {
    const normalizedUrl = url.replace(/\/+$/, '') || '/';

    if (!normalizedUrl.startsWith('/')) {
      return false;
    }

    if (normalizedUrl === '/dashboard') {
      return pathname === '/dashboard';
    }

    return pathname === normalizedUrl || pathname.startsWith(`${normalizedUrl}/`);
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2 ">
         <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
        
        <SidebarMenu>

          {items.map((item) => (
            <SidebarMenuItem key={item.title} className=''>
              <SidebarMenuButton
                className="h-10 group-data-[collapsible=icon]:size-10!   [&>svg]:size-6"
                tooltip={item.title}
                asChild
                isActive={isItemActive(item.url)}
              >
                <Link className='' to={item.url}>
                  {item.icon && <item.icon className="" />}
                  <span className=''>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
