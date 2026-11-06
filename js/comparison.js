/**
 * LogicLab - Gate Comparison Mode
 * Powers /pages/compare.html
 * Allows dynamic side-by-side comparison of any two logic gates with shared inputs,
 * synchronized circuit simulations, comparison truth tables, and educational analysis.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  let gate1Id = 'AND';
  let gate2Id = 'NAND';
  let inputState = { A: 1, B: 1 };

  // DOM Elements
  const selectGate1 = document.getElementById('select-gate-1');
  const selectGate2 = document.getElementById('select-gate-2');

  const switchA = document.getElementById('comp-switch-a');
  const switchB = document.getElementById('comp-switch-b');
  const btnRandom = document.getElementById('comp-btn-random');
  const btnReset = document.getElementById('comp-btn-reset');

  const circuit1Container = document.getElementById('comp-circuit-1');
  const circuit2Container = document.getElementById('comp-circuit-2');

  const compTableBody = document.getElementById('comp-table-body');
  const insightContainer = document.getElementById('comp-insights');

  // Check if we are on the comparison page
  if (!selectGate1 || !selectGate2) return;

  function renderGateCircuit(gateId, targetElement, inputA, inputB, index) {
    const gate = LogicLab.getGate(gateId);
    if (!gate || !targetElement) return;

    const isSingle = gate.inputs.length === 1;
    const outputY = LogicLab.evaluate(gate.id, inputA, inputB);
    const isA1 = inputA === 1;
    const isB1 = isSingle ? false : inputB === 1;
    const isY1 = outputY === 1;

    const prefix = `comp-${index}`;

    let svgPath = '';
    switch (gate.id) {
      case 'AND': svgPath = 'M 220 115 L 340 115'; break;
      case 'OR': svgPath = 'M 210 115 L 340 115'; break;
      case 'NOT': svgPath = 'M 200 115 L 340 115'; break;
      case 'NAND': svgPath = 'M 229 115 L 340 115'; break;
      case 'NOR': svgPath = 'M 220 115 L 340 115'; break;
      case 'XOR': svgPath = 'M 211 115 L 340 115'; break;
    }

    targetElement.innerHTML = `
      <div class="comp-gate-header">
        <div class="comp-gate-name">${gate.name}</div>
        <div class="comp-gate-expr"><code>${gate.expression}</code></div>
      </div>

      <div class="comp-circuit-box">
        <svg viewBox="0 0 440 210" class="comp-circuit-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="${prefix}-cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="${prefix}-greenGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <radialGradient id="${prefix}-ledOn" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stop-color="#86EFAC" />
              <stop offset="35%" stop-color="#22C55E" />
              <stop offset="85%" stop-color="#15803D" />
              <stop offset="100%" stop-color="#052E16" />
            </radialGradient>
          </defs>

          <!-- Input A line -->
          <path d="${isSingle ? 'M 40 115 L 120 115' : 'M 40 85 L 120 85'}" 
                stroke="${isA1 ? '#38BDF8' : '#334155'}" stroke-width="4.5" stroke-linecap="round" 
                ${isA1 ? `filter="url(#${prefix}-cyanGlow)"` : ''} />
          <text x="32" y="${isSingle ? '112' : '80'}" text-anchor="end" fill="#94A3B8" font-size="12" font-weight="700">A</text>
          <text x="32" y="${isSingle ? '128' : '96'}" text-anchor="end" fill="${isA1 ? '#38BDF8' : '#64748B'}" font-size="11" font-weight="700">${inputA}</text>

          <!-- Input B line (if 2-input) -->
          ${!isSingle ? `
          <path d="M 40 145 L 120 145" 
                stroke="${isB1 ? '#38BDF8' : '#334155'}" stroke-width="4.5" stroke-linecap="round" 
                ${isB1 ? `filter="url(#${prefix}-cyanGlow)"` : ''} />
          <text x="32" y="140" text-anchor="end" fill="#94A3B8" font-size="12" font-weight="700">B</text>
          <text x="32" y="156" text-anchor="end" fill="${isB1 ? '#38BDF8' : '#64748B'}" font-size="11" font-weight="700">${inputB}</text>
          ` : `
          <!-- Single input note -->
          <text x="70" y="150" fill="#64748B" font-size="10" font-style="italic">(Input B not connected)</text>
          `}

          <!-- Gate Symbol -->
          <g>
            ${LogicLabSimulator.getGateSvgMarkup(gate.id)}
          </g>

          <!-- Output Line -->
          <path d="${svgPath}" 
                stroke="${isY1 ? '#22C55E' : '#334155'}" stroke-width="4.5" stroke-linecap="round" 
                ${isY1 ? `filter="url(#${prefix}-greenGlow)"` : ''} />
          <text x="280" y="105" text-anchor="middle" fill="#94A3B8" font-size="12" font-weight="700">Y</text>
          <text x="280" y="125" text-anchor="middle" fill="${isY1 ? '#22C55E' : '#64748B'}" font-size="12" font-weight="700">${outputY}</text>

          <!-- Output LED -->
          <g transform="translate(370, 115)">
            <circle cx="0" cy="0" r="22" fill="#1E293B" stroke="#475569" stroke-width="2.5" />
            <circle cx="0" cy="0" r="15" fill="${isY1 ? `url(#${prefix}-ledOn)` : '#334155'}" 
                    ${isY1 ? `filter="url(#${prefix}-greenGlow)"` : ''} />
            <ellipse cx="-3" cy="-4" rx="4" ry="2.5" fill="#FFFFFF" opacity="${isY1 ? '0.7' : '0.2'}" />
            <text x="0" y="38" text-anchor="middle" fill="${isY1 ? '#22C55E' : '#94A3B8'}" font-size="11" font-weight="700">
              ${isY1 ? 'OUTPUT: 1' : 'OUTPUT: 0'}
            </text>
          </g>
        </svg>
      </div>

      <div class="comp-gate-summary">
        <p>${gate.summary}</p>
      </div>
    `;
  }

  function updateComparisonTable() {
    if (!compTableBody) return;
    const gate1 = LogicLab.getGate(gate1Id);
    const gate2 = LogicLab.getGate(gate2Id);

    const isG1Single = gate1.inputs.length === 1;
    const isG2Single = gate2.inputs.length === 1;

    // All 4 binary input combinations
    const rows = [
      { a: 0, b: 0 },
      { a: 0, b: 1 },
      { a: 1, b: 0 },
      { a: 1, b: 1 }
    ];

    let html = '';

    rows.forEach(r => {
      const y1 = LogicLab.evaluate(gate1Id, r.a, r.b);
      const y2 = LogicLab.evaluate(gate2Id, r.a, r.b);
      const isCurrent = inputState.A === r.a && inputState.B === r.b;

      let relationship = '';
      let badgeClass = '';

      if (y1 === y2) {
        relationship = 'Identical (=)';
        badgeClass = 'badge-match';
      } else {
        relationship = 'Inverse (≠)';
        badgeClass = 'badge-diff';
      }

      html += `
        <tr class="comp-table-row ${isCurrent ? 'active-comp-row' : ''}">
          <td><span class="bit-badge bit-${r.a}">${r.a}</span></td>
          <td><span class="bit-badge bit-${r.b}">${r.b}</span></td>
          <td class="col-center">
            <span class="bit-badge bit-${y1} ${y1 === 1 ? 'bit-high' : 'bit-low'}">${y1}</span>
          </td>
          <td class="col-center">
            <span class="bit-badge bit-${y2} ${y2 === 1 ? 'bit-high' : 'bit-low'}">${y2}</span>
          </td>
          <td class="col-center">
            <span class="rel-badge ${badgeClass}">${relationship}</span>
          </td>
        </tr>
      `;
    });

    compTableBody.innerHTML = html;
  }

  function updateComparativeInsights() {
    if (!insightContainer) return;
    const g1 = gate1Id.toUpperCase();
    const g2 = gate2Id.toUpperCase();

    let analysis = '';

    if (g1 === g2) {
      analysis = `You are comparing the <strong>${g1} Gate</strong> with itself. Both circuits produce identical Boolean outputs for all combinations of inputs.`;
    } else if ((g1 === 'AND' && g2 === 'NAND') || (g1 === 'NAND' && g2 === 'AND')) {
      analysis = `<strong>Complementary Inversion:</strong> The NAND gate is the exact negation of the AND gate (<code>Y_NAND = (Y_AND)'</code>). For every single row in the truth table, whenever the AND gate outputs 0, the NAND gate outputs 1, and when AND outputs 1, NAND outputs 0.`;
    } else if ((g1 === 'OR' && g2 === 'NOR') || (g1 === 'NOR' && g2 === 'OR')) {
      analysis = `<strong>Complementary Inversion:</strong> The NOR gate is the exact negation of the OR gate (<code>Y_NOR = (Y_OR)'</code>). A NOR gate outputs HIGH (1) strictly when neither input is active (0, 0), whereas the OR gate outputs HIGH for any active input.`;
    } else if ((g1 === 'OR' && g2 === 'XOR') || (g1 === 'XOR' && g2 === 'OR')) {
      analysis = `<strong>Inclusive vs Exclusive OR:</strong> Notice that for inputs (0,0), (0,1), and (1,0), both gates produce identical results! The crucial distinction occurs when <strong>A = 1 and B = 1</strong>: The standard OR gate is inclusive (outputs 1), while the XOR gate is strictly exclusive (outputs 0).`;
    } else if ((g1 === 'AND' && g2 === 'NOR') || (g1 === 'NOR' && g2 === 'AND')) {
      analysis = `<strong>De Morgan Duality:</strong> By De Morgan's Law, <code>(A + B)' = Ā · B̄</code>. Notice that NOR only turns ON when both inputs are 0, while AND only turns ON when both inputs are 1.`;
    } else {
      analysis = `Comparing <strong>${g1}</strong> (<code>${LogicLab.getGate(g1).expression}</code>) and <strong>${g2}</strong> (<code>${LogicLab.getGate(g2).expression}</code>). Observe how their truth table rows differ and notice which input states trigger active output on each gate.`;
    }

    insightContainer.innerHTML = `
      <div class="insight-box">
        <div class="insight-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <span>Comparative Analysis</span>
        </div>
        <p class="insight-text">${analysis}</p>
      </div>
    `;
  }

  function updateAll() {
    // Update Shared Switches UI
    if (switchA) {
      switchA.classList.toggle('btn-active-high', inputState.A === 1);
      switchA.classList.toggle('btn-inactive-low', inputState.A === 0);
      const textA = switchA.querySelector('.toggle-binary-text');
      if (textA) textA.textContent = inputState.A;
      const stateA = switchA.querySelector('.toggle-state-text');
      if (stateA) stateA.textContent = inputState.A === 1 ? 'HIGH' : 'LOW';
    }

    if (switchB) {
      switchB.classList.toggle('btn-active-high', inputState.B === 1);
      switchB.classList.toggle('btn-inactive-low', inputState.B === 0);
      const textB = switchB.querySelector('.toggle-binary-text');
      if (textB) textB.textContent = inputState.B;
      const stateB = switchB.querySelector('.toggle-state-text');
      if (stateB) stateB.textContent = inputState.B === 1 ? 'HIGH' : 'LOW';
    }

    // Render Dual Circuits
    renderGateCircuit(gate1Id, circuit1Container, inputState.A, inputState.B, 1);
    renderGateCircuit(gate2Id, circuit2Container, inputState.A, inputState.B, 2);

    // Update Comparison Table & Insights
    updateComparisonTable();
    updateComparativeInsights();
  }

  // Gate Selector Events
  selectGate1.addEventListener('change', (e) => {
    gate1Id = e.target.value;
    updatePresetChips();
    updateAll();
  });

  selectGate2.addEventListener('change', (e) => {
    gate2Id = e.target.value;
    updatePresetChips();
    updateAll();
  });

  // Comparison Preset Chips Events
  const presetBtns = document.querySelectorAll('.comp-preset-btn');
  function updatePresetChips() {
    presetBtns.forEach(btn => {
      const g1 = btn.getAttribute('data-g1');
      const g2 = btn.getAttribute('data-g2');
      const isMatch = (g1 === gate1Id && g2 === gate2Id);
      btn.classList.toggle('btn-active-preset', isMatch);
    });
  }

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const g1 = btn.getAttribute('data-g1');
      const g2 = btn.getAttribute('data-g2');
      if (g1 && g2) {
        gate1Id = g1;
        gate2Id = g2;
        selectGate1.value = g1;
        selectGate2.value = g2;
        updatePresetChips();
        LogicLabSimulator.AudioFeedback.playClick(true);
        updateAll();
      }
    });
  });

  // Switch Events
  if (switchA) {
    switchA.addEventListener('click', () => {
      inputState.A = inputState.A === 1 ? 0 : 1;
      LogicLabSimulator.AudioFeedback.playClick(inputState.A === 1);
      updateAll();
    });
  }

  if (switchB) {
    switchB.addEventListener('click', () => {
      inputState.B = inputState.B === 1 ? 0 : 1;
      LogicLabSimulator.AudioFeedback.playClick(inputState.B === 1);
      updateAll();
    });
  }

  // Random Inputs
  if (btnRandom) {
    btnRandom.addEventListener('click', () => {
      inputState.A = Math.random() < 0.5 ? 0 : 1;
      inputState.B = Math.random() < 0.5 ? 0 : 1;
      LogicLabSimulator.AudioFeedback.playClick(inputState.A === 1 || inputState.B === 1);
      updateAll();
    });
  }

  // Reset
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      inputState.A = 0;
      inputState.B = 0;
      LogicLabSimulator.AudioFeedback.playClick(false);
      updateAll();
    });
  }

  // Initial render
  updateAll();
});

