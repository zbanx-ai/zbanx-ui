"use client";

import {
  ArrowUp,
  Check,
  ChevronDown,
  FileText,
  Mic,
  Paperclip,
  Plus,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { KeyboardEventHandler, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/registry/zbanx/ui/badge";
import { Button } from "@/registry/zbanx/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "@/registry/zbanx/ui/input-group";

export interface AgentPromptBarSource {
  key: string;
  name: string;
  desc?: string;
  /** 调用方传入的图标（lucide 或业务图标），包内不硬编码品牌 SVG */
  icon?: ReactNode;
  /** 为 true 时选中即打开文件选择器，而非插入 @ 文本 */
  upload?: boolean;
  /** 为 true 时行尾渲染连接操作 */
  connectable?: boolean;
}

export interface AgentPromptBarCommand {
  key: string;
  name: string;
  desc?: string;
  /** 调用方传入的图标（与来源行同式渲染） */
  icon?: ReactNode;
}

export interface AgentPromptBarModel {
  key: string;
  name: string;
  tag?: string;
}

export interface AgentPromptBarSubmit {
  text: string;
  files: File[];
}

export interface AgentPromptBarAttachmentOptions {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  onError?: (message: string) => void;
}

export interface AgentPromptBarProps {
  sources?: AgentPromptBarSource[];
  commands?: AgentPromptBarCommand[];
  models?: AgentPromptBarModel[];
  initialModelKey?: string;
  placeholder?: string;
  variant?: "rounded" | "pill";
  attachmentOptions?: AgentPromptBarAttachmentOptions;
  /** 听写转写由调用方注入；不传则不渲染麦克风按钮 */
  transcribeDictation?: () => Promise<string>;
  onSubmit: (message: AgentPromptBarSubmit) => void | Promise<void>;
  onConnectSource?: (key: string) => void | Promise<void>;
  onModelChange?: (model: AgentPromptBarModel) => void;
  atHint?: string;
  slashHint?: string;
  emptyText?: string;
  connectLabel?: string;
  connectedLabel?: string;
  listeningLabel?: string;
  className?: string;
}

type Token = { kind: "at" | "slash"; query: string; start: number };

/**
 * 正在输入的最后一个 @词 / /词（尾部匹配语义）。
 * 尾词用“非空白、非 @/”匹配而非 \w，使中文 handle（如 @谈判助手）也可键入过滤。
 */
function parseToken(draft: string): Token | null {
  const match = /(^|\s)([@/])([^\s@/]*)$/.exec(draft);
  if (!match) return null;
  const signal = match[2] ?? "";
  const query = match[3] ?? "";
  const gap = match[1] ?? "";
  return {
    kind: signal === "@" ? "at" : "slash",
    query: query.toLowerCase(),
    start: match.index + gap.length,
  };
}

const MENU_EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

export function AgentPromptBar({
  sources = [],
  commands = [],
  models = [],
  initialModelKey,
  placeholder = "说出达人需求，如：帮我找 10 个美国美妆 TikTok 达人…",
  variant = "rounded",
  attachmentOptions,
  transcribeDictation,
  onSubmit,
  onConnectSource,
  onModelChange,
  atHint = "输入可搜索子助手",
  slashHint = "输入可搜索指令",
  emptyText = "无匹配",
  connectLabel = "连接",
  connectedLabel = "已连接",
  listeningLabel = "听写中…",
  className,
}: AgentPromptBarProps) {
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [modelKey, setModelKey] = useState(
    initialModelKey ?? models[0]?.key ?? ""
  );
  const [connectedKeys, setConnectedKeys] = useState<Set<string>>(new Set());
  const [active, setActive] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const [listening, setListening] = useState(false);
  const reduceMotion = useReducedMotion();
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const model = models.find((item) => item.key === modelKey) ?? models[0];
  const token = dismissed ? null : parseToken(draft);
  const menu: "at" | "slash" | null = plusOpen ? "at" : (token?.kind ?? null);
  const query = plusOpen ? "" : (token?.query ?? "");

  const rows: { key: string; name: string; desc?: string; icon?: ReactNode }[] =
    menu === "at"
      ? sources.filter((source) =>
          `${source.name}${source.desc ?? ""}`.toLowerCase().includes(query)
        )
      : menu === "slash"
        ? commands.filter((command) => command.name.slice(1).startsWith(query))
        : [];

  // menu/query 由 draft/dismissed/plusOpen 派生，依赖根状态即可
  // biome-ignore lint/correctness/useExhaustiveDependencies: derived menu/query reset
  useEffect(() => {
    setActive(0);
    setEngaged(false);
  }, [draft, dismissed, plusOpen]);

  /* 点击 composer 之外关闭打开的菜单 */
  useEffect(() => {
    if (!(modelOpen || plusOpen)) return;
    const close = (event: PointerEvent) => {
      if (
        !(event.target as Element).closest("[data-slot='agent-prompt-bar']")
      ) {
        setModelOpen(false);
        setPlusOpen(false);
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [modelOpen, plusOpen]);

  const closeMenus = () => {
    setPlusOpen(false);
    setModelOpen(false);
  };

  const addFiles = (incoming: File[] | FileList) => {
    const list = [...incoming];
    if (list.length === 0) return;
    const {
      accept,
      multiple = true,
      maxFiles,
      maxFileSize,
      onError,
    } = attachmentOptions ?? {};
    if (!multiple && (list.length > 1 || files.length > 0)) {
      onError?.("一次只能添加一个文件");
      return;
    }
    let accepted = list;
    if (accept?.trim()) {
      const patterns = accept
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
      accepted = list.filter((file) =>
        patterns.some((pattern) => {
          if (pattern.endsWith("/*"))
            return file.type.startsWith(pattern.slice(0, -1));
          if (pattern.startsWith(".")) {
            return file.name.toLowerCase().endsWith(pattern.toLowerCase());
          }
          return file.type === pattern;
        })
      );
      if (accepted.length === 0) {
        onError?.("文件类型不支持");
        return;
      }
    }
    if (maxFileSize) {
      accepted = accepted.filter((file) => file.size <= maxFileSize);
      if (accepted.length === 0) {
        onError?.("文件超出大小限制");
        return;
      }
    }
    if (typeof maxFiles === "number") {
      const room = Math.max(0, maxFiles - files.length);
      if (room === 0) {
        onError?.("附件数量已达上限");
        return;
      }
      if (accepted.length > room) {
        onError?.("附件数量已达上限，部分文件未添加");
        accepted = accepted.slice(0, room);
      }
    }
    setFiles((current) => [...current, ...accepted]);
  };

  const pick = (row: { key: string; name: string }) => {
    const source = sources.find((item) => item.key === row.key);
    if (source?.upload) {
      if (token) setDraft(draft.slice(0, token.start));
      setPlusOpen(false);
      setDismissed(false);
      fileInputRef.current?.click();
      inputRef.current?.focus();
      return;
    }
    if (menu === "at") {
      // token.start 保留已键入的 @ 符号，名字自带 @ 时去重（如 @邀约助手）
      const handle = row.name.startsWith("@") ? row.name.slice(1) : row.name;
      setDraft(`${token ? draft.slice(0, token.start) : draft}@${handle} `);
    } else {
      setDraft(`${token ? draft.slice(0, token.start) : draft}${row.name} `);
    }
    setPlusOpen(false);
    setDismissed(false);
    inputRef.current?.focus();
  };

  const toggleConnect = (key: string) => {
    setConnectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    void onConnectSource?.(key);
  };

  const selectModel = (next: AgentPromptBarModel) => {
    setModelKey(next.key);
    setModelOpen(false);
    onModelChange?.(next);
    inputRef.current?.focus();
  };

  const toggleDictation = () => {
    if (listening) {
      setListening(false);
      return;
    }
    if (!transcribeDictation) return;
    setListening(true);
    void transcribeDictation()
      .then((text) => {
        if (text.trim()) {
          setDraft((current) =>
            current ? `${current.trimEnd()} ${text.trim()}` : text.trim()
          );
        }
      })
      .finally(() => {
        setListening(false);
        inputRef.current?.focus();
      });
  };

  const canSend = draft.trim().length > 0 || files.length > 0;

  const send = () => {
    if (!canSend || listening) return;
    const result = onSubmit({ text: draft.trim(), files });
    if (result instanceof Promise) {
      void result.catch(() => undefined);
    }
    setDraft("");
    setFiles([]);
    closeMenus();
  };

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (menu && rows.length > 0) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setEngaged(true);
        setActive(
          (current) =>
            (current + (event.key === "ArrowDown" ? 1 : rows.length - 1)) %
            rows.length
        );
        return;
      }
      if ((event.key === "Enter" && !event.shiftKey) || event.key === "Tab") {
        const target = rows[active] ?? rows[0];
        if (!target) return;
        event.preventDefault();
        pick(target);
        return;
      }
    }
    if (event.key === "Escape") {
      setDismissed(true);
      closeMenus();
      return;
    }
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      send();
    }
  };

  const singleLine = !draft.includes("\n") && files.length === 0;
  const motionTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: MENU_EASE };

  return (
    <div
      data-slot="agent-prompt-bar"
      ref={anchorRef}
      className={cn("relative w-full", className)}
    >
      <input
        ref={fileInputRef}
        type="file"
        aria-label="上传附件"
        className="hidden"
        accept={attachmentOptions?.accept}
        multiple={attachmentOptions?.multiple ?? true}
        onChange={(event) => {
          if (event.currentTarget.files) addFiles(event.currentTarget.files);
          event.currentTarget.value = "";
        }}
      />

      {/* @ / 指令菜单：motion 弹出 + layoutId 滑块高亮 */}
      <AnimatePresence>
        {menu && (
          <motion.div
            initial={
              reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }
            }
            animate={
              reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }
            }
            exit={
              reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }
            }
            transition={motionTransition}
            style={{ transformOrigin: "bottom center" }}
            className="absolute inset-x-0 bottom-full z-10 mb-2"
            role="listbox"
            aria-label={menu === "at" ? "来源与文件" : "指令"}
            onMouseLeave={() => setEngaged(false)}
          >
            <div className="rounded-[10px] border bg-popover p-1 shadow-md">
              {rows.map((row, index) => {
                const source =
                  menu === "at"
                    ? sources.find((item) => item.key === row.key)
                    : undefined;
                const isActive = index === active;
                return (
                  <Button
                    key={row.key}
                    type="button"
                    variant="ghost"
                    size="sm"
                    role="option"
                    aria-selected={isActive}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => {
                      setActive(index);
                      setEngaged(true);
                    }}
                    onClick={() => pick(row)}
                    className="relative h-9 w-full justify-start gap-2.5 overflow-hidden px-2 text-left"
                  >
                    {isActive && engaged && (
                      <motion.span
                        layoutId="agent-prompt-bar-row-highlight"
                        aria-hidden
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : { duration: 0.22, ease: MENU_EASE }
                        }
                        className="absolute inset-0 rounded-md bg-muted"
                      />
                    )}
                    <span className="relative z-10 flex w-full items-center gap-2.5">
                      {row.icon ? (
                        <span className="flex size-6 shrink-0 items-center justify-center">
                          {row.icon}
                        </span>
                      ) : (
                        source && (
                          <span className="flex size-6 shrink-0 items-center justify-center text-muted-foreground">
                            <FileText className="size-4" />
                          </span>
                        )
                      )}
                      <span className="shrink-0 font-medium text-[12.5px] text-foreground">
                        {row.name}
                      </span>
                      {row.desc && (
                        <span className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">
                          {row.desc}
                        </span>
                      )}
                      {source?.connectable && (
                        <span
                          role="button"
                          tabIndex={-1}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleConnect(source.key);
                          }}
                          className={cn(
                            "shrink-0 font-medium text-[12px]",
                            connectedKeys.has(source.key)
                              ? "text-green-600"
                              : "text-primary hover:underline"
                          )}
                        >
                          {connectedKeys.has(source.key)
                            ? connectedLabel
                            : connectLabel}
                        </span>
                      )}
                    </span>
                  </Button>
                );
              })}
              {rows.length === 0 && (
                <div className="flex h-9 items-center px-2 text-[12px] text-muted-foreground">
                  {emptyText}“{query}”
                </div>
              )}
              <div className="mt-1 border-t px-2 pt-1.5 pb-1 text-[11px] text-muted-foreground">
                {menu === "at" ? atHint : slashHint}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 模型菜单：锚定 composer 左下，不做手动 getBoundingClientRect 测量 */}
      <AnimatePresence>
        {modelOpen && models.length > 0 && (
          <motion.div
            initial={
              reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }
            }
            animate={
              reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }
            }
            exit={
              reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }
            }
            transition={motionTransition}
            style={{ transformOrigin: "bottom left" }}
            className="absolute bottom-full left-0 z-10 mb-2 w-44"
            role="listbox"
            aria-label="选择模型"
            onMouseLeave={() => setModelOpen(false)}
          >
            <div className="rounded-[10px] border bg-popover p-1 shadow-md">
              {models.map((item) => {
                const isActive = item.key === model?.key;
                return (
                  <Button
                    key={item.key}
                    type="button"
                    variant="ghost"
                    size="sm"
                    role="option"
                    aria-selected={isActive}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectModel(item)}
                    className="relative h-7.5 w-full justify-start gap-2 overflow-hidden px-2 text-left"
                  >
                    {isActive && (
                      <motion.span
                        layoutId="agent-prompt-bar-model-highlight"
                        aria-hidden
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : { duration: 0.22, ease: MENU_EASE }
                        }
                        className="absolute inset-0 rounded-md bg-muted"
                      />
                    )}
                    <span className="relative z-10 flex w-full items-center gap-2">
                      <span className="min-w-0 flex-1 truncate font-medium text-[12.5px] text-foreground">
                        {item.name}
                      </span>
                      {item.tag && (
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {item.tag}
                        </span>
                      )}
                      <span
                        className={cn(
                          "shrink-0 text-foreground",
                          isActive ? "" : "invisible"
                        )}
                      >
                        <Check className="size-3.5" />
                      </span>
                    </span>
                  </Button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 输入区：shadcn InputGroup 组合 */}
      <InputGroup
        className={cn(
          "h-auto py-1.5",
          variant === "pill" && singleLine ? "rounded-full" : "rounded-[14px]"
        )}
      >
        <AnimatePresence initial={false}>
          {files.length > 0 && (
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={motionTransition}
              className="w-full"
            >
              <InputGroupAddon
                align="block-start"
                className="flex-wrap gap-1.5"
              >
                {files.map((file, index) => (
                  <Badge
                    key={`${file.name}-${file.size}-${index}`}
                    variant="secondary"
                    className="flex h-6.5 items-center gap-1.5 rounded-full py-1 pr-1 pl-2.5 font-normal text-[11.5px]"
                  >
                    <FileText className="size-3" />
                    <span className="max-w-36 truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`移除 ${file.name}`}
                      onClick={() =>
                        setFiles((current) =>
                          current.filter((_, position) => position !== index)
                        )
                      }
                      className="rounded-full"
                    >
                      <X className="size-3" />
                    </Button>
                  </Badge>
                ))}
              </InputGroupAddon>
            </motion.div>
          )}
        </AnimatePresence>

        <InputGroupTextarea
          ref={inputRef}
          rows={1}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setDismissed(false);
            setPlusOpen(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder={listening ? listeningLabel : placeholder}
          aria-label="智能体输入"
          aria-expanded={menu !== null}
          className="field-sizing-content max-h-48 min-h-10 flex-1 px-2.5 text-sm [overflow-wrap:anywhere]"
        />

        <InputGroupAddon align="block-end" className="justify-between gap-1">
          <span className="flex min-w-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="选择子助手"
              aria-expanded={plusOpen}
              onClick={() => {
                setModelOpen(false);
                setPlusOpen((current) => !current);
                inputRef.current?.focus();
              }}
              className={cn(plusOpen && "bg-muted text-foreground")}
            >
              <Plus className="size-4" />
            </Button>
            {attachmentOptions && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="添加附件"
                onClick={() => fileInputRef.current?.click()}
                className="text-muted-foreground"
              >
                <Paperclip className="size-4" />
              </Button>
            )}
            {model && models.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="选择模型"
                aria-expanded={modelOpen}
                onClick={() => {
                  setPlusOpen(false);
                  setModelOpen((current) => !current);
                }}
                className="max-w-40 shrink-0 gap-1 font-medium text-[12px]"
              >
                <span className="truncate">{model.name}</span>
                <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
              </Button>
            )}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {transcribeDictation && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={listening ? "停止听写" : "开始听写"}
                aria-pressed={listening}
                onClick={toggleDictation}
                className={cn(listening && "bg-primary/10 text-primary")}
              >
                {listening && !reduceMotion ? (
                  <span className="flex h-3.5 items-center gap-[2.5px]">
                    {[0, 1, 2].map((index) => (
                      <motion.span
                        key={index}
                        className="w-[2.5px] rounded-full bg-current"
                        animate={{ height: ["40%", "100%", "40%"] }}
                        transition={{
                          duration: 0.9,
                          ease: "easeInOut",
                          repeat: Number.POSITIVE_INFINITY,
                          delay: index * 0.15,
                        }}
                        style={{ height: "100%" }}
                      />
                    ))}
                  </span>
                ) : (
                  <Mic className="size-4" />
                )}
              </Button>
            )}
            <motion.span whileTap={reduceMotion ? undefined : { scale: 0.94 }}>
              <Button
                type="button"
                variant="default"
                size="icon-sm"
                aria-label="发送"
                disabled={!canSend || listening}
                onClick={send}
                className="rounded-full"
              >
                <ArrowUp className="size-4" />
              </Button>
            </motion.span>
          </span>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
