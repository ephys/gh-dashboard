import ReactMarkdown from 'react-markdown';

type AlertProps = {
  description: string;
  // TODO
  title?: string;
  // TODO
  type: 'tip' | 'error';
};

export function Alert(props: AlertProps) {
  return (
    <div className="markdown-body">
      <ReactMarkdown>{props.description}</ReactMarkdown>
    </div>
  );
}
