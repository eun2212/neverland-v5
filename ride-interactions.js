(function () {
  'use strict';
  let musicAudio = null;
  function musicBoxNote(index) {
    const volume = window.NEVERLAND_BGM?.state?.muted ? 0 : (window.NEVERLAND_TOOLS?.settings?.volume ?? 65) / 100;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio || !volume) return;
    try {
      musicAudio ||= new Audio();
      if (musicAudio.state === 'suspended') musicAudio.resume().catch(() => {});
      const t = musicAudio.currentTime, oscillator = musicAudio.createOscillator(), gain = musicAudio.createGain();
      oscillator.type = 'sine'; oscillator.frequency.setValueAtTime([523.25, 659.25, 783.99, 1046.5, 987.77, 783.99, 659.25, 587.33, 659.25, 783.99][index % 10], t);
      gain.gain.setValueAtTime(.07 * volume, t); gain.gain.exponentialRampToValueAtTime(.0001, t + .35);
      oscillator.connect(gain).connect(musicAudio.destination); oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(t); oscillator.stop(t + .36);
    } catch (_) { /* Audio is optional; it must never prevent the ride from working. */ }
  }
  // The story owns the surrounding modal and ride lifecycle. This component owns
  // interaction, its timers, and its pointer handlers only while mounted.
  window.NEVERLAND_RIDE_INTERACTIONS = {
    mount(container, options = {}) {
      if (!container || ![1, 2, 4].includes(options.ride) || typeof options.onStart !== 'function') throw new TypeError('ride and onStart are required');
      const ride = options.ride;
      const copy = {
        1: { name: '네버랜드로의 비행', hint: '1부터 5까지 별을 순서대로 눌러 이어 주세요.', wait: '키퍼: “천천히 해도 괜찮아요. 별들을 이어 볼까요?”', force: '키퍼: “별들이 길을 잃겠어요. 제가 이어 드릴게요.”' },
        2: { name: '잃어버린 아이들의 회전목마', hint: '태엽을 시계 방향으로 돌려 오르골을 감아 주세요.', wait: '키퍼: “서두르지 않아도 돼요. 태엽을 돌려 볼까요?”', force: '키퍼: “이 노래는 끝까지 들어야 해요. 제가 도와드릴게요.”' },
        4: { name: '팅커벨의 티파티', hint: '주전자를 아래로 당겨 찻잔에 차를 따라 주세요.', wait: '키퍼: “괜찮아요. 천천히 차를 따라 볼까요?”', force: '키퍼: “차가 식겠어요. 제가 따라 드릴게요.”' }
      }[ride];
      const root = document.createElement('section');
      root.className = 'ride-interaction ride-interaction--' + ride;
      const handImage = {1:'keeper-hand-stars.png',2:'keeper-hand-winding.png',4:'keeper-hand-pouring.png'}[ride];
      root.innerHTML = '<h2></h2><p class="ride-interaction__hint"></p><p class="ride-interaction__status" role="status" aria-live="polite"></p><div class="ride-interaction__scene"><div class="ride-interaction__art" aria-hidden="true"></div><div class="ride-interaction__controls"></div><img class="ride-interaction__reflection" src="assets/'+handImage+'" alt="" aria-hidden="true"><img class="ride-interaction__hand" src="assets/'+handImage+'" alt="" aria-hidden="true"></div><button type="button" class="ride-interaction__refuse">멈추고 싶어요</button>';
      container.append(root);
      root.querySelector('h2').textContent = copy.name;
      root.querySelector('.ride-interaction__hint').textContent = copy.hint;
      const status = root.querySelector('.ride-interaction__status');
      const scene = root.querySelector('.ride-interaction__scene');
      const controls = root.querySelector('.ride-interaction__controls');
      const refuse = root.querySelector('.ride-interaction__refuse');
      let state = 'ready', progress = 0, pointer = null, lastAngle = 0, timer = null, observer = null, lastNote = -1;
      const starPoints = [[14, 70], [31, 34], [51, 57], [70, 24], [87, 51]];
      function schedule(fn, delay) { clearTimeout(timer); timer = setTimeout(fn, delay); }
      function destroy() {
        if (state === 'destroyed') return;
        state = 'destroyed'; clearTimeout(timer); observer?.disconnect(); root.remove();
      }
      function finish(forced) {
        if (state === 'done' || state === 'destroyed') return;
        state = 'done'; clearTimeout(timer); observer?.disconnect();
        refuse.disabled = true; controls.querySelectorAll('button').forEach(b => b.disabled = true);
        status.textContent = '놀이기구가 출발합니다.';
        options.onStart({ forced });
      }
      function idle() {
        if (state !== 'ready') return;
        status.textContent = copy.wait;
        schedule(force, 15000);
      }
      function activity() { if (state === 'ready') { status.textContent = ''; schedule(idle, 25000); } }
      function paint() {
        root.style.setProperty('--progress', String(progress));
        if (ride === 4) {
          root.style.setProperty('--pour-y', (progress * .36) + '%');
          root.style.setProperty('--pour-angle', (-progress * .38) + 'deg');
          root.style.setProperty('--tea-fill', Math.max(0, Math.min(1, progress / 100)).toString());
          // Anchor the glove's grip to the teapot handle, including its tilt and
          // downward travel. Both positions are in scene pixels.
          const bounds = scene.getBoundingClientRect();
          const pot = root.querySelector('.ride-interaction__pot');
          if (pot && bounds.width && bounds.height) {
            const size = pot.offsetWidth || Math.max(125, Math.min(210, bounds.width * .86 * .36));
            const angle = -progress * .38 * Math.PI / 180;
            const handleX = .35 * size, handleY = -.04 * size;
            const x = bounds.width * .5 + Math.cos(angle) * handleX - Math.sin(angle) * handleY;
            const y = bounds.height * .077 + size * .5 + Math.sin(angle) * handleX + Math.cos(angle) * handleY + size * progress * .0036;
            root.style.setProperty('--hand-pour-x', x + 'px');
            root.style.setProperty('--hand-pour-y', y + 'px');
          }
        }
        if (ride === 1) {
          const point = starPoints[Math.max(0, Math.min(starPoints.length - 1, progress - 1))];
          // Controls occupy 86% × 90% of the scene, inset by 7% × 5%.
          // Position the fingertip in scene coordinates, not the image corner.
          root.style.setProperty('--hand-x', (7 + point[0] * .86) + '%');
          root.style.setProperty('--hand-y', (5 + point[1] * .9) + '%');
        }
        const wheel = root.querySelector('.ride-interaction__wheel');
        if (wheel) { wheel.style.transform = 'rotate(' + (progress * 3.6) + 'deg)'; wheel.setAttribute('aria-valuenow', String(Math.round(progress))); }
        const pot = root.querySelector('.ride-interaction__pot');
        if (pot) pot.setAttribute('aria-valuenow', String(Math.round(progress)));
        root.querySelectorAll('.ride-interaction__star').forEach((star, index) => {
          star.classList.toggle('is-lit', index < progress);
          star.setAttribute('aria-label', (index + 1) + '번째 별' + (index < progress ? ' · 이어짐' : ''));
        });
        root.querySelectorAll('.ride-interaction__line').forEach((line, index) => line.classList.toggle('is-lit', index < progress - 1));
      }
      function force() {
        if (state !== 'ready') return;
        state = 'advising'; pointer = null; clearTimeout(timer);
        status.textContent = copy.force; refuse.disabled = true;
        schedule(() => {
          if (state !== 'advising') return;
          state = 'forcing'; root.classList.add('is-forcing');
          // The reflection leads the physical hand on the teacups.
          if (ride === 4) root.classList.add('has-reflection');
          schedule(() => {
            if (state !== 'forcing') return;
            if (ride === 1) {
              const joinNext = () => {
                if (state !== 'forcing') return;
                if (progress < starPoints.length) { progress++; paint(); schedule(joinNext, 500); }
                else schedule(() => finish(true), 500);
              };
              joinNext();
            } else { progress = 100; paint(); schedule(() => finish(true), 2600); }
          }, ride === 4 ? 1100 : 450);
        }, 2300);
      }
      refuse.addEventListener('click', force);
      if (ride === 1) {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('preserveAspectRatio', 'none'); svg.classList.add('ride-interaction__lines');
        starPoints.slice(1).forEach((point, i) => { const line = document.createElementNS(ns, 'line'); line.setAttribute('x1', starPoints[i][0]); line.setAttribute('y1', starPoints[i][1]); line.setAttribute('x2', point[0]); line.setAttribute('y2', point[1]); line.classList.add('ride-interaction__line'); svg.append(line); });
        controls.append(svg);
        starPoints.forEach((point, index) => {
          const star = document.createElement('button'); star.type = 'button'; star.className = 'ride-interaction__star'; star.textContent = String(index + 1); star.style.left = point[0] + '%'; star.style.top = point[1] + '%';
          star.addEventListener('click', () => {
            if (state !== 'ready') return;
            if (index < progress) { force(); return; }
            activity();
            if (index !== progress) { status.textContent = '빛나는 순서대로 별을 이어 주세요.'; return; }
            progress++; paint(); if (progress === starPoints.length) finish(false);
          }); controls.append(star);
        });
      } else if (ride === 4) {
        const pot = document.createElement('button');
        pot.type = 'button'; pot.className = 'ride-interaction__pot'; pot.setAttribute('role', 'slider');
        pot.setAttribute('aria-label', '주전자를 아래로 당겨 차 따르기'); pot.setAttribute('aria-valuemin', '0'); pot.setAttribute('aria-valuemax', '100');
        pot.innerHTML = '<img src="assets/teacup-teapot.png" alt="" draggable="false">';
        const cup = document.createElement('div'); cup.className = 'ride-interaction__cup'; cup.setAttribute('aria-hidden','true');
        cup.innerHTML = '<span class="ride-interaction__tea"></span>☕'; controls.append(cup, pot);
        let originY = 0, originProgress = 0, maxProgress = 0;
        function move(next) {
          if (state !== 'ready') return;
          if (next < maxProgress - 4 || next < -4) { force(); return; }
          progress = Math.max(0, Math.min(100, next)); maxProgress = Math.max(maxProgress, progress);
          activity(); paint(); if (progress >= 100) finish(false);
        }
        pot.addEventListener('pointerdown', event => { if (state !== 'ready' || event.button !== 0 || pointer !== null) return; pointer = event.pointerId; originY = event.clientY; originProgress = progress; pot.setPointerCapture(pointer); event.preventDefault(); activity(); });
        pot.addEventListener('pointermove', event => { if (event.pointerId !== pointer || state !== 'ready') return; const height = controls.getBoundingClientRect().height; if (height) move(originProgress + (event.clientY - originY) / (height * .45) * 100); });
        for (const name of ['pointerup','pointercancel','lostpointercapture']) pot.addEventListener(name, event => { if (event.pointerId === pointer) pointer = null; });
        pot.addEventListener('keydown', event => { if (['ArrowDown','ArrowRight'].includes(event.key)) { event.preventDefault(); move(progress + 10); } else if (['ArrowUp','ArrowLeft'].includes(event.key)) { event.preventDefault(); move(progress - 10); } else if (event.key === 'End') { event.preventDefault(); move(100); } });
      } else {
        const wheel = document.createElement('button'); wheel.type = 'button'; wheel.className = 'ride-interaction__wheel'; wheel.setAttribute('role', 'slider'); wheel.setAttribute('aria-label', ride === 2 ? '회전목마 태엽' : '찻잔 바퀴'); wheel.setAttribute('aria-valuemin', '0'); wheel.setAttribute('aria-valuemax', '100'); wheel.innerHTML = '<span aria-hidden="true">✧</span>'; controls.append(wheel);
        function angle(event) { const box = wheel.getBoundingClientRect(); return Math.atan2(event.clientY - box.top - box.height / 2, event.clientX - box.left - box.width / 2) * 180 / Math.PI; }
        function move(delta) {
          if (state !== 'ready') return;
          if (delta < -5) { force(); return; }
          if (delta <= 0) return;
          activity(); progress = Math.min(100, progress + delta / 3.6); paint();
          if (ride === 2 && Math.floor(progress / 10) > lastNote) { lastNote = Math.floor(progress / 10); musicBoxNote(lastNote); }
          if (progress >= 100) finish(false);
        }
        wheel.addEventListener('pointerdown', event => { if (state !== 'ready' || event.button !== 0) return; pointer = event.pointerId; lastAngle = angle(event); wheel.setPointerCapture(pointer); event.preventDefault(); activity(); });
        wheel.addEventListener('pointermove', event => { if (event.pointerId !== pointer || state !== 'ready') return; const next = angle(event); let delta = next - lastAngle; if (delta > 180) delta -= 360; if (delta < -180) delta += 360; lastAngle = next; move(delta); });
        for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) wheel.addEventListener(name, event => { if (event.pointerId === pointer) pointer = null; });
        wheel.addEventListener('keydown', event => { if (['ArrowRight', 'ArrowUp'].includes(event.key)) { event.preventDefault(); move(36); } else if (['ArrowLeft', 'ArrowDown'].includes(event.key)) { event.preventDefault(); force(); } });
        // A tap also gives touch and switch users an alternative to circular dragging.
        wheel.addEventListener('click', event => { if (event.detail === 0 || event.pointerType === 'touch') move(36); });
      }
      if (typeof MutationObserver !== 'undefined') { observer = new MutationObserver(() => { if (!root.isConnected) destroy(); }); observer.observe(document.body, { childList: true, subtree: true }); }
      paint(); activity();
      return { destroy };
    }
  };
})();
