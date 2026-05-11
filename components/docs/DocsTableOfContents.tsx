"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { List, ChevronRight } from "lucide-react";
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
    // Extract headers from content (both MD and simple HTML)
    const extracted: ToCItem[] = [];
    
    // Check if content is likely HTML
    if (content.trim().startsWith("<") || content.includes("</")) {
      // Simple HTML header extraction
      const headerRegex = /<h([1-4])(?:\s+id="([^"]*)")?[^>]*>(.*?)<\/h\1>/gi;
      let match;
      while ((match = headerRegex.exec(content)) !== null) {
        const level = parseInt(match[1]);
        const text = match[3].replace(/<[^>]*>?/gm, "").trim();
        const id = match[2] || text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        extracted.push({ id, text, level });
      }
    } else {
      // Markdown header extraction
      const lines = content.split("\n");
      lines.forEach((line) => {
        const match = line.match(/^(#{1,4})\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          const text = match[2].trim();
          const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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
      { rootMargin: "-100px 0px -70% 0px" }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <aside className="hidden xl:block w-64 fixed top-24 bottom-0 right-[max(0px,calc(50%-720px))] p-8 overflow-y-auto scrollbar-no">
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <List size={14} className="text-primary-500" />
          <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">On this page</h4>
        </div>

        <div className="space-y-1 relative">
          {/* Vertical indicator line */}
          <div className="absolute left-1 top-0 bottom-0 w-[1px] bg-border-subtle" />
          
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
              }}
              className={cn(
                "block py-1.5 pr-4 text-[12px] font-bold transition-all border-l-2 -ml-[1.5px]",
                item.level === 1 ? "pl-4" : 
                item.level === 2 ? "pl-6" : 
                item.level === 3 ? "pl-8 text-muted" : "pl-10 text-muted",
                activeId === item.id 
                  ? "text-primary-600 border-primary-500" 
                  : "text-secondary hover:text-foreground border-transparent hover:border-border-hover"
              )}
            >
              {item.text}
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
