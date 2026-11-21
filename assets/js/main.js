/* Vibrant Portfolio on the template kit.
 *
 * The kit fills the page from the contract. This script adds the template's own touches, each one
 * derived from contract fields: the brand (the initials and the first name), the name with its
 * surname in the gradient light and fitted to its column, the typed role (hero.title, then the
 * title of each current role), project numbers by order, the highlights of a featured project
 * without a picture set large in its place, tiles for grid cards without a picture beside ones
 * with, the lead role, the "Now" mark on current roles, company monograms for roles without a logo
 * when others have one, a mount for logos on a transparent ground, and named contact channels.
 * Motion (the typing, the motes beside the hero, the turning ring and the reveals) starts only
 * when the visitor has not asked for reduced motion. Text goes in only through textContent; every
 * data value placed in a link or an image goes through kit.url or kit.src. */
(() => {
  'use strict';

  const kit = window.kit;
  if (!kit) return;

  const root = document.documentElement;
  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];
  const str = (v) => (typeof v === 'string' ? v.trim() : '');
  const list = (v) => (Array.isArray(v) ? v : []);
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  /* a current role: no end date, or an end that reads "Present" */
  const isCurrent = (role) => !str(role.end) || /^present$/i.test(str(role.end));
  /* the motes have room beside the centred hero column only above this width (styles.css too) */
  const WIDE = '(min-width: 1181px)';
  /* below this width the nav is always the compact capsule (styles.css uses the class only) */
  const NARROW = '(max-width: 760px)';

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  const setText = (sel, value, scope) => {
    for (const node of $$(sel, scope)) node.textContent = value;
  };

  const onResize = (fn) => {
    let raf = 0;
    addEventListener('resize', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(fn);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fn);
  };

  /* ------------------------------------------------- the brand: initials and the first name */
  function brand(name) {
    const initials = kit.util.initials(name);
    const first = kit.util.firstName(name);
    setText('.js-initials', initials);
    setText('.js-first', first);
    if (!initials) $('.js-initials')?.remove();
    if (!first) $('.js-first')?.remove();
  }

  /* ------------------------- the name: the surname in the light, fitted to its column */
  function heroName(name) {
    const h1 = $('.js-name');
    if (!h1 || !name) return;
    const first = kit.util.firstName(name);
    const rest = name.slice(first.length).trim();
    h1.textContent = '';
    h1.append(el('span', 'name-first', first || name));
    if (first && rest) h1.append(' ', el('span', 'name-rest', rest));
    if (name.length > 24) root.dataset.nameLong = '1';
    // the longest unbreakable piece (a word, or a hyphenated word up to its hyphen) sets the size
    const pieces = name.split(/\s+/).flatMap((w) => w.split(/(?<=-)/));
    const fit = () => {
      h1.style.fontSize = '';
      const probe = el('span', 'name-rest');
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;left:0;top:0';
      h1.append(probe);
      let widest = 0;
      for (const p of pieces) {
        probe.textContent = p;
        widest = Math.max(widest, probe.getBoundingClientRect().width);
      }
      probe.remove();
      const room = h1.clientWidth;
      if (!room || widest <= room) return;
      const base = parseFloat(getComputedStyle(h1).fontSize);
      h1.style.fontSize = `${Math.max(26, Math.floor((base * room * 0.96) / widest))}px`;
    };
    fit();
    onResize(fit);
  }

  /* ---------------- the typed role: hero.title, then the title of each current role */
  function typed(data) {
    const node = $('.js-typed');
    if (!node) return;
    const title = str(obj(data.hero).title);
    // only what the person does now: a past title ("Analytics Intern") never takes the hero
    const roles = list(obj(data.experience).roles)
      .map(obj)
      .filter(isCurrent)
      .map((r) => str(r.title));
    const seen = new Set();
    const seq = [title, ...roles].filter((t) => {
      const key = t.toLowerCase();
      if (!t || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    // one title, or reduced motion (and so every screenshot): the line simply reads hero.title
    if (kit.reducedMotion || seq.length < 2) return;
    const line = node.parentElement;
    const shown = el('span', 'typed', title);
    shown.setAttribute('aria-hidden', 'true');
    const caret = el('span', 'caret');
    caret.setAttribute('aria-hidden', 'true');
    node.textContent = '';
    node.append(el('span', 'sr-only typed-final', title), shown, caret);
    // the line keeps the height of its tallest title, so nothing below it moves while it types
    const hold = () => {
      line.style.minHeight = '';
      let tallest = line.getBoundingClientRect().height;
      const was = shown.textContent;
      for (const t of seq) {
        shown.textContent = t;
        tallest = Math.max(tallest, line.getBoundingClientRect().height);
      }
      shown.textContent = was;
      line.style.minHeight = `${Math.ceil(tallest)}px`;
    };
    hold();
    onResize(hold);
    const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
    (async () => {
      await wait(2400);
      // one pass through the current titles, then back to the headline title, where it stays
      for (const next of [...seq.slice(1), title]) {
        for (let t = shown.textContent; t.length; t = t.slice(0, -1)) {
          shown.textContent = t.slice(0, -1);
          await wait(26);
        }
        for (let i = 1; i <= next.length; i++) {
          shown.textContent = next.slice(0, i);
          await wait(52);
        }
        if (next !== title) await wait(1700);
      }
      caret.classList.add('done');
    })();
  }

  /* ------------------------------------------------- hero pieces that may be empty */
  function tidyHero() {
    const portrait = $('.js-portrait');
    if (portrait && !portrait.querySelector('img')) portrait.remove();
    const where = $('.hero-where');
    if (where && !where.querySelector('[data-kit-text]')) where.remove();
    const role = $('.hero-role');
    if (role && !role.querySelector('.js-typed')) role.remove();
    const status = $('.finale-status');
    if (status && !status.querySelector('[data-kit-text]')) status.remove();
  }

  /* -------------------------------------------- roles: lead, Now, monograms, logos */
  function logoTone(img) {
    const read = () => {
      try {
        const size = 40;
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const g = c.getContext('2d', { willReadFrequently: true });
        g.drawImage(img, 0, 0, size, size);
        const px = g.getImageData(0, 0, size, size).data;
        let opaque = 0;
        let weight = 0;
        let light = 0;
        for (let i = 0; i < px.length; i += 4) {
          const a = px[i + 3] / 255;
          if (a < 0.1) continue;
          opaque++;
          weight += a;
          light += ((0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255) * a;
        }
        const cover = opaque / (size * size);
        // a logo on its own plate shows as it is; a mark on a transparent ground gets a glass mount,
        // and a dark mark a pale one so it never sinks into the night
        if (!weight || cover >= 0.82) return;
        img.parentElement.classList.add('is-open');
        if (light / weight < 0.38) img.parentElement.classList.add('is-pale');
      } catch {
        /* an unreadable image keeps the plain glass mount */
      }
    };
    if (img.complete && img.naturalWidth) read();
    else img.addEventListener('load', read, { once: true });
  }

  function roles(data) {
    const all = list(obj(data.experience).roles).map(obj);
    const items = $$('[data-kit-list="roles"] > .role');
    const anyLogo = items.some((item) => item.dataset.kitLogo === '1');
    items.forEach((item, i) => {
      const role = all[i] || {};
      const now = $('.js-now', item);
      if (!now || !isCurrent(role) || !(str(role.start) || str(role.end))) now?.remove();
      const mono = $('.js-mono', item);
      // a monogram keeps a role without a logo in step with the ones that have one
      if (mono && item.dataset.kitLogo === '0' && anyLogo && str(role.company)) {
        mono.textContent = kit.util.initials(str(role.company));
      } else mono?.remove();
      const where = $('.js-where', item);
      if (where && !where.querySelector('[data-kit-field]')) where.remove();
      const when = $('.role-when', item);
      if (when && !when.children.length) when.remove();
      const earlier = $('.js-earlier', item);
      if (earlier && !earlier.querySelector('.kit-earlier')) earlier.remove();
      const img = $('.role-logo img', item);
      if (img) logoTone(img);
    });
  }

  /* -------------------------- projects: numbers, stages, drawings, tiles, the subhead */
  function figure(cls, src, alt) {
    const fig = el('figure', cls);
    const img = document.createElement('img');
    const attrs = { src, alt, width: 640, height: 360, loading: 'lazy', decoding: 'async' };
    for (const k of Object.keys(attrs)) img.setAttribute(k, attrs[k]);
    fig.append(img);
    return fig;
  }

  function drawingCaption(fig, href, name) {
    if (!fig || fig.querySelector('.kit-caption')) return;
    const cap = el(fig.tagName === 'FIGURE' ? 'figcaption' : 'span', 'kit-caption fig-cap');
    cap.append(el('span', '', 'Architecture diagram'));
    if (href) {
      const a = el('a', 'fig-open', 'Open full size');
      a.setAttribute('href', href);
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('aria-label', `Open full size: ${name} architecture diagram`);
      cap.append(a);
    }
    fig.append(cap);
  }

  function projects(data) {
    const all = list(obj(data.projects).projects).map(obj);
    const layoutOn = /^(split|stack)$/.test(root.dataset.kitFeaturedLayout || '');
    const hasFeatured = !!$('[data-kit-list="featured"]');
    const isFeatured = (p) => layoutOn && hasFeatured && p.featured === true;
    const groups = [
      ['[data-kit-list="featured"] > .spot', all.filter(isFeatured)],
      ['[data-kit-list="projects"] > .work', all.filter((p) => !isFeatured(p))],
    ];
    for (const [sel, items] of groups) {
      $$(sel).forEach((card, i) => {
        const p = items[i] || {};
        const name = str(p.name);
        setText('.js-num', kit.util.pad(all.indexOf(p) + 1), card);
        const drawingHref = kit.url(p.image);
        const drawingSrc = kit.src(p.image);
        const render = $('.kit-media--render', card);
        // the kit shows the render when there is one; the drawing joins it as a second picture
        if (render && drawingSrc) {
          const pics = el('div', `${render.className.split(' ')[0]} media-pair`);
          const drawing = figure(
            'media-drawing kit-media--schematic',
            drawingSrc,
            `${name} architecture diagram`
          );
          render.replaceWith(pics);
          pics.append(render, drawing);
          drawingCaption(drawing, drawingHref, name);
        } else drawingCaption($('.kit-media--schematic', card), drawingHref, name);
        if (!card.classList.contains('spot') || card.dataset.kitMedia === '1') return;
        // a featured project without a picture: its highlights take the picture's place, set large
        const points = $('.js-points', card);
        if (points && points.children.length) {
          points.className = 'spot-stage';
          card.prepend(points);
          card.classList.add('is-staged');
        } else card.classList.add('is-plain');
      });
    }
    // in a grid where some cards have a picture, the others get a numbered tile in its place
    const works = $('[data-kit-list="projects"]');
    const cards = works ? $$(':scope > .work', works) : [];
    if (cards.some((c) => c.dataset.kitMedia === '1')) {
      for (const c of cards.filter((x) => x.dataset.kitMedia === '0')) {
        const tile = el('div', 'work-tile');
        tile.setAttribute('aria-hidden', 'true');
        tile.append(el('span', '', $('.js-num', c)?.textContent));
        c.prepend(tile);
      }
    }
    // a card with neither a description nor highlights keeps no empty text block
    for (const text of $$('.work-text')) if (!text.children.length) text.remove();
    // "More projects" heads the grid only when spotlights stand above it
    const spots = $$('[data-kit-list="featured"] > .spot').length;
    if (!spots || !cards.length) $('.js-more-head')?.remove();
  }

  /* ------------------------------------ the profile band and the credentials */
  function bands() {
    const profile = $('.js-profile');
    const n = profile ? $$(':scope > section', profile).length : 0;
    if (!n) $('.js-profile-band')?.remove();
    else profile.classList.toggle('is-single', n === 1);
    for (const h of $$('.edu-degree')) {
      const parts = h.querySelectorAll('[data-kit-field]');
      if (!parts.length) h.remove();
      else if (parts.length < 2) h.querySelector('.edu-sep')?.remove();
    }
    const creds = $('.js-creds-band');
    if (creds && !creds.querySelector('section')) creds.remove();
  }

  /* --------------------------------------------- contact channels get their names */
  const CHANNELS = {
    mail: 'Email',
    phone: 'Phone',
    github: 'GitHub',
    linkedin: 'LinkedIn',
    globe: 'Website',
  };

  function channels() {
    for (const a of $$('.channels .kit-contact')) {
      const use = a.querySelector('use');
      const kind = use ? (use.getAttribute('href') || '').replace('#kit-', '') : '';
      const value = a.querySelector('span');
      if (!value) continue;
      value.classList.add('ch-value');
      // a long address breaks after a slash, before an @, or after a dot that leaves a long part,
      // before it breaks inside a word (styles.css lets it do that only when no hint fits)
      const text = value.textContent;
      const parts = text.split(/(?<=\/)|(?=@)|(?<=\.)(?=[^./@]{6,})/);
      if (parts.length > 1) {
        value.textContent = '';
        for (const part of parts) {
          if (value.childNodes.length) value.append(document.createElement('wbr'));
          value.append(part);
        }
      }
      const box = el('span', 'ch-text');
      if (CHANNELS[kind]) box.append(el('span', 'ch-label', CHANNELS[kind]));
      value.replaceWith(box);
      box.append(value);
    }
  }

  /* ---------------------------------------------------------------- the nav capsule */
  function nav() {
    const shell = $('#nav');
    if (!shell) return;
    const toggle = $('.menu-toggle', shell);
    const menu = $('.menu', shell);
    if (!menu) return toggle?.remove();
    const set = (open) => {
      shell.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => set(!shell.classList.contains('open')));
    shell.addEventListener('click', (e) => {
      if (e.target.closest('.kit-nav__link')) set(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') set(false);
    });
    // the sections share the capsule only while they fit beside the brand; else the menu button
    const capsule = $('.capsule', shell);
    const brandLink = $('.brand', shell);
    const narrow = matchMedia(NARROW);
    const fit = () => {
      shell.classList.remove('is-compact');
      const room = shell.clientWidth - parseFloat(getComputedStyle(shell).paddingLeft) * 2;
      const cs = getComputedStyle(capsule);
      const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + 2;
      const need =
        brandLink.scrollWidth + (parseFloat(cs.columnGap) || 24) + menu.scrollWidth + pad;
      if (narrow.matches || need > room) shell.classList.add('is-compact');
      else set(false);
    };
    fit();
    onResize(fit);
  }

  /* ------------------------------------------- motion: the motes beside the hero */
  function motes() {
    const hero = $('#hero');
    if (!hero) return;
    // two fields, one in each gutter beside the centred column, so a mote never drifts under text;
    // they exist only above 1180px (the stylesheet hides them below), and stop when a resize or a
    // rotation crosses that width
    const wide = matchMedia(WIDE);
    const COLORS = ['255, 107, 107', '78, 205, 196', '177, 156, 217', '255, 255, 255'];
    const fields = [];
    let raf = 0;
    let visible = true;
    const make = (side) => {
      const c = el('canvas', `motes motes--${side}`);
      c.setAttribute('aria-hidden', 'true');
      const g = c.getContext('2d');
      if (!g) return null;
      hero.prepend(c);
      return { c, g, w: 0, h: 0, dots: [] };
    };
    const size = (f) => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      f.w = f.c.clientWidth;
      f.h = f.c.clientHeight;
      f.c.width = Math.round(f.w * dpr);
      f.c.height = Math.round(f.h * dpr);
      f.g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(46, (f.w * f.h) / 9000));
      f.dots = Array.from({ length: n }, (_, i) => ({
        x: Math.random() * f.w,
        y: Math.random() * f.h,
        r: 0.8 + Math.random() * 1.8,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -0.08 - Math.random() * 0.22,
        tone: COLORS[i % COLORS.length],
        phase: Math.random() * Math.PI * 2,
      }));
    };
    const running = () => fields.length && visible && !document.hidden && wide.matches;
    const draw = (t) => {
      raf = running() ? requestAnimationFrame(draw) : 0;
      for (const f of fields) {
        const { g, w, h, dots } = f;
        g.clearRect(0, 0, w, h);
        for (const d of dots) {
          d.x += d.vx;
          d.y += d.vy;
          if (d.y < -6) {
            d.y = h + 6;
            d.x = Math.random() * w;
          }
          if (d.x < -6) d.x = w + 6;
          if (d.x > w + 6) d.x = -6;
        }
        // the old field's threads, between motes that drift close
        for (let i = 0; i < dots.length; i++) {
          for (let j = i + 1; j < dots.length; j++) {
            const dx = dots[i].x - dots[j].x;
            const dy = dots[i].y - dots[j].y;
            const dist = Math.hypot(dx, dy);
            if (dist > 96) continue;
            g.strokeStyle = `rgba(255, 255, 255, ${(0.12 * (1 - dist / 96)).toFixed(3)})`;
            g.lineWidth = 1;
            g.beginPath();
            g.moveTo(dots[i].x, dots[i].y);
            g.lineTo(dots[j].x, dots[j].y);
            g.stroke();
          }
        }
        for (const d of dots) {
          const a = 0.45 + 0.4 * Math.sin(t / 900 + d.phase);
          g.fillStyle = `rgba(${d.tone}, ${a.toFixed(3)})`;
          g.beginPath();
          g.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          g.fill();
        }
      }
    };
    const go = () => {
      if (!raf && running()) raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      for (const f of fields) f.g.clearRect(0, 0, f.w, f.h);
    };
    const build = () => {
      if (fields.length || !wide.matches) return;
      for (const side of ['l', 'r']) {
        const f = make(side);
        if (f) fields.push(f);
      }
    };
    const update = () => {
      if (!wide.matches) return stop();
      build();
      for (const f of fields) size(f);
      go();
    };
    update();
    wide.addEventListener('change', update);
    onResize(() => {
      if (fields.length && wide.matches) for (const f of fields) size(f);
    });
    document.addEventListener('visibilitychange', go);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        go();
      }).observe(hero);
    }
  }

  function reveals() {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('revealed');
          io.unobserve(e.target);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    const sel =
      '.head, .spot, .work, .about .story, .facts, .toolkit, .role, .edu, .cert, .finale-inner';
    for (const node of $$(sel)) {
      node.classList.add('reveal');
      io.observe(node);
    }
  }

  kit.on('ready', (data) => {
    const name = str(obj(data.hero).name);
    brand(name);
    heroName(name);
    tidyHero();
    roles(data);
    projects(data);
    bands();
    channels();
    for (const a of $$('a[href^="http"]')) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    nav();
    typed(data);
    if (!kit.reducedMotion) {
      root.classList.add('motion-ok');
      motes();
      reveals();
    }
  });
})();
