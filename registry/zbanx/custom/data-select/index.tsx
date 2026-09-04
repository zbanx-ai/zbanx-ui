"use client";

import { ChevronsUpDown, X } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/zbanx/ui/popover";
import { ScrollArea } from "@/registry/zbanx/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/registry/zbanx/ui/tooltip";

export type DataSelectItem<T> = {
  key: string;
  value: T;
  label: string;
};

export type DataSelectProps<T> = {
  selectedItems: DataSelectItem<T>[];
  content: React.ReactNode;
  onChange?: (value: T[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  variant?: "form" | "condition";
  conditionLabel?: string;
};

function SelectTag({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="flex h-5 min-w-0 shrink-0 items-center gap-0.5 rounded border border-border bg-secondary pr-1 pl-1.5 text-secondary-foreground text-xs" />
        }
      >
        <span className="min-w-0 max-w-32 truncate">{label}</span>
        <span
          role="button"
          tabIndex={0}
          className="shrink-0 cursor-pointer rounded-sm text-muted-foreground transition-colors hover:text-foreground"
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.stopPropagation();
              onRemove();
            }
          }}
          aria-label={`移除${label}`}
        >
          <X className="size-3" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-72 break-all">{label}</TooltipContent>
    </Tooltip>
  );
}

function SelectValueDisplay<T>({
  items,
  onRemove,
  onClear,
}: {
  items: DataSelectItem<T>[];
  onRemove: (value: T) => void;
  onClear: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const calculate = () => {
      const widths = Array.from(measure.children).map(
        (child) => (child as HTMLElement).getBoundingClientRect().width
      );
      const availableWidth = Math.max(container.clientWidth - 24, 0);
      const gap = 4;
      let usedWidth = 0;
      let nextCount = 0;

      for (let index = 0; index < widths.length; index += 1) {
        const width = widths[index];
        if (width === undefined) break;
        const nextWidth = usedWidth + (index > 0 ? gap : 0) + width;
        const remaining = widths.length - index - 1;
        if (remaining > 0) {
          const moreWidth = `+${remaining}`.length * 7 + 16;
          if (nextWidth + gap + moreWidth > availableWidth) break;
        } else if (nextWidth > availableWidth) {
          break;
        }
        usedWidth = nextWidth;
        nextCount = index + 1;
      }

      setVisibleCount(nextCount);
    };

    if (items.length === 0) setVisibleCount(0);
    calculate();
    const observer = new ResizeObserver(calculate);
    observer.observe(container);
    observer.observe(measure);
    return () => observer.disconnect();
  }, [items]);

  const visibleItems = items.slice(0, visibleCount);
  const hiddenItems = items.slice(visibleCount);

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1 pr-5">
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute inset-x-0 top-0 flex gap-1 overflow-hidden whitespace-nowrap"
      >
        {items.map((item) => (
          <span
            key={item.key}
            className="inline-flex h-5 max-w-32 shrink-0 items-center gap-0.5 rounded border border-border bg-secondary pr-1 pl-1.5 text-secondary-foreground text-xs"
          >
            <span className="truncate">{item.label}</span>
            <span className="inline-flex size-3 shrink-0 items-center justify-center">
              <X className="size-3" />
            </span>
          </span>
        ))}
      </div>
      <div className="flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden whitespace-nowrap py-1">
        {visibleItems.map((item) => (
          <SelectTag
            key={item.key}
            label={item.label}
            onRemove={() => onRemove(item.value)}
          />
        ))}
        {hiddenItems.length > 0 && (
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="inline-flex h-5 shrink-0 cursor-pointer items-center rounded border border-border bg-secondary px-1.5 text-secondary-foreground text-xs" />
              }
            >
              +{hiddenItems.length}
            </TooltipTrigger>
            <TooltipContent className="max-w-[min(24rem,calc(100vw-2rem))] p-0">
              <ScrollArea
                className="p-2"
                style={{ height: getTooltipHeight(hiddenItems.length) }}
              >
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 break-all">
                  {hiddenItems.map((item) => (
                    <div key={item.key}>{item.label}</div>
                  ))}
                </div>
              </ScrollArea>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <span
        role="button"
        tabIndex={0}
        className="absolute top-1/2 right-0 -translate-y-1/2 cursor-pointer rounded-sm bg-background pl-1 text-muted-foreground hover:text-foreground"
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => {
          event.stopPropagation();
          onClear();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            onClear();
          }
        }}
        aria-label="清空选择"
      >
        <X className="size-4" />
      </span>
    </div>
  );
}

function getTooltipHeight(itemCount: number) {
  return Math.min(256, Math.max(40, Math.ceil(itemCount / 2) * 20 + 16));
}

export function DataSelect<T>({
  selectedItems,
  content,
  onChange,
  placeholder = "请选择",
  disabled = false,
  className,
  contentClassName,
  variant = "form",
  conditionLabel,
}: DataSelectProps<T>) {
  const [open, setOpen] = useState(false);

  const updateValue = (nextValue: T[]) => {
    if (!disabled) onChange?.(nextValue);
  };

  return (
    <div className="min-w-0">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              disabled={disabled}
              className={cn(
                variant === "condition"
                  ? "inline-flex h-6 cursor-pointer items-center gap-1 rounded-full border border-border bg-secondary px-2 text-secondary-foreground text-xs transition-colors hover:bg-accent"
                  : "flex min-h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-2 text-left text-sm",
                selectedItems.length === 0 && "text-muted-foreground",
                className
              )}
            />
          }
        >
          {variant === "condition" && conditionLabel && (
            <span className="text-muted-foreground">{conditionLabel}：</span>
          )}
          {selectedItems.length === 0 ? (
            <span className="min-w-0 flex-1 truncate">{placeholder}</span>
          ) : variant === "condition" ? (
            <span className="min-w-0 flex-1 truncate font-medium">
              {selectedItems[0]?.label}
              {selectedItems.length > 1 && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span className="ml-1 inline-flex cursor-pointer rounded bg-muted px-1 font-normal text-muted-foreground" />
                    }
                  >
                    +{selectedItems.length - 1}
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[min(24rem,calc(100vw-2rem))] p-0">
                    <ScrollArea
                      className="p-2"
                      style={{
                        height: getTooltipHeight(selectedItems.length - 1),
                      }}
                    >
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 break-all">
                        {selectedItems.slice(1).map((item) => (
                          <div key={item.key}>{item.label}</div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TooltipContent>
                </Tooltip>
              )}
            </span>
          ) : (
            <SelectValueDisplay
              items={selectedItems}
              onRemove={(item) =>
                updateValue(
                  selectedItems
                    .map((selectedItem) => selectedItem.value)
                    .filter((valueItem) => valueItem !== item)
                )
              }
              onClear={() => updateValue([])}
            />
          )}
          {selectedItems.length === 0 && (
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          )}
          {variant === "condition" && selectedItems.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="清空选择"
              onMouseDown={(event) => event.preventDefault()}
              onClick={(event) => {
                event.stopPropagation();
                updateValue([]);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  updateValue([]);
                }
              }}
            >
              <X className="size-3.5" />
            </span>
          )}
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "h-120 w-(--anchor-width) max-w-[calc(100vw-2rem)] p-0",
            contentClassName
          )}
          align="start"
        >
          {content}
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default DataSelect;
