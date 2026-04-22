import { IconChevronDown } from '@tabler/icons-react';
import { Link } from 'react-router';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import type { NavSectionConfig } from '@/config/sidebar-nav';

type NavSectionProps = {
  section: NavSectionConfig;
  activeUrl: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

function normalize(url: string) {
  return url.replace(/\/+$/, '') || '/';
}

export function isItemActive(itemUrl: string, activeUrl: string) {
  const n = normalize(itemUrl);
  if (!n.startsWith('/')) return false;
  if (n === '/dashboard') return activeUrl === '/dashboard';
  return activeUrl === n || activeUrl.startsWith(`${n}/`);
}

export function NavSection({ section, activeUrl, isOpen, onOpenChange }: NavSectionProps) {
  const { state } = useSidebar();
  const sidebarCollapsed = state === 'collapsed';
  const effectiveOpen = sidebarCollapsed ? true : isOpen;

  return (
    <Collapsible open={effectiveOpen} onOpenChange={onOpenChange}>
      <SidebarGroup className="group-data-[collapsible=icon]:py-0">
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="group/trigger flex w-full items-center justify-between text-muted-foreground/70!  hover:text-black! cursor-pointer group-data-[collapsible=icon]:hidden">
            <span>{section.label}</span>
            <IconChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=closed]/trigger:-rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    className="h-9 group-data-[collapsible=icon]:size-9! [&>svg]:size-5"
                    tooltip={item.title}
                    asChild
                    isActive={isItemActive(item.url, activeUrl)}
                  >
                    <Link to={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
