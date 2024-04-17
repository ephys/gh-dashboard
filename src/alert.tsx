import ReactMarkdown from 'react-markdown';

type AlertProps = {
  description: string;
  // TODO
  title?: string;
  // TODO
  type: 'tip';
};

export function Alert(props: AlertProps) {
  return (
    <div>
      <ReactMarkdown>{props.description}</ReactMarkdown>
    </div>
  );
}
