import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  IconBuildingSkyscraper,
  IconChevronDown,
  IconFlask,
  IconKey,
  IconMail,
  IconMailAi,
  IconShieldCheck,
} from '@tabler/icons-react';

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
import { organizationService } from '@/services/organizations/organizations';

type SubRoute = {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
};

const HOTEL_SUBROUTES: SubRoute[] = [
  { title: 'Organization', path: 'organization', icon: IconBuildingSkyscraper },
  { title: 'Email', path: 'email', icon: IconMail },
  { title: 'AI Email', path: 'ai-email', icon: IconMailAi },
  { title: 'Access', path: 'access', icon: IconKey },
  { title: 'Beta Features', path: 'beta-features', icon: IconFlask },
  { title: 'Security', path: 'security', icon: IconShieldCheck },
];

type HotelNavSectionProps = {
  orgId: string;
};

export function HotelNavSection({ orgId }: HotelNavSectionProps) {
  const { state } = useSidebar();
  const sidebarCollapsed = state === 'collapsed';
  const location = useLocation();
  const activeUrl = location.pathname.replace(/\/+$/, '') || '/';
  const [sectionOpen, setSectionOpen] = useState(true);
  const [hotelOpen, setHotelOpen] = useState(true);

  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationService.listAll,
    staleTime: 5 * 60 * 1000,
  });
  const hotelName = orgs?.find((o) => o.id === orgId)?.name ?? 'Hotel';

  return (
    <Collapsible
      open={sidebarCollapsed ? true : sectionOpen}
      onOpenChange={setSectionOpen}
    >
      <SidebarGroup className="group-data-[collapsible=icon]:py-0">
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="group/trigger flex w-full items-center justify-between text-muted-foreground/70! hover:text-black! cursor-pointer group-data-[collapsible=icon]:hidden">
            <span>HOTEL</span>
            <IconChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=closed]/trigger:-rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>

        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Collapsible open={hotelOpen} onOpenChange={setHotelOpen}>
                  {/* Hotel name row — acts as the collapsible trigger */}
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className="h-9 group-data-[collapsible=icon]:size-9! [&>svg]:size-5"
                      tooltip={hotelName}
                    >
                      <IconBuildingSkyscraper />
                      <span className="flex-1 truncate text-left">{hotelName}</span>
                      <IconChevronDown className="ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[state=closed]:-rotate-90 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {HOTEL_SUBROUTES.map((route) => {
                        const url = `/dashboard/manage-hotels/${orgId}/${route.path}`;
                        const isActive =
                          activeUrl === url || activeUrl.startsWith(`${url}/`);
                        return (
                          <SidebarMenuSubItem key={route.path}>
                            <SidebarMenuSubButton asChild isActive={isActive}>
                              <Link to={url}>
                                <route.icon className="size-4" />
                                <span>{route.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
