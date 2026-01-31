interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const parseLine = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-2 text-foreground">
      {content.split('\n').map((line, index) => {
        const trimmed = line.trim();
        if (trimmed === '') return <div key={index} className="h-2" />;
        
        if (line.startsWith('# ')) {
          return <h1 key={index}>{parseLine(line.substring(2))}</h1>;
        } else if (line.startsWith('## ')) {
          return <h2 key={index}>{parseLine(line.substring(3))}</h2>;
        } else if (line.startsWith('### ')) {
          return <h3 key={index}>{parseLine(line.substring(4))}</h3>;
        } else if (line.startsWith('- ')) {
          return (
            <div key={index} className="flex gap-2 ml-4 text-base">
              <span>•</span>
              <span>{parseLine(line.substring(2))}</span>
            </div>
          );
        } else if (line.match(/^\d+\.\s/)) {
            const number = line.split('.')[0];
            return (
              <div key={index} className="flex gap-2 ml-4 text-base">
                <span>{number}.</span>
                <span>{parseLine(line.substring(number.length + 2))}</span>
              </div>
            );
        } else if (line.startsWith('```')) {
          return null; 
        } else {
          return <p key={index}>{parseLine(line)}</p>;
        }
      })}
    </div>
  );
}
