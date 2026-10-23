/**
 * Renders a MailPoet newsletter's editor content (the `body` JSON of saved blocks) to email
 * HTML. Used for sent newsletters whose final HTML MailPoet no longer keeps. Same text,
 * images, buttons and links as the original; layout is a simple single-column email.
 */
interface Block {
  type: string;
  blocks?: Block[];
  orientation?: 'vertical' | 'horizontal';
  text?: string;
  src?: string;
  link?: string;
  alt?: string;
  url?: string;
  styles?: Record<string, any>;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function styleOf(styles: Record<string, any> | undefined, part: string): string {
  const s = styles?.[part];
  if (!s || typeof s !== 'object') return '';
  const css: string[] = [];
  if (s.backgroundColor && s.backgroundColor !== 'transparent') css.push(`background-color:${s.backgroundColor}`);
  if (s.fontColor) css.push(`color:${s.fontColor}`);
  if (s.fontFamily) css.push(`font-family:${s.fontFamily}`);
  if (s.fontSize) css.push(`font-size:${s.fontSize}`);
  if (s.textAlign) css.push(`text-align:${s.textAlign}`);
  if (s.fontWeight) css.push(`font-weight:${s.fontWeight}`);
  if (s.borderRadius) css.push(`border-radius:${s.borderRadius}`);
  if (s.height && part === 'block' && s.height !== 'auto') css.push(`height:${s.height}`);
  return css.join(';');
}

function renderBlock(b: Block): string {
  switch (b.type) {
    case 'container': {
      const children = (b.blocks ?? []).map(renderBlock);
      const bg = styleOf(b.styles, 'block');
      if (b.orientation === 'horizontal' && children.length > 1) {
        const w = Math.floor(100 / children.length);
        return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${bg}"><tr>${children
          .map((c) => `<td valign="top" width="${w}%" style="padding:0 8px">${c}</td>`)
          .join('')}</tr></table>`;
      }
      return `<div style="${bg}">${children.join('')}</div>`;
    }
    case 'text':
    case 'header':
    case 'footer':
      return `<div style="padding:8px 20px;line-height:1.5;${b.type === 'footer' ? 'font-size:12px;color:#777;text-align:center;' : ''}">${b.text ?? ''}</div>`;
    case 'image': {
      if (!b.src) return '';
      const img = `<img src="${esc(b.src)}" alt="${esc(b.alt ?? '')}" style="max-width:100%;height:auto;display:block;margin:0 auto;border:0">`;
      return `<div style="padding:8px 20px;text-align:center">${b.link ? `<a href="${esc(b.link)}">${img}</a>` : img}</div>`;
    }
    case 'button': {
      const st = styleOf(b.styles, 'block') || 'background-color:#a99a87;color:#fff;border-radius:4px';
      return `<div style="padding:12px 20px;text-align:center"><a href="${esc(b.url ?? '#')}" style="display:inline-block;padding:10px 24px;text-decoration:none;${st}">${b.text ?? ''}</a></div>`;
    }
    case 'divider':
      return '<hr style="border:0;border-top:1px solid #ddd;margin:16px 20px">';
    case 'spacer':
      return `<div style="${styleOf(b.styles, 'block') || 'height:20px'}"></div>`;
    default:
      return '';
  }
}

export function renderMailpoet(bodyJson: string, subject: string): string | null {
  let body: { content?: Block; globalStyles?: Record<string, any> };
  try {
    body = JSON.parse(bodyJson);
  } catch {
    return null;
  }
  if (!body.content) return null;
  const g = body.globalStyles ?? {};
  const wrapperBg = g.wrapper?.backgroundColor ?? '#ffffff';
  const bodyBg = g.body?.backgroundColor ?? '#eeeeee';
  const text = g.text ?? {};
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${bodyBg}">
<div style="max-width:660px;margin:0 auto;background:${wrapperBg};font-family:${text.fontFamily ?? 'Arial, sans-serif'};font-size:${text.fontSize ?? '15px'};color:${text.fontColor ?? '#000'}">
${renderBlock(body.content)}
</div></body></html>`;
}

/**
 * MailPoet placeholders left in stored HTML: personalisation ("[subscriber:firstname | default:Member]")
 * and per-recipient links (unsubscribe, view in browser). The archive shows the default text and drops dead links.
 */
export function cleanMailpoetShortcodes(html: string): string {
  return html
    .replace(/\[subscriber:[a-z_]+\s*\|\s*default:([^\]]*)\]/gi, '$1')
    .replace(/\[subscriber:[a-z_]+\]/gi, '')
    .replace(/href="\[link:[^\]]*\]"/gi, 'href="#"')
    .replace(/\[link:[^\]]*\]/gi, '#')
    .replace(/\[(?:newsletter|date|site):[^\]]*\]/gi, '');
}
