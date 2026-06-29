# Portugal Biomethane Potential Dashboard

An interactive web dashboard to explore and simulate biomethane production potential across mainland Portugal's 18 districts, built for **Floene** as part of an internship project.

## Overview

This tool allows users to visualize and simulate biomethane potential derived from three feedstock categories:

| Category | Source | Conversion Factor |
|---|---|---|
| **RSU** — Urban Solid Waste (organic fraction) | INE / GPP | 120 Nm³/t |
| **Agro** — Agricultural & Forestry residues | APA / SRIR / GPP | 80–60 Nm³/t |
| **ETAR** — Wastewater Treatment sludge | ERSAR / AdP | 300 Nm³/t MS |

Biogas is converted to biomethane using: `GWh = Nm³ × 5.5 × 10⁻⁶` (based on CH4 LHV ~55%).

## Features

- **Heatmap Simulator** — Interactive map of Portugal with district-level biomethane potential, color-coded by intensity
- **Feedstock Analysis** — Breakdown by feedstock type (RSU, Agro, ETAR) with customizable inputs per district
- **Regional Insights** — Aggregate view by NUT II region (Norte, Centro, AML, Alentejo, Algarve)
- **Export Data** — Download results as CSV
- Adjust production parameters per district and see real-time updates on the map

## Tech Stack

- Pure HTML/CSS/JavaScript (no build step required)
- [Leaflet.js](https://leafletjs.com/) for interactive maps
- GeoJSON district boundaries for Portugal
- Google Fonts (Hanken Grotesk, IBM Plex Mono)

## Data Sources

- **INE** — Instituto Nacional de Estatística
- **GPP** — Gabinete de Planeamento, Políticas e Administração Geral
- **APA** — Agência Portuguesa do Ambiente
- **SRIR** — Sistema de Registo de Informação de Resíduos
- **ERSAR** — Entidade Reguladora dos Serviços de Águas e Resíduos
- **Águas de Portugal (AdP)**

Data derived from the Floene feedstock workbook (April 2026).

## Usage

Open `Biometano Portugal.dc.html` in a browser. All dependencies are loaded via CDN — no installation needed.

> Note: Keep all `.js` files (`biomethane-data.js`, `geo-districts.js`, `support.js`) in the same directory as the HTML file.

## Project Structure

```
├── Biometano Portugal.dc.html   # Main dashboard
├── biomethane-data.js           # Feedstock data & calculation logic
├── geo-districts.js             # GeoJSON boundaries for Portuguese districts
├── support.js                   # UI framework / component runtime
├── Portugal.json                # Country-level GeoJSON
└── uploads/                     # Source data files (CSV, Excel)
```

---

*Developed during an internship at Floene, 2026.*
