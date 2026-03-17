import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
}

/**
 * Ensures blank lines before and after list blocks so Markdown parsers
 * recognise them even when the author omitted the blank line.
 */
function normalizeMarkdown(raw: string): string {
  return raw
    .replace(/([^\n])\n([-*+] |\d+\. )/g, "$1\n\n$2")
    .replace(/([-*+] .+|\d+\. .+)\n([^\-\*\+\d\n])/g, "$1\n\n$2");
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  if (!content) return null;

  return (
    <div className="prose prose-sm prose-invert max-w-none prose-headings:font-heading prose-headings:tracking-wide prose-headings:text-accent prose-p:text-muted prose-p:leading-relaxed prose-a:text-highlight prose-a:no-underline hover:prose-a:underline prose-strong:text-accent prose-ul:text-muted prose-ol:text-muted prose-li:my-0 prose-li:marker:text-muted/50">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {normalizeMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}
