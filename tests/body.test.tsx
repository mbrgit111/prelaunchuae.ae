import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Body, safeHref, safeImageSrc } from '../src/components/content/Body';
import { getProjects } from '../src/data';

const t = (text: string, marks?: { type: string; attrs?: Record<string, unknown> }[]) => ({ type: 'text', text, ...(marks ? { marks } : {}) });
const p = (...content: unknown[]) => ({ type: 'paragraph', content });
const doc = (...content: unknown[]) => ({ type: 'doc', content });
const html = (d: unknown, headings: { id: string; text: string; level: number }[] = [], projects: import('../src/data').Project[] = []) => renderToStaticMarkup(<Body doc={d} headings={headings} projects={projects} />);

describe('article renderer: every node type', () => {
  it('paragraph and text styles', () => {
    const out = html(doc(p(t('a '), t('b', [{ type: 'bold' }]), t('i', [{ type: 'italic' }]), t('u', [{ type: 'underline' }]), t('s', [{ type: 'strike' }]), t('c', [{ type: 'code' }]), { type: 'hardBreak' })));
    expect(out).toContain('<p>a <strong>b</strong><em>i</em><u>u</u><s>s</s><code>c</code><br/></p>');
  });
  it('headings: only H2 and H3, with the ids the API gave, and a title-level heading becomes H2', () => {
    const out = html(doc({ type: 'heading', attrs: { level: 1 }, content: [t('Big')] }, { type: 'heading', attrs: { level: 3 }, content: [t('Small')] }), [
      { id: 'big-x', text: 'Big', level: 2 },
      { id: 'small', text: 'Small', level: 3 },
    ]);
    expect(out).toContain('<h2 id="big-x">Big</h2>');
    expect(out).toContain('<h3 id="small">Small</h3>');
    expect(out).not.toContain('<h1');
  });
  it('bullet, numbered lists and quote', () => {
    const item = (x: string) => ({ type: 'listItem', content: [p(t(x))] });
    const out = html(doc({ type: 'bulletList', content: [item('a')] }, { type: 'orderedList', content: [item('b')] }, { type: 'blockquote', content: [p(t('q'))] }));
    expect(out).toContain('<ul><li><p>a</p></li></ul>');
    expect(out).toContain('<ol><li><p>b</p></li></ol>');
    expect(out).toContain('<blockquote><p>q</p></blockquote>');
  });
  it('table with header and cells, in a scrollable region', () => {
    const out = html(doc({ type: 'table', content: [{ type: 'tableRow', content: [{ type: 'tableHeader', content: [p(t('H'))] }] }, { type: 'tableRow', content: [{ type: 'tableCell', content: [p(t('C'))] }] }] }));
    expect(out).toContain('<th scope="col"><p>H</p></th>');
    expect(out).toContain('<td><p>C</p></td>');
    expect(out).toContain('tabindex="0"');
  });
  it('image with caption and alt; an image without alt is left out', () => {
    const out = html(doc({ type: 'image', attrs: { src: 'https://img.example.com/a.jpg', alt: 'A skyline', caption: 'Dubai South', width: 1200, height: 800 } }, { type: 'image', attrs: { src: 'https://img.example.com/b.jpg', alt: '' } }));
    expect(out).toContain('alt="A skyline"');
    expect(out).toContain('<figcaption>Dubai South</figcaption>');
    expect(out).toContain('aspect-ratio:1200 / 800');
    expect(out).not.toContain('b.jpg');
  });
  it('callout, register button, divider and code', () => {
    const out = html(doc({ type: 'callout', attrs: { tone: 'warning' }, content: [p(t('Careful'))] }, { type: 'registerCta' }, { type: 'horizontalRule' }, { type: 'codeBlock', content: [t('x < y')] }));
    expect(out).toContain('callout callout-warning');
    expect(out).toContain('href="#register"');
    expect(out).toContain('<hr/>');
    expect(out).toContain('x &lt; y');
  });
  it('project card shows a project from this site and nothing for an unknown one', async () => {
    const project = (await getProjects())[0]!;
    expect(html(doc({ type: 'projectCard', attrs: { slug: project.slug } }), [], [project])).toContain(project.name);
    expect(html(doc({ type: 'projectCard', attrs: { slug: 'no-such-project' } }))).not.toContain('card');
  });
  it('video: a button first (no iframe), bad ids are dropped', () => {
    const ok = html(doc({ type: 'youtube', attrs: { id: 'dQw4w9WgXcQ', title: 'Tour' } }));
    expect(ok).toContain('Play video: Tour');
    expect(ok).not.toContain('<iframe');
    expect(html(doc({ type: 'youtube', attrs: { id: '"><script>' } }))).not.toContain('Play video');
  });
  it('links: safe ones kept (outside links get noopener), unsafe ones lose the link but keep the words', () => {
    const out = html(doc(p(t('in', [{ type: 'link', attrs: { href: '/projects' } }]), t('out', [{ type: 'link', attrs: { href: 'https://example.com/x' } }]), t('bad', [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }]))));
    expect(out).toContain('href="/projects"');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('bad');
    expect(out).not.toContain('javascript:');
  });
  it('unknown blocks, scripts and raw HTML in text never reach the page as markup', () => {
    const out = html(doc({ type: 'iframe', attrs: { src: 'https://evil.example' } }, { type: 'html', content: [t('<script>x()</script>')] }, p(t('<img src=x onerror=alert(1)>'))));
    expect(out).not.toContain('<iframe');
    expect(out).not.toContain('<script');
    expect(out).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });
  it('a missing or wrong document draws nothing', () => {
    expect(html(null)).toBe('');
    expect(html({ type: 'paragraph' })).toBe('');
  });
  it('address checks', () => {
    expect(safeHref('//evil.com')).toBeNull();
    expect(safeHref('data:text/html,x')).toBeNull();
    expect(safeHref('tel:+971523417272')).toEqual({ href: 'tel:+971523417272', external: false });
    expect(safeImageSrc('http://insecure.example/a.jpg')).toBeNull();
    expect(safeImageSrc('/media/a.jpg')).toBe('/media/a.jpg');
  });
});
