/**
 * LogicLab - Circuit Builder (Advanced Multi-Gate Simulation)
 * Powers /pages/circuit-builder.html
 * Allows interactive building and experimentation with multi-stage digital logic circuits:
 * - Real-time signal propagation through cascaded gates
 * - Preset architectures: Combination Circuit: (A·B)+C, Universal NAND Gate Network
 * - Interactive Gate Selection Panel to customize Gate 1 and Gate 2
 * - Live multi-variable truth table generation
 * - Dynamic composite Boolean expression evaluation
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const container = document.getElementById('circuit-builder-app');
  if (!container) return;

  // Circuit presets definitions
  const PRESETS = {
    combination: {
      id: 'combination',
      name: 'Combination Circuit: (A · B) + C',
      description: 'Input A and Input B feed into Gate 1. The intermediate output signal is combined with Input C via Gate 2 to drive the output LED.',
      inputs: ['A', 'B', 'C'],
      initialState: { A: 1, B: 0, C: 1 },
      gate1: 'AND',
      gate2: 'OR',
      evaluate: function (inputs) {
        const g1Obj = LogicLab.getGate(this.gate1);
        const g2Obj = LogicLab.getGate(this.gate2);
        const intermediate = LogicLab.evaluate(this.gate1, inputs.A, inputs.B);

        let finalY = 0;
        let step2Text = '';
        let exprText = '';

        if (g2Obj.inputs.length === 1) {
          // NOT gate as Gate 2
          finalY = LogicLab.evaluate(this.gate2, intermediate);
          step2Text = `Gate 2 (${this.gate2}): ¬(${intermediate}) = ${finalY}`;
          exprText = `Y = (${this.gate1 === 'AND' ? 'A · B' : `${this.gate1}(A, B)`})'`;
        } else {
          finalY = LogicLab.evaluate(this.gate2, intermediate, inputs.C);
          step2Text = `Gate 2 (${this.gate2}): ${intermediate} ${g2Obj.symbolText} ${inputs.C} = ${finalY}`;
          const g1Str = this.gate1 === 'AND' ? 'A · B' : (this.gate1 === 'OR' ? 'A + B' : `${this.gate1}(A, B)`);
          exprText = `Y = (${g1Str}) ${g2Obj.symbolText} C`;
        }

        return {
          nodes: {
            node1: intermediate
          },
          final: finalY,
          expression: exprText,
          steps: [
            `Gate 1 (${this.gate1}): ${inputs.A} ${g1Obj.symbolText} ${inputs.B} = ${intermediate}`,
            step2Text
          ]
        };
      }
    },

    nandXor: {
      id: 'nandXor',
      name: 'Universal Gate Demo: XOR from 4 NANDs',
      description: 'Demonstrates functional completeness of NAND gates. Four interconnected NAND gates synthesize a perfect XOR operation.',
      inputs: ['A', 'B'],
      initialState: { A: 1, B: 0 },
      evaluate: (inputs) => {
        const n1 = LogicLab.evaluate('NAND', inputs.A, inputs.B);
        const n2 = LogicLab.evaluate('NAND', inputs.A, n1);
        const n3 = LogicLab.evaluate('NAND', n1, inputs.B);
        const finalY = LogicLab.evaluate('NAND', n2, n3);
        return {
          nodes: {
            n1: n1,
            n2: n2,
            n3: n3
          },
          final: finalY,
          expression: "Y = NAND(NAND(A, n1), NAND(n1, B)) ≡ A ⊕ B",
          steps: [
            `Stage 1 NAND: (${inputs.A} · ${inputs.B})' = ${n1}`,
            `Stage 2 Upper NAND: (${inputs.A} · ${n1})' = ${n2}`,
            `Stage 2 Lower NAND: (${n1} · ${inputs.B})' = ${n3}`,
            `Output NAND: (${n2} · ${n3})' = ${finalY}`
          ]
        };
      }
    }
  };

  let activePresetKey = 'combination';
  let activeInputs = { A: 1, B: 0, C: 1 };

  function renderApp() {
    const currentPreset = PRESETS[activePresetKey];
    const evalResult = currentPreset.evaluate(activeInputs);
    const isY1 = evalResult.final === 1;

    let html = `
      <div class="builder-layout">
        <!-- TOP: Preset Selector Toolbar -->
        <div class="builder-toolbar">
          <div class="toolbar-label">
            <span class="toolbar-icon">⚡</span>
            <span>Circuit Architecture:</span>
          </div>
          <div class="preset-pill-group">
            ${Object.keys(PRESETS).map(key => `
              <button type="button" class="preset-pill ${key === activePresetKey ? 'active-pill' : ''}" data-preset="${key}">
                ${PRESETS[key].name.split(':')[0]}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- MAIN WORKSPACE -->
        <div class="builder-workspace-grid">
          <!-- LEFT / CENTER: Circuit Schematic Canvas -->
          <div class="builder-schematic-card">
            <div class="schematic-header">
              <div>
                <h3 class="schematic-title">${currentPreset.name}</h3>
                <p class="schematic-desc">${currentPreset.description}</p>
              </div>
              <div class="schematic-actions">
                <button type="button" class="btn-builder-action" id="builder-btn-random" title="Randomize inputs">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="16 3 21 3 21 8"></polyline>
                    <line x1="4" y1="20" x2="21" y2="3"></line>
                    <polyline points="21 16 21 21 16 21"></polyline>
                    <line x1="15" y1="15" x2="21" y2="21"></line>
                    <line x1="4" y1="4" x2="9" y2="9"></line>
                  </svg>
                  <span>Random</span>
                </button>
                <button type="button" class="btn-builder-action" id="builder-btn-reset" title="Reset workspace and inputs">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <polyline points="3 3 3 8 8 8"></polyline>
                  </svg>
                  <span>Reset</span>
                </button>
              </div>
            </div>

            <!-- Gate Selection Panel for Combination Circuit -->
            ${activePresetKey === 'combination' ? `
            <div class="custom-gate-picker-bar">
              <div class="picker-group">
                <label for="builder-gate1-select">Primary Gate 1 (Inputs A & B):</label>
                <select id="builder-gate1-select" class="builder-select">
                  ${['AND', 'OR', 'NAND', 'NOR', 'XOR'].map(g => `
                    <option value="${g}" ${PRESETS.combination.gate1 === g ? 'selected' : ''}>${g} Gate (${LogicLab.getGate(g).expression})</option>
                  `).join('')}
                </select>
              </div>
              <div class="picker-group">
                <label for="builder-gate2-select">Secondary Gate 2 (Gate 1 Output + Input C):</label>
                <select id="builder-gate2-select" class="builder-select">
                  ${['OR', 'AND', 'NOT', 'NAND', 'NOR', 'XOR'].map(g => `
                    <option value="${g}" ${PRESETS.combination.gate2 === g ? 'selected' : ''}>${g} Gate (${LogicLab.getGate(g).expression})</option>
                  `).join('')}
                </select>
              </div>
            </div>
            ` : ''}

            <!-- Circuit Schematic SVG Canvas -->
            <div class="canvas-viewport">
              ${renderSchematicSvg(currentPreset, activeInputs, evalResult)}
            </div>

            <!-- Interactive Inputs Switches Panel -->
            <div class="builder-switches-panel">
              <span class="switches-panel-title">Binary Input Controls:</span>
              <div class="switches-row">
                ${currentPreset.inputs.map(inputName => {
                  const val = activeInputs[inputName] || 0;
                  const isHigh = val === 1;
                  return `
                    <div class="builder-switch-unit">
                      <span class="builder-switch-label">Input ${inputName}</span>
                      <button type="button" class="builder-toggle-btn ${isHigh ? 'btn-active-high' : 'btn-inactive-low'}" data-input="${inputName}">
                        <span class="toggle-slider"><span class="slider-thumb"></span></span>
                        <span class="toggle-binary-text">${val}</span>
                        <span class="toggle-state-text">${isHigh ? 'HIGH' : 'LOW'}</span>
                      </button>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: Evaluation Steps & Dynamic Multi-bit Truth Table -->
          <div class="builder-sidebar-card">
            <!-- Dynamic Boolean Formula & Step Evaluation -->
            <div class="builder-eval-box">
              <h4 class="sidebar-box-title">
                <span class="box-icon">fx</span>
                <span>Circuit Logic Evaluation</span>
              </h4>
              <div class="eval-expression-badge">
                <code>${evalResult.expression}</code>
              </div>
              <div class="eval-steps-wrapper">
                <span class="eval-steps-label">Propagation Steps:</span>
                <ul class="eval-step-list">
                  ${evalResult.steps.map((st, i) => `
                    <li><span class="step-num">${i + 1}</span> ${st}</li>
                  `).join('')}
                </ul>
              </div>
              <div class="final-eval-badge ${isY1 ? 'badge-high' : 'badge-low'}">
                Final Circuit Output Y: <strong>${evalResult.final} (${isY1 ? 'HIGH / ON' : 'LOW / OFF'})</strong>
              </div>
            </div>

            <!-- Composite Truth Table -->
            <div class="builder-truth-table-box">
              <h4 class="sidebar-box-title">
                <span class="box-icon">⊞</span>
                <span>Composite Truth Table</span>
              </h4>
              <p class="builder-tt-hint">Click any row below to test that input state</p>
              <div class="table-responsive-wrapper">
                ${renderCompositeTruthTable(currentPreset, activeInputs)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    attachEventListeners();
  }

  /**
   * Generates dynamic SVG for the active preset
   */
  function renderSchematicSvg(preset, inputs, evalResult) {
    if (preset.id === 'combination') {
      const g1Type = preset.gate1 || 'AND';
      const g2Type = preset.gate2 || 'OR';
      const isSingleStage2 = LogicLab.getGate(g2Type).inputs.length === 1;

      const isA1 = inputs.A === 1;
      const isB1 = inputs.B === 1;
      const isC1 = isSingleStage2 ? false : inputs.C === 1;
      const isNode1_1 = evalResult.nodes.node1 === 1;
      const isY1 = evalResult.final === 1;

      return `
        <svg viewBox="0 0 680 260" class="builder-schematic-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="bCyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="bGreenGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <radialGradient id="bLedOn" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stop-color="#86EFAC" />
              <stop offset="35%" stop-color="#22C55E" />
              <stop offset="100%" stop-color="#052E16" />
            </radialGradient>
          </defs>

          <!-- Input A Wire -->
          <path d="M 40 60 L 140 60" stroke="${isA1 ? '#38BDF8' : '#334155'}" stroke-width="4.5" stroke-linecap="round" ${isA1 ? 'filter="url(#bCyanGlow)"' : ''} />
          <text x="30" y="56" text-anchor="end" fill="#94A3B8" font-size="12" font-weight="700">A</text>
          <text x="30" y="72" text-anchor="end" fill="${isA1 ? '#38BDF8' : '#64748B'}" font-size="11" font-weight="700">${inputs.A}</text>

          <!-- Input B Wire -->
          <path d="M 40 100 L 140 100" stroke="${isB1 ? '#38BDF8' : '#334155'}" stroke-width="4.5" stroke-linecap="round" ${isB1 ? 'filter="url(#bCyanGlow)"' : ''} />
          <text x="30" y="96" text-anchor="end" fill="#94A3B8" font-size="12" font-weight="700">B</text>
          <text x="30" y="112" text-anchor="end" fill="${isB1 ? '#38BDF8' : '#64748B'}" font-size="11" font-weight="700">${inputs.B}</text>

          <!-- Gate 1 (Inputs A & B) -->
          <g transform="translate(20, -35)">
            ${LogicLabSimulator.getGateSvgMarkup(g1Type)}
          </g>

          <!-- Intermediate Wire 1 (Gate 1 Output -> Gate 2 Input 1) -->
          <path d="${isSingleStage2 ? 'M 245 80 L 330 80 L 330 130 L 380 130' : 'M 245 80 L 330 80 L 330 110 L 380 110'}" 
                stroke="${isNode1_1 ? '#38BDF8' : '#334155'}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"
                ${isNode1_1 ? 'filter="url(#bCyanGlow)"' : ''} />
          
          <rect x="255" y="66" width="70" height="24" rx="4" fill="#1E293B" stroke="${isNode1_1 ? '#38BDF8' : '#475569'}" stroke-width="1.5" />
          <text x="290" y="82" text-anchor="middle" fill="${isNode1_1 ? '#38BDF8' : '#94A3B8'}" font-size="10" font-weight="700">Node: ${evalResult.nodes.node1}</text>

          ${!isSingleStage2 ? `
          <!-- Input C Wire -> Gate 2 Input 2 -->
          <path d="M 40 180 L 330 180 L 330 150 L 380 150" 
                stroke="${isC1 ? '#38BDF8' : '#334155'}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"
                ${isC1 ? 'filter="url(#bCyanGlow)"' : ''} />
          <text x="30" y="176" text-anchor="end" fill="#94A3B8" font-size="12" font-weight="700">C</text>
          <text x="30" y="192" text-anchor="end" fill="${isC1 ? '#38BDF8' : '#64748B'}" font-size="11" font-weight="700">${inputs.C}</text>
          ` : `
          <!-- Single input stage 2 note -->
          <text x="380" y="180" fill="#64748B" font-size="10" font-style="italic">(Gate 2 Inverter - Input C not needed)</text>
          `}

          <!-- Gate 2 -->
          <g transform="translate(260, 15)">
            ${LogicLabSimulator.getGateSvgMarkup(g2Type)}
          </g>

          <!-- Final Output Wire -->
          <path d="M 480 130 L 570 130" stroke="${isY1 ? '#22C55E' : '#334155'}" stroke-width="4.5" stroke-linecap="round" ${isY1 ? 'filter="url(#bGreenGlow)"' : ''} />
          <text x="525" y="120" text-anchor="middle" fill="#94A3B8" font-size="12" font-weight="700">Y</text>
          <text x="525" y="145" text-anchor="middle" fill="${isY1 ? '#22C55E' : '#64748B'}" font-size="12" font-weight="700">${evalResult.final}</text>

          <!-- Output LED -->
          <g transform="translate(620, 130)">
            <circle cx="0" cy="0" r="24" fill="#1E293B" stroke="#475569" stroke-width="3" />
            <circle cx="0" cy="0" r="17" fill="${isY1 ? 'url(#bLedOn)' : '#334155'}" ${isY1 ? 'filter="url(#bGreenGlow)"' : ''} />
            <ellipse cx="-4" cy="-5" rx="5" ry="3" fill="#FFFFFF" opacity="${isY1 ? '0.75' : '0.2'}" />
            <text x="0" y="42" text-anchor="middle" fill="${isY1 ? '#22C55E' : '#94A3B8'}" font-size="11" font-weight="700">
              ${isY1 ? 'OUTPUT: 1' : 'OUTPUT: 0'}
            </text>
          </g>
        </svg>
      `;
    }

    if (preset.id === 'nandXor') {
      const isA1 = inputs.A === 1;
      const isB1 = inputs.B === 1;
      const isN1_1 = evalResult.nodes.n1 === 1;
      const isN2_1 = evalResult.nodes.n2 === 1;
      const isN3_1 = evalResult.nodes.n3 === 1;
      const isY1 = evalResult.final === 1;

      return `
        <svg viewBox="0 0 700 270" class="builder-schematic-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="nxCyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="nxGreenGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <radialGradient id="nxLedOn" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stop-color="#86EFAC" />
              <stop offset="35%" stop-color="#22C55E" />
              <stop offset="100%" stop-color="#052E16" />
            </radialGradient>
          </defs>

          <!-- Input A branches into NAND 1 and NAND 2 -->
          <path d="M 40 45 L 240 45" stroke="${isA1 ? '#38BDF8' : '#334155'}" stroke-width="4" stroke-linecap="round" ${isA1 ? 'filter="url(#nxCyanGlow)"' : ''} />
          <path d="M 80 45 L 80 115 L 120 115" stroke="${isA1 ? '#38BDF8' : '#334155'}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" ${isA1 ? 'filter="url(#nxCyanGlow)"' : ''} />
          <circle cx="80" cy="45" r="4.5" fill="${isA1 ? '#38BDF8' : '#334155'}" />
          <text x="30" y="42" text-anchor="end" fill="#94A3B8" font-size="11" font-weight="700">A</text>
          <text x="30" y="56" text-anchor="end" fill="${isA1 ? '#38BDF8' : '#64748B'}" font-size="10" font-weight="700">${inputs.A}</text>

          <!-- Input B branches into NAND 1 and NAND 3 -->
          <path d="M 40 225 L 240 225" stroke="${isB1 ? '#38BDF8' : '#334155'}" stroke-width="4" stroke-linecap="round" ${isB1 ? 'filter="url(#nxCyanGlow)"' : ''} />
          <path d="M 95 225 L 95 155 L 120 155" stroke="${isB1 ? '#38BDF8' : '#334155'}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" ${isB1 ? 'filter="url(#nxCyanGlow)"' : ''} />
          <circle cx="95" cy="225" r="4.5" fill="${isB1 ? '#38BDF8' : '#334155'}" />
          <text x="30" y="222" text-anchor="end" fill="#94A3B8" font-size="11" font-weight="700">B</text>
          <text x="30" y="236" text-anchor="end" fill="${isB1 ? '#38BDF8' : '#64748B'}" font-size="10" font-weight="700">${inputs.B}</text>

          <!-- Central Stage 1 NAND -->
          <g transform="translate(0, 20)">
            ${LogicLabSimulator.getGateSvgMarkup('NAND')}
          </g>

          <!-- n1 Wire splitting into Stage 2 Upper & Lower NANDs -->
          <path d="M 235 135 L 255 135 L 255 75 L 270 75" stroke="${isN1_1 ? '#38BDF8' : '#334155'}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" ${isN1_1 ? 'filter="url(#nxCyanGlow)"' : ''} />
          <path d="M 255 135 L 255 195 L 270 195" stroke="${isN1_1 ? '#38BDF8' : '#334155'}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" ${isN1_1 ? 'filter="url(#nxCyanGlow)"' : ''} />
          <circle cx="255" cy="135" r="4.5" fill="${isN1_1 ? '#38BDF8' : '#334155'}" />

          <!-- Upper NAND (A and n1) -->
          <g transform="translate(150, -55)">
            ${LogicLabSimulator.getGateSvgMarkup('NAND')}
          </g>

          <!-- Lower NAND (n1 and B) -->
          <g transform="translate(150, 95)">
            ${LogicLabSimulator.getGateSvgMarkup('NAND')}
          </g>

          <!-- Upper NAND Out (n2) to Final NAND -->
          <path d="M 385 60 L 440 60 L 440 120 L 460 120" stroke="${isN2_1 ? '#38BDF8' : '#334155'}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" ${isN2_1 ? 'filter="url(#nxCyanGlow)"' : ''} />
          <!-- Lower NAND Out (n3) to Final NAND -->
          <path d="M 385 210 L 440 210 L 440 150 L 460 150" stroke="${isN3_1 ? '#38BDF8' : '#334155'}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" ${isN3_1 ? 'filter="url(#nxCyanGlow)"' : ''} />

          <!-- Stage 3 Output NAND -->
          <g transform="translate(345, 20)">
            ${LogicLabSimulator.getGateSvgMarkup('NAND')}
          </g>

          <!-- Final Output Wire to LED -->
          <path d="M 580 135 L 615 135" stroke="${isY1 ? '#22C55E' : '#334155'}" stroke-width="4.5" stroke-linecap="round" ${isY1 ? 'filter="url(#nxGreenGlow)"' : ''} />
          <text x="595" y="122" text-anchor="middle" fill="#94A3B8" font-size="12" font-weight="700">Y</text>
          <text x="595" y="152" text-anchor="middle" fill="${isY1 ? '#22C55E' : '#64748B'}" font-size="12" font-weight="700">${evalResult.final}</text>

          <!-- Output LED -->
          <g transform="translate(645, 135)">
            <circle cx="0" cy="0" r="22" fill="#1E293B" stroke="#475569" stroke-width="3" />
            <circle cx="0" cy="0" r="16" fill="${isY1 ? 'url(#nxLedOn)' : '#334155'}" ${isY1 ? 'filter="url(#nxGreenGlow)"' : ''} />
            <ellipse cx="-3" cy="-4" rx="4" ry="2.5" fill="#FFFFFF" opacity="${isY1 ? '0.75' : '0.2'}" />
            <text x="0" y="38" text-anchor="middle" fill="${isY1 ? '#22C55E' : '#94A3B8'}" font-size="11" font-weight="700">
              ${isY1 ? 'OUTPUT: 1' : 'OUTPUT: 0'}
            </text>
          </g>
        </svg>
      `;
    }

    return `
      <div class="circuit-placeholder-box">
        <p>Schematic rendered for <strong>${preset.name}</strong></p>
      </div>
    `;
  }

  /**
   * Generates interactive multi-variable truth table
   */
  function renderCompositeTruthTable(preset, inputs) {
    const inputVars = preset.inputs;
    const numRows = Math.pow(2, inputVars.length);
    let rowsHtml = '';

    for (let r = 0; r < numRows; r++) {
      const rowInputs = {};
      inputVars.forEach((v, idx) => {
        const bitShift = inputVars.length - 1 - idx;
        rowInputs[v] = (r >> bitShift) & 1;
      });

      const res = preset.evaluate(rowInputs);
      const isActive = inputVars.every(v => inputs[v] === rowInputs[v]);

      rowsHtml += `
        <tr class="builder-tt-row ${isActive ? 'active-row' : ''}" data-row-inputs='${JSON.stringify(rowInputs)}'>
          ${inputVars.map(v => `
            <td><span class="bit-badge bit-${rowInputs[v]}">${rowInputs[v]}</span></td>
          `).join('')}
          <td class="col-output">
            <span class="bit-badge bit-${res.final} ${res.final === 1 ? 'bit-high' : 'bit-low'}">${res.final}</span>
          </td>
          <td>
            <button type="button" class="btn-select-row" aria-label="Apply row">
              <span class="row-select-label">${isActive ? 'Active' : 'Apply'}</span>
            </button>
          </td>
        </tr>
      `;
    }

    return `
      <table class="logic-truth-table">
        <thead>
          <tr>
            ${inputVars.map(v => `<th>${v}</th>`).join('')}
            <th class="col-output">Output Y</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
  }

  function attachEventListeners() {
    // Presets switching
    const pills = container.querySelectorAll('.preset-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        const key = pill.getAttribute('data-preset');
        if (PRESETS[key]) {
          activePresetKey = key;
          activeInputs = { ...PRESETS[key].initialState };
          LogicLabSimulator.AudioFeedback.playClick(true);
          renderApp();
        }
      });
    });

    // Combination Gate 1 & Gate 2 Selectors
    const g1Select = document.getElementById('builder-gate1-select');
    if (g1Select) {
      g1Select.addEventListener('change', (e) => {
        PRESETS.combination.gate1 = e.target.value;
        renderApp();
      });
    }

    const g2Select = document.getElementById('builder-gate2-select');
    if (g2Select) {
      g2Select.addEventListener('change', (e) => {
        PRESETS.combination.gate2 = e.target.value;
        renderApp();
      });
    }

    // Input toggle buttons
    const toggles = container.querySelectorAll('.builder-toggle-btn');
    toggles.forEach(btn => {
      btn.addEventListener('click', () => {
        const inputKey = btn.getAttribute('data-input');
        activeInputs[inputKey] = activeInputs[inputKey] === 1 ? 0 : 1;
        LogicLabSimulator.AudioFeedback.playClick(activeInputs[inputKey] === 1);
        renderApp();
      });
    });

    // Random inputs
    const btnRandom = document.getElementById('builder-btn-random');
    if (btnRandom) {
      btnRandom.addEventListener('click', () => {
        const preset = PRESETS[activePresetKey];
        preset.inputs.forEach(v => {
          activeInputs[v] = Math.random() < 0.5 ? 0 : 1;
        });
        LogicLabSimulator.AudioFeedback.playClick(true);
        renderApp();
      });
    }

    // Reset workspace & inputs
    const btnReset = document.getElementById('builder-btn-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        const preset = PRESETS[activePresetKey];
        preset.inputs.forEach(v => {
          activeInputs[v] = 0;
        });
        if (activePresetKey === 'combination') {
          PRESETS.combination.gate1 = 'AND';
          PRESETS.combination.gate2 = 'OR';
        }
        LogicLabSimulator.AudioFeedback.playClick(false);
        renderApp();
      });
    }

    // Truth Table row clicks
    const rows = container.querySelectorAll('.builder-tt-row');
    rows.forEach(r => {
      r.addEventListener('click', () => {
        try {
          const rowData = JSON.parse(r.getAttribute('data-row-inputs'));
          activeInputs = { ...rowData };
          LogicLabSimulator.AudioFeedback.playClick(true);
          renderApp();
        } catch (e) {}
      });
    });
  }

  // Initial render
  renderApp();
});
