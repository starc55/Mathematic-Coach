import React, { useEffect, useRef } from 'react';

// FIX: Add a global declaration for MathJax to inform TypeScript of its existence on the window object.
declare global {
  interface Window {
    MathJax: {
      typesetPromise: (elements?: HTMLElement[]) => Promise<void>;
    };
  }
}

interface ContentRendererProps {
  content: string;
}

// A component to render markdown and LaTeX using MathJax
export const ContentRenderer: React.FC<ContentRendererProps> = ({ content }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // When the component mounts or content changes, tell MathJax to typeset the math.
    // MathJax will queue this call until it is ready.
    if (window.MathJax && contentRef.current) {
      window.MathJax.typesetPromise([contentRef.current]).catch((err) =>
        console.error('MathJax typesetting error:', err)
      );
    }
  }, [content]);

  // To avoid markdown parsers breaking LaTeX, we split the content into math and text parts.
  const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[^$]*?\$)/g);

  const applyBasicMarkdown = (text: string) => {
    const htmlContent = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-black/30 rounded px-1 py-0.5 text-sm font-mono">$1</code>')
      .replace(/\n/g, '<br />');

    return <span dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  };

  return (
    <div ref={contentRef} className="text-left">
      {parts.map((part, index) => {
        if (
          (part.startsWith('$$') && part.endsWith('$$')) ||
          (part.startsWith('$') && part.endsWith('$'))
        ) {
          // Render math parts as is. MathJax will find and typeset them.
          return <React.Fragment key={index}>{part}</React.Fragment>;
        } else if (part) {
          // Render text parts with basic markdown applied.
          return <React.Fragment key={index}>{applyBasicMarkdown(part)}</React.Fragment>;
        }
        return null;
      })}
    </div>
  );
};
