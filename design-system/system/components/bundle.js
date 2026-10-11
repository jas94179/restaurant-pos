/* @ds-bundle: {"format":4,"namespace":"Galla","components":[{"name":"Logo"},{"name":"Button"},{"name":"BackLink"},{"name":"Chip"},{"name":"Segmented"},{"name":"Tabs"},{"name":"Switch"},{"name":"Checkbox"},{"name":"TextField"},{"name":"SearchField"},{"name":"DishTile"},{"name":"Stepper"},{"name":"VegMark"},{"name":"CartBar"},{"name":"BillSummary"},{"name":"UpiQrCard"},{"name":"TableTile"},{"name":"PinPad"},{"name":"CashCountResult"},{"name":"Badge"},{"name":"Toast"},{"name":"Banner"},{"name":"EmptyState"},{"name":"Card"},{"name":"ListRow"},{"name":"Avatar"},{"name":"BottomSheet"},{"name":"AppHeader"},{"name":"TabBar"},{"name":"Receipt"},{"name":"NavBar"},{"name":"StatTile"},{"name":"DataTable"},{"name":"PlanCard"},{"name":"ApprovalRow"},{"name":"SalesChart"}]} */
(function () {
  var R = window.React, h = R.createElement, F = R.Fragment, useState = R.useState;
  function cx() { var a = []; for (var i = 0; i < arguments.length; i++) if (arguments[i]) a.push(arguments[i]); return a.join(' '); }
  function inr(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
  var ICON_PATHS = {
    orders: 'M7 3v8a2 2 0 0 0 2 2v8M5 3v5M9 3v5M17 3c-1.7 0-3 2-3 5s1.3 4 3 4v9',
    bills: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
    insights: 'M4 20V10M10 20V4M16 20v-7M2 20h20',
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5',
    check: 'M5 12l4.5 4.5L19 7',
    back: 'M15 5l-7 7 7 7',
    chevron: 'M9 5l7 7-7 7',
    del: 'M9 6h11v12H9l-6-6zM12 10l4 4M16 10l-4 4',
    printer: 'M6 9V3h12v6M4 9h16v8H4zM7 14h10v7H7z',
    wifiOff: 'M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0M3 3l18 18',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14'
  };
  function Icon(p) { return h('svg', { className: cx('gl-icon', p.className), viewBox: '0 0 24 24', width: p.size || 24, height: p.size || 24, 'aria-hidden': 'true' }, h('path', { d: ICON_PATHS[p.name] || '' })); }

  var LOGO_SRC = '/_blob/4aa4d40cfa112eb0831422f25e29083f';
  function Logo(p) {
    var size = p.size || 48;
    return h('span', { className: 'gl-logo' }, h('img', { src: LOGO_SRC, width: size, height: size, alt: p.wordmark ? '' : 'galla', className: 'gl-logo-mark' }), p.wordmark ? h('span', { className: 'gl-logo-word', style: { fontSize: size * 0.75 } }, 'galla') : null);
  }

  function Button(p) {
    var variant = p.variant || 'primary', size = p.size || 'lg';
    return h('button', { type: p.type || 'button', className: cx('gl-btn', 'gl-btn-' + variant, 'gl-btn-' + size, p.block && 'gl-block', p.loading && 'is-loading'), disabled: p.disabled || p.loading, onClick: p.onClick, 'aria-busy': p.loading ? 'true' : undefined },
      p.loading ? h('span', { className: 'gl-spinner', 'aria-hidden': 'true' }) : null,
      h('span', null, p.children));
  }
  function BackLink(p) { return h('a', { className: 'gl-backlink', href: p.href || '#' }, '‹ ' + (p.children || 'Profile')); }

  function Chip(p) {
    return h('button', { type: 'button', className: cx('gl-chip', p.selected && 'is-selected', p.tone === 'solid' && 'gl-chip-solid'), 'aria-pressed': p.selected ? 'true' : 'false', onClick: p.onClick }, p.children);
  }
  function Segmented(p) {
    var st = useState(p.value != null ? p.value : (p.options || [])[0]); var v = st[0], set = st[1];
    return h('div', { className: 'gl-seg', role: 'radiogroup', 'aria-label': p.label },
      (p.options || []).map(function (o) { return h('button', { key: o, type: 'button', role: 'radio', 'aria-checked': v === o ? 'true' : 'false', className: cx('gl-seg-btn', v === o && 'is-selected'), onClick: function () { set(o); p.onChange && p.onChange(o); } }, o); }));
  }
  function Tabs(p) {
    var st = useState(p.value != null ? p.value : (p.tabs || [])[0]); var v = st[0], set = st[1];
    return h('div', { className: 'gl-tabs', role: 'tablist' }, (p.tabs || []).map(function (t) { return h('button', { key: t, type: 'button', role: 'tab', 'aria-selected': v === t ? 'true' : 'false', className: cx('gl-tab', v === t && 'is-selected'), onClick: function () { set(t); } }, t); }));
  }
  function Switch(p) {
    var st = useState(!!p.checked); var on = st[0], set = st[1];
    return h('label', { className: 'gl-switch-row' },
      h('span', { className: 'gl-switch-text' }, h('span', { className: 'gl-switch-title' }, p.label), p.hint ? h('span', { className: 'gl-switch-hint' }, p.hint) : null),
      h('button', { type: 'button', role: 'switch', 'aria-checked': on ? 'true' : 'false', className: cx('gl-switch', on && 'is-on'), onClick: function () { set(!on); } }, h('span', { className: 'gl-switch-knob' })));
  }
  function Checkbox(p) {
    var st = useState(!!p.checked); var on = st[0], set = st[1];
    return h('label', { className: 'gl-check' },
      h('button', { type: 'button', role: 'checkbox', 'aria-checked': on ? 'true' : 'false', className: cx('gl-check-box', on && 'is-on'), onClick: function () { set(!on); } }, on ? h(Icon, { name: 'check', size: 18 }) : null),
      h('span', { className: 'gl-check-label' }, p.label, p.required ? h('span', { className: 'gl-req' }, ' Required') : null));
  }

  function TextField(p) {
    var id = p.id || ('f-' + (p.label || 'x').replace(/\W+/g, '-').toLowerCase());
    return h('div', { className: cx('gl-field', p.error && 'has-error') },
      p.label ? h('label', { className: 'gl-field-label', htmlFor: id }, p.label) : null,
      h('div', { className: 'gl-input-wrap' }, p.prefix ? h('span', { className: 'gl-prefix' }, p.prefix) : null,
        h('input', { id: id, className: 'gl-input', placeholder: p.placeholder, defaultValue: p.value, inputMode: p.inputMode, disabled: p.disabled, 'aria-invalid': p.error ? 'true' : undefined })),
      p.error ? h('p', { className: 'gl-field-error' }, p.error) : p.hint ? h('p', { className: 'gl-field-hint' }, p.hint) : null);
  }
  function SearchField(p) {
    return h('div', { className: 'gl-search' }, h(Icon, { name: 'search', size: 20 }), h('input', { className: 'gl-search-input', placeholder: p.placeholder || 'Search items', 'aria-label': p.placeholder || 'Search items', defaultValue: p.value }));
  }

  function VegMark(p) { var nv = p.type === 'nonveg'; return h('span', { className: cx('gl-veg', nv && 'is-nonveg'), role: 'img', 'aria-label': nv ? 'Non-veg' : 'Veg' }, h('span', { className: 'gl-veg-dot' })); }
  function Stepper(p) {
    var st = useState(p.value || 1); var n = st[0], set = st[1];
    return h('div', { className: 'gl-stepper' },
      h('button', { type: 'button', className: 'gl-step-btn', 'aria-label': 'Remove one', onClick: function () { set(Math.max(0, n - 1)); } }, h(Icon, { name: 'minus', size: 18 })),
      h('span', { className: 'gl-step-n', 'aria-live': 'polite' }, n),
      h('button', { type: 'button', className: 'gl-step-btn', 'aria-label': 'Add one', onClick: function () { set(n + 1); } }, h(Icon, { name: 'plus', size: 18 })));
  }
  function DishTile(p) {
    var off = p.state === 'out';
    return h('div', { className: cx('gl-tile', p.state === 'selected' && 'is-selected', off && 'is-off') },
      h(VegMark, { type: p.veg === false ? 'nonveg' : 'veg' }),
      h('div', { className: 'gl-tile-name' }, p.name), h('div', { className: 'gl-tile-price' }, inr(p.price)),
      h('div', { className: 'gl-tile-foot' }, off ? h('span', { className: 'gl-tile-out' }, 'Out of stock') : p.qty ? h(Stepper, { value: p.qty }) : h('button', { type: 'button', className: 'gl-add' }, 'ADD')));
  }
  function CartBar(p) {
    var items = p.items || 1;
    return h('button', { type: 'button', className: 'gl-cartbar' }, h('span', null, items + (items === 1 ? ' item · ' : ' items · ') + inr(p.total || 0)), h('span', { className: 'gl-cartbar-cta' }, (p.cta || 'View bill') + ' ›'));
  }
  function BillSummary(p) {
    var lines = p.lines || [], sub = lines.reduce(function (a, l) { return a + l.qty * l.price; }, 0), disc = p.discount || 0, rate = p.gstRate == null ? 5 : p.gstRate;
    var gst = (sub - disc) * rate / 100, total = sub - disc + gst;
    return h('div', { className: 'gl-bill' },
      p.title ? h('div', { className: 'gl-bill-title' }, p.title) : null,
      lines.map(function (l, i) { return h('div', { key: i, className: 'gl-bill-row' }, h('span', null, l.qty + ' × ' + l.name), h('span', { className: 'gl-num' }, inr(l.qty * l.price))); }),
      h('div', { className: 'gl-bill-meta' },
        h('div', { className: 'gl-bill-row gl-muted' }, h('span', null, 'Subtotal'), h('span', { className: 'gl-num' }, inr(sub))),
        disc ? h('div', { className: 'gl-bill-row gl-good' }, h('span', null, 'Discount'), h('span', { className: 'gl-num' }, '−' + inr(disc))) : null,
        rate ? h('div', { className: 'gl-bill-row gl-muted' }, h('span', null, 'GST ' + rate + '% (CGST + SGST)'), h('span', { className: 'gl-num' }, inr(gst))) : null,
        h('div', { className: 'gl-bill-row gl-bill-total' }, h('span', null, 'Total'), h('span', { className: 'gl-num' }, inr(total)))));
  }
  function QrArt() {
    var cells = [[0,0,7],[14,0,7],[0,14,7]], rects = [];
    cells.forEach(function (c, i) { rects.push(h('rect', { key: 'a' + i, x: c[0], y: c[1], width: 7, height: 7, className: 'gl-qr-ink' }), h('rect', { key: 'b' + i, x: c[0] + 1, y: c[1] + 1, width: 5, height: 5, className: 'gl-qr-paper' }), h('rect', { key: 'c' + i, x: c[0] + 2, y: c[1] + 2, width: 3, height: 3, className: 'gl-qr-ink' })); });
    var dots = [[8,0,1,2],[10,1,2,1],[9,3,1,3],[11,4,2,2],[0,8,2,1],[3,9,2,2],[6,8,1,3],[8,8,3,1],[12,8,1,2],[14,8,2,2],[17,9,3,1],[9,10,2,2],[1,12,3,1],[13,11,1,3],[15,12,2,1],[19,11,2,2],[8,13,2,1],[9,15,1,2],[11,14,2,2],[14,15,3,1],[18,14,1,3],[8,18,3,1],[12,17,1,3],[15,18,2,2],[19,19,2,1]];
    dots.forEach(function (d, i) { rects.push(h('rect', { key: 'd' + i, x: d[0], y: d[1], width: d[2], height: d[3], className: 'gl-qr-ink' })); });
    return h('svg', { viewBox: '0 0 21 21', width: 168, height: 168, role: 'img', 'aria-label': 'UPI QR code (sample)' }, rects);
  }
  function UpiQrCard(p) {
    return h('div', { className: 'gl-qr' },
      h('div', { className: 'gl-qr-shop' }, p.shop || 'Singh Sweets'), h('div', { className: 'gl-qr-amount gl-num' }, inr(p.amount || 0)),
      h('div', { className: 'gl-qr-hint' }, 'Scan with any UPI app. The amount is filled in.'),
      h('div', { className: 'gl-qr-box' }, h(QrArt)),
      h(Button, { variant: p.paid ? 'success' : 'primary', block: true }, p.paid ? 'Payment received' : 'Mark as paid'));
  }
  function TableTile(p) {
    var s = p.status || 'free';
    return h('button', { type: 'button', className: cx('gl-table', 'is-' + s) },
      h('span', { className: 'gl-table-n' }, p.name),
      h('span', { className: 'gl-table-s' }, s === 'free' ? 'Free' : s === 'printed' ? 'Bill printed · ' + inr(p.amount || 0) : inr(p.amount || 0) + (p.minutes != null ? ' · ' + p.minutes + ' min' : '')));
  }
  function PinPad(p) {
    var st = useState(p.filled || 0); var n = st[0], set = st[1], st2 = p.state;
    var keys = ['1','2','3','4','5','6','7','8','9','','0','del'];
    return h('div', { className: 'gl-pin' },
      p.title ? h('div', { className: 'gl-pin-title' }, p.title) : null, p.subtitle ? h('div', { className: 'gl-pin-sub' }, p.subtitle) : null,
      h('div', { className: cx('gl-pin-dots', st2 === 'error' && 'is-error', st2 === 'ok' && 'is-ok'), 'aria-label': n + ' of 4 digits entered' }, [0,1,2,3].map(function (i) { return h('span', { key: i, className: cx('gl-pin-dot', (i < n || st2 === 'ok') && 'is-on') }); })),
      st2 === 'error' ? h('div', { className: 'gl-pin-err' }, 'Wrong PIN. Try again.') : null,
      h('div', { className: 'gl-pin-keys' }, keys.map(function (k, i) {
        if (!k) return h('span', { key: i });
        return h('button', { key: i, type: 'button', className: 'gl-pin-key', 'aria-label': k === 'del' ? 'Delete' : k, onClick: function () { set(k === 'del' ? Math.max(0, n - 1) : Math.min(4, n + 1)); } }, k === 'del' ? h(Icon, { name: 'del', size: 22 }) : k);
      })));
  }
  function CashCountResult(p) {
    var exp = p.expected || 0, cnt = p.counted == null ? exp : p.counted, d = cnt - exp;
    var tone = d === 0 ? 'ok' : d < 0 ? 'short' : 'extra';
    var label = d === 0 ? 'Cash matches' : d < 0 ? 'Short by ' + inr(-d) : 'Extra ' + inr(d);
    return h('div', { className: 'gl-cash' },
      h('div', { className: 'gl-cash-title' }, 'Cash in the drawer'),
      (p.rows || []).map(function (r, i) { return h('div', { key: i, className: cx('gl-bill-row', r.muted && 'gl-muted') }, h('span', null, r.label), h('span', { className: 'gl-num' }, (r.sign || '') + inr(r.amount))); }),
      h('div', { className: 'gl-bill-row gl-strong gl-sep' }, h('span', null, 'Should be'), h('span', { className: 'gl-num' }, p.blind ? 'Hidden' : inr(exp))),
      h('div', { className: 'gl-bill-row gl-strong' }, h('span', null, 'Counted'), h('span', { className: 'gl-num' }, inr(cnt))),
      p.blind ? null : h('div', { className: cx('gl-cash-result', 'is-' + tone), role: 'status' }, (tone === 'ok' ? '✓ ' : '') + label));
  }

  function Badge(p) { return h('span', { className: cx('gl-badge', 'gl-badge-' + (p.tone || 'neutral')) }, p.tone === 'offline' ? h('span', { className: 'gl-badge-dot' }) : null, p.children); }
  function Toast(p) { return h('div', { className: cx('gl-toast', 'gl-toast-' + (p.tone || 'success')), role: 'status' }, p.children); }
  function Banner(p) { return h('div', { className: cx('gl-banner', 'gl-banner-' + (p.tone || 'info')), role: p.tone === 'danger' ? 'alert' : 'status' }, p.title ? h('div', { className: 'gl-banner-title' }, p.title) : null, h('div', { className: 'gl-banner-text' }, p.children)); }
  function EmptyState(p) { return h('div', { className: 'gl-empty' }, h('div', { className: 'gl-empty-title' }, p.title), h('p', { className: 'gl-empty-text' }, p.children), p.action ? h(Button, { variant: 'secondary', size: 'md' }, p.action) : null); }
  function Card(p) { return h('div', { className: cx('gl-card', p.tone === 'brand' && 'gl-card-brand') }, p.title ? h('div', { className: 'gl-card-title' }, p.title) : null, p.children ? h('div', { className: 'gl-card-text' }, p.children) : null, p.footer || null); }
  function Avatar(p) { return h('span', { className: cx('gl-avatar', 'gl-avatar-' + (p.role || 'cashier'), p.size === 'sm' && 'gl-avatar-sm'), 'aria-hidden': 'true' }, (p.name || '?').charAt(0).toUpperCase()); }
  function ListRow(p) {
    return h('div', { className: 'gl-row' }, p.avatar ? h(Avatar, { name: p.title, role: p.role }) : null,
      h('div', { className: 'gl-row-main' }, h('div', { className: 'gl-row-title' }, p.title), p.subtitle ? h('div', { className: 'gl-row-sub' }, p.subtitle) : null),
      p.value ? h('span', { className: 'gl-row-value gl-num' }, p.value) : null, p.chevron !== false ? h(Icon, { name: 'chevron', size: 20, className: 'gl-row-chev' }) : null);
  }
  function BottomSheet(p) {
    return h('div', { className: 'gl-sheet-stage' }, h('div', { className: 'gl-scrim', 'aria-hidden': 'true' }),
      h('div', { className: 'gl-sheet', role: 'dialog', 'aria-label': p.title },
        h('div', { className: 'gl-sheet-handle', 'aria-hidden': 'true' }),
        p.title ? h('div', { className: 'gl-sheet-title' }, p.title) : null, p.subtitle ? h('div', { className: 'gl-sheet-sub' }, p.subtitle) : null,
        h('div', { className: 'gl-sheet-body' }, p.children), p.actions ? h('div', { className: 'gl-sheet-actions' }, p.actions) : null));
  }
  function AppHeader(p) {
    return h('header', { className: 'gl-header' },
      h('div', null, h('div', { className: 'gl-header-kicker' }, p.restaurant || 'Singh Sweets'), h('div', { className: 'gl-header-title' }, p.title || 'Counter')),
      h('div', { className: 'gl-header-right' }, p.offline ? h(Badge, { tone: 'offline' }, 'Offline') : null, p.user ? h('span', { className: 'gl-header-user' }, p.user) : null));
  }
  function TabBar(p) {
    var st = useState(p.active || 'Orders'); var a = st[0], set = st[1];
    var tabs = [['Orders', 'orders'], ['Bills', 'bills'], ['Insights', 'insights'], ['Profile', null]];
    return h('nav', { className: 'gl-tabbar', 'aria-label': 'Main' }, tabs.map(function (t) {
      var on = a === t[0];
      return h('button', { key: t[0], type: 'button', className: cx('gl-tabbar-item', on && 'is-active'), 'aria-current': on ? 'page' : undefined, onClick: function () { set(t[0]); } },
        h('span', { className: 'gl-tabbar-ind' }), t[1] ? h(Icon, { name: t[1] }) : h('span', { className: cx('gl-tabbar-av', on && 'is-active') }, (p.initial || 'R')), h('span', { className: 'gl-tabbar-label' }, t[0]));
    }));
  }

  function Receipt(p) { return h('pre', { className: 'gl-receipt', 'aria-label': p.label || 'Receipt preview' }, (p.lines || []).join('\n')); }

  function NavBar(p) {
    return h('header', { className: 'gl-nav' }, h(Logo, { size: 32, wordmark: true }),
      h('nav', { className: 'gl-nav-links', 'aria-label': 'Main' }, (p.links || ['Restaurants', 'Requests', 'Revenue', 'Health']).map(function (l, i) { return h('a', { key: l, href: '#', className: cx('gl-nav-link', i === (p.active || 0) && 'is-active') }, l); })),
      h('div', { className: 'gl-nav-right' }, p.right || h(Avatar, { name: 'Jasdeep', role: 'owner', size: 'sm' })));
  }
  function StatTile(p) {
    var up = (p.delta || '').charAt(0) !== '−' && (p.delta || '').charAt(0) !== '-';
    return h('div', { className: 'gl-stat' }, h('div', { className: 'gl-stat-label' }, p.label), h('div', { className: 'gl-stat-value gl-num' }, p.value),
      p.delta ? h('div', { className: cx('gl-stat-delta', up ? 'is-up' : 'is-down') }, p.delta + ' ' + (p.period || 'vs last week')) : null);
  }
  function DataTable(p) {
    var cols = p.columns || [];
    return h('div', { className: 'gl-table-wrap' }, h('table', { className: 'gl-dtable' },
      h('thead', null, h('tr', null, cols.map(function (c) { return h('th', { key: c.key, className: c.num ? 'gl-num-col' : null, scope: 'col' }, c.label); }))),
      h('tbody', null, (p.rows || []).map(function (r, i) { return h('tr', { key: i }, cols.map(function (c) { var v = r[c.key]; return h('td', { key: c.key, className: c.num ? 'gl-num-col gl-num' : null }, c.badge ? h(Badge, { tone: v === 'Active' ? 'success' : v === 'Trial' ? 'warning' : 'neutral' }, v) : v); })); }))));
  }
  function PlanCard(p) {
    return h('div', { className: cx('gl-plan', p.featured && 'is-featured') },
      p.featured ? h('span', { className: 'gl-plan-flag' }, 'Most popular') : null,
      h('div', { className: 'gl-plan-name' }, p.name), h('div', { className: 'gl-plan-price gl-num' }, p.price === 0 ? '₹0' : inr(p.price), p.price ? h('small', null, ' /month') : null),
      p.tagline ? h('div', { className: 'gl-plan-tag' }, p.tagline) : null,
      h('ul', { className: 'gl-plan-list' }, (p.features || []).map(function (f) { return h('li', { key: f }, h(Icon, { name: 'check', size: 16 }), f); })),
      h(Button, { variant: p.featured ? 'accent' : 'secondary', size: 'md', block: true }, p.cta || 'Choose ' + p.name));
  }
  function ApprovalRow(p) {
    var st = useState(p.state || 'pending'); var s = st[0], set = st[1];
    return h('div', { className: 'gl-approval' },
      h(Avatar, { name: p.restaurant, role: 'manager' }),
      h('div', { className: 'gl-row-main' }, h('div', { className: 'gl-row-title' }, p.restaurant + ' wants ' + p.plan), h('div', { className: 'gl-row-sub' }, 'UPI ref ' + p.utr + ' · ' + inr(p.amount) + ' · ' + p.when)),
      s === 'pending' ? h('div', { className: 'gl-approval-actions' }, h(Button, { variant: 'secondary', size: 'sm', onClick: function () { set('declined'); } }, 'Decline'), h(Button, { variant: 'primary', size: 'sm', onClick: function () { set('approved'); } }, 'Approve'))
        : h(Badge, { tone: s === 'approved' ? 'success' : 'danger' }, s === 'approved' ? 'Approved' : 'Declined'));
  }
  function SalesChart(p) {
    var d = p.data || [], max = Math.max.apply(null, d.map(function (x) { return x.value; }).concat([1]));
    var W = 560, H = 180, pad = 28, bw = (W - pad) / Math.max(1, d.length);
    return h('figure', { className: 'gl-chart' }, p.title ? h('figcaption', { className: 'gl-chart-title' }, p.title) : null,
      h('svg', { viewBox: '0 0 ' + W + ' ' + (H + 24), width: '100%', role: 'img', 'aria-label': p.title || 'Sales chart' },
        [0, 0.5, 1].map(function (g) { var y = H - g * (H - 10); return h('g', { key: g }, h('line', { x1: pad, x2: W, y1: y, y2: y, className: 'gl-chart-grid' }), h('text', { x: pad - 6, y: y + 4, className: 'gl-chart-axis', textAnchor: 'end' }, g === 0 ? '0' : Math.round(max * g / 1000) + 'k')); }),
        d.map(function (x, i) { var bh = (x.value / max) * (H - 10); return h('g', { key: i }, h('rect', { x: pad + i * bw + bw * 0.18, y: H - bh, width: bw * 0.64, height: bh, rx: 4, className: cx('gl-chart-bar', x.highlight && 'is-hi') }), h('text', { x: pad + i * bw + bw / 2, y: H + 18, className: 'gl-chart-axis', textAnchor: 'middle' }, x.label)); })));
  }

  var api = { Logo: Logo, Button: Button, BackLink: BackLink, Chip: Chip, Segmented: Segmented, Tabs: Tabs, Switch: Switch, Checkbox: Checkbox, TextField: TextField, SearchField: SearchField, DishTile: DishTile, Stepper: Stepper, VegMark: VegMark, CartBar: CartBar, BillSummary: BillSummary, UpiQrCard: UpiQrCard, TableTile: TableTile, PinPad: PinPad, CashCountResult: CashCountResult, Badge: Badge, Toast: Toast, Banner: Banner, EmptyState: EmptyState, Card: Card, ListRow: ListRow, Avatar: Avatar, BottomSheet: BottomSheet, AppHeader: AppHeader, TabBar: TabBar, Receipt: Receipt, NavBar: NavBar, StatTile: StatTile, DataTable: DataTable, PlanCard: PlanCard, ApprovalRow: ApprovalRow, SalesChart: SalesChart, Icon: Icon };
  window.Galla = Object.assign(window.Galla || {}, api);
})();
