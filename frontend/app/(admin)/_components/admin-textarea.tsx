"use client";

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export const AdminTextarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(
  function AdminTextarea({ className, onInput, ...props }, ref) {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);

    useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement, []);

    function resize() {
      const element = innerRef.current;
      if (!element) return;

      element.style.height = "auto";
      element.style.height = `${element.scrollHeight}px`;
    }

    useLayoutEffect(() => {
      resize();
    }, [props.value, props.defaultValue]);

    return (
      <textarea
        ref={innerRef}
        className={cn(
          "box-border min-h-[100px] w-full resize-none overflow-hidden rounded-lg border border-[#D6D0C6] bg-white px-4 py-3 text-base text-[#1A1714] outline-none placeholder:text-[#B0AAA2] focus:border-[#2A4232] focus:ring-4 focus:ring-[#2A4232]/10 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        onInput={(event) => {
          onInput?.(event);
          resize();
        }}
        value={props.value}
        defaultValue={props.defaultValue}
        {...props}
      />
    );
  },
);
