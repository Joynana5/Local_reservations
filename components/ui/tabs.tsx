"use client";

import Link from "next/link";
import { useRef } from "react";
import type { KeyboardEvent } from "react";

export interface TabItem {
  id: string;
  label: string;
  href?: string;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  label: string;
  onChange?: (id: string) => void;
}

const tabClasses = (active: boolean, disabled: boolean) =>
  [
    "-mb-px inline-flex items-center gap-2 border-b-2 px-1 py-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
    active ? "border-brand font-bold text-ink" : "border-transparent text-muted",
    disabled ? "cursor-not-allowed" : "hover:text-ink",
  ].join(" ");

export function Tabs({ tabs, activeId, label, onChange }: TabsProps) {
  const refs = useRef(new Map<string, HTMLElement>());

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const enabled = tabs.filter((tab) => !tab.disabled);
    if (enabled.length === 0) return;
    const focusedId = [...refs.current.entries()].find(
      ([, element]) => element === document.activeElement,
    )?.[0];
    const index = enabled.findIndex((tab) => tab.id === (focusedId ?? activeId));

    let next: number;
    if (event.key === "ArrowRight") next = (index + 1) % enabled.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + enabled.length) % enabled.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = enabled.length - 1;
    else return;

    event.preventDefault();
    const target = enabled[next];
    refs.current.get(target.id)?.focus();
    if (!target.href) onChange?.(target.id);
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className="flex gap-6 border-b border-line"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        const disabled = Boolean(tab.disabled);
        const setRef = (element: HTMLElement | null) => {
          if (element) refs.current.set(tab.id, element);
          else refs.current.delete(tab.id);
        };
        const common = {
          role: "tab",
          id: `tab-${tab.id}`,
          "aria-selected": active,
          tabIndex: active && !disabled ? 0 : -1,
          className: tabClasses(active, disabled),
        } as const;

        if (disabled) {
          return (
            <span key={tab.id} {...common} aria-disabled="true">
              {tab.label}
              <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-xs font-bold text-muted">
                Soon
              </span>
            </span>
          );
        }

        if (tab.href) {
          return (
            <Link key={tab.id} href={tab.href} ref={setRef} {...common}>
              {tab.label}
            </Link>
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
            ref={setRef}
            {...common}
            onClick={() => onChange?.(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
