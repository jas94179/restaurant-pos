const $ = (id) => document.getElementById(id);
const clamp = (x) => Math.max(0, Math.min(1, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const out = (p) => 1 - Math.pow(1 - p, 3);
const back = (p) => { const c = 1.7; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
const inOut = (p) => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const bounce = (p) => { const n = 7.5625, d = 2.75; if (p < 1 / d) return n * p * p; if (p < 2 / d) return n * (p -= 1.5 / d) * p + 0.75; if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + 0.9375; return n * (p -= 2.625 / d) * p + 0.984375; };
const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
function slide(id, t, at) { const p = inOut(prog(t, at, at + 0.6)); $(id).style.transform = 'translateY(' + (1920 * (1 - p)) + 'px)'; }
function hideUntil(id, t, at) { if (t < at) $(id).style.transform = 'translateY(1920px)'; }
// pop in: opacity + scale with overshoot
function pop(el, t, at, d = 0.35) { if (typeof el === 'string') el = $(el); const p = prog(t, at, at + d); el.style.opacity = Math.min(1, p * 2); el.style.transform = 'scale(' + (0.6 + 0.4 * back(p)) + ')'; }
function rise(el, t, at, dy = 60, d = 0.5) { if (typeof el === 'string') el = $(el); const p = out(prog(t, at, at + d)); el.style.opacity = p; el.style.transform = 'translateY(' + (dy * (1 - p)) + 'px)'; }
function ripple(el, t, at) { if (typeof el === 'string') el = $(el); const p = prog(t, at, at + 0.45); el.style.transform = 'scale(' + (0.2 + p * 1.6) + ')'; el.style.opacity = p > 0 && p < 1 ? String(0.9 * (1 - p)) : '0'; }
function sheetUp(el, t, at, h) { if (typeof el === 'string') el = $(el); el.style.transform = 'translateY(' + (h * (1 - out(prog(t, at, at + 0.5)))) + 'px)'; }
let CAPS = [], curCap = -1;
function captions(t) {
  const box = $('capbox'); const k = CAPS.findIndex(c => t >= c[0] && t < c[1]);
  if (k !== curCap) {
    curCap = k;
    if (k >= 0) {
      const html = CAPS[k][2].replace(/<g>(.*?)<\/g>/g, (m, x) => x.split(' ').map(w => '\u0001' + w).join(' '));
      box.innerHTML = html.split(' ').map(w => w.startsWith('\u0001') ? '<span class="w g">' + w.slice(1) + '</span>' : '<span class="w">' + w + '</span>').join(' ');
    } else box.innerHTML = '';
  }
  box.style.display = k < 0 ? 'none' : 'block';
  if (k < 0) return;
  const [a, b] = CAPS[k];
  box.querySelectorAll('.w').forEach((w, i) => { const p = out(prog(t, a + i * 0.07, a + i * 0.07 + 0.25)); w.style.opacity = p; w.style.transform = 'translateY(' + (22 * (1 - p)) + 'px)'; });
  box.style.opacity = Math.min(prog(t, a, a + 0.15), 1 - prog(t, b - 0.2, b));
  box.style.transform = 'scale(' + (0.94 + 0.06 * out(prog(t, a, a + 0.25))) + ')';
}
// end card markup helper
function endCard(id, headline, sub) {
  $(id).innerHTML = `
    <div class="abs" style="left: 420px; top: 470px; width: 240px; height: 230px;">
      <div id="${id}coin" class="coin" style="left: 55px; top: 0; width: 130px; height: 130px; border-width: 9px; font-size: 66px;">₹</div>
      <div class="slot" style="left: 0; bottom: 40px; width: 240px; height: 32px; border-radius: 16px;"></div>
    </div>
    <div class="abs h1" style="left: 0; right: 0; top: 730px; text-align: center; font-size: 170px; line-height: 170px; letter-spacing: -7px;">galla</div>
    <div class="abs" style="left: 100px; right: 100px; top: 940px; text-align: center; font-size: 44px; line-height: 60px; color: #CFE0D6;">${sub}</div>
    <div id="${id}cta" class="abs" style="left: 110px; right: 110px; top: 1190px; border-radius: 36px; background: #F2B01E; color: #0F2A1F; padding: 44px; text-align: center;">
      <div style="font-size: 60px; line-height: 66px; font-weight: 700; letter-spacing: -1.5px;">${headline}</div>
      <div style="margin-top: 14px; font-size: 36px; font-weight: 600;">DM us · [@your_handle]</div>
    </div>`;
}
function endAnim(id, t, at) {
  slide(id, t, at);
  const cp = bounce(prog(t, at + 0.5, at + 1.4));
  $(id + 'coin').style.transform = 'translateY(' + (-500 * (1 - cp)) + 'px)';
  rise(id + 'cta', t, at + 1.2, 80);
}
