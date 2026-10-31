# Nexus

A browser-based learning tool for exploring simple biology and medicine-related models. It is educational, and none of its outputs should be used to make treatment or medication decisions.

## Run locally

```powershell
npm install
npm run dev
```

## Checks

```powershell
npm test -- --runInBand
npx tsc --noEmit
npm run build
```

There is no configured lint command.

## Pages

- `#/home` — introduction, first visit tour and a small live graph
- `#/explorer` — search and browse the available models
- `#/simulator` — change model values, play the graph and download a results PDF
- `#/equations` — see the equations and plain language explanations
- `#/research` — sources and the limits of the current models
- `#/about` — methods, contributors and disclaimer

## Models

- IV and oral concentration examples with exact, Euler and RK4 calculations
- A direct concentration-response curve with editable baseline, maximum response and curve shape
- An illustrative antibiotic and bacteria example that links drug-level change, bacteria growth and a delayed treatment start on one timeline. All values use relative units and are not fitted to doctor or patient data.
- SIR disease-spread model with a user-entered scenario name, population, starting counts and rates
- Logistic population growth example

The disease name is a display label only; it does not select disease-specific rates. The fever and airway examples are not simulated because a supported model and parameter scope have not been established. Named drug presets remain illustrative and unverified. No model is fitted to patient or outbreak data. The body view is a schematic illustration, not an anatomical 3D simulation. Age-specific dose estimates are not provided.

The antibiotic example demonstrates how a simple ODE can connect a falling example drug level to bacteria growth and a treatment start time. Its contribution is an interactive teaching view that keeps the graph, timeline and body illustration synchronized; it is not a new clinical discovery.

## Main files

- `src/engine/math.ts` — model calculations, numerical solvers and checks
- `src/engine/models.ts` — model descriptions, input details and source records
- `src/engine/report.ts` — one page simulation results PDF
- `src/App.tsx` — pages, controls and charts
- `src/style.css` — responsive light theme and first visit tour
