(() => {
  const root = document.querySelector('.bouquet-carousel');
  const viewport = root.querySelector('.carousel-viewport');
  const track = root.querySelector('.carousel-track');
  const cards = [...root.querySelectorAll('.bouquet-card')];
  const dots = [...root.querySelectorAll('[data-slide]')];
  const previous = root.querySelector('[data-direction="prev"]');
  const next = root.querySelector('[data-direction="next"]');
  const status = root.querySelector('#carousel-status');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = 2;
  let requestedIndex = 2;
  let renderFrame = 0;
  let announceTimer;
  let pointerDrag = null;
  let suppressClick = false;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const announce = () => {
    const card = cards[active];
    status.textContent = `${active + 1} из ${cards.length}. ${card.dataset.name}, ${card.dataset.price} тенге.`;
  };

  for (const card of cards) {
    const message = `Здравствуйте! Хочу заказать букет «${card.dataset.name}» (${card.dataset.price} ₸). Подскажите, пожалуйста, наличие и варианты доставки.`;
    const link = card.querySelector('.order-link');
    link.href = `https://wa.me/77082204675?text=${encodeURIComponent(message)}`;
    link.setAttribute('aria-label', `Заказать ${card.dataset.name} в WhatsApp`);
  }

  function render() {
    renderFrame = 0;
    const bounds = viewport.getBoundingClientRect();
    const center = bounds.left + bounds.width / 2;
    const step = cards[0].offsetWidth + parseFloat(getComputedStyle(track).gap);
    let nearest = active;
    let nearestDistance = Infinity;

    cards.forEach((card, index) => {
      const box = card.getBoundingClientRect();
      const delta = box.left + box.width / 2 - center;
      const unit = clamp(delta / step, -2, 2);
      const proximity = Math.max(0, 1 - Math.abs(unit));
      const focus = Math.pow(proximity, .8);
      const distance = Math.abs(delta);
      if (distance < nearestDistance) {
        nearest = index;
        nearestDistance = distance;
      }
      card.style.setProperty('--proximity', focus.toFixed(4));
      card.style.setProperty('--card-turn', `${reducedMotion.matches ? 0 : -unit * 14}deg`);
      card.style.setProperty('--card-scale', reducedMotion.matches ? '1' : (.86 + focus * .14).toFixed(4));
      card.style.setProperty('--bouquet-scale', reducedMotion.matches ? '.94' : (.88 + focus * .24).toFixed(4));
      card.style.setProperty('--bouquet-lift', `${reducedMotion.matches ? 0 : -focus * 23}px`);
      card.style.setProperty('--bouquet-turn', `${reducedMotion.matches ? 0 : -unit * 2.4}deg`);
      card.style.zIndex = String(Math.round(focus * 100));
    });

    active = nearest;
    cards.forEach((card, index) => {
      card.classList.toggle('is-active', index === active);
      if (index !== active) {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      }
    });
    dots.forEach((dot, index) => {
      if (index === active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    previous.disabled = active === 0;
    next.disabled = active === cards.length - 1;
    root.dataset.activeIndex = String(active);
  }

  function scheduleRender() {
    if (!renderFrame) renderFrame = requestAnimationFrame(render);
  }

  function goTo(index, animate = true) {
    requestedIndex = clamp(index, 0, cards.length - 1);
    const card = cards[requestedIndex];
    const bounds = viewport.getBoundingClientRect();
    const box = card.getBoundingClientRect();
    const left = viewport.scrollLeft + box.left + box.width / 2 - bounds.left - bounds.width / 2;
    viewport.scrollTo({left, behavior: animate && !reducedMotion.matches ? 'smooth' : 'auto'});
    scheduleRender();
  }

  previous.addEventListener('click', () => goTo(active - 1));
  next.addEventListener('click', () => goTo(active + 1));
  dots.forEach((dot, index) => dot.addEventListener('click', () => goTo(index)));
  cards.forEach((card, index) => {
    card.querySelector('.bouquet-preview').addEventListener('click', () => goTo(index));
    card.addEventListener('focusin', () => {
      if (active !== index) goTo(index);
    });
    card.addEventListener('pointermove', event => {
      if (index !== active || event.pointerType !== 'mouse' || pointerDrag?.dragging || reducedMotion.matches) return;
      const box = card.getBoundingClientRect();
      const x = clamp((event.clientX - box.left) / box.width - .5, -.5, .5);
      const y = clamp((event.clientY - box.top) / box.height - .5, -.5, .5);
      card.style.setProperty('--tilt-x', `${-y * 5}deg`);
      card.style.setProperty('--tilt-y', `${x * 9}deg`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  });

  viewport.addEventListener('keydown', event => {
    const targets = {ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: cards.length - 1};
    if (Object.hasOwn(targets, event.key)) {
      event.preventDefault();
      goTo(targets[event.key]);
    }
  });
  viewport.addEventListener('scroll', () => {
    scheduleRender();
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      requestedIndex = active;
      announce();
    }, 180);
  }, {passive: true});

  // Touch and trackpads use native scrolling/snap. This adds mouse dragging.
  viewport.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('a')) return;
    pointerDrag = {id: event.pointerId, x: event.clientX, scroll: viewport.scrollLeft, dragging: false};
  });
  viewport.addEventListener('pointermove', event => {
    if (!pointerDrag || event.pointerId !== pointerDrag.id) return;
    const dx = event.clientX - pointerDrag.x;
    if (!pointerDrag.dragging && Math.abs(dx) > 7) {
      pointerDrag.dragging = true;
      suppressClick = true;
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add('is-dragging');
    }
    if (pointerDrag.dragging) {
      event.preventDefault();
      viewport.scrollLeft = pointerDrag.scroll - dx;
    }
  });
  function finishDrag(event) {
    if (!pointerDrag || event.pointerId !== pointerDrag.id) return;
    const wasDragging = pointerDrag.dragging;
    pointerDrag = null;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    viewport.classList.remove('is-dragging');
    if (wasDragging) {
      render();
      goTo(active);
      setTimeout(() => { suppressClick = false; }, 0);
    }
  }
  viewport.addEventListener('pointerup', finishDrag);
  viewport.addEventListener('pointercancel', finishDrag);
  viewport.addEventListener('click', event => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  viewport.addEventListener('dragstart', event => event.preventDefault());

  let resizeFrame;
  new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => goTo(requestedIndex, false));
  }).observe(viewport);
  reducedMotion.addEventListener('change', () => {
    cards.forEach(card => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
    goTo(active, false);
    scheduleRender();
  });
  goTo(active, false);
  render();
})();
