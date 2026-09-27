(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;

  const ease = 'cubic-bezier(.22, .75, .2, 1)';
  const targets = new Map();
  const headingSources = new Map();
  const running = new Map();
  const progress = document.querySelector('.reading-progress');
  const headingSelector = '.hero h1, .members-intro h1, main h2, .player-info h3';
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) reveal(entry.target); });
  }, { threshold: 0, rootMargin: '0px 0px -7% 0px' });

  function stop(element) {
    const animations = running.get(element);
    running.delete(element);
    animations?.forEach(animation => animation.cancel());
  }

  function show(element) {
    stop(element);
    element.dataset.revealState = 'shown';
    observer.unobserve(element);
  }

  function reveal(element, immediate = false) {
    const settings = targets.get(element);
    if (!settings || element.dataset.revealState === 'shown') return;
    observer.unobserve(element);
    if (immediate || reducedMotion.matches) { show(element); return; }

    stop(element);
    element.dataset.revealState = 'active';
    const timing = { duration: 760, easing: ease, delay: settings.delay, fill: 'both' };
    const animations = [];
    if (settings.type === 'text') {
      element.querySelectorAll('.reveal-line-content').forEach((line, index) => {
        animations.push(line.animate([
          { transform: 'translateY(112%)', opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 }
        ], { ...timing, duration: 920, delay: settings.delay + index * 105 }));
      });
    } else if (settings.type === 'image') {
      animations.push(element.animate([
        { clipPath: 'inset(100% 0 0 0)', opacity: 1 },
        { clipPath: 'inset(0% 0 0 0)', opacity: 1 }
      ], { ...timing, duration: 1100 }));
      const image = element.querySelector('img');
      if (image) animations.push(image.animate([
        { transform: 'scale(1.12)' }, { transform: 'scale(1)' }
      ], { ...timing, duration: 1400 }));
    } else if (settings.type === 'still') {
      animations.push(element.animate([{ opacity: 0 }, { opacity: 1 }], timing));
    } else {
      animations.push(element.animate([
        { opacity: 0, transform: 'translateY(22px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], timing));
    }

    running.set(element, animations);
    Promise.all(animations.map(animation => animation.finished)).then(() => {
      if (running.get(element) === animations) show(element);
    }).catch(() => {});
  }

  function observe(element, type, delay = 0, alreadyShown = false) {
    targets.set(element, { type, delay });
    if (reducedMotion.matches || alreadyShown) { show(element); return; }
    element.dataset.revealState = 'pending';
    observer.observe(element);
  }

  // Measure the original text before wrapping, so Chinese and English keep their natural lines.
  function splitHeading(heading) {
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    const lines = [];
    let node;
    while ((node = walker.nextNode())) {
      let offset = 0;
      for (const character of node.textContent) {
        const end = offset + character.length;
        range.setStart(node, offset);
        range.setEnd(node, end);
        const rect = range.getBoundingClientRect();
        offset = end;
        if (!rect.height) continue;
        let line = lines.find(item => Math.abs(item.top - rect.top) < 3);
        if (!line) { line = { top: rect.top, runs: [] }; lines.push(line); }
        const accent = Boolean(node.parentElement.closest('em'));
        const previous = line.runs.at(-1);
        if (previous && previous.accent === accent) previous.text += character;
        else line.runs.push({ accent, text: character });
      }
    }
    if (!lines.length) return false;

    const accessibleText = heading.innerText.replace(/\s+/g, ' ').trim();
    const visual = document.createElement('span');
    visual.className = 'text-reveal-visual';
    visual.setAttribute('aria-hidden', 'true');
    lines.forEach(line => {
      const mask = document.createElement('span');
      mask.className = 'reveal-line';
      const text = document.createElement('span');
      text.className = 'reveal-line-content';
      line.runs.forEach(run => {
        if (run.accent) {
          const emphasis = document.createElement('em');
          emphasis.textContent = run.text;
          text.append(emphasis);
        } else text.append(document.createTextNode(run.text));
      });
      mask.append(text);
      visual.append(mask);
    });
    heading.setAttribute('aria-label', accessibleText);
    heading.replaceChildren(visual);
    return true;
  }

  function prepareHeadings({ newCopy = false, replay = false, continueActive = false } = {}) {
    document.querySelectorAll(headingSelector).forEach(heading => {
      const wasShown = heading.dataset.revealState === 'shown' ||
        (!continueActive && heading.dataset.revealState === 'active');
      stop(heading);
      const source = headingSources.get(heading);
      // Language changes replace section headings, but the award title is shared by both languages.
      if (source && (!newCopy || heading.querySelector('.text-reveal-visual'))) {
        heading.innerHTML = source.html;
        if (source.label === null) heading.removeAttribute('aria-label');
        else heading.setAttribute('aria-label', source.label);
      } else {
        heading.removeAttribute('aria-label');
        headingSources.set(heading, { html: heading.innerHTML, label: heading.getAttribute('aria-label') });
      }
      if (reducedMotion.matches || !splitHeading(heading)) {
        show(heading);
        return;
      }
      observe(heading, 'text', heading.matches('h1') ? 130 : 70, wasShown && !replay);
    });
  }

  function add(selector, type, delay = 0, stagger = 0) {
    document.querySelectorAll(selector).forEach((element, index) => {
      observe(element, type, delay + (index % 3) * stagger);
    });
  }

  function updateProgress() {
    const distance = document.documentElement.scrollHeight - innerHeight;
    const fraction = distance > 0 ? Math.min(1, Math.max(0, scrollY / distance)) : 0;
    progress.style.transform = `scaleX(${fraction})`;
  }

  let scrollFrame = 0;
  addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => { updateProgress(); scrollFrame = 0; });
  }, { passive: true });

  let resizeTimer;
  let lastWidth = innerWidth;
  addEventListener('resize', () => {
    updateProgress();
    if (innerWidth === lastWidth) return;
    lastWidth = innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => prepareHeadings(), 150);
  });

  document.addEventListener('site:languagechange', () => {
    prepareHeadings({ newCopy: true, replay: true });
    updateProgress();
  });
  document.addEventListener('focusin', event => {
    for (const [element] of targets) {
      if (element.contains(event.target)) reveal(element, true);
    }
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) targets.forEach((settings, element) => show(element));
    prepareHeadings();
  });
  addEventListener('beforeprint', () => {
    targets.forEach((settings, element) => show(element));
  });
  addEventListener('pageshow', event => {
    if (event.persisted) targets.forEach((settings, element) => show(element));
  });

  try {
    prepareHeadings();
    add('main .eyebrow', 'fade');
    add('.hero-lede', 'fade', 310);
    add('.hero-actions', 'fade', 430);
    add('.badge-frame', 'image', 200);
    add('.hero-art .art-label, .art-dot', 'fade', 400, 70);
    add('.art-orbit', 'still', 400, 70);
    add('.stats-content > p, .team-intro, .people-copy > p:not(.eyebrow), .join-side > p', 'fade', 140);
    add('.stat-grid > div', 'fade', 180, 80);
    add('.player-portrait', 'image');
    add('.player-info > p, .award-split, .player-info > button', 'fade', 180, 60);
    add('.feature-head > .text-link, .feature-head > .content-note, .people-copy > button, .join-side > button', 'fade', 160);
    add('.account-entry', 'fade', 80);
    add('.article-image', 'image', 60, 110);
    add('.article-meta, .article-card > h3, .read-more', 'fade', 140, 65);
    add('.team-list > button', 'fade', 60, 70);
    add('.person', 'image', 50, 120);
    add('.photo-frame', 'image', 50, 140);
    add('.life-heading > p:last-child, .story-photo figcaption, .photo-choice', 'fade', 140);
    add('.activity-grid > article', 'fade', 90, 100);
    add('.club-card', 'fade', 40, 45);
    add('.portrait-placeholder, .member-portrait', 'image', 50);
    add('.members-note, .member-name', 'fade', 120);
    updateProgress();
    document.fonts?.ready.then(() => prepareHeadings({ continueActive: true })).catch(() => {});
  } catch {
    observer.disconnect();
    targets.forEach((settings, element) => show(element));
    headingSources.forEach((source, heading) => {
      heading.innerHTML = source.html;
      heading.removeAttribute('aria-label');
    });
  }
})();
