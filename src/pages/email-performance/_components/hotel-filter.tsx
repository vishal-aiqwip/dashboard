import { useState } from 'react';

import { IconBuildingSkyscraper, IconCheck, IconChevronDown } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HOTELS } from '@/config/sidebar-nav';
import { cn } from '@/lib/utils';

const ALL_HOTELS = 'all';

type HotelFilterProps = {
  value: string;
  onChange: (hotelId: string) => void;
};

export function HotelFilter({ value, onChange }: HotelFilterProps) {
  const [open, setOpen] = useState(false);
  const selected =
    value === ALL_HOTELS
      ? { id: ALL_HOTELS, name: 'All hotels' }
      : HOTELS.find((h) => h.id === value) ?? { id: ALL_HOTELS, name: 'All hotels' };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 min-w-[160px] justify-between gap-2 font-normal"
        >
          <span className="truncate">{selected.name}</span>
          <IconChevronDown className="size-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="end" sideOffset={6}>
        <Command>
          <CommandInput placeholder="Search hotels..." />
          <CommandList className="max-h-80">
            <CommandEmpty>No hotels found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="All hotels"
                onSelect={() => {
                  onChange(ALL_HOTELS);
                  setOpen(false);
                }}
                className="data-selected:bg-accent data-selected:text-accent-foreground"
              >
                <IconBuildingSkyscraper className="size-4 opacity-70" />
                <span className="flex-1 truncate font-medium">All hotels</span>
                <IconCheck
                  className={cn('size-4', selected.id === ALL_HOTELS ? 'opacity-100' : 'opacity-0')}
                />
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Hotels">
              {HOTELS.map((hotel) => (
                <CommandItem
                  key={hotel.id}
                  value={hotel.name}
                  onSelect={() => {
                    onChange(hotel.id);
                    setOpen(false);
                  }}
                  className="data-selected:bg-accent data-selected:text-accent-foreground"
                >
                  <IconBuildingSkyscraper className="size-4 opacity-70" />
                  <span className="flex-1 truncate">{hotel.name}</span>
                  <IconCheck
                    className={cn('size-4', selected.id === hotel.id ? 'opacity-100' : 'opacity-0')}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { ALL_HOTELS };
