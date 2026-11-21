'use strict';
(function () {
  // Mount after the gears latch. The caller owns ride start and surrounding UI.
  window.NEVERLAND_COASTER_LEVER = {
    mount(container, options = {}) {
      if (!container || typeof options.onStart !== 'function') throw new TypeError('container and onStart are required');
      const root = document.createElement('section');
      root.className = 'coaster-lever';
      root.innerHTML = '<h2>출발 레버</h2><p role="status" class="coaster-lever__status" aria-live="polite">레버를 오른쪽 끝까지 당기세요. 방향키도 사용할 수 있어요.</p><div class="coaster-lever__scene"><div class="coaster-lever__track"><div class="coaster-lever__rail-base" aria-hidden="true"></div><div class="coaster-lever__slot"></div><div class="coaster-lever__stop" aria-hidden="true">STOP<img src="assets/captain-lever-sign-stop.png?v=20261119" alt="" onerror="this.remove()"></div><div class="coaster-lever__warning" aria-hidden="true"></div><div class="coaster-lever__go" aria-hidden="true">GO<img src="assets/captain-lever-sign-go.png?v=20261119" alt="" onerror="this.remove()"></div><button type="button" class="coaster-lever__handle" role="slider" aria-label="출발 레버" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="출발 전, 왼쪽 끝"><span aria-hidden="true"></span></button><div class="coaster-lever__hand" aria-hidden="true"></div></div><div class="coaster-lever__glitch" aria-hidden="true"></div></div><button type="button" class="coaster-lever__cancel">돌아가기</button>';
      container.append(root);
      const track = root.querySelector('.coaster-lever__track');
      const handle = root.querySelector('.coaster-lever__handle');
      const hand = root.querySelector('.coaster-lever__hand');
      const status = root.querySelector('.coaster-lever__status');
      const cancel = root.querySelector('.coaster-lever__cancel');
      {
        const handImage = options.handImage === undefined ? 'assets/keeper-captain-lever-hand-v2.png?v=20261119' : options.handImage;
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
        handle.style.left = value + '%';
        handle.setAttribute('aria-valuenow', String(Math.round(value)));
        options.onChange?.(value);
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
        status.textContent = '놀이기구가 출발합니다.';
        options.onStart({ forced });
      }
      function force() {
        if (state !== 'ready') return;
        state = 'advising'; release();
        handle.setAttribute('aria-disabled', 'true');
        status.textContent = '키퍼: “왼쪽이 아니라 오른쪽이에요. 천천히, 제가 도와드릴게요.”';
        // Give the player time to read before the hand takes over, even with reduced motion.
        timer = setTimeout(() => {
          if (state !== 'advising') return;
          state = 'forcing';
          root.classList.add('is-forcing');
          if (reduced()) root.classList.add('is-reduced');
          if (reduced()) { value = 100; paint(); timer = setTimeout(() => finish(true), 1200); }
          else {
            timer = setTimeout(() => {
              if (state !== 'forcing') return;
              value = 100; paint(); timer = setTimeout(() => finish(true), 2500);
            }, 40);
          }
        }, 3000);
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
