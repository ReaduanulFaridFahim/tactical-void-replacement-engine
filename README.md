# ⚡ Football Transfer Market Prediction

[![Live Demo](https://img.shields.io/badge/Demo-GitHub_Pages_Live-success?style=for-the-badge&logo=github)](https://readuanulfaridfahim.github.io/tactical-void-replacement-engine/)
[![Author](https://img.shields.io/badge/Engineered_by-RFF_@_26-cyan?style=for-the-badge)](https://github.com/ReaduanulFaridFahim)
[![Dataset](https://img.shields.io/badge/Dataset-Transfermarkt_Pro-blue?style=for-the-badge)](https://www.kaggle.com/datasets/davidcariboo/player-scores)
[![Python](https://img.shields.io/badge/Python-3.10%2B-brightgreen?style=for-the-badge)](https://www.python.org/)
[![UI](https://img.shields.io/badge/UI-Vanilla_CSS_&_Canvas-purple?style=for-the-badge)]()

An advanced sports intelligence and recruitment system that solves the fundamental challenge of modern football management:
> **When a generational superstar or talismanic manager departs, how much sporting damage does the club actually sustain, and how can the recruitment department sign a high-similarity, budget-compliant drop-in tactical replacement before the window closes?**

---

## 🌟 Key Innovations & Capabilities

### 1. Dual-Engine Intelligence Platform
- **⚽ Player Replacement Engine**: 44 marquee dossiers (including 26/27 season exits like Salah, De Bruyne, Son), a 1,200+ player catalog, role-adaptive radars, and 2–3 year succession planning.
- **👔 Manager & Head Coach Engine**: 16 managerial dossiers (Klopp, Ten Hag, Tuchel, Zidane, Nagelsmann, Alonso, Guardiola, Ancelotti), 25-game post-managerial void collapse models, 6-axis managerial radars, wage arbitrage, and contract buyout clauses.

### 2. The 6 Advanced Professional Features Suite (Season 26/27)
1. **🏟️ Interactive 2D Pitch Lineup & Tactical Board**: Sleek dark-mode pitch visualizer supporting starting XI formations (`4-3-3`, `4-2-3-1`, `3-4-2-1`, `4-4-2`, `3-5-2`). Pulsing red neon `TACTICAL VOID` talisman slot, candidate drop-in slot with match score badge, Tactical Zone of Influence briefing, and real-time Squad Balance Meters (Pressing Intensity, Aerial Dominance, Width Generation, Central Progression).
2. **💰 UEFA FFP & Premier League PSR Amortization Calculator**: Simulates true football accounting reality. 5-year contract amortization schedules, liquidated net book disposal gains, annual wage bill delta, and Year 1 net FFP headroom projections across a 5-season timeline (`2026/27` to `2030/31`).
3. **📄 One-Click "Executive Scouting Dossier" Exporter**: Confidential club-grade briefing report ready for PDF export or print. Features executive summary, head-to-head metric comparison, 4-step framework table, FFP financial audit, Sporting Director verdict, and official `RFF @ 26` verification seal.
4. **🔗 Deep-Link URL State Sharing**: Serializes the active star, scouted candidate, formation, and planning horizon into URL query parameters (`?mode=players&star=salah&cand=kudus&form=4-3-3`). One-click copy with clipboard toast notification.
5. **🧪 "Create Your Own Departure" What-If Sandbox**: Search and simulate hypothetical exits for ANY of the 1,200+ players or 120+ coaches in European football. Computes real-time ML-predicted void severity and instantly ranks top replacements with one-click dashboard loading.
6. **🧠 AI Technical Director's Scouting Verdict Generator**: Dynamically formulated qualitative executive briefings in candidate cards and radar workbench quoting exact metric replication %, key statistical advantages, and financial arbitrage efficiency.

### 3. Machine Learning Void Predictor Models (CatBoost & LightGBM)
Trained on 1.89M appearance rows from European league competition:
- **LightGBM Regressor** (`void_predictor_lightgbm.joblib`): Test $R^2 = 0.3364$, MAE = 0.1601.
- **CatBoost Regressor** (`void_predictor_catboost.cbm`): Test $R^2 = 0.2781$, MAE = 0.1718.
- Predicts post-departure club PPG and sporting collapse using player per-90 contribution, minutes share, and team baseline metrics.

### 4. The Strict 4-Step Replacement Analysis Framework
1. **Step 1 — Identify Departing Role & Philosophy**: Positional archetype, tactical blueprint, preferred foot, and system formation responsibilities.
2. **Step 2 — Collect Performance Data & Track Record**: Appearances, minutes, goals, assists, passing volume, win rate, and total silverware.
3. **Step 3 — Compare Like-for-Like Efficiency & Empirical Percentiles**: Per-90 and per-match rate metrics normalized against empirical European percentiles (0–99th %ile across 1,200+ qualified profiles).
4. **Step 4 — Rank Potential Replacements & Contract Dossier**: Weighted composite match scores, valuation arbitrage, weekly wage relief, agent pipelines, and buyout clauses.

### 5. Empirical 25-Game Tactical Void Quantification
Measures the sporting collapse across a 25-match pre vs. post window:
$$\text{Void Severity} = \text{clip}\left(50 - 22 \cdot \Delta\text{PPG} - 0.35 \cdot \Delta\text{Win\%} - 15 \cdot \Delta\text{GF} + 12 \cdot \Delta\text{GA}, \, 5.0, \, 98.0\right)$$

- **$\ge 75$**: `CRITICAL TACTICAL VOID` (Severe collapse in points and offensive output)
- **$60 - 74$**: `MODERATE TACTICAL DEFICIT` (Noticeable drop in dynamism)
- **$45 - 59$**: `TACTICAL EQUILIBRIUM` (Club absorbed departure)
- **$< 45$**: `TACTICAL ACCELERATION` (Tactical reallocation improved performance)

### 6. Mathematical Vector Similarity & Composite Matching
$$\text{Sim}(S, C) = \frac{\mathbf{v}_S \cdot \mathbf{v}_C}{\|\mathbf{v}_S\| \|\mathbf{v}_C\|} \times W_{\text{role}}$$

$$\text{Composite Match Score} = 0.40 \cdot \text{TacticalSim} + 0.20 \cdot \text{FormationFit} + 0.20 \cdot \text{FinancialScore} + 0.15 \cdot \text{GrowthScore} + \text{Bonus}$$

---

## 📁 Repository Structure

```
├── index.html                # Modern glassmorphic Web Dashboard
├── styles.css                # CSS design system with Outfit & JetBrains Mono typography
├── app.js                    # Client app: Canvas radar charts, scatter plot, dual entity logic
├── data.js                   # Offline high-performance static dataset for GitHub Pages
├── tactical_engine_data.json # Unified JSON database (players, coaches, voids, pool)
├── build_engine_data.py      # Pipeline script to compute player vectors and void metrics
├── build_coach_data.py       # Pipeline script to compute manager track records and voids
├── tactical_analyzer.py      # Core Python analytical algorithms
├── cli_explorer.py           # Rich terminal CLI with formatted scouting reports
├── serve_engine.py           # Local HTTP server
├── run_tactical_engine.py    # Master runner script
├── launch_dashboard.bat      # Quick-launch dashboard batch script
├── launch_cli.bat            # Quick-launch CLI batch script
└── README.md                 # Complete documentation & project architecture
```

---

## 🚀 Running Locally

### 1. Launch the Web Dashboard
```bash
python serve_engine.py
```
Then visit `http://localhost:8085/` in your browser.

### 2. Interactive CLI Scouting Explorer
```bash
# Scout replacements for specific athletes or managers:
python cli_explorer.py -p Bellingham
python cli_explorer.py -p Salah
python cli_explorer.py -p Kane

# List all available dossiers:
python cli_explorer.py --list
```

---

## 🌐 Live Deployment
Hosted on **GitHub Pages**:  
🔗 **[https://readuanulfaridfahim.github.io/tactical-void-replacement-engine/](https://readuanulfaridfahim.github.io/tactical-void-replacement-engine/)**

---

**Engineered by RFF @ 26** • *Transfermarkt Pro Data Analytics • Season 2026/27 Edition*
