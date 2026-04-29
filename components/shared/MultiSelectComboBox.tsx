"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";

export interface Option {
  label: string;
  value: string;
  description?: string;
}

interface MultiSelectComboBoxProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  onSearchChange?: (query: string) => void;
  className?: string;
}

export function MultiSelectComboBox({
  options,
  selected,
  onChange,
  placeholder = "Pilih item...",
  searchPlaceholder = "Cari...",
  emptyMessage = "Tidak ada item ditemukan.",
  isLoading = false,
  onSearchChange,
  className
}: MultiSelectComboBoxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const debouncedSearch = useDebounce(inputValue, 500);

  React.useEffect(() => {
    if (onSearchChange) {
      onSearchChange(debouncedSearch as string);
    }
  }, [debouncedSearch, onSearchChange]);

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const handleRemove = (value: string) => {
    onChange(selected.filter((v) => v !== value));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10 py-2 bg-white"
          >
            <div className="flex flex-wrap gap-1">
              {selected.length === 0 && <span className="text-muted-foreground">{placeholder}</span>}
              {selected.slice(0, 2).map((val) => {
                const option = options.find((o) => o.value === val);
                return (
                  <Badge
                    key={val}
                    variant="secondary"
                    className="bg-[#FEF4E8] text-[#3C3025] hover:bg-orange-100 border-none transition-all flex items-center gap-1 py-0.5 px-2 max-w-[120px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(val);
                    }}
                  >
                    <span className="truncate">{option?.label || val}</span>
                    <X className="h-3 w-3 cursor-pointer shrink-0" />
                  </Badge>
                );
              })}
              {selected.length > 2 && (
                <Badge
                  variant="secondary"
                  className="bg-orange-50 text-orange-600 border border-orange-100 py-0.5 px-2"
                >
                  + {selected.length - 2} lainnya
                </Badge>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 pointer-events-auto" style={{ width: 'var(--radix-popover-trigger-width)' }}>
          <Command shouldFilter={!onSearchChange}>
            <CommandInput 
              placeholder={searchPlaceholder} 
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList className="max-h-64 custom-scrollbar">
              <CommandEmpty>
                {isLoading ? (
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ) : (
                  emptyMessage
                )}
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-medium truncate">{option.label}</span>
                      {option.description && (
                        <span className="text-[10px] text-muted-foreground truncate opacity-70">
                          {option.description}
                        </span>
                      )}
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selected.includes(option.value) ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            {isLoading && (
              <div className="flex items-center justify-center py-2 bg-stone-50/50">
                <Spinner className="h-4 w-4 text-orange-500" />
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
