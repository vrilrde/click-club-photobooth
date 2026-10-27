(function () {
  var E = window.CLICK_CLUB, ERAS = E.eras, N = ERAS.length;
  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  $('hwTrack').innerHTML = ERAS.concat(ERAS).map(function (e) {
    return '<span class="ip-b" style="--f:' + e.vars.front + ';--b:' + e.vars.band + ';--c:' + e.vars.curtain + '"><i></i></span>';
  }).join('');
  var hw = $('how');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries, obs) {
      if (entries[0].isIntersecting) { hw.classList.add('in'); obs.disconnect(); }
    }, { threshold: .25 }).observe(hw);
  } else {
    hw.classList.add('in');
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var lib = $('eras'), stage = $('libStage'), world = $('libWorld'), track = $('libTrack'), info = $('libInfo'), notes = $('libNotes');

  var BOOTH_TOKENS = ['front', 'side', 'top', 'band', 'band-ink', 'bulb', 'bulb-glow', 'interior', 'rod', 'panel', 'panel-ink', 'sign', 'sign-ink', 'sign-edge', 'curtain', 'display', 'disp-style', 'disp-weight'];
  track.innerHTML = ERAS.map(function (e, i) {
    var tokens = BOOTH_TOKENS.map(function (k) { return '--' + k + ':' + e.vars[k]; }).join(';');
    return '<a class="car" data-i="' + i + '" href="' + E.booth + '#' + e.id + '" style="' + esc(tokens) + '" aria-label="' + esc(e.name) + ', inspired by ' + esc(e.artist) + '. Step inside.">' +
      '<div class="mb" aria-hidden="true">' +
        '<div class="mb-shadow"></div><div class="mb-side l"></div><div class="mb-side r"></div><div class="mb-top"></div>' +
        '<div class="mb-body">' +
          '<div class="mb-band"><i></i><b>Photo Booth</b><i></i></div>' +
          '<div class="mb-open"><div class="mb-lens"></div><div class="mb-seat"></div><div class="mb-post"></div><div class="mb-cur l"></div><div class="mb-cur r"></div></div>' +
          '<div class="mb-rod"></div>' +
          '<div class="mb-panel">4 FLASHES · 1 STRIP</div>' +
        '</div>' +
        '<div class="mb-sign">Photos</div>' +
      '</div></a>';
  }).join('');
  var cars = Array.prototype.slice.call(track.children);

  $('libIndex').innerHTML = ERAS.map(function (e, i) {
    return '<li><button type="button" data-i="' + i + '" aria-label="' + esc(e.name) + '"></button></li>';
  }).join('');
  var ticks = Array.prototype.slice.call($('libIndex').querySelectorAll('button'));

  var step = 1, libTop = 0, W = 0, H = 0, k = 1, sx = 340, cyPx = 0;
  lib.insertAdjacentHTML('beforeend', ERAS.map(function () { return '<div class="lib-snap" aria-hidden="true"></div>'; }).join(''));
  var snaps = lib.querySelectorAll('.lib-snap');
  function layout() {
    W = stage.clientWidth; H = window.innerHeight;
    step = Math.round(H * .55);
    lib.style.height = (H + step * (N - 1)) + 'px';
    Array.prototype.forEach.call(snaps, function (s, i) { s.style.top = (i * step) + 'px'; });
    libTop = lib.getBoundingClientRect().top + window.scrollY;
    var narrow = W < 720;
    k = Math.max(.6, Math.min(1.45, W / (narrow ? 470 : 560), (H - 260) / 330));
    sx = narrow ? 250 : 340;
    guard();
  }
  function guard() {
    if (leaving) return;
    var sr = stage.getBoundingClientRect(), ir = info.getBoundingClientRect();
    var ib = Math.round(ir.bottom - sr.top + 18), ir2 = Math.round(ir.right - sr.left + 28);
    if (W < 720) {
      world.style.clipPath = 'inset(' + ib + 'px 0 0 0)';
      cyPx = (ib + notes.getBoundingClientRect().top - sr.top) / 2 + 15 * k;
    } else {
      world.style.clipPath = 'polygon(' + ir2 + 'px 0, 100% 0, 100% 100%, 0 100%, 0 ' + ib + 'px, ' + ir2 + 'px ' + ib + 'px)';
      cyPx = H * .47;
    }
    world.style.perspectiveOrigin = '50% ' + Math.round(cyPx) + 'px';
  }
  var leaving = false;
  layout();
  window.addEventListener('resize', layout);

  function target() { return Math.max(0, Math.min(N - 1, (window.scrollY - libTop) / step)); }
  function go(i) {
    i = Math.max(0, Math.min(N - 1, i));
    window.scrollTo({ top: libTop + i * step, behavior: reduce ? 'auto' : 'smooth' });
  }

  var shown = -1, swapT = 0;
  function fill(i) {
    var e = ERAS[i];
    $('libName').textContent = e.name;
    $('libArtist').textContent = e.artist;
    $('libCap').textContent = '“' + e.caption + '”';
    $('libMoods').innerHTML = e.moods.map(function (m) {
      return '<div><b aria-label="' + m[1] + ' out of 5">' + '★★★★★'.slice(0, m[1]) + '☆☆☆☆☆'.slice(0, 5 - m[1]) + '</b><span>' + esc(m[0]) + '</span></div>';
    }).join('');
    $('libGo').href = E.booth + '#' + e.id;
    $('libGo').setAttribute('aria-label', 'Step inside ' + e.name);
    $('libPrev').disabled = i === 0; $('libNext').disabled = i === N - 1;
    stage.style.setProperty('--tint', e.bg);
    stage.style.setProperty('--eink', e.ink);
    ticks.forEach(function (t, j) { t.setAttribute('aria-current', j === i ? 'true' : 'false'); });
    cars.forEach(function (c, j) { c.classList.toggle('on', j === i); });
    guard();
  }
  function show(i) {
    if (i === shown) return;
    var first = shown < 0;
    shown = i;
    if (first || reduce) { fill(i); return; }
    info.classList.add('swap'); notes.classList.add('swap');
    clearTimeout(swapT);
    swapT = setTimeout(function () { fill(shown); info.classList.remove('swap'); notes.classList.remove('swap'); }, 180);
  }

  var P = target(), mx = 0, my = 0, px = 0, py = 0;
  stage.addEventListener('pointermove', function (e) { px = e.clientX / W * 2 - 1; py = e.clientY / H * 2 - 1; });
  function frame(now) {
    var t = now / 1000, T = target();
    P = reduce ? T : P + (T - P) * .085;
    if (Math.abs(T - P) < .0005) P = T;
    mx += (px - mx) * .05; my += (py - my) * .05;
    if (pending >= 0 && now - pendingAt > 2500) pending = -1;
    if (pending >= 0 && Math.abs(P - pending) < .02) enterBooth(pending);
    var zoom = leaving ? Math.min(1, (now - zoomT0) / 1000) : 0, zz = zoom * zoom;
    var x0 = W / 2 - 75, y0 = cyPx - 128, sway = reduce ? 0 : 1 - zz;
    cars.forEach(function (c, i) {
      var d = i - P, front = leaving && i === shown;
      var op = d < -2.4 ? 0 : d < -1.6 ? (d + 2.4) / .8 : d > 2.1 ? 0 : d > 1.4 ? (2.1 - d) / .7 : 1;
      if (leaving && !front) op *= 1 - Math.min(1, zoom * 2.5);
      if (op <= 0) { c.style.visibility = 'hidden'; return; }
      c.style.visibility = 'visible';
      c.style.opacity = op >= 1 ? '' : op.toFixed(3);
      var x = x0 + d * sx * k, y = y0 - d * 120 * k + Math.sin(t * 1.1 + i) * 5 * sway, z = d * 250 * k + (front ? zz * 1250 : 0);
      var turn = front ? 1 - zz : 1;
      var ry = (-22 + mx * 8 + Math.sin(t * .7 + i * 1.3) * 7 * sway) * turn, rx = (4 - my * 4) * turn;
      c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateY(' + ry.toFixed(2) + 'deg) rotateX(' + rx.toFixed(2) + 'deg) rotateZ(' + (-3 * turn).toFixed(2) + 'deg) scale(' + k.toFixed(3) + ')';
      c.style.zIndex = front ? 999 : Math.round(100 + d * 10);
    });
    if (!leaving) show(Math.round(P));
    requestAnimationFrame(frame);
  }

  var pending = -1, pendingAt = 0, zoomT0 = 0;
  function enterBooth(i) {
    if (leaving) return;
    if (Math.abs(P - i) > .02 || Math.round(target()) !== i) { pending = i; pendingAt = performance.now(); go(i); return; }
    pending = -1; leaving = true; zoomT0 = performance.now();
    var e = ERAS[i];
    clearTimeout(swapT); shown = i; fill(i);
    world.style.clipPath = 'none';
    stage.style.setProperty('--room-to', e.vars.room);
    stage.classList.add('leaving');
    cars[i].classList.add('open');
    try { sessionStorage.setItem('cc-arrive', e.id); } catch (err) {}
    setTimeout(function () { location.href = E.booth + '#' + e.id; }, reduce ? 0 : 1050);
  }
  requestAnimationFrame(frame);

  cars.forEach(function (c, i) {
    c.addEventListener('click', function (e) { e.preventDefault(); enterBooth(i); });
    c.addEventListener('focus', function () { if (!leaving && i !== Math.round(target())) go(i); });
  });
  $('libGo').addEventListener('click', function (e) { e.preventDefault(); enterBooth(Math.round(target())); });
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    leaving = false; pending = -1;
    stage.classList.remove('leaving');
    cars.forEach(function (c) { c.classList.remove('open'); });
    guard();
  });
  ticks.forEach(function (t, i) { t.addEventListener('click', function () { go(i); }); });
  $('libPrev').addEventListener('click', function () { go(Math.round(target()) - 1); });
  $('libNext').addEventListener('click', function () { go(Math.round(target()) + 1); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    var y = window.scrollY;
    if (y < libTop - H / 2 || y > libTop + step * (N - 1) + H / 2) return;
    e.preventDefault();
    go(Math.round(target()) + (e.key === 'ArrowRight' ? 1 : -1));
  });
})();
