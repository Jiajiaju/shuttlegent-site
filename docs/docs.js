// Shuttlegent docs: renders the plugin's Markdown docs (md/, copied from the plugin repository) in the site's style.
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const REPO = 'https://github.com/Jiajiaju/Shuttlegent';
  const RAW = 'https://raw.githubusercontent.com/Jiajiaju/Shuttlegent/main/';
  const MERMAID = 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs';
  const SITE_DOCS = 'https://jiajiaju.github.io/shuttlegent-site/docs/';
  // id is the file name in md/. README is a copy of the plugin repository's README; the rest live only here, and their
  // relative links are written as if from the repository's Docs/ folder (so ../Build/... still reaches the repository)
  const DOCS = [
    { id: 'README', title: '快速开始', group: '使用' },
    { id: 'Configuration', title: '配置', group: '使用' },
    { id: 'Tools', title: '工具', group: '使用' },
    { id: 'Extending', title: '项目扩展', group: '使用' },
    { id: 'FAQ', title: '常见问题', group: '使用' },
    { id: 'Architecture', title: '架构', group: '开发' },
    { id: 'Development', title: '开发', group: '开发' }
  ];
  // Repository images the site has its own version of
  const SITE_IMAGES = { 'Docs/Images/panel.png': '../assets/shots/panel.jpg' };

  // The mark in the header, from the brand geometry
  const G = window.ShuttlegentBrandGeometry, NS = 'http://www.w3.org/2000/svg';
  const shape = (tag, a) => { const n = document.createElementNS(NS, tag); for (const k in a) n.setAttribute(k, a[k]); return n; };
  const thread = (t) => shape('rect', { x: t.x - t.width / 2, y: t.top, width: t.width, height: t.height, rx: t.width / 2, fill: G.colors.ivory });
  $('#brand-mark').append(...G.threads.filter((t) => !t.front).map(thread), shape('path', { d: G.shuttle.d, fill: G.colors.red, transform: `rotate(${G.shuttle.axisDeg})` }), ...G.threads.filter((t) => t.front).map(thread));

  // ---------- Markdown ----------
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const attr = (s) => esc(s).replace(/"/g, '&quot;');
  const INLINE_TAGS = /^<\/?(br|b|strong|i|em|kbd|sub|sup)\s*\/?>$/i;
  // GitHub's heading anchors: lower case, punctuation dropped, spaces to hyphens
  const slug = (text) => text.trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
  const plain = (s) => s.replace(/`([^`]*)`/g, '$1').replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_~]{1,2}([^*_~]+)[*_~]{1,2}/g, '$1').replace(/<[^>]+>/g, '');

  function inline(src) {
    const keep = [];
    const hold = (html) => { keep.push(html); return `\u0000${keep.length - 1}\u0000`; };
    let s = src.replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, (m, t, c) => hold(`<code>${esc(c.replace(/^ ([\s\S]*) $/, '$1'))}</code>`));
    s = s.replace(/<[^<>\n]+>/g, (m) => (INLINE_TAGS.test(m) ? hold(m) : m));
    s = s.replace(/<(https?:\/\/[^\s<>]+)>/g, (m, url) => hold(`<a href="${attr(url)}">${esc(url)}</a>`));
    s = esc(s);
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (m, alt, url) => hold(`<img src="${url}" alt="${alt}">`));
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) => hold(`<a href="${url}">${label}</a>`));
    s = s.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+?)__/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<em>$2</em>').replace(/~~([^~]+)~~/g, '<del>$1</del>');
    for (let i = 0; i < 3; i++) s = s.replace(/\u0000(\d+)\u0000/g, (m, n) => keep[+n]);
    return s;
  }

  const FENCE = /^(\s*)(`{3,}|~{3,})\s*([\w+-]*)/;
  const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
  const LIST = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
  const TABLE_RULE = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
  const isTable = (lines, i) => lines[i].includes('|') && i + 1 < lines.length && TABLE_RULE.test(lines[i + 1]);
  const startsBlock = (lines, i) => {
    const l = lines[i];
    return FENCE.test(l) || HEADING.test(l) || LIST.test(l) || /^\s*>/.test(l) || /^\s*<[a-zA-Z!/]/.test(l) || /^\s*(-{3,}|\*{3,})\s*$/.test(l) || isTable(lines, i);
  };
  const cells = (row) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
  const indentOf = (l) => l.search(/\S|$/);

  function blocks(lines, ctx) {
    const out = [];
    let i = 0;
    while (i < lines.length) {
      const l = lines[i];
      if (!l.trim()) { i++; continue; }
      let m = l.match(FENCE);
      if (m) {
        const fence = m[2], ind = m[1].length, lang = m[3].toLowerCase(), buf = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith(fence)) { buf.push(lines[i].slice(Math.min(ind, indentOf(lines[i])))); i++; }
        i++;
        const code = buf.join('\n');
        if (lang === 'mermaid') out.push(`<div class="mermaid" data-source="${attr(code)}"><pre><code>${esc(code)}</code></pre></div>`);
        else out.push(`<pre${lang ? ` data-lang="${lang}"` : ''}><code>${esc(code)}</code></pre>`);
        continue;
      }
      m = l.match(HEADING);
      if (m) {
        const level = m[1].length, text = m[2];
        let id = slug(plain(text));
        if (ctx.ids.has(id)) { let n = 1; while (ctx.ids.has(`${id}-${n}`)) n++; id = `${id}-${n}`; }
        ctx.ids.add(id);
        if (level <= 3 && level >= 2) ctx.toc.push({ level, id, text: plain(text) });
        const anchor = level === 2 || level === 3 ? `<a class="anchor" href="#${id}" aria-hidden="true">#</a>` : '';
        out.push(`<h${level} id="${id}">${inline(text)}${anchor}</h${level}>`);
        i++;
        continue;
      }
      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
      if (isTable(lines, i)) {
        const head = cells(l);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].includes('|') && lines[i].trim()) { rows.push(cells(lines[i])); i++; }
        out.push(`<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${head.map((h, k) => `<td>${inline(r[k] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
        continue;
      }
      if (/^\s*>/.test(l)) {
        const buf = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
        out.push(`<blockquote>${blocks(buf, ctx)}</blockquote>`);
        continue;
      }
      if (LIST.test(l)) { const r = list(lines, i, ctx); out.push(r.html); i = r.next; continue; }
      if (/^\s*<[a-zA-Z!/]/.test(l)) {
        const buf = [];
        while (i < lines.length && lines[i].trim()) { buf.push(lines[i]); i++; }
        out.push(buf.join('\n'));
        continue;
      }
      const buf = [l.trim()];
      i++;
      while (i < lines.length && lines[i].trim() && !startsBlock(lines, i)) { buf.push(lines[i].trim()); i++; }
      out.push(`<p>${inline(buf.join('\n'))}</p>`);
    }
    return out.join('\n');
  }

  // A list and its nested lists; items hold any blocks, indented under the marker
  function list(lines, start, ctx) {
    const first = lines[start].match(LIST), ind = first[1].length, ordered = /\d/.test(first[2]);
    const items = [];
    let i = start;
    while (i < lines.length) {
      const m = lines[i].match(LIST);
      if (!m || m[1].length !== ind || /\d/.test(m[2]) !== ordered) break;
      const contentIndent = m[0].length - m[3].length;
      const body = [m[3]];
      i++;
      while (i < lines.length) {
        const l = lines[i];
        if (!l.trim()) {
          const nextIndex = lines.slice(i).findIndex((x) => x.trim());
          if (nextIndex < 0 || indentOf(lines[i + nextIndex]) <= ind) break;
          body.push(''); i++; continue;
        }
        if (indentOf(l) <= ind) break;
        body.push(l.slice(Math.min(contentIndent, indentOf(l))));
        i++;
      }
      items.push(body);
      if (i < lines.length && !lines[i].trim()) {
        const nextIndex = lines.slice(i).findIndex((x) => x.trim());
        const next = nextIndex < 0 ? null : lines[i + nextIndex].match(LIST);
        if (next && next[1].length === ind && /\d/.test(next[2]) === ordered) i += nextIndex;
      }
    }
    const tag = ordered ? 'ol' : 'ul';
    const startAttr = ordered && parseInt(first[2], 10) !== 1 ? ` start="${parseInt(first[2], 10)}"` : '';
    const html = items.map((body) => {
      let inner = blocks(body, ctx);
      inner = inner.replace(/^<p>([\s\S]*?)<\/p>/, '$1');
      return `<li>${inner}</li>`;
    }).join('');
    return { html: `<${tag}${startAttr}>${html}</${tag}>`, next: i };
  }

  // ---------- Links and images: repository paths to doc pages, GitHub pages or raw files ----------
  function repoPath(dir, rel) {
    const parts = [];
    for (const p of (dir + rel).split('/')) { if (p === '..') parts.pop(); else if (p && p !== '.') parts.push(p); }
    return parts.join('/');
  }
  function mapLinks(root, docId) {
    const dir = docId === 'README' ? '' : 'Docs/';
    for (const a of root.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href');
      if (href.startsWith('#') || a.classList.contains('anchor')) continue;
      // The plugin README links to this site's docs by full address; keep those within the page
      if (href.startsWith(SITE_DOCS)) { a.setAttribute('href', href.slice(SITE_DOCS.length) || './'); continue; }
      if (/^[a-z][\w+.-]*:/i.test(href) || href.startsWith('//')) {
        if (/^https?:/i.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
        continue;
      }
      const [path, hash] = href.split('#');
      const target = repoPath(dir, decodeURIComponent(path));
      const doc = target === 'README.md' ? 'README' : (target.match(/^Docs\/([\w-]+)\.md$/) || [])[1];
      if (doc && DOCS.some((d) => d.id === doc)) a.setAttribute('href', `?p=${doc}${hash ? `#${hash}` : ''}`);
      else { a.setAttribute('href', `${REPO}/blob/main/${target}${hash ? `#${hash}` : ''}`); a.target = '_blank'; a.rel = 'noopener'; }
    }
    const mapSrc = (src) => (/^[a-z][\w+.-]*:/i.test(src) || src.startsWith('//') ? src : SITE_IMAGES[repoPath(dir, src)] || RAW + repoPath(dir, src));
    for (const img of root.querySelectorAll('img[src]')) img.setAttribute('src', mapSrc(img.getAttribute('src')));
    for (const source of root.querySelectorAll('source[srcset]')) source.setAttribute('srcset', mapSrc(source.getAttribute('srcset')));
  }

  // ---------- Mermaid diagrams, themed with the panel tokens; the source stays visible if it cannot load ----------
  // The docs colour node classes for GitHub's light page; on this dark page blue becomes info, orange warning, the rest neutral
  function darkClasses(source) {
    return source.replace(/^(\s*classDef\s+\S+\s+).*$/gm, (m, head) => {
      const stroke = (m.match(/stroke:\s*(#[0-9a-f]{3,6})/i) || [])[1] || '';
      if (/3b6fd8/i.test(stroke)) return `${head}fill:#232A2E,stroke:#3D4E58,color:#E8DFCF`;
      if (/d98a1a/i.test(stroke)) return `${head}fill:#2E2922,stroke:#5A4A30,color:#E8DFCF`;
      return `${head}fill:#262625,stroke:#4A4A46,color:#E8DFCF`;
    });
  }
  async function renderMermaid(root) {
    const nodes = [...root.querySelectorAll('.mermaid[data-source]')];
    if (!nodes.length) return;
    try {
      const { default: mermaid } = await import(MERMAID);
      mermaid.initialize({
        startOnLoad: false, securityLevel: 'strict', theme: 'base', htmlLabels: false, flowchart: { htmlLabels: false, wrappingWidth: 600, padding: 12 }, fontFamily: '"Segoe UI","Microsoft YaHei UI","Microsoft YaHei",sans-serif',
        themeVariables: {
          darkMode: true, background: '#20201F', fontSize: '13px',
          primaryColor: '#262625', primaryTextColor: '#E8DFCF', primaryBorderColor: '#4A4A46', secondaryColor: '#343432', tertiaryColor: '#20201F',
          lineColor: '#7A7974', textColor: '#E8DFCF', mainBkg: '#262625', nodeBorder: '#4A4A46', clusterBkg: '#1C1C1B', clusterBorder: '#3C3C39', titleColor: '#E8DFCF', edgeLabelBackground: '#20201F',
          actorBkg: '#262625', actorBorder: '#4A4A46', actorTextColor: '#E8DFCF', actorLineColor: '#4A4A46', signalColor: '#A9A8A2', signalTextColor: '#E8DFCF',
          labelBoxBkgColor: '#343432', labelBoxBorderColor: '#4A4A46', labelTextColor: '#E8DFCF', loopTextColor: '#A9A8A2', noteBkgColor: '#2E2922', noteBorderColor: '#5A4A30', noteTextColor: '#E8DFCF',
          activationBkgColor: '#343432', activationBorderColor: '#4A4A46', sequenceNumberColor: '#1C1C1B'
        }
      });
      await document.fonts.ready;
      for (const [n, node] of nodes.entries()) {
        try { const { svg } = await mermaid.render(`diagram-${n}`, darkClasses(node.dataset.source)); node.innerHTML = svg; } catch { /* keep the source */ }
      }
    } catch { /* offline or blocked: keep the source */ }
  }

  // ---------- Page ----------
  const params = new URLSearchParams(location.search);
  const current = DOCS.find((d) => d.id === params.get('p')) || DOCS[0];
  const groups = [...new Set(DOCS.map((d) => d.group))];
  $('#doc-nav').innerHTML = groups.map((g) => `<div class="nav-group"><div>${g === '使用' ? 'GUIDE' : 'DEVELOP'}</div>${DOCS.filter((d) => d.group === g).map((d) => `<a href="?p=${d.id}"${d === current ? ' aria-current="page"' : ''}>${d.title}</a>`).join('')}</div>`).join('');
  const index = DOCS.indexOf(current), prev = DOCS[index - 1], next = DOCS[index + 1];
  $('#pager').innerHTML = (prev ? `<a class="prev" href="?p=${prev.id}"><small>上一篇</small>${prev.title}</a>` : '') + (next ? `<a class="next" href="?p=${next.id}"><small>下一篇</small>${next.title}</a>` : '');

  function addCopyButtons(root) {
    for (const pre of root.querySelectorAll('pre:not(.mermaid pre)')) {
      const button = document.createElement('button');
      button.className = 'copy'; button.type = 'button'; button.textContent = '复制';
      button.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(pre.querySelector('code').textContent); button.textContent = '已复制'; } catch { button.textContent = '复制失败'; }
        setTimeout(() => { button.textContent = '复制'; }, 1500);
      });
      pre.appendChild(button);
    }
  }

  function buildToc(toc) {
    const nav = $('#toc');
    nav.innerHTML = toc.map((t) => `<a href="#${t.id}"${t.level === 3 ? ' class="sub"' : ''}>${esc(t.text)}</a>`).join('');
    const links = [...nav.querySelectorAll('a')];
    if (!links.length) { $('.toc').hidden = true; return; }
    const headings = toc.map((t) => document.getElementById(t.id));
    const update = () => {
      let active = 0;
      headings.forEach((h, i) => { if (h.getBoundingClientRect().top < 120) active = i; });
      links.forEach((a, i) => a.classList.toggle('is-active', i === active));
    };
    addEventListener('scroll', update, { passive: true });
    update();
  }

  fetch(`md/${current.id}.md`).then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); }).then((md) => {
    const ctx = { ids: new Set(), toc: [] };
    const article = $('#doc');
    article.innerHTML = blocks(md.replace(/\r/g, '').split('\n'), ctx);
    mapLinks(article, current.id);
    addCopyButtons(article);
    const h1 = article.querySelector('h1');
    document.title = `${current.title} · 引纬 Shuttlegent 文档`;
    if (!h1) article.insertAdjacentHTML('afterbegin', `<h1>${current.title}</h1>`);
    buildToc(ctx.toc);
    if (location.hash) { const target = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (target) target.scrollIntoView(); }
    renderMermaid(article);
  }).catch(() => {
    $('#doc').innerHTML = `<h1>${current.title}</h1><p class="error">文档没有载入。可以在 <a href="${REPO}">GitHub 仓库</a> 阅读。</p>`;
  });
})();
