"use client";

import { type ReactElement, useState } from "react";
import { Button } from "@/registry/zbanx/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/registry/zbanx/ui/popover";

export interface PopoverConfirmProps {
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  children: ReactElement;
}

export function PopoverConfirm({
  onConfirm,
  title = "确认操作",
  description = "该操作提交后不可撤回，是否继续？",
  confirmText = "确认",
  cancelText = "取消",
  children,
}: PopoverConfirmProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={children} />
      <PopoverContent align="end" className="w-64">
        <PopoverHeader>
          <PopoverTitle>{title}</PopoverTitle>
          <PopoverDescription>{description}</PopoverDescription>
        </PopoverHeader>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default PopoverConfirm;
