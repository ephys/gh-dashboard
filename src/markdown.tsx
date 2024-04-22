import ReactMarkdown from 'react-markdown';

export interface MarkdownProps {
  children: string;
}

export function Markdown(props: MarkdownProps) {
  return (
    <span className="markdown-body">
      <ReactMarkdown>{props.children}</ReactMarkdown>
    </span>
  );
}
