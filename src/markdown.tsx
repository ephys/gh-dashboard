import ReactMarkdown from 'react-markdown';

export interface MarkdownProps {
  children: string;
}

export function Markdown(props: MarkdownProps) {
  return (
    <div className="markdown-body">
      <ReactMarkdown>{props.children}</ReactMarkdown>
    </div>
  );
}
