"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<string, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        id={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs",
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground",
          "[&_.recharts-cartesian-grid_line]:stroke-border/70",
          "[&_.recharts-curve.recharts-area-curve]:vector-effect:non-scaling-stroke",
          "[&_.recharts-curve.recharts-line-curve]:vector-effect:non-scaling-stroke",
          "[&_.recharts-polar-grid_line]:stroke-border/70",
          "[&_.recharts-polar-angle-axis-tick_text]:fill-muted-foreground",
          "[&_.recharts-polar-radius-axis-tick_text]:fill-muted-foreground",
          "[&_.recharts-tooltip-cursor]:border-border/50",
          "[&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(
    ([, c]) => c.color || c.theme
  );

  if (!colorConfig.length) {
    return null;
  }

  const style = Object.fromEntries(
    colorConfig.flatMap(([key, itemConfig]) => {
      const color = itemConfig.color || itemConfig.theme?.light;
      if (!color) {
        return [];
      }
      return [[`--color-${key}`, color]];
    })
  );

  return (
    <style
      // biome-ignore lint/security/noDangerouslySetInnerHtml: content is derived from the chart config object, not user input
      dangerouslySetInnerHTML={{
        __html: `#${id} {\n${Object.entries(style)
          .map(([k, v]) => `${k}: ${v};`)
          .join("\n")}\n}`,
      }}
    />
  );
}

interface ChartTooltipContentProps {
  active?: boolean | undefined;
  payload?: Array<{
    dataKey?: string | number;
    name?: string;
    value?: number | string;
    color?: string;
    payload?: { fill?: string } & Record<string, unknown>;
  }>;
  className?: string;
  indicator?: "line" | "dot" | "dashed";
  hideLabel?: boolean;
  hideIndicator?: boolean;
  label?: React.ReactNode;
  labelFormatter?: (
    value: React.ReactNode,
    payload: ChartTooltipContentProps["payload"]
  ) => React.ReactNode;
  labelClassName?: string;
  formatter?: (
    value: number,
    name: string,
    item: NonNullable<ChartTooltipContentProps["payload"]>[number],
    index: number,
    payload: ChartTooltipContentProps["payload"]
  ) => React.ReactNode;
  color?: string;
  nameKey?: string;
  labelKey?: string;
}

function ChartTooltip({
  ...props
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip>) {
  return <RechartsPrimitive.Tooltip {...props} />;
}

// recharts 通过 displayName/name 匹配 Tooltip 子节点来挂载 wrapper 鼠标事件；
// 不透出该标识会导致 tooltip 永远不触发。
ChartTooltip.displayName = "Tooltip";

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: ChartTooltipContentProps) {
  const { config } = useChart();

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null;
    }
    const [item] = payload;
    const key = `${labelKey || item?.dataKey || item?.name || "value"}`;
    const itemConfig = config[key as keyof typeof config];
    const value =
      !labelKey && typeof label === "string"
        ? config[label as keyof typeof config]?.label || label
        : itemConfig?.label;
    if (labelFormatter && value) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      );
    }
    return value ? (
      <div className={cn("font-medium", labelClassName)}>{value}</div>
    ) : null;
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ]);

  if (!active || !payload?.length) {
    return null;
  }

  const nestLabel = payload.length === 1 && indicator !== "dot";
  let nestIndicator = indicator;
  if (nestLabel) {
    nestIndicator = "dot";
  }

  return (
    <div
      className={cn(
        "grid min-w-[8rem] gap-1.5 rounded-lg border-border/50 bg-background/80 px-2.5 py-1.5 text-xs shadow-xl backdrop-blur",
        className
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${nameKey || item.name || item.dataKey || "value"}`;
          const itemConfig = config[key as keyof typeof config];
          const indicatorColor =
            color || item.payload?.fill || item.color || itemConfig?.color;

          return (
            <div
              key={String(item.dataKey)}
              className={cn(
                "flex w-full flex-wrap items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground",
                nestLabel ? "flex-row" : "items-stretch"
              )}
            >
              {nestLabel && nestIndicator !== "dot" ? (
                <div
                  className={cn(
                    "flex-1 flex-row self-center",
                    nestIndicator === "line"
                      ? "border-l-2"
                      : "border-l-2 border-dashed",
                    "h-0.5"
                  )}
                  style={{ borderColor: indicatorColor }}
                />
              ) : (
                !hideIndicator && (
                  <div
                    className={cn(
                      "shrink-0 self-center rounded-sm",
                      nestIndicator === "line" ? "h-0.5 w-3" : "size-2.5",
                      nestLabel && "self-center"
                    )}
                    style={{
                      backgroundColor: indicatorColor,
                    }}
                  />
                )
              )}
              <div className="flex flex-1 gap-2 leading-none">
                {nestLabel ? (
                  <div className="grid gap-0.5">
                    <span className="text-muted-foreground">
                      {itemConfig?.label || item.name}
                    </span>
                    {item.value !== undefined && (
                      <span className="font-medium font-mono text-foreground">
                        {formatter
                          ? formatter(
                              item.value as number,
                              item.name ?? "",
                              item,
                              index,
                              payload
                            )
                          : (item.value as number).toLocaleString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <>
                    <span className="text-muted-foreground">
                      {itemConfig?.label || item.name}
                    </span>
                    {item.value !== undefined && (
                      <span className="font-medium font-mono text-foreground">
                        {formatter
                          ? formatter(
                              item.value as number,
                              item.name ?? "",
                              item,
                              index,
                              payload
                            )
                          : (item.value as number).toLocaleString()}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {nestLabel ? tooltipLabel : null}
    </div>
  );
}

interface ChartLegendContentProps {
  className?: string;
  nameKey?: string;
  payload?: Array<{
    dataKey?: string | number;
    name?: string;
    color?: string;
    value?: number | string;
  }>;
}

function ChartLegend(
  props: Omit<React.ComponentProps<typeof RechartsPrimitive.Legend>, "ref">
) {
  return <RechartsPrimitive.Legend {...props} />;
}

function ChartLegendContent({
  className,
  nameKey,
  ...props
}: ChartLegendContentProps) {
  const { config } = useChart();
  const payload = props.payload;

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-4 text-xs",
        className
      )}
    >
      {payload.map((item, index) => {
        const key = `${nameKey || item.dataKey || item.name || "value"}`;
        const itemConfig = config[key as keyof typeof config];

        return (
          <div
            key={`${String(itemConfig?.label ?? key)}-${index}`}
            className="flex items-center gap-1.5"
          >
            <span
              className="size-2.5 shrink-0 rounded-sm"
              style={{
                backgroundColor: item.color || itemConfig?.color,
              }}
            />
            <span className="text-muted-foreground">
              {itemConfig?.label || item.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  useChart,
};
