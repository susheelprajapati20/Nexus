# Nexus continuation brief

Continue the existing Nexus React application in place. Keep the current TypeScript and Vite stack, preserve the working PK, PD, SIR and logistic models, and build around this educational question:

> How do an example drug level, bacterial growth and a delayed treatment start change together over time in a simplified ODE model?

## Product direction

Use the name **Nexus** everywhere. Keep the site light, readable and welcoming. Use everyday language on the main screens; put equations and parameter details in the Learn area. Make the first visit guide short, let users replay it, and keep the simulator controls, graph, timeline, body illustration and results connected to the same calculated values.

## Core learning model

Add a generic, clearly illustrative one-compartment drug-level model coupled to a single bacteria-population model. Use a concentration-dependent Emax-shaped kill term, a simple growth limit, and a configurable treatment start delay. Compare the bacteria trajectory with and without the example treatment. Use separate axes for bacteria and drug level. Show the selected timeline point on a simple body illustration to help explain the model flow.

The body view is a schematic teaching illustration, not an anatomical 3D rendering or a patient simulation. Explain that the displayed drug and bacteria units are relative example units. Do not describe the model as fitted to a named antibiotic, organism, infection or patient unless matching data and a verified source are added.

## Safety and evidence

Never calculate or recommend a medicine dose, treatment interval, or “protective” dose for a real child, young adult or older adult. Do not apply age-based changes without an identified drug, verified population model and suitable evidence. Keep age groups as discussion examples only until that evidence is available.

Use public, suitable, cited research or approved anonymous aggregate measurements. Do not add identifiable patient records. Mark all unsourced example values as illustrative. Distinguish equation structure from parameter evidence and from agreement with observed data. Explain the main limits of each model. Preserve the educational-use disclaimer.

## Scientific facts and novelty

Use current, directly linked public-health sources for population facts and show the year and scope of every statistic. Describe the project contribution as an educational interface that connects drug level, bacteria growth and treatment timing on one timeline. Do not call this a new scientific discovery or clinical tool.

## Verification

Keep equations and calculations in independent engine modules. Add tests for initial values, unit handling, event timing, solver behaviour, invalid inputs and report content. Run the TypeScript check, tests and production build after changes. Report any feature that remains illustrative, unvalidated or visually unchecked.
