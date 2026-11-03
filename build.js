// build.js - renders index.html from site.json. Colors are derived from theme.colors.accent via theme-engine.
// Usage: node build.js            (optionally: node build.js "#1F4D3A" to override the base color)
const fs = require("fs");
const path = require("path");
const { buildTheme } = require("./theme-engine");

const site = JSON.parse(fs.readFileSync(path.join(__dirname, "site.json"), "utf8"));
const base = process.argv[2] || site.theme.colors.accent;
const T = buildTheme(base);
const c = T.colors, d = T.dark;
const S = site.sections;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));

const ICON = {
  home: '<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  plan: '<path d="M4 4h16v16H4zM4 12h8v8M12 4v8"/>',
  heart: '<path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowUR: '<path d="M7 17L17 7M8 7h9v9"/>',
  left: '<path d="M15 6l-6 6 6 6"/>',
  play: '<path d="M8 5l11 7-11 7z" fill="currentColor"/>',
  building: '<path d="M5 21V4h9v17M14 9h5v12M8 8h3M8 12h3M8 16h3M3 21h18"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-4 3-6 6.5-6s6 2 6.5 6M16 5a3.5 3.5 0 0 1 0 7M18 14c2 .6 3.3 2.5 3.5 6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  pin: '<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  star: '<path d="M12 3l2.7 5.7 6.3.8-4.6 4.3 1.2 6.2L12 17l-5.6 3 1.2-6.2L3 9.5l6.3-.8z" fill="currentColor"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
};
const svg = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;
ICON.menu = '<path d="M4 7h16M4 12h16M4 17h16"/>';
ICON.close = '<path d="M6 6l12 12M18 6L6 18"/>';
const PLAN_ROOMS = [
  [["Living", 10, 10, 130, 100], ["Kitchen", 140, 10, 70, 60], ["Utility", 210, 10, 80, 60], ["Bed 1", 10, 110, 100, 80], ["Bath", 110, 110, 50, 80], ["Bed 2", 160, 70, 130, 120]],
  [["Living", 10, 10, 130, 90], ["Kitchen", 140, 10, 70, 60], ["Utility", 210, 10, 80, 60], ["Study", 10, 100, 60, 90], ["Bed 1", 70, 100, 70, 90], ["Bath", 140, 100, 40, 90], ["Bed 2", 180, 70, 110, 120]],
  [["Living", 10, 10, 120, 90], ["Dining", 130, 10, 60, 60], ["Kitchen", 190, 10, 55, 60], ["Utility", 245, 10, 45, 60], ["Bed 1", 10, 100, 70, 90], ["Bath", 80, 100, 35, 90], ["Bed 2", 115, 100, 70, 90], ["Bed 3", 185, 70, 105, 120]],
];
const planSvg = (i) => `<svg viewBox="0 0 300 200" width="100%" height="100%" aria-hidden="true" font-family="Inter,sans-serif" font-size="9" fill="currentColor" text-anchor="middle">${PLAN_ROOMS[i % PLAN_ROOMS.length].map(([n, x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="currentColor" stroke-opacity=".55" stroke-width="1.5"/><text x="${x + w / 2}" y="${y + h / 2 + 3}" opacity=".75">${n}</text>`).join("")}</svg>`;
const statIcons = ["building", "users", "pin", "globe"];

const words = S.hero.headline.split(" ");
const headline = words.length > 1
  ? `${esc(words.slice(0, -1).join(" "))}<br><em>${esc(words.at(-1))}</em>`
  : `<em>${esc(words[0])}</em>`;

const projects = S.projects.items;
const pad = (n) => String(n).padStart(2, "0");

// CSS-drawn scene so the page looks finished without photos. Drop /assets/hero.jpg to override.
const scene = "";

const marq = [...S.stats.map((x) => x.value + " " + x.label), ...S.hero.highlights, ...S.about.trust].map((t) => `<span>${esc(t)}</span>`).join("");
const nav = [{label:"Home",href:"#"},...site.navigation.primary].map((n, i) => `<a href="${esc(n.href)}"${i === 0 ? ' class="on"' : ""}>${esc(n.label)}</a>`).join("");

const css = `
:root{
  --bg:${c.background};--surface:${c.surface};--border:${c.border};--text:${c.text};--muted:${c.muted};
  --accent:${c.accent};--accent-dark:${c.accentDark};--accent-soft:${c.accentSoft};--accent-light:${c.accentLight};--accent-deep:${c.accentDeep};--inverse-hi:${c.inverseHi};--inverse:${c.inverse};--on-accent:${c.onAccent};
  --glass:rgba(255,255,255,.55);--glass-line:rgba(255,255,255,.7);
  --serif:'${site.theme.fonts.heading.family}',system-ui,sans-serif;--sans:'${site.theme.fonts.body.family}',system-ui,sans-serif;
}
@media (prefers-color-scheme:dark){:root.auto{--bg:${d.background};--surface:${d.surface};--border:${d.border};--text:${d.text};--accent:${d.accent};--glass:rgba(20,20,20,.55);--glass-line:rgba(255,255,255,.12)}}
*{box-sizing:border-box;margin:0}
html{scroll-behavior:smooth}
body{font-family:var(--sans);color:var(--text);background:var(--bg);-webkit-font-smoothing:antialiased;line-height:1.55}
a{color:inherit;text-decoration:none}
.ic{width:20px;height:20px;flex:none}
.glass{background:var(--glass);backdrop-filter:blur(18px) saturate(1.3);-webkit-backdrop-filter:blur(18px) saturate(1.3);border:1px solid var(--glass-line);box-shadow:0 10px 40px rgba(0,0,0,.08)}
.btn{display:inline-flex;align-items:center;gap:12px;border-radius:999px;padding:14px 26px;font-size:14px;font-weight:500;border:0;cursor:pointer;font-family:inherit;transition:transform .2s,box-shadow .2s}
.btn:hover{transform:translateY(-1px)}
.btn.dark{background:var(--inverse);color:#fff}
.btn.ghost{background:transparent;color:var(--text)}
.circle{display:grid;place-items:center;width:42px;height:42px;border-radius:50%;background:#fff;color:var(--inverse);border:0;cursor:pointer;flex:none}
.circle.dark{background:var(--inverse);color:#fff}

/* HERO */
.hero{position:relative;min-height:100vh;min-height:100svh;overflow:hidden;padding:28px 32px 32px;display:grid;grid-template-rows:auto 1fr auto;gap:20px}
.scene,.hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1}
.hero::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,${c.background}d9 0%,${c.background}00 55%)}
.top{display:flex;align-items:center;justify-content:space-between;gap:16px}
.logo{display:flex;align-items:center;gap:12px;font-size:12px;letter-spacing:.32em;text-transform:uppercase;font-weight:500}
.logo b{display:grid;place-items:center;width:38px;height:38px;border-radius:10px;background:var(--inverse);color:#fff;font-family:var(--serif);font-size:20px;letter-spacing:0}
.pill-nav{display:flex;gap:6px;padding:8px;border-radius:999px}
.pill-nav a{padding:10px 22px;border-radius:999px;font-size:14px}
.pill-nav a.on{background:var(--inverse);color:#fff}
.top-r{display:flex;align-items:center;gap:12px}
.icon-btn{width:48px;height:48px;border-radius:50%;display:grid;place-items:center}
.cta{display:flex;align-items:center;gap:16px;background:var(--inverse);color:#fff;border-radius:999px;padding:6px 6px 6px 26px;font-size:14px}
.cta .circle{width:46px;height:46px}
.mid{position:relative;display:grid;grid-template-columns:88px 1fr;gap:28px;align-items:center}
.rail{display:flex;flex-direction:column;align-items:center;gap:14px;padding:16px 12px;border-radius:999px;width:68px}
.rail a{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;color:var(--muted)}
.rail a.on{background:var(--inverse);color:#fff}
.rail .thumb{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent-dark))}
.rail small{font-size:10px;text-align:center;line-height:1.2;color:var(--muted)}
.copy{max-width:640px}
.eyebrow{font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:var(--muted);margin-bottom:20px}
h1{font-family:var(--serif);font-weight:600;font-size:clamp(48px,7.4vw,112px);line-height:1.02;letter-spacing:-.04em}
h1 em{font-style:normal;color:var(--accent-dark)}
.sub{margin:26px 0 30px;max-width:420px;color:var(--muted);font-size:15px}
.actions{display:flex;align-items:center;gap:22px;flex-wrap:wrap}
.watch{display:flex;align-items:center;gap:12px;font-size:14px}
.watch .circle{border:1px solid var(--text);background:rgba(255,255,255,.4);color:var(--text)}.watch .circle .ic{width:16px;height:16px}
.tags{position:absolute;right:0;top:0;border-left:1px solid var(--border);padding-left:14px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;line-height:1.9}
.dock{margin-right:84px;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr) minmax(0,.62fr);gap:20px;align-items:stretch;margin-left:116px}
.feat{display:flex;gap:20px;padding:14px;border-radius:32px;align-items:center}
.feat .ph{width:176px;height:148px;border-radius:22px;flex:none;background:linear-gradient(160deg,var(--accent-soft),var(--accent) 60%,var(--accent-dark));position:relative;overflow:hidden}
.feat .ph::before{content:"";position:absolute;left:0;right:0;bottom:0;height:46%;background:linear-gradient(0deg,rgba(0,0,0,.45),transparent)}
.feat .ph span{position:absolute;left:12px;top:10px;font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:#fff}
.feat .body{flex:1;min-width:0}
.feat .row{display:flex;justify-content:space-between;align-items:baseline}
.feat h3{font-family:var(--serif);font-weight:600;font-size:21px;line-height:1.1}
.feat .count{font-size:12px;color:var(--muted)}
.feat p{font-size:12.5px;color:var(--muted);margin:8px 0 12px}
.feat .more{font-size:13px;display:inline-flex;gap:8px;align-items:center}
.feat .ctrl{display:flex;gap:10px;align-items:center;margin-top:12px}
.feat .bar{flex:1;height:2px;background:var(--border);position:relative;border-radius:2px}
.feat .bar i{position:absolute;left:0;top:0;bottom:0;background:var(--text);border-radius:2px;transition:width .4s}
.stats{display:grid;grid-template-columns:repeat(3,1fr);padding:26px 10px;border-radius:32px;align-items:center}
.stat{align-self:stretch;padding:0 18px;border-left:1px solid var(--border)}
.stat:first-child{border:0}
.stat .ic{color:var(--muted);margin-bottom:12px}
.stat b{display:block;font-size:26px;font-weight:500;letter-spacing:-.01em}
.stat span{font-size:12px;color:var(--muted)}
.vision{background:var(--inverse);color:#fff;border-radius:32px;padding:22px;display:flex;flex-direction:column;justify-content:space-between;gap:12px;position:relative}
.vision .dot{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent-dark))}
.vision h4{font-family:var(--sans);font-weight:500;font-size:20px;line-height:1.25;margin:10px 0 6px}
.vision p{font-size:12px;opacity:.65}
.vision .circle{position:absolute;right:20px;top:20px;width:40px;height:40px}

/* SECTIONS */
section.s{padding:110px 6vw;max-width:1360px;margin:0 auto}
.kick{font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:var(--accent-dark);margin-bottom:14px}
h2{font-family:var(--serif);font-weight:600;font-size:clamp(30px,4.2vw,54px);line-height:1.1;letter-spacing:-.025em;margin-bottom:18px}
.lead{color:var(--muted);max-width:560px;margin-bottom:44px}
.grid{display:grid;gap:20px}
.g3{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
.card{border-radius:28px;padding:28px;background:var(--surface);border:1px solid var(--border)}
.proj .img{height:210px;border-radius:20px;margin-bottom:18px;background:linear-gradient(150deg,var(--accent-soft),var(--accent));position:relative}
.proj .st{position:absolute;left:14px;top:14px;background:var(--bg);border-radius:999px;font-size:11px;padding:5px 12px}
.proj h3,.card h3{font-family:var(--serif);font-weight:600;font-size:23px;line-height:1.1;margin-bottom:6px}
.meta{font-size:13px;color:var(--muted)}
.price{margin-top:14px;font-weight:500}
.chips{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:30px}
.chip{border:1px solid var(--border);border-radius:999px;padding:8px 18px;font-size:13px;background:transparent;cursor:pointer;font-family:inherit;color:var(--text)}
.chip.on{background:var(--inverse);color:#fff;border-color:var(--inverse)}
.amen{display:flex;align-items:center;gap:14px;padding:20px 22px;border-radius:20px;background:var(--surface);border:1px solid var(--border)}
.amen .ic{color:var(--accent-dark)}
.dark-band{background:var(--inverse);color:#fff;border-radius:48px;margin:0 2vw}
.dark-band .lead{color:rgba(255,255,255,.65)}.dark-band .kick{color:var(--accent)}
.plan{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:28px;padding:30px}
.plan h3{font-family:var(--serif);font-weight:600;font-size:28px}
.plan .box{height:150px;margin:18px 0;border:1px dashed rgba(255,255,255,.3);border-radius:16px;display:grid;place-items:center;font-size:12px;opacity:.6}
.plan .pr{font-size:22px;color:var(--accent)}
.near{display:grid;gap:10px}.near div{display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--border)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
.map{height:380px;border-radius:32px;background:repeating-linear-gradient(0deg,transparent 0 39px,var(--border) 39px 40px),repeating-linear-gradient(90deg,transparent 0 39px,var(--border) 39px 40px),var(--surface);display:grid;place-items:center;border:1px solid var(--border);color:var(--accent-dark)}
.map .ic{width:44px;height:44px}
.gal{grid-template-columns:repeat(3,1fr)}.gal div{height:230px;border-radius:24px;background:linear-gradient(140deg,var(--accent-soft),var(--accent));display:flex;align-items:flex-end;padding:14px;font-size:12px;color:#fff}
.gal div:nth-child(1),.gal div:nth-child(5){grid-row:span 2;height:480px}
.vals{display:grid;gap:18px;margin-top:26px}.vals b{display:block;font-family:var(--serif);font-size:18px;font-weight:600}
.badges{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px}.badges span{border:1px solid var(--border);border-radius:999px;padding:6px 14px;font-size:12px;display:inline-flex;gap:6px;align-items:center}
.quote{font-family:var(--serif);font-weight:500;font-size:19px;line-height:1.45;margin:12px 0 20px}.stars{color:var(--accent);display:flex;gap:2px}.stars .ic{width:14px;height:14px}
details{border-bottom:1px solid var(--border);padding:22px 0}summary{cursor:pointer;font-family:var(--serif);font-weight:500;font-size:19px;list-style:none;display:flex;justify-content:space-between}
summary::after{content:"+";color:var(--accent-dark)}details[open] summary::after{content:"–"}details p{color:var(--muted);margin-top:12px;max-width:640px}
form{display:grid;gap:14px}
input,select{width:100%;padding:16px 20px;border-radius:16px;border:1px solid var(--border);background:var(--bg);font:inherit;color:var(--text)}
.consent{font-size:12px;color:var(--muted)}
footer{padding:60px 6vw 90px;background:var(--inverse);color:#fff;margin-top:110px}
footer .cols{display:flex;gap:40px;justify-content:space-between;flex-wrap:wrap;max-width:1360px;margin:0 auto}
footer small{display:block;max-width:1360px;margin:36px auto 0;opacity:.5;font-size:12px}
footer a{opacity:.75;margin-right:20px}
.float{position:fixed;right:22px;bottom:22px;display:flex;flex-direction:column;gap:10px;z-index:9}
.float a{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:#25d366;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.2)}
.float a+a{background:var(--inverse)}
.reveal{opacity:0;transform:translateY(24px);transition:opacity .8s,transform .8s}.reveal.in{opacity:1;transform:none}
@media(max-width:1100px){.dock{grid-template-columns:1fr;margin-left:0}.mid{grid-template-columns:1fr}.rail{display:none}.pill-nav{display:none}.tags{display:none}.two{grid-template-columns:1fr}.gal{grid-template-columns:1fr 1fr}.gal div:nth-child(n){grid-row:auto;height:200px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}

.scene{transform:scale(1.08);will-change:transform}
.layer{will-change:transform}
.glow{position:absolute;left:0;top:0;width:560px;height:560px;margin:-280px 0 0 -280px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.65),transparent 65%);pointer-events:none;z-index:-1;opacity:0;transition:opacity .5s;will-change:transform}
.hero:hover .glow{opacity:.8}
.rise{animation:rise 1s cubic-bezier(.2,.7,.2,1) backwards;animation-delay:calc(var(--d,0) * 1s)}
@keyframes rise{from{opacity:0;transform:translateY(34px)}}
.w{display:inline-block;overflow:hidden;vertical-align:bottom;padding:0 .02em .14em;margin-bottom:-.14em}
.ch{display:inline-block;animation:chIn 1s cubic-bezier(.2,.8,.2,1) backwards;animation-delay:calc(.45s + var(--i) * .05s)}
@keyframes chIn{from{transform:translateY(110%) rotate(6deg)}}
.watch .circle{position:relative;animation:ring 2.6s ease-out infinite}
@keyframes ring{0%{box-shadow:0 0 0 0 rgba(0,0,0,.28)}80%,100%{box-shadow:0 0 0 16px rgba(0,0,0,0)}}
.feat .body,.feat .ph{transition:opacity .26s,transform .26s}
.feat.swap .body{opacity:0;transform:translateX(10px)}.feat.swap .ph{opacity:.4;transform:scale(.96)}
.feat .bar i{transition:none}
#prog{position:fixed;left:0;top:0;height:3px;width:100%;transform-origin:0 50%;transform:scaleX(0);background:var(--accent);z-index:30}
.mini{position:fixed;top:14px;left:50%;transform:translate(-50%,-140%);z-index:25;display:flex;align-items:center;gap:18px;padding:8px 8px 8px 12px;border-radius:999px;transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.mini.show{transform:translate(-50%,0)}
.mini .mlogo{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:var(--inverse);color:#fff;font-family:var(--serif);font-size:18px}
.mini nav{display:flex;gap:2px}.mini nav a{padding:8px 16px;border-radius:999px;font-size:13px;transition:background .25s,color .25s}
.mini nav a.on,.pill-nav a.on{background:var(--inverse);color:#fff}
.pill-nav a{transition:background .25s,color .25s}.pill-nav a:not(.on):hover,.mini nav a:not(.on):hover{background:rgba(0,0,0,.06)}
.mini{white-space:nowrap;background:rgba(255,255,255,.88)}
.mini .mcta{background:var(--accent);color:var(--on-accent);border-radius:999px;padding:10px 20px;font-size:13px;font-weight:500}
.marquee{background:var(--inverse);color:#fff;overflow:hidden;padding:20px 0;white-space:nowrap}
.marquee .track{display:inline-flex;gap:56px;animation:mq 38s linear infinite;padding-left:56px}
.marquee:hover .track{animation-play-state:paused}
.marquee span{display:inline-flex;align-items:center;gap:56px;font-size:13px;letter-spacing:.2em;text-transform:uppercase;opacity:.85}
.marquee span::after{content:"\\2726";color:var(--accent)}
@keyframes mq{to{transform:translateX(-50%)}}
.reveal .grid>*,.reveal .near>*,.reveal details,.reveal .vals>*{opacity:0;transform:translateY(34px) scale(.97);transition:opacity .8s cubic-bezier(.2,.7,.2,1),transform .8s cubic-bezier(.2,.7,.2,1);transition-delay:calc(var(--i,0) * 90ms)}
.reveal.in .grid>*,.reveal.in .near>*,.reveal.in details,.reveal.in .vals>*{opacity:1;transform:none}
.reveal.done .grid>*,.reveal.done .near>*{transition:transform .25s ease-out,box-shadow .3s,opacity .3s;transition-delay:0s}
.reveal h2,.reveal .kick,.reveal .lead{opacity:0;transform:translateY(22px);transition:opacity .8s,transform .8s}
.reveal.in h2,.reveal.in .kick,.reveal.in .lead{opacity:1;transform:none}.reveal.in h2{transition-delay:.1s}.reveal.in .lead{transition-delay:.2s}
.reveal{opacity:1;transform:none}
.card,.plan,.amen,.gal div{will-change:transform;transition:box-shadow .3s}
.card:hover,.amen:hover{box-shadow:0 24px 50px rgba(0,0,0,.12)}
.amen .ic{transition:transform .4s}.amen:hover .ic{transform:scale(1.3) rotate(-8deg)}
.proj .img{transition:transform .6s}.proj:hover .img{transform:scale(1.03)}
.gal div{transition:filter .4s}.gal div:hover{filter:saturate(1.3) brightness(1.05)}
.float a:first-child{position:relative}.float a:first-child::after{content:"";position:absolute;inset:0;border-radius:50%;border:2px solid #25d366;animation:pulse 2.2s ease-out infinite}
@keyframes pulse{from{transform:scale(1);opacity:.8}to{transform:scale(1.7);opacity:0}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}.reveal .grid>*,.reveal .near>*,.reveal details,.reveal h2,.reveal .kick,.reveal .lead{opacity:1!important;transform:none!important}}


/* ===== PREMIUM GLOSS ===== */
:root{--gold:linear-gradient(135deg,var(--accent-deep) 0%,var(--accent) 36%,var(--accent-light) 54%,var(--accent) 72%,var(--accent-deep) 100%);
 --ink:linear-gradient(160deg,var(--inverse-hi) 0%,var(--inverse) 58%,#000 135%);
 --shine:inset 0 1px 0 rgba(255,255,255,.34),inset 0 -2px 8px rgba(0,0,0,.38)}
::selection{background:var(--accent);color:var(--on-accent)}
.glass{position:relative;background:linear-gradient(145deg,rgba(255,255,255,.76),rgba(255,255,255,.34));box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 -1px 0 rgba(255,255,255,.25),0 16px 46px rgba(60,40,10,.15)}
.glass::before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(115deg,rgba(255,255,255,.6) 0%,rgba(255,255,255,0) 40%);pointer-events:none}
.mini.glass{position:fixed}
.glass>*{position:relative;z-index:1}
.stats.glass{background:linear-gradient(145deg,rgba(255,255,255,.9),rgba(255,255,255,.62))}
.stat b{background-image:linear-gradient(135deg,var(--accent-deep),var(--accent-dark) 50%,var(--accent))!important}
.btn.dark,.cta,.vision,.pill-nav a.on,.mini nav a.on,.chip.on,.rail a.on,.mini .mlogo,.logo b,.circle.dark,.menu nav a.on,.mini .mburger{background:var(--ink);box-shadow:var(--shine),0 8px 22px rgba(0,0,0,.28)}
.btn.dark,.cta,.mcta{position:relative;overflow:hidden}
.btn.dark::before,.cta::before,.mcta::before{content:"";position:absolute;left:0;right:0;top:0;height:50%;background:linear-gradient(180deg,rgba(255,255,255,.3),rgba(255,255,255,.04));border-radius:inherit;pointer-events:none}
.btn.dark::after,.cta::after,.mcta::after{content:"";position:absolute;top:0;bottom:0;width:38%;left:-60%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);transition:left .8s;pointer-events:none}
.btn.dark:hover::after,.cta:hover::after,.mcta:hover::after{left:130%}
.mini .mcta{background:var(--gold);color:var(--on-accent);box-shadow:inset 0 1px 0 rgba(255,255,255,.65),inset 0 -2px 6px rgba(0,0,0,.2),0 6px 16px rgba(0,0,0,.2)}
.circle:not(.dark){background:linear-gradient(180deg,#fff,#ebe6dc);box-shadow:inset 0 1px 0 #fff,0 4px 12px rgba(0,0,0,.18)}
.watch .circle{background:linear-gradient(180deg,rgba(255,255,255,.85),rgba(255,255,255,.4))}
.icon-btn.glass{box-shadow:inset 0 1px 0 #fff,0 8px 24px rgba(0,0,0,.12)}
.vision{background:radial-gradient(120% 90% at 100% 0%,rgba(255,255,255,.18),transparent 55%),var(--ink)}
.vision .dot,.rail .thumb{background:radial-gradient(circle at 32% 28%,#fff 0,var(--accent-light) 16%,var(--accent) 52%,var(--accent-deep) 100%);box-shadow:inset 0 -6px 10px rgba(0,0,0,.25),0 6px 16px rgba(0,0,0,.3)}
.marquee{background:linear-gradient(180deg,var(--inverse-hi),var(--inverse) 60%,#000);box-shadow:inset 0 1px 0 rgba(255,255,255,.2)}
.marquee span::after{background:var(--gold);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.dark-band{background:radial-gradient(90% 60% at 15% 0%,var(--inverse-hi),transparent 70%),radial-gradient(55% 45% at 100% 100%,rgba(255,255,255,.07),transparent),var(--inverse);box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 30px 80px rgba(0,0,0,.25)}
footer{background:radial-gradient(80% 100% at 10% 0%,var(--inverse-hi),var(--inverse))}
.kick,.stat b,.price,.plan .pr{background:var(--gold);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:goldmove 7s linear infinite}
.kick{font-weight:600}.stat b{font-weight:600}
@keyframes goldmove{to{background-position:-200% 0}}
h1 em .ch{background:var(--gold);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:chIn 1s cubic-bezier(.2,.8,.2,1) backwards,shine 5s linear infinite;animation-delay:calc(.45s + var(--i) * .05s),calc(var(--i) * -.35s)}
@keyframes shine{to{background-position:-300% 0}}
.card,.amen{background:linear-gradient(160deg,#fff,var(--surface));box-shadow:inset 0 1px 0 #fff,0 10px 30px rgba(60,40,10,.07)}
.plan{background:linear-gradient(160deg,rgba(255,255,255,.16),rgba(255,255,255,.03));box-shadow:inset 0 1px 0 rgba(255,255,255,.28)}
.proj .img::after,.feat .ph::after{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(120deg,rgba(255,255,255,.3),rgba(255,255,255,0) 42%);pointer-events:none}
.chip{background:linear-gradient(180deg,#fff,var(--surface));box-shadow:inset 0 1px 0 #fff}
input,select{background:linear-gradient(180deg,#fff,var(--surface));box-shadow:inset 0 1px 0 #fff}
input:focus,select:focus{outline:2px solid var(--accent);outline-offset:2px}
#prog{background:var(--gold)}
.float a:first-child{background:linear-gradient(180deg,#52e88d,#16a34a);box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 8px 24px rgba(0,0,0,.25)}
.float a+a{background:var(--ink);box-shadow:var(--shine),0 8px 24px rgba(0,0,0,.28)}
.logo{font-weight:500}
.heroimg{position:absolute;inset:0 0 0 26%;z-index:-1;-webkit-mask-image:linear-gradient(90deg,transparent,#000 40%);mask-image:linear-gradient(90deg,transparent,#000 40%);animation:kb 28s ease-in-out infinite alternate}
.hero-img{width:100%;height:100%;object-fit:cover;object-position:55% 50%}
@keyframes kb{to{transform:scale(1.06)}}
.feat .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.feat .ph span{z-index:1}
.proj .img,.gal div,.pic{background-size:cover;background-position:center}
.gal div span{background:rgba(0,0,0,.35);backdrop-filter:blur(6px);padding:5px 12px;border-radius:999px}
.pic{height:460px;border-radius:32px}
.map{overflow:hidden;padding:0}.map iframe{width:100%;height:100%;border:0;filter:sepia(.3) saturate(.8)}
.plan .box{color:#fff;border:1px solid rgba(255,255,255,.2);opacity:1;font-size:0}.plan .box svg{padding:8px}
.tags{background:rgba(255,255,255,.62);backdrop-filter:blur(12px);padding:10px 16px;border-radius:16px;border:1px solid var(--glass-line)}
.hl-m,.burger,.mini .mburger,.menu{display:none}
.hl-m{flex-wrap:wrap;gap:8px;margin-top:22px}.hl-m span{font-size:11px;border:1px solid var(--border);border-radius:999px;padding:6px 12px;background:rgba(255,255,255,.55)}
html,body{overflow-x:hidden;-webkit-text-size-adjust:100%}
.menu{position:fixed;inset:0;z-index:40;flex-direction:column;justify-content:center;align-items:center;gap:30px;background:rgba(253,252,249,.97);backdrop-filter:blur(20px);opacity:0;pointer-events:none;transition:opacity .35s;padding:30px}
.menu.open{display:flex;opacity:1;pointer-events:auto}
.menu nav{display:flex;flex-direction:column;align-items:center;gap:4px}.menu nav a{font-family:var(--serif);font-weight:500;font-size:32px;padding:4px 22px;border-radius:999px}.menu nav a.on{background:var(--inverse);color:#fff}
.mclose{position:absolute;top:18px;right:18px}
.grid.g3{grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr))}

@media(max-width:1100px){
  .mini nav{display:none}
  .burger{display:grid}.mini .mburger{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;border:0;background:var(--inverse);color:#fff;cursor:pointer}
  .menu{display:flex}
  .hero{padding:18px 20px 26px;gap:14px}
  .heroimg{inset:0 0 auto 0;height:50svh;-webkit-mask-image:linear-gradient(180deg,#000 45%,transparent);mask-image:linear-gradient(180deg,#000 45%,transparent)}
  .hero::after{background:linear-gradient(180deg,${c.background}00 0%,${c.background}00 28%,${c.background}f2 50%,${c.background} 100%)}
  .mid{padding-top:33svh}.copy{max-width:none}.sub{max-width:520px}
  .hl-m{display:flex}
  .dock{margin:0;grid-template-columns:1fr 1fr}.feat{grid-column:1/-1}
  section.s{padding:84px 28px}
}
@media(max-width:760px){
  .hero{padding:14px 16px 22px}
  .top-r .srch,.logo span{display:none}
  .cta{padding:5px 5px 5px 20px;font-size:13px}
  h1{font-size:clamp(44px,14.5vw,72px)}
  .eyebrow{font-size:10px;letter-spacing:.22em;margin-bottom:14px}
  .sub{font-size:14px;margin:18px 0 22px}
  .btn{padding:13px 20px}.actions{gap:16px}
  .dock{grid-template-columns:1fr;gap:12px}
  .feat{border-radius:26px;gap:14px;padding:12px}.feat .ph{width:110px;height:110px;border-radius:18px}.feat h3{font-size:22px}.feat p{margin:6px 0 8px}
  .stats{padding:18px 2px;border-radius:26px}.stat{padding:0 12px}.stat b{font-size:22px}
  .vision{flex-direction:row;align-items:center;border-radius:26px;padding:18px 70px 18px 18px}.vision .dot{display:none}.vision h4{margin:0 0 4px;font-size:17px}.vision .circle{top:50%;margin-top:-20px}
  section.s{padding:68px 20px}
  h2{font-size:clamp(28px,8vw,40px)}.lead{margin-bottom:30px}
  .dark-band{margin:0 8px;border-radius:32px}
  .two{grid-template-columns:1fr;gap:30px}
  .gal{grid-template-columns:1fr 1fr;gap:12px}.gal div:nth-child(n){height:170px;grid-row:auto;padding:10px;font-size:11px}
  .map,.pic{height:300px;border-radius:26px}
  .chips{flex-wrap:nowrap;overflow-x:auto;padding-bottom:8px;margin-right:-20px;-webkit-overflow-scrolling:touch;scrollbar-width:none}.chip{flex:none}
  .card{padding:20px;border-radius:24px}.plan{padding:22px;border-radius:24px}.plan h3{font-size:24px}
  .quote{font-size:17px}summary{font-size:17px}
  input,select{font-size:16px;padding:15px 18px}
  .marquee{padding:14px 0}.marquee span{font-size:11px;gap:36px}.marquee .track{gap:36px}
  footer{padding:48px 20px 96px;margin-top:70px}footer .cols{flex-direction:column;gap:22px}
  .float{right:12px;bottom:12px}.float a{width:46px;height:46px}
  .menu nav a{font-size:28px}
  .mini{max-width:calc(100% - 20px);gap:10px}.mini .mcta{padding:9px 14px;font-size:12px}
}
@media(max-width:420px){.cta .lbl{display:none}.cta{padding:5px}.stat span{font-size:11px}}
`;

const projectData = JSON.stringify(projects.map((p) => ({ name: p.name, loc: p.location, type: p.type, status: p.status, price: p.priceFrom, cfg: p.configurations.join(" · "), img: p.image })));

const html = `<!DOCTYPE html>
<html lang="${esc(site.meta.language)}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(site.seo.title)}</title><meta name="description" content="${esc(site.seo.description)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
<style>${css}</style></head><body>

<div id="prog"></div>
<div class="mini glass" id="mini"><b class="mlogo">${esc(site.brand.name[0])}</b><nav>${nav}</nav><a class="mcta" href="${esc(site.navigation.cta.href)}">${esc(site.navigation.cta.label)}</a><button class="mburger" aria-label="Open menu">${svg("menu")}</button></div>
<div class="menu" id="menu" aria-hidden="true"><button class="mclose icon-btn glass" id="mclose" aria-label="Close menu">${svg("close")}</button><nav>${nav}</nav><a class="btn dark" href="${esc(site.navigation.cta.href)}">${esc(site.navigation.cta.label)} ${svg("arrow")}</a></div>
<header class="hero">
  <div class="heroimg"><img class="scene hero-img" src="${esc(S.hero.image)}" alt="" fetchpriority="high"></div><div class="glow" id="glow"></div>
  <div class="top rise" style="--d:.05">
    <a class="logo" href="#"><b>${esc(site.brand.name[0])}</b><span>${esc(site.brand.name)}</span></a>
    <nav class="pill-nav glass">${nav}</nav>
    <div class="top-r">
      <a class="icon-btn glass srch" href="#projects" aria-label="Search">${svg("search")}</a>
      <a class="cta" href="${esc(site.navigation.cta.href)}"><span class="lbl">${esc(site.navigation.cta.label)}</span><span class="circle">${svg("arrow")}</span></a>
      <button class="icon-btn glass burger" id="burger" aria-label="Open menu" aria-expanded="false">${svg("menu")}</button>
    </div>
  </div>

  <div class="mid">
    <aside class="rail glass rise" style="--d:.3">
      <a class="on" href="#" aria-label="Home">${svg("home")}</a>
      <a href="#projects" aria-label="Projects">${svg("grid")}</a>
      <a href="#plans" aria-label="Floor plans">${svg("plan")}</a>
      <a href="#testimonials" aria-label="Wishlist">${svg("heart")}</a>
      <a href="#contact" aria-label="Chat">${svg("chat")}</a>
      <i class="thumb"></i><small>Watch<br>Walkthrough</small>
    </aside>
    <div class="copy">
      <p class="eyebrow rise" style="--d:.35">${esc(S.hero.eyebrow)}</p>
      <h1>${headline}</h1>
      <p class="sub rise" style="--d:1.0">${esc(S.hero.subheadline)}</p>
      <div class="actions rise" style="--d:1.1">
        <a class="btn dark" href="${esc(S.hero.primaryCta.href)}">${esc(S.hero.primaryCta.label)} ${svg("arrow")}</a>
        <a class="watch" href="${esc(S.gallery.walkthrough.video)}"><span class="circle">${svg("play")}</span>Watch Walkthrough</a>
      </div>
    </div>
    <div class="hl-m">${S.hero.highlights.map((h) => `<span>${esc(h)}</span>`).join("")}</div>
    <div class="tags rise" style="--d:1.2">${S.hero.highlights.map(esc).join("<br>")}</div>
  </div>

  <div class="dock">
    <div class="feat glass rise" style="--d:1.15" id="feat">
      <div class="ph"><img id="fImg" src="${esc(projects[0].image)}" alt=""><span>Featured project</span></div>
      <div class="body">
        <div class="row"><h3 id="fName"></h3><span class="count" id="fCount"></span></div>
        <p id="fDesc"></p>
        <a class="more" href="#projects">View Project ${svg("arrow")}</a>
        <div class="ctrl"><div class="bar"><i id="fBar"></i></div>
          <button class="circle" id="prev" aria-label="Previous">${svg("left")}</button>
          <button class="circle dark" id="next" aria-label="Next">${svg("arrow")}</button></div>
      </div>
    </div>
    <div class="stats glass rise" style="--d:1.25">
      ${S.stats.slice(0, 3).map((s, i) => `<div class="stat">${svg(statIcons[i])}<b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("")}
    </div>
    <a class="vision rise" style="--d:1.35" href="#contact">
      <div class="dot"></div>
      <div><h4>${esc(S.contact.title)}</h4><p>${esc(S.contact.subtitle)}</p></div>
      <span class="circle">${svg("arrowUR")}</span>
    </a>
  </div>
</header>
<div class="marquee"><div class="track">${marq}${marq}</div></div>

<main>
<section class="s reveal" id="projects">
  <p class="kick">Projects</p><h2>${esc(S.projects.title)}</h2><p class="lead">${esc(S.projects.intro)}</p>
  <div class="chips">${S.projects.filters.map((f, i) => `<button class="chip${i ? "" : " on"}" data-f="${esc(f)}">${esc(f)}</button>`).join("")}</div>
  <div class="grid g3">${projects.map((p) => `
    <article class="card proj" data-s="${esc(p.status)}"><div class="img" style="background-image:url('${esc(p.image)}')"><span class="st">${esc(p.status)}</span></div>
      <h3>${esc(p.name)}</h3><p class="meta">${esc(p.location)} · ${esc(p.type)}</p>
      <p class="meta">${esc(p.configurations.join(" · "))} · ${esc(p.possession)}</p>
      <p class="price">${esc(p.priceFrom)}</p><p class="meta">RERA ${esc(p.rera)}</p></article>`).join("")}
  </div>
</section>

<section class="s reveal" id="amenities">
  <p class="kick">Amenities</p><h2>${esc(S.amenities.title)}</h2><p class="lead">${esc(S.amenities.intro)}</p>
  <div class="grid g3">${S.amenities.items.map((a) => `<div class="amen">${svg("check")}<span>${esc(a.label)}</span></div>`).join("")}</div>
</section>

<div class="dark-band"><section class="s reveal" id="plans">
  <p class="kick">Floor Plans</p><h2>${esc(S.floorPlans.title)}</h2><p class="lead">${esc(S.floorPlans.intro)}</p>
  <div class="grid g3">${S.floorPlans.plans.map((p, i) => `<div class="plan"><h3>${esc(p.type)}</h3><p class="meta" style="color:rgba(255,255,255,.6)">Carpet ${esc(p.carpetArea)}</p><div class="box">${planSvg(i)}</div><p class="pr">${esc(p.price)}</p></div>`).join("")}</div>
  <p style="margin-top:36px"><a class="btn" style="background:#fff;color:#111" href="${esc(S.floorPlans.cta.href)}">${esc(S.floorPlans.cta.label)} ${svg("arrow")}</a></p>
</section></div>

<section class="s reveal two" id="location">
  <div><p class="kick">Location</p><h2>${esc(S.location.title)}</h2><p class="lead" style="margin-bottom:20px">${esc(S.location.address)}</p>
    <div class="near">${S.location.nearby.map((n) => `<div><span>${esc(n.place)}</span><b>${esc(n.time)}</b></div>`).join("")}</div></div>
  <div class="map"><iframe title="Map" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${S.location.map.lng - 0.014}%2C${S.location.map.lat - 0.009}%2C${S.location.map.lng + 0.014}%2C${S.location.map.lat + 0.009}&layer=mapnik&marker=${S.location.map.lat}%2C${S.location.map.lng}"></iframe></div>
</section>

<section class="s reveal">
  <p class="kick">Gallery</p><h2>${esc(S.gallery.title)}</h2>
  <div class="grid gal">${S.gallery.images.map((g) => `<div style="background-image:url('${esc(g.src)}')"><span>${esc(g.alt)}</span></div>`).join("")}</div>
</section>

<section class="s reveal two" id="about">
  <div><p class="kick">About</p><h2>${esc(S.about.title)}</h2><p class="lead" style="margin-bottom:0">${esc(S.about.body)}</p>
    <div class="vals">${S.about.values.map((v) => `<div><b>${esc(v.title)}</b><span class="meta">${esc(v.text)}</span></div>`).join("")}</div>
    <div class="badges">${S.about.trust.map((t) => `<span>${svg("check")}${esc(t)}</span>`).join("")}</div></div>
  <div class="pic" style="background-image:url('${esc(S.about.image)}')" role="img" aria-label="Pool deck"></div>
</section>

<section class="s reveal" id="testimonials">
  <p class="kick">Testimonials</p><h2>${esc(S.testimonials.title)}</h2>
  <div class="grid g3" style="margin-top:36px">${S.testimonials.items.map((t) => `<div class="card"><div class="stars">${svg("star").repeat(t.rating)}</div><p class="quote">“${esc(t.quote)}”</p><p class="meta"><b>${esc(t.name)}</b> · ${esc(t.project)}</p></div>`).join("")}</div>
</section>

<section class="s reveal" id="faq">
  <p class="kick">FAQ</p><h2>${esc(S.faq.title)}</h2>
  ${S.faq.items.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}
</section>

<section class="s reveal two" id="contact">
  <div><p class="kick">Contact</p><h2>${esc(S.contact.title)}</h2><p class="lead">${esc(S.contact.subtitle)}</p>
    <p class="meta">${esc(S.contact.details.salesOffice)}<br>${esc(S.contact.details.phone)} · ${esc(S.contact.details.email)}<br>${esc(S.contact.details.hours)}</p></div>
  <form action="${esc(S.contact.form.action)}" method="${esc(S.contact.form.method)}" onsubmit="event.preventDefault();this.innerHTML='<h3 style=&quot;font-family:var(--serif);font-size:32px&quot;>${esc(S.contact.form.successMessage)}</h3>'">
    ${S.contact.form.fields.map((f) => f.type === "select"
      ? `<select name="${f.name}"${f.required ? " required" : ""}><option value="">${esc(f.label)}</option>${f.options.map((o) => `<option>${esc(o)}</option>`).join("")}</select>`
      : `<input name="${f.name}" type="${f.type}" placeholder="${esc(f.label)}"${f.required ? " required" : ""}${f.pattern ? ` pattern="${esc(f.pattern)}"` : ""}>`).join("")}
    <p class="consent">${esc(S.contact.form.consent)}</p>
    <button class="btn dark" type="submit" style="justify-self:start">${esc(S.contact.form.submitLabel)} ${svg("arrow")}</button>
  </form>
</section>
</main>

<footer><div class="cols"><div><b style="font-family:var(--serif);font-size:28px;font-weight:500">${esc(site.brand.name)}</b><p style="opacity:.6;margin-top:8px">${esc(S.footer.about)}</p></div>
  <div>${S.footer.links.map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join("")}</div></div>
  <small>${esc(S.footer.disclaimer)}<br>${esc(S.footer.copyright)}</small></footer>

<div class="float">${site.floatingActions.map((a) => `<a href="${esc(a.href)}" aria-label="${esc(a.label)}">${svg(a.type === "call" ? "phone" : "chat")}</a>`).join("")}</div>

<script>
const P=${projectData};
const $=(id)=>document.getElementById(id), pad=(n)=>String(n).padStart(2,"0");
const RM=matchMedia("(prefers-reduced-motion:reduce)").matches, TOUCH=matchMedia("(hover:none)").matches;
const hero=document.querySelector(".hero");

/* headline: split into letters that rise in */
(function(){const h=document.querySelector("h1");let n=0;
 function walk(node){[].slice.call(node.childNodes).forEach(function(c){
  if(c.nodeType===3){const f=document.createDocumentFragment();
   c.textContent.split(/( +)/).forEach(function(t){if(!t)return;
    if(/^ +$/.test(t)){f.appendChild(document.createTextNode(" "));return}
    const w=document.createElement("span");w.className="w";
    Array.from(t).forEach(function(ch){const s=document.createElement("span");s.className="ch";s.style.setProperty("--i",n++);s.textContent=ch;w.appendChild(s)});
    f.appendChild(w)});c.replaceWith(f)}
  else if(c.nodeType===1&&c.tagName!=="BR")walk(c)})}
 walk(h)})();

/* featured project: auto-play with timer bar, pause on hover */
const feat=$("feat");let cur=0,t0=performance.now(),DUR=5200,hoverAt=0;
function fill(k){const p=P[k];$("fName").textContent=p.name;$("fCount").textContent=pad(k+1)+" / "+pad(P.length);
 $("fDesc").textContent=p.loc+" · "+p.cfg+" · from "+p.price;$("fImg").src=p.img}
function go(k){cur=(k+P.length)%P.length;feat.classList.add("swap");setTimeout(function(){fill(cur);feat.classList.remove("swap")},260);t0=performance.now()}
fill(0);
$("prev").onclick=function(){go(cur-1)};$("next").onclick=function(){go(cur+1)};
feat.addEventListener("mouseenter",function(){hoverAt=performance.now()});
feat.addEventListener("mouseleave",function(){t0+=performance.now()-hoverAt;hoverAt=0});

/* count-up stats */
document.querySelectorAll(".stat b").forEach(function(el){
 const m=el.textContent.match(/^([0-9.,]+)(.*)$/);if(!m||RM)return;
 const end=parseFloat(m[1].replace(/,/g,"")),dec=(m[1].split(".")[1]||"").length,comma=m[1].indexOf(",")>-1,suf=m[2];
 el.textContent="0"+suf;
 setTimeout(function(){const s=performance.now();(function tick(now){const k=Math.min(1,(now-s)/1800),e=1-Math.pow(1-k,4),v=end*e;
  el.textContent=(comma?Math.round(v).toLocaleString("en-IN"):v.toFixed(dec))+suf;if(k<1)requestAnimationFrame(tick)})(s)},1500)});

/* pointer: scene parallax layers, glow, magnetic buttons, card tilt */
const layers=[].slice.call(document.querySelectorAll(".layer")),scene=document.querySelector(".scene"),glow=$("glow");
let tx=0,ty=0,cx=0,cy=0,gx=0,gy=0,gtx=0,gty=0,sy=0;
hero.addEventListener("mousemove",function(e){const r=hero.getBoundingClientRect();
 tx=(e.clientX-r.left)/r.width-.5;ty=(e.clientY-r.top)/r.height-.5;gtx=e.clientX-r.left;gty=e.clientY-r.top});
hero.addEventListener("mouseleave",function(){tx=0;ty=0});
if(!TOUCH&&!RM){
 document.querySelectorAll(".btn,.cta,.circle,.icon-btn,.mcta").forEach(function(el){
  el.addEventListener("mousemove",function(e){const r=el.getBoundingClientRect();
   el.style.transform="translate("+((e.clientX-r.left-r.width/2)*.28)+"px,"+((e.clientY-r.top-r.height/2)*.28)+"px)"});
  el.addEventListener("mouseleave",function(){el.style.transform=""})});
 document.querySelectorAll(".card,.plan,.amen,.gal div").forEach(function(el){
  el.addEventListener("mousemove",function(e){const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
   el.style.transform="perspective(800px) rotateY("+(x*9)+"deg) rotateX("+(-y*9)+"deg) translateY(-4px)"});
  el.addEventListener("mouseleave",function(){el.style.transform=""})});
}
function frame(now){
 if(!hoverAt){const k=(now-t0)/DUR;$("fBar").style.width=Math.min(100,k*100)+"%";if(k>=1)go(cur+1)}
 if(!RM){cx+=(tx-cx)*.07;cy+=(ty-cy)*.07;gx+=(gtx-gx)*.12;gy+=(gty-gy)*.12;
  layers.forEach(function(l){const d=parseFloat(l.dataset.d);l.style.transform="translate("+(-cx*d*2)+"px,"+(-cy*d)+"px)"});
  scene.style.transform="translate3d(0,"+(sy*.22)+"px,0) scale(1.08)";
  glow.style.transform="translate("+gx+"px,"+gy+"px)"}
 requestAnimationFrame(frame)}
requestAnimationFrame(frame);

/* scroll: progress bar, mini nav, active links */
const mini=$("mini"),prog=$("prog"),links=document.querySelectorAll(".pill-nav a,.mini nav a,.rail a,.menu nav a"),
 ids=["projects","amenities","plans","location","about","testimonials","faq","contact"];
function onScroll(){sy=window.scrollY;const max=document.documentElement.scrollHeight-innerHeight;
 prog.style.transform="scaleX("+(max>0?sy/max:0)+")";mini.classList.toggle("show",sy>hero.offsetHeight*.7);
 let active="#";ids.forEach(function(id){const el=$(id);if(el&&el.getBoundingClientRect().top<innerHeight*.4)active="#"+id});
 links.forEach(function(a){a.classList.toggle("on",a.getAttribute("href")===active)})}
addEventListener("scroll",onScroll,{passive:true});onScroll();

/* project filters */
document.querySelectorAll(".chip").forEach(function(b){b.onclick=function(){
 document.querySelectorAll(".chip").forEach(function(x){x.classList.remove("on")});b.classList.add("on");
 document.querySelectorAll(".proj").forEach(function(c){c.style.display=(b.dataset.f==="All"||c.dataset.s===b.dataset.f)?"":"none"})}});

/* scroll reveal with stagger */
document.querySelectorAll(".reveal").forEach(function(sec){
 sec.querySelectorAll(".grid>*,.near>*,details,.vals>*").forEach(function(el,k){el.style.setProperty("--i",k)})});
const io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add("in");
 setTimeout(function(){x.target.classList.add("done")},1800);io.unobserve(x.target)}})},{threshold:.12});
document.querySelectorAll(".reveal").forEach(function(el){io.observe(el)});

/* mobile menu */
const menu=$("menu");
function setMenu(o){menu.classList.toggle("open",o);menu.setAttribute("aria-hidden",String(!o));$("burger").setAttribute("aria-expanded",String(o));document.body.style.overflow=o?"hidden":""}
$("burger").onclick=function(){setMenu(true)};document.querySelector(".mburger").onclick=function(){setMenu(true)};$("mclose").onclick=function(){setMenu(false)};
menu.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){setMenu(false)})});
addEventListener("keydown",function(e){if(e.key==="Escape")setMenu(false)});
</script></body></html>`;

fs.writeFileSync(path.join(__dirname, "index.html"), html);
console.log("index.html built from base " + base);
