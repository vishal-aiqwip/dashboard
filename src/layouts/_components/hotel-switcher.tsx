import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { IconBuildingSkyscraper, IconCheck, IconSelector } from '@tabler/icons-react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setSelectedOrg } from '@/redux/reducer/selectedOrgReducer';
import { organizationService } from '@/services/organizations/organizations';

export function HotelSwitcher() {
  const { isMobile } = useSidebar();
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const selectedOrg = useAppSelector((state: any) => state.selectedOrg.selectedOrg);

  const { data: orgs = [] } = useQuery({
    queryKey: ['orgs-all'],
    queryFn: organizationService.listAll,
  });

  // Auto-select first org on load
  useEffect(() => {
    if (orgs.length > 0 && !selectedOrg) {
      dispatch(setSelectedOrg(orgs[0]!));
    }
  }, [orgs, selectedOrg, dispatch]);

  const selected = selectedOrg ?? orgs[0];

  if (!selected && orgs.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="bg-sidebar-accent flex size-9 shrink-0 items-center justify-center rounded-md">
              <IconBuildingSkyscraper className="size-5 opacity-40" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wide">Your Hotel</span>
              <span className="truncate text-xs text-muted-foreground">Loading…</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="group-data-[collapsible=icon]:size-9! data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              tooltip={selected?.name ?? 'Select hotel'}
            >
              <div className="bg-sidebar-accent text-primary flex size-9 shrink-0 items-center justify-center rounded-md group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:bg-transparent">
                <IconBuildingSkyscraper className="size-5" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="text-muted-foreground text-[10px] uppercase tracking-wide">
                  Your Hotel
                </span>
                <span className="truncate font-medium">{selected?.name ?? '—'}</span>
              </div>
              <IconSelector className="ml-auto size-4 opacity-60 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent
            className="w-100 p-0"
            side={isMobile ? 'bottom' : 'right'}
            align="start"
            sideOffset={8}
          >
            <Command>
              <CommandInput placeholder="Search hotels..." />
              <CommandList className="max-h-80">
                <CommandEmpty>No hotels found.</CommandEmpty>
                <CommandGroup heading="Hotels">
                  {orgs.map((org) => (
                    <CommandItem
                      key={org.id}
                      value={org.name}
                      onSelect={() => {
                        dispatch(setSelectedOrg(org));
                        setOpen(false);
                      }}
                      className="data-selected:bg-accent data-selected:text-accent-foreground data-selected:*:[svg]:text-accent-foreground"
                    >
                      <IconBuildingSkyscraper className="size-4 opacity-70" />
                      <span className="flex-1 truncate">{org.name}</span>
                      <IconCheck
                        className={cn(
                          'size-4',
                          org.id === selected?.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
