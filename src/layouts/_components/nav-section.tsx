import { useState } from 'react';

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
} from '@/components/ui/sidebar';
import type { NavSectionConfig } from '@/config/sidebar-nav';

type NavSectionProps = {
  section: NavSectionConfig;
  activeUrl: string;
};

function normalize(url: string) {
  return url.replace(/\/+$/, '') || '/';
}

function isItemActive(itemUrl: string, activeUrl: string) {
  const n = normalize(itemUrl);
  if (!n.startsWith('/')) return false;
  if (n === '/dashboard') return activeUrl === '/dashboard';
  return activeUrl === n || activeUrl.startsWith(`${n}/`);
}

export function NavSection({ section, activeUrl }: NavSectionProps) {
  const sectionIsActive = section.items.some((item) => isItemActive(item.url, activeUrl));
  const [open, setOpen] = useState(sectionIsActive);
  const [prevActive, setPrevActive] = useState(sectionIsActive);

  if (sectionIsActive !== prevActive) {
    setPrevActive(sectionIsActive);
    if (sectionIsActive) setOpen(true);
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="group/trigger flex w-full items-center justify-between">
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
