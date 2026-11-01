import * as React from "react";
import { PublicTopbar } from "@/components/layout/public-topbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { TableOfContents, type TocItem } from "@/components/layout/table-of-contents";
import { cn } from "@/lib/cn";

interface ReadingLayoutProps {
  children: React.ReactNode;
  tocItems: TocItem[];
  className?: string;
}

export function ReadingLayout({ children, tocItems, className }: ReadingLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <PublicTopbar />

      <main className="flex-1 py-10 md:py-16">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_260px] lg:gap-16">
            {/* Prose Content (max 720px) */}
            <article className={cn("mx-auto w-full max-w-[720px] prose-neutral", className)}>
              <TableOfContents items={tocItems} className="lg:hidden" />
              {children}
            </article>

            {/* Desktop Sticky Table of Contents */}
            <aside className="hidden lg:block">
              <TableOfContents items={tocItems} />
            </aside>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
