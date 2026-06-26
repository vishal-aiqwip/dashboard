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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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

  // Auto-open parent items whose child matches the active URL
  const [openItems, setOpenItems] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const item of section.items) {
      if (item.children?.some((c) => isItemActive(c.url, activeUrl))) {
        initial.add(item.url);
      }
    }
    return initial;
  });

  const toggleItem = (url: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  return (
    <Collapsible open={effectiveOpen} onOpenChange={onOpenChange}>
      <SidebarGroup className="group-data-[collapsible=icon]:py-0">
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="group/trigger  flex w-full items-center justify-between text-muted-foreground/70!  hover:text-black! cursor-pointer group-data-[collapsible=icon]:hidden">
            <span>{section.label}</span>
            <IconChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=closed]/trigger:-rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => {
                const hasChildren = !!item.children?.length;

                if (hasChildren) {
                  const itemOpen = openItems.has(item.url);
                  const isChildActive = item.children!.some((c) =>
                    isItemActive(c.url, activeUrl),
                  );

                  return (
                    <SidebarMenuItem key={item.url}>
                      <Collapsible
                        open={sidebarCollapsed ? true : itemOpen}
                        onOpenChange={() => toggleItem(item.url)}
                      >
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            className="h-9 group-data-[collapsible=icon]:size-9! [&>svg]:size-5"
                            tooltip={item.title}
                            isActive={isChildActive && !itemOpen}
                          >
                            {item.icon && <item.icon />}
                            <span className="flex-1">{item.title}</span>
                            <IconChevronDown className="ml-auto  size-3.5! shrink-0 transition-transform duration-200 group-data-[state=closed]:-rotate-90 group-data-[collapsible=icon]:hidden" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub >
                            {item.children!.map((child) => (
                              <SidebarMenuSubItem key={child.url + child.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isItemActive(child.url, activeUrl)}
                                >
                                  <Link to={child.url}>
                                    {child.icon && <child.icon className="size-4" />}
                                    <span>{child.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuItem>
                  );
                }

                return (
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
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
