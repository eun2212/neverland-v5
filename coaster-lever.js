'use strict';
(function () {
  // Mount after the gears latch. The caller owns ride start and surrounding UI.
  window.NEVERLAND_COASTER_LEVER = {
    mount(container, options = {}) {
      if (!container || typeof options.onStart !== 'function') throw new TypeError('container and onStart are required');
      const root = document.createElement('section');
      root.className = 'coaster-lever';
      root.innerHTML = '<h2>출발 레버</h2><p>레버를 오른쪽 끝까지 당기세요. 방향키로도 움직일 수 있습니다.</p><div class="coaster-lever__scene"><div class="coaster-lever__track"><div class="coaster-lever__rail-base" aria-hidden="true"></div><div class="coaster-lever__slot"></div><div class="coaster-lever__stop" aria-hidden="true">STOP</div><div class="coaster-lever__warning" aria-hidden="true"></div><div class="coaster-lever__go" aria-hidden="true">✦ GO! <small>♥</small></div><button type="button" class="coaster-lever__handle" role="slider" aria-label="출발 레버" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="출발 전, 왼쪽 끝"><span aria-hidden="true"></span></button><div class="coaster-lever__hand" aria-hidden="true"></div></div><div class="coaster-lever__glitch" aria-hidden="true"></div></div><p class="coaster-lever__status" role="status" aria-live="polite">레버를 오른쪽으로 당기세요.</p><button type="button" class="coaster-lever__cancel">돌아가기</button>';
      container.append(root);
      const track = root.querySelector('.coaster-lever__track');
      const handle = root.querySelector('.coaster-lever__handle');
      const hand = root.querySelector('.coaster-lever__hand');
      const status = root.querySelector('.coaster-lever__status');
      const cancel = root.querySelector('.coaster-lever__cancel');
      {
        const handImage = options.handImage === undefined ? 'assets/keeper-coaster-hand.png' : options.handImage;
        if (handImage) {
        const img = document.createElement('img');
        img.src = handImage; img.alt = '';
        img.addEventListener('error', () => img.remove());
        hand.append(img);
        }
      }
      let value = 0, furthest = 0, drag = null, dragStartX = 0, dragStartValue = 0, maxX = 0, state = 'ready', timer = null;
      const reduced = () => options.reducedMotion === undefined
        ? !!(window.NEVERLAND_TOOLS?.settings?.reduced || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
        : (typeof options.reducedMotion === 'function' ? !!options.reducedMotion() : !!options.reducedMotion);
      function paint() {
        root.style.setProperty('--lever-position', value + '%');
        handle.setAttribute('aria-valuenow', String(Math.round(value)));
        handle.setAttribute('aria-valuetext', value === 0 ? '출발 전, 왼쪽 끝' : value === 100 ? '출발, 오른쪽 끝' : Math.round(value) + '%');
      }
      function release() {
        if (drag !== null) {
          const id = drag; drag = null;
          if (handle.hasPointerCapture?.(id)) handle.releasePointerCapture(id);
        }
      }
      function finish(forced) {
        if (state === 'destroyed' || state === 'started') return;
        state = 'started'; timer = null; value = 100; paint();
        handle.disabled = true; cancel.disabled = true;
        status.textContent = '열차가 출발합니다.';
        options.onStart({ forced });
      }
      function force() {
        if (state !== 'ready') return;
        state = 'forcing'; release();
        root.classList.add('is-forcing');
        if (reduced()) root.classList.add('is-reduced');
        handle.disabled = true;
        status.textContent = '키퍼의 손이 레버를 오른쪽으로 밀어 출발시킵니다.';
        // Keep cancellation available until the start callback actually runs.
        if (reduced()) { value = 100; paint(); timer = setTimeout(() => finish(true), 0); }
        else {
          // Separate frames allow the CSS transition to begin at the current position.
          timer = setTimeout(() => { if (state !== 'forcing') return; value = 100; paint(); timer = setTimeout(() => finish(true), 700); }, 40);
        }
      }
      function move(next) {
        if (state !== 'ready') return;
        // A small tolerance avoids interpreting pointer jitter as a deliberate reversal.
        if (next < -3 || (furthest > 1 && next < furthest - 3)) { force(); return; }
        next = Math.max(0, Math.min(100, next));
        value = next; furthest = Math.max(furthest, value); paint();
        if (value >= 100) finish(false);
      }
      function pointerValue(event) {
        const rect = track.getBoundingClientRect();
        return rect.width ? dragStartValue + (event.clientX - dragStartX) / rect.width * 100 : value;
      }
      handle.addEventListener('pointerdown', event => {
        if (state !== 'ready' || drag !== null || event.button !== 0) return;
        drag = event.pointerId; dragStartX = maxX = event.clientX; dragStartValue = value; handle.setPointerCapture(drag); event.preventDefault();
      });
      function pointerMove(event) {
        if (drag !== event.pointerId) return;
        const width = track.getBoundingClientRect().width;
        if (width && event.clientX < maxX - Math.max(3, width * .03)) { force(); return; }
        maxX = Math.max(maxX, event.clientX); move(pointerValue(event));
      }
      handle.addEventListener('pointermove', pointerMove);
      handle.addEventListener('pointerup', event => { if (drag === event.pointerId) { pointerMove(event); release(); } });
      for (const name of ['pointercancel', 'lostpointercapture']) handle.addEventListener(name, event => { if (drag === event.pointerId) drag = null; });
      handle.addEventListener('keydown', event => {
        if (state !== 'ready') return;
        let next;
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = value + 10;
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = value - 10;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = 100;
        else return;
        event.preventDefault(); move(next);
      });
      function destroy() {
        if (state === 'destroyed') return;
        state = 'destroyed'; clearTimeout(timer); release(); root.remove();
      }
      cancel.addEventListener('click', () => { if (state === 'started' || state === 'destroyed') return; destroy(); options.onCancel?.(); });
      root.addEventListener('keydown', event => { if (event.key === 'Escape' && state !== 'started' && state !== 'destroyed') { event.preventDefault(); destroy(); options.onCancel?.(); } });
      paint();
      if (options.focus !== false) handle.focus();
      return { element: root, destroy };
    }
  };
})();
