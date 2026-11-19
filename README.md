# Nexus

**Mathematical Modelling of Drug Concentration and Response Using ODEs and PK–PD Models**

B.Tech Semester III Mathematics Practical, Cluster Innovation Centre, University of Delhi. We built Nexus to show how medicine reaches tissue, why its concentration rises and falls, and how sensitivity changes the response to the same concentration.

**Team** — Susheel Prajapati, Suraj Prajapati, Prashil Verma, Nikhil Sharma.

## Run and build

Use Node.js and npm. This checkout was tested with Node.js 24 and its locked dependencies. In PowerShell:

```powershell
Set-Location 'C:\Users\sushe\Downloads\Nexus 2.0'
npm.cmd ci
npm.cmd run dev -- --host 127.0.0.1
```

Open the Local URL Vite prints. The default port is 5173. On a machine with dependencies already installed, you can start directly with the last command. Vite serves the math fonts, anatomy and charts locally.

```powershell
npm.cmd run typecheck
npm.cmd test -- --runInBand
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1
```

The production build is in `dist/`. The production preview normally uses port 4173. These commands run locally.

## Public host

[Nexus on Netlify](https://biomathnexus.netlify.app)

## Present the two-minute demo

Open **Class demo** in the header (`#demo`). The preset uses a 100 mg generic input, 10 L tissue volume and a 12 h model run. Its transfer rates are illustrative.

| Time | Action and narration |
| --- | --- |
| 0:00–0:35 | Choose **Place tablet**, select **2×** and choose **Swallow with water**. “Watch the tablet break into fragments. Dissolved drug crosses the villus, passes through the portal vein to the liver, then enters circulation. Swallowing and transit are illustrated. The four-amount model starts at absorption.” |
| 0:35–1:00 | Choose **Rising point**. “At 1.119 h on the model clock, about 29.07 mg/h enters tissue and 11.68 mg/h returns. The difference is positive, so tissue concentration rises.” |
| 1:00–1:25 | Choose **Approximate peak**. “At 2.487 h both rates are about 17.18 mg/h. The slope is near zero and tissue concentration is about 3.124 mg/L.” |
| 1:25–2:00 | Keep the graph paused. Change **EC₅₀** from 2 to 4 mg/L. “Concentration stays the same while response falls from 61.0% to 43.9% of maximum. In our separate worked example, 20 mg in 10 L gives 2 mg/L and the same slider change takes 50% to 33.3%.” |

Elapsed time above the body includes the five-minute illustrative prelude. Time on the tissue graph starts at intestinal absorption. After the peak, return exceeds entry and the tissue curve declines. At 12 model hours the demo has removed about 90.94 mg.

## Explore the lab

- **Overview** (`#home`) contains a solver-driven anatomical preview, practicals and the first-visit tour.
- **Body view** (`#body`) connects the 2D atlas, rotatable 3D model, biological clock, concentration and response. Use **Inspect region** for labelled close-ups and the small body overview to return. Select a graph point, scrub the timeline, or focus a slider and use the arrow keys.
- **Practicals** (`#explorer`) opens oral and IV concentration, half-life and solver comparison, direct concentration–response, or an illustrative antibiotic growth comparison. The library also retains the SIR and logistic growth models.
- **Maths** (`#equations`) pairs typeset equations with English or Hinglish explanations. The language selector also changes the Body view narration.
- **Research** (`#research`) brings together our two papers, the paracetamol medicine sources, assumptions, team and asset credits. The paracetamol story illustrates headache relief. Generic response percentages cannot predict pain relief, recovery or dosing for a person.

## Numerical checks

The original checkout passed TypeScript, 27 tests and a Vite production build before these changes. The test suite covers analytical solutions, numerical convergence, invalid time steps, delayed treatment, concentration units, mass conservation, peak selection, reversible time mapping and the response model.

The Body view uses RK4 with internal steps no larger than 0.01 h. At every saved point the four amounts must be finite, non-negative and sum to the starting amount within `1e-10 × max(1, dose in mg)` mg. Linear interpolation between saved points preserves the mass balance. Net tissue transfer is entry minus return in mg/h. Dividing that net rate by the tissue volume gives the slope of the concentration curve in mg/L/h.

The one-compartment practical compares Euler and RK4 with the analytical solution on the same time grid. It reports an actionable error for an Euler step large enough to empty or reverse a compartment. These comparisons test numerical accuracy within the educational assumptions. They do not validate the model against patient data.

**Download results PDF** in Body view or the practical simulator saves the current parameters, curves, selection and equations. The anatomy and 3D geometry are original to this project.
