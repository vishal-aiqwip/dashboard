import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { IconBuildingSkyscraper, IconCheck, IconChevronDown, IconLoader2 } from '@tabler/icons-react';

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
import { organizationService } from '@/services/organizations/organizations';
import { cn } from '@/lib/utils';

const ALL_HOTELS = 'all';

type HotelFilterProps = {
  value: string;
  onChange: (hotelId: string) => void;
};

export function HotelFilter({ value, onChange }: HotelFilterProps) {
  const [open, setOpen] = useState(false);

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationService.listAll(),
    staleTime: 10 * 60 * 1000,
  });

  const selectedName =
    value === ALL_HOTELS
      ? 'All hotels'
      : (orgs.find((o) => o.id === value)?.name ?? 'All hotels');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 min-w-[160px] justify-between gap-2 font-normal"
          disabled={isLoading}
        >
          {isLoading ? (
            <IconLoader2 className="size-4 animate-spin opacity-60" />
          ) : (
            <span className="truncate">{selectedName}</span>
          )}
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
                  className={cn('size-4', value === ALL_HOTELS ? 'opacity-100' : 'opacity-0')}
                />
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Hotels">
              {orgs.map((org) => (
                <CommandItem
                  key={org.id}
                  value={org.name}
                  onSelect={() => {
                    onChange(org.id);
                    setOpen(false);
                  }}
                  className="data-selected:bg-accent data-selected:text-accent-foreground"
                >
                  <IconBuildingSkyscraper className="size-4 opacity-70" />
                  <span className="flex-1 truncate">{org.name}</span>
                  <IconCheck
                    className={cn('size-4', value === org.id ? 'opacity-100' : 'opacity-0')}
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
