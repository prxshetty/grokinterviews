

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const langClass = language ? `language-${language}` : '';
  return (
    <pre
      className={`mt-2 mb-4 overflow-x-auto rounded-md border bg-muted p-4 text-sm text-muted-foreground dark:bg-zinc-800 dark:text-zinc-300 ${className ?? ''}`}
    >
      <code className={langClass}>{code.trim()}</code>
    </pre>
  );
} 