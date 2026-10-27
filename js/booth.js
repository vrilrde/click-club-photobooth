(function () {
  var $ = function (s) { return document.querySelector(s); };
  var root = document.documentElement;
  var stage = $('#stage'), rig = $('#rig'), cam = $('#cam'), booth = $('#booth');
  var curL = $('#curL'), curR = $('#curR'), hud = $('#hud'), inside = $('#inside');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var P = 1400;

  var D = CLICK_CLUB.doodles, BOOTHS = CLICK_CLUB.eras;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  ['#bulbsA', '#bulbsB'].forEach(function (sel, r) {
    var el = $(sel);
    for (var i = 0; i < 13; i++) { var b = document.createElement('i'); b.style.animationDelay = (-(i * 0.37 + r * 0.6)) + 's'; el.appendChild(b); }
  });

  var parts = $('#particles');
  for (var i = 0; i < 40; i++) {
    var p = document.createElement('div'); p.className = 'pt';
    var x = Math.random() * 1800 - 900, y = Math.random() * 760 - 480, z = Math.random() * 900 - 600;
    if (Math.abs(x) < 210 && z > -200) x += x < 0 ? -260 : 260;
    p.style.transform = 'translate3d(' + x.toFixed(0) + 'px,' + y.toFixed(0) + 'px,' + z.toFixed(0) + 'px)';
    var d = document.createElement('i'), s = 2 + Math.random() * 3.5;
    d.style.width = d.style.height = s.toFixed(1) + 'px';
    d.style.animationDuration = (7 + Math.random() * 8).toFixed(1) + 's';
    d.style.animationDelay = (-Math.random() * 12).toFixed(1) + 's';
    p.appendChild(d); parts.appendChild(p);
  }

  var SPOTS = [[640, 330, 190, .16, -12], [2090, 300, 150, .15, 10], [480, 960, 120, .11, 6], [2280, 920, 210, .12, -8], [1620, 170, 90, .1, 0], [1040, 1180, 80, .09, 14], [1830, 1200, 110, .1, -4]];
  function buildWall(b) {
    var wall = $('#wall'); wall.innerHTML = '';
    SPOTS.forEach(function (s, i) {
      var svg = '<svg viewBox="0 0 24 24" aria-hidden="true" style="left:' + s[0] + 'px;top:' + s[1] + 'px;width:' + s[2] + 'px;height:' + s[2] + 'px;opacity:' + s[3] + ';transform:rotate(' + s[4] + 'deg)">' + D[b.doodles[i % 4]] + '</svg>';
      wall.insertAdjacentHTML('beforeend', svg);
    });
  }

  var sw = $('#switch');
  BOOTHS.forEach(function (b, i) {
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'chip'; btn.id = 'chip-' + b.id;
    btn.title = b.name + ' · ' + b.artist;
    btn.innerHTML = '<span class="sw" style="background:linear-gradient(' + b.vars.band + ' 0 35%,' + b.vars.front + ' 35%)"></span>';
    btn.appendChild(document.createTextNode(b.name));
    btn.addEventListener('click', function () { choose(i, true); });
    sw.appendChild(btn);
  });

  var S = { camZ: 0, rx: -7, ry: 0, bry: -26, curtain: 0, peek: 0, env: 1, idle: 1, spin: 0 };
  var E = {
    io: function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    out: function (t) { return 1 - Math.pow(1 - t, 3); },
    io4: function (t) { return t < .5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2; },
    in3: function (t) { return t * t * t; }
  };
  var owner = {}, tid = 0;
  function tween(to, dur, ease) {
    var id = ++tid, from = {}, t0 = performance.now();
    if (reduce) dur = 1;
    Object.keys(to).forEach(function (k) { from[k] = S[k]; owner[k] = id; });
    return new Promise(function (res) {
      function step(now) {
        var k0 = Math.min(1, (now - t0) / dur), e = E[ease || 'io'](k0);
        Object.keys(to).forEach(function (k) { if (owner[k] === id) S[k] = from[k] + (to[k] - from[k]) * e; });
        if (k0 < 1) requestAnimationFrame(step); else res();
      }
      requestAnimationFrame(step);
    });
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }

  var fit = 1;
  function layout() {
    var W = stage.clientWidth, sr = stage.getBoundingClientRect();
    var top = $('.hud-top').getBoundingClientRect().bottom - sr.top + 12;
    var bottom = $('.hud-foot').getBoundingClientRect().top - sr.top - 8;
    fit = Math.max(.42, Math.min(1, (bottom - top) / 780, (W - 24) / 470));
    var y = (top + bottom) / 2 + 61 * fit;
    rig.style.top = y.toFixed(1) + 'px';
    stage.style.perspectiveOrigin = '50% ' + y.toFixed(1) + 'px';
    rig.style.transform = 'scale3d(' + fit + ',' + fit + ',' + fit + ')';
  }
  function zoomZ() {
    var W = stage.clientWidth, H = stage.clientHeight;
    var s = 1.25 * Math.max(W / (fit * 264), (H * 1.08) / (fit * 360));
    return (P - P / s) / fit - 120;
  }
  window.addEventListener('resize', function () { layout(); if (state === 'inside') S.camZ = zoomZ(); });
  if (document.fonts) document.fonts.ready.then(function () { if (state === 'outside') layout(); });

  var px = 0, py = 0, mx = 0, my = 0;
  stage.addEventListener('pointermove', function (e) {
    var r = stage.getBoundingClientRect();
    px = (e.clientX - r.left) / r.width * 2 - 1; py = (e.clientY - r.top) / r.height * 2 - 1;
  });

  function frame(now) {
    var t = now / 1000, id = reduce ? 0 : S.idle;
    mx += (px - mx) * .05; my += (py - my) * .05;
    cam.style.transform = 'translateZ(' + S.camZ.toFixed(2) + 'px) rotateX(' + (S.rx + my * 4 * id).toFixed(3) + 'deg) rotateY(' + (S.ry + mx * 10 * id).toFixed(3) + 'deg)';
    booth.style.transform = 'translateY(' + (Math.sin(t * .9) * 7 * id).toFixed(2) + 'px) rotateY(' + (S.bry + Math.sin(t * .42) * 5 * id + S.spin).toFixed(3) + 'deg)';
    var c = Math.min(1, S.curtain + S.peek), sx = 1 - .84 * c;
    curL.style.transform = 'scaleX(' + sx.toFixed(4) + ')';
    curR.style.transform = 'scaleX(' + sx.toFixed(4) + ')';
    cam.style.setProperty('--env', S.env.toFixed(3));
    parts.style.visibility = S.env < .02 ? 'hidden' : 'visible';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  var cur = 0, state = 'outside';
  function apply(i) {
    var b = BOOTHS[i];
    Object.keys(b.vars).forEach(function (k) { root.style.setProperty('--' + k, b.vars[k]); });
    $('#eyebrow').textContent = 'Inspired by ' + b.artist;
    $('#name').textContent = b.name;
    $('#tag').textContent = b.caption;
    document.title = b.name + ' · Click Club';
    $('#inName').textContent = b.name;
    buildWall(b);
    BOOTHS.forEach(function (o, j) { $('#chip-' + o.id).setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
    try { localStorage.setItem('cc-era', b.id); } catch (e) {}
    layout();
  }
  function lock(on) {
    Array.prototype.forEach.call(sw.querySelectorAll('button'), function (b) { b.disabled = on; });
    $('#goBtn').disabled = on;
  }
  function choose(i, animate) {
    if (state !== 'outside' || i === cur) return;
    cur = i;
    if (!animate || reduce) { apply(i); return; }
    state = 'switching'; lock(true);
    booth.classList.add('hot');
    tween({ spin: 360 }, 1100, 'io').then(function () {
      S.spin = 0; booth.classList.remove('hot'); state = 'outside'; lock(false);
    });
    setTimeout(function () { apply(i); }, 520);
  }

  async function enter() {
    if (state !== 'outside') return;
    state = 'entering'; lock(true);
    startCam();
    hud.classList.add('gone'); booth.classList.add('hot');
    var target = zoomZ();
    tween({ idle: 0, bry: 0, rx: 0, ry: 0, peek: 0, camZ: target * .38 }, 1500, 'io');
    await wait(750);
    tween({ curtain: 1 }, 1800, 'io4');
    await wait(1250);
    tween({ env: 0 }, 900, 'out');
    tween({ camZ: target }, 1900, 'io');
    await wait(1550);
    showInside(true);
    state = 'inside';
    $('#shootBtn').focus({ preventScroll: true });
  }
  async function leave() {
    if (state !== 'inside') return;
    state = 'exiting';
    stripUrl(false);
    showInside(false);
    stopCam();
    await wait(350);
    tween({ camZ: 0 }, 1700, 'io');
    tween({ env: 1 }, 1400, 'in3');
    await wait(700);
    tween({ curtain: 0 }, 1300, 'io');
    tween({ idle: 1, bry: -26, rx: -7 }, 1600, 'io');
    await wait(1100);
    booth.classList.remove('hot'); hud.classList.remove('gone');
    state = 'outside'; lock(false);
    $('#goBtn').focus({ preventScroll: true });
  }
  function showInside(on) {
    inside.classList.toggle('on', on);
    inside.setAttribute('aria-hidden', on ? 'false' : 'true');
    if (!on) resetShoot();
  }

  $('#hit').addEventListener('click', function (e) { e.stopPropagation(); enter(); });
  booth.addEventListener('click', enter);
  $('#goBtn').addEventListener('click', enter);
  $('#outBtn').addEventListener('click', leave);
  booth.addEventListener('pointerenter', function () { if (state === 'outside') tween({ peek: .12 }, 450, 'out'); });
  booth.addEventListener('pointerleave', function () { if (state === 'outside') tween({ peek: 0 }, 450, 'out'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state === 'inside' && !shooting) leave(); });

  var video = $('#video'), vf = $('#vf'), still = $('#still'), stream = null;
  function camMsg(text, retry) {
    $('#vfMsgText').textContent = text || '';
    $('#vfMsg').hidden = !text;
    $('#camRetry').hidden = !retry;
  }
  async function startCam() {
    if (stream) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      camMsg('This browser can’t open a camera here. You’ll get a doodle strip instead.');
      return;
    }
    camMsg('Starting the camera…');
    try {
      var s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      if (state !== 'entering' && state !== 'inside') { s.getTracks().forEach(function (t) { t.stop(); }); return; }
      stream = s;
      video.srcObject = stream;
      await video.play().catch(function () {});
      vf.classList.add('live');
      camMsg('');
    } catch (err) {
      var name = err && err.name;
      if (name === 'NotAllowedError' || name === 'SecurityError') camMsg('Camera access is blocked. Allow it from the camera icon in your address bar, then try again.', true);
      else if (name === 'NotFoundError' || name === 'OverconstrainedError') camMsg('No camera found. You’ll get a doodle strip instead.');
      else camMsg('The camera couldn’t start. Close other apps using it, then try again.', true);
    }
  }
  function stopCam() {
    if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
    stream = null; video.srcObject = null;
    vf.classList.remove('live'); camMsg('');
  }
  $('#camRetry').addEventListener('click', startCam);
  function grab() {
    if (!stream || !video.videoWidth) return null;
    var a = cutGeo().pa, W = a >= 1 ? 1200 : Math.round(1200 * a), H = a >= 1 ? Math.round(1200 / a) : 1200;
    var vw = video.videoWidth, vh = video.videoHeight, sw = vw, sh = vh;
    if (vw / vh > a) sw = vh * a; else sh = vw / a;
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d');
    x.translate(W, 0); x.scale(-1, 1);
    x.drawImage(video, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, W, H);
    return c.toDataURL('image/jpeg', .9);
  }

  var CUTS = [
    { id: 'classic', name: 'Classic', size: '2×6″ strip', shots: 4, W: 600, H: 1800, cols: 1, rows: 4, pad: 30, gap: 18, cap: 150 },
    { id: 'trio', name: 'Trio', size: '2×6″ strip', shots: 3, W: 600, H: 1800, cols: 1, rows: 3, pad: 30, gap: 22, cap: 160 },
    { id: 'grid', name: 'Grid', size: '4×6″ print', shots: 4, W: 1200, H: 1800, cols: 2, rows: 2, pad: 44, gap: 24, cap: 190 },
    { id: 'six', name: 'Six-pack', size: '4×6″ print', shots: 6, W: 1200, H: 1800, cols: 2, rows: 3, pad: 44, gap: 24, cap: 190 }
  ];
  var cut = CUTS[0];
  try { CUTS.forEach(function (c) { if (c.id === localStorage.getItem('cc-cut')) cut = c; }); } catch (e) {}
  function cutGeo(c) {
    c = c || cut;
    var fw = (c.W - c.pad * 2 - c.gap * (c.cols - 1)) / c.cols, fh = (c.H - c.pad - c.cap - c.gap * (c.rows - 1)) / c.rows, mat = c.W / 75;
    var cells = [];
    for (var i = 0; i < c.shots; i++) cells.push({ x: c.pad + (i % c.cols) * (fw + c.gap), y: c.pad + Math.floor(i / c.cols) * (fh + c.gap) });
    return { fw: fw, fh: fh, mat: mat, pa: (fw - mat * 2) / (fh - mat * 2), cells: cells };
  }
  function capSizes(c) { return c.cols === 1 ? { hand: .077, mono: .03 } : { hand: .058, mono: .022 }; }

  var cutsEl = $('#cuts'), thumbsEl = $('#thumbs');
  cutsEl.innerHTML = CUTS.map(function (c) {
    return '<button class="cut" type="button" data-id="' + c.id + '" aria-pressed="false">' +
      '<span class="cut-ico" aria-hidden="true" style="--a:' + (c.W / c.H).toFixed(4) + ';--c:' + c.cols + ';--r:' + c.rows + '">' + new Array(c.shots + 1).join('<i></i>') + '</span>' +
      '<span><b>' + c.name + '</b><small>' + c.shots + ' cuts · ' + c.size + '</small></span></button>';
  }).join('');
  function setCut(c) {
    cut = c;
    try { localStorage.setItem('cc-cut', c.id); } catch (e) {}
    Array.prototype.forEach.call(cutsEl.children, function (btn) { btn.setAttribute('aria-pressed', btn.getAttribute('data-id') === c.id ? 'true' : 'false'); });
    inside.style.setProperty('--fa', cutGeo().pa.toFixed(4));
    thumbsEl.innerHTML = new Array(c.shots + 1).join('<li></li>');
  }
  function lockCuts(on) { Array.prototype.forEach.call(cutsEl.children, function (btn) { btn.disabled = on; }); }
  cutsEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.cut');
    if (!btn || shooting) return;
    CUTS.forEach(function (c) { if (c.id === btn.getAttribute('data-id')) setCut(c); });
  });

  var shooting = false, photos = [], look = [];
  var strip = $('#strip'), zone = $('#printZone'), count = $('#count'), flash = $('#flash'), shot = $('#shot');
  function stamp() { var d = new Date(); function z(n) { return (n < 10 ? '0' : '') + n; } return z(d.getMonth() + 1) + '.' + z(d.getDate()) + '.' + String(d.getFullYear()).slice(2); }
  function pc(v, of) { return (v / of * 100).toFixed(3) + '%'; }
  function buildStrip() {
    var b = BOOTHS[cur], g = cutGeo(), W = cut.W, H = cut.H, cs = capSizes(cut), html = '';
    look = [];
    g.cells.forEach(function (p, i) {
      var f = b.frames[i % b.frames.length];
      var rot = +(Math.random() * 16 - 8).toFixed(1), sc = (0.9 + Math.random() * 0.25).toFixed(2), dk = b.doodles[(i + Math.floor(Math.random() * 4)) % 4];
      look.push({ doodle: dk, rot: rot });
      var svg = '<svg viewBox="0 0 24 24" aria-hidden="true" style="transform:rotate(' + rot + 'deg) scale(' + sc + ')">' + D[dk] + '</svg>';
      var img = photos[i] ? '<img alt="" src="' + photos[i] + '" style="left:' + pc(g.mat, g.fw) + ';top:' + pc(g.mat, g.fh) + ';width:' + pc(g.fw - g.mat * 2, g.fw) + ';height:' + pc(g.fh - g.mat * 2, g.fh) + '">' : '';
      html += '<div class="frame' + (photos[i] ? ' photo' : '') + '" style="left:' + pc(p.x, W) + ';top:' + pc(p.y, H) + ';width:' + pc(g.fw, W) + ';height:' + pc(g.fh, H) +
        ';background:' + f[0] + ';color:' + f[1] + '">' + img + svg + '</div>';
    });
    html += '<p class="cap" style="top:' + pc(H - cut.cap, H) + ';color:' + b.ink + '"><b style="font-size:' + (cs.hand * 100).toFixed(2) + 'em">' + esc(b.caption) + '</b>' +
      '<small style="font-size:' + (cs.mono * 100).toFixed(2) + 'em">CLICK CLUB · ' + stamp() + '</small></p>';
    strip.innerHTML = html;
    strip.setAttribute('aria-label', 'Your ' + cut.name + ' ' + cut.size + ' from ' + b.name);
  }
  function sizeStrip() {
    var zr = zone.getBoundingClientRect(), ratio = cut.W / cut.H;
    var sh = Math.min(zr.height * .86, 620, (zr.width - 40) / ratio), sw = sh * ratio;
    zone.style.setProperty('--sw', sw.toFixed(1) + 'px');
    zone.style.setProperty('--ar', cut.W + ' / ' + cut.H);
    strip.style.fontSize = (sw / 100).toFixed(3) + 'px';
    zone.querySelector('.printer').style.width = Math.min(zr.width - 16, sw + 110).toFixed(1) + 'px';
    return { dy: (zr.height - sh) / 2 - 64 };
  }
  var FEED = [[0, -101], [.16, -80], [.22, -80], [.38, -58], [.44, -58], [.6, -36], [.66, -36], [.84, -12], [.88, -12], [1, 0]];
  function settled(dy) { return 'translateY(' + dy.toFixed(1) + 'px) rotateX(0deg) rotateZ(-2.5deg)'; }
  async function printStrip() {
    var m = sizeStrip();
    strip.getAnimations().forEach(function (a) { a.cancel(); });
    zone.classList.add('printing');
    await wait(550);
    await strip.animate(FEED.map(function (s) { return { offset: s[0], transform: 'translateY(' + s[1] + '%) rotateX(22deg)', easing: 'ease-in-out' }; }),
      { duration: reduce ? 1 : 3400, fill: 'forwards' }).finished;
    await wait(250);
    zone.classList.add('delivered');
    await strip.animate([{ transform: 'translateY(0px) rotateX(22deg) rotateZ(0deg)' }, { transform: settled(m.dy) }],
      { duration: reduce ? 1 : 1300, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }).finished;
  }
  window.addEventListener('resize', function () {
    if (!zone.classList.contains('delivered')) return;
    var m = sizeStrip();
    strip.getAnimations().forEach(function (a) { a.cancel(); });
    strip.style.transform = settled(m.dy);
  });
  function resetShoot() {
    zone.classList.remove('printing', 'delivered');
    strip.getAnimations().forEach(function (a) { a.cancel(); });
    strip.style.transform = ''; strip.innerHTML = '';
    $('#lensBlock').classList.remove('away');
    $('#inTitle').textContent = 'Pick a cut, then look into the lens';
    $('#shootBtn').textContent = 'Take photos';
    $('#saveBtn').hidden = true;
    shot.textContent = ''; count.textContent = '';
    photos = []; still.classList.remove('show');
    lockCuts(false);
    setCut(cut);
  }

  function loadImg(src) { return new Promise(function (res, rej) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = rej; im.src = src; }); }
  function doodleImg(key, color) {
    return loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="192" height="192" color="' + color + '">' + D[key] + '</svg>'));
  }
  async function saveStrip() {
    var b = BOOTHS[cur], c = cut, g = cutGeo(), W = c.W, H = c.H, cs = capSizes(c);
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var x = cv.getContext('2d');
    x.fillStyle = b.vars.paper; x.fillRect(0, 0, W, H);
    for (var i = 0; i < g.cells.length; i++) {
      var p = g.cells[i], f = b.frames[i % b.frames.length], st = await doodleImg(look[i].doodle, f[1]);
      var size = photos[i] ? g.fw * .18 : Math.min(g.fw, g.fh) * .42;
      var cx = photos[i] ? p.x + g.fw - size * .75 : p.x + g.fw / 2, cy = photos[i] ? p.y + size * .7 : p.y + g.fh / 2;
      x.fillStyle = f[0]; x.fillRect(p.x, p.y, g.fw, g.fh);
      if (photos[i]) x.drawImage(await loadImg(photos[i]), p.x + g.mat, p.y + g.mat, g.fw - g.mat * 2, g.fh - g.mat * 2);
      x.save(); x.translate(cx, cy); x.rotate(look[i].rot * Math.PI / 180); x.drawImage(st, -size / 2, -size / 2, size, size); x.restore();
    }
    var top = H - c.cap;
    x.fillStyle = b.ink; x.textAlign = 'center';
    x.font = '700 ' + Math.round(W * cs.hand) + 'px Caveat, cursive';
    x.fillText(b.caption, W / 2, top + c.cap * .48);
    x.font = '700 ' + Math.round(W * cs.mono) + 'px "Space Mono", monospace';
    if ('letterSpacing' in x) x.letterSpacing = Math.round(W * cs.mono * .1) + 'px';
    x.fillText('CLICK CLUB · ' + stamp(), W / 2, top + c.cap * .76);
    cv.toBlob(function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'click-club-' + b.id + '-' + c.id + '-' + stamp().replace(/\./g, '-') + '.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    }, 'image/png');
  }
  $('#saveBtn').addEventListener('click', saveStrip);
  async function shoot() {
    if (state !== 'inside' || shooting) return;
    shooting = true;
    $('#shootBtn').disabled = true; $('#outBtn').disabled = true;
    resetShoot();
    lockCuts(true);
    var n = cut.shots, thumbs = thumbsEl.children;
    $('#inTitle').textContent = 'Hold that pose';
    for (var s = 1; s <= n; s++) {
      var slot = thumbs[s - 1];
      shot.textContent = 'Shot ' + s + ' of ' + n;
      slot.className = 'on';
      for (var k = 3; k >= 1; k--) {
        count.textContent = k;
        count.classList.remove('pop'); void count.offsetWidth; count.classList.add('pop');
        await wait(900);
      }
      count.textContent = '';
      flash.classList.remove('go-off'); void flash.offsetWidth; flash.classList.add('go-off');
      var src = grab();
      photos[s - 1] = src;
      slot.className = 'done';
      if (src) {
        still.src = src; still.classList.add('show');
        slot.innerHTML = '<img alt="Shot ' + s + '" src="' + src + '">';
        await wait(1100);
        still.classList.remove('show');
        await wait(150);
      } else {
        await wait(650);
      }
    }
    shot.textContent = 'Printing';
    $('#inTitle').textContent = 'Printing your strip';
    buildStrip();
    $('#lensBlock').classList.add('away');
    await printStrip();
    stripUrl(true);
    shot.textContent = cut.name + ' · ' + cut.size;
    $('#shootBtn').textContent = 'New strip';
    $('#saveBtn').hidden = false;
    $('#shootBtn').disabled = false; $('#outBtn').disabled = false;
    shooting = false;
  }
  $('#shootBtn').addEventListener('click', function () {
    if (zone.classList.contains('delivered') && !shooting) { stripUrl(false); resetShoot(); return; }
    shoot();
  });
  setCut(cut);

  var STRIP = location.protocol === 'file:' ? '' : CLICK_CLUB.booth + '/strip';
  Array.prototype.forEach.call(document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]'), function (l) { l.href = l.href; });
  function stripUrl(on) {
    if (!STRIP) return;
    try {
      if (on) history.pushState({ strip: true }, '', STRIP);
      else if (history.state && history.state.strip) history.back();
    } catch (e) {}
  }
  window.addEventListener('popstate', function () {
    var atStrip = history.state && history.state.strip, out = zone.classList.contains('delivered');
    if (out && !atStrip && !shooting) resetShoot();
    if (atStrip && !out) history.replaceState(null, '', CLICK_CLUB.booth);
  });

  var start = 0, want = (location.hash || '').slice(1);
  try { want = want || sessionStorage.getItem('cc-arrive') || localStorage.getItem('cc-era'); } catch (e) {}
  BOOTHS.forEach(function (b, i) { if (b.id === want) start = i; });
  if (location.hash) try { history.replaceState(null, '', location.pathname); } catch (e) {}
  root.classList.add('preload');
  cur = start; apply(start);
  requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.remove('preload'); }); });

  var arriving = false;
  try { arriving = sessionStorage.getItem('cc-arrive') === BOOTHS[start].id; sessionStorage.removeItem('cc-arrive'); } catch (e) {}
  if (arriving && !reduce) {
    state = 'arriving'; lock(true);
    S.camZ = zoomZ() * .55; S.env = 0; S.curtain = .75; S.idle = 0; S.bry = 0; S.rx = 0;
    tween({ camZ: 0, env: 1, curtain: 0, idle: 1, bry: -26, rx: -7 }, 1700, 'io').then(function () { state = 'outside'; lock(false); });
    setTimeout(function () { root.classList.remove('arrive'); }, 1000);
  } else {
    root.classList.remove('arrive');
  }

  $('#back').href = CLICK_CLUB.home;
  $('#back').addEventListener('click', function (e) {
    if (reduce) return;
    e.preventDefault();
    var href = this.href;
    root.classList.add('depart');
    setTimeout(function () { location.href = href; }, 420);
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) root.classList.remove('depart'); });
})();
