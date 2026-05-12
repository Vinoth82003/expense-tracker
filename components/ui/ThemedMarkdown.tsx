"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils";

interface Props {
  content: string;
  className?: string;
}

export function ThemedMarkdown({ content, className }: Props) {
  return (
    <div className={cn(
      "prose prose-indigo dark:prose-invert max-w-none",
      "prose-headings:font-black prose-headings:tracking-tight prose-headings:scroll-mt-24",
      "prose-p:text-secondary prose-p:font-medium prose-p:leading-relaxed",
      "prose-strong:text-foreground prose-strong:font-black",
      "prose-code:bg-surface-variant prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-lg prose-code:font-bold prose-code:text-primary-600 dark:prose-code:text-primary-400 prose-code:before:content-none prose-code:after:content-none",
      "prose-pre:bg-surface-variant prose-pre:border prose-pre:border-border-subtle prose-pre:rounded-[2rem] prose-pre:p-8 prose-pre:shadow-sm",
      "prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline prose-a:font-bold",
      "prose-img:rounded-[2rem] prose-img:shadow-xl",
      "prose-li:font-medium prose-li:text-secondary",
      className
    )}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]} 
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ children }) => {
            const id = children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            return <h1 id={id} className="text-3xl sm:text-4xl md:text-5xl mb-8 leading-[1.1]">{children}</h1>;
          },
          h2: ({ children }) => {
            const id = children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            return <h2 id={id} className="text-3xl mt-16 mb-6 border-b border-border-subtle pb-4">{children}</h2>;
          },
          h3: ({ children }) => {
            const id = children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            return <h3 id={id} className="text-2xl mt-12 mb-4">{children}</h3>;
          },
          h4: ({ children }) => {
            const id = children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            return <h4 id={id} className="text-xl mt-8 mb-4">{children}</h4>;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
