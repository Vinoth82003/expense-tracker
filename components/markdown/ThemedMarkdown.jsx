// components/ThemedMarkdown.jsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const ThemedMarkdown = ({ content, className = '' }) => {
    return (
        <div className={`
      prose 
      prose-indigo 
      prose-p:text-secondary
      prose-p:font-medium
      prose-headings:text-foreground
      prose-headings:font-black
      prose-strong:text-foreground
      prose-li:text-secondary
      prose-a:text-primary-600
      prose-a:no-underline
      prose-a:font-semibold
      hover:prose-a:text-primary-500
      prose-code:text-primary-600
      prose-code:bg-primary-50
      prose-code:px-1
      prose-code:py-0.5
      prose-code:rounded
      prose-code:text-sm
      prose-pre:bg-surface-variant
      prose-pre:text-secondary
      prose-pre:border
      prose-pre:border-border-subtle
      prose-blockquote:border-l-primary-500
      prose-blockquote:text-secondary
      prose-blockquote:not-italic
      prose-img:rounded-lg
      prose-img:shadow-md
      max-w-none
      dark:prose-invert
      ${className}
    `}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default ThemedMarkdown;