/** Small, local formula vocabulary for the vector PDF reports. */
export const distributionReportEquations = [
  String.raw`\frac{dA_{g}}{dt} = -k_{a} A_{g}`,
  String.raw`\frac{dA_{c}}{dt} = k_{a} A_{g} - (k_{ct} + k_{e}) A_{c} + k_{tc} A_{t}`,
  String.raw`\frac{dA_{t}}{dt} = k_{ct} A_{c} - k_{tc} A_{t}`,
  String.raw`\frac{dA_{r}}{dt} = k_{e} A_{c}`,
  String.raw`C_{t} = \frac{A_{t}}{V_{t}}`,
  String.raw`E (% max) = 100 \frac{C_{t}}{EC_{50} + C_{t}}`,
];

/** The registry stores plain-text summaries. Give these equations print notation. */
export function printEquations(equations: string[]): string[] {
  const formulae = equations.flatMap(eq => {
    if (eq.includes('dA_g/dt')) return [
      String.raw`\frac{dA_{g}}{dt} = -k_{a} A_{g}`,
      String.raw`\frac{dC}{dt} = \frac{1000 F k_{a} A_{g}}{V} - k_{e} C`,
      String.raw`t_{1/2} = \frac{ln(2)}{k_{e}}`,
    ];
    if (eq.includes('(1000D/V)')) return [
      String.raw`\frac{dC}{dt} = -k_{e} C`,
      String.raw`C(t) = \frac{1000 D}{V} e^{-k_{e} t}`,
      String.raw`t_{1/2} = \frac{ln(2)}{k_{e}}`,
    ];
    if (eq.includes('dB/dt')) return [
      String.raw`\frac{dC}{dt} = -k_{e} C`,
      String.raw`\frac{dB}{dt} = r B (1 - \frac{B}{K}) - k_{max} \frac{C}{EC_{50} + C} B`,
    ];
    if (eq.includes('Emax·')) return [String.raw`E(C) = E_{0} + E_{max} \frac{C^{n}}{EC_{50}^{n} + C^{n}}`];
    if (eq.startsWith('dS/dt')) return [
      String.raw`\frac{dS}{dt} = -\beta \frac{SI}{N}`,
      String.raw`\frac{dI}{dt} = \beta \frac{SI}{N} - \gamma I`,
      String.raw`\frac{dR}{dt} = \gamma I`,
    ];
    if (eq.startsWith('dx/dt')) return [String.raw`\frac{dx}{dt} = r x (1 - \frac{x}{K})`];
    return [eq];
  });
  return [...new Set(formulae)];
}
