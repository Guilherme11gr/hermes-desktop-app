import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
});

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// CSS for code block copy buttons (injected once)
let codeStylesInjected = false;
function injectCodeStyles() {
  if (codeStylesInjected || typeof document === 'undefined') return;
  codeStylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
.code-block-wrapper {
  position: relative;
  margin: 8px 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(128,128,128,0.15);
}
.code-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 12px;
  background: rgba(128,128,128,0.06);
  border-bottom: 1px solid rgba(128,128,128,0.1);
}
.code-lang-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(128,128,128,0.6);
  font-family: ui-monospace, monospace;
}
.code-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border: none;
  background: rgba(128,128,128,0.1);
  color: rgba(128,128,128,0.7);
  font-size: 11px;
  font-family: inherit;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.code-copy-btn:hover {
  background: rgba(128,128,128,0.18);
  color: rgba(128,128,128,1);
}
.code-copy-btn.copied {
  color: #22c55e !important;
  background: rgba(34,197,94,0.1) !important;
}
.code-block-wrapper pre {
  margin: 0 !important;
  border-radius: 0 !important;
}
.message-enter {
  animation: msgFadeIn 0.3s ease-out;
}
@keyframes msgFadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
  document.head.appendChild(style);
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = ''
}) => {
  injectCodeStyles();

  const html = useMemo(() => {
    try {
      const rawHtml = marked.parse(content) as string;

      const cleanHtml = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 's', 'del',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li',
          'blockquote', 'pre', 'code',
          'a', 'img',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'hr', 'span', 'div', 'button'
        ],
        ALLOWED_ATTR: [
          'href', 'src', 'alt', 'title', 'class', 'id',
          'target', 'rel', 'onclick'
        ],
      });

      // Add copy buttons to code blocks
      return cleanHtml.replace(
        /<pre(\s[^>]*)?>\s*<code([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/g,
        (_m, _preAttrs = '', codeAttrs = '', innerCode) => {
          const langMatch = codeAttrs.match(/language-(\w+)/);
          const lang = langMatch ? langMatch[1] : '';
          const langLabel = lang
            ? `<span class="code-lang-label">${lang}</span>`
            : '<span class="code-lang-label">code</span>';

          // Decode HTML entities for clipboard copy
          const decoded = innerCode
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
          // Encode for safe embedding in onclick attribute
          const safeAttr = decoded
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '');

          return `<div class="code-block-wrapper">
  <div class="code-block-header">
    ${langLabel}
    <button class="code-copy-btn" data-code="${encodeURIComponent(decoded)}" onclick="(function(){var btn=this;var c=decodeURIComponent(btn.getAttribute('data-code'));navigator.clipboard.writeText(c).then(function(){btn.classList.add(\\'copied\\');var o=btn.innerHTML;btn.innerHTML=\\'✓ Copiado!\\';setTimeout(function(){btn.classList.remove(\\'copied\\');btn.innerHTML=o},2000)})}).call(this)" title="Copiar código">
      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" stroke-width="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke-width="2"/></svg>
      Copiar
    </button>
  </div>
  <pre><code${codeAttrs}>${innerCode}</code></pre>
</div>`;
        }
      );
    } catch (error) {
      console.error('Markdown parsing error:', error);
      return content;
    }
  }, [content]);

  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

// Simple inline code component for streaming
export const SimpleMarkdown: React.FC<MarkdownRendererProps> = ({
  content,
  className = ''
}) => {
  const html = useMemo(() => {
    return content
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto my-2"><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-sm font-mono text-pink-600 dark:text-pink-400">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n/g, '<br />');
  }, [content]);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownRenderer;
