import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  h1: ({ children }) => (
    <h1 className="mb-2 mt-4 text-lg font-semibold text-zinc-900 first:mt-0 dark:text-zinc-50">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 text-base font-semibold text-zinc-900 first:mt-0 dark:text-zinc-50">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1.5 mt-3 text-sm font-semibold text-zinc-900 first:mt-0 dark:text-zinc-50">
      {children}
    </h3>
  ),
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-zinc-900 dark:text-zinc-50">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-kenya-green underline underline-offset-2 hover:text-kenya-green/80"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-kenya-green/50 pl-3 text-zinc-600 dark:text-zinc-400">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-stone-300 dark:border-zinc-700" />,
  code: ({ children, className }) => {
    const isBlock = Boolean(className);
    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded-lg bg-zinc-900 p-3 font-mono text-xs text-zinc-100 dark:bg-black">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-zinc-900/8 px-1.5 py-0.5 font-mono text-[0.85em] dark:bg-white/10">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <pre className="mb-3">{children}</pre>,
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto rounded-lg border border-stone-300 dark:border-zinc-700">
      <table className="w-full text-left text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-stone-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
      {children}
    </thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-stone-300 px-3 py-2 font-semibold dark:border-zinc-700">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-stone-200 px-3 py-2 align-top last:border-b-0 dark:border-zinc-800">
      {children}
    </td>
  ),
  tr: ({ children }) => <tr className="last:[&>td]:border-b-0">{children}</tr>,
};

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
