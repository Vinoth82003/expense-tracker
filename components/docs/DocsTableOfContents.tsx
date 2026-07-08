"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { List } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToCItem {
  id: string;
  text: string;
  level: number;
}

interface DocsTableOfContentsProps {
  content: string;
}

export function DocsTableOfContents({ content }: DocsTableOfContentsProps) {
  const [items, setItems] = useState<ToCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const extracted: ToCItem[] = [];

    if (content.trim().startsWith("<") || content.includes("</")) {
      const headerRegex = /<h([1-4])(?:\s+id="([^"]*)")?[^>]*>(.*?)<\/h\1>/gi;
      let match;
      while ((match = headerRegex.exec(content)) !== null) {
        const level = parseInt(match[1]);
        const text = match[3].replace(/<[^>]*>?/gm, "").trim();
        const id =
          match[2] ||
          text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        extracted.push({ id, text, level });
      }
    } else {
      const lines = content.split("\n");
      lines.forEach((line) => {
        const match = line.match(/^(#{1,4})\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          const text = match[2].trim();
          const id = text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          extracted.push({ id, text, level });
        }
      });
    }

    setItems(extracted);
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -70% 0px" },
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <aside className="hidden xl:block w-64 fixed top-24 bottom-0 right-[max(0px,calc(50%-720px))] overflow-y-auto scrollbar-no">
      <div className="p-6 pl-8 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-600 shrink-0">
            <List size={13} />
          </div>
          <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">
            On this page
          </h4>
        </div>

        <nav className="space-y-0.5 relative">
          <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border-subtle" />

          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById(item.id)
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className={cn(
                "relative block py-1.5 pr-4 text-[12px] font-bold transition-all duration-200 border-l-2 -ml-px",
                item.level === 1
                  ? "pl-5"
                  : item.level === 2
                    ? "pl-8"
                    : item.level === 3
                      ? "pl-11 text-muted font-semibold"
                      : "pl-14 text-muted font-semibold",
                activeId === item.id
                  ? "text-primary-600 border-primary-500"
                  : "text-secondary hover:text-foreground border-transparent hover:border-border-hover",
              )}
            >
              <span
                className={cn(
                  "transition-opacity duration-200",
                  activeId === item.id ? "opacity-100" : "opacity-0",
                )}
              >
                <span className="absolute left-[3px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary-500" />
              </span>
              {item.text}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
