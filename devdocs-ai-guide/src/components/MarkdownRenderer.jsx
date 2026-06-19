import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';

const MarkdownRenderer = ({ markdown }) => {
  const components = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  return <ReactMarkdown components={components}>{markdown}</ReactMarkdown>;
};

export default MarkdownRenderer;
