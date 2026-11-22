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


## Explore the lab

- **Overview** (`#home`) contains a solver-driven anatomical preview, practicals and the first-visit tour.
- **Body view** (`#body`) connects the 2D atlas, rotatable 3D model, biological clock, concentration and response. Use **Inspect region** for labelled close-ups and the small body overview to return. Select a graph point, scrub the timeline, or focus a slider and use the arrow keys.
- **Practicals** (`#explorer`) opens oral and IV concentration, half-life and solver comparison, direct concentration–response, or an illustrative antibiotic growth comparison. The library also retains the SIR and logistic growth models.
- **Maths** (`#equations`) pairs typeset equations with English or Hinglish explanations. The language selector also changes the Body view narration.
- **Research** (`#research`) brings together our two papers, the paracetamol medicine sources, assumptions, team and asset credits. The paracetamol story illustrates headache relief. Generic response percentages cannot predict pain relief, recovery or dosing for a person.


**Download results PDF** in Body view or the practical simulator saves the current parameters, curves, selection and equations. The anatomy and 3D geometry are original to this project.
