/**
 * LogicLab - Interactive Circuit Simulator Engine
 * Renders SVG digital circuits, handles switch toggles, synchronizes truth tables,
 * drives wire animations, LED states, mathematical calculations, and dynamic explanations.
 */

const LogicLabSimulator = (function () {
  'use strict';

  // Sound generator using Web Audio API for tactile audio feedback
  const AudioFeedback = (function () {
    let audioCtx = null;
    let soundEnabled = true;

    function getContext() {
      if (!audioCtx && typeof window !== 'undefined') {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          audioCtx = new AudioContext();
        }
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      return audioCtx;
    }

    function playClick(isHigh) {
      if (!soundEnabled) return;
      try {
        const ctx = getContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = isHigh ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(isHigh ? 640 : 380, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(isHigh ? 880 : 220, ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      } catch (e) {
        // Audio might be blocked by browser autoplay policy before user gesture
      }
    }

    return {
      playClick,
      toggleSound: () => {
        soundEnabled = !soundEnabled;
        return soundEnabled;
      },
      isEnabled: () => soundEnabled
    };
  })();

  /**
   * Generates crisp, accurate IEEE standard SVG paths for logic gates.
   */
  function getGateSvgMarkup(gateId, isCompact = false) {
    const id = gateId.toUpperCase();
    const stroke = '#38BDF8';
    const fill = '#111C30';
    const strokeWidth = 3;

    switch (id) {
      case 'AND':
        return `
          <g class="gate-symbol and-gate">
            <!-- IEEE Std 91 AND Gate Shape -->
            <path d="M 120 70 L 175 70 A 45 45 0 0 1 175 160 L 120 160 Z" 
                  fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
            <text x="150" y="120" text-anchor="middle" fill="#94A3B8" font-family="'Space Grotesk', sans-serif" font-size="14" font-weight="700">AND</text>
          </g>
        `;

      case 'OR':
        return `
          <g class="gate-symbol or-gate">
            <!-- IEEE Std 91 OR Gate Shape -->
            <path d="M 115 70 Q 140 115 115 160 Q 170 157 210 115 Q 170 73 115 70 Z" 
                  fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
            <text x="150" y="120" text-anchor="middle" fill="#94A3B8" font-family="'Space Grotesk', sans-serif" font-size="14" font-weight="700">OR</text>
          </g>
        `;

      case 'NOT':
        return `
          <g class="gate-symbol not-gate">
            <!-- Inverter Triangle -->
            <polygon points="120,70 185,115 120,160" 
                     fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
            <!-- Inversion Bubble -->
            <circle cx="193" cy="115" r="7" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
            <text x="145" y="120" text-anchor="middle" fill="#94A3B8" font-family="'Space Grotesk', sans-serif" font-size="13" font-weight="700">NOT</text>
          </g>
        `;

      case 'NAND':
        return `
          <g class="gate-symbol nand-gate">
            <!-- AND Shape -->
            <path d="M 115 70 L 170 70 A 45 45 0 0 1 170 160 L 115 160 Z" 
                  fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
            <!-- Inversion Bubble -->
            <circle cx="222" cy="115" r="7" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
            <text x="148" y="120" text-anchor="middle" fill="#94A3B8" font-family="'Space Grotesk', sans-serif" font-size="14" font-weight="700">NAND</text>
          </g>
        `;

      case 'NOR':
        return `
          <g class="gate-symbol nor-gate">
            <!-- OR Shape -->
            <path d="M 110 70 Q 135 115 110 160 Q 165 157 205 115 Q 165 73 110 70 Z" 
                  fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
            <!-- Inversion Bubble -->
            <circle cx="213" cy="115" r="7" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
            <text x="146" y="120" text-anchor="middle" fill="#94A3B8" font-family="'Space Grotesk', sans-serif" font-size="14" font-weight="700">NOR</text>
          </g>
        `;

      case 'XOR':
        return `
          <g class="gate-symbol xor-gate">
            <!-- Offset Back Arc -->
            <path d="M 103 70 Q 128 115 103 160" 
                  fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" />
            <!-- Main OR Shape -->
            <path d="M 116 70 Q 141 115 116 160 Q 171 157 211 115 Q 171 73 116 70 Z" 
                  fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
            <text x="152" y="120" text-anchor="middle" fill="#94A3B8" font-family="'Space Grotesk', sans-serif" font-size="14" font-weight="700">XOR</text>
          </g>
        `;

      default:
        return '';
    }
  }

  /**
   * Initializes a full gate simulation inside container elements.
   * Connects switches, wires, truth table, calculation card, and explanation card.
   */
  function initSimulation(config) {
    const {
      gateId,
      circuitContainerId = 'circuit-container',
      truthTableContainerId = 'truth-table-container',
      calculationContainerId = 'calculation-container',
      explanationContainerId = 'explanation-container',
      initialInputs = { A: 0, B: 0 },
      onStateChange = null
    } = config;

    const gate = LogicLab.getGate(gateId);
    if (!gate) {
      console.error(`Gate ${gateId} not found`);
      return null;
    }

    let state = {
      A: initialInputs.A ? 1 : 0,
      B: initialInputs.B ? 1 : 0
    };

    const isSingleInput = gate.inputs.length === 1;

    // Render initial Truth Table
    renderTruthTable();
    // Render initial Circuit SVG
    renderCircuitSvg();
    // Update dynamic text readouts
    updateOutputs();

    /**
     * Renders truth table HTML with interactive row selection
     */
    function renderTruthTable() {
      const container = document.getElementById(truthTableContainerId);
      if (!container) return;

      let html = `
        <div class="truth-table-card">
          <div class="table-header-bar">
            <span class="table-title">Truth Table: ${gate.name}</span>
            <span class="table-badge">${isSingleInput ? '1-Input Inverter' : '2-Input Gate'}</span>
          </div>
          <p class="table-instruction">Click any row below to immediately apply that input combination to the circuit.</p>
          <div class="table-responsive-wrapper">
            <table class="logic-truth-table" id="tt-${gate.id.toLowerCase()}">
              <thead>
                <tr>
                  <th>Input A</th>
                  ${!isSingleInput ? '<th>Input B</th>' : ''}
                  <th class="col-output">Output Y</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
      `;

      gate.truthTable.forEach((row, idx) => {
        const isCurrentActive = isSingleInput
          ? row.A === state.A
          : row.A === state.A && row.B === state.B;

        const activeClass = isCurrentActive ? 'active-row' : '';
        const yVal = row.Y;

        html += `
          <tr class="tt-row ${activeClass}" data-index="${idx}" data-a="${row.A}" ${!isSingleInput ? `data-b="${row.B}"` : ''}>
            <td>
              <span class="bit-badge bit-${row.A}">${row.A}</span>
            </td>
            ${!isSingleInput ? `
            <td>
              <span class="bit-badge bit-${row.B}">${row.B}</span>
            </td>` : ''}
            <td class="col-output">
              <span class="bit-badge bit-${yVal} ${yVal === 1 ? 'bit-high' : 'bit-low'}">${yVal}</span>
            </td>
            <td>
              <button type="button" class="btn-select-row" aria-label="Apply inputs row ${idx + 1}">
                <span class="row-select-label">${isCurrentActive ? 'Active' : 'Apply'}</span>
              </button>
            </td>
          </tr>
        `;
      });

      html += `
              </tbody>
            </table>
          </div>
          <div class="table-legend">
            <div class="legend-item"><span class="legend-color legend-high"></span> HIGH (1) / Active</div>
            <div class="legend-item"><span class="legend-color legend-low"></span> LOW (0) / Inactive</div>
          </div>
        </div>
      `;

      container.innerHTML = html;

      // Add click listeners to all rows
      const rows = container.querySelectorAll('.tt-row');
      rows.forEach(row => {
        row.addEventListener('click', () => {
          const newA = parseInt(row.getAttribute('data-a'), 10);
          const newB = row.hasAttribute('data-b') ? parseInt(row.getAttribute('data-b'), 10) : 0;
          setInputs(newA, newB);
        });
      });
    }

    /**
     * Renders SVG Circuit Diagram
     */
    function renderCircuitSvg() {
      const container = document.getElementById(circuitContainerId);
      if (!container) return;

      const outputY = LogicLab.evaluate(gate.id, state.A, state.B);
      const isA1 = state.A === 1;
      const isB1 = state.B === 1;
      const isY1 = outputY === 1;

      // SVG dimensions: 480 wide, 240 high
      const svgHtml = `
        <div class="circuit-wrapper">
          <div class="circuit-canvas-header">
            <div class="circuit-title-badge">
              <span class="circuit-indicator-dot ${isY1 ? 'dot-active' : ''}"></span>
              <span>LIVE LOGIC CIRCUIT</span>
            </div>
            <div class="circuit-header-controls">
              <span class="keyboard-hint-pill">Hotkeys: [A], [B], [R], [0]</span>
              <div class="sound-toggle-btn" id="sound-btn" title="Toggle sound effects">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
              </div>
            </div>
          </div>

          <svg viewBox="0 0 520 230" class="circuit-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <!-- Wire Glow Filters -->
              <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="greenGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <!-- Radial Gradient for ON LED -->
              <radialGradient id="ledGradOn" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stop-color="#86EFAC" />
                <stop offset="35%" stop-color="#22C55E" />
                <stop offset="85%" stop-color="#15803D" />
                <stop offset="100%" stop-color="#052E16" />
              </radialGradient>

              <!-- Radial Gradient for OFF LED -->
              <radialGradient id="ledGradOff" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stop-color="#64748B" />
                <stop offset="50%" stop-color="#334155" />
                <stop offset="100%" stop-color="#0F172A" />
              </radialGradient>
            </defs>

            <!-- Grid background pattern lines for digital lab aesthetics -->
            <g class="circuit-grid" opacity="0.15">
              <line x1="0" y1="50" x2="520" y2="50" stroke="#38BDF8" stroke-dasharray="2,6" />
              <line x1="0" y1="115" x2="520" y2="115" stroke="#38BDF8" stroke-dasharray="2,6" />
              <line x1="0" y1="180" x2="520" y2="180" stroke="#38BDF8" stroke-dasharray="2,6" />
              <line x1="100" y1="0" x2="100" y2="230" stroke="#38BDF8" stroke-dasharray="2,6" />
              <line x1="260" y1="0" x2="260" y2="230" stroke="#38BDF8" stroke-dasharray="2,6" />
              <line x1="420" y1="0" x2="420" y2="230" stroke="#38BDF8" stroke-dasharray="2,6" />
            </g>

            <!-- ================= INPUT A WIRE ================= -->
            <g class="wire-group" id="wire-a-group">
              <!-- Background / Inactive Wire -->
              <path d="${isSingleInput ? 'M 60 115 L 120 115' : 'M 60 90 L 120 90'}" 
                    stroke="${isA1 ? '#38BDF8' : '#334155'}" 
                    stroke-width="5" 
                    stroke-linecap="round"
                    ${isA1 ? 'filter="url(#cyanGlow)" class="active-wire-path"' : ''} />
              
              ${isA1 ? `
              <!-- Animated signal pulse for Input A -->
              <circle r="4.5" fill="#FFFFFF">
                <animateMotion 
                  path="${isSingleInput ? 'M 60 115 L 120 115' : 'M 60 90 L 120 90'}" 
                  dur="1.2s" 
                  repeatCount="indefinite" />
              </circle>
              ` : ''}

              <!-- Input A label -->
              <text x="50" y="${isSingleInput ? '110' : '82'}" text-anchor="end" fill="#94A3B8" font-family="'Space Grotesk', sans-serif" font-size="13" font-weight="700">A</text>
              <text x="50" y="${isSingleInput ? '128' : '100'}" text-anchor="end" fill="${isA1 ? '#38BDF8' : '#64748B'}" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700">${state.A}</text>
            </g>

            <!-- ================= INPUT B WIRE (if 2 inputs) ================= -->
            ${!isSingleInput ? `
            <g class="wire-group" id="wire-b-group">
              <path d="M 60 140 L 120 140" 
                    stroke="${isB1 ? '#38BDF8' : '#334155'}" 
                    stroke-width="5" 
                    stroke-linecap="round"
                    ${isB1 ? 'filter="url(#cyanGlow)" class="active-wire-path"' : ''} />
              
              ${isB1 ? `
              <!-- Animated signal pulse for Input B -->
              <circle r="4.5" fill="#FFFFFF">
                <animateMotion 
                  path="M 60 140 L 120 140" 
                  dur="1.2s" 
                  repeatCount="indefinite" />
              </circle>
              ` : ''}

              <!-- Input B label -->
              <text x="50" y="135" text-anchor="end" fill="#94A3B8" font-family="'Space Grotesk', sans-serif" font-size="13" font-weight="700">B</text>
              <text x="50" y="152" text-anchor="end" fill="${isB1 ? '#38BDF8' : '#64748B'}" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700">${state.B}</text>
            </g>
            ` : ''}

            <!-- ================= GATE SYMBOL ================= -->
            <g id="gate-symbol-container">
              ${getGateSvgMarkup(gate.id)}
            </g>

            <!-- ================= OUTPUT WIRE ================= -->
            <g class="wire-group" id="wire-y-group">
              <path d="${getOutputWirePath(gate.id)}" 
                    stroke="${isY1 ? '#22C55E' : '#334155'}" 
                    stroke-width="5" 
                    stroke-linecap="round"
                    ${isY1 ? 'filter="url(#greenGlow)" class="active-wire-path"' : ''} />
              
              ${isY1 ? `
              <!-- Animated signal pulse for Output -->
              <circle r="4.5" fill="#FFFFFF">
                <animateMotion 
                  path="${getOutputWirePath(gate.id)}" 
                  dur="1.0s" 
                  repeatCount="indefinite" />
              </circle>
              ` : ''}

              <!-- Output Y label -->
              <text x="320" y="105" text-anchor="middle" fill="#94A3B8" font-family="'Space Grotesk', sans-serif" font-size="13" font-weight="700">Y</text>
              <text x="320" y="125" text-anchor="middle" fill="${isY1 ? '#22C55E' : '#64748B'}" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="700">${outputY}</text>
            </g>

            <!-- ================= OUTPUT LED ================= -->
            <g class="led-indicator-group" transform="translate(410, 115)">
              <!-- Outer Bezel / Housing -->
              <circle cx="0" cy="0" r="26" fill="#1E293B" stroke="#475569" stroke-width="3" />
              <circle cx="0" cy="0" r="20" fill="#0F172A" />

              <!-- LED Dome with radial gradient & glow -->
              <circle cx="0" cy="0" r="17" 
                      fill="${isY1 ? 'url(#ledGradOn)' : 'url(#ledGradOff)'}" 
                      ${isY1 ? 'filter="url(#greenGlow)"' : ''} />

              <!-- Specular reflection highlight on lens -->
              <ellipse cx="-4" cy="-5" rx="5" ry="3" fill="#FFFFFF" opacity="${isY1 ? '0.75' : '0.25'}" />

              <!-- Outer glow ring when active -->
              ${isY1 ? `
              <circle cx="0" cy="0" r="22" fill="none" stroke="#22C55E" stroke-width="2" opacity="0.6">
                <animate attributeName="r" values="20;26;20" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
              </circle>
              ` : ''}

              <!-- Status Text below LED -->
              <text x="0" y="46" text-anchor="middle" fill="${isY1 ? '#22C55E' : '#94A3B8'}" font-family="'Space Grotesk', sans-serif" font-size="12" font-weight="700">
                ${isY1 ? 'OUTPUT: 1 – ON' : 'OUTPUT: 0 – OFF'}
              </text>
            </g>
          </svg>

          <!-- Interactive Switch Controls Bar -->
          <div class="interactive-switches-bar">
            <div class="switch-control-card">
              <span class="switch-label">Switch A</span>
              <button type="button" class="logic-toggle-btn ${isA1 ? 'btn-active-high' : 'btn-inactive-low'}" id="toggle-switch-a" aria-pressed="${isA1}">
                <span class="toggle-slider">
                  <span class="slider-thumb"></span>
                </span>
                <span class="toggle-binary-text">${state.A}</span>
                <span class="toggle-state-text">${isA1 ? 'HIGH' : 'LOW'}</span>
              </button>
            </div>

            ${!isSingleInput ? `
            <div class="switch-control-card">
              <span class="switch-label">Switch B</span>
              <button type="button" class="logic-toggle-btn ${isB1 ? 'btn-active-high' : 'btn-inactive-low'}" id="toggle-switch-b" aria-pressed="${isB1}">
                <span class="toggle-slider">
                  <span class="slider-thumb"></span>
                </span>
                <span class="toggle-binary-text">${state.B}</span>
                <span class="toggle-state-text">${isB1 ? 'HIGH' : 'LOW'}</span>
              </button>
            </div>
            ` : ''}

            <!-- Quick Action Buttons -->
            <div class="quick-actions-card">
              <button type="button" class="btn-action btn-random" id="btn-random-inputs" title="Generate random binary input">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="16 3 21 3 21 8"></polyline>
                  <line x1="4" y1="20" x2="21" y2="3"></line>
                  <polyline points="21 16 21 21 16 21"></polyline>
                  <line x1="15" y1="15" x2="21" y2="21"></line>
                  <line x1="4" y1="4" x2="9" y2="9"></line>
                </svg>
                <span>Random Input</span>
              </button>
              
              <button type="button" class="btn-action btn-reset" id="btn-reset-circuit" title="Reset all inputs to 0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <polyline points="3 3 3 8 8 8"></polyline>
                </svg>
                <span>Reset (0)</span>
              </button>
            </div>
          </div>
        </div>
      `;

      container.innerHTML = svgHtml;

      // Attach event listeners to switches and action buttons
      const switchA = document.getElementById('toggle-switch-a');
      if (switchA) {
        switchA.addEventListener('click', () => {
          const nextA = state.A === 1 ? 0 : 1;
          AudioFeedback.playClick(nextA === 1);
          setInputs(nextA, state.B);
        });
      }

      const switchB = document.getElementById('toggle-switch-b');
      if (switchB) {
        switchB.addEventListener('click', () => {
          const nextB = state.B === 1 ? 0 : 1;
          AudioFeedback.playClick(nextB === 1);
          setInputs(state.A, nextB);
        });
      }

      const randomBtn = document.getElementById('btn-random-inputs');
      if (randomBtn) {
        randomBtn.addEventListener('click', () => {
          generateRandomInputs();
        });
      }

      const resetBtn = document.getElementById('btn-reset-circuit');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          resetInputs();
        });
      }

      const soundBtn = document.getElementById('sound-btn');
      if (soundBtn) {
        soundBtn.addEventListener('click', () => {
          const enabled = AudioFeedback.toggleSound();
          soundBtn.classList.toggle('sound-muted', !enabled);
        });
      }

      // Also make SVG Wire A and B directly clickable
      const wireAGroup = document.getElementById('wire-a-group');
      if (wireAGroup) {
        wireAGroup.style.cursor = 'pointer';
        wireAGroup.setAttribute('title', 'Click to toggle Input A');
        wireAGroup.addEventListener('click', () => {
          const nextA = state.A === 1 ? 0 : 1;
          AudioFeedback.playClick(nextA === 1);
          setInputs(nextA, state.B);
        });
      }

      const wireBGroup = document.getElementById('wire-b-group');
      if (wireBGroup) {
        wireBGroup.style.cursor = 'pointer';
        wireBGroup.setAttribute('title', 'Click to toggle Input B');
        wireBGroup.addEventListener('click', () => {
          const nextB = state.B === 1 ? 0 : 1;
          AudioFeedback.playClick(nextB === 1);
          setInputs(state.A, nextB);
        });
      }

      // Hotkey keyboard shortcut listener (once per session)
      if (!window.__logicLabHotkeysBound) {
        window.__logicLabHotkeysBound = true;
        window.addEventListener('keydown', (e) => {
          if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) {
            return;
          }
          const k = e.key.toLowerCase();
          if (k === 'a') {
            const nextA = state.A === 1 ? 0 : 1;
            AudioFeedback.playClick(nextA === 1);
            setInputs(nextA, state.B);
          } else if (k === 'b' && !isSingleInput) {
            const nextB = state.B === 1 ? 0 : 1;
            AudioFeedback.playClick(nextB === 1);
            setInputs(state.A, nextB);
          } else if (k === 'r') {
            generateRandomInputs();
          } else if (k === '0' || k === 'escape') {
            resetInputs();
          }
        });
      }
    }

    /**
     * Determines output wire SVG coordinates based on gate structure.
     */
    function getOutputWirePath(gateId) {
      switch (gateId.toUpperCase()) {
        case 'AND':
          return 'M 220 115 L 390 115';
        case 'OR':
          return 'M 210 115 L 390 115';
        case 'NOT':
          return 'M 200 115 L 390 115';
        case 'NAND':
          return 'M 229 115 L 390 115';
        case 'NOR':
          return 'M 220 115 L 390 115';
        case 'XOR':
          return 'M 211 115 L 390 115';
        default:
          return 'M 220 115 L 390 115';
      }
    }

    /**
     * Updates Boolean expression calculation and explanation cards
     */
    function updateOutputs() {
      const outputY = LogicLab.evaluate(gate.id, state.A, state.B);
      const isY1 = outputY === 1;

      // 1. Highlight active Truth Table Row
      const ttContainer = document.getElementById(truthTableContainerId);
      if (ttContainer) {
        const rows = ttContainer.querySelectorAll('.tt-row');
        rows.forEach(row => {
          const rA = parseInt(row.getAttribute('data-a'), 10);
          const rB = row.hasAttribute('data-b') ? parseInt(row.getAttribute('data-b'), 10) : 0;
          const matches = isSingleInput
            ? rA === state.A
            : rA === state.A && rB === state.B;

          row.classList.toggle('active-row', matches);
          const label = row.querySelector('.row-select-label');
          if (label) {
            label.textContent = matches ? 'Active' : 'Apply';
          }
        });
      }

      // 2. Update Boolean Expression & Calculation Box
      const calcContainer = document.getElementById(calculationContainerId);
      if (calcContainer) {
        const steps = LogicLab.getSubstitution(gate.id, state.A, state.B);
        let calcHtml = `
          <div class="calc-card">
            <div class="calc-header">
              <span class="calc-icon">fx</span>
              <h4>Boolean Expression & Calculation</h4>
            </div>
            <div class="calc-formula-display">
              <div class="formula-general">
                <span class="formula-label">General Expression:</span>
                <code class="code-formula">${gate.expression}</code>
              </div>
              <div class="formula-steps">
                <span class="formula-label">Current Evaluation:</span>
                <div class="step-list">
        `;

        steps.forEach((step, idx) => {
          calcHtml += `
            <div class="step-item ${idx === steps.length - 1 ? 'step-result' : ''}">
              <span class="step-num">${idx + 1}.</span>
              <code class="code-step">${step}</code>
            </div>
          `;
        });

        calcHtml += `
                </div>
              </div>
              <div class="result-statement ${isY1 ? 'state-high' : 'state-low'}">
                <span class="result-badge">${isY1 ? 'OUTPUT: 1 (HIGH)' : 'OUTPUT: 0 (LOW)'}</span>
                <span class="result-detail">LED is currently <strong>${isY1 ? 'ILLUMINATED (ON)' : 'UNLIT (OFF)'}</strong></span>
              </div>
            </div>
          </div>
        `;
        calcContainer.innerHTML = calcHtml;
      }

      // 3. Update "Why This Output?" / Dynamic Explanation
      const expContainer = document.getElementById(explanationContainerId);
      if (expContainer) {
        const explanationText = LogicLab.getExplanation(gate.id, state.A, state.B);
        let expHtml = `
          <div class="explanation-card">
            <div class="exp-header">
              <div class="exp-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </div>
              <h4>Understand the Output</h4>
            </div>
            <div class="exp-body">
              <div class="current-states-tag">
                <span class="tag-input">A = ${state.A} (${state.A === 1 ? 'HIGH' : 'LOW'})</span>
                ${!isSingleInput ? `<span class="tag-input">B = ${state.B} (${state.B === 1 ? 'HIGH' : 'LOW'})</span>` : ''}
                <span class="tag-arrow">➔</span>
                <span class="tag-output ${isY1 ? 'out-high' : 'out-low'}">Y = ${outputY} (${isY1 ? 'HIGH' : 'LOW'})</span>
              </div>
              <p class="explanation-text">${explanationText}</p>
            </div>
          </div>
        `;
        expContainer.innerHTML = expHtml;
      }

      if (typeof onStateChange === 'function') {
        onStateChange({
          gate: gate.id,
          A: state.A,
          B: state.B,
          Y: outputY
        });
      }
    }

    /**
     * Changes input states and triggers complete UI synchronization
     */
    function setInputs(newA, newB = 0) {
      state.A = newA ? 1 : 0;
      state.B = newB ? 1 : 0;
      renderCircuitSvg();
      updateOutputs();
    }

    /**
     * Feature A: Random Input Generator
     */
    function generateRandomInputs() {
      const randA = Math.random() < 0.5 ? 0 : 1;
      const randB = isSingleInput ? 0 : (Math.random() < 0.5 ? 0 : 1);
      AudioFeedback.playClick(randA === 1 || randB === 1);
      setInputs(randA, randB);
    }

    /**
     * Feature B: Reset Simulation (all 0)
     */
    function resetInputs() {
      AudioFeedback.playClick(false);
      setInputs(0, 0);
    }

    return {
      gate,
      getState: () => ({ ...state }),
      setInputs,
      generateRandomInputs,
      resetInputs
    };
  }

  return {
    getGateSvgMarkup,
    initSimulation,
    AudioFeedback
  };
})();

// Attach to window
if (typeof window !== 'undefined') {
  window.LogicLabSimulator = LogicLabSimulator;
}

