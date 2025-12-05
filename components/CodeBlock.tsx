import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  content: string;
}

export const MessageRenderer: React.FC<CodeBlockProps> = ({ content }) => {
  // Simple regex to split content by code blocks ```language ... ```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-4 text-sm md:text-base leading-relaxed text-slate-700 dark:text-slate-300">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          // Extract language and code
          const match = part.match(/```(\w*)?\n([\s\S]*?)```/);
          const lang = match ? match[1] : '';
          const code = match ? match[2] : part.slice(3, -3);
          return <CodeBlock key={index} code={code} language={lang} />;
        }
        // Render regular text with some basic formatting (bold, list)
        // This is a very lightweight markdown parser simulation
        return (
          <div key={index} className="whitespace-pre-wrap">
            {part.split('\n').map((line, i) => (
                <p key={i} className={line.startsWith('-') || line.startsWith('*') ? 'pl-4' : 'mb-2'}>
                    {line}
                </p>
            ))}
          </div>
        );
      })}
    </div>
  );
};

const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 my-4 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <span className="text-xs font-mono text-slate-500 uppercase">{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 text-xs text-slate-500 hover:text-brand-500 transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-sm text-slate-800 dark:text-slate-200">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};