"use client";

import {
  ChevronDown,
  ChevronRight,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/registry/zbanx/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
} from "@/registry/zbanx/ui/collapsible";
import { Input } from "@/registry/zbanx/ui/input";

export interface GroupedCheckItem {
  id: string;
  value: string;
  label: string;
}

export interface GroupedCheckGroup {
  id: string;
  name: string;
  items: GroupedCheckItem[];
}

export type GroupedCheckValue = string | null;

export interface GroupedCheckPanelProps {
  groups: GroupedCheckGroup[];
  selectedValues?: GroupedCheckValue[];
  onChange?: (values: GroupedCheckValue[]) => void;
  disabled?: boolean;
  className?: string;
  showSelectedCount?: boolean;
  showEmpty?: boolean;
  loading?: boolean;
  error?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
}

function uniqueItems(groups: GroupedCheckGroup[]): GroupedCheckItem[] {
  const seen = new Set<string>();
  return groups.flatMap((group) =>
    group.items.filter((item) => {
      if (seen.has(item.value)) return false;
      seen.add(item.value);
      return true;
    })
  );
}

function toggleValues(
  values: GroupedCheckValue[],
  items: GroupedCheckItem[]
): GroupedCheckValue[] {
  const itemValues = items.map((item) => item.value);
  const selected = itemValues.every((value) => values.includes(value));
  if (selected) {
    return values.filter(
      (value) => value === null || !itemValues.includes(value)
    );
  }
  return [...values, ...itemValues.filter((value) => !values.includes(value))];
}

export function GroupedCheckPanel({
  groups,
  selectedValues = [],
  onChange,
  disabled = false,
  className,
  showSelectedCount = false,
  showEmpty = false,
  loading = false,
  error = false,
  searchPlaceholder = "搜索",
  emptyText = "没有匹配项",
}: GroupedCheckPanelProps) {
  const [searchValue, setSearchValue] = useState("");
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(
    new Set()
  );
  const allItems = useMemo(() => uniqueItems(groups), [groups]);
  const normalizedSearch = searchValue.trim().toLocaleLowerCase();
  const visibleGroups = useMemo(() => {
    if (!normalizedSearch) return groups;
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          `${item.label} ${item.value}`
            .toLocaleLowerCase()
            .includes(normalizedSearch)
        ),
      }))
      .filter(
        (group) =>
          group.name.toLocaleLowerCase().includes(normalizedSearch) ||
          group.items.length > 0
      );
  }, [groups, normalizedSearch]);

  const emit = (values: GroupedCheckValue[]) => {
    if (!disabled) onChange?.([...new Set(values)]);
  };
  const selectedStrings = selectedValues.filter(
    (value): value is string => value !== null
  );
  const emptySelected = selectedValues.includes(null);
  const selectedCount = allItems.filter((item) =>
    selectedStrings.includes(item.value)
  ).length;
  // "全部" is based on listed values; an optional empty value must not block
  // clearing the listed values after the parent normalizes it away.
  const allChecked = allItems.length > 0 && selectedCount === allItems.length;
  const allIndeterminate =
    (selectedCount > 0 || (showEmpty && emptySelected)) && !allChecked;

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="relative z-10 shrink-0 rounded-t-xl bg-background p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={searchPlaceholder}
            disabled={disabled}
            className="h-8 pr-7 pl-8"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => setSearchValue("")}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="清空搜索"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1">
        {loading && (
          <div className="flex h-20 items-center justify-center gap-2 text-muted-foreground text-sm">
            <LoaderCircle className="size-4 animate-spin" />
            加载中...
          </div>
        )}
        {error && <p className="p-3 text-destructive text-sm">数据加载失败</p>}
        {!loading && !error && (
          <>
            <div className="pb-1">
              <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent">
                <Checkbox
                  checked={allChecked}
                  indeterminate={allIndeterminate}
                  disabled={disabled}
                  onCheckedChange={() =>
                    emit(
                      allChecked
                        ? selectedValues.filter(
                            (value) =>
                              value !== null &&
                              !allItems.some((item) => item.value === value)
                          )
                        : [
                            ...selectedValues,
                            ...allItems.map((item) => item.value),
                            ...(showEmpty ? [null] : []),
                          ]
                    )
                  }
                />
                <span>全部</span>
              </label>
              {showEmpty && (
                <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent">
                  <Checkbox
                    checked={emptySelected}
                    disabled={disabled}
                    onCheckedChange={() =>
                      emit(
                        emptySelected
                          ? selectedValues.filter((value) => value !== null)
                          : [...selectedValues, null]
                      )
                    }
                  />
                  <span>空</span>
                </label>
              )}
            </div>
            {visibleGroups.map((group) => {
              const selectedGroupCount = group.items.filter((item) =>
                selectedStrings.includes(item.value)
              ).length;
              const groupChecked =
                group.items.length > 0 &&
                selectedGroupCount === group.items.length;
              const groupIndeterminate =
                selectedGroupCount > 0 && !groupChecked;
              const expanded = expandedGroupIds.has(group.id);
              return (
                <Collapsible key={group.id} open={expanded}>
                  <div
                    className="relative flex min-h-9 cursor-pointer items-center rounded-md hover:bg-sidebar-accent"
                    onClick={() =>
                      setExpandedGroupIds((current) => {
                        const next = new Set(current);
                        if (next.has(group.id)) next.delete(group.id);
                        else next.add(group.id);
                        return next;
                      })
                    }
                  >
                    <button
                      type="button"
                      className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                      aria-label={`${expanded ? "收起" : "展开"}${group.name}`}
                    >
                      {expanded ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </button>
                    <Checkbox
                      checked={groupChecked}
                      indeterminate={groupIndeterminate}
                      disabled={disabled}
                      onClick={(event) => event.stopPropagation()}
                      onCheckedChange={() =>
                        emit(toggleValues(selectedValues, group.items))
                      }
                      aria-label={`选择${group.name}`}
                    />
                    <span className="min-w-0 shrink truncate px-2 font-medium text-sm">
                      {group.name}
                    </span>
                    {showSelectedCount && selectedGroupCount > 0 && (
                      <span className="pr-2 text-muted-foreground text-xs">
                        {selectedGroupCount}
                      </span>
                    )}
                  </div>
                  <CollapsibleContent className="pl-7">
                    {group.items.map((item) => (
                      <label
                        key={`${group.id}-${item.value}`}
                        className={cn(
                          "flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent",
                          disabled && "cursor-not-allowed opacity-50"
                        )}
                      >
                        <Checkbox
                          checked={selectedStrings.includes(item.value)}
                          disabled={disabled}
                          onCheckedChange={() =>
                            emit(
                              selectedStrings.includes(item.value)
                                ? selectedValues.filter(
                                    (value) => value !== item.value
                                  )
                                : [...selectedValues, item.value]
                            )
                          }
                        />
                        <span className="truncate">{item.label}</span>
                      </label>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
            {visibleGroups.length === 0 && (
              <p className="p-3 text-center text-muted-foreground text-sm">
                {emptyText}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default GroupedCheckPanel;
