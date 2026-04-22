import { useState } from 'react';

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
import type { Hotel } from '@/config/sidebar-nav';

type HotelSwitcherProps = {
  hotels: Hotel[];
};

export function HotelSwitcher({ hotels }: HotelSwitcherProps) {
  const { isMobile } = useSidebar();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(hotels[0]?.id ?? '');
  const selected = hotels.find((h) => h.id === selectedId) ?? hotels[0];

  if (!selected) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="group-data-[collapsible=icon]:size-9! data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              tooltip={selected.name}
            >
              <div className="bg-sidebar-accent text-primary flex size-9 shrink-0 items-center justify-center rounded-md group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:bg-transparent">
                <IconBuildingSkyscraper className="size-5" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="text-muted-foreground text-[10px] uppercase tracking-wide">
                  Your Hotel
                </span>
                <span className="truncate font-medium">{selected.name}</span>
              </div>
              <IconSelector className="ml-auto size-4 opacity-60 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent
            className="w-[400px] p-0"
            side={isMobile ? 'bottom' : 'right'}
            align="start"
            sideOffset={8}
          >
            <Command>
              <CommandInput placeholder="Search hotels..." />
              <CommandList className="max-h-80">
                <CommandEmpty>No hotels found.</CommandEmpty>
                <CommandGroup heading="Hotels">
                  {hotels.map((hotel) => (
                    <CommandItem
                      key={hotel.id}
                      value={hotel.name}
                      onSelect={() => {
                        setSelectedId(hotel.id);
                        setOpen(false);
                      }}
                      className="data-selected:bg-accent data-selected:text-accent-foreground data-selected:*:[svg]:text-accent-foreground"
                    >
                      <IconBuildingSkyscraper className="size-4 opacity-70" />
                      <span className="flex-1 truncate">{hotel.name}</span>
                      <IconCheck
                        className={cn(
                          'size-4',
                          hotel.id === selected.id ? 'opacity-100' : 'opacity-0'
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
