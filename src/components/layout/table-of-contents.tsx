"use client";

import * as React from "react";
import { List, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";

export interface TocItem {
  id: string;
  label: string;
}

interface TableOfContentsProps {
  items: TocItem[];
  className?: string;
}

export function TableOfContents({ items, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = React.useState<string>(items[0]?.id || "");
  const [isOpenMobile, setIsOpenMobile] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0% -60% 0%" },
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      el.focus();
      setActiveId(id);
      setIsOpenMobile(false);
    }
  };

  return (
    <nav aria-label="Table of contents" className={cn("text-sm", className)}>
      {/* Mobile Collapsible Disclosure (< 1024px) */}
      <div className="lg:hidden mb-6 rounded-md border border-border bg-surface p-3.5 shadow-xs">
        <button
          type="button"
          onClick={() => setIsOpenMobile((prev) => !prev)}
          className="flex w-full items-center justify-between font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary"
          aria-expanded={isOpenMobile}
        >
          <span className="flex items-center gap-2">
            <Icon icon={List} size={16} className="text-primary" />
            On this page
          </span>
          <Icon
            icon={ChevronDown}
            size={16}
            className={cn("transition-transform duration-200", isOpenMobile && "rotate-180")}
          />
        </button>

        {isOpenMobile && (
          <ul className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo(item.id);
                  }}
                  className={cn(
                    "block py-1 text-sm transition-colors",
                    activeId === item.id
                      ? "font-semibold text-primary"
                      : "text-muted hover:text-ink",
                  )}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Desktop Sticky Rail (>= 1024px) */}
      <div className="hidden lg:block sticky top-24">
        <p className="text-xs font-bold tracking-wider text-muted uppercase mb-3 flex items-center gap-1.5">
          <Icon icon={List} size={14} className="text-primary" />
          Contents
        </p>
        <ul className="flex flex-col gap-1 border-l-2 border-border pl-3">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo(item.id);
                  }}
                  className={cn(
                    "block py-1 text-xs transition-colors",
                    isActive
                      ? "-ml-[14px] border-l-2 border-primary pl-3 font-semibold text-primary"
                      : "text-muted hover:text-ink",
                  )}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
