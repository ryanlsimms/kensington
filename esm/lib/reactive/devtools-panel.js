export const PANEL_ID = '__kensington_devtools_panel__';

const HIGHLIGHT_DURATION = 1800;
const HIGHLIGHT_STYLE = '2px solid #89b4fa';
const HIGHLIGHT_OFFSET = '3px';
const LOG_MAX = 100;

function fmt(v) {
  try {
    const s = JSON.stringify(v);
    return s.length > 44 ? `${s.slice(0, 41) }...` : s;
  } catch {
    return '[unserializable]';
  }
}

function fmtFull(v) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return '[unserializable]';
  }
}

const CSS = `
  :host { all: initial; }
  * { box-sizing: border-box; font-family: ui-monospace, 'Cascadia Code', monospace; }

  #toggle {
    position: fixed; bottom: 16px; right: 16px; z-index: 2147483646;
    width: 32px; height: 32px; border-radius: 50%;
    background: #3b82f6; color: #fff; border: none; cursor: pointer;
    font-size: 13px; font-weight: 700; letter-spacing: -.5px;
    box-shadow: 0 2px 8px rgba(0,0,0,.35);
  }
  #toggle:hover { background: #2563eb; }

  #panel {
    position: fixed; bottom: 56px; right: 16px; z-index: 2147483646;
    width: 340px; max-height: 480px;
    background: #1e1e2e; color: #cdd6f4; border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0,0,0,.55);
    display: flex; flex-direction: column;
    font-size: 12px; line-height: 1.5;
    border: 1px solid rgba(255,255,255,.08);
  }
  #panel.hidden { display: none; }

  #header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,.08);
    font-size: 11px; font-weight: 600; color: #89b4fa; letter-spacing: .04em;
    text-transform: uppercase;
  }
  #close {
    background: none; border: none; color: #6c7086; cursor: pointer;
    font-size: 14px; line-height: 1; padding: 0 2px;
  }
  #close:hover { color: #cdd6f4; }

  #tabs {
    display: flex; border-bottom: 1px solid rgba(255,255,255,.08);
  }
  .tab {
    flex: 1; padding: 6px 0; background: none; border: none; cursor: pointer;
    color: #6c7086; font-size: 11px; font-family: inherit;
    border-bottom: 2px solid transparent; margin-bottom: -1px;
  }
  .tab:hover { color: #cdd6f4; }
  .tab.active { color: #89b4fa; border-bottom-color: #89b4fa; }

  #filter-row {
    padding: 5px 10px;
    border-bottom: 1px solid rgba(255,255,255,.08);
  }
  #filter-input {
    width: 100%; padding: 3px 7px;
    background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
    border-radius: 4px; color: #cdd6f4; font-family: inherit; font-size: 11px;
    outline: none;
  }
  #filter-input:focus { border-color: #89b4fa; }
  #filter-input::placeholder { color: #45475a; }

  #val-editor {
    position: fixed; z-index: 2147483647;
    background: #313244; color: #a6e3a1;
    border: 1px solid #89b4fa; border-radius: 3px;
    padding: 2px 6px; font-family: inherit; font-size: 12px;
    outline: none; min-width: 60px;
  }
  #val-editor.hidden { display: none; }

  #content {
    overflow-y: auto; flex: 1; min-height: 0; padding: 4px 0;
  }
  #content::-webkit-scrollbar { width: 5px; }
  #content::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 3px; }

  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th {
    text-align: left; padding: 4px 12px; font-size: 10px; font-weight: 600;
    color: #45475a; text-transform: uppercase; letter-spacing: .06em;
    position: sticky; top: -4px; background: #1e1e2e;
  }
  td { padding: 3px 12px; color: #cdd6f4; vertical-align: middle; }
  tr:nth-child(even) td { background: rgba(255,255,255,.03); }
  tr[data-sig]:hover td { background: rgba(137,180,250,.06); cursor: default; }
  tr:not([data-sig]):hover td { background: rgba(137,180,250,.06); }

  .id { color: #6c7086; }
  .val-cell { max-width: 0; }
  .val { color: #a6e3a1; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .val[data-editable] { cursor: text; }
  .val[data-editable]:hover { text-decoration: underline dotted; }
  .num { color: #fab387; text-align: right; }
  .subs-zero { color: #45475a; }
  .badge {
    display: inline-block; padding: 1px 5px; border-radius: 3px;
    font-size: 10px; font-weight: 600;
  }
  .badge-active  { background: rgba(166,227,161,.15); color: #a6e3a1; }
  .badge-paused  { background: rgba(250,179,135,.15); color: #fab387; }
  .lbl { display: inline-block; margin: 0 2px 1px 0; padding: 1px 4px; border-radius: 3px; font-size: 10px; background: rgba(137,180,250,.1); color: #89b4fa; }
  .lbl.lbl-key { background: rgba(245,194,231,.12); color: #f5c2e7; }
  .lbls { margin-top: 1px; line-height: 1.3; overflow: hidden; }

  .src-cell { max-width: 0; }
  .src { color: #6c7086; font-size: 10px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: default; }
  .src:hover { color: #cdd6f4; }

  #tooltip {
    position: fixed; z-index: 2147483647;
    background: #313244; color: #cdd6f4; border: 1px solid rgba(255,255,255,.12);
    border-radius: 5px; padding: 6px 9px;
    font-size: 11px; white-space: pre-wrap; word-break: break-all; max-width: calc(120ch + 18px);
    box-shadow: 0 4px 16px rgba(0,0,0,.5);
    pointer-events: none;
  }
  #tooltip.hidden { display: none; }

  .tip-items { display: flex; flex-direction: column; gap: 8px; }
  .tip-item { display: flex; flex-direction: column; gap: 3px; }
  .tip-row { display: flex; align-items: center; gap: 6px; }
  .tip-id { color: #cba6f7; font-weight: 600; }
  .tip-badge { font-size: 9px; padding: 1px 4px; border-radius: 3px; background: rgba(137,180,250,.2); color: #89b4fa; font-weight: 600; }
  .tip-badge.tip-dom { background: rgba(137,220,235,.2); color: #89dceb; }
  .tip-meta { color: #6c7086; font-size: 10px; }
  .tip-code { margin: 0; padding: 4px 7px; border-radius: 3px; background: rgba(0,0,0,.25); color: #a6e3a1; font-size: 10px; white-space: pre-wrap; overflow-wrap: break-word; }

  .eye-cell { text-align: center; padding-left: 0; padding-right: 8px; }
  .eye { font-size: 11px; }
  .eye-visible { color: #a6e3a1; }
  .eye-hidden { color: #fab387; }
  .eye-none { color: #45475a; }

  .el-cell { max-width: 0; }
  .el { color: #89dceb; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: default; }
  .el.detached { color: #45475a; font-style: italic; }

  .empty { padding: 20px; text-align: center; color: #45475a; font-size: 11px; }

  .sig-footer {
    position: sticky; bottom: -4px;
    background: #1e1e2e;
    border-top: 1px solid rgba(255,255,255,.08);
  }
  .totals-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 5px 12px 4px; font-size: 10px; color: #6c7086;
    border-bottom: 1px solid rgba(255,255,255,.05);
  }
  .totals-counts { display: flex; gap: 10px; }

  .log-ts { color: #45475a; white-space: nowrap; font-size: 10px; }
  .log-evt { font-size: 10px; white-space: nowrap; }
  .log-sig-set { color: #a6e3a1; }
  .log-sig { color: #587d55; }
  .log-computed-set { color: #cba6f7; }
  .log-computed { color: #6e508a; }
  .log-eff-run { color: #89b4fa; }
  .log-eff { color: #4a6096; }
  .log-dom { color: #3d7a80; }
  .log-val { color: #a6e3a1; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .log-action-btn {
    background: none; border: 1px solid rgba(255,255,255,.12); color: #6c7086;
    border-radius: 3px; padding: 1px 7px; font-family: inherit; font-size: 10px; cursor: pointer;
  }
  .log-action-btn:hover { color: #cdd6f4; border-color: rgba(255,255,255,.25); }
  .log-actions { display: flex; gap: 4px; }

  #header-actions { display: flex; gap: 4px; align-items: center; }
  #popout {
    background: none; border: none; color: #6c7086; cursor: pointer;
    font-size: 12px; line-height: 1; padding: 0 2px;
  }
  #popout:hover { color: #cdd6f4; }

  :host(.popup-mode) #toggle { display: none; }
  :host(.popup-mode) #panel {
    position: static;
    width: 100%; height: 100%; max-height: none;
    border-radius: 0; box-shadow: none; border: none;
  }

  @media (max-width: 400px) {
    #toggle { bottom: 12px; right: 12px; }
    #panel { left: 12px; right: 12px; width: auto; max-height: calc(100vh - 80px); border-radius: 6px; }
  }
`;

const activeHighlights = new Map();
const hoverHighlights = new Set();

function highlightElements(elements) {
  for (const el of elements) {
    if (activeHighlights.has(el)) {
      clearTimeout(activeHighlights.get(el));
    } else {
      el.style.setProperty('outline', HIGHLIGHT_STYLE, 'important');
      el.style.setProperty('outline-offset', HIGHLIGHT_OFFSET, 'important');
    }
    const id = setTimeout(() => {
      if (!hoverHighlights.has(el)) {
        el.style.removeProperty('outline');
        el.style.removeProperty('outline-offset');
      }
      activeHighlights.delete(el);
    }, HIGHLIGHT_DURATION);
    activeHighlights.set(el, id);
  }
}

function applyHoverHighlight(elements) {
  for (const el of elements) {
    hoverHighlights.add(el);
    el.style.setProperty('outline', HIGHLIGHT_STYLE, 'important');
    el.style.setProperty('outline-offset', HIGHLIGHT_OFFSET, 'important');
  }
}

function clearHoverHighlight(elements) {
  for (const el of elements) {
    hoverHighlights.delete(el);
    if (!activeHighlights.has(el)) {
      el.style.removeProperty('outline');
      el.style.removeProperty('outline-offset');
    }
  }
}

function getBindingElement(hook, bindingId) {
  const meta = hook.bindings.get(bindingId);
  if (!meta || !meta.elementRef) { return null; }
  return meta.elementRef.deref() ?? null;
}

function getSignalElements(hook, signalId) {
  const meta = hook.signals.get(signalId);
  if (!meta) { return []; }
  const elements = [];
  for (const effectId of meta.effectIds) {
    const effMeta = hook.effects.get(effectId) ?? hook.bindings.get(effectId);
    if (!effMeta || !effMeta.elementRef) { continue; }
    const el = effMeta.elementRef.deref();
    if (el && !elements.includes(el)) { elements.push(el); }
  }
  return elements;
}

function getSignalDomState(hook, signalId) {
  const elements = getSignalElements(hook, signalId);
  if (elements.length === 0) { return 'none'; }
  let anyConnected = false;
  for (const el of elements) {
    if (!el.isConnected) { continue; }
    anyConnected = true;
    try {
      const vis = el.checkVisibility
        ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
        : getComputedStyle(el).display !== 'none';
      if (vis) { return 'visible'; }
    } catch {
      return 'visible';
    }
  }
  return anyConnected ? 'hidden' : 'none';
}

function domStateIcon(state) {
  if (state === 'visible') { return '<span class="eye eye-visible">●</span>'; }
  if (state === 'hidden') { return '<span class="eye eye-hidden">○</span>'; }
  return '<span class="eye eye-none">—</span>';
}

function elementOpenTag(el) {
  let tag = `<${ el.tagName.toLowerCase()}`;
  for (const attr of el.attributes) {
    tag += attr.value ? ` ${ attr.name }="${ attr.value }"` : ` ${ attr.name}`;
  }
  return `${tag }>`;
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtSrc(src) {
  const lines = src.split('\n');
  const nonEmpty = lines.filter(l => l.trim());
  const minIndent = nonEmpty.length
    ? Math.min(...nonEmpty.map(l => l.match(/^(\s*)/)[1].length))
    : 0;
  const s = lines.map(l => l.slice(minIndent).trimEnd()).filter(Boolean).join('\n').trim();
  return s.length > 360 ? `${s.slice(0, 357)}...` : s;
}

function escapeSrc(src) {
  return src.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function signalSubscriberHtml(hook, meta) {
  if (!meta || meta.effectIds.size === 0) { return null; }
  let items = '';
  for (const effectId of meta.effectIds) {
    const isBinding = hook.bindings.has(effectId);
    const eff = hook.effects.get(effectId) ?? hook.bindings.get(effectId);
    if (!eff) { continue; }
    const typeLabel = isBinding ? 'DOM' : 'Effect';
    const typeCls = isBinding ? 'tip-badge tip-dom' : 'tip-badge';
    let srcHtml;
    if (isBinding) {
      const el = getBindingElement(hook, eff.id);
      srcHtml = escHtml(el ? elementOpenTag(el) : '(removed)');
    } else {
      srcHtml = escHtml(fmtSrc(eff.src || '(no source)'));
    }
    items += `<div class="tip-item">
      <div class="tip-row">
        <span class="tip-id">#${eff.id}</span>
        <span class="${typeCls}">${typeLabel}</span>
        <span class="tip-meta">${eff.state} &middot; &times;${eff.runCount}</span>
      </div>
      <pre class="tip-code">${srcHtml}</pre>
    </div>`;
  }
  if (!items) { return null; }
  return `<div class="tip-items">${items}</div>`;
}

function signalOpenTag(hook, signalId) {
  const elements = getSignalElements(hook, signalId);
  const tags = [];
  for (const el of elements) {
    const tag = elementOpenTag(el);
    if (!tags.includes(tag)) { tags.push(tag); }
  }
  return tags.join('\n') || null;
}

function effectDepsHtml(hook, effectId) {
  const meta = hook.effects.get(effectId) ?? hook.bindings.get(effectId);
  if (!meta || meta.depIds.size === 0) { return null; }
  let items = '';
  for (const sigId of meta.depIds) {
    const sig = hook.signals.get(sigId);
    if (!sig) { continue; }
    const badge = sig.isComputed ? '<span class="tip-badge">computed</span>' : '';
    items += `<div class="tip-item">
      <div class="tip-row">
        <span class="tip-id">#${sigId}</span>
        ${badge}
      </div>
      <pre class="tip-code">${escHtml(fmt(sig.value))}</pre>
    </div>`;
  }
  return items ? `<div class="tip-items">${items}</div>` : null;
}

function renderSignalTable(hook, forComputed, filterText = '') {
  const q = filterText ? filterText.toLowerCase() : '';
  const allItems = [...hook.signals.values()].filter(m => m.isComputed === forComputed);
  const items = allItems
    .filter(m => {
      if (!q) { return true; }
      if (String(m.id).includes(q)) { return true; }
      if (fmt(m.value).toLowerCase().includes(q)) { return true; }
      const bindings = [...m.effectIds].map(id => hook.bindings.get(id)).filter(Boolean);
      const labels = [...new Set(bindings.map(b => b.label).filter(Boolean))];
      return labels.some(l => l.toLowerCase().includes(q));
    })
    .sort((a, b) => a.id - b.id);
  const label = forComputed ? 'computed signals' : 'signals';
  if (items.length === 0) {
    const msg = allItems.length === 0 ? `No ${label} registered` : 'No matches';
    return `<div class="empty">${msg}</div>`;
  }
  let rows = '';
  let totalSets = 0;
  let totalSubs = 0;
  for (const m of items) {
    totalSets += m.setCount;
    totalSubs += m.effectIds.size;
    const bindings = [...m.effectIds]
      .map(id => hook.bindings.get(id))
      .filter(Boolean);
    const labels = [...new Set(bindings.map(b => b.label).filter(Boolean))];
    const labelChips = labels.map(l => `<span class="lbl">${l}</span>`).join('');
    const keyChip = m.key === undefined ? '' : `<span class="lbl lbl-key">key: ${escHtml(String(m.key))}</span>`;
    const labelsRow = (keyChip || labelChips) ? `<div class="lbls">${keyChip}${labelChips}</div>` : '';
    const domState = getSignalDomState(hook, m.id);
    const openTag = signalOpenTag(hook, m.id);
    const eyeAttr = openTag ? ` data-src="${escapeSrc(openTag)}"` : '';
    const trackedSubs = m.effectIds.size;
    const subsClass = trackedSubs === 0 ? 'num subs-zero' : 'num';
    const subAttr = trackedSubs > 0 ? ` data-subs="${m.id}"` : '';
    const editAttr = (!m.isComputed && m.setter) ? ' data-editable="1"' : '';
    rows += `<tr data-sig="${m.id}">
      <td class="id">#${m.id}</td>
      <td class="val-cell"><span class="val"${editAttr} data-src="${fmt(m.value).replace(/"/g, '&quot;')}">${fmt(m.value)}</span>${labelsRow}</td>
      <td class="num">×${m.setCount}</td>
      <td class="eye-cell"${eyeAttr}>${domStateIcon(domState)}</td>
      <td class="${subsClass}"${subAttr}>${trackedSubs}</td>
    </tr>`;
  }
  const count = items.length;
  const summary = q ? `${count}/${allItems.length} ${label}` : `${count} ${count === 1 ? label.replace(/s$/, '') : label}`;
  const totalSubsClass = totalSubs === 0 ? 'subs-zero' : '';
  return `<table style="table-layout:fixed">
    <colgroup>
      <col style="width:44px">
      <col>
      <col style="width:44px">
      <col style="width:30px">
      <col style="width:36px">
    </colgroup>
    <thead><tr>
      <th>ID</th><th>Value</th><th>Sets</th><th class="eye-cell">DOM</th><th>Sub</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="sig-footer">
    <div class="totals-row">
      <span>${summary}</span>
      <div class="totals-counts">
        <span>×${totalSets} sets</span>
        <span class="${totalSubsClass}">${totalSubs} subs</span>
      </div>
    </div>
  </div>`;
}

function renderEffects(hook, filterText = '') {
  const q = filterText ? filterText.toLowerCase() : '';
  const allItems = [...hook.effects.values()];
  const items = allItems.filter(m => {
    if (!q) { return true; }
    if (String(m.id).includes(q)) { return true; }
    if (m.state.includes(q)) { return true; }
    if (m.src && fmtSrc(m.src).toLowerCase().includes(q)) { return true; }
    return false;
  });
  if (items.length === 0) {
    const msg = allItems.length === 0 ? 'No effect() calls active' : 'No matches';
    return `<div class="empty">${msg}</div>`;
  }
  let rows = '';
  for (const m of items) {
    const badge = `<span class="badge badge-${m.state}">${m.state}</span>`;
    const srcDisplay = m.src ? `<span class="src" data-src="${escapeSrc(m.src)}">${fmtSrc(m.src)}</span>` : '—';
    const depCount = m.depIds.size;
    const depsAttr = depCount > 0 ? ` data-deps="${m.id}"` : '';
    const depsClass = depCount === 0 ? 'num subs-zero' : 'num';
    rows += `<tr>
      <td class="id">#${m.id}</td>
      <td>${badge}</td>
      <td class="num">×${m.runCount}</td>
      <td class="${depsClass}"${depsAttr}>${depCount}</td>
      <td class="src-cell">${srcDisplay}</td>
    </tr>`;
  }
  return `<table>
    <colgroup>
      <col style="width:36px">
      <col style="width:72px">
      <col style="width:40px">
      <col style="width:36px">
      <col>
    </colgroup>
    <thead><tr>
      <th>ID</th><th>State</th><th>Runs</th><th>Dep</th><th>Function</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function describeElement(el) {
  let desc = el.tagName.toLowerCase();
  if (el.id) {
    desc += `#${ el.id}`;
  } else if (el.className && typeof el.className === 'string') {
    const first = el.className.trim().split(/\s+/)[0];
    if (first) { desc += `.${ first}`; }
  }
  return desc;
}

function renderDom(hook, filterText = '') {
  const q = filterText ? filterText.toLowerCase() : '';
  const allItems = [...hook.bindings.values()];
  const items = allItems.filter(m => {
    if (!q) { return true; }
    if (String(m.id).includes(q)) { return true; }
    const el = m.elementRef ? m.elementRef.deref() : null;
    if (el && describeElement(el).toLowerCase().includes(q)) { return true; }
    if (m.label && m.label.toLowerCase().includes(q)) { return true; }
    if (m.state.includes(q)) { return true; }
    return false;
  });
  if (items.length === 0) {
    const msg = allItems.length === 0 ? 'No signal-to-DOM bindings active' : 'No matches';
    return `<div class="empty">${msg}</div>`;
  }
  let rows = '';
  for (const m of items) {
    const el = m.elementRef ? m.elementRef.deref() : null;
    const elDesc = el ? describeElement(el) : 'removed';
    const elClass = el ? 'el' : 'el detached';
    const elAttr = el ? ` data-src="${escapeSrc(elementOpenTag(el))}"` : '';
    const badge = `<span class="badge badge-${m.state}">${m.state}</span>`;
    rows += `<tr data-bind="${m.id}">
      <td class="id">#${m.id}</td>
      <td class="el-cell"${elAttr}><span class="${elClass}">${elDesc}</span></td>
      <td><span class="lbl">${m.label || '—'}</span></td>
      <td>${badge}</td>
      <td class="num">×${m.runCount}</td>
    </tr>`;
  }
  return `<table>
    <colgroup>
      <col style="width:36px">
      <col style="width:80px">
      <col>
      <col style="width:72px">
      <col style="width:44px">
    </colgroup>
    <thead><tr>
      <th>ID</th><th>Element</th><th>Binding</th><th>State</th><th>Runs</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function logTypeLabel(e) {
  return (e.isComputed && e.type.startsWith('signal:'))
    ? `computed:${e.type.slice(7)}`
    : e.type;
}

function renderLog(hook, entries, filterText = '') {
  const q = filterText ? filterText.toLowerCase() : '';
  const filtered = q
    ? entries.filter(e => {
      if (logTypeLabel(e).includes(q)) { return true; }
      if (e.id !== undefined && String(e.id).includes(q)) { return true; }
      if (e.value !== undefined && fmt(e.value).toLowerCase().includes(q)) { return true; }
      return false;
    })
    : entries;
  if (filtered.length === 0) {
    const msg = entries.length === 0 ? 'No events recorded' : 'No matches';
    return `<div class="empty">${msg}</div>`;
  }
  let rows = '';
  for (let i = filtered.length - 1; i >= 0; i--) {
    const e = filtered[i];
    const isComputed = e.isComputed ?? false;
    const label = logTypeLabel(e);
    let typeClass = '';
    if (isComputed && e.type.startsWith('signal:')) {
      typeClass = e.type === 'signal:set' ? 'log-computed-set' : 'log-computed';
    } else if (e.type === 'signal:set') { typeClass = 'log-sig-set'; }
    else if (e.type.startsWith('signal:')) { typeClass = 'log-sig'; }
    else if (e.type === 'effect:run') { typeClass = 'log-eff-run'; }
    else if (e.type.startsWith('effect:')) { typeClass = 'log-eff'; }
    else if (e.type.startsWith('dom:')) { typeClass = 'log-dom'; }
    const idStr = e.id === undefined
      ? (e.bindingIds && e.bindingIds.length > 0 ? e.bindingIds.map(id => `#${id}`).join(' ') : '')
      : `#${e.id}`;
    let rowAttr = '';
    let idCellAttr = '';
    if (e.id !== undefined && hook) {
      if (e.type.startsWith('signal:')) {
        rowAttr = ` data-sig="${e.id}"`;
        if (hook.signals.has(e.id)) { idCellAttr = ` data-subs="${e.id}"`; }
      } else if (e.type.startsWith('effect:')) {
        if (hook.bindings.has(e.id)) {
          rowAttr = ` data-bind="${e.id}"`;
          const el = getBindingElement(hook, e.id);
          if (el) { idCellAttr = ` data-src="${escapeSrc(elementOpenTag(el))}"`; }
        } else if (hook.effects.has(e.id)) {
          idCellAttr = ` data-deps="${e.id}"`;
        }
      }
    }
    let evtAttr = '';
    if (e.id !== undefined && hook && e.type.startsWith('effect:') && !hook.bindings.has(e.id)) {
      const eff = hook.effects.get(e.id);
      if (eff && eff.src) { evtAttr = ` data-src="${escapeSrc(eff.src)}"`; }
    }
    const valCell = e.type === 'signal:set' ? `<span class="log-val" data-src="${escapeSrc(fmtFull(e.value))}">${fmt(e.value)}</span>` : '';
    rows += `<tr${rowAttr}>
      <td class="log-ts">+${e.ts}ms</td>
      <td class="log-evt ${typeClass}"${evtAttr}>${label}</td>
      <td class="id"${idCellAttr}>${idStr}</td>
      <td class="val-cell">${valCell}</td>
    </tr>`;
  }
  const total = entries.length;
  const shown = filtered.length;
  const summary = q ? `${shown}/${total}` : String(total);
  return `<table>
    <colgroup>
      <col style="width:60px">
      <col style="width:110px">
      <col style="width:40px">
      <col>
    </colgroup>
    <thead><tr>
      <th>Time</th><th>Event</th><th>ID</th><th>Value</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="sig-footer">
    <div class="totals-row">
      <span>${summary} event${total === 1 ? '' : 's'}</span>
      <div class="log-actions">
        <button class="log-action-btn log-copy-btn">Copy</button>
        <button class="log-action-btn log-clear-btn">Clear</button>
      </div>
    </div>
  </div>`;
}

function buildPopupHtml(panelUrl) {
  const closeTag = '</script>';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Kensington DevTools</title>
  <style>html,body{margin:0;padding:0;background:#1e1e2e;height:100%;overflow:hidden}</style>
</head>
<body>
<script type="module">
  import { buildPanel } from "${panelUrl}";
  function connect() {
    var hook = window.opener && window.opener.__KENSINGTON_DEVTOOLS__;
    if (!hook) { return; }
    var el = document.getElementById("${PANEL_ID}");
    if (el) { el.remove(); }
    buildPanel(hook, { popup: true });
  }
  connect();
  var ch = new BroadcastChannel("kensington-devtools");
  ch.onmessage = function(e) { if (e.data === "ready") { connect(); } };
  window.addEventListener("unload", function() { ch.close(); });
${closeTag}
</body>
</html>`;
}

export function buildPanel(hook, { popup = false } = {}) {
  if (document.getElementById(PANEL_ID)) { return; }

  const host = document.createElement('div');
  host.id = PANEL_ID;
  if (popup) {
    host.classList.add('popup-mode');
    host.style.cssText = 'display:block;width:100%;height:100%';
  }
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>${CSS}</style>
    <div id="tooltip" class="hidden"></div>
    <input id="val-editor" class="hidden" spellcheck="false">
    <button id="toggle" title="Kensington DevTools">K</button>
    <div id="panel" class="hidden">
      <div id="header">
        <span>Kensington DevTools</span>
        <div id="header-actions">
          <button id="popout" title="Open in new window">↗</button>
          <button id="close">✕</button>
        </div>
      </div>
      <div id="tabs">
        <button class="tab active" data-tab="signals">Signals</button>
        <button class="tab" data-tab="computed">Computed</button>
        <button class="tab" data-tab="effects">Effects</button>
        <button class="tab" data-tab="dom">DOM</button>
        <button class="tab" data-tab="log">Log</button>
      </div>
      <div id="filter-row">
        <input id="filter-input" type="text" placeholder="Filter…" spellcheck="false">
      </div>
      <div id="content"></div>
    </div>
  `;

  const panel = shadow.getElementById('panel');
  const header = shadow.getElementById('header');
  const tabsEl = shadow.getElementById('tabs');
  const filterRow = shadow.getElementById('filter-row');
  const filterInput = shadow.getElementById('filter-input');
  const valEditor = shadow.getElementById('val-editor');
  const toggle = shadow.getElementById('toggle');
  const closeBtn = shadow.getElementById('close');
  const popoutBtn = shadow.getElementById('popout');
  const content = shadow.getElementById('content');
  const tabs = shadow.querySelectorAll('.tab');
  const tooltip = shadow.getElementById('tooltip');

  let popupWin = null;

  if (popup) {
    panel.classList.remove('hidden');
    popoutBtn.style.display = 'none';
    closeBtn.style.display = 'none';
  }

  let activeTab = 'signals';
  let rafPending = false;
  let lastHoveredSigId = null;
  let lastHoveredBindId = null;
  let tooltipTarget = null;
  let filterText = '';
  let editingSignalId = null;

  const logEntries = [];
  const logStartTime = Date.now();

  function positionTooltip(anchorEl) {
    const r = anchorEl.getBoundingClientRect();
    const gap = 6;
    const tipH = tooltip.offsetHeight || 60;
    const top = r.top - tipH - gap < 0 ? r.bottom + gap : r.top - tipH - gap;
    tooltip.style.left = 'auto';
    tooltip.style.right = `${Math.max(0, window.innerWidth - r.right) }px`;
    tooltip.style.top = `${top }px`;
  }

  content.addEventListener('mouseover', e => {
    const tip = e.target.closest('[data-src],[data-subs],[data-deps]');
    if (tip !== tooltipTarget) {
      tooltipTarget = tip;
      if (tip && tip.dataset.deps !== undefined && hook) {
        const html = effectDepsHtml(hook, Number(tip.dataset.deps));
        if (html) {
          tooltip.innerHTML = html;
          tooltip.classList.remove('hidden');
          positionTooltip(tip);
        } else {
          tooltip.classList.add('hidden');
        }
      } else if (tip && tip.dataset.subs !== undefined && hook) {
        const html = signalSubscriberHtml(hook, hook.signals.get(Number(tip.dataset.subs)));
        if (html) {
          tooltip.innerHTML = html;
          tooltip.classList.remove('hidden');
          positionTooltip(tip);
        } else {
          tooltip.classList.add('hidden');
        }
      } else if (tip && tip.dataset.src !== undefined) {
        tooltip.textContent = tip.dataset.src;
        tooltip.classList.remove('hidden');
        positionTooltip(tip);
      } else {
        tooltip.classList.add('hidden');
      }
    }
    const sigRow = e.target.closest('tr[data-sig]');
    const newSigId = sigRow ? Number(sigRow.dataset.sig) : null;
    if (newSigId !== lastHoveredSigId) {
      if (lastHoveredSigId !== null) { clearHoverHighlight(getSignalElements(hook, lastHoveredSigId)); }
      lastHoveredSigId = newSigId;
      if (newSigId !== null) { applyHoverHighlight(getSignalElements(hook, newSigId)); }
    }
    const bindRow = e.target.closest('tr[data-bind]');
    const newBindId = bindRow ? Number(bindRow.dataset.bind) : null;
    if (newBindId !== lastHoveredBindId) {
      if (lastHoveredBindId !== null) {
        const prev = getBindingElement(hook, lastHoveredBindId);
        if (prev) { clearHoverHighlight([prev]); }
      }
      lastHoveredBindId = newBindId;
      if (newBindId !== null) {
        const el = getBindingElement(hook, newBindId);
        if (el) { applyHoverHighlight([el]); }
      }
    }
  });

  function renderTab() {
    tooltipTarget = null;
    tooltip.classList.add('hidden');
    if (lastHoveredSigId !== null) {
      clearHoverHighlight(getSignalElements(hook, lastHoveredSigId));
      lastHoveredSigId = null;
    }
    const allRenderers = [
      () => renderSignalTable(hook, false, filterText),
      () => renderSignalTable(hook, true, filterText),
      () => renderEffects(hook, filterText),
      () => renderDom(hook, filterText),
      () => renderLog(hook, logEntries, filterText),
    ];
    content.style.minHeight = '';
    let maxH = 0;
    for (const render of allRenderers) {
      content.innerHTML = render();
      if (content.scrollHeight > maxH) { maxH = content.scrollHeight; }
    }
    if (activeTab === 'signals') { content.innerHTML = renderSignalTable(hook, false, filterText); }
    else if (activeTab === 'computed') { content.innerHTML = renderSignalTable(hook, true, filterText); }
    else if (activeTab === 'effects') { content.innerHTML = renderEffects(hook, filterText); }
    else if (activeTab === 'dom') { content.innerHTML = renderDom(hook, filterText); }
    else if (activeTab === 'log') { content.innerHTML = renderLog(hook, logEntries, filterText); }
    if (!popup) {
      const chromeH = header.offsetHeight + tabsEl.offsetHeight + filterRow.offsetHeight;
      content.style.minHeight = `${Math.min(maxH, 480 - chromeH)}px`;
    }
  }

  function scheduleRender() {
    if (editingSignalId !== null) { return; }
    if (rafPending) { return; }
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      renderTab();
    });
  }

  function startEdit(sigId, meta, anchorEl) {
    editingSignalId = sigId;
    let initial;
    try { initial = JSON.stringify(meta.value); } catch { initial = String(meta.value); }
    valEditor.value = initial;
    const r = anchorEl.getBoundingClientRect();
    valEditor.style.left = `${r.left}px`;
    valEditor.style.top = `${r.top}px`;
    valEditor.style.width = `${Math.max(r.width + 2, 80)}px`;
    valEditor.classList.remove('hidden');
    requestAnimationFrame(() => { valEditor.focus(); valEditor.select(); });
  }

  function commitEdit() {
    if (editingSignalId === null) { return; }
    const sigId = editingSignalId;
    editingSignalId = null;
    valEditor.classList.add('hidden');
    const meta = hook ? hook.signals.get(sigId) : null;
    if (meta && meta.setter) {
      try { meta.setter(JSON.parse(valEditor.value)); } catch { /* invalid JSON, discard */ }
    }
    scheduleRender();
  }

  function cancelEdit() {
    editingSignalId = null;
    valEditor.classList.add('hidden');
    scheduleRender();
  }

  valEditor.addEventListener('keydown', e => {
    if (e.key === 'Enter') { commitEdit(); }
    if (e.key === 'Escape') { cancelEdit(); }
    e.stopPropagation();
  });

  valEditor.addEventListener('blur', () => { commitEdit(); });

  toggle.addEventListener('click', () => {
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) { renderTab(); }
  });

  closeBtn.addEventListener('click', () => {
    panel.classList.add('hidden');
  });

  popoutBtn.addEventListener('click', () => {
    if (popupWin && !popupWin.closed) {
      popupWin.focus();
      return;
    }
    popupWin = window.open('', 'kensington-devtools', 'width=480,height=640,resizable=yes');
    if (!popupWin) { return; }
    popupWin.document.open();
    popupWin.document.write(buildPopupHtml(import.meta.url));
    popupWin.document.close();
    popupWin.focus();
    panel.classList.add('hidden');
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.tab;
      renderTab();
    });
  });

  filterInput.addEventListener('input', () => {
    filterText = filterInput.value;
    renderTab();
  });

  content.addEventListener('click', e => {
    const valSpan = e.target.closest('.val[data-editable]');
    if (valSpan) {
      const row = valSpan.closest('tr[data-sig]');
      if (!row) { return; }
      const sigId = Number(row.dataset.sig);
      const meta = hook ? hook.signals.get(sigId) : null;
      if (!meta || !meta.setter || meta.isComputed) { return; }
      startEdit(sigId, meta, valSpan);
      return;
    }
    const copyBtn = e.target.closest('.log-copy-btn');
    if (copyBtn) {
      const q = filterText ? filterText.toLowerCase() : '';
      const toCopy = q
        ? logEntries.filter(entry => {
          if (logTypeLabel(entry).includes(q)) { return true; }
          if (entry.id !== undefined && String(entry.id).includes(q)) { return true; }
          if (entry.value !== undefined && fmt(entry.value).toLowerCase().includes(q)) { return true; }
          return false;
        })
        : logEntries;
      const lines = toCopy.map(entry => {
        const parts = [`+${entry.ts}ms`, logTypeLabel(entry)];
        if (entry.id !== undefined) { parts.push(`#${entry.id}`); }
        if (entry.type === 'signal:set' && entry.value !== undefined) { parts.push(fmt(entry.value)); }
        return parts.join('\t');
      });
      navigator.clipboard.writeText(lines.join('\n')).catch(() => {});
      return;
    }
    const clearBtn = e.target.closest('.log-clear-btn');
    if (clearBtn) {
      logEntries.length = 0;
      renderTab();
      return;
    }
    const sigRow = e.target.closest('tr[data-sig]');
    if (sigRow) {
      const elements = getSignalElements(hook, Number(sigRow.dataset.sig));
      if (elements.length > 0) {
        highlightElements(elements);
        if (elements[0].scrollIntoView) { elements[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
      }
      return;
    }
    const bindRow = e.target.closest('tr[data-bind]');
    if (bindRow) {
      const el = getBindingElement(hook, Number(bindRow.dataset.bind));
      if (el) {
        highlightElements([el]);
        if (el.scrollIntoView) { el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
      }
    }
  });

  content.addEventListener('mouseleave', () => {
    tooltipTarget = null;
    tooltip.classList.add('hidden');
    if (lastHoveredSigId !== null) {
      clearHoverHighlight(getSignalElements(hook, lastHoveredSigId));
      lastHoveredSigId = null;
    }
    if (lastHoveredBindId !== null) {
      const el = getBindingElement(hook, lastHoveredBindId);
      if (el) { clearHoverHighlight([el]); }
      lastHoveredBindId = null;
    }
  });

  hook.on('update', event => {
    if (logEntries.length >= LOG_MAX) { logEntries.shift(); }
    const entry = { ts: Date.now() - logStartTime, ...event };
    if (event.type === 'signal:set') {
      const meta = hook.signals.get(event.id);
      if (meta) { entry.value = meta.value; }
    }
    logEntries.push(entry);
  });

  hook.on('update', scheduleRender);
  renderTab();
}
