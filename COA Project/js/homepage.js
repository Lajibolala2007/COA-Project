/**
 * LogicLab - Homepage Interactive Components
 * Powers:
 * 1. Hero interactive circuit simulation
 * 2. Component A: Gate Showcase Cards
 * 3. Component B: Interactive Truth Table Preview
 * 4. Component C: Live Mini Circuit Preview
 * 5. Component D: Real-time Binary Signal Waveform Visualizer
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ==========================================================================
     1. HERO INTERACTIVE CIRCUIT
     ========================================================================== */
  const heroState = { A: 1, B: 1 };

  const heroSwitchA = document.getElementById('hero-switch-a');
  const heroSwitchB = document.getElementById('hero-switch-b');
  const heroWireA = document.getElementById('hero-wire-a');
  const heroWireB = document.getElementById('hero-wire-b');
  const heroWireOut = document.getElementById('hero-wire-out');
  const heroLed = document.getElementById('hero-led');
  const heroLedGlow = document.getElementById('hero-led-glow');
  const heroOutputVal = document.getElementById('hero-output-val');
  const heroPulseA = document.getElementById('hero-pulse-a');
  const heroPulseB = document.getElementById('hero-pulse-b');
  const heroPulseOut = document.getElementById('hero-pulse-out');

  function updateHeroCircuit() {
    const out = LogicLab.evaluate('AND', heroState.A, heroState.B);
    const isHigh = out === 1;

    // Switch A
    if (heroSwitchA) {
      heroSwitchA.setAttribute('data-val', heroState.A);
      heroSwitchA.classList.toggle('switch-on', heroState.A === 1);
      const textA = heroSwitchA.querySelector('.switch-val-text');
      if (textA) textA.textContent = heroState.A;
    }
    if (heroWireA) {
      heroWireA.setAttribute('stroke', heroState.A === 1 ? '#38BDF8' : '#334155');
      heroWireA.setAttribute('filter', heroState.A === 1 ? 'url(#heroCyanGlow)' : 'none');
    }
    if (heroPulseA) {
      heroPulseA.style.display = heroState.A === 1 ? 'block' : 'none';
    }

    // Switch B
    if (heroSwitchB) {
      heroSwitchB.setAttribute('data-val', heroState.B);
      heroSwitchB.classList.toggle('switch-on', heroState.B === 1);
      const textB = heroSwitchB.querySelector('.switch-val-text');
      if (textB) textB.textContent = heroState.B;
    }
    if (heroWireB) {
      heroWireB.setAttribute('stroke', heroState.B === 1 ? '#38BDF8' : '#334155');
      heroWireB.setAttribute('filter', heroState.B === 1 ? 'url(#heroCyanGlow)' : 'none');
    }
    if (heroPulseB) {
      heroPulseB.style.display = heroState.B === 1 ? 'block' : 'none';
    }

    // Output Wire & LED
    if (heroWireOut) {
      heroWireOut.setAttribute('stroke', isHigh ? '#22C55E' : '#334155');
      heroWireOut.setAttribute('filter', isHigh ? 'url(#heroGreenGlow)' : 'none');
    }
    if (heroPulseOut) {
      heroPulseOut.style.display = isHigh ? 'block' : 'none';
    }
    if (heroLed) {
      heroLed.setAttribute('fill', isHigh ? 'url(#heroLedOnGrad)' : '#334155');
      heroLed.setAttribute('filter', isHigh ? 'url(#heroGreenGlow)' : 'none');
    }
    if (heroLedGlow) {
      heroLedGlow.style.display = isHigh ? 'block' : 'none';
    }
    if (heroOutputVal) {
      heroOutputVal.textContent = `OUTPUT: ${out} – ${isHigh ? 'ON' : 'OFF'}`;
      heroOutputVal.className = `hero-out-text ${isHigh ? 'text-green' : 'text-slate'}`;
    }
  }

  if (heroSwitchA) {
    heroSwitchA.addEventListener('click', () => {
      heroState.A = heroState.A === 1 ? 0 : 1;
      LogicLabSimulator.AudioFeedback.playClick(heroState.A === 1);
      updateHeroCircuit();
    });
  }

  if (heroSwitchB) {
    heroSwitchB.addEventListener('click', () => {
      heroState.B = heroState.B === 1 ? 0 : 1;
      LogicLabSimulator.AudioFeedback.playClick(heroState.B === 1);
      updateHeroCircuit();
    });
  }

  // Initial hero update
  updateHeroCircuit();


  /* ==========================================================================
     2. COMPONENT B: INTERACTIVE TRUTH TABLE PREVIEW (HOME PAGE)
     ========================================================================== */
  const ttPreviewRows = document.querySelectorAll('.tt-preview-row');
  const ttPreviewAVal = document.getElementById('tt-preview-a-val');
  const ttPreviewBVal = document.getElementById('tt-preview-b-val');
  const ttPreviewYVal = document.getElementById('tt-preview-y-val');
  const ttPreviewStatus = document.getElementById('tt-preview-status');

  function updateTruthTablePreview(a, b) {
    const y = LogicLab.evaluate('AND', a, b);

    if (ttPreviewAVal) ttPreviewAVal.textContent = a;
    if (ttPreviewBVal) ttPreviewBVal.textContent = b;
    if (ttPreviewYVal) {
      ttPreviewYVal.textContent = y;
      ttPreviewYVal.className = `preview-y-badge ${y === 1 ? 'badge-high' : 'badge-low'}`;
    }
    if (ttPreviewStatus) {
      ttPreviewStatus.innerHTML = y === 1
        ? '<span class="status-indicator-tag tag-success">HIGH (1) - Output Satisfied</span>'
        : '<span class="status-indicator-tag tag-inactive">LOW (0) - Condition Not Met</span>';
    }

    ttPreviewRows.forEach(row => {
      const rA = parseInt(row.getAttribute('data-a'), 10);
      const rB = parseInt(row.getAttribute('data-b'), 10);
      const isMatch = rA === a && rB === b;
      row.classList.toggle('selected-preview-row', isMatch);
    });
  }

  ttPreviewRows.forEach(row => {
    row.addEventListener('click', () => {
      const a = parseInt(row.getAttribute('data-a'), 10);
      const b = parseInt(row.getAttribute('data-b'), 10);
      LogicLabSimulator.AudioFeedback.playClick(a === 1 || b === 1);
      updateTruthTablePreview(a, b);
    });
  });

  // Default to 1, 1 on truth table preview
  updateTruthTablePreview(1, 1);


  /* ==========================================================================
     3. COMPONENT C: LIVE CIRCUIT PREVIEW (HOME PAGE)
     ========================================================================== */
  const livePreviewState = { A: 0, B: 1 };
  const lpSwitchA = document.getElementById('lp-switch-a');
  const lpSwitchB = document.getElementById('lp-switch-b');
  const lpWireA = document.getElementById('lp-wire-a');
  const lpWireB = document.getElementById('lp-wire-b');
  const lpWireOut = document.getElementById('lp-wire-out');
  const lpLed = document.getElementById('lp-led');
  const lpLedGlow = document.getElementById('lp-led-glow');
  const lpOutLabel = document.getElementById('lp-output-label');
  const lpPulseA = document.getElementById('lp-pulse-a');
  const lpPulseB = document.getElementById('lp-pulse-b');
  const lpPulseOut = document.getElementById('lp-pulse-out');

  function updateLiveCircuitPreview() {
    const out = LogicLab.evaluate('AND', livePreviewState.A, livePreviewState.B);
    const isHigh = out === 1;

    // Switch A
    if (lpSwitchA) {
      lpSwitchA.classList.toggle('active-switch', livePreviewState.A === 1);
      const textA = lpSwitchA.querySelector('.sw-val');
      if (textA) textA.textContent = livePreviewState.A;
      const statusA = lpSwitchA.querySelector('.sw-status');
      if (statusA) statusA.textContent = livePreviewState.A === 1 ? 'HIGH' : 'LOW';
    }
    if (lpWireA) {
      lpWireA.setAttribute('stroke', livePreviewState.A === 1 ? '#38BDF8' : '#334155');
      lpWireA.setAttribute('filter', livePreviewState.A === 1 ? 'url(#lpCyanGlow)' : 'none');
    }
    if (lpPulseA) {
      lpPulseA.style.display = livePreviewState.A === 1 ? 'block' : 'none';
    }

    // Switch B
    if (lpSwitchB) {
      lpSwitchB.classList.toggle('active-switch', livePreviewState.B === 1);
      const textB = lpSwitchB.querySelector('.sw-val');
      if (textB) textB.textContent = livePreviewState.B;
      const statusB = lpSwitchB.querySelector('.sw-status');
      if (statusB) statusB.textContent = livePreviewState.B === 1 ? 'HIGH' : 'LOW';
    }
    if (lpWireB) {
      lpWireB.setAttribute('stroke', livePreviewState.B === 1 ? '#38BDF8' : '#334155');
      lpWireB.setAttribute('filter', livePreviewState.B === 1 ? 'url(#lpCyanGlow)' : 'none');
    }
    if (lpPulseB) {
      lpPulseB.style.display = livePreviewState.B === 1 ? 'block' : 'none';
    }

    // Output Wire & LED
    if (lpWireOut) {
      lpWireOut.setAttribute('stroke', isHigh ? '#22C55E' : '#334155');
      lpWireOut.setAttribute('filter', isHigh ? 'url(#lpGreenGlow)' : 'none');
    }
    if (lpPulseOut) {
      lpPulseOut.style.display = isHigh ? 'block' : 'none';
    }
    if (lpLed) {
      lpLed.setAttribute('fill', isHigh ? 'url(#lpLedOnGrad)' : '#334155');
      lpLed.setAttribute('filter', isHigh ? 'url(#lpGreenGlow)' : 'none');
    }
    if (lpLedGlow) {
      lpLedGlow.style.display = isHigh ? 'block' : 'none';
    }
    if (lpOutLabel) {
      lpOutLabel.textContent = `Y = ${out} (${isHigh ? 'ON - HIGH' : 'OFF - LOW'})`;
      lpOutLabel.className = `lp-status-badge ${isHigh ? 'badge-on' : 'badge-off'}`;
    }
  }

  if (lpSwitchA) {
    lpSwitchA.addEventListener('click', () => {
      livePreviewState.A = livePreviewState.A === 1 ? 0 : 1;
      LogicLabSimulator.AudioFeedback.playClick(livePreviewState.A === 1);
      updateLiveCircuitPreview();
    });
  }

  if (lpSwitchB) {
    lpSwitchB.addEventListener('click', () => {
      livePreviewState.B = livePreviewState.B === 1 ? 0 : 1;
      LogicLabSimulator.AudioFeedback.playClick(livePreviewState.B === 1);
      updateLiveCircuitPreview();
    });
  }

  // Initial live preview update
  updateLiveCircuitPreview();


  /* ==========================================================================
     4. COMPONENT D: BINARY SIGNAL WAVEFORM VISUALIZER
     ========================================================================== */
  const canvas = document.getElementById('waveform-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let bitPattern = [1, 0, 1, 1, 0, 0, 1, 0];
    let offset = 0;
    let isLiveStreaming = true;
    let animationId = null;

    // Pattern buttons
    const bitButtons = document.querySelectorAll('.btn-waveform-bit');
    bitButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        bitPattern[index] = bitPattern[index] === 1 ? 0 : 1;
        btn.textContent = bitPattern[index];
        btn.classList.toggle('bit-active', bitPattern[index] === 1);
        LogicLabSimulator.AudioFeedback.playClick(bitPattern[index] === 1);
        if (!isLiveStreaming) drawWaveform();
      });
    });

    const toggleStreamBtn = document.getElementById('btn-toggle-waveform-stream');
    if (toggleStreamBtn) {
      toggleStreamBtn.addEventListener('click', () => {
        isLiveStreaming = !isLiveStreaming;
        toggleStreamBtn.textContent = isLiveStreaming ? 'Pause Stream' : 'Resume Stream';
        toggleStreamBtn.classList.toggle('btn-paused', !isLiveStreaming);
        if (isLiveStreaming) loop();
      });
    }

    function drawWaveform() {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background grid
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1;
      const gridStep = 40;

      for (let x = 0; x <= width; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y <= height; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // HIGH (5V) & LOW (0V) reference horizontal guide lines
      const yHigh = 45;
      const yLow = 145;

      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#38BDF866';
      ctx.beginPath();
      ctx.moveTo(0, yHigh);
      ctx.lineTo(width, yHigh);
      ctx.stroke();

      ctx.strokeStyle = '#64748B55';
      ctx.beginPath();
      ctx.moveTo(0, yLow);
      ctx.lineTo(width, yLow);
      ctx.stroke();
      ctx.setLineDash([]);

      // Waveform trace
      const bitWidth = 70;
      const totalBits = bitPattern.length;

      // Glow effect for waveform
      ctx.shadowColor = '#38BDF8';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 3.5;
      ctx.lineJoin = 'miter';

      ctx.beginPath();
      let currentX = -offset;
      let prevY = bitPattern[0] === 1 ? yHigh : yLow;
      ctx.moveTo(currentX, prevY);

      // Loop over multiple periods to support smooth scrolling
      for (let i = 0; i < totalBits * 3; i++) {
        const bit = bitPattern[i % totalBits];
        const targetY = bit === 1 ? yHigh : yLow;
        const nextX = currentX + bitWidth;

        // Vertical clock transition
        if (targetY !== prevY) {
          ctx.lineTo(currentX, targetY);
        }
        // Horizontal level
        ctx.lineTo(nextX, targetY);

        prevY = targetY;
        currentX = nextX;
        if (currentX > width + bitWidth) break;
      }
      ctx.stroke();

      // Reset shadow
      ctx.shadowBlur = 0;

      // Draw bit value labels over each pulse segment
      ctx.font = "bold 13px 'JetBrains Mono', monospace";
      ctx.textAlign = 'center';
      currentX = -offset;
      for (let i = 0; i < totalBits * 3; i++) {
        const bit = bitPattern[i % totalBits];
        const midX = currentX + bitWidth / 2;
        if (midX >= 10 && midX <= width - 10) {
          ctx.fillStyle = bit === 1 ? '#38BDF8' : '#64748B';
          ctx.fillText(bit === 1 ? '1 [HIGH]' : '0 [LOW]', midX, bit === 1 ? yHigh - 12 : yLow + 22);
        }
        currentX += bitWidth;
        if (currentX > width) break;
      }

      // Draw Voltage reference labels on left side
      ctx.textAlign = 'left';
      ctx.font = "11px 'Space Grotesk', sans-serif";
      ctx.fillStyle = '#38BDF8';
      ctx.fillText('+5.0V (Logic 1)', 10, yHigh - 10);
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(' 0.0V (Logic 0)', 10, yLow + 18);
    }

    function loop() {
      if (!isLiveStreaming) return;
      offset = (offset + 1) % (70 * bitPattern.length);
      drawWaveform();
      animationId = requestAnimationFrame(loop);
    }

    // Start animation loop
    loop();
  }
});

