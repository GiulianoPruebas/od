/* ======================================================
   Editá acá los textos. Todo lo demás se arma solo.
   ====================================================== */
const CONFIG = {
  name: "Juli",
  from: "Giuliano",

  /* ¿Cómo te llega el mensaje que deje?  Elegí UNA opción:
     1) endpoint (recomendado): creá un formulario gratis en https://formspree.io,
        copiá la URL que te dan (algo como https://formspree.io/f/abcdwxyz) y pegala acá.
        Cada mensaje te llega por mail y queda guardado en tu panel de Formspree.
     2) email: si no usás endpoint, se abre su app de correo con el mensaje listo para enviarte.
     Si dejás las dos vacías, el mensaje solo queda en el dispositivo de ella (modo prueba). */
  endpoint: "",
  email: "",

  powers: [
    { label: "Que la batería del celu nunca se acabe",  reply: "Concedido. 100% hasta el próximo cumple. Cargador no incluido." },
    { label: "Teletransportarme a la heladería",        reply: "Concedido. Se activa los viernes a la tarde. El helado lo ponés vos." },
    { label: "Que los lunes no existan",                reply: "Denegado por el sindicato de lunes. Pero te los hacemos más suaves." },
    { label: "Que el wifi siempre funcione",            reply: "Concedido. Excepto cuando más lo necesites: eso es ley universal." }
  ],
  coupon: {
    title: "Cupón de cumpleaños",
    prize: "Vale por 1 abrazo gigante",
    fine:  "Sin vencimiento. Canjeable cuando quieras. No acumulable con otros abrazos."
  },
  wishes: [
    "Que tengas un año lleno de buena onda.",
    "Que te sobren las risas y los planes lindos.",
    "Que todo lo que te propongas salga mejor de lo que pensaste.",
    "Que siempre tengas gente linda cerca (yo incluido, obvio).",
    "Que hoy no pienses en nada más que en pasarla bien."
  ],
  letter: [
    "Espero que te guste mi aporte para tu cumple. Lo hice con mucha onda (y con un poco de código, no podía faltar).",
    "Quiero que hoy la pases increíble: que te rías mucho, comas rico y estés con la gente que más querés.",
    "Que este año nuevo te traiga todo lo bueno que te merecés. ¡Que tengas un cumpleaños hermoso!"
  ],
  sign: "Un abrazo, "
};

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const COLORS = ["--pink", "--yellow", "--mint", "--orange"];
document.title = "Feliz cumple, " + CONFIG.name;

/* ---------- sound ---------- */
let audio = null, soundOn = true;
function ac() {
  if (!audio) { const A = window.AudioContext || window.webkitAudioContext; if (A) audio = new A(); }
  if (audio && audio.state === "suspended") audio.resume();
  return audio;
}
function tone(freq, dur = 0.12, type = "sine", vol = 0.08, when = 0, slideTo) {
  if (!soundOn) return;
  try {
    const a = ac(); if (!a) return;
    const t = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.03);
  } catch (e) {}
}
const sfx = {
  pop()   { tone(560, .12, "triangle", .12, 0, 120); },
  tick()  { tone(660, .06, "square", .035); },
  ok()    { tone(523, .1, "triangle", .07); tone(659, .12, "triangle", .07, .08); },
  tada()  { [523, 659, 784, 1047].forEach((f, i) => tone(f, .24, "triangle", .08, i * .09)); },
  whoosh(){ tone(300, .3, "sawtooth", .03, 0, 1000); },
  jump(i) { tone(380 + i * 110, .12, "sine", .08, 0, 800 + i * 90); }
};
$("#sound").addEventListener("click", e => {
  soundOn = !soundOn;
  e.currentTarget.setAttribute("aria-pressed", String(soundOn));
  e.currentTarget.setAttribute("aria-label", soundOn ? "Sonido activado" : "Sonido apagado");
  e.currentTarget.firstElementChild.textContent = soundOn ? "🔊" : "🔇";
  if (soundOn) sfx.ok();
});

/* ---------- confetti ---------- */
const fx = $("#fx"), ctx = fx.getContext("2d");
let W = 0, H = 0, parts = [], raf = 0, lastT = 0, rainUntil = 0;
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  fx.width = W * dpr; fx.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", resize); resize();

function palette() {
  const cs = getComputedStyle(document.documentElement);
  return { cols: ["--pink", "--yellow", "--mint", "--blue", "--orange"].map(v => cs.getPropertyValue(v).trim()), ink: cs.getPropertyValue("--line").trim() };
}
function burst(x, y, n = 50, o = {}) {
  n = reduce ? Math.ceil(n / 3) : n;
  const { cols } = palette();
  const ang = o.angle ?? -Math.PI / 2, spr = o.spread ?? Math.PI * 2, pw = o.power ?? 9;
  for (let i = 0; i < n; i++) {
    const a = ang + (Math.random() - .5) * spr, s = pw * (.4 + Math.random() * .8);
    parts.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      w: 6 + Math.random() * 7, h: 4 + Math.random() * 6,
      rot: Math.random() * 6.28, vr: (Math.random() - .5) * .35,
      tilt: Math.random() * 6.28, vt: .1 + Math.random() * .2,
      color: cols[i % cols.length], shape: Math.random() < .3 ? 1 : 0,
      life: 90 + Math.random() * 50
    });
  }
  kick();
}
function burstAt(el, n, o) {
  const r = el.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, n, o);
}
function rain(ms = 3800) {
  if (reduce) { burst(W / 2, H * .3, 60); return; }
  rainUntil = performance.now() + ms; kick();
}
function kick() { if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(frame); } }
function frame(t) {
  const dt = Math.min(3, (t - lastT) / 16.67); lastT = t;
  ctx.clearRect(0, 0, W, H);
  if (t < rainUntil) {
    const { cols } = palette();
    for (let i = 0; i < 3; i++) parts.push({
      x: Math.random() * W, y: -12, vx: (Math.random() - .5) * 2, vy: 2 + Math.random() * 3,
      w: 6 + Math.random() * 7, h: 4 + Math.random() * 6, rot: Math.random() * 6.28, vr: (Math.random() - .5) * .3,
      tilt: Math.random() * 6.28, vt: .1 + Math.random() * .2, color: cols[(Math.random() * cols.length) | 0],
      shape: Math.random() < .3 ? 1 : 0, life: 400
    });
  }
  const { ink } = palette();
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.vy += .28 * dt; p.vx *= Math.pow(.985, dt); p.vy *= Math.pow(.993, dt);
    p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.tilt += p.vt * dt; p.life -= dt;
    if (p.life <= 0 || p.y > H + 30) { parts.splice(i, 1); continue; }
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.tilt));
    ctx.globalAlpha = Math.min(1, p.life / 25);
    ctx.fillStyle = p.color; ctx.strokeStyle = ink; ctx.lineWidth = 1.5;
    if (p.shape === 0) { ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h); }
    else { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
  if (parts.length || t < rainUntil) raf = requestAnimationFrame(frame); else { raf = 0; ctx.clearRect(0, 0, W, H); }
}

/* ---------- scene manager ---------- */
const scenes = [...document.querySelectorAll(".scene")];
const progress = $("#progress");
scenes.forEach(() => { const s = document.createElement("span"); s.className = "pip"; progress.append(s); });
let cur = -1, busy = false;

function updateProgress() {
  [...progress.children].forEach((p, i) => { p.classList.toggle("done", i < cur); p.classList.toggle("now", i === cur); });
  $("#stepLabel").textContent = "Paso " + (cur + 1) + " de " + scenes.length;
}
function show(i) {
  if (busy) return; busy = true;
  const prev = scenes[cur], next = scenes[i];
  const enter = () => {
    if (prev) { prev.hidden = true; prev.classList.remove("exit"); }
    next.hidden = false; next.classList.add("enter");
    cur = i; updateProgress(); window.scrollTo(0, 0);
    hooks[i]();
    if (i > 0) { const h = next.querySelector("h2"); if (h) h.focus({ preventScroll: true }); }
    setTimeout(() => { next.classList.remove("enter"); busy = false; }, reduce ? 0 : 480);
  };
  if (prev) { prev.classList.add("exit"); setTimeout(enter, reduce ? 0 : 260); } else enter();
}

/* ---------- 0 · gift ---------- */
let dodges = 0;
const openBtn = $("#openBtn"), zone = $(".zone");
const dodgeLabels = ["Abrir regalo", "¡Ey, casi!", "Muy lento…", "Ok, me rindo. Abrime"];
function buildHero() {
  $("#t0").textContent = "Feliz cumple, " + CONFIG.name;
  dodges = 0; openBtn.style.setProperty("--dx", "0px"); openBtn.style.setProperty("--dy", "0px");
  openBtn.textContent = dodgeLabels[0];
  $("#lead0").textContent = "Hay un regalo para vos. Abrilo, si lográs atraparlo.";
  const t = $("#tiles"); t.innerHTML = "";
  const rots = [-5, 4, -3, 6], tapped = new Set();
  const letters = [...CONFIG.name].filter(ch => ch.trim());
  letters.forEach((ch, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "tile"; b.textContent = ch;
    b.setAttribute("aria-label", "Letra " + ch);
    b.style.cssText = "--c:var(" + COLORS[i % 4] + ");--r:" + rots[i % 4] + "deg;--i:" + i;
    b.addEventListener("animationend", () => { b.style.animation = "none"; });
    b.addEventListener("click", () => {
      const r = rots[i % 4];
      b.animate([
        { transform: "rotate(" + r + "deg) translateY(0)" },
        { transform: "rotate(" + (-r * 2) + "deg) translateY(-34px) scale(1.12)", offset: .45 },
        { transform: "rotate(" + r + "deg) translateY(0)" }
      ], { duration: reduce ? 1 : 520, easing: "cubic-bezier(.3,1.4,.5,1)" });
      burstAt(b, 26, { spread: 2.2, power: 8 }); sfx.jump(i);
      tapped.add(i);
      if (tapped.size === letters.length) $("#lead0").textContent = "Ya tocaste todas las letras. Ahora sí: abrí el regalo.";
    });
    t.append(b);
  });
}
function dodge(e) {
  if (dodges >= 3) return;
  if (e.type === "pointerenter" && e.pointerType !== "mouse") return;
  dodges++; sfx.tick();
  if (dodges < 3) {
    const mx = (zone.clientWidth - openBtn.offsetWidth) / 2, my = (zone.clientHeight - openBtn.offsetHeight) / 2;
    const prevX = parseFloat(openBtn.style.getPropertyValue("--dx")) || 0;
    const sign = prevX > 0 ? -1 : 1;
    const dx = sign * (.55 + Math.random() * .45) * Math.max(mx, 0);
    const dy = (Math.random() * 2 - 1) * Math.max(my, 0);
    openBtn.style.setProperty("--dx", dx.toFixed(0) + "px"); openBtn.style.setProperty("--dy", dy.toFixed(0) + "px");
  } else {
    openBtn.style.setProperty("--dx", "0px"); openBtn.style.setProperty("--dy", "0px");
  }
  openBtn.textContent = dodgeLabels[dodges];
}
openBtn.addEventListener("pointerenter", dodge);
openBtn.addEventListener("pointerdown", dodge);
openBtn.addEventListener("click", e => {
  if (e.detail !== 0 && dodges < 3) return;
  burstAt(openBtn, 90, { spread: 2.6, power: 12 }); sfx.whoosh(); setTimeout(sfx.tada, 200);
  show(1);
});

/* ---------- 1 · cake ---------- */
const cake = $("#cake"), blowBtn = $("#blow"), blowLbl = $("#blowLbl"), cakeNext = $("#cakeNext");
let holding = false, meter = 0, blown = false, rafB = 0, lastB = 0;
function buildCake() {
  const xs = [100, 125, 150, 175, 200], cols = ["--mint", "--blue", "--pink", "--orange", "--mint"];
  $("#candles").innerHTML = xs.map((x, i) => (
    '<rect x="' + (x - 5) + '" y="66" width="10" height="32" rx="3" fill="var(' + cols[i] + ')" stroke="var(--line)" stroke-width="3"/>' +
    '<g transform="translate(' + x + ' 58)"><g class="lean"><g class="flame" style="--d:' + (i * .13).toFixed(2) + 's">' +
      '<path d="M0 -20 C9 -8 9 4 0 8 C-9 4 -9 -8 0 -20Z" fill="var(--orange)" stroke="var(--line)" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M0 -8 C4 -3 4 2 0 5 C-4 2 -4 -3 0 -8Z" fill="var(--yellow)"/>' +
    '</g></g></g>' +
    '<circle class="puff" cx="' + x + '" cy="52" r="6" fill="var(--soft)" style="--d:' + (i * .12).toFixed(2) + 's"/>'
  )).join("");
  cake.classList.remove("out"); meter = 0; blown = false; holding = false; setBlow(0);
  blowBtn.hidden = false; cakeNext.hidden = true; blowLbl.textContent = "Mantené para soplar";
  $("#cakeCap").textContent = "";
}
function setBlow(m) {
  cake.style.setProperty("--blow", m.toFixed(3));
  $(".fill", blowBtn).style.transform = "scaleX(" + m.toFixed(3) + ")";
}
function blowLoop(t) {
  const dt = Math.min(t - lastB, 50); lastB = t;
  meter += holding ? dt / 1300 : -dt / 700;
  meter = Math.max(0, Math.min(1, meter)); setBlow(meter);
  if (meter >= 1 && !blown) { blowOut(); rafB = 0; return; }
  rafB = (meter > 0 || holding) ? requestAnimationFrame(blowLoop) : 0;
}
function startHold() {
  if (blown) return;
  holding = true; blowLbl.textContent = "Soplando…";
  if (!rafB) { lastB = performance.now(); rafB = requestAnimationFrame(blowLoop); }
}
function endHold() { holding = false; if (!blown) blowLbl.textContent = "Mantené para soplar"; }
function blowOut() {
  blown = true; holding = false; setBlow(1);
  cake.classList.add("out");
  sfx.whoosh(); setTimeout(sfx.tada, 350);
  burstAt(cake, 100, { spread: 2.4, power: 13 });
  $("#cakeCap").textContent = "Listo. Pedí un deseo… y no lo cuentes.";
  blowBtn.hidden = true; cakeNext.hidden = false; cakeNext.focus({ preventScroll: true });
}
blowBtn.addEventListener("pointerdown", e => { try { blowBtn.setPointerCapture(e.pointerId); } catch (_) {} ac(); startHold(); });
["pointerup", "pointercancel", "lostpointercapture"].forEach(ev => blowBtn.addEventListener(ev, endHold));
blowBtn.addEventListener("contextmenu", e => e.preventDefault());
blowBtn.addEventListener("keydown", e => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); startHold(); } });
blowBtn.addEventListener("keyup", e => { if (e.key === " " || e.key === "Enter") endHold(); });
cakeNext.addEventListener("click", () => show(2));

/* ---------- 2 · superpowers ---------- */
function buildQuiz() {
  const list = $("#opts"), reply = $("#reply"), next = $("#quizNext");
  list.innerHTML = ""; reply.textContent = ""; next.hidden = true;
  const all = [];
  CONFIG.powers.forEach((p, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "opt"; b.textContent = p.label;
    b.style.setProperty("--c", "var(" + COLORS[i % 4] + ")"); b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => {
      all.forEach(x => { x.classList.remove("picked"); x.setAttribute("aria-pressed", "false"); });
      b.classList.add("picked"); b.setAttribute("aria-pressed", "true");
      reply.textContent = p.reply;
      reply.classList.remove("pop"); void reply.offsetWidth; reply.classList.add("pop");
      sfx.ok(); burstAt(b, 24, { spread: 2.4, power: 8 });
      next.hidden = false;
    });
    all.push(b); list.append(b);
  });
}
$("#quizNext").addEventListener("click", () => show(3));

/* ---------- 3 · scratch coupon ---------- */
const coupon = $("#coupon"), cv = $("#scratch"), sctx = cv.getContext("2d");
let scratching = false, lx = null, ly = null, moves = 0, revealed = false;
function buildScratch() {
  $("#cTitle").textContent = CONFIG.coupon.title;
  $("#cPrize").textContent = CONFIG.coupon.prize;
  $("#cFine").textContent = CONFIG.coupon.fine;
  revealed = false; scratching = false; lx = ly = null; moves = 0;
  $("#scratchNext").hidden = true; $("#revealBtn").hidden = false;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = coupon.clientWidth, h = coupon.clientHeight;
  cv.width = w * dpr; cv.height = h * dpr; cv.classList.remove("gone");
  sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  sctx.globalCompositeOperation = "source-over";
  const g = sctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#D5CEF5"); g.addColorStop(.5, "#A39ADB"); g.addColorStop(1, "#D5CEF5");
  sctx.fillStyle = g; sctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) {
    sctx.fillStyle = "rgba(255,255,255," + (Math.random() * .55).toFixed(2) + ")";
    sctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  sctx.fillStyle = "#1B1340"; sctx.textAlign = "center"; sctx.textBaseline = "middle";
  sctx.font = '34px "Bagel Fat One","Arial Rounded MT Bold",sans-serif';
  sctx.fillText("Rascá acá", w / 2, h / 2 - 12);
  sctx.font = '600 15px "Bricolage Grotesque",system-ui,sans-serif';
  sctx.fillText("con el dedo o el mouse", w / 2, h / 2 + 22);
}
function scratchAt(e) {
  const b = cv.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
  sctx.globalCompositeOperation = "destination-out";
  sctx.lineCap = "round"; sctx.lineWidth = 46;
  sctx.beginPath();
  if (lx !== null) { sctx.moveTo(lx, ly); sctx.lineTo(x, y); sctx.stroke(); }
  sctx.arc(x, y, 23, 0, 7); sctx.fill();
  lx = x; ly = y;
  if (++moves % 10 === 0) checkScratch();
}
function checkScratch() {
  if (revealed) return;
  const w = cv.width, h = cv.height, d = sctx.getImageData(0, 0, w, h).data;
  let clear = 0, total = 0;
  for (let y = 0; y < h; y += 12) for (let x = 0; x < w; x += 12) { total++; if (d[(y * w + x) * 4 + 3] < 30) clear++; }
  if (clear / total > .5) revealCoupon();
}
function revealCoupon() {
  if (revealed) return; revealed = true;
  cv.classList.add("gone");
  burstAt(coupon, 80, { spread: 2.6, power: 11 }); sfx.tada();
  $("#revealBtn").hidden = true; $("#scratchNext").hidden = false;
}
cv.addEventListener("pointerdown", e => { scratching = true; lx = ly = null; try { cv.setPointerCapture(e.pointerId); } catch (_) {} scratchAt(e); });
cv.addEventListener("pointermove", e => { if (scratching) scratchAt(e); });
["pointerup", "pointercancel"].forEach(ev => cv.addEventListener(ev, () => { scratching = false; lx = ly = null; checkScratch(); }));
$("#revealBtn").addEventListener("click", revealCoupon);
$("#scratchNext").addEventListener("click", () => show(4));

/* ---------- 4 · balloons ---------- */
function buildBalloons() {
  const field = $("#field"), wish = $("#wish"), count = $("#balloonCount"), next = $("#balloonNext");
  field.innerHTML = ""; next.hidden = true; wish.textContent = "Tocá un globo.";
  const total = CONFIG.wishes.length;
  const xs = [2, 22, 42, 62, 80, 12, 52], ys = [30, 100, 0, 90, 24, 150, 160];
  let popped = 0;
  const label = () => { const left = total - popped; count.textContent = left ? (left === 1 ? "Queda 1 globo" : "Quedan " + left + " globos") : "¡Todos explotados!"; };
  label();
  CONFIG.wishes.forEach((w, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "balloon";
    b.style.cssText = "--c:var(" + COLORS[i % 4] + ");--x:" + xs[i % xs.length] + "%;--y:" + ys[i % ys.length] + "px;--d:" + (i * .45).toFixed(2) + "s";
    b.setAttribute("aria-label", "Globo " + (i + 1) + ". Tocá para explotarlo");
    b.innerHTML = '<span class="string"></span>';
    b.addEventListener("click", () => {
      if (b.classList.contains("popped")) return;
      b.classList.add("popped"); popped++;
      burstAt(b, 30, { spread: 6.28, power: 8 }); sfx.pop();
      wish.textContent = w; wish.classList.remove("pop"); void wish.offsetWidth; wish.classList.add("pop");
      label();
      setTimeout(() => { b.style.visibility = "hidden"; }, 200);
      if (popped === total) { setTimeout(sfx.tada, 250); burstAt(wish, 70, { spread: 2.6, power: 11 }); next.hidden = false; }
    });
    field.append(b);
  });
}
$("#balloonNext").addEventListener("click", () => show(5));

/* ---------- 5 · letter ---------- */
let typer = null, finished = false;
function finishLetter(celebrate = true) {
  if (typer) { clearInterval(typer); typer = null; }
  const box = $("#letterText");
  box.innerHTML = "";
  CONFIG.letter.forEach(t => { const p = document.createElement("p"); p.textContent = t; box.append(p); });
  $("#sign").hidden = false; $("#finalActions").hidden = false; $("#skipHint").hidden = true;
  if (!finished) {
    finished = true;
    if (celebrate) { sfx.tada(); burstAt($("#letter"), 110, { angle: -Math.PI / 2, spread: 2.6, power: 14 }); }
  }
}
function buildLetter() {
  finished = false;
  $("#finalTitle").textContent = "¡Feliz cumple, " + CONFIG.name + "!";
  $("#letterSr").textContent = CONFIG.letter.join(" ") + " " + CONFIG.sign + CONFIG.from;
  $("#sign").textContent = CONFIG.sign + CONFIG.from;
  $("#sign").hidden = true; $("#finalActions").hidden = true; $("#skipHint").hidden = false;
  const box = $("#letterText"); box.innerHTML = "";
  if (reduce) { finishLetter(false); return; }
  const els = CONFIG.letter.map(() => { const p = document.createElement("p"); box.append(p); return p; });
  let pi = 0, ci = 0; els[0].classList.add("typing");
  if (typer) clearInterval(typer);
  typer = setInterval(() => {
    const full = CONFIG.letter[pi];
    ci = Math.min(ci + 2, full.length);
    els[pi].textContent = full.slice(0, ci);
    if (ci >= full.length) {
      els[pi].classList.remove("typing"); pi++; ci = 0;
      if (pi >= CONFIG.letter.length) { finishLetter(); return; }
      els[pi].classList.add("typing");
    }
  }, 26);
}
$("#letter").addEventListener("click", () => { if (typer) finishLetter(); });
document.querySelectorAll(".js-rain").forEach(b => b.addEventListener("click", () => { rain(4200); sfx.tada(); }));
document.querySelectorAll(".js-again").forEach(b => b.addEventListener("click", () => show(0)));
$("#toComment").addEventListener("click", () => show(6));

/* ---------- 6 · mensaje para vos ---------- */
const form = $("#commentForm"), ta = $("#commentText"), msg = $("#formMsg"), sendBtn = $("#sendBtn");
let sending = false;
function buildComment() {
  form.hidden = false; $("#thanks").hidden = true;
  ta.value = ""; $("#count").textContent = "0 / " + ta.maxLength;
  msg.textContent = ""; msg.className = "form-msg";
  sendBtn.disabled = false; sendBtn.textContent = "Enviar mensaje"; sending = false;
  $("#devNote").hidden = !!(CONFIG.endpoint || CONFIG.email);
}
ta.addEventListener("input", () => { $("#count").textContent = ta.value.length + " / " + ta.maxLength; if (msg.classList.contains("error")) { msg.textContent = ""; msg.className = "form-msg"; } });

async function sendComment(text) {
  if (CONFIG.endpoint) {
    const res = await fetch(CONFIG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        message: text,
        de: CONFIG.name,
        enviado: new Date().toLocaleString("es-AR"),
        _subject: "Mensaje de " + CONFIG.name + " desde tu página de cumple"
      })
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return "sent";
  }
  if (CONFIG.email) {
    const subject = encodeURIComponent("Mensaje de " + CONFIG.name + " desde tu página de cumple");
    window.location.href = "mailto:" + CONFIG.email + "?subject=" + subject + "&body=" + encodeURIComponent(text);
    return "mailto";
  }
  try {
    const key = "cumple-mensajes", all = JSON.parse(localStorage.getItem(key) || "[]");
    all.push({ text, at: new Date().toISOString() }); localStorage.setItem(key, JSON.stringify(all));
  } catch (_) {}
  return "local";
}
form.addEventListener("submit", async e => {
  e.preventDefault();
  if (sending) return;
  const text = ta.value.trim();
  if (!text) { msg.textContent = "Escribí algo antes de enviar."; msg.className = "form-msg error"; ta.focus(); return; }
  if (form.elements["_gotcha"].value) return;
  sending = true; sendBtn.disabled = true; sendBtn.textContent = "Enviando…";
  try {
    const mode = await sendComment(text);
    form.hidden = true; $("#thanks").hidden = false;
    $("#thanksTitle").textContent = mode === "local" ? "Mensaje guardado (modo prueba)" : "¡Mensaje enviado!";
    $("#thanksText").textContent = mode === "sent" ? "Gracias, " + CONFIG.name + ". Ya me llegó."
      : mode === "mailto" ? "Se abrió tu app de correo: tocá enviar para que me llegue."
      : "Se guardó solo en este dispositivo. Para que le llegue a " + CONFIG.from + ", configurá el envío en script.js.";
    $("#thanksTitle").focus({ preventScroll: true });
    sfx.tada(); burstAt($("#thanks"), 100, { spread: 2.6, power: 13 });
  } catch (err) {
    sending = false; sendBtn.disabled = false; sendBtn.textContent = "Enviar mensaje";
    msg.textContent = "No se pudo enviar. Revisá la conexión y probá de nuevo.";
    msg.className = "form-msg error";
  }
});

/* ---------- go ---------- */
const hooks = [buildHero, buildCake, buildQuiz, buildScratch, buildBalloons, buildLetter, buildComment];
show(0);
