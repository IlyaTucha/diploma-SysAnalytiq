import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content?: string | null;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) {
    return <div className="text-muted-foreground text-sm">Описание задания отсутствует</div>;
  }

  return (
    <div className="markdown-content text-foreground max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
