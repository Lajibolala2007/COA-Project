/**
 * LogicLab - Central Digital Logic Calculation Engine
 * Contains pure, centralized Boolean logic definitions, truth tables,
 * mathematical substitutions, and contextual educational explanations.
 */

const LogicLab = (function () {
  'use strict';

  // Gate definitions and specifications
  const GATES = {
    AND: {
      id: 'AND',
      name: 'AND Gate',
      inputs: ['A', 'B'],
      expression: 'Y = A · B',
      symbolText: '·',
      standardSymbol: 'AND',
      summary: 'The output is HIGH (1) only when both inputs A and B are HIGH (1).',
      truthTable: [
        { A: 0, B: 0, Y: 0 },
        { A: 0, B: 1, Y: 0 },
        { A: 1, B: 0, Y: 0 },
        { A: 1, B: 1, Y: 1 }
      ],
      calculate: (A, B) => (A === 1 && B === 1 ? 1 : 0),
      getSubstitution: (A, B, Y) => [
        'Y = A · B',
        `Y = ${A} · ${B}`,
        `Y = ${Y}`
      ],
      explanations: {
        '0,0': 'Both inputs A and B are LOW (0). Because an AND gate requires both inputs to be HIGH (1) to activate, the output is 0 and the LED remains OFF.',
        '0,1': 'Input A is LOW (0) while Input B is HIGH (1). An AND gate requires ALL inputs to be HIGH. Since Input A is LOW, the condition fails. The output is 0 and the LED remains OFF.',
        '1,0': 'Input A is HIGH (1) while Input B is LOW (0). An AND gate requires ALL inputs to be HIGH. Since Input B is LOW, the condition fails. The output is 0 and the LED remains OFF.',
        '1,1': 'Both inputs A and B are HIGH (1). Because both inputs meet the required condition (A = 1 and B = 1), the AND gate triggers a HIGH output. The output is 1 and the LED turns ON with a bright green glow.'
      }
    },

    OR: {
      id: 'OR',
      name: 'OR Gate',
      inputs: ['A', 'B'],
      expression: 'Y = A + B',
      symbolText: '+',
      standardSymbol: 'OR',
      summary: 'The output is HIGH (1) if at least one input (A or B) is HIGH (1).',
      truthTable: [
        { A: 0, B: 0, Y: 0 },
        { A: 0, B: 1, Y: 1 },
        { A: 1, B: 0, Y: 1 },
        { A: 1, B: 1, Y: 1 }
      ],
      calculate: (A, B) => (A === 1 || B === 1 ? 1 : 0),
      getSubstitution: (A, B, Y) => [
        'Y = A + B',
        `Y = ${A} + ${B}`,
        `Y = ${Y}`
      ],
      explanations: {
        '0,0': 'Both inputs A and B are LOW (0). An OR gate requires at least one input to be HIGH (1) to generate a HIGH output. Since neither input is HIGH, the output is 0 and the LED remains OFF.',
        '0,1': 'Input A is LOW (0) and Input B is HIGH (1). Because an OR gate produces HIGH whenever at least one input is active, Input B satisfies the condition. The output is 1 and the LED turns ON.',
        '1,0': 'Input A is HIGH (1) and Input B is LOW (0). Because an OR gate produces HIGH whenever at least one input is active, Input A satisfies the condition. The output is 1 and the LED turns ON.',
        '1,1': 'Both inputs A and B are HIGH (1). Since both inputs are active, the OR condition is satisfied. The output is 1 and the LED turns ON with a bright green glow.'
      }
    },

    NOT: {
      id: 'NOT',
      name: 'NOT Gate (Inverter)',
      inputs: ['A'],
      expression: 'Y = Ā',
      symbolText: "'",
      standardSymbol: 'NOT',
      summary: 'The output is the logical inversion of the single input A.',
      truthTable: [
        { A: 0, Y: 1 },
        { A: 1, Y: 0 }
      ],
      calculate: (A) => (A === 0 ? 1 : 0),
      getSubstitution: (A, _, Y) => [
        'Y = Ā',
        `Y = ¬(${A})`,
        `Y = ${Y}`
      ],
      explanations: {
        '0': 'Input A is LOW (0). The NOT gate (inverter) inverts the incoming signal, transforming 0 into 1. Therefore, the output is 1 and the LED turns ON.',
        '1': 'Input A is HIGH (1). The NOT gate (inverter) inverts the incoming signal, transforming 1 into 0. Therefore, the output is 0 and the LED remains OFF.'
      }
    },

    NAND: {
      id: 'NAND',
      name: 'NAND Gate',
      inputs: ['A', 'B'],
      expression: "Y = (A · B)'",
      symbolText: '·',
      standardSymbol: 'NAND',
      summary: 'The output is LOW (0) only when both inputs A and B are HIGH (1). It is an inverted AND gate.',
      truthTable: [
        { A: 0, B: 0, Y: 1 },
        { A: 0, B: 1, Y: 1 },
        { A: 1, B: 0, Y: 1 },
        { A: 1, B: 1, Y: 0 }
      ],
      calculate: (A, B) => (A === 1 && B === 1 ? 0 : 1),
      getSubstitution: (A, B, Y) => [
        "Y = (A · B)'",
        `Y = (${A} · ${B})'`,
        `Y = (${A === 1 && B === 1 ? 1 : 0})'`,
        `Y = ${Y}`
      ],
      explanations: {
        '0,0': 'Both inputs A and B are LOW (0). The AND operation yields 0 (0 · 0 = 0). The NAND inversion bubble inverts 0 to 1. Therefore, the output is 1 and the LED turns ON.',
        '0,1': 'Input A is LOW (0) and Input B is HIGH (1). The AND operation yields 0 (0 · 1 = 0). The NAND inversion bubble inverts 0 to 1. Therefore, the output is 1 and the LED turns ON.',
        '1,0': 'Input A is HIGH (1) and Input B is LOW (0). The AND operation yields 0 (1 · 0 = 0). The NAND inversion bubble inverts 0 to 1. Therefore, the output is 1 and the LED turns ON.',
        '1,1': 'Both inputs A and B are HIGH (1). The AND operation yields 1 (1 · 1 = 1). The NAND inversion bubble inverts 1 to 0. Therefore, the output is 0 and the LED remains OFF.'
      }
    },

    NOR: {
      id: 'NOR',
      name: 'NOR Gate',
      inputs: ['A', 'B'],
      expression: "Y = (A + B)'",
      symbolText: '+',
      standardSymbol: 'NOR',
      summary: 'The output is HIGH (1) only when both inputs A and B are LOW (0). It is an inverted OR gate.',
      truthTable: [
        { A: 0, B: 0, Y: 1 },
        { A: 0, B: 1, Y: 0 },
        { A: 1, B: 0, Y: 0 },
        { A: 1, B: 1, Y: 0 }
      ],
      calculate: (A, B) => (A === 0 && B === 0 ? 1 : 0),
      getSubstitution: (A, B, Y) => [
        "Y = (A + B)'",
        `Y = (${A} + ${B})'`,
        `Y = (${A === 1 || B === 1 ? 1 : 0})'`,
        `Y = ${Y}`
      ],
      explanations: {
        '0,0': 'Both inputs A and B are LOW (0). The OR operation yields 0 (0 + 0 = 0). The NOR inversion bubble inverts 0 to 1. Therefore, the output is 1 and the LED turns ON.',
        '0,1': 'Input A is LOW (0) and Input B is HIGH (1). The OR operation yields 1 (0 + 1 = 1). The NOR inversion bubble inverts 1 to 0. Therefore, the output is 0 and the LED remains OFF.',
        '1,0': 'Input A is HIGH (1) and Input B is LOW (0). The OR operation yields 1 (1 + 0 = 1). The NOR inversion bubble inverts 1 to 0. Therefore, the output is 0 and the LED remains OFF.',
        '1,1': 'Both inputs A and B are HIGH (1). The OR operation yields 1 (1 + 1 = 1). The NOR inversion bubble inverts 1 to 0. Therefore, the output is 0 and the LED remains OFF.'
      }
    },

    XOR: {
      id: 'XOR',
      name: 'XOR Gate (Exclusive OR)',
      inputs: ['A', 'B'],
      expression: 'Y = A ⊕ B',
      symbolText: '⊕',
      standardSymbol: 'XOR',
      summary: 'The output is HIGH (1) when the inputs are strictly different (one is 1, the other is 0).',
      truthTable: [
        { A: 0, B: 0, Y: 0 },
        { A: 0, B: 1, Y: 1 },
        { A: 1, B: 0, Y: 1 },
        { A: 1, B: 1, Y: 0 }
      ],
      calculate: (A, B) => (A !== B ? 1 : 0),
      getSubstitution: (A, B, Y) => [
        'Y = A ⊕ B',
        `Y = ${A} ⊕ ${B}`,
        `Y = ${Y}`
      ],
      explanations: {
        '0,0': 'Both inputs A and B are LOW (0). Because both inputs have identical values (0 and 0), an exclusive OR (XOR) condition is NOT met. The output is 0 and the LED remains OFF.',
        '0,1': 'Input A is LOW (0) and Input B is HIGH (1). The inputs are different (one is 0, the other is 1), satisfying the XOR condition. The output is 1 and the LED turns ON.',
        '1,0': 'Input A is HIGH (1) and Input B is LOW (0). The inputs are different (one is 1, the other is 0), satisfying the XOR condition. The output is 1 and the LED turns ON.',
        '1,1': 'Both inputs A and B are HIGH (1). Because both inputs have identical values (1 and 1), the XOR condition is NOT met (unlike a standard OR gate). The output is 0 and the LED remains OFF.'
      }
    }
  };

  /**
   * Central evaluation function for any logic gate.
   * @param {string} gateId - 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR'
   * @param {number} inputA - 0 or 1
   * @param {number} [inputB] - 0 or 1 (ignored for NOT)
   * @returns {number} 0 or 1
   */
  function evaluate(gateId, inputA, inputB = 0) {
    const gate = GATES[gateId.toUpperCase()];
    if (!gate) {
      throw new Error(`Unknown gate type: ${gateId}`);
    }
    const a = inputA ? 1 : 0;
    const b = inputB ? 1 : 0;
    return gate.calculate(a, b);
  }

  /**
   * Returns metadata and definitions for a gate.
   */
  function getGate(gateId) {
    return GATES[gateId.toUpperCase()] || null;
  }

  /**
   * Returns all supported gates.
   */
  function getAllGates() {
    return Object.values(GATES);
  }

  /**
   * Returns human-readable substitution steps for current inputs.
   */
  function getSubstitution(gateId, inputA, inputB = 0) {
    const gate = getGate(gateId);
    if (!gate) return [];
    const a = inputA ? 1 : 0;
    const b = inputB ? 1 : 0;
    const y = gate.calculate(a, b);
    return gate.getSubstitution(a, b, y);
  }

  /**
   * Returns dynamic educational explanation for current inputs.
   */
  function getExplanation(gateId, inputA, inputB = 0) {
    const gate = getGate(gateId);
    if (!gate) return '';
    const a = inputA ? 1 : 0;
    const b = inputB ? 1 : 0;
    const key = gate.id === 'NOT' ? `${a}` : `${a},${b}`;
    return gate.explanations[key] || '';
  }

  return {
    GATES,
    evaluate,
    getGate,
    getAllGates,
    getSubstitution,
    getExplanation
  };
})();

// Attach to window for browser global access and module for Node testing
if (typeof window !== 'undefined') {
  window.LogicLab = LogicLab;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LogicLab;
}
