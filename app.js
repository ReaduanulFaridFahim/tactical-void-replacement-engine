/**
 * Tactical Void & Drop-In Replacement Engine - Comprehensive Client Application
 * Features:
 * - 4-Step Player Replacement Analysis Framework Walkthrough
 * - Role-Specific Metrics according to position (ST, Winger, CAM, CM, CDM, CB, Full-Back, GK)
 * - Dynamic Role-Adaptive Radar Polygon (5-6 axes calibrated per position)
 * - Visual Percentile Ranking Bars (0-99th percentile across European dataset)
 * - Interactive Multi-Candidate Tactical Scatter Plot & Cluster Analysis
 * - 32 Precompiled Marquee & Succession Dossiers + 1,200 Searchable Player Catalog
 * - Real-time Budget Cap, Max Age, and Suitability Sliders
 */

let engineData = null;
let currentEntityMode = 'players'; // 'players' | 'coaches'
let currentDepartureIndex = 0;
let currentCandidate = null;
let activeBenchmarkPlayer = null; // When an arbitrary player from catalog is selected
let customPinnedCandidates = [];

// Head Coach / Manager State
let currentCoachDepartureIndex = 0;
let currentCoachCandidate = null;
let activeBenchmarkCoach = null;
let customPinnedCoachCandidates = [];
let activeCoachCategory = 'all'; // 'all', 'historical', 'succession'

// App State
let planningHorizon = 'immediate'; // 'immediate' or 'succession_3yr'
let activeCategory = 'all'; // 'all', 'season_2627', 'historical', 'succession'
let scatterMode = 'role'; // 'role' or 'financial'
let scatterHoveredPoint = null;

// Filter state
let filterBudgetRatio = 1.0;
let filterMaxAge = 32;
let filterMinScore = 70;

// Managerial Radar Axes across 6 Calibrated Dimensions
const COACH_RADAR_AXES = [
  { key: 'ppg_win_efficiency', label: 'PPG & Win Efficiency', unit: '', max: 2.5 },
  { key: 'attacking_output', label: 'Attacking Output & Fluidity', unit: ' GF/G', max: 2.8 },
  { key: 'defensive_solidity', label: 'Defensive Solidity & Control', unit: '%ile', max: 99 },
  { key: 'formation_flexibility', label: 'Formation Flexibility', unit: ' Shapes', max: 99 },
  { key: 'pressing_intensity', label: 'Pressing & System Identity', unit: '%ile', max: 99 },
  { key: 'durability_longevity', label: 'Tenure Durability & Stability', unit: ' Games', max: 99 }
];

// Role Metrics Map per Position Group according to user framework table
const ROLE_METRICS_MAP = {
  'ST': [
    { key: 'goals_per_90', label: 'Goals / 90', unit: '', max: 1.2 },
    { key: 'xg_per_90', label: 'xG / 90', unit: '', max: 1.1 },
    { key: 'shots_on_target_per_90', label: 'Shots on Target', unit: '', max: 2.6 },
    { key: 'xg_per_shot', label: 'xG per Shot', unit: '', max: 0.28 },
    { key: 'pressing_per_90', label: 'Pressing Actions', unit: '', max: 22.0 }
  ],
  'Winger': [
    { key: 'goals_per_90', label: 'Goals / 90', unit: '', max: 0.8 },
    { key: 'assists_per_90', label: 'Assists / 90', unit: '', max: 0.6 },
    { key: 'xa_per_90', label: 'xA / 90', unit: '', max: 0.55 },
    { key: 'dribbles_per_90', label: 'Successful Dribbles', unit: '', max: 4.5 },
    { key: 'progressive_carries_per_90', label: 'Progressive Carries', unit: '', max: 8.5 },
    { key: 'key_passes_per_90', label: 'Key Passes / 90', unit: '', max: 3.5 }
  ],
  'CAM': [
    { key: 'key_passes_per_90', label: 'Key Passes / 90', unit: '', max: 3.8 },
    { key: 'xa_per_90', label: 'xA / 90', unit: '', max: 0.6 },
    { key: 'chances_created_per_90', label: 'Chances Created', unit: '', max: 4.5 },
    { key: 'progressive_passes_per_90', label: 'Progressive Passes', unit: '', max: 7.5 },
    { key: 'turnover_control_pct', label: 'Turnover Control', unit: '%', max: 94.0 }
  ],
  'CM': [
    { key: 'pass_completion_pct', label: 'Pass Completion %', unit: '%', max: 94.0 },
    { key: 'progressive_passes_per_90', label: 'Progressive Passes', unit: '', max: 8.5 },
    { key: 'ball_recoveries_per_90', label: 'Ball Recoveries', unit: '', max: 10.5 },
    { key: 'duels_per_90', label: 'Duels Contested', unit: '', max: 12.0 },
    { key: 'interceptions_per_90', label: 'Interceptions / 90', unit: '', max: 2.8 }
  ],
  'CDM': [
    { key: 'interceptions_per_90', label: 'Interceptions / 90', unit: '', max: 3.2 },
    { key: 'tackles_per_90', label: 'Tackles / 90', unit: '', max: 4.2 },
    { key: 'possession_recoveries_per_90', label: 'Poss. Recoveries', unit: '', max: 11.5 },
    { key: 'duel_success_pct', label: 'Duel Success %', unit: '%', max: 75.0 },
    { key: 'press_resistance_score', label: 'Press Resistance', unit: '', max: 96.0 }
  ],
  'CB': [
    { key: 'aerial_duel_success_pct', label: 'Aerial Duel %', unit: '%', max: 78.0 },
    { key: 'interceptions_per_90', label: 'Interceptions / 90', unit: '', max: 2.9 },
    { key: 'clearances_per_90', label: 'Clearances / 90', unit: '', max: 6.0 },
    { key: 'defensive_reliability_score', label: 'Def. Reliability', unit: '%', max: 98.0 },
    { key: 'progressive_passing_per_90', label: 'Progressive Passes', unit: '', max: 5.8 }
  ],
  'FB': [
    { key: 'tackles_per_90', label: 'Tackles / 90', unit: '', max: 3.8 },
    { key: 'interceptions_per_90', label: 'Interceptions / 90', unit: '', max: 2.6 },
    { key: 'progressive_carries_per_90', label: 'Progressive Carries', unit: '', max: 7.5 },
    { key: 'crossing_per_90', label: 'Crossing / 90', unit: '', max: 4.2 },
    { key: 'defensive_duels_per_90', label: 'Defensive Duels', unit: '', max: 9.5 }
  ],
  'GK': [
    { key: 'save_percentage', label: 'Save Percentage', unit: '%', max: 82.0 },
    { key: 'goals_prevented_per_90', label: 'Goals Prevented', unit: '', max: 0.45 },
    { key: 'cross_claiming_pct', label: 'Cross Claiming %', unit: '%', max: 12.0 },
    { key: 'distribution_pct', label: 'Distribution %', unit: '%', max: 88.0 },
    { key: 'defensive_reliability_score', label: 'Error Prevention', unit: '%', max: 98.0 }
  ]
};

// Pro-Scouting Positional Affinity Matrix
const POSITION_AFFINITY = {
  'Centre-Forward': {'Centre-Forward': 1.0, 'Second Striker': 0.92, 'Left Winger': 0.78, 'Right Winger': 0.78, 'Attacking Midfield': 0.70},
  'Second Striker': {'Second Striker': 1.0, 'Centre-Forward': 0.92, 'Attacking Midfield': 0.88, 'Left Winger': 0.82, 'Right Winger': 0.82},
  'Left Winger': {'Left Winger': 1.0, 'Right Winger': 0.90, 'Attacking Midfield': 0.84, 'Second Striker': 0.82, 'Centre-Forward': 0.76, 'Left Midfield': 0.92},
  'Right Winger': {'Right Winger': 1.0, 'Left Winger': 0.90, 'Attacking Midfield': 0.84, 'Second Striker': 0.82, 'Centre-Forward': 0.76, 'Right Midfield': 0.92},
  'Attacking Midfield': {'Attacking Midfield': 1.0, 'Central Midfield': 0.90, 'Second Striker': 0.88, 'Left Winger': 0.84, 'Right Winger': 0.84, 'Left Midfield': 0.86, 'Right Midfield': 0.86},
  'Central Midfield': {'Central Midfield': 1.0, 'Attacking Midfield': 0.90, 'Defensive Midfield': 0.90, 'Right Midfield': 0.82, 'Left Midfield': 0.82},
  'Defensive Midfield': {'Defensive Midfield': 1.0, 'Central Midfield': 0.90, 'Centre-Back': 0.80},
  'Centre-Back': {'Centre-Back': 1.0, 'Defensive Midfield': 0.80, 'Left-Back': 0.72, 'Right-Back': 0.72},
  'Left-Back': {'Left-Back': 1.0, 'Right-Back': 0.88, 'Left Midfield': 0.88, 'Centre-Back': 0.72},
  'Right-Back': {'Right-Back': 1.0, 'Left-Back': 0.88, 'Right Midfield': 0.88, 'Centre-Back': 0.72},
  'Left Midfield': {'Left Midfield': 1.0, 'Left Winger': 0.92, 'Central Midfield': 0.84, 'Left-Back': 0.85},
  'Right Midfield': {'Right Midfield': 1.0, 'Right Winger': 0.92, 'Central Midfield': 0.84, 'Right-Back': 0.85},
  'Goalkeeper': {'Goalkeeper': 1.0}
};

// Formatting utilities
function formatCurrency(val) {
  if (!val || isNaN(val)) return '€0';
  if (val >= 1_000_000_000) return `€${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `€${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `€${(val / 1_000).toFixed(0)}K`;
  return `€${val.toFixed(0)}`;
}

function getInitials(name) {
  if (!name) return 'FC';
  const parts = name.split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getPercentileClass(pct) {
  if (pct >= 90) return 'pct-elite';
  if (pct >= 75) return 'pct-high';
  if (pct >= 50) return 'pct-good';
  return 'pct-mid';
}

// Initialize Application
async function initApp() {
  try {
    if (window.TACTICAL_ENGINE_DATA && window.TACTICAL_ENGINE_DATA.departures) {
      engineData = window.TACTICAL_ENGINE_DATA;
    } else {
      const res = await fetch('tactical_engine_data.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load data`);
      engineData = await res.json();
    }

    setupEventListeners();
    setupSearchAutocomplete();
    setupCustomCandidateSearch();
    setupScatterPlotListeners();
    renderPlayerCategoryTabs();
    renderDepartureChips();
    selectDeparture(0);
  } catch (err) {
    console.error('Initialization error:', err);
    const descEl = document.getElementById('voidSeverityDesc');
    if (descEl) {
      descEl.textContent = 'Error loading tactical database. Please ensure build_engine_data.py has completed.';
    }
  }
}

// Switch between Player Replacement Engine and Head Coach/Manager Engine
function setEntityMode(mode) {
  currentEntityMode = mode;
  const btnPlayers = document.getElementById('btnModePlayers');
  const btnCoaches = document.getElementById('btnModeCoaches');
  const heroTitle = document.getElementById('mainHeroTitle');
  const heroSubtitle = document.getElementById('mainHeroSubtitle');
  const searchInput = document.getElementById('playerSearchInput');
  const horizonImm = document.getElementById('btnHorizonImmediate');
  const horizonSucc = document.getElementById('btnHorizonSuccession');
  const budgetLabel = document.querySelector('.filter-group:nth-child(1) .filter-label');
  const ageSlider = document.getElementById('ageSlider');
  const ageSliderVal = document.getElementById('ageSliderVal');

  if (mode === 'players') {
    if (btnPlayers) btnPlayers.classList.add('active');
    if (btnCoaches) btnCoaches.classList.remove('active');

    if (heroTitle) heroTitle.textContent = 'The Tactical Void & Drop-In Replacement Engine';
    if (heroSubtitle) heroSubtitle.textContent = 'Quantifying the sporting decline left behind when superstar talents depart, and recommending optimal, budget-compliant drop-in replacements through multi-dimensional tactical vector similarity.';
    if (searchInput) searchInput.placeholder = 'Search any player to scout replacements (e.g. Salah, De Bruyne, Saka, Yamal, Messi, Mbappe)...';
    if (horizonImm) horizonImm.innerHTML = '<span>⚡ Immediate Like-for-Like</span>';
    if (horizonSucc) horizonSucc.innerHTML = '<span>🔮 2-3 Year Succession Horizon</span>';
    if (budgetLabel) budgetLabel.textContent = 'Max Budget Cap (% of Fee):';

    // Reset stat labels on benchmark card
    const lblG90 = document.querySelector('#starBenchmarkCard .stat-box:nth-child(1) .lbl');
    if (lblG90) lblG90.textContent = 'G / 90';
    const lblA90 = document.querySelector('#starBenchmarkCard .stat-box:nth-child(2) .lbl');
    if (lblA90) lblA90.textContent = 'A / 90';
    const lblGA90 = document.querySelector('#starBenchmarkCard .stat-box:nth-child(3) .lbl');
    if (lblGA90) lblGA90.textContent = 'G+A / 90';
    const lblMinApp = document.querySelector('#starBenchmarkCard .stat-box:nth-child(4) .lbl');
    if (lblMinApp) lblMinApp.textContent = 'Min / App';

    if (ageSlider) {
      ageSlider.min = 18;
      ageSlider.max = 36;
      ageSlider.value = 32;
      filterMaxAge = 32;
      if (ageSliderVal) ageSliderVal.textContent = '32 yrs';
    }

    renderPlayerCategoryTabs();
    renderDepartureChips();
    selectDeparture(currentDepartureIndex);
  } else {
    if (btnCoaches) btnCoaches.classList.add('active');
    if (btnPlayers) btnPlayers.classList.remove('active');

    if (heroTitle) heroTitle.textContent = 'The Tactical Void & Drop-In Manager Replacement Engine';
    if (heroSubtitle) heroSubtitle.textContent = 'Quantifying the managerial sporting void when talismanic head coaches depart, and recommending optimal, philosophy-aligned drop-in managers through tactical system similarity.';
    if (searchInput) searchInput.placeholder = 'Search any manager to scout replacements (e.g. Xabi Alonso, Klopp, Guardiola, Nagelsmann, Amorim, Motta)...';
    if (horizonImm) horizonImm.innerHTML = '<span>⚡ Immediate Drop-In Manager</span>';
    if (horizonSucc) horizonSucc.innerHTML = '<span>🔮 Emerging Young Tactician (<45)</span>';
    if (budgetLabel) budgetLabel.textContent = 'Wage Budget Cap (% of Wage):';

    // Update stat labels on benchmark card for coaches
    const lblG90 = document.querySelector('#starBenchmarkCard .stat-box:nth-child(1) .lbl');
    if (lblG90) lblG90.textContent = 'PPG';
    const lblA90 = document.querySelector('#starBenchmarkCard .stat-box:nth-child(2) .lbl');
    if (lblA90) lblA90.textContent = 'Win %';
    const lblGA90 = document.querySelector('#starBenchmarkCard .stat-box:nth-child(3) .lbl');
    if (lblGA90) lblGA90.textContent = 'GF / Game';
    const lblMinApp = document.querySelector('#starBenchmarkCard .stat-box:nth-child(4) .lbl');
    if (lblMinApp) lblMinApp.textContent = 'Career Matches';

    if (ageSlider) {
      ageSlider.min = 32;
      ageSlider.max = 70;
      ageSlider.value = 65;
      filterMaxAge = 65;
      if (ageSliderVal) ageSliderVal.textContent = '65 yrs';
    }

    renderCoachCategoryTabs();
    renderCoachDepartureChips();
    selectCoachDeparture(currentCoachDepartureIndex);
  }
}

function renderPlayerCategoryTabs() {
  const track = document.getElementById('categoryTabsTrack');
  if (!track) return;
  track.innerHTML = `
    <button class="cat-tab-btn ${activeCategory === 'all' ? 'active' : ''}" id="tabAll">All Dossiers (44)</button>
    <button class="cat-tab-btn ${activeCategory === 'season_2627' ? 'active' : ''}" id="tabSeason2627">🔥 26/27 Season Departures (12)</button>
    <button class="cat-tab-btn ${activeCategory === 'historical' ? 'active' : ''}" id="tabHistorical">Historical Departures (13)</button>
    <button class="cat-tab-btn ${activeCategory === 'succession' ? 'active' : ''}" id="tabSuccession">Succession Planning (19)</button>
  `;

  const tabAll = document.getElementById('tabAll');
  const tabSeason2627 = document.getElementById('tabSeason2627');
  const tabHist = document.getElementById('tabHistorical');
  const tabSucc = document.getElementById('tabSuccession');

  [tabAll, tabSeason2627, tabHist, tabSucc].forEach((tab) => {
    if (!tab) return;
    tab.addEventListener('click', () => {
      [tabAll, tabSeason2627, tabHist, tabSucc].forEach(t => t && t.classList.remove('active'));
      tab.classList.add('active');
      if (tab === tabAll) activeCategory = 'all';
      else if (tab === tabSeason2627) activeCategory = 'season_2627';
      else if (tab === tabHist) activeCategory = 'historical';
      else if (tab === tabSucc) activeCategory = 'succession';
      renderDepartureChips();
    });
  });
}

function renderCoachCategoryTabs() {
  const track = document.getElementById('categoryTabsTrack');
  if (!track) return;
  track.innerHTML = `
    <button class="cat-tab-btn ${activeCoachCategory === 'all' ? 'active' : ''}" id="tabCoachAll">All Coach Dossiers (16)</button>
    <button class="cat-tab-btn ${activeCoachCategory === 'historical' ? 'active' : ''}" id="tabCoachHistorical">Marquee Departures (10)</button>
    <button class="cat-tab-btn ${activeCoachCategory === 'succession' ? 'active' : ''}" id="tabCoachSuccession">Succession Planning (6)</button>
  `;

  const tabAll = document.getElementById('tabCoachAll');
  const tabHist = document.getElementById('tabCoachHistorical');
  const tabSucc = document.getElementById('tabCoachSuccession');

  [tabAll, tabHist, tabSucc].forEach((tab) => {
    if (!tab) return;
    tab.addEventListener('click', () => {
      [tabAll, tabHist, tabSucc].forEach(t => t && t.classList.remove('active'));
      tab.classList.add('active');
      if (tab === tabAll) activeCoachCategory = 'all';
      else if (tab === tabHist) activeCoachCategory = 'historical';
      else if (tab === tabSucc) activeCoachCategory = 'succession';
      renderCoachDepartureChips();
    });
  });
}

// Setup Event Listeners
function setupEventListeners() {
  // Mode switcher listeners
  const btnModePlayers = document.getElementById('btnModePlayers');
  const btnModeCoaches = document.getElementById('btnModeCoaches');
  if (btnModePlayers && btnModeCoaches) {
    btnModePlayers.addEventListener('click', () => setEntityMode('players'));
    btnModeCoaches.addEventListener('click', () => setEntityMode('coaches'));
  }

  const budgetSlider = document.getElementById('budgetSlider');
  const ageSlider = document.getElementById('ageSlider');
  const scoreSlider = document.getElementById('scoreSlider');

  if (budgetSlider) {
    budgetSlider.addEventListener('input', (e) => {
      filterBudgetRatio = parseInt(e.target.value) / 100.0;
      document.getElementById('budgetSliderVal').textContent = `${e.target.value}%`;
      if (currentEntityMode === 'coaches') renderCoachRecommendations();
      else renderRecommendations();
    });
  }

  if (ageSlider) {
    ageSlider.addEventListener('input', (e) => {
      filterMaxAge = parseInt(e.target.value);
      document.getElementById('ageSliderVal').textContent = `${filterMaxAge} yrs`;
      if (currentEntityMode === 'coaches') renderCoachRecommendations();
      else renderRecommendations();
    });
  }

  if (scoreSlider) {
    scoreSlider.addEventListener('input', (e) => {
      filterMinScore = parseInt(e.target.value);
      document.getElementById('scoreSliderVal').textContent = `${filterMinScore}%`;
      if (currentEntityMode === 'coaches') renderCoachRecommendations();
      else renderRecommendations();
    });
  }

  // Horizon Planning Toggle
  const btnImm = document.getElementById('btnHorizonImmediate');
  const btnSucc = document.getElementById('btnHorizonSuccession');

  if (btnImm && btnSucc) {
    btnImm.addEventListener('click', () => {
      planningHorizon = 'immediate';
      btnImm.classList.add('active');
      btnSucc.classList.remove('active');
      if (currentEntityMode === 'coaches') {
        filterMaxAge = 65;
        if (ageSlider) {
          ageSlider.value = 65;
          document.getElementById('ageSliderVal').textContent = '65 yrs';
        }
        renderCoachRecommendations();
      } else {
        filterMaxAge = 32;
        if (ageSlider) {
          ageSlider.value = 32;
          document.getElementById('ageSliderVal').textContent = '32 yrs';
        }
        renderRecommendations();
      }
    });

    btnSucc.addEventListener('click', () => {
      planningHorizon = 'succession_3yr';
      btnSucc.classList.add('active');
      btnImm.classList.remove('active');
      if (currentEntityMode === 'coaches') {
        filterMaxAge = 45; // Emerging tactician under 45
        if (ageSlider) {
          ageSlider.value = 45;
          document.getElementById('ageSliderVal').textContent = '45 yrs';
        }
        renderCoachRecommendations();
      } else {
        filterMaxAge = 23;
        if (ageSlider) {
          ageSlider.value = 23;
          document.getElementById('ageSliderVal').textContent = '23 yrs';
        }
        renderRecommendations();
      }
    });
  }
}

// Setup Instant Autocomplete Search for Benchmark Selection (Players & Coaches)
function setupSearchAutocomplete() {
  const input = document.getElementById('playerSearchInput');
  const dropdown = document.getElementById('searchDropdown');
  if (!input || !dropdown) return;

  input.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (q.length < 2) {
      dropdown.style.display = 'none';
      return;
    }

    const matched = [];

    if (currentEntityMode === 'coaches') {
      // Search coach departures
      if (engineData.coach_departures) {
        engineData.coach_departures.forEach((d, idx) => {
          const m = d.departure_meta;
          if (m.coach_name.toLowerCase().includes(q) || m.from_club_name.toLowerCase().includes(q)) {
            matched.push({
              type: 'coach_dossier',
              dossierIndex: idx,
              id: idx,
              name: m.coach_name,
              club: m.from_club_name,
              pos: m.primary_formation,
              val: m.annual_wage,
              img: m.image_url || (d.star_stats && d.star_stats.image_url) || ''
            });
          }
        });
      }

      // Search coach pool
      const pool = engineData.coach_pool || [];
      pool.forEach((p) => {
        if (matched.some(m => m.name.toLowerCase() === p.name.toLowerCase())) return;
        if (p.name.toLowerCase().includes(q) || (p.club && p.club.toLowerCase().includes(q))) {
          matched.push({
            type: 'coach_catalog',
            rawCoach: p,
            id: p.id,
            name: p.name,
            club: p.club,
            pos: p.top_formation,
            val: p.annual_wage_eur,
            img: p.image_url || ''
          });
        }
      });
    } else {
      // Search player departures
      if (engineData.departures) {
        engineData.departures.forEach((d, idx) => {
          const m = d.departure_meta;
          if (m.player_name.toLowerCase().includes(q) || m.from_club_name.toLowerCase().includes(q)) {
            matched.push({
              type: 'dossier',
              dossierIndex: idx,
              id: m.player_id,
              name: m.player_name,
              club: m.from_club_name,
              pos: m.sub_position || m.position,
              val: m.transfer_fee,
              img: m.image_url || (d.star_stats && d.star_stats.image_url) || ''
            });
          }
        });
      }

      // Search player pool
      const pool = engineData.player_pool || [];
      pool.forEach((p) => {
        if (matched.some(m => m.id === p.id)) return;
        if (p.name.toLowerCase().includes(q) || p.club.toLowerCase().includes(q)) {
          matched.push({
            type: 'catalog',
            rawPlayer: p,
            id: p.id,
            name: p.name,
            club: p.club,
            pos: p.sub_pos || p.pos,
            val: p.val,
            img: p.img || ''
          });
        }
      });
    }

    renderSearchDropdown(matched.slice(0, 8), dropdown, input);
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
}

function renderSearchDropdown(items, dropdown, input) {
  if (!items.length) {
    dropdown.innerHTML = `<div class="search-item" style="color: var(--text-muted);">${currentEntityMode === 'coaches' ? 'No manager found in database' : 'No player found in database'}</div>`;
    dropdown.style.display = 'block';
    return;
  }

  dropdown.innerHTML = items.map((it) => {
    const thumbHtml = it.img ?
      `<img src="${it.img}" class="search-thumb" alt="${it.name}" onerror="this.style.display='none';" />` :
      `<div class="search-thumb" style="display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:var(--accent-cyan);">${getInitials(it.name)}</div>`;

    return `
      <div class="search-item search-item-with-thumb" data-type="${it.type}" data-idx="${it.dossierIndex !== undefined ? it.dossierIndex : ''}" data-id="${it.id}">
        ${thumbHtml}
        <div>
          <div class="search-item-title">${it.name} <span style="font-size: 0.75rem; color: var(--accent-cyan); margin-left: 0.3rem;">${it.pos}</span></div>
          <div class="search-item-sub">${it.club} • ${formatCurrency(it.val)} ${it.type.includes('dossier') ? '• ⚡ Precompiled Dossier' : ''}</div>
        </div>
      </div>
    `;
  }).join('');

  dropdown.style.display = 'block';

  dropdown.querySelectorAll('.search-item').forEach((el, i) => {
    el.addEventListener('click', () => {
      const item = items[i];
      input.value = item.name;
      dropdown.style.display = 'none';

      if (item.type === 'coach_dossier') {
        selectCoachDeparture(item.dossierIndex);
      } else if (item.type === 'coach_catalog') {
        selectCustomBenchmarkCoach(item.rawCoach);
      } else if (item.type === 'dossier') {
        selectDeparture(item.dossierIndex);
      } else {
        selectCustomBenchmarkPlayer(item.rawPlayer);
      }
    });
  });
}

// Setup Custom Pinning Search (Players & Coaches)
function setupCustomCandidateSearch() {
  const input = document.getElementById('customCandInput');
  const btn = document.getElementById('btnAddCustomCand');
  const dropdown = document.getElementById('customCandDropdown');
  if (!input || !dropdown) return;

  input.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (q.length < 2) {
      dropdown.style.display = 'none';
      return;
    }

    if (currentEntityMode === 'coaches') {
      const pool = engineData.coach_pool || [];
      const matched = pool.filter(p => p.name.toLowerCase().includes(q) || (p.club && p.club.toLowerCase().includes(q))).slice(0, 8);

      if (!matched.length) {
        dropdown.innerHTML = `<div class="search-item" style="color: var(--text-muted);">No manager found in catalog</div>`;
        dropdown.style.display = 'block';
        return;
      }

      dropdown.innerHTML = matched.map((p) => {
        const thumbHtml = p.image_url ?
          `<img src="${p.image_url}" class="search-thumb" alt="${p.name}" onerror="this.style.display='none';" />` :
          `<div class="search-thumb" style="display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:var(--accent-purple);">${getInitials(p.name)}</div>`;

        return `
          <div class="search-item search-item-with-thumb" data-id="${p.id}">
            ${thumbHtml}
            <div>
              <div class="search-item-title">${p.name} <span style="font-size: 0.75rem; color: var(--accent-purple); margin-left: 0.3rem;">${p.top_formation} • Age ${p.age}</span></div>
              <div class="search-item-sub">${p.club} • Wage: ${formatCurrency(p.annual_wage_eur)}/yr</div>
            </div>
          </div>
        `;
      }).join('');

      dropdown.style.display = 'block';

      dropdown.querySelectorAll('.search-item').forEach((el, idx) => {
        el.addEventListener('click', () => {
          const p = matched[idx];
          input.value = p.name;
          dropdown.style.display = 'none';
          addCustomCoachCandidate(p);
        });
      });
    } else {
      const pool = engineData.player_pool || [];
      const matched = pool.filter(p => p.name.toLowerCase().includes(q) || p.club.toLowerCase().includes(q)).slice(0, 8);

      if (!matched.length) {
        dropdown.innerHTML = `<div class="search-item" style="color: var(--text-muted);">No player found in catalog</div>`;
        dropdown.style.display = 'block';
        return;
      }

      dropdown.innerHTML = matched.map((p) => {
        const thumbHtml = p.img ?
          `<img src="${p.img}" class="search-thumb" alt="${p.name}" onerror="this.style.display='none';" />` :
          `<div class="search-thumb" style="display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:var(--accent-purple);">${getInitials(p.name)}</div>`;

        return `
          <div class="search-item search-item-with-thumb" data-id="${p.id}">
            ${thumbHtml}
            <div>
              <div class="search-item-title">${p.name} <span style="font-size: 0.75rem; color: var(--accent-purple); margin-left: 0.3rem;">${p.sub_pos || p.pos} • Age ${p.age}</span></div>
              <div class="search-item-sub">${p.club} • Fee: ${formatCurrency(p.val)}</div>
            </div>
          </div>
        `;
      }).join('');

      dropdown.style.display = 'block';

      dropdown.querySelectorAll('.search-item').forEach((el, idx) => {
        el.addEventListener('click', () => {
          const p = matched[idx];
          input.value = p.name;
          dropdown.style.display = 'none';
          addCustomCandidate(p);
        });
      });
    }
  });

  if (btn) {
    btn.addEventListener('click', () => {
      const q = input.value.trim().toLowerCase();
      if (!q) return;
      if (currentEntityMode === 'coaches') {
        const pool = engineData.coach_pool || [];
        const found = pool.find(p => p.name.toLowerCase().includes(q));
        if (found) addCustomCoachCandidate(found);
      } else {
        const pool = engineData.player_pool || [];
        const found = pool.find(p => p.name.toLowerCase().includes(q));
        if (found) addCustomCandidate(found);
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
}

function addCustomCandidate(rawCand) {
  const activeStar = getActiveStarData();
  if (!activeStar) return;

  const scoredCand = scoreCandidateAgainstStar(rawCand, activeStar);
  scoredCand.is_custom_pinned = true;

  customPinnedCandidates = customPinnedCandidates.filter(c => c.player_id !== scoredCand.player_id);
  customPinnedCandidates.unshift(scoredCand);

  selectCandidateForRadar(scoredCand);
  renderRecommendations();
}

function selectCustomBenchmarkPlayer(p) {
  activeBenchmarkPlayer = p;
  customPinnedCandidates = [];

  const starPhoto = document.getElementById('starPhoto');
  const starAvatar = document.getElementById('starAvatar');
  const starImgUrl = p.img || p.image_url || '';
  if (starPhoto && starAvatar) {
    if (starImgUrl) {
      starPhoto.src = starImgUrl;
      starPhoto.style.display = 'block';
      starAvatar.style.display = 'none';
    } else {
      starPhoto.style.display = 'none';
      starAvatar.style.display = 'flex';
      starAvatar.textContent = getInitials(p.name);
    }
  }

  document.getElementById('starName').textContent = p.name;
  document.getElementById('starMeta').textContent = `${p.club} • Age ${p.age} • ${p.sub_pos || p.pos}`;
  document.getElementById('starRoleTag').textContent = `${p.tactical_role || p.sub_pos || p.pos}`;
  document.getElementById('starFeeTag').textContent = `${formatCurrency(p.val)} Valuation`;

  document.getElementById('starG90').textContent = p.g90.toFixed(2);
  document.getElementById('starA90').textContent = p.a90.toFixed(2);
  document.getElementById('starGA90').textContent = p.ga90.toFixed(2);
  document.getElementById('starMinApp').textContent = p.min_app.toFixed(1);

  const starAgentEl = document.getElementById('starAgentName');
  if (starAgentEl) starAgentEl.textContent = p.agent || 'Family / Direct';

  const starContractEl = document.getElementById('starContractStatus');
  if (starContractEl) starContractEl.textContent = p.contract_status || (p.contract ? `Expires ${p.contract}` : 'Active Contract');

  const starWagesEl = document.getElementById('starWages');
  if (starWagesEl) starWagesEl.textContent = `${formatCurrency(p.wage_wk || Math.max(2500, Math.round(p.val * 0.0018)))} / wk`;

  const starNatEl = document.getElementById('starNatTeam');
  if (starNatEl) {
    const caps = p.caps ? ` (${p.caps} Caps)` : '';
    starNatEl.textContent = `${p.nat || 'Unknown'}${caps}`;
  }

  // Update Framework Stepper dynamic tags
  updateFrameworkStepperTags(p);

  const urgencyTier = p.age >= 32 ? "CRITICAL SUCCESSION URGENCY" : (p.age >= 29 ? "MEDIUM-TERM SUCCESSION PLANNING" : "SQUAD DEPTH CONTINGENCY");
  const urgencyScore = p.age >= 32 ? 92 : (p.age >= 29 ? 68 : 42);

  document.getElementById('voidSubtext').textContent = 
    `${p.club} succession analysis: Scout replacements before age curve decline or transfer exit`;

  document.getElementById('voidSeverityValue').textContent = `${urgencyScore} / 100`;
  document.getElementById('voidMeterFill').style.width = `${urgencyScore}%`;
  document.getElementById('voidSeverityDesc').textContent = 
    `At ${p.age} years old, athlete is in ${p.age >= 31 ? 'veteran decline horizon' : 'peak performance window'}. The engine is modeling successors to sustain tactical output.`;

  const pill = document.getElementById('voidSeverityPill');
  pill.textContent = urgencyTier;
  pill.className = 'severity-pill ';
  if (urgencyScore >= 75) pill.classList.add('severity-critical');
  else if (urgencyScore >= 60) pill.classList.add('severity-moderate');
  else pill.classList.add('severity-positive');

  document.getElementById('ppgPrePost').innerHTML = `2.15 ➔ <strong>1.68</strong>`;
  updateDeltaPill('ppgDelta', -0.47, 2);
  document.getElementById('winRatePrePost').innerHTML = `68.0% ➔ <strong>48.0%</strong>`;
  updateDeltaPill('winRateDelta', -20.0, 1, '%');
  document.getElementById('gfPrePost').innerHTML = `2.30 ➔ <strong>1.60</strong>`;
  updateDeltaPill('gfDelta', -0.70, 2);
  document.getElementById('gaPrePost').innerHTML = `1.10 ➔ <strong>1.35</strong>`;
  updateDeltaPill('gaDelta', 0.25, 2, '', true);
  document.getElementById('csPrePost').innerHTML = `40.0% ➔ <strong>24.0%</strong>`;
  updateDeltaPill('csDelta', -16.0, 1, '%');
  document.getElementById('formationPrePost').innerHTML = `${p.form} ➔ <strong>4-2-3-1</strong>`;

  renderRecommendations();
}

function addCustomCoachCandidate(rawCand) {
  const activeStar = getActiveCoachData();
  if (!activeStar) return;

  const scoredCand = scoreCoachAgainstStar(rawCand, activeStar);
  scoredCand.is_custom_pinned = true;

  customPinnedCoachCandidates = customPinnedCoachCandidates.filter(c => c.name !== scoredCand.name);
  customPinnedCoachCandidates.unshift(scoredCand);

  selectCoachCandidateForRadar(scoredCand);
  renderCoachRecommendations();
}

function selectCustomBenchmarkCoach(p) {
  activeBenchmarkCoach = p;
  customPinnedCoachCandidates = [];

  const starPhoto = document.getElementById('starPhoto');
  const starAvatar = document.getElementById('starAvatar');
  const starImgUrl = p.image_url || '';
  if (starPhoto && starAvatar) {
    if (starImgUrl) {
      starPhoto.src = starImgUrl;
      starPhoto.style.display = 'block';
      starAvatar.style.display = 'none';
    } else {
      starPhoto.style.display = 'none';
      starAvatar.style.display = 'flex';
      starAvatar.textContent = getInitials(p.name);
    }
  }

  document.getElementById('starName').textContent = p.name;
  document.getElementById('starMeta').textContent = `${p.club} • Age ${p.age} • ${p.top_formation}`;
  document.getElementById('starRoleTag').textContent = `${p.tactical_archetype || 'Head Coach'}`;
  document.getElementById('starFeeTag').textContent = `${formatCurrency(p.annual_wage_eur)}/yr Wage`;

  document.getElementById('starG90').textContent = p.ppg.toFixed(2);
  document.getElementById('starA90').textContent = `${p.win_pct.toFixed(1)}%`;
  document.getElementById('starGA90').textContent = p.gf_pg.toFixed(2);
  document.getElementById('starMinApp').textContent = `${p.games || p.total_games} Games`;

  const starAgentEl = document.getElementById('starAgentName');
  if (starAgentEl) starAgentEl.textContent = p.agent || 'Direct / Agency';

  const starContractEl = document.getElementById('starContractStatus');
  if (starContractEl) starContractEl.textContent = p.contract_status || 'Active Contract';

  const starWagesEl = document.getElementById('starWages');
  if (starWagesEl) starWagesEl.textContent = `${formatCurrency(p.annual_wage_eur)} / yr`;

  const starNatEl = document.getElementById('starNatTeam');
  if (starNatEl) starNatEl.textContent = `${p.nat || 'Unknown'}`;

  // Update Framework Stepper tags
  const s1 = document.getElementById('step1DynamicTag');
  if (s1) s1.textContent = `${p.top_formation} • ${p.tactical_archetype || 'Tactical System'}`;
  const s2 = document.getElementById('step2DynamicTag');
  if (s2) s2.textContent = `${p.games || p.total_games} Matches • ${p.win_pct.toFixed(1)}% Win Rate • ${p.ppg.toFixed(2)} PPG • ${p.trophies || 0} Trophies`;
  const s3 = document.getElementById('step3DynamicTag');
  if (s3) s3.textContent = `0-99th European Percentiles across 1,200+ Qualified Managers`;
  const s4 = document.getElementById('step4DynamicTag');
  if (s4) s4.textContent = `Wage Budget: ${formatCurrency(p.annual_wage_eur)}/yr • Composite Managerial Match Ranking`;

  const urgencyTier = p.age >= 60 ? "VETERAN TRANSITION CONTINGENCY" : "MEDIUM-TERM SUCCESSION PLANNING";
  const urgencyScore = p.age >= 60 ? 78 : 58;

  document.getElementById('voidSubtext').textContent = 
    `${p.club} managerial succession analysis: Scout successors to preserve sporting system`;

  document.getElementById('voidSeverityValue').textContent = `${urgencyScore} / 100`;
  document.getElementById('voidMeterFill').style.width = `${urgencyScore}%`;
  document.getElementById('voidSeverityDesc').textContent = 
    `At ${p.age} years old, tactician is in ${p.age >= 58 ? 'veteran managerial phase' : 'established prime phase'}. Modeling successors capable of sustaining ${p.top_formation}.`;

  const pill = document.getElementById('voidSeverityPill');
  pill.textContent = urgencyTier;
  pill.className = 'severity-pill ';
  if (urgencyScore >= 75) pill.classList.add('severity-critical');
  else pill.classList.add('severity-moderate');

  document.getElementById('ppgPrePost').innerHTML = `2.12 ➔ <strong>1.65</strong>`;
  updateDeltaPill('ppgDelta', -0.47, 2);
  document.getElementById('winRatePrePost').innerHTML = `65.0% ➔ <strong>46.0%</strong>`;
  updateDeltaPill('winRateDelta', -19.0, 1, '%');
  document.getElementById('gfPrePost').innerHTML = `2.25 ➔ <strong>1.55</strong>`;
  updateDeltaPill('gfDelta', -0.70, 2);
  document.getElementById('gaPrePost').innerHTML = `1.05 ➔ <strong>1.38</strong>`;
  updateDeltaPill('gaDelta', 0.33, 2, '', true);
  document.getElementById('csPrePost').innerHTML = `42.0% ➔ <strong>26.0%</strong>`;
  updateDeltaPill('csDelta', -16.0, 1, '%');
  document.getElementById('formationPrePost').innerHTML = `${p.top_formation} ➔ <strong>4-2-3-1</strong>`;

  renderCoachRecommendations();
}

// Render Top Marquee / Succession Departure Chips
function renderDepartureChips() {
  const track = document.getElementById('departureChipsTrack');
  if (!track || !engineData || !engineData.departures) return;
  track.innerHTML = '';

  const filtered = engineData.departures.filter((dep) => {
    const isSucc = dep.departure_meta.is_succession_case === true;
    const is2627 = dep.departure_meta.is_season_2627 === true;
    if (activeCategory === 'season_2627') return is2627;
    if (activeCategory === 'historical') return !isSucc && !is2627;
    if (activeCategory === 'succession') return isSucc;
    return true;
  });

  document.getElementById('transferCountLabel').textContent = `${filtered.length} Dossiers Listed`;

  filtered.forEach((dep) => {
    const origIdx = engineData.departures.indexOf(dep);
    const meta = dep.departure_meta;
    const isSelected = !activeBenchmarkPlayer && origIdx === currentDepartureIndex;
    const isSucc = meta.is_succession_case === true;
    const is2627 = meta.is_season_2627 === true;
    const chipImg = meta.image_url || (dep.star_stats && dep.star_stats.image_url) || '';

    let categoryBadge = '';
    if (is2627) {
      categoryBadge = `<span class="chip-season-badge">26/27 Season</span>`;
    } else if (isSucc) {
      categoryBadge = `<span class="chip-season-badge" style="border-color: rgba(168,85,247,0.4); color: var(--accent-purple); background: rgba(168,85,247,0.12);">Succession</span>`;
    }

    const chip = document.createElement('button');
    chip.className = `chip-btn ${isSelected ? 'active' : ''}`;
    chip.id = `chip-dep-${origIdx}`;
    chip.innerHTML = `
      <div class="chip-avatar-wrap">
        ${chipImg ? `<img src="${chipImg}" class="chip-photo-avatar" alt="${meta.player_name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />` : ''}
        <div class="chip-avatar" style="${chipImg ? 'display: none;' : ''} ${isSucc ? 'border-color: var(--accent-purple); color: var(--accent-purple);' : is2627 ? 'border-color: var(--accent-amber); color: var(--accent-amber);' : ''}">${getInitials(meta.player_name)}</div>
      </div>
      <div>
        <div style="display: flex; align-items: center; gap: 0.35rem;">
          <span class="chip-info-name">${meta.player_name}</span>
          ${categoryBadge}
        </div>
        <span class="chip-info-club">${meta.from_club_name} • ${isSucc ? 'Succession' : formatCurrency(meta.transfer_fee)}</span>
      </div>
    `;
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      activeBenchmarkPlayer = null;
      selectDeparture(origIdx);
    });
    track.appendChild(chip);
  });
}

// Select and Display a Specific Precompiled Departure
function selectDeparture(index) {
  if (!engineData || !engineData.departures[index]) return;
  currentDepartureIndex = index;
  currentCandidate = null;
  activeBenchmarkPlayer = null;

  document.querySelectorAll('.chip-btn').forEach((c) => {
    c.classList.toggle('active', c.id === `chip-dep-${index}`);
  });

  const dep = engineData.departures[index];
  const meta = dep.departure_meta;
  const voidData = dep.void_analysis;
  const star = dep.star_stats;
  const isSucc = meta.is_succession_case === true;

  document.getElementById('voidSubtext').textContent = isSucc ?
    `${meta.from_club_name} succession planning: Scout understudy replacements before contract expiry` :
    `${meta.from_club_name} sporting impact in 25 games post-departure (${meta.transfer_date})`;

  const severityVal = voidData.void_severity;
  document.getElementById('voidSeverityValue').textContent = `${severityVal} / 100`;
  document.getElementById('voidMeterFill').style.width = `${severityVal}%`;
  document.getElementById('voidSeverityDesc').textContent = voidData.severity_desc;

  const pill = document.getElementById('voidSeverityPill');
  pill.textContent = voidData.severity_tier;
  pill.className = 'severity-pill ';
  if (severityVal >= 75) pill.classList.add('severity-critical');
  else if (severityVal >= 60) pill.classList.add('severity-moderate');
  else if (severityVal >= 45) pill.classList.add('severity-rebuild');
  else pill.classList.add('severity-positive');

  const pre = voidData.pre;
  const post = voidData.post;
  const deltas = voidData.deltas;

  document.getElementById('ppgPrePost').innerHTML = `${pre.ppg.toFixed(2)} ➔ <strong>${post.ppg.toFixed(2)}</strong>`;
  updateDeltaPill('ppgDelta', deltas.delta_ppg, 2);

  document.getElementById('winRatePrePost').innerHTML = `${pre.win_rate.toFixed(1)}% ➔ <strong>${post.win_rate.toFixed(1)}%</strong>`;
  updateDeltaPill('winRateDelta', deltas.delta_win_rate, 1, '%');

  document.getElementById('gfPrePost').innerHTML = `${pre.goals_for_pg.toFixed(2)} ➔ <strong>${post.goals_for_pg.toFixed(2)}</strong>`;
  updateDeltaPill('gfDelta', deltas.delta_gf_pg, 2);

  document.getElementById('gaPrePost').innerHTML = `${pre.goals_against_pg.toFixed(2)} ➔ <strong>${post.goals_against_pg.toFixed(2)}</strong>`;
  updateDeltaPill('gaDelta', deltas.delta_ga_pg, 2, '', true);

  const csDelta = post.clean_sheet_pct - pre.clean_sheet_pct;
  document.getElementById('csPrePost').innerHTML = `${pre.clean_sheet_pct.toFixed(1)}% ➔ <strong>${post.clean_sheet_pct.toFixed(1)}%</strong>`;
  updateDeltaPill('csDelta', csDelta, 1, '%');

  const postForm = post.top_formations ? Object.keys(post.top_formations)[0] : 'Adaptive';
  document.getElementById('formationPrePost').innerHTML = `${dep.primary_formation} ➔ <strong>${postForm}</strong>`;

  // Update Star Benchmark Card
  const starPhoto = document.getElementById('starPhoto');
  const starAvatar = document.getElementById('starAvatar');
  const starImgUrl = star.image_url || meta.image_url || '';
  if (starPhoto && starAvatar) {
    if (starImgUrl) {
      starPhoto.src = starImgUrl;
      starPhoto.style.display = 'block';
      starAvatar.style.display = 'none';
    } else {
      starPhoto.style.display = 'none';
      starAvatar.style.display = 'flex';
      starAvatar.textContent = getInitials(meta.player_name);
    }
  }

  document.getElementById('starName').textContent = meta.player_name;
  document.getElementById('starMeta').textContent = isSucc ?
    `${meta.from_club_name} • Age ${star.age || 30} • ${meta.sub_position}` :
    `${meta.from_club_name} ➔ ${meta.to_club_name} (${meta.transfer_date})`;
  document.getElementById('starRoleTag').textContent = star.tactical_role || meta.role_tag || 'Talismanic Core';
  document.getElementById('starFeeTag').textContent = `${formatCurrency(meta.transfer_fee)} ${isSucc ? 'Valuation' : 'Fee'}`;

  document.getElementById('starG90').textContent = star.goals_per_90.toFixed(2);
  document.getElementById('starA90').textContent = star.assists_per_90.toFixed(2);
  document.getElementById('starGA90').textContent = star.ga_per_90.toFixed(2);
  document.getElementById('starMinApp').textContent = star.minutes_per_app.toFixed(1);

  const starAgentEl = document.getElementById('starAgentName');
  if (starAgentEl) starAgentEl.textContent = star.agent_name || 'Family / Direct';

  const starContractEl = document.getElementById('starContractStatus');
  if (starContractEl) starContractEl.textContent = star.contract_status || (star.contract_expiration_date ? `Expires ${star.contract_expiration_date}` : 'Active Contract');

  const starWagesEl = document.getElementById('starWages');
  if (starWagesEl) starWagesEl.textContent = `${formatCurrency(star.wage_weekly_eur || Math.max(2500, Math.round(meta.transfer_fee * 0.0018)))} / wk`;

  const starNatEl = document.getElementById('starNatTeam');
  if (starNatEl) {
    const caps = star.international_caps ? ` (${star.international_caps} Caps)` : '';
    starNatEl.textContent = `${star.country_of_citizenship || 'Unknown'}${caps}`;
  }

  // Update Framework Stepper tags
  updateFrameworkStepperTags(star, meta, dep);

  document.getElementById('systemCompatibilityText').innerHTML = 
    `The candidate recommender is filtering players capable of replicating this output within <strong>${dep.primary_formation}</strong> while staying under the received transfer fee budget.`;

  renderRecommendations();
}

// Render Top Coach Departure & Succession Chips
function renderCoachDepartureChips() {
  const track = document.getElementById('departureChipsTrack');
  if (!track || !engineData || !engineData.coach_departures) return;
  track.innerHTML = '';

  const filtered = engineData.coach_departures.filter((dep) => {
    const isSucc = dep.departure_meta.is_succession_case === true;
    if (activeCoachCategory === 'historical') return !isSucc;
    if (activeCoachCategory === 'succession') return isSucc;
    return true;
  });

  const countLabel = document.getElementById('transferCountLabel');
  if (countLabel) countLabel.textContent = `${filtered.length} Manager Dossiers Listed`;

  filtered.forEach((dep) => {
    const origIdx = engineData.coach_departures.indexOf(dep);
    const meta = dep.departure_meta;
    const isSelected = !activeBenchmarkCoach && origIdx === currentCoachDepartureIndex;
    const isSucc = meta.is_succession_case === true;
    const chipImg = meta.image_url || (dep.star_stats && dep.star_stats.image_url) || '';

    let categoryBadge = '';
    if (isSucc) {
      categoryBadge = `<span class="chip-season-badge" style="border-color: rgba(168,85,247,0.4); color: var(--accent-purple); background: rgba(168,85,247,0.12);">Succession</span>`;
    } else {
      categoryBadge = `<span class="chip-season-badge" style="border-color: rgba(6,182,212,0.4); color: var(--accent-cyan); background: rgba(6,182,212,0.12);">Marquee Exit</span>`;
    }

    const chip = document.createElement('button');
    chip.className = `chip-btn ${isSelected ? 'active' : ''}`;
    chip.id = `chip-coach-${origIdx}`;
    chip.innerHTML = `
      <div class="chip-avatar-wrap">
        ${chipImg ? `<img src="${chipImg}" class="chip-photo-avatar" alt="${meta.coach_name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />` : ''}
        <div class="chip-avatar" style="${chipImg ? 'display: none;' : ''} border-color: var(--accent-cyan); color: var(--accent-cyan);">${getInitials(meta.coach_name)}</div>
      </div>
      <div>
        <div style="display: flex; align-items: center; gap: 0.35rem;">
          <span class="chip-info-name">${meta.coach_name}</span>
          ${categoryBadge}
        </div>
        <span class="chip-info-club">${meta.from_club_name} • ${meta.primary_formation}</span>
      </div>
    `;
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      activeBenchmarkCoach = null;
      selectCoachDeparture(origIdx);
    });
    track.appendChild(chip);
  });
}

// Select and Display a Specific Precompiled Coach Departure
function selectCoachDeparture(index) {
  if (!engineData || !engineData.coach_departures || !engineData.coach_departures[index]) return;
  currentCoachDepartureIndex = index;
  currentCoachCandidate = null;
  activeBenchmarkCoach = null;

  document.querySelectorAll('.chip-btn').forEach((c) => {
    c.classList.toggle('active', c.id === `chip-coach-${index}`);
  });

  const dep = engineData.coach_departures[index];
  const meta = dep.departure_meta;
  const voidData = dep.void_analysis;
  const star = dep.star_stats;
  const isSucc = meta.is_succession_case === true;

  document.getElementById('voidSubtext').textContent = isSucc ?
    `${meta.from_club_name} managerial succession planning: Scout drop-in successor before contract transition` :
    `${meta.from_club_name} managerial sporting void in 25 games post-${meta.coach_name} exit (${meta.departure_date})`;

  const severityVal = voidData.void_severity;
  document.getElementById('voidSeverityValue').textContent = `${severityVal} / 100`;
  document.getElementById('voidMeterFill').style.width = `${severityVal}%`;
  document.getElementById('voidSeverityDesc').textContent = voidData.severity_desc;

  const pill = document.getElementById('voidSeverityPill');
  pill.textContent = voidData.severity_tier;
  pill.className = 'severity-pill ';
  if (severityVal >= 75) pill.classList.add('severity-critical');
  else if (severityVal >= 60) pill.classList.add('severity-moderate');
  else if (severityVal >= 45) pill.classList.add('severity-rebuild');
  else pill.classList.add('severity-positive');

  const pre = voidData.pre;
  const post = voidData.post;
  const deltas = voidData.deltas;

  document.getElementById('ppgPrePost').innerHTML = `${pre.ppg.toFixed(2)} ➔ <strong>${post.ppg.toFixed(2)}</strong>`;
  updateDeltaPill('ppgDelta', deltas.delta_ppg, 2);

  document.getElementById('winRatePrePost').innerHTML = `${pre.win_rate.toFixed(1)}% ➔ <strong>${post.win_rate.toFixed(1)}%</strong>`;
  updateDeltaPill('winRateDelta', deltas.delta_win_rate, 1, '%');

  document.getElementById('gfPrePost').innerHTML = `${pre.goals_for_pg.toFixed(2)} ➔ <strong>${post.goals_for_pg.toFixed(2)}</strong>`;
  updateDeltaPill('gfDelta', deltas.delta_gf_pg, 2);

  document.getElementById('gaPrePost').innerHTML = `${pre.goals_against_pg.toFixed(2)} ➔ <strong>${post.goals_against_pg.toFixed(2)}</strong>`;
  updateDeltaPill('gaDelta', deltas.delta_ga_pg, 2, '', true);

  const csDelta = post.clean_sheet_pct - pre.clean_sheet_pct;
  document.getElementById('csPrePost').innerHTML = `${pre.clean_sheet_pct.toFixed(1)}% ➔ <strong>${post.clean_sheet_pct.toFixed(1)}%</strong>`;
  updateDeltaPill('csDelta', csDelta, 1, '%');

  const postForm = post.top_formations ? Object.keys(post.top_formations)[0] : 'Adaptive';
  document.getElementById('formationPrePost').innerHTML = `${meta.primary_formation} ➔ <strong>${postForm}</strong>`;

  // Update Star Benchmark Card
  const starPhoto = document.getElementById('starPhoto');
  const starAvatar = document.getElementById('starAvatar');
  const starImgUrl = star.image_url || meta.image_url || '';
  if (starPhoto && starAvatar) {
    if (starImgUrl) {
      starPhoto.src = starImgUrl;
      starPhoto.style.display = 'block';
      starAvatar.style.display = 'none';
    } else {
      starPhoto.style.display = 'none';
      starAvatar.style.display = 'flex';
      starAvatar.textContent = getInitials(meta.coach_name);
    }
  }

  document.getElementById('starName').textContent = meta.coach_name;
  document.getElementById('starMeta').textContent = isSucc ?
    `${meta.from_club_name} • Age ${star.age || meta.age} • ${meta.primary_formation}` :
    `${meta.from_club_name} ➔ ${meta.to_destination} (${meta.departure_date})`;
  document.getElementById('starRoleTag').textContent = star.tactical_archetype || meta.philosophy_tag || 'Master Tactician';
  document.getElementById('starFeeTag').textContent = `${formatCurrency(meta.annual_wage || star.annual_wage_eur)}/yr Wage`;

  document.getElementById('starG90').textContent = star.ppg.toFixed(2);
  document.getElementById('starA90').textContent = `${star.win_pct.toFixed(1)}%`;
  document.getElementById('starGA90').textContent = star.gf_pg.toFixed(2);
  document.getElementById('starMinApp').textContent = `${star.total_games} Games`;

  const starAgentEl = document.getElementById('starAgentName');
  if (starAgentEl) starAgentEl.textContent = star.agent || 'Direct / Agency';

  const starContractEl = document.getElementById('starContractStatus');
  if (starContractEl) starContractEl.textContent = star.contract_status || 'Tenure Concluded';

  const starWagesEl = document.getElementById('starWages');
  if (starWagesEl) starWagesEl.textContent = `${formatCurrency(meta.annual_wage || star.annual_wage_eur)} / yr`;

  const starNatEl = document.getElementById('starNatTeam');
  if (starNatEl) starNatEl.textContent = `${star.nat || meta.nat || 'Unknown'}`;

  // Update Framework Stepper tags
  const s1 = document.getElementById('step1DynamicTag');
  if (s1) s1.textContent = `${meta.primary_formation} • ${star.tactical_archetype || meta.philosophy_tag}`;
  const s2 = document.getElementById('step2DynamicTag');
  if (s2) s2.textContent = `${star.total_games} Matches • ${star.win_pct.toFixed(1)}% Win Rate • ${star.ppg.toFixed(2)} PPG • ${star.trophies || 0} Trophies`;
  const s3 = document.getElementById('step3DynamicTag');
  if (s3) s3.textContent = `System Percentiles: ${star.radar_percentiles?.attacking_output || 85}th %ile GF/G • ${star.radar_percentiles?.defensive_solidity || 85}th %ile GA/G`;
  const s4 = document.getElementById('step4DynamicTag');
  if (s4) s4.textContent = `Wage Budget: ${formatCurrency(meta.annual_wage || star.annual_wage_eur)}/yr • Composite Managerial Match Ranking`;

  document.getElementById('systemCompatibilityText').innerHTML = 
    `The managerial recommender is scoring tactical leaders capable of deploying <strong>${meta.primary_formation}</strong> with high pressing intensity while fitting within the club's managerial wage framework.`;

  renderCoachRecommendations();
}

function updateFrameworkStepperTags(star, meta, dep) {
  const pName = meta ? meta.player_name : (star.name || 'Selected Star');
  const posGrp = star.pos_group || 'CM';
  const subPos = meta ? meta.sub_position : (star.sub_pos || star.position);
  const roleName = star.tactical_role || 'Tactical Operator';
  const foot = star.foot || 'Right';
  const form = dep ? dep.primary_formation : (star.form || '4-2-3-1');
  const fee = meta ? meta.transfer_fee : (star.val || 50_000_000);

  const s1 = document.getElementById('step1DynamicTag');
  if (s1) s1.textContent = `${subPos} • ${roleName} • ${foot}-Footed (${form})`;

  const s2 = document.getElementById('step2DynamicTag');
  if (s2) s2.textContent = `${star.total_minutes || 2400} Mins • ${star.goals_per_90 || star.g90 || 0} G/90 • ${star.assists_per_90 || star.a90 || 0} A/90`;

  const s3 = document.getElementById('step3DynamicTag');
  if (s3) s3.textContent = `Group: [${posGrp}] • Like-for-Like Per-90 & Empirical 0-99th %iles`;

  const s4 = document.getElementById('step4DynamicTag');
  if (s4) s4.textContent = `Budget: ${formatCurrency(fee)} • Multi-Vector Weighted Match Ranking`;
}

function updateDeltaPill(elemId, val, decimals = 2, unit = '', invertPositive = false) {
  const el = document.getElementById(elemId);
  if (!el) return;
  const formatted = (val > 0 ? `+${val.toFixed(decimals)}` : `${val.toFixed(decimals)}`) + unit;
  el.textContent = formatted;
  el.className = 'delta-pill ';

  if (Math.abs(val) < 0.01) {
    el.classList.add('neutral');
  } else if (!invertPositive) {
    el.classList.add(val > 0 ? 'pos' : 'neg');
  } else {
    el.classList.add(val < 0 ? 'pos' : 'neg');
  }
}

// Get the active benchmark star profile
function getActiveStarData() {
  if (activeBenchmarkPlayer) {
    const p = activeBenchmarkPlayer;
    const wkWage = p.wage_wk || Math.max(2500, Math.round(p.val * 0.0018));
    const yrWage = p.wage_yr || Math.max(130000, Math.round(p.val * 0.0018 * 52));
    const totMins = p.mins || (p.min_app ? Math.round(p.min_app * (p.apps || 30)) : 2400);
    return {
      player_id: p.id,
      name: p.name,
      club: p.club,
      pos: p.pos,
      sub_pos: p.sub_pos,
      pos_group: p.pos_group || 'CM',
      tactical_role: p.tactical_role || 'Dynamic Core',
      role_description: p.role_description || '',
      foot_trait: p.foot_trait || '',
      age: p.age,
      val: p.val,
      fee: p.val,
      formation: p.form,
      image_url: p.img || p.image_url || '',
      g90: p.g90,
      a90: p.a90,
      ga90: p.ga90,
      min_app: p.min_app,
      foot: p.foot,
      height: p.height,
      total_appearances: p.apps || 0,
      total_minutes: totMins,
      total_goals: p.goals !== undefined ? p.goals : Math.round((p.g90 || 0) * totMins / 90),
      total_assists: p.assists !== undefined ? p.assists : Math.round((p.a90 || 0) * totMins / 90),
      total_yellows: p.yellows || 0,
      total_reds: p.reds || 0,
      season_appearances: p.s_apps || 0,
      season_minutes: p.s_mins || 0,
      season_goals: p.s_goals || 0,
      season_assists: p.s_assists || 0,
      season_yellows: p.s_yellows || 0,
      season_reds: p.s_reds || 0,
      international_caps: p.caps || 0,
      international_goals: p.int_goals || 0,
      role_metrics: p.role_metrics || {},
      role_percentiles: p.role_percentiles || {},
      agent_name: p.agent || 'Family / Direct',
      contract_expiration_date: p.contract || 'Rolling Contract',
      contract_status: p.contract_status || 'Active Contract',
      country_of_citizenship: p.nat || 'Unknown',
      wage_weekly_eur: wkWage,
      wage_annual_eur: yrWage
    };
  } else if (engineData && engineData.departures && engineData.departures[currentDepartureIndex]) {
    const dep = engineData.departures[currentDepartureIndex];
    const s = dep.star_stats;
    const m = dep.departure_meta;
    const wkWage = s.wage_weekly_eur || Math.max(2500, Math.round(m.transfer_fee * 0.0018));
    const yrWage = s.wage_annual_eur || Math.max(130000, Math.round(m.transfer_fee * 0.0018 * 52));
    const totMins = s.total_minutes || Math.round((s.minutes_per_app || 75) * (s.total_appearances || 30));
    return {
      player_id: m.player_id,
      name: m.player_name,
      club: m.from_club_name,
      pos: m.position,
      sub_pos: m.sub_position,
      pos_group: s.pos_group || m.pos_group || 'CM',
      tactical_role: s.tactical_role || m.tactical_role || 'Talismanic Core',
      role_description: s.role_description || m.role_description || '',
      foot_trait: s.foot_trait || m.foot_trait || '',
      age: s.age || 26,
      val: m.transfer_fee,
      fee: m.transfer_fee,
      formation: dep.primary_formation,
      image_url: s.image_url || m.image_url || '',
      g90: s.goals_per_90,
      a90: s.assists_per_90,
      ga90: s.ga_per_90,
      min_app: s.minutes_per_app,
      foot: s.foot,
      height: s.height_in_cm,
      total_appearances: s.total_appearances || 0,
      total_minutes: totMins,
      total_goals: s.total_goals !== undefined ? s.total_goals : Math.round((s.goals_per_90 || 0) * totMins / 90),
      total_assists: s.total_assists !== undefined ? s.total_assists : Math.round((s.assists_per_90 || 0) * totMins / 90),
      total_yellows: s.total_yellows || 0,
      total_reds: s.total_reds || 0,
      season_appearances: s.season_appearances || 0,
      season_minutes: s.season_minutes || 0,
      season_goals: s.season_goals || 0,
      season_assists: s.season_assists || 0,
      season_yellows: s.season_yellows || 0,
      season_reds: s.season_reds || 0,
      international_caps: s.international_caps || 0,
      international_goals: s.international_goals || 0,
      role_metrics: s.role_metrics || {},
      role_percentiles: s.role_percentiles || {},
      agent_name: s.agent_name || 'Family / Independent Agency',
      contract_expiration_date: s.contract_expiration_date || 'Rolling Contract',
      contract_status: s.contract_status || 'Active Contract',
      country_of_citizenship: s.country_of_citizenship || 'Unknown',
      wage_weekly_eur: wkWage,
      wage_annual_eur: yrWage
    };
  }
  return null;
}

// Score a candidate player against a star profile using position-specific metrics
function scoreCandidateAgainstStar(cand, star) {
  const candId = cand.id || cand.player_id;
  const candName = cand.name;
  const candClub = cand.club || cand.current_club_name || 'Free Agent';
  const candPos = cand.pos || cand.position || '';
  const candSubPos = cand.sub_pos || cand.sub_position || '';
  const candPosGrp = cand.pos_group || star.pos_group || 'CM';
  const candAge = cand.age || 22;
  const candVal = cand.val !== undefined ? cand.val : (cand.market_value_in_eur || 0);
  const candFoot = cand.foot || 'Right';
  const candG90 = cand.g90 !== undefined ? cand.g90 : (cand.goals_per_90 || 0);
  const candA90 = cand.a90 !== undefined ? cand.a90 : (cand.assists_per_90 || 0);
  const candGA90 = cand.ga90 !== undefined ? cand.ga90 : (cand.ga_per_90 || 0);
  const candMinApp = cand.min_app !== undefined ? cand.min_app : (cand.minutes_per_app || 70);
  const candApps = cand.apps !== undefined ? cand.apps : (cand.total_appearances || 20);
  const candMins = cand.mins !== undefined ? cand.mins : (cand.total_minutes || 1400);
  const candForm = cand.form || cand.top_formation || '4-2-3-1';
  const candHeight = cand.height || cand.height_in_cm || 180;
  const candGoals = cand.goals !== undefined ? cand.goals : (cand.total_goals !== undefined ? cand.total_goals : Math.round(candG90 * candMins / 90));
  const candAssists = cand.assists !== undefined ? cand.assists : (cand.total_assists !== undefined ? cand.total_assists : Math.round(candA90 * candMins / 90));
  const candYellows = cand.yellows !== undefined ? cand.yellows : (cand.total_yellows || 0);
  const candReds = cand.reds !== undefined ? cand.reds : (cand.total_reds || 0);
  const candCaps = cand.caps !== undefined ? cand.caps : (cand.international_caps || 0);
  const candIntGoals = cand.int_goals !== undefined ? cand.int_goals : (cand.international_goals || 0);
  const candNat = cand.nat || cand.country_of_citizenship || 'Unknown';

  let roleMatchWeight = 0.55;
  if (star.sub_pos && candSubPos && POSITION_AFFINITY[star.sub_pos] && POSITION_AFFINITY[star.sub_pos][candSubPos]) {
    roleMatchWeight = POSITION_AFFINITY[star.sub_pos][candSubPos];
  } else if (star.pos && candPos && star.pos === candPos) {
    roleMatchWeight = 0.85;
  } else if (['Midfield', 'Attack'].includes(star.pos) && ['Midfield', 'Attack'].includes(candPos)) {
    roleMatchWeight = 0.72;
  }

  // Like-for-like role-specific metric distance
  const targetPcts = star.role_percentiles || {};
  const candPcts = cand.role_percentiles || {};
  let metricDiffs = [];
  for (const k of Object.keys(targetPcts)) {
    const starP = targetPcts[k];
    const candP = candPcts[k] !== undefined ? candPcts[k] : 50;
    metricDiffs.push(Math.abs(starP - candP));
  }
  const avgDiff = metricDiffs.length ? (metricDiffs.reduce((a, b) => a + b, 0) / metricDiffs.length) : 28.0;
  const roleMetricFit = Math.max(35.0, 100.0 - (avgDiff * 1.35));

  const sampleReliability = Math.min(1.0, Math.max(0.45, Math.sqrt(candMins / 1600.0)));
  const tacticalScore = Math.min(99.2, Math.max(25.0, ((roleMetricFit * sampleReliability) + (70.0 * (1.0 - sampleReliability))) * roleMatchWeight));

  const formationScore = (star.formation && candForm && star.formation.split(' ')[0] === candForm.split(' ')[0]) ? 94.0 : 78.0;

  const feeLimit = star.fee || 50_000_000;
  let financialScore = 80.0;
  if (feeLimit > 0 && candVal > 0) {
    const ratio = candVal / feeLimit;
    if (ratio <= 0.65) financialScore = 96.0 - (ratio * 15.0);
    else if (ratio <= 1.0) financialScore = 82.0 - ((ratio - 0.65) * 30.0);
    else financialScore = Math.max(40.0, 70.0 - ((ratio - 1.0) * 40.0));
  }

  let growthScore = 65.0;
  if (candAge <= 21) growthScore = 97.0;
  else if (candAge <= 23) growthScore = 91.0;
  else if (candAge <= 26) growthScore = 83.0;
  else if (candAge <= 29) growthScore = 72.0;
  else growthScore = 54.0;

  let footBonus = 0;
  if (star.foot && candFoot && (star.foot.toLowerCase() === candFoot.toLowerCase() || candFoot.toLowerCase() === 'both')) {
    footBonus = 2.5;
  }

  let composite = (tacticalScore * 0.42) + (formationScore * 0.20) + (financialScore * 0.20) + (growthScore * 0.15) + footBonus;
  composite = Math.min(99.2, Math.max(35.0, Math.round(composite * 10) / 10));

  const savingsEur = Math.max(0, feeLimit - candVal);
  const savingsPct = feeLimit > 0 ? Math.round((savingsEur / feeLimit) * 1000) / 10 : 0;

  const wkWage = cand.wage_wk || cand.wage_weekly_eur || Math.max(2500, Math.round(candVal * 0.0018));
  const yrWage = cand.wage_yr || cand.wage_annual_eur || Math.max(130000, Math.round(candVal * 0.0018 * 52));

  return {
    player_id: candId,
    name: candName,
    current_club_name: candClub,
    position: candPos,
    sub_position: candSubPos,
    pos_group: candPosGrp,
    tactical_role: cand.tactical_role || candSubPos || candPos,
    role_description: cand.role_description || '',
    foot_trait: cand.foot_trait || `${candFoot}-footed player`,
    age: candAge,
    market_value_in_eur: candVal,
    foot: candFoot,
    height_in_cm: candHeight,
    top_formation: candForm,
    image_url: cand.img || cand.image_url || '',
    goals_per_90: candG90,
    assists_per_90: candA90,
    ga_per_90: candGA90,
    total_minutes: candMins,
    total_appearances: candApps,
    minutes_per_app: candMinApp,
    total_goals: candGoals,
    total_assists: candAssists,
    total_yellows: candYellows,
    total_reds: candReds,
    tactical_similarity_score: Math.round(tacticalScore * 10) / 10,
    formation_compatibility_score: formationScore,
    financial_feasibility_score: Math.round(financialScore * 10) / 10,
    growth_potential_score: growthScore,
    composite_match_score: composite,
    savings_eur: savingsEur,
    savings_pct: savingsPct,
    season_appearances: cand.season_appearances !== undefined ? cand.season_appearances : (cand.s_apps || 0),
    season_minutes: cand.season_minutes !== undefined ? cand.season_minutes : (cand.s_mins || 0),
    season_goals: cand.season_goals !== undefined ? cand.season_goals : (cand.s_goals || 0),
    season_assists: cand.season_assists !== undefined ? cand.season_assists : (cand.s_assists || 0),
    season_yellows: cand.season_yellows !== undefined ? cand.season_yellows : (cand.s_yellows || 0),
    season_reds: cand.season_reds !== undefined ? cand.season_reds : (cand.s_reds || 0),
    role_metrics: cand.role_metrics || {},
    role_percentiles: cand.role_percentiles || {},
    agent_name: cand.agent || cand.agent_name || 'Family / Direct',
    contract_expiration_date: cand.contract || cand.contract_expiration_date || 'Rolling Contract',
    contract_status: cand.contract_status || 'Active Contract',
    country_of_citizenship: candNat,
    international_caps: candCaps,
    international_goals: candIntGoals,
    wage_weekly_eur: wkWage,
    wage_annual_eur: yrWage
  };
}

// Render Drop-In Replacement Recommendations Grid
function renderRecommendations() {
  const grid = document.getElementById('recCardsGrid');
  if (!grid || !engineData) return;
  grid.innerHTML = '';

  const activeStar = getActiveStarData();
  if (!activeStar) return;

  let baseList = [];

  if (activeBenchmarkPlayer) {
    const pool = engineData.player_pool || [];
    baseList = pool
      .filter(p => p.id !== activeBenchmarkPlayer.id)
      .map(p => scoreCandidateAgainstStar(p, activeStar));
  } else {
    const dep = engineData.departures[currentDepartureIndex];
    if (planningHorizon === 'succession_3yr' && dep.succession_recommendations && dep.succession_recommendations.length) {
      baseList = [...dep.succession_recommendations];
    } else {
      baseList = [...(dep.recommendations || [])];
    }
  }

  // Prepend custom pinned candidates
  if (customPinnedCandidates && customPinnedCandidates.length) {
    customPinnedCandidates.forEach(cp => {
      baseList = baseList.filter(c => c.player_id !== cp.player_id);
      baseList.unshift(cp);
    });
  }

  // Filter candidates
  const starFee = activeStar.fee || 50_000_000;
  const budgetLimit = starFee * filterBudgetRatio;

  const filtered = baseList.filter(c => {
    if (c.market_value_in_eur > budgetLimit) return false;
    if (c.age > filterMaxAge) return false;
    if (c.composite_match_score < filterMinScore) return false;
    return true;
  });

  filtered.sort((a, b) => b.composite_match_score - a.composite_match_score);

  const countBadge = document.getElementById('filteredCandidatesCount');
  if (countBadge) {
    countBadge.textContent = `${filtered.length} Candidates Qualified`;
  }

  if (filtered.length > 0 && !currentCandidate) {
    currentCandidate = filtered[0];
  } else if (filtered.length > 0 && currentCandidate) {
    const exists = filtered.find(c => c.player_id === currentCandidate.player_id);
    if (!exists) currentCandidate = filtered[0];
  } else {
    currentCandidate = null;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 3rem 1.5rem; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
        <p style="font-size: 1.15rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem;">No candidates meet these filter constraints</p>
        <p style="font-size: 0.88rem;">Try loosening the Budget Cap slider, expanding the Max Age limit, or lowering the Min Match Score threshold.</p>
      </div>
    `;
    drawRadarChart();
    renderComparisonTable();
    drawScatterPlot(filtered, activeStar);
    return;
  }

  filtered.forEach((cand, idx) => {
    const isSelected = currentCandidate && currentCandidate.player_id === cand.player_id;
    const isPinned = cand.is_custom_pinned === true;
    const weeklyWageSavings = (activeStar.wage_weekly_eur || 0) - (cand.wage_weekly_eur || 0);

    const card = document.createElement('article');
    card.className = `candidate-card ${isSelected ? 'active-compare' : ''} ${isPinned ? 'pinned-cand' : ''}`;
    card.id = `cand-card-${cand.player_id}`;

    const candImgUrl = cand.image_url || '';
    const avatarHtml = candImgUrl ?
      `<img src="${candImgUrl}" class="cand-photo-avatar" alt="${cand.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
       <div class="cand-initials-avatar" style="display: none;">${getInitials(cand.name)}</div>` :
      `<div class="cand-initials-avatar">${getInitials(cand.name)}</div>`;

    card.innerHTML = `
      <div class="cand-card-body">
        <div class="cand-header-flex">
          <div class="cand-title-wrap">
            <div class="cand-avatar-wrap">
              ${avatarHtml}
            </div>
            <div>
              <h3 class="cand-name">${cand.name}</h3>
              <p class="cand-club">${cand.current_club_name}</p>
              ${cand.tactical_role ? `<span class="archetype-tag">${cand.tactical_role}</span>` : ''}
            </div>
          </div>
          <div class="match-score-badge">
            <span class="match-score-number">${cand.composite_match_score}%</span>
            <span class="match-score-lbl">Match Score</span>
          </div>
        </div>

        <div class="cand-tags-row">
          <span class="cand-tag">Age ${cand.age}</span>
          <span class="cand-tag">${cand.sub_position || cand.position}</span>
          <span class="cand-tag">${cand.foot || 'Right'} Foot</span>
          <span class="cand-tag">${cand.top_formation || '4-2-3-1'}</span>
        </div>

        <div class="cand-stats-grid">
          <div class="cand-stat-box">
            <div class="val">${cand.goals_per_90}</div>
            <div class="lbl">G / 90</div>
          </div>
          <div class="cand-stat-box">
            <div class="val">${cand.assists_per_90}</div>
            <div class="lbl">A / 90</div>
          </div>
          <div class="cand-stat-box">
            <div class="val">${cand.ga_per_90}</div>
            <div class="lbl">G+A / 90</div>
          </div>
        </div>

        <!-- Candidate Dossier: Agent, Contract, Wage, National Team -->
        <div class="cand-meta-row">
          <div class="cand-meta-item">
            <span class="cand-meta-lbl">👔 Agent</span>
            <span class="cand-meta-val" title="${cand.agent_name || 'Family / Direct'}">${cand.agent_name || 'Family / Direct'}</span>
          </div>
          <div class="cand-meta-item">
            <span class="cand-meta-lbl">📄 Contract</span>
            <span class="cand-meta-val" style="color: ${cand.contract_status && cand.contract_status.includes('Expiry') ? '#fbbf24' : 'var(--text-secondary)'};">${cand.contract_status || cand.contract_expiration_date || 'Active Contract'}</span>
          </div>
          <div class="cand-meta-item">
            <span class="cand-meta-lbl">💰 Wage</span>
            <span class="cand-meta-val" style="color: var(--accent-cyan); font-family: var(--font-mono);">${formatCurrency(cand.wage_weekly_eur)}/wk</span>
          </div>
          <div class="cand-meta-item">
            <span class="cand-meta-lbl">🌍 Nation</span>
            <span class="cand-meta-val">${cand.country_of_citizenship || 'Unknown'}${cand.international_caps ? ' (' + cand.international_caps + ' caps)' : ''}</span>
          </div>
        </div>

        <div class="arbitrage-banner">
          <div>
            <span>Fee: ${formatCurrency(cand.market_value_in_eur)}</span>
            <span style="color: #6ee7b7; margin-left: 0.35rem;">(-${formatCurrency(cand.savings_eur)})</span>
          </div>
          <div style="font-size: 0.74rem;">
            <span>Wage: ${formatCurrency(cand.wage_weekly_eur)}/wk</span>
            ${weeklyWageSavings > 0 ? `<span style="color: #6ee7b7; margin-left: 0.3rem;">(Saves ${formatCurrency(weeklyWageSavings)}/wk)</span>` : ''}
          </div>
        </div>
      </div>

      <button class="card-action-btn" id="btn-select-${cand.player_id}">
        <span>${isSelected ? '✓ Viewing in Radar' : 'Compare in Radar'}</span> ➔
      </button>
    `;

    card.addEventListener('click', (e) => {
      e.stopPropagation();
      selectCandidateForRadar(cand);
    });

    grid.appendChild(card);
  });

  drawRadarChart();
  renderComparisonTable();
  drawScatterPlot(filtered, activeStar);
}

// Get the active benchmark coach profile
function getActiveCoachData() {
  if (activeBenchmarkCoach) {
    const c = activeBenchmarkCoach;
    return {
      name: c.name,
      club: c.club || c.current_club || 'Free Agent',
      age: c.age || 50,
      nat: c.nat || 'Unknown',
      tactical_archetype: c.tactical_archetype || 'Modern System Tactician',
      role_description: c.role_description || 'High-intensity tactical organization and pressing structure.',
      top_formation: c.top_formation || '4-3-3 Attacking',
      secondary_formation: c.secondary_formation || '4-2-3-1',
      total_games: c.games || c.total_games || 150,
      wins: c.wins || 90,
      draws: c.draws || 30,
      losses: c.losses || 30,
      win_pct: c.win_pct || 60.0,
      ppg: c.ppg || 2.0,
      gf_pg: c.gf_pg || 2.0,
      ga_pg: c.ga_pg || 1.0,
      cs_pct: c.cs_pct || 38.0,
      trophies: c.trophies || 0,
      agent: c.agent || 'Direct / Agency',
      contract_status: c.contract_status || 'Active Contract',
      annual_wage_eur: c.annual_wage_eur || 6_000_000,
      buyout_clause_eur: c.buyout_clause_eur || 10_000_000,
      image_url: c.image_url || '',
      radar_percentiles: c.radar_percentiles || {
        ppg_win_efficiency: 75,
        attacking_output: 75,
        defensive_solidity: 75,
        formation_flexibility: 75,
        pressing_intensity: 75,
        durability_longevity: 75
      }
    };
  } else if (engineData && engineData.coach_departures && engineData.coach_departures[currentCoachDepartureIndex]) {
    const dep = engineData.coach_departures[currentCoachDepartureIndex];
    const s = dep.star_stats;
    const m = dep.departure_meta;
    return {
      name: m.coach_name,
      club: m.from_club_name,
      age: s.age || m.age || 52,
      nat: s.nat || m.nat || 'Unknown',
      tactical_archetype: s.tactical_archetype || m.philosophy_tag || 'Master Tactician',
      role_description: s.role_description || '',
      top_formation: s.top_formation || m.primary_formation || '4-3-3 Attacking',
      secondary_formation: s.secondary_formation || '4-2-3-1',
      total_games: s.total_games || 250,
      wins: s.wins || 150,
      draws: s.draws || 50,
      losses: s.losses || 50,
      win_pct: s.win_pct || 60.0,
      ppg: s.ppg || 2.0,
      gf_pg: s.gf_pg || 2.0,
      ga_pg: s.ga_pg || 1.0,
      cs_pct: s.cs_pct || 38.0,
      trophies: s.trophies || 0,
      agent: s.agent || 'Direct / Independent Agency',
      contract_status: s.contract_status || 'Tenure Concluded',
      annual_wage_eur: s.annual_wage_eur || m.annual_wage || 10_000_000,
      buyout_clause_eur: s.buyout_clause_eur || 15_000_000,
      image_url: s.image_url || m.image_url || '',
      radar_percentiles: s.radar_percentiles || {
        ppg_win_efficiency: 85,
        attacking_output: 85,
        defensive_solidity: 80,
        formation_flexibility: 80,
        pressing_intensity: 85,
        durability_longevity: 85
      }
    };
  }
  return null;
}

// Score a candidate coach against a star coach profile
function scoreCoachAgainstStar(cand, star) {
  const candName = cand.name;
  const candClub = cand.club || cand.current_club || 'Free Agent';
  const candAge = cand.age || 48;
  const candTopForm = cand.top_formation || cand.primary_formation || '4-3-3 Attacking';
  const candSecForm = cand.secondary_formation || '4-2-3-1';
  const candGames = cand.games || cand.total_games || 100;
  const candWins = cand.wins || Math.round(candGames * 0.55);
  const candDraws = cand.draws || Math.round(candGames * 0.22);
  const candLosses = cand.losses || (candGames - candWins - candDraws);
  const candWinPct = cand.win_pct !== undefined ? cand.win_pct : ((candWins / Math.max(1, candGames)) * 100);
  const candPpg = cand.ppg !== undefined ? cand.ppg : ((candWins * 3 + candDraws) / Math.max(1, candGames));
  const candGf = cand.gf_pg !== undefined ? cand.gf_pg : 1.85;
  const candGa = cand.ga_pg !== undefined ? cand.ga_pg : 1.15;
  const candCs = cand.cs_pct !== undefined ? cand.cs_pct : 35.0;
  const candTrophies = cand.trophies !== undefined ? cand.trophies : 0;
  const candWage = cand.annual_wage_eur !== undefined ? cand.annual_wage_eur : 5_000_000;
  const candBuyout = cand.buyout_clause_eur !== undefined ? cand.buyout_clause_eur : 8_000_000;
  const candAgent = cand.agent || 'Sports360 / Elite Agency';
  const candContract = cand.contract_status || 'Active Contract (Expires 2027)';
  const candNat = cand.nat || 'Unknown';
  const candArchetype = cand.tactical_archetype || 'High-Press System Tactician';
  const candDesc = cand.role_description || 'Dominant possession structure with aggressive rest-defense.';
  const candImg = cand.image_url || '';

  // 1. Tactical & Efficiency Similarity (40% Weight)
  const starPpg = star.ppg || 2.0;
  const starGf = star.gf_pg || 2.0;
  const starWinPct = star.win_pct || 60.0;
  const ppgDiff = Math.abs(starPpg - candPpg);
  const gfDiff = Math.abs(starGf - candGf);
  const winDiff = Math.abs(starWinPct - candWinPct);
  const tacticalSim = Math.min(99.0, Math.max(42.0, 100.0 - (ppgDiff * 28.0 + gfDiff * 14.0 + winDiff * 0.35)));

  // 2. Formation & System Compatibility (25% Weight)
  let formationComp = 75.0;
  if (candTopForm === star.top_formation) formationComp = 98.0;
  else if (candSecForm === star.top_formation || candTopForm === star.secondary_formation) formationComp = 88.0;
  else if (candTopForm.startsWith('4-3-3') && star.top_formation.startsWith('4-2-3-1')) formationComp = 90.0;
  else if (candTopForm.startsWith('4-2-3-1') && star.top_formation.startsWith('4-3-3')) formationComp = 90.0;

  // 3. Financial / Wage Feasibility (20% Weight)
  const starWage = star.annual_wage_eur || 10_000_000;
  let finFeas = 85.0;
  if (candWage <= starWage) {
    finFeas = Math.min(99.0, 88.0 + ((starWage - candWage) / starWage) * 12.0);
  } else {
    finFeas = Math.max(45.0, 88.0 - ((candWage - starWage) / starWage) * 55.0);
  }

  // 4. Age Runway & Longevity Potential (15% Weight)
  let growthScore = 75.0;
  if (candAge < 45) growthScore = 96.0;
  else if (candAge <= 52) growthScore = 88.0;
  else if (candAge <= 60) growthScore = 76.0;
  else growthScore = 65.0;

  const compositeScore = Math.round(tacticalSim * 0.40 + formationComp * 0.25 + finFeas * 0.20 + growthScore * 0.15);
  const savingsEur = Math.max(0, starWage - candWage);
  const savingsPct = starWage > 0 ? Math.round((savingsEur / starWage) * 100) : 0;

  const candPcts = cand.radar_percentiles || {
    ppg_win_efficiency: Math.round(Math.min(99, Math.max(15, (candPpg / 2.5) * 100))),
    attacking_output: Math.round(Math.min(99, Math.max(15, (candGf / 2.8) * 100))),
    defensive_solidity: Math.round(Math.min(99, Math.max(15, (1.0 - (candGa / 2.0)) * 100))),
    formation_flexibility: 82,
    pressing_intensity: 85,
    durability_longevity: Math.round(Math.min(99, Math.max(20, (candGames / 500) * 100)))
  };

  return {
    name: candName,
    current_club: candClub,
    club: candClub,
    age: candAge,
    nat: candNat,
    tactical_archetype: candArchetype,
    role_description: candDesc,
    top_formation: candTopForm,
    primary_formation: candTopForm,
    secondary_formation: candSecForm,
    total_games: candGames,
    games: candGames,
    wins: candWins,
    draws: candDraws,
    losses: candLosses,
    win_pct: candWinPct,
    ppg: candPpg,
    gf_pg: candGf,
    ga_pg: candGa,
    cs_pct: candCs,
    trophies: candTrophies,
    annual_wage_eur: candWage,
    buyout_clause_eur: candBuyout,
    agent: candAgent,
    contract_status: candContract,
    image_url: candImg,
    radar_percentiles: candPcts,
    composite_match_score: compositeScore,
    tactical_similarity_score: Math.round(tacticalSim),
    formation_compatibility_score: Math.round(formationComp),
    financial_feasibility_score: Math.round(finFeas),
    growth_potential_score: Math.round(growthScore),
    savings_eur: savingsEur,
    savings_pct: savingsPct
  };
}

// Render Coach Replacement Recommendations
function renderCoachRecommendations() {
  const grid = document.getElementById('recCardsGrid');
  if (!grid || !engineData) return;
  grid.innerHTML = '';

  const activeStar = getActiveCoachData();
  if (!activeStar) return;

  // Retrieve base candidate list
  let baseCandidates = [];
  if (!activeBenchmarkCoach && engineData.coach_departures && engineData.coach_departures[currentCoachDepartureIndex]) {
    baseCandidates = (engineData.coach_departures[currentCoachDepartureIndex].recommendations || []).map(c => scoreCoachAgainstStar(c, activeStar));
  } else {
    const pool = engineData.coach_pool || [];
    baseCandidates = pool.filter(p => p.name.toLowerCase() !== activeStar.name.toLowerCase()).map(p => scoreCoachAgainstStar(p, activeStar));
  }

  // Prepend custom pinned coach candidates
  customPinnedCoachCandidates.forEach(pinned => {
    if (!baseCandidates.some(c => c.name.toLowerCase() === pinned.name.toLowerCase())) {
      baseCandidates.unshift(pinned);
    }
  });

  // Apply filters
  const starWage = activeStar.annual_wage_eur || 10_000_000;
  const maxWageAllowed = starWage * filterBudgetRatio * 1.35; // allow margin

  let filtered = baseCandidates.filter(c => {
    if (c.is_custom_pinned) return true;
    const passesBudget = (c.annual_wage_eur || 0) <= maxWageAllowed;
    const passesAge = c.age <= filterMaxAge;
    const passesScore = c.composite_match_score >= filterMinScore;
    return passesBudget && passesAge && passesScore;
  });

  if (!filtered.length) {
    filtered = baseCandidates.slice(0, 3);
  }

  // Sort by composite match score descending (pinned first)
  filtered.sort((a, b) => {
    if (a.is_custom_pinned && !b.is_custom_pinned) return -1;
    if (!a.is_custom_pinned && b.is_custom_pinned) return 1;
    return b.composite_match_score - a.composite_match_score;
  });

  const countBadge = document.getElementById('filteredCandidatesCount');
  if (countBadge) {
    countBadge.textContent = `${filtered.length} Managers Qualified`;
  }

  const sectionLabel = document.getElementById('recsSectionLabel');
  if (sectionLabel) {
    sectionLabel.textContent = '👔 Recommended Drop-In Manager Replacements';
  }

  if (!currentCoachCandidate || !filtered.some(c => c.name === currentCoachCandidate.name)) {
    currentCoachCandidate = filtered[0] || null;
  }

  filtered.forEach((cand, idx) => {
    const isSelected = currentCoachCandidate && currentCoachCandidate.name === cand.name;
    const candImg = cand.image_url || '';
    const candInitials = getInitials(cand.name);
    const wageSavings = (activeStar.annual_wage_eur || 10_000_000) - (cand.annual_wage_eur || 5_000_000);

    const card = document.createElement('div');
    card.className = `candidate-card ${isSelected ? 'active-compare' : ''}`;
    card.id = `cand-card-coach-${idx}`;
    card.innerHTML = `
      <div class="cand-top-row">
        <span class="cand-score-pill">
          ⚡ ${cand.composite_match_score}% Match
        </span>
        <span class="cand-tier-badge">${getMatchTierBadge(cand.composite_match_score)}</span>
      </div>

      <div class="cand-body">
        <div class="cand-profile-row">
          <div class="cand-avatar-wrap">
            ${candImg ? `<img src="${candImg}" class="cand-photo-avatar" alt="${cand.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />` : ''}
            <div class="cand-avatar" style="${candImg ? 'display: none;' : ''}">${candInitials}</div>
          </div>
          <div>
            <div class="cand-name">${cand.name}</div>
            <div class="cand-club">${cand.current_club || cand.club} • Age ${cand.age} • ${cand.nat || ''}</div>
            <div class="cand-role">${cand.tactical_archetype || 'Tactician'} • <strong>${cand.top_formation}</strong></div>
          </div>
        </div>

        <div class="cand-stats-grid">
          <div class="cand-stat-box">
            <div class="val">${cand.ppg.toFixed(2)}</div>
            <div class="lbl">PPG</div>
          </div>
          <div class="cand-stat-box">
            <div class="val">${cand.win_pct.toFixed(1)}%</div>
            <div class="lbl">Win %</div>
          </div>
          <div class="cand-stat-box">
            <div class="val">${cand.gf_pg.toFixed(2)}</div>
            <div class="lbl">GF / Game</div>
          </div>
        </div>

        <!-- Manager Dossier: Agent, Contract, Buyout, Silverware -->
        <div class="cand-meta-row">
          <div class="cand-meta-item">
            <span class="cand-meta-lbl">👔 Agency</span>
            <span class="cand-meta-val" title="${cand.agent || 'Independent Agency'}">${cand.agent || 'Independent Agency'}</span>
          </div>
          <div class="cand-meta-item">
            <span class="cand-meta-lbl">📄 Contract</span>
            <span class="cand-meta-val" style="color: ${cand.contract_status && cand.contract_status.includes('Expiry') ? '#fbbf24' : 'var(--text-secondary)'};">${cand.contract_status || 'Active Contract'}</span>
          </div>
          <div class="cand-meta-item">
            <span class="cand-meta-lbl">💰 Wage / Buyout</span>
            <span class="cand-meta-val" style="color: var(--accent-cyan); font-family: var(--font-mono);">${formatCurrency(cand.annual_wage_eur)}/yr • Buyout: ${formatCurrency(cand.buyout_clause_eur)}</span>
          </div>
          <div class="cand-meta-item">
            <span class="cand-meta-lbl">🏆 Honors</span>
            <span class="cand-meta-val">${cand.trophies || 0} Major Titles • ${cand.total_games} Matches</span>
          </div>
        </div>

        <div class="arbitrage-banner">
          <div>
            <span>Annual Wage: ${formatCurrency(cand.annual_wage_eur)}/yr</span>
            ${wageSavings > 0 ? `<span style="color: #6ee7b7; margin-left: 0.35rem;">(Saves ${formatCurrency(wageSavings)}/yr)</span>` : `<span style="color: #f87171; margin-left: 0.35rem;">(+${formatCurrency(Math.abs(wageSavings))}/yr)</span>`}
          </div>
          <div style="font-size: 0.74rem;">
            <span>Buyout: ${formatCurrency(cand.buyout_clause_eur)}</span>
            <span style="color: var(--accent-purple); margin-left: 0.3rem;">• ${cand.formation_compatibility_score}% Shape Fit</span>
          </div>
        </div>
      </div>

      <button class="card-action-btn" id="btn-select-coach-${idx}">
        <span>${isSelected ? '✓ Viewing in Radar' : 'Compare in Radar'}</span> ➔
      </button>
    `;

    card.addEventListener('click', (e) => {
      e.stopPropagation();
      selectCoachCandidateForRadar(cand);
    });

    grid.appendChild(card);
  });

  drawRadarChart();
  renderCoachComparisonTable();
  drawScatterPlot(filtered, activeStar);
}

function selectCoachCandidateForRadar(cand) {
  currentCoachCandidate = cand;
  document.querySelectorAll('.candidate-card').forEach(c => {
    c.classList.remove('active-compare');
    const btnSpan = c.querySelector('.card-action-btn span');
    if (btnSpan) btnSpan.textContent = 'Compare in Radar';
  });

  const cards = document.querySelectorAll('.candidate-card');
  cards.forEach(c => {
    const nameEl = c.querySelector('.cand-name');
    if (nameEl && nameEl.textContent === cand.name) {
      c.classList.add('active-compare');
      const btnSpan = c.querySelector('.card-action-btn span');
      if (btnSpan) btnSpan.textContent = '✓ Viewing in Radar';
    }
  });

  drawRadarChart();
  renderCoachComparisonTable();

  const activeStar = getActiveCoachData();
  if (activeStar) {
    const pool = engineData.coach_pool || [];
    const baseList = pool.filter(p => p.name !== activeStar.name).map(p => scoreCoachAgainstStar(p, activeStar));
    drawScatterPlot(baseList, activeStar);
  }
}

// Render Comparison Table for Managers with Strict 4-Step Framework
function renderCoachComparisonTable() {
  const activeStar = getActiveCoachData();
  const cand = currentCoachCandidate;
  if (!activeStar) return;

  const thStar = document.getElementById('thStarName');
  const thCand = document.getElementById('thCandName');
  const legStar = document.getElementById('legendStarName');
  const legCand = document.getElementById('legendCandName');

  if (thStar) thStar.textContent = activeStar.name;
  if (thCand) thCand.textContent = cand ? cand.name : 'Candidate';
  if (legStar) legStar.textContent = activeStar.name;
  if (legCand) legCand.textContent = cand ? cand.name : 'Candidate';

  // Faceoff Banner
  const faceoffStarImg = document.getElementById('faceoffStarImg');
  const faceoffStarInitials = document.getElementById('faceoffStarInitials');
  const faceoffStarName = document.getElementById('faceoffStarName');
  const faceoffStarClub = document.getElementById('faceoffStarClub');

  if (faceoffStarName) faceoffStarName.textContent = activeStar.name;
  if (faceoffStarClub) faceoffStarClub.textContent = `${activeStar.club} • ${activeStar.top_formation}`;
  if (faceoffStarImg && faceoffStarInitials) {
    if (activeStar.image_url) {
      faceoffStarImg.src = activeStar.image_url;
      faceoffStarImg.style.display = 'block';
      faceoffStarInitials.style.display = 'none';
    } else {
      faceoffStarImg.style.display = 'none';
      faceoffStarInitials.style.display = 'flex';
      faceoffStarInitials.textContent = getInitials(activeStar.name);
    }
  }

  const faceoffCandImg = document.getElementById('faceoffCandImg');
  const faceoffCandInitials = document.getElementById('faceoffCandInitials');
  const faceoffCandName = document.getElementById('faceoffCandName');
  const faceoffCandClub = document.getElementById('faceoffCandClub');
  const faceoffMatchScore = document.getElementById('faceoffMatchScore');

  if (cand) {
    if (faceoffCandName) faceoffCandName.textContent = cand.name;
    if (faceoffCandClub) faceoffCandClub.textContent = `${cand.current_club || cand.club} • ${cand.top_formation}`;
    if (faceoffMatchScore) faceoffMatchScore.textContent = `${cand.composite_match_score}% Match`;
    if (faceoffCandImg && faceoffCandInitials) {
      if (cand.image_url) {
        faceoffCandImg.src = cand.image_url;
        faceoffCandImg.style.display = 'block';
        faceoffCandInitials.style.display = 'none';
      } else {
        faceoffCandImg.style.display = 'none';
        faceoffCandInitials.style.display = 'flex';
        faceoffCandInitials.textContent = getInitials(cand.name);
      }
    }
  } else {
    if (faceoffCandName) faceoffCandName.textContent = 'None Selected';
    if (faceoffCandClub) faceoffCandClub.textContent = 'Awaiting Filter Selection';
    if (faceoffMatchScore) faceoffMatchScore.textContent = '--%';
    if (faceoffCandImg) faceoffCandImg.style.display = 'none';
    if (faceoffCandInitials) {
      faceoffCandInitials.style.display = 'flex';
      faceoffCandInitials.textContent = '??';
    }
  }

  const tbody = document.getElementById('compTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!cand) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
          No manager candidate selected. Adjust filters above to inspect candidates.
        </td>
      </tr>
    `;
    return;
  }

  // STEP 1: PHILOSOPHY & IDENTITY
  const step1Hdr = document.createElement('tr');
  step1Hdr.className = 'comp-step-row comp-step-1-hdr';
  step1Hdr.innerHTML = `
    <td colspan="4">
      <div class="step-header-cell">
        <span class="step-hdr-badge badge-step-1">STEP 01</span>
        <span class="step-hdr-title">IDENTIFY THE DEPARTING MANAGER'S PHILOSOPHY & SYSTEM</span>
        <span class="step-hdr-sub">Primary formation, tactical blueprint, pressing identity & possession structure</span>
      </div>
    </td>
  `;
  tbody.appendChild(step1Hdr);

  const formFitClass = cand.top_formation === activeStar.top_formation ? 'delta-positive' : 'delta-neutral';
  const step1Rows = [
    {
      metric: '📐 Primary Formation & Structure',
      starVal: `<strong>${activeStar.top_formation}</strong>`,
      candVal: `<strong>${cand.top_formation}</strong>`,
      delta: `<span class="${formFitClass}">${cand.top_formation === activeStar.top_formation ? '✓ Identical Shape' : 'Compatible Shape'}</span>`
    },
    {
      metric: '🧠 Tactical Philosophy & Blueprint',
      starVal: activeStar.tactical_archetype,
      candVal: cand.tactical_archetype,
      delta: cand.tactical_archetype === activeStar.tactical_archetype ? '<span class="delta-positive">✓ Identical Philosophy</span>' : '<span class="delta-neutral">System Aligned</span>'
    },
    {
      metric: '⚡ Pressing Intensity & Defensive Block',
      starVal: 'High-Press Rest-Defense / Gegenpressing',
      candVal: cand.tactical_archetype.includes('Press') ? 'High-Intensity Press / Counter-Press' : 'Mid-Block Compact Organization',
      delta: '<span class="delta-positive">Press Trap Capable</span>'
    },
    {
      metric: '🔄 Tactical System Fluidity',
      starVal: `${activeStar.secondary_formation} Secondary Option`,
      candVal: `${cand.secondary_formation} Secondary Option`,
      delta: '<span class="delta-neutral">System Adaptable</span>'
    },
    {
      metric: '🌱 Squad Rotation & Youth Pathway',
      starVal: 'Balanced Senior Squad & Academy Flow',
      candVal: cand.age < 50 ? 'High Youth Integration & Development' : 'Proven Senior Title Management',
      delta: '<span class="delta-positive">Development Asset</span>'
    }
  ];

  step1Rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${r.metric}</strong></td>
      <td class="star-col">${r.starVal}</td>
      <td class="cand-col">${r.candVal}</td>
      <td style="font-family: var(--font-mono); font-size: 0.82rem;">${r.delta}</td>
    `;
    tbody.appendChild(tr);
  });

  // STEP 2: CAREER PERFORMANCE & TRACK RECORD
  const step2Hdr = document.createElement('tr');
  step2Hdr.className = 'comp-step-row comp-step-2-hdr';
  step2Hdr.innerHTML = `
    <td colspan="4">
      <div class="step-header-cell">
        <span class="step-hdr-badge badge-step-2">STEP 02</span>
        <span class="step-hdr-title">COLLECT MANAGERIAL PERFORMANCE & TRACK RECORD</span>
        <span class="step-hdr-sub">Career matches managed, win rate, total points, trophy count & durability</span>
      </div>
    </td>
  `;
  tbody.appendChild(step2Hdr);

  const starGames = activeStar.total_games;
  const candGames = cand.total_games;
  const gamesDelta = candGames - starGames;

  const starWinPct = activeStar.win_pct;
  const candWinPct = cand.win_pct;
  const winPctDelta = candWinPct - starWinPct;

  const starPpg = activeStar.ppg;
  const candPpg = cand.ppg;
  const ppgDelta = candPpg - starPpg;

  const starTrophies = activeStar.trophies || 0;
  const candTrophies = cand.trophies || 0;
  const trophyDelta = candTrophies - starTrophies;

  const step2Rows = [
    {
      metric: '🏟️ Career Matches Managed',
      starVal: `${starGames} Matches`,
      candVal: `${candGames} Matches`,
      delta: gamesDelta >= 0 ? `<span class="delta-positive">+${gamesDelta} Matches</span>` : `<span class="delta-neutral">${gamesDelta} Matches</span>`
    },
    {
      metric: '📊 Win / Draw / Loss Record',
      starVal: `${activeStar.wins}W / ${activeStar.draws}D / ${activeStar.losses}L`,
      candVal: `${cand.wins}W / ${cand.draws}D / ${cand.losses}L`,
      delta: `<span class="delta-neutral">${cand.win_pct.toFixed(1)}% vs ${activeStar.win_pct.toFixed(1)}%</span>`
    },
    {
      metric: '🏆 Major Titles & Trophies Won',
      starVal: `<strong>${starTrophies} Major Honors</strong>`,
      candVal: `<strong>${candTrophies} Major Honors</strong>`,
      delta: trophyDelta >= 0 ? `<span class="delta-positive">+${trophyDelta} Silverware</span>` : `<span class="delta-neutral">${trophyDelta} Delta</span>`
    },
    {
      metric: '📈 Points Per Game (PPG)',
      starVal: `${starPpg.toFixed(2)} PPG`,
      candVal: `${candPpg.toFixed(2)} PPG`,
      delta: ppgDelta >= 0 ? `<span class="delta-positive">+${ppgDelta.toFixed(2)} PPG</span>` : `<span class="delta-negative">${ppgDelta.toFixed(2)} PPG</span>`
    },
    {
      metric: '🎯 Career Win Percentage (%)',
      starVal: `${starWinPct.toFixed(1)}%`,
      candVal: `${candWinPct.toFixed(1)}%`,
      delta: winPctDelta >= 0 ? `<span class="delta-positive">+${winPctDelta.toFixed(1)}%</span>` : `<span class="delta-negative">${winPctDelta.toFixed(1)}%</span>`
    }
  ];

  step2Rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${r.metric}</strong></td>
      <td class="star-col">${r.starVal}</td>
      <td class="cand-col">${r.candVal}</td>
      <td style="font-family: var(--font-mono); font-size: 0.82rem;">${r.delta}</td>
    `;
    tbody.appendChild(tr);
  });

  // STEP 3: COMPARE LIKE-FOR-LIKE EFFICIENCY & EMPIRICAL PERCENTILES
  const step3Hdr = document.createElement('tr');
  step3Hdr.className = 'comp-step-row comp-step-3-hdr';
  step3Hdr.innerHTML = `
    <td colspan="4">
      <div class="step-header-cell">
        <span class="step-hdr-badge badge-step-3">STEP 03</span>
        <span class="step-hdr-title">COMPARE LIKE-FOR-LIKE EFFICIENCY & EMPIRICAL PERCENTILES</span>
        <span class="step-hdr-sub">Per-match efficiency rates & 0-99th percentile rankings across 1,200+ qualified European managers</span>
      </div>
    </td>
  `;
  tbody.appendChild(step3Hdr);

  const starPcts = activeStar.radar_percentiles || {};
  const candPcts = cand.radar_percentiles || {};

  const step3Metrics = [
    { key: 'ppg_win_efficiency', label: 'Points Per Game (PPG)', starRaw: `${activeStar.ppg.toFixed(2)} PPG`, candRaw: `${cand.ppg.toFixed(2)} PPG` },
    { key: 'attacking_output', label: 'Goals Scored / Match (GF/G)', starRaw: `${activeStar.gf_pg.toFixed(2)} GF/G`, candRaw: `${cand.gf_pg.toFixed(2)} GF/G` },
    { key: 'defensive_solidity', label: 'Defensive Control & Low GA/G', starRaw: `${activeStar.ga_pg.toFixed(2)} GA/G (${activeStar.cs_pct.toFixed(1)}% CS)`, candRaw: `${cand.ga_pg.toFixed(2)} GA/G (${cand.cs_pct.toFixed(1)}% CS)` },
    { key: 'formation_flexibility', label: 'Formation Adaptability Score', starRaw: 'High Shape Fluidity', candRaw: 'System Consistent' },
    { key: 'pressing_intensity', label: 'High-Press Turnover Index', starRaw: 'Elite System Trap', candRaw: 'Aggressive Gegenpress' },
    { key: 'durability_longevity', label: 'Tenure Durability & Longevity', starRaw: `${activeStar.total_games} Matches`, candRaw: `${cand.total_games} Matches` }
  ];

  step3Metrics.forEach(m => {
    const starP = starPcts[m.key] !== undefined ? starPcts[m.key] : 80;
    const candP = candPcts[m.key] !== undefined ? candPcts[m.key] : 75;
    const pDiff = candP - starP;
    const deltaClass = pDiff >= 0 ? 'delta-positive' : (pDiff >= -8 ? 'delta-neutral' : 'delta-negative');
    const deltaStr = pDiff >= 0 ? `+${pDiff}%ile` : `${pDiff}%ile`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <strong>${m.label}</strong>
      </td>
      <td class="star-col">
        <div class="table-stat-val">${m.starRaw}</div>
        <div class="pct-bar-wrap">
          <div class="pct-bar-fill ${getPercentileClass(starP)}" style="width: ${starP}%;"></div>
          <span class="pct-bar-label">${starP}th %ile</span>
        </div>
      </td>
      <td class="cand-col">
        <div class="table-stat-val">${m.candRaw}</div>
        <div class="pct-bar-wrap">
          <div class="pct-bar-fill ${getPercentileClass(candP)}" style="width: ${candP}%;"></div>
          <span class="pct-bar-label">${candP}th %ile</span>
        </div>
      </td>
      <td style="font-family: var(--font-mono); font-size: 0.82rem;">
        <span class="${deltaClass}">${deltaStr}</span>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // STEP 4: RANK POTENTIAL MANAGERS & CONTRACT DOSSIER
  const step4Hdr = document.createElement('tr');
  step4Hdr.className = 'comp-step-row comp-step-4-hdr';
  step4Hdr.innerHTML = `
    <td colspan="4">
      <div class="step-header-cell">
        <span class="step-hdr-badge badge-step-4">STEP 04</span>
        <span class="step-hdr-title">RANK POTENTIAL MANAGERS & CONTRACT DOSSIER</span>
        <span class="step-hdr-sub">Multi-factor weighted compatibility, wage arbitrage, buyout release & agency pipeline</span>
      </div>
    </td>
  `;
  tbody.appendChild(step4Hdr);

  const wageSavings = activeStar.annual_wage_eur - cand.annual_wage_eur;
  const ageDiff = activeStar.age - cand.age;

  const step4Rows = [
    {
      metric: '🎯 Composite Managerial Match Score',
      starVal: '<span style="font-family: var(--font-mono); font-weight: 800; color: var(--accent-cyan);">100.0% (Benchmark)</span>',
      candVal: `<span class="score-highlight">${cand.composite_match_score}% Match</span>`,
      delta: `<span class="delta-positive">${getMatchTierBadge(cand.composite_match_score)}</span>`
    },
    {
      metric: '⚡ Tactical System Fit (40% Weight)',
      starVal: '100.0%',
      candVal: `${cand.tactical_similarity_score}%`,
      delta: cand.tactical_similarity_score >= 85 ? '<span class="delta-positive">✓ Elite System Alignment</span>' : '<span class="delta-neutral">High System Affinity</span>'
    },
    {
      metric: '📐 Formation Compatibility (25% Weight)',
      starVal: '100.0%',
      candVal: `${cand.formation_compatibility_score}%`,
      delta: cand.formation_compatibility_score >= 90 ? '<span class="delta-positive">✓ Direct System Mirror</span>' : '<span class="delta-neutral">Compatible Transition</span>'
    },
    {
      metric: '💰 Financial & Wage Feasibility (20% Weight)',
      starVal: 'Reference Wage',
      candVal: `${cand.financial_feasibility_score}%`,
      delta: cand.financial_feasibility_score >= 85 ? '<span class="delta-positive">✓ Highly Feasible Payroll</span>' : '<span class="delta-neutral">Manageable Window</span>'
    },
    {
      metric: '🚀 Age Runway & Longevity (15% Weight)',
      starVal: `${activeStar.age} yrs old`,
      candVal: `${cand.age} yrs old (${cand.growth_potential_score}% Runway)`,
      delta: ageDiff > 0 ? `<span class="delta-positive">+${ageDiff} yrs Career Runway</span>` : `<span class="delta-neutral">${Math.abs(ageDiff)} yrs older</span>`
    },
    {
      metric: '💼 Annual Wage & Payroll Arbitrage',
      starVal: `${formatCurrency(activeStar.annual_wage_eur)} / yr`,
      candVal: `${formatCurrency(cand.annual_wage_eur)} / yr`,
      delta: wageSavings >= 0 ? `<span class="delta-positive">+${formatCurrency(wageSavings)}/yr Payroll Relief</span>` : `<span class="delta-negative">-${formatCurrency(Math.abs(wageSavings))}/yr Delta</span>`
    },
    {
      metric: '🔓 Contract Buyout / Release Clause',
      starVal: activeStar.buyout_clause_eur ? formatCurrency(activeStar.buyout_clause_eur) : 'N/A',
      candVal: formatCurrency(cand.buyout_clause_eur),
      delta: `<span class="delta-neutral">Estimated Compensation Fee</span>`
    },
    {
      metric: '👔 Representation / Management Agency',
      starVal: activeStar.agent || 'Direct / Agency',
      candVal: cand.agent || 'Independent Agency',
      delta: activeStar.agent === cand.agent ? '<span class="delta-positive">✓ Shared Agency Pipeline</span>' : '<span class="delta-neutral">Independent Pipeline</span>'
    },
    {
      metric: '📄 Contract Status & Expiration',
      starVal: activeStar.contract_status || 'Tenure Concluded',
      candVal: cand.contract_status || 'Active Contract',
      delta: '<span class="delta-neutral">Approachable Window</span>'
    },
    {
      metric: '⏳ Sporting Succession Recommendation',
      starVal: 'Managerial Void Benchmark',
      candVal: cand.composite_match_score >= 88 ? 'Immediate Priority Target' : 'Secondary Contingency Target',
      delta: '<span class="delta-positive">Actionable Succession Profile</span>'
    }
  ];

  step4Rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${r.metric}</strong></td>
      <td class="star-col">${r.starVal}</td>
      <td class="cand-col">${r.candVal}</td>
      <td style="font-family: var(--font-mono); font-size: 0.82rem;">${r.delta}</td>
    `;
    tbody.appendChild(tr);
  });
}

function selectCandidateForRadar(cand) {
  currentCandidate = cand;
  document.querySelectorAll('.candidate-card').forEach(c => {
    c.classList.remove('active-compare');
    const btnSpan = c.querySelector('.card-action-btn span');
    if (btnSpan) btnSpan.textContent = 'Compare in Radar';
  });

  const el = document.getElementById(`cand-card-${cand.player_id}`);
  if (el) {
    el.classList.add('active-compare');
    const btnSpan = el.querySelector('.card-action-btn span');
    if (btnSpan) btnSpan.textContent = '✓ Viewing in Radar';
  }

  drawRadarChart();
  renderComparisonTable();

  const activeStar = getActiveStarData();
  if (activeStar) {
    // Redraw scatter plot to highlight selected candidate
    const pool = engineData.player_pool || [];
    const baseList = pool.filter(p => p.id !== activeStar.player_id).map(p => scoreCandidateAgainstStar(p, activeStar));
    drawScatterPlot(baseList, activeStar);
  }
}

function getInternationalStatus(caps) {
  if (caps >= 40) return 'Elite Senior Int\'l';
  if (caps >= 20) return 'Established Senior Int\'l';
  if (caps >= 8) return 'Regular Senior Squad';
  if (caps > 0) return 'Fringe Senior / Youth Cap';
  return 'Uncapped / Domestic Star';
}

function getMatchTierBadge(score) {
  if (score >= 90) return 'Tier 1 Priority Target';
  if (score >= 80) return 'Tier 2 Strong Alternative';
  if (score >= 70) return 'Tier 3 Viable Contingency';
  return 'Tier 4 Long-Range Prospect';
}

// Render Comparison Table with Strict 4-Step Framework Sequence & Full National Stats
function renderComparisonTable() {
  const activeStar = getActiveStarData();
  const cand = currentCandidate;
  if (!activeStar) return;

  const thStar = document.getElementById('thStarName');
  const thCand = document.getElementById('thCandName');
  const legStar = document.getElementById('legendStarName');
  const legCand = document.getElementById('legendCandName');

  if (thStar) thStar.textContent = activeStar.name;
  if (thCand) thCand.textContent = cand ? cand.name : 'Candidate';
  if (legStar) legStar.textContent = activeStar.name;
  if (legCand) legCand.textContent = cand ? cand.name : 'Candidate';

  // Update Face-off Banner
  const faceoffStarImg = document.getElementById('faceoffStarImg');
  const faceoffStarInitials = document.getElementById('faceoffStarInitials');
  const faceoffStarName = document.getElementById('faceoffStarName');
  const faceoffStarClub = document.getElementById('faceoffStarClub');

  if (faceoffStarName) faceoffStarName.textContent = activeStar.name;
  if (faceoffStarClub) faceoffStarClub.textContent = `${activeStar.club} • ${activeStar.sub_pos || activeStar.pos || ''}`;
  if (faceoffStarImg && faceoffStarInitials) {
    if (activeStar.image_url) {
      faceoffStarImg.src = activeStar.image_url;
      faceoffStarImg.style.display = 'block';
      faceoffStarInitials.style.display = 'none';
    } else {
      faceoffStarImg.style.display = 'none';
      faceoffStarInitials.style.display = 'flex';
      faceoffStarInitials.textContent = getInitials(activeStar.name);
    }
  }

  const faceoffCandImg = document.getElementById('faceoffCandImg');
  const faceoffCandInitials = document.getElementById('faceoffCandInitials');
  const faceoffCandName = document.getElementById('faceoffCandName');
  const faceoffCandClub = document.getElementById('faceoffCandClub');
  const faceoffMatchScore = document.getElementById('faceoffMatchScore');

  if (cand) {
    if (faceoffCandName) faceoffCandName.textContent = cand.name;
    if (faceoffCandClub) faceoffCandClub.textContent = `${cand.current_club_name} • ${cand.sub_position || cand.position}`;
    if (faceoffMatchScore) faceoffMatchScore.textContent = `${cand.composite_match_score}% Match`;
    if (faceoffCandImg && faceoffCandInitials) {
      if (cand.image_url) {
        faceoffCandImg.src = cand.image_url;
        faceoffCandImg.style.display = 'block';
        faceoffCandInitials.style.display = 'none';
      } else {
        faceoffCandImg.style.display = 'none';
        faceoffCandInitials.style.display = 'flex';
        faceoffCandInitials.textContent = getInitials(cand.name);
      }
    }
  } else {
    if (faceoffCandName) faceoffCandName.textContent = 'None Selected';
    if (faceoffCandClub) faceoffCandClub.textContent = 'Awaiting Filter Selection';
    if (faceoffMatchScore) faceoffMatchScore.textContent = '--%';
    if (faceoffCandImg) faceoffCandImg.style.display = 'none';
    if (faceoffCandInitials) {
      faceoffCandInitials.style.display = 'flex';
      faceoffCandInitials.textContent = '??';
    }
  }

  const tbody = document.getElementById('compTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!cand) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
          No candidate selected. Adjust filters above to inspect candidates.
        </td>
      </tr>
    `;
    return;
  }

  // Common Star Properties
  const starApps = activeStar.total_appearances || 0;
  const starMins = activeStar.total_minutes || 0;
  const starMinApp = activeStar.min_app || (starApps > 0 ? starMins / starApps : 75);
  const starGoals = activeStar.total_goals !== undefined ? activeStar.total_goals : Math.round((activeStar.goals_per_90 || 0) * starMins / 90);
  const starAssists = activeStar.total_assists !== undefined ? activeStar.total_assists : Math.round((activeStar.assists_per_90 || 0) * starMins / 90);
  const starGA = starGoals + starAssists;
  const starYellows = activeStar.total_yellows || 0;
  const starReds = activeStar.total_reds || 0;
  const starNat = activeStar.country_of_citizenship || 'Unknown';
  const starCaps = activeStar.international_caps || 0;
  const starIntGoals = activeStar.international_goals || 0;
  const starHeight = activeStar.height || activeStar.height_in_cm || 180;
  const starFee = activeStar.fee || 50_000_000;
  const starWkWage = activeStar.wage_weekly_eur || 150000;
  const starYrWage = activeStar.wage_annual_eur || (starWkWage * 52);
  const starSeasonApps = activeStar.season_appearances || 0;
  const starSeasonMins = activeStar.season_minutes || 0;
  const starSeasonGoals = activeStar.season_goals || 0;
  const starSeasonAssists = activeStar.season_assists || 0;
  const starSeasonGA = starSeasonGoals + starSeasonAssists;

  // Common Candidate Properties
  const candApps = cand.total_appearances !== undefined ? cand.total_appearances : (cand.apps || 0);
  const candMins = cand.total_minutes !== undefined ? cand.total_minutes : (cand.mins || 0);
  const candMinApp = cand.minutes_per_app !== undefined ? cand.minutes_per_app : (cand.min_app || (candApps > 0 ? candMins / candApps : 70));
  const candGoals = cand.total_goals !== undefined ? cand.total_goals : (cand.goals !== undefined ? cand.goals : Math.round((cand.goals_per_90 || 0) * candMins / 90));
  const candAssists = cand.total_assists !== undefined ? cand.total_assists : (cand.assists !== undefined ? cand.assists : Math.round((cand.assists_per_90 || 0) * candMins / 90));
  const candGA = candGoals + candAssists;
  const candYellows = cand.total_yellows !== undefined ? cand.total_yellows : (cand.yellows || 0);
  const candReds = cand.total_reds !== undefined ? cand.total_reds : (cand.reds || 0);
  const candSeasonApps = cand.season_appearances !== undefined ? cand.season_appearances : (cand.s_apps || 0);
  const candSeasonMins = cand.season_minutes !== undefined ? cand.season_minutes : (cand.s_mins || 0);
  const candSeasonGoals = cand.season_goals !== undefined ? cand.season_goals : (cand.s_goals || 0);
  const candSeasonAssists = cand.season_assists !== undefined ? cand.season_assists : (cand.s_assists || 0);
  const candSeasonGA = candSeasonGoals + candSeasonAssists;
  const candNat = cand.country_of_citizenship || cand.nat || 'Unknown';
  const candCaps = cand.international_caps !== undefined ? cand.international_caps : (cand.caps || 0);
  const candIntGoals = cand.international_goals !== undefined ? cand.international_goals : (cand.int_goals || 0);
  const candHeight = cand.height_in_cm || cand.height || 180;
  const candVal = cand.market_value_in_eur !== undefined ? cand.market_value_in_eur : (cand.val || 0);
  const candSavingsEur = cand.savings_eur !== undefined ? cand.savings_eur : Math.max(0, starFee - candVal);
  const candSavingsPct = cand.savings_pct !== undefined ? cand.savings_pct : (starFee > 0 ? Math.round((candSavingsEur / starFee) * 1000) / 10 : 0);
  const candWkWage = cand.wage_weekly_eur || cand.wage_wk || 25000;
  const candYrWage = cand.wage_annual_eur || cand.wage_yr || (candWkWage * 52);

  // Deltas
  const heightDiff = candHeight - starHeight;
  const goalsDelta = candGoals - starGoals;
  const assistsDelta = candAssists - starAssists;
  const gaDelta = candGA - starGA;
  const capsDelta = candCaps - starCaps;
  const intGoalsDelta = candIntGoals - starIntGoals;
  const wkWageDelta = starWkWage - candWkWage;
  const yrWageDelta = starYrWage - candYrWage;
  const ageDiff = (activeStar.age || 26) - (cand.age || 22);

  // ==========================================================================
  // 🧭 STEP 1: IDENTIFY DEPARTING ROLE & TACTICAL ARCHETYPE
  // ==========================================================================
  const step1Hdr = document.createElement('tr');
  step1Hdr.className = 'comp-step-row comp-step-1-hdr';
  step1Hdr.innerHTML = `
    <td colspan="4">
      <div class="step-header-cell">
        <span class="step-hdr-badge badge-step-1">STEP 01</span>
        <span class="step-hdr-title">IDENTIFY DEPARTING PLAYER'S ROLE & TACTICAL ARCHETYPE</span>
        <span class="step-hdr-sub">Sub-role duties, preferred foot symmetry, formation fluidity & frame</span>
      </div>
    </td>
  `;
  tbody.appendChild(step1Hdr);

  const step1Rows = [
    {
      metric: 'Tactical Sub-Role Archetype',
      starVal: `<span class="archetype-tag tag-star">${activeStar.tactical_role || 'Talismanic Core'}</span>`,
      candVal: `<span class="archetype-tag tag-cand">${cand.tactical_role || 'Tactical Operator'}</span>`,
      delta: activeStar.tactical_role === cand.tactical_role ?
        '<span class="delta-positive">✓ Direct Archetype Match</span>' :
        '<span class="delta-subtle">Adjacent Archetype</span>'
    },
    {
      metric: 'Tactical Duties & Pitch Profile',
      starVal: `<div class="tact-duty-text">${activeStar.role_description || 'Central engine orchestrating progression and pressing phases.'}</div>`,
      candVal: `<div class="tact-duty-text">${cand.role_description || 'Counterpart replicating phase outputs with high tactical fluidity.'}</div>`,
      delta: '<span class="delta-neutral">Role Complementary</span>'
    },
    {
      metric: 'Preferred Foot & Tactical Symmetry',
      starVal: `<div class="foot-cell"><span class="foot-badge">${activeStar.foot || 'Right'} Foot</span><span class="foot-sub">${activeStar.foot_trait || ''}</span></div>`,
      candVal: `<div class="foot-cell"><span class="foot-badge">${cand.foot || 'Right'} Foot</span><span class="foot-sub">${cand.foot_trait || ''}</span></div>`,
      delta: (activeStar.foot && cand.foot && (activeStar.foot.toLowerCase() === cand.foot.toLowerCase() || cand.foot.toLowerCase() === 'both')) ?
        '<span class="delta-positive">✓ Footing Symmetry Match (+2.5)</span>' :
        '<span class="delta-subtle">Inverse / Cross-Flank</span>'
    },
    {
      metric: 'Primary System Formation',
      starVal: `${activeStar.formation || '4-3-3 Attacking'}`,
      candVal: `${cand.top_formation || '4-2-3-1'} <span class="pct-badge ${cand.formation_compatibility_score >= 90 ? 'pct-elite' : 'pct-good'}">${cand.formation_compatibility_score}% Fit</span>`,
      delta: (activeStar.formation && cand.top_formation && activeStar.formation.split(' ')[0] === cand.top_formation.split(' ')[0]) ?
        '<span class="delta-positive">✓ Direct System Base</span>' :
        '<span class="delta-neutral">System Adaptable</span>'
    },
    {
      metric: 'Physical Height & Frame',
      starVal: `${starHeight} cm`,
      candVal: `${candHeight} cm`,
      delta: `<span class="delta-neutral">${heightDiff >= 0 ? '+' : ''}${heightDiff} cm (${heightDiff >= 0 ? 'Taller Frame' : 'Compact Build'})</span>`
    }
  ];

  step1Rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${r.metric}</strong></td>
      <td class="star-col">${r.starVal}</td>
      <td class="cand-col">${r.candVal}</td>
      <td style="font-family: var(--font-mono); font-size: 0.82rem;">${r.delta}</td>
    `;
    tbody.appendChild(tr);
  });

  // ==========================================================================
  // 📊 STEP 2: PERFORMANCE DATA & STATS (INCLUDING NATIONAL TEAM)
  // ==========================================================================
  const step2Hdr = document.createElement('tr');
  step2Hdr.className = 'comp-step-row comp-step-2-hdr';
  step2Hdr.innerHTML = `
    <td colspan="4">
      <div class="step-header-cell">
        <span class="step-hdr-badge badge-step-2">STEP 02</span>
        <span class="step-hdr-title">COLLECT PERFORMANCE DATA & PLAYER MATCH STATS</span>
        <span class="step-hdr-sub">Appearances, minutes load, career output, discipline & senior national team</span>
      </div>
    </td>
  `;
  tbody.appendChild(step2Hdr);

  const step2Rows = [
    {
      metric: '🔥 2026/2027 Season Match Appearances',
      starVal: `<strong class="stat-highlight" style="color: var(--accent-amber);">${starSeasonApps}</strong> matches (26/27)`,
      candVal: `<strong class="stat-highlight" style="color: var(--accent-amber);">${candSeasonApps}</strong> matches (26/27)`,
      delta: `<span class="delta-neutral">${(candSeasonApps - starSeasonApps) >= 0 ? '+' : ''}${(candSeasonApps - starSeasonApps)} matches in 26/27</span>`
    },
    {
      metric: '⏱️ 2026/2027 Season Minutes On Pitch',
      starVal: `<strong class="stat-highlight" style="color: var(--accent-amber);">${starSeasonMins.toLocaleString()}</strong> mins (26/27)`,
      candVal: `<strong class="stat-highlight" style="color: var(--accent-amber);">${candSeasonMins.toLocaleString()}</strong> mins (26/27)`,
      delta: `<span class="delta-neutral">${(candSeasonMins - starSeasonMins) >= 0 ? '+' : ''}${(candSeasonMins - starSeasonMins).toLocaleString()} mins</span>`
    },
    {
      metric: '🎯 2026/2027 Season Output (Goals + Assists)',
      starVal: `<span class="ga-badge ga-star" style="background: rgba(245,158,11,0.18); border-color: rgba(245,158,11,0.4); color: #fbbf24;">${starSeasonGoals}G + ${starSeasonAssists}A (${starSeasonGA} G+A)</span>`,
      candVal: `<span class="ga-badge ga-cand" style="background: rgba(245,158,11,0.18); border-color: rgba(245,158,11,0.4); color: #fbbf24;">${candSeasonGoals}G + ${candSeasonAssists}A (${candSeasonGA} G+A)</span>`,
      delta: `<span class="${(candSeasonGA - starSeasonGA) >= 0 ? 'delta-positive' : 'delta-subtle'}">${(candSeasonGA - starSeasonGA) >= 0 ? '+' : ''}${(candSeasonGA - starSeasonGA)} G+A in 26/27</span>`
    },
    {
      metric: 'Total Career Matches / Appearances',
      starVal: `<strong class="stat-highlight">${starApps.toLocaleString()}</strong> matches`,
      candVal: `<strong class="stat-highlight">${candApps.toLocaleString()}</strong> matches`,
      delta: `<span class="delta-neutral">${(candApps - starApps) >= 0 ? '+' : ''}${(candApps - starApps).toLocaleString()} matches</span>`
    },
    {
      metric: 'Total Minutes Played',
      starVal: `<strong class="stat-highlight">${starMins.toLocaleString()}</strong> mins`,
      candVal: `<strong class="stat-highlight">${candMins.toLocaleString()}</strong> mins`,
      delta: `<span class="delta-neutral">${(candMins - starMins) >= 0 ? '+' : ''}${(candMins - starMins).toLocaleString()} mins</span>`
    },
    {
      metric: 'Minutes / Match Load & Durability',
      starVal: `${starMinApp.toFixed(1)} m / app`,
      candVal: `${candMinApp.toFixed(1)} m / app`,
      delta: candMinApp >= 75 ?
        '<span class="delta-positive">✓ High Starter Durability</span>' :
        '<span class="delta-subtle">Rotational Sample</span>'
    },
    {
      metric: 'Career Goals (All Competitions)',
      starVal: `<strong class="stat-highlight">${starGoals.toLocaleString()}</strong> goals`,
      candVal: `<strong class="stat-highlight">${candGoals.toLocaleString()}</strong> goals`,
      delta: `<span class="${goalsDelta >= 0 ? 'delta-positive' : 'delta-subtle'}">${goalsDelta >= 0 ? '+' : ''}${goalsDelta.toLocaleString()} goals</span>`
    },
    {
      metric: 'Career Assists (All Competitions)',
      starVal: `<strong class="stat-highlight">${starAssists.toLocaleString()}</strong> assists`,
      candVal: `<strong class="stat-highlight">${candAssists.toLocaleString()}</strong> assists`,
      delta: `<span class="${assistsDelta >= 0 ? 'delta-positive' : 'delta-subtle'}">${assistsDelta >= 0 ? '+' : ''}${assistsDelta.toLocaleString()} assists</span>`
    },
    {
      metric: 'Total Goal Contributions (G+A)',
      starVal: `<span class="ga-badge ga-star">${starGA.toLocaleString()} G+A</span>`,
      candVal: `<span class="ga-badge ga-cand">${candGA.toLocaleString()} G+A</span>`,
      delta: `<span class="${gaDelta >= 0 ? 'delta-positive' : 'delta-subtle'}">${gaDelta >= 0 ? '+' : ''}${gaDelta.toLocaleString()} G+A</span>`
    },
    {
      metric: 'Disciplinary Record (Cards)',
      starVal: `<span class="card-pill yellow-pill">🟨 ${starYellows}</span> <span class="card-pill red-pill">🟥 ${starReds}</span>`,
      candVal: `<span class="card-pill yellow-pill">🟨 ${candYellows}</span> <span class="card-pill red-pill">🟥 ${candReds}</span>`,
      delta: candReds === 0 ?
        '<span class="delta-positive">✓ Zero Red Cards</span>' :
        `<span class="delta-subtle">${candReds} Career Reds</span>`
    },
    {
      metric: '🌍 Senior National Team (Country)',
      starVal: `<span class="nat-team-badge">🏴 ${starNat}</span>`,
      candVal: `<span class="nat-team-badge">🏳️ ${candNat}</span>`,
      delta: starNat === candNat ?
        '<span class="delta-positive">✓ Same National Setup</span>' :
        '<span class="delta-neutral">International Pedigree</span>'
    },
    {
      metric: '🎖️ Senior International Caps',
      starVal: `<strong class="stat-highlight">${starCaps}</strong> Senior Caps`,
      candVal: `<strong class="stat-highlight">${candCaps}</strong> Senior Caps`,
      delta: `<span class="${capsDelta >= 0 ? 'delta-positive' : 'delta-subtle'}">${capsDelta >= 0 ? '+' : ''}${capsDelta} Caps</span>`
    },
    {
      metric: '⚽ Senior International Goals',
      starVal: `<strong class="stat-highlight">${starIntGoals}</strong> Int'l Goals`,
      candVal: `<strong class="stat-highlight">${candIntGoals}</strong> Int'l Goals`,
      delta: `<span class="${intGoalsDelta >= 0 ? 'delta-positive' : 'delta-subtle'}">${intGoalsDelta >= 0 ? '+' : ''}${intGoalsDelta} Goals</span>`
    },
    {
      metric: '🌐 Senior International Status',
      starVal: `<span class="intl-tier-badge tier-elite">${getInternationalStatus(starCaps)}</span>`,
      candVal: `<span class="intl-tier-badge ${candCaps >= 25 ? 'tier-elite' : (candCaps >= 8 ? 'tier-proven' : 'tier-dev')}">${getInternationalStatus(candCaps)}</span>`,
      delta: candCaps >= 12 ?
        '<span class="delta-positive">Proven Senior Int\'l</span>' :
        '<span class="delta-subtle">Emerging / Youth Talent</span>'
    }
  ];

  step2Rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${r.metric}</strong></td>
      <td class="star-col">${r.starVal}</td>
      <td class="cand-col">${r.candVal}</td>
      <td style="font-family: var(--font-mono); font-size: 0.82rem;">${r.delta}</td>
    `;
    tbody.appendChild(tr);
  });

  // ==========================================================================
  // ⚡ STEP 3: LIKE-FOR-LIKE PER-90 PERFORMANCE & PERCENTILES
  // ==========================================================================
  const posGrp = activeStar.pos_group || 'CM';
  const roleMetricsList = ROLE_METRICS_MAP[posGrp] || ROLE_METRICS_MAP['CM'];

  const step3Hdr = document.createElement('tr');
  step3Hdr.className = 'comp-step-row comp-step-3-hdr';
  step3Hdr.innerHTML = `
    <td colspan="4">
      <div class="step-header-cell">
        <span class="step-hdr-badge badge-step-3">STEP 03</span>
        <span class="step-hdr-title">COMPARE LIKE-FOR-LIKE PER-90 PERFORMANCE & PERCENTILES (${posGrp})</span>
        <span class="step-hdr-sub">Positional metrics mapped against empirical European percentiles (0-99th)</span>
      </div>
    </td>
  `;
  tbody.appendChild(step3Hdr);

  // Render each position metric with value and visual percentile bar
  roleMetricsList.forEach(m => {
    const key = m.key;
    const label = m.label;
    const unit = m.unit;

    const starPkg = (activeStar.role_metrics && activeStar.role_metrics[key]) || {};
    const candPkg = (cand.role_metrics && cand.role_metrics[key]) || {};

    const starVal = starPkg.value !== undefined ? starPkg.value : (activeStar[key] || 0);
    const starPct = starPkg.percentile !== undefined ? starPkg.percentile : (activeStar.role_percentiles && activeStar.role_percentiles[key] ? activeStar.role_percentiles[key] : 75);

    const candVal = candPkg.value !== undefined ? candPkg.value : (cand[key] || 0);
    const candPct = candPkg.percentile !== undefined ? candPkg.percentile : (cand.role_percentiles && cand.role_percentiles[key] ? cand.role_percentiles[key] : 70);

    const deltaNum = typeof candVal === 'number' && typeof starVal === 'number' ? (candVal - starVal).toFixed(2) : '--';
    const deltaPct = candPct - starPct;
    const deltaPctStr = deltaPct >= 0 ? `+${deltaPct}%ile` : `${deltaPct}%ile`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <strong style="color: #fff;">${label}</strong>
      </td>
      <td class="star-col">
        <div class="pct-cell-wrap">
          <span class="pct-val-num">${typeof starVal === 'number' ? starVal : starVal}${unit}</span>
          <div class="pct-bar-container">
            <div class="pct-bar-bg"><div class="pct-bar-fill pct-bar-star" style="width: ${starPct}%;"></div></div>
            <span class="pct-badge ${getPercentileClass(starPct)}">${starPct}th %ile</span>
          </div>
        </div>
      </td>
      <td class="cand-col">
        <div class="pct-cell-wrap">
          <span class="pct-val-num">${typeof candVal === 'number' ? candVal : candVal}${unit}</span>
          <div class="pct-bar-container">
            <div class="pct-bar-bg"><div class="pct-bar-fill pct-bar-cand" style="width: ${candPct}%;"></div></div>
            <span class="pct-badge ${getPercentileClass(candPct)}">${candPct}th %ile</span>
          </div>
        </div>
      </td>
      <td style="font-family: var(--font-mono); font-size: 0.85rem;">
        <span style="color: ${deltaNum >= 0 ? '#10b981' : '#f43f5e'}; font-weight: 700;">${deltaNum > 0 ? '+' : ''}${deltaNum}${unit}</span>
        <span style="color: var(--text-muted); margin-left: 0.35rem; font-size: 0.75rem;">(${deltaPctStr})</span>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // ==========================================================================
  // 🎯 STEP 4: RANK POTENTIAL REPLACEMENTS & ARBITRAGE DOSSIER
  // ==========================================================================
  const step4Hdr = document.createElement('tr');
  step4Hdr.className = 'comp-step-row comp-step-4-hdr';
  step4Hdr.innerHTML = `
    <td colspan="4">
      <div class="step-header-cell">
        <span class="step-hdr-badge badge-step-4">STEP 04</span>
        <span class="step-hdr-title">RANK POTENTIAL REPLACEMENTS & ARBITRAGE DOSSIER</span>
        <span class="step-hdr-sub">Multi-factor weighted scoring, valuation arbitrage, agency & payroll relief</span>
      </div>
    </td>
  `;
  tbody.appendChild(step4Hdr);

  const step4Rows = [
    {
      metric: '🎯 Composite Match Score',
      starVal: '<span style="font-family: var(--font-mono); font-weight: 800; color: var(--accent-cyan);">100.0% (Benchmark)</span>',
      candVal: `<span class="score-highlight">${cand.composite_match_score}% Match</span>`,
      delta: `<span class="delta-positive">${getMatchTierBadge(cand.composite_match_score)}</span>`
    },
    {
      metric: '⚡ Tactical Role Fit (42% Weight)',
      starVal: '100.0%',
      candVal: `${cand.tactical_similarity_score}%`,
      delta: cand.tactical_similarity_score >= 85 ?
        '<span class="delta-positive">✓ Elite Role Match</span>' :
        '<span class="delta-neutral">High Role Affinity</span>'
    },
    {
      metric: '📐 Formation Compatibility (20% Weight)',
      starVal: '100.0%',
      candVal: `${cand.formation_compatibility_score}%`,
      delta: '<span class="delta-neutral">System Fluid</span>'
    },
    {
      metric: '💰 Financial Feasibility (20% Weight)',
      starVal: 'Reference Fee',
      candVal: `${cand.financial_feasibility_score}%`,
      delta: cand.financial_feasibility_score >= 85 ?
        '<span class="delta-positive">✓ Highly Feasible Fee</span>' :
        '<span class="delta-neutral">Viable Window</span>'
    },
    {
      metric: '🚀 Youth Growth & Headroom (15% Weight)',
      starVal: `${activeStar.age} yrs old`,
      candVal: `${cand.age} yrs old (${cand.growth_potential_score}% Growth)`,
      delta: ageDiff > 0 ?
        `<span class="delta-positive">+${ageDiff} yrs Longevity Headroom</span>` :
        `<span class="delta-neutral">${Math.abs(ageDiff)} yrs older</span>`
    },
    {
      metric: '💎 Market Valuation & Arbitrage Savings',
      starVal: formatCurrency(starFee),
      candVal: formatCurrency(candVal),
      delta: `<span class="delta-positive">+${formatCurrency(candSavingsEur)} (${candSavingsPct}% Saved)</span>`
    },
    {
      metric: '👔 Player Agent / Agency',
      starVal: activeStar.agent_name || 'Family / Direct',
      candVal: cand.agent_name || 'Family / Direct',
      delta: activeStar.agent_name === cand.agent_name ?
        '<span class="delta-positive">✓ Shared Agency Pipeline</span>' :
        '<span class="delta-neutral">Independent Agency</span>'
    },
    {
      metric: '📄 Contract Status & Expiration',
      starVal: activeStar.contract_status || 'Active Contract',
      candVal: `${cand.contract_status || 'Active Contract'} (${cand.contract_expiration_date || 'Rolling'})`,
      delta: (cand.contract_status && cand.contract_status.includes('Expiry')) ?
        '<span class="delta-leverage">⚠️ Contract Expiry Leverage</span>' :
        '<span class="delta-neutral">Active Contract</span>'
    },
    {
      metric: '💵 Estimated Weekly Wage & Relief',
      starVal: `${formatCurrency(starWkWage)} / wk`,
      candVal: `${formatCurrency(candWkWage)} / wk`,
      delta: wkWageDelta >= 0 ?
        `<span class="delta-positive">+${formatCurrency(wkWageDelta)}/wk Relief</span>` :
        `<span class="delta-negative">-${formatCurrency(Math.abs(wkWageDelta))}/wk Surge</span>`
    },
    {
      metric: '💼 Annual Payroll Burden & Relief',
      starVal: `${formatCurrency(starYrWage)} / yr`,
      candVal: `${formatCurrency(candYrWage)} / yr`,
      delta: yrWageDelta >= 0 ?
        `<span class="delta-positive">+${formatCurrency(yrWageDelta)}/yr Payroll Relief</span>` :
        `<span class="delta-negative">-${formatCurrency(Math.abs(yrWageDelta))}/yr Delta</span>`
    },
    {
      metric: '⏳ Succession Urgency & Recommendation',
      starVal: activeStar.is_succession_case ? 'Future Horizon Void' : 'Post-Departure Void',
      candVal: cand.composite_match_score >= 88 ? 'Immediate Drop-In Starter' : 'High-Potential Rotation',
      delta: '<span class="delta-positive">Actionable Profile</span>'
    }
  ];

  step4Rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${r.metric}</strong></td>
      <td class="star-col">${r.starVal}</td>
      <td class="cand-col">${r.candVal}</td>
      <td style="font-family: var(--font-mono); font-size: 0.82rem;">${r.delta}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Canvas-based Role-Adaptive Radar Chart
function drawRadarChart() {
  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) - 45;

  ctx.clearRect(0, 0, width, height);

  if (currentEntityMode === 'coaches') {
    const activeStar = getActiveCoachData();
    const cand = currentCoachCandidate;
    if (!activeStar) return;

    const axes = COACH_RADAR_AXES.map(m => m.label);
    const numAxes = axes.length;
    const angleStep = (Math.PI * 2) / numAxes;

    // 1. Concentric webs
    const levels = 4;
    for (let l = 1; l <= levels; l++) {
      const r = (radius / levels) * l;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.lineWidth = 1;
      for (let i = 0; i < numAxes; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // 2. Spokes and axis labels
    ctx.font = '10px Outfit, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < numAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      const labelX = centerX + (radius + 24) * Math.cos(angle);
      const labelY = centerY + (radius + 16) * Math.sin(angle);
      ctx.fillText(axes[i], labelX, labelY);
    }

    // 3. Star Vector using empirical percentiles
    const starVector = COACH_RADAR_AXES.map(m => {
      const pct = (activeStar.radar_percentiles && activeStar.radar_percentiles[m.key] !== undefined) ?
        activeStar.radar_percentiles[m.key] : 75;
      return Math.max(0.15, Math.min(1.0, pct / 100.0));
    });
    drawPolygon(ctx, centerX, centerY, radius, angleStep, starVector, 'rgba(6, 182, 212, 0.25)', '#06b6d4');

    // 4. Candidate Vector using empirical percentiles
    if (cand) {
      const candVector = COACH_RADAR_AXES.map(m => {
        const pct = (cand.radar_percentiles && cand.radar_percentiles[m.key] !== undefined) ?
          cand.radar_percentiles[m.key] : 70;
        return Math.max(0.15, Math.min(1.0, pct / 100.0));
      });
      drawPolygon(ctx, centerX, centerY, radius, angleStep, candVector, 'rgba(139, 92, 246, 0.35)', '#8b5cf6');
    }
    return;
  }

  const activeStar = getActiveStarData();
  const cand = currentCandidate;
  if (!activeStar) return;

  const posGrp = activeStar.pos_group || 'CM';
  const roleMetrics = ROLE_METRICS_MAP[posGrp] || ROLE_METRICS_MAP['CM'];
  const axes = roleMetrics.map(m => m.label);
  const numAxes = axes.length;
  const angleStep = (Math.PI * 2) / numAxes;

  // 1. Concentric webs
  const levels = 4;
  for (let l = 1; l <= levels; l++) {
    const r = (radius / levels) * l;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let i = 0; i < numAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 2. Spokes and axis labels
  ctx.font = '10.5px Outfit, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < numAxes; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();

    const labelX = centerX + (radius + 24) * Math.cos(angle);
    const labelY = centerY + (radius + 16) * Math.sin(angle);
    ctx.fillText(axes[i], labelX, labelY);
  }

  // 3. Star Vector using empirical percentiles
  const starVector = roleMetrics.map(m => {
    const pct = (activeStar.role_percentiles && activeStar.role_percentiles[m.key] !== undefined) ?
      activeStar.role_percentiles[m.key] : 75;
    return Math.max(0.15, Math.min(1.0, pct / 100.0));
  });

  // Draw Star Polygon (Cyan)
  drawPolygon(ctx, centerX, centerY, radius, angleStep, starVector, 'rgba(6, 182, 212, 0.25)', '#06b6d4');

  // 4. Candidate Vector using empirical percentiles
  if (cand) {
    const candVector = roleMetrics.map(m => {
      const pct = (cand.role_percentiles && cand.role_percentiles[m.key] !== undefined) ?
        cand.role_percentiles[m.key] : 70;
      return Math.max(0.15, Math.min(1.0, pct / 100.0));
    });
    // Draw Candidate Polygon (Purple)
    drawPolygon(ctx, centerX, centerY, radius, angleStep, candVector, 'rgba(139, 92, 246, 0.35)', '#8b5cf6');
  }
}

function drawPolygon(ctx, centerX, centerY, radius, angleStep, values, fillColor, strokeColor) {
  ctx.beginPath();
  for (let i = 0; i < values.length; i++) {
    const val = Math.max(0.15, Math.min(1.0, values[i]));
    const r = radius * val;
    const angle = i * angleStep - Math.PI / 2;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  for (let i = 0; i < values.length; i++) {
    const val = Math.max(0.15, Math.min(1.0, values[i]));
    const r = radius * val;
    const angle = i * angleStep - Math.PI / 2;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();
  }
}

// Setup Scatter Plot Listeners & Mode Toggle
let currentScatterPoints = [];

function setupScatterPlotListeners() {
  const btnRole = document.getElementById('btnScatterRoleMetrics');
  const btnFin = document.getElementById('btnScatterFinancial');
  const canvas = document.getElementById('scatterCanvas');
  const tooltip = document.getElementById('scatterTooltip');

  if (btnRole && btnFin) {
    btnRole.addEventListener('click', () => {
      scatterMode = 'role';
      btnRole.classList.add('active');
      btnFin.classList.remove('active');
      if (currentEntityMode === 'coaches') {
        const activeStar = getActiveCoachData();
        if (activeStar) {
          const pool = engineData.coach_pool || [];
          const baseList = pool.filter(p => p.name !== activeStar.name).map(p => scoreCoachAgainstStar(p, activeStar));
          drawScatterPlot(baseList, activeStar);
        }
      } else {
        const activeStar = getActiveStarData();
        if (activeStar) {
          const pool = engineData.player_pool || [];
          const baseList = pool.filter(p => p.id !== activeStar.player_id).map(p => scoreCandidateAgainstStar(p, activeStar));
          drawScatterPlot(baseList, activeStar);
        }
      }
    });

    btnFin.addEventListener('click', () => {
      scatterMode = 'financial';
      btnFin.classList.add('active');
      btnRole.classList.remove('active');
      if (currentEntityMode === 'coaches') {
        const activeStar = getActiveCoachData();
        if (activeStar) {
          const pool = engineData.coach_pool || [];
          const baseList = pool.filter(p => p.name !== activeStar.name).map(p => scoreCoachAgainstStar(p, activeStar));
          drawScatterPlot(baseList, activeStar);
        }
      } else {
        const activeStar = getActiveStarData();
        if (activeStar) {
          const pool = engineData.player_pool || [];
          const baseList = pool.filter(p => p.id !== activeStar.player_id).map(p => scoreCandidateAgainstStar(p, activeStar));
          drawScatterPlot(baseList, activeStar);
        }
      }
    });
  }

  if (canvas && tooltip) {
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      let hovered = null;
      for (const pt of currentScatterPoints) {
        const dist = Math.hypot(pt.x - mouseX, pt.y - mouseY);
        if (dist <= pt.r + 6) {
          hovered = pt;
          break;
        }
      }

      if (hovered) {
        tooltip.style.display = 'block';
        tooltip.style.left = `${(hovered.x / scaleX) + 14}px`;
        tooltip.style.top = `${(hovered.y / scaleY) - 20}px`;

        const p = hovered.data;
        const isStar = hovered.isStar;
        const roleOrPos = currentEntityMode === 'coaches' ? (p.top_formation || p.tactical_archetype || '') : (p.sub_position || p.pos || '');
        const feeOrWage = currentEntityMode === 'coaches' ? `Wage: ${formatCurrency(p.annual_wage_eur || p.annual_wage || 0)}/yr` : `Fee: ${formatCurrency(p.market_value_in_eur || p.val)}`;

        tooltip.innerHTML = `
          <div style="font-weight: 800; color: ${isStar ? 'var(--accent-cyan)' : '#fff'};">${p.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">${p.current_club_name || p.current_club || p.club} • ${roleOrPos}</div>
          <div style="margin-top: 0.35rem; font-family: var(--font-mono); font-size: 0.75rem;">
            <span>${feeOrWage}</span> • 
            <span style="color: var(--accent-purple);">${p.composite_match_score || '100'}% Match</span>
          </div>
          <div style="font-size: 0.72rem; color: var(--accent-cyan); margin-top: 0.2rem;">${hovered.xLabel}: ${hovered.rawX.toFixed(2)} | ${hovered.yLabel}: ${hovered.rawY.toFixed(2)}</div>
        `;
      } else {
        tooltip.style.display = 'none';
      }
    });

    canvas.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });

    const handleCanvasPointerSelect = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mouseX = (clientX - rect.left) * scaleX;
      const mouseY = (clientY - rect.top) * scaleY;

      for (const pt of currentScatterPoints) {
        const dist = Math.hypot(pt.x - mouseX, pt.y - mouseY);
        if (dist <= pt.r + 8 && !pt.isStar) {
          if (currentEntityMode === 'coaches') {
            selectCoachCandidateForRadar(pt.data);
          } else {
            selectCandidateForRadar(pt.data);
          }
          break;
        }
      }
    };

    canvas.addEventListener('click', (e) => {
      handleCanvasPointerSelect(e.clientX, e.clientY);
    });

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        handleCanvasPointerSelect(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
  }
}

// Interactive Multi-Candidate Tactical Scatter Plot Drawer
function drawScatterPlot(candidates, star) {
  const canvas = document.getElementById('scatterCanvas');
  if (!canvas || !star) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);
  currentScatterPoints = [];

  const padLeft = 65;
  const padRight = 35;
  const padTop = 30;
  const padBottom = 50;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  let xKey = 'xg_per_90', yKey = 'goals_per_90';
  let xLabel = 'Expected Goals (xG / 90)', yLabel = 'Actual Goals Scored / 90';
  let xMax = 1.0, yMax = 1.0;

  if (currentEntityMode === 'coaches') {
    if (scatterMode === 'role') {
      xKey = 'gf_pg'; yKey = 'ppg';
      xLabel = 'Attacking Output (Goals Scored / Match)';
      yLabel = 'Managerial Points Per Match (PPG)';
      xMax = 2.8; yMax = 2.5;
    } else {
      xKey = 'annual_wage_eur'; yKey = 'composite_match_score';
      xLabel = 'Annual Wage (€M / yr)';
      yLabel = 'Managerial Match Score (%)';
      xMax = Math.max((star.annual_wage_eur || 15_000_000) / 1_000_000, 22);
      yMax = 100;
    }
  } else if (scatterMode === 'role') {
    const posGrp = star.pos_group || 'CM';
    if (posGrp === 'ST') {
      xKey = 'xg_per_90'; yKey = 'goals_per_90';
      xLabel = 'Expected Goals (xG / 90)'; yLabel = 'Goals / 90';
      xMax = 1.1; yMax = 1.2;
    } else if (posGrp === 'Winger') {
      xKey = 'progressive_carries_per_90'; yKey = 'key_passes_per_90';
      xLabel = 'Progressive Carries / 90'; yLabel = 'Key Passes / 90';
      xMax = 8.5; yMax = 3.6;
    } else if (posGrp === 'CAM') {
      xKey = 'progressive_passes_per_90'; yKey = 'chances_created_per_90';
      xLabel = 'Progressive Passes / 90'; yLabel = 'Chances Created / 90';
      xMax = 8.0; yMax = 4.5;
    } else if (posGrp === 'CM' || posGrp === 'CDM') {
      xKey = 'ball_recoveries_per_90'; yKey = 'progressive_passes_per_90';
      xLabel = 'Ball Recoveries / 90'; yLabel = 'Progressive Passes / 90';
      xMax = 11.0; yMax = 8.5;
    } else if (posGrp === 'CB' || posGrp === 'FB') {
      xKey = 'interceptions_per_90'; yKey = 'tackles_per_90';
      xLabel = 'Interceptions / 90'; yLabel = 'Tackles / 90';
      xMax = 3.2; yMax = 4.2;
    } else if (posGrp === 'GK') {
      xKey = 'distribution_pct'; yKey = 'save_percentage';
      xLabel = 'Distribution Accuracy %'; yLabel = 'Save Percentage %';
      xMax = 90.0; yMax = 84.0;
    }
  } else {
    // Financial Arbitrage vs Suitability Score
    xKey = 'market_value_in_eur'; yKey = 'composite_match_score';
    xLabel = 'Market Value (€M)'; yLabel = 'Tactical Suitability Match Score (%)';
    xMax = Math.max((star.fee || 80_000_000) / 1_000_000, 80);
    yMax = 100;
  }

  const subtextEl = document.getElementById('scatterSubtext');
  if (subtextEl) {
    if (currentEntityMode === 'coaches') {
      subtextEl.textContent = scatterMode === 'role' ?
        `Managerial Vector: Attacking Output (GF/G) vs Points Per Game (PPG)` :
        `Managerial Arbitrage: Annual Wage (€M) vs Composite Match Score (%)`;
    } else {
      const posGrp = star.pos_group || 'CM';
      subtextEl.textContent = scatterMode === 'role' ?
        `Position [${posGrp}]: Comparing ${xLabel} vs ${yLabel}` :
        `Financial Efficiency: Market Valuation (€M) vs Composite Tactical Match Score (%)`;
    }
  }

  // Draw Grid lines & Quadrants
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  const gridSteps = 5;
  for (let i = 0; i <= gridSteps; i++) {
    // Vertical
    const gx = padLeft + (plotW / gridSteps) * i;
    ctx.beginPath();
    ctx.moveTo(gx, padTop);
    ctx.lineTo(gx, height - padBottom);
    ctx.stroke();

    // Horizontal
    const gy = padTop + (plotH / gridSteps) * i;
    ctx.beginPath();
    ctx.moveTo(padLeft, gy);
    ctx.lineTo(width - padRight, gy);
    ctx.stroke();
  }

  // Axis Labels & Ticks
  ctx.font = '10.5px Outfit, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  for (let i = 0; i <= gridSteps; i++) {
    const gx = padLeft + (plotW / gridSteps) * i;
    const tickVal = ((xMax / gridSteps) * i).toFixed(1);
    ctx.fillText(tickVal, gx, height - padBottom + 8);
  }

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= gridSteps; i++) {
    const gy = height - padBottom - (plotH / gridSteps) * i;
    const tickVal = ((yMax / gridSteps) * i).toFixed(1);
    ctx.fillText(tickVal, padLeft - 8, gy);
  }

  // Axis Titles
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11.5px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(xLabel, padLeft + plotW / 2, height - padBottom + 28);

  ctx.save();
  ctx.translate(padLeft - 44, padTop + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();

  // Helper coordinate mapper
  function mapX(val) {
    return padLeft + Math.min(1.0, Math.max(0.0, val / xMax)) * plotW;
  }
  function mapY(val) {
    return (height - padBottom) - Math.min(1.0, Math.max(0.0, val / yMax)) * plotH;
  }

  function getVal(obj, key) {
    if (key === 'annual_wage_eur') return (obj.annual_wage_eur || obj.annual_wage || 0) / 1_000_000.0;
    if (key === 'market_value_in_eur') return (obj.market_value_in_eur || obj.val || 0) / 1_000_000.0;
    if (obj.role_metrics && obj.role_metrics[key] && obj.role_metrics[key].value !== undefined) {
      return obj.role_metrics[key].value;
    }
    return obj[key] !== undefined ? obj[key] : (obj.g90 || 0);
  }

  // Plot Candidates
  const cands = candidates || [];
  cands.forEach((c, idx) => {
    const vx = getVal(c, xKey);
    const vy = getVal(c, yKey);
    const px = mapX(vx);
    const py = mapY(vy);

    const isSelected = currentEntityMode === 'coaches' ?
      (currentCoachCandidate && currentCoachCandidate.name === c.name) :
      (currentCandidate && currentCandidate.player_id === c.player_id);
    const isTop3 = idx < 3;
    const r = isSelected ? 8 : (isTop3 ? 6.5 : 5);
    const color = isSelected ? '#a855f7' : (isTop3 ? '#10b981' : 'rgba(139, 92, 246, 0.7)');

    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = isSelected ? 16 : (isTop3 ? 10 : 4);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (isSelected || isTop3) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = '10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.name.split(' ').pop(), px, py - 12);
    }

    currentScatterPoints.push({
      x: px, y: py, r: r,
      rawX: vx, rawY: vy,
      xLabel: xLabel, yLabel: yLabel,
      data: c,
      isStar: false
    });
  });

  // Plot Star Player (Cyan Glowing Star / Diamond)
  const starVx = getVal(star, xKey);
  const starVy = getVal(star, yKey);
  const spx = mapX(starVx);
  const spy = mapY(starVy);

  ctx.beginPath();
  ctx.arc(spx, spy, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#06b6d4';
  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 18;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#06b6d4';
  ctx.font = 'bold 11px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`★ ${star.name.split(' ').pop()} (Benchmark)`, spx, spy - 14);

  currentScatterPoints.push({
    x: spx, y: spy, r: 10,
    rawX: starVx, rawY: starVy,
    xLabel: xLabel, yLabel: yLabel,
    data: star,
    isStar: true
  });
}

// Execute on DOM Load
document.addEventListener('DOMContentLoaded', initApp);
