import Link from 'next/link';
import type { PostBlock } from '@/data/types';
import { Faq } from './Faq';

const LINK = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;

/** Turns [label](/path) into links. Anything that is not a same-site path stays as text. */
export function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    const href = match[2] ?? '';
    if (href.startsWith('/') && !href.startsWith('//')) {
      parts.push(<Link key={`${index}-${href}`} href={href} className="link-accent">{match[1]}</Link>);
    } else {
      parts.push(match[0]);
    }
    last = index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

function Table({ headers, rows, caption }: { headers: string[]; rows: string[][]; caption?: string }) {
  return (
    <div className="overflow-x-auto rounded-brand border border-line">
      <table className="w-full min-w-[28rem] text-left text-[15px]">
        {caption ? <caption className="border-b border-line bg-sand px-3 py-2 text-left text-sm text-muted">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-line bg-sand text-xs uppercase tracking-[0.12em]">
            {headers.map((header) => <th key={header} scope="col" className="p-3 font-semibold">{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join('|')} className="border-b border-line last:border-0">
              {row.map((cell, j) => (
                j === 0
                  ? <th key={headers[j] ?? j} scope="row" className="p-3 font-semibold"><RichText text={cell} /></th>
                  : <td key={headers[j] ?? j} className="p-3 tabular-nums"><RichText text={cell} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Article body: paragraphs, headings, lists, tables and an FAQ accordion. */
export function ArticleBody({ blocks }: { blocks: PostBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (typeof block === 'string') return <p key={i}><RichText text={block} /></p>;
        switch (block.type) {
          case 'h2':
            return <h2 key={i} className="text-h2 pt-6"><RichText text={block.text} /></h2>;
          case 'ul':
          case 'ol': {
            const List = block.type;
            return (
              <List key={i} className={`grid gap-2 pl-6 ${block.type === 'ol' ? 'list-decimal' : 'list-disc'}`}>
                {block.items.map((item) => <li key={item}><RichText text={item} /></li>)}
              </List>
            );
          }
          case 'table':
            return <Table key={i} headers={block.headers} rows={block.rows} caption={block.caption} />;
          case 'faq':
            return <Faq key={i} items={block.items} />;
          default:
            return null;
        }
      })}
    </>
  );
}
