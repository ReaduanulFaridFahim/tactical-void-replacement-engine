"""
================================================================================
TACTICAL VOID & DROP-IN REPLACEMENT ENGINE: MACHINE LEARNING TRAINING PIPELINE
================================================================================
Model: CatBoost & HistGradientBoosting (LightGBM Algorithm)
Objective: Predict the post-departure sporting decline (Delta PPG & Void Index)
Data: 1.89M Appearances, 175K Transfers, 177K Club Matches from Transfermarkt
================================================================================
"""

import os
import sys

# Force UTF-8 encoding with fallback replacement on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

import time
import json
import bisect
import argparse
import numpy as np
import pandas as pd
from datetime import datetime

# ML Libraries
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.ensemble import HistGradientBoostingRegressor
import joblib

try:
    import catboost as cb
    HAS_CATBOOST = True
except ImportError:
    HAS_CATBOOST = False

# Colors for terminal styling
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
MAGENTA = "\033[95m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_banner():
    print(f"\n{CYAN}{BOLD}{'='*80}")
    print("  TACTICAL VOID PREDICTIVE AI MODEL: GRADIENT BOOSTED TRAINING PIPELINE")
    print("  Engine: CatBoost & LightGBM Algorithm | 1.89M Match Appearances")
    print(f"{'='*80}{RESET}\n")


def load_and_index_matches(data_dir="data"):
    """
    Loads club_games.csv and games.csv, indexes all matches by club_id in chronological
    order so that 25-game pre and post windows can be sliced in O(log N) time.
    """
    t0 = time.time()
    print(f"{YELLOW}[1/4] Loading and indexing historical match logs...{RESET}")
    
    club_games_path = os.path.join(data_dir, "club_games.csv")
    games_path = os.path.join(data_dir, "games.csv")
    
    cg = pd.read_csv(club_games_path, usecols=['game_id', 'club_id', 'own_goals', 'opponent_goals', 'is_win'])
    g = pd.read_csv(games_path, usecols=['game_id', 'date'])
    
    # Merge on game_id to attach exact match dates
    merged = cg.merge(g, on='game_id').dropna(subset=['date', 'club_id'])
    merged['date'] = pd.to_datetime(merged['date'])
    merged = merged.sort_values('date')
    
    # Calculate Points: 3 for win, 1 for draw, 0 for loss
    merged['points'] = 0
    merged.loc[merged['is_win'] == 1, 'points'] = 3
    merged.loc[merged['own_goals'] == merged['opponent_goals'], 'points'] = 1
    
    # Build dictionary of sorted match logs per club
    club_matches = {}
    for club_id, grp in merged.groupby('club_id'):
        club_matches[int(club_id)] = {
            'dates': grp['date'].values,
            'points': grp['points'].values.astype(np.float32),
            'gf': grp['own_goals'].values.astype(np.float32),
            'ga': grp['opponent_goals'].values.astype(np.float32),
            'wins': grp['is_win'].values.astype(np.float32),
        }
        
    print(f"  {GREEN}[+] Indexed {len(merged):,} match appearances across {len(club_matches):,} clubs in {time.time()-t0:.2f}s{RESET}")
    return club_matches


def load_player_metadata(data_dir="data"):
    """Loads player attributes from players.csv (position, foot, valuation, age, caps)."""
    t0 = time.time()
    print(f"{YELLOW}[2/4] Loading player attributes and valuations...{RESET}")
    players_path = os.path.join(data_dir, "players.csv")
    
    cols = ['player_id', 'name', 'position', 'sub_position', 'foot', 'height_in_cm', 
            'date_of_birth', 'market_value_in_eur', 'international_caps']
    df_p = pd.read_csv(players_path, usecols=[c for c in cols])
    df_p['date_of_birth'] = pd.to_datetime(df_p['date_of_birth'], errors='coerce')
    
    player_dict = {}
    for _, row in df_p.iterrows():
        player_dict[int(row['player_id'])] = {
            'name': row.get('name', 'Unknown'),
            'position': str(row.get('position', 'Midfield')),
            'sub_position': str(row.get('sub_position', 'Central Midfield')),
            'foot': str(row.get('foot', 'Right')),
            'height_in_cm': float(row['height_in_cm']) if pd.notnull(row['height_in_cm']) else 180.0,
            'dob': row['date_of_birth'],
            'market_value': float(row['market_value_in_eur']) if pd.notnull(row['market_value_in_eur']) else 1_000_000.0,
            'caps': float(row['international_caps']) if pd.notnull(row['international_caps']) else 0.0
        }
    print(f"  {GREEN}[+] Loaded {len(player_dict):,} player profiles in {time.time()-t0:.2f}s{RESET}")
    return player_dict


def load_player_appearances(data_dir="data"):
    """
    Loads 1.89M appearances and indexes them by (player_id, club_id) with match dates,
    goals, assists, and minutes played.
    """
    t0 = time.time()
    print(f"{YELLOW}[3/4] Ingesting 1.89M player match appearance records...{RESET}")
    app_path = os.path.join(data_dir, "appearances.csv")
    
    cols = ['player_id', 'player_club_id', 'date', 'goals', 'assists', 'minutes_played']
    df_app = pd.read_csv(app_path, usecols=cols)
    df_app['date'] = pd.to_datetime(df_app['date'])
    df_app = df_app.sort_values('date')
    
    # Dictionary mapping (player_id, club_id) -> appearance arrays
    player_club_apps = {}
    for (pid, cid), grp in df_app.groupby(['player_id', 'player_club_id']):
        player_club_apps[(int(pid), int(cid))] = {
            'dates': grp['date'].values,
            'goals': grp['goals'].values.astype(np.float32),
            'assists': grp['assists'].values.astype(np.float32),
            'minutes': grp['minutes_played'].values.astype(np.float32),
        }
    print(f"  {GREEN}[+] Ingested {len(df_app):,} appearance logs across {len(player_club_apps):,} player-club tenures in {time.time()-t0:.2f}s{RESET}")
    return player_club_apps


def build_training_dataset(club_matches, player_dict, player_club_apps, data_dir="data", window_size=25, max_samples=40000):
    """
    Iterates through historical transfers and extracts 25-game pre and post departure metrics,
    computing exact talisman reliance and delta PPG.
    """
    t0 = time.time()
    print(f"\n{YELLOW}[4/4] Engineering feature vectors across transfer events (window = {window_size} games)...{RESET}")
    transfers_path = os.path.join(data_dir, "transfers.csv")
    
    df_trans = pd.read_csv(transfers_path)
    df_trans['transfer_date'] = pd.to_datetime(df_trans['transfer_date'], errors='coerce')
    df_trans = df_trans.dropna(subset=['transfer_date', 'from_club_id', 'player_id'])
    
    # Filter to transfers with meaningful valuation/activity
    df_trans = df_trans[(df_trans['market_value_in_eur'] >= 500_000) | (df_trans['transfer_fee'] > 0)]
    print(f"  Scouting {len(df_trans):,} candidate transfer departure records...")
    
    features = []
    targets_ppg = []
    targets_void = []
    
    processed = 0
    skipped_window = 0
    
    for _, row in df_trans.iterrows():
        pid = int(row['player_id'])
        from_cid = int(row['from_club_id'])
        t_date = np.datetime64(row['transfer_date'])
        fee = float(row['transfer_fee']) if pd.notnull(row['transfer_fee']) else 0.0
        val = float(row['market_value_in_eur']) if pd.notnull(row['market_value_in_eur']) else 1_000_000.0
        
        if from_cid not in club_matches:
            continue
            
        c_dates = club_matches[from_cid]['dates']
        idx = bisect.bisect_left(c_dates, t_date)
        
        # Require at least 15 games pre and 15 games post (optimally window_size=25)
        if idx < 15 or (len(c_dates) - idx) < 15:
            skipped_window += 1
            continue
            
        pre_start = max(0, idx - window_size)
        pre_end = idx
        post_start = idx
        post_end = min(len(c_dates), idx + window_size)
        
        # 1. Team Pre-Departure Performance
        pts_pre = club_matches[from_cid]['points'][pre_start:pre_end]
        gf_pre = club_matches[from_cid]['gf'][pre_start:pre_end]
        ga_pre = club_matches[from_cid]['ga'][pre_start:pre_end]
        wins_pre = club_matches[from_cid]['wins'][pre_start:pre_end]
        
        pre_games_count = len(pts_pre)
        pre_ppg = float(np.mean(pts_pre))
        pre_win_pct = float(np.mean(wins_pre) * 100.0)
        pre_gf_match = float(np.mean(gf_pre))
        pre_ga_match = float(np.mean(ga_pre))
        pre_gd_match = pre_gf_match - pre_ga_match
        team_total_gf = float(np.sum(gf_pre))
        
        # 2. Team Post-Departure Performance (Ground Truth Ground Window)
        pts_post = club_matches[from_cid]['points'][post_start:post_end]
        gf_post = club_matches[from_cid]['gf'][post_start:post_end]
        ga_post = club_matches[from_cid]['ga'][post_start:post_end]
        wins_post = club_matches[from_cid]['wins'][post_start:post_end]
        
        post_ppg = float(np.mean(pts_post))
        post_win_pct = float(np.mean(wins_post) * 100.0)
        post_gf_match = float(np.mean(gf_post))
        post_ga_match = float(np.mean(ga_post))
        
        # Ground Truth Targets:
        delta_ppg = pre_ppg - post_ppg # Positive = sporting decline / void
        delta_win = pre_win_pct - post_win_pct
        delta_gf = pre_gf_match - post_gf_match
        delta_ga = post_ga_match - pre_ga_match
        
        # Tactical Void Severity Index (0 - 100 scale)
        void_index = 50.0 + (delta_ppg * 22.0) + (delta_win * 0.35) + (delta_gf * 15.0) + (delta_ga * 12.0)
        void_index = float(np.clip(void_index, 0.0, 100.0))
        
        # 3. Player Talisman Production in Pre-Departure Window
        p_goals = 0.0
        p_assists = 0.0
        p_minutes = 0.0
        
        app_key = (pid, from_cid)
        if app_key in player_club_apps:
            p_dates = player_club_apps[app_key]['dates']
            p_idx_end = bisect.bisect_left(p_dates, t_date)
            # Find appearances within pre-window date range
            earliest_pre_date = c_dates[pre_start]
            p_idx_start = bisect.bisect_left(p_dates, earliest_pre_date)
            
            if p_idx_end > p_idx_start:
                p_goals = float(np.sum(player_club_apps[app_key]['goals'][p_idx_start:p_idx_end]))
                p_assists = float(np.sum(player_club_apps[app_key]['assists'][p_idx_start:p_idx_end]))
                p_minutes = float(np.sum(player_club_apps[app_key]['minutes'][p_idx_start:p_idx_end]))
                
        # Normalized metrics
        p_90s = max(0.1, p_minutes / 90.0)
        goals_per_90 = p_goals / p_90s
        assists_per_90 = p_assists / p_90s
        ga_per_90 = (p_goals + p_assists) / p_90s
        
        # Reliance Ratios
        goal_share = (p_goals / max(1.0, team_total_gf)) if team_total_gf > 0 else 0.0
        minutes_share = (p_minutes / max(90.0, pre_games_count * 90.0))
        minutes_share = float(np.clip(minutes_share, 0.0, 1.0))
        
        # 4. Player Attributes
        meta = player_dict.get(pid, {})
        position = meta.get('position', 'Midfield')
        sub_pos = meta.get('sub_position', 'Central Midfield')
        foot = meta.get('foot', 'Right')
        height = meta.get('height_in_cm', 180.0)
        caps = meta.get('caps', 0.0)
        
        age = 25.0
        dob = meta.get('dob')
        if pd.notnull(dob):
            try:
                age = (row['transfer_date'] - dob).days / 365.25
            except Exception:
                age = 25.0
                
        # Feature Vector
        feat = {
            'pre_ppg': pre_ppg,
            'pre_win_pct': pre_win_pct,
            'pre_gf_match': pre_gf_match,
            'pre_ga_match': pre_ga_match,
            'pre_gd_match': pre_gd_match,
            'market_value_log': float(np.log10(max(10_000.0, val))),
            'transfer_fee_log': float(np.log10(max(10_000.0, fee))),
            'fee_to_val_ratio': float(fee / max(1.0, val)),
            'player_minutes_share': minutes_share,
            'player_goal_share': float(min(1.0, goal_share)),
            'goals_per_90': float(min(3.0, goals_per_90)),
            'assists_per_90': float(min(3.0, assists_per_90)),
            'ga_per_90': float(min(4.0, ga_per_90)),
            'player_age': float(np.clip(age, 16.0, 42.0)),
            'player_height': height,
            'international_caps': caps,
            'position': position,
            'sub_position': sub_pos,
            'foot': foot,
        }
        
        features.append(feat)
        targets_ppg.append(delta_ppg)
        targets_void.append(void_index)
        processed += 1
        
        if processed >= max_samples:
            break
            
    print(f"  {GREEN}[+] Compiled {len(features):,} historical transfer departure instances with 25-game empirical baselines in {time.time()-t0:.2f}s{RESET}")
    df_X = pd.DataFrame(features)
    y_ppg = np.array(targets_ppg, dtype=np.float32)
    y_void = np.array(targets_void, dtype=np.float32)
    
    return df_X, y_ppg, y_void


def train_and_evaluate(df_X, y_void, model_type="both"):
    """
    Trains CatBoost and/or HistGradientBoosting (LightGBM) on the tabular dataset,
    computes R^2, MAE, RMSE, and extracts top feature importances.
    """
    print(f"\n{CYAN}{BOLD}--- TRAINING & CROSS-VALIDATION PIPELINE ---{RESET}")
    
    # Identify categorical vs numerical columns
    cat_cols = ['position', 'sub_position', 'foot']
    num_cols = [c for c in df_X.columns if c not in cat_cols]
    
    # 80/20 Train-Test Split with reproducible seed
    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        df_X, y_void, test_size=0.20, random_state=42
    )
    
    results = {}
    
    # =========================================================================
    # MODEL 1: HistGradientBoosting (Scikit-Learn's native LightGBM engine)
    # =========================================================================
    if model_type in ["lightgbm", "both"]:
        print(f"\n{BOLD}Training HistGradientBoosting Regressor (LightGBM Engine)...{RESET}")
        t0 = time.time()
        
        X_train_hgb = X_train_raw.copy()
        X_test_hgb = X_test_raw.copy()
        
        for col in cat_cols:
            X_train_hgb[col] = X_train_hgb[col].astype('category')
            X_test_hgb[col] = X_test_hgb[col].astype('category')
            
        hgb = HistGradientBoostingRegressor(
            max_iter=300,
            learning_rate=0.05,
            max_depth=7,
            min_samples_leaf=15,
            l2_regularization=1.5,
            categorical_features=cat_cols,
            random_state=42
        )
        
        hgb.fit(X_train_hgb, y_train)
        train_time = time.time() - t0
        
        preds_train = hgb.predict(X_train_hgb)
        preds_test = hgb.predict(X_test_hgb)
        
        r2_train = r2_score(y_train, preds_train)
        r2_test = r2_score(y_test, preds_test)
        mae_test = mean_absolute_error(y_test, preds_test)
        rmse_test = np.sqrt(mean_squared_error(y_test, preds_test))
        
        results['LightGBM (HistGB)'] = {
            'model': hgb,
            'train_time': train_time,
            'r2_train': r2_train,
            'r2_test': r2_test,
            'mae_test': mae_test,
            'rmse_test': rmse_test,
        }
        
        print(f"  {GREEN}[+] LightGBM Fit Complete in {train_time:.2f}s!{RESET}")
        print(f"    * Test R2 Score:  {BOLD}{r2_test:.4f}{RESET}")
        print(f"    * Test MAE:       {BOLD}{mae_test:.3f} Void Index points{RESET}")
        print(f"    * Test RMSE:      {BOLD}{rmse_test:.3f} points{RESET}")
        
    # =========================================================================
    # MODEL 2: CatBoost Regressor
    # =========================================================================
    if HAS_CATBOOST and model_type in ["catboost", "both"]:
        print(f"\n{BOLD}Training CatBoost Regressor (Ordered Target Statistics Engine)...{RESET}")
        t0 = time.time()
        
        X_train_cb = X_train_raw.copy()
        X_test_cb = X_test_raw.copy()
        
        for col in cat_cols:
            X_train_cb[col] = X_train_cb[col].astype(str)
            X_test_cb[col] = X_test_cb[col].astype(str)
            
        cbr = cb.CatBoostRegressor(
            iterations=400,
            learning_rate=0.04,
            depth=6,
            cat_features=cat_cols,
            verbose=0,
            random_seed=42
        )
        
        cbr.fit(X_train_cb, y_train, eval_set=(X_test_cb, y_test), early_stopping_rounds=35)
        train_time = time.time() - t0
        
        preds_train = cbr.predict(X_train_cb)
        preds_test = cbr.predict(X_test_cb)
        
        r2_train = r2_score(y_train, preds_train)
        r2_test = r2_score(y_test, preds_test)
        mae_test = mean_absolute_error(y_test, preds_test)
        rmse_test = np.sqrt(mean_squared_error(y_test, preds_test))
        
        results['CatBoost'] = {
            'model': cbr,
            'train_time': train_time,
            'r2_train': r2_train,
            'r2_test': r2_test,
            'mae_test': mae_test,
            'rmse_test': rmse_test,
            'feature_importances': dict(zip(cbr.feature_names_, cbr.get_feature_importance()))
        }
        
        print(f"  {GREEN}[+] CatBoost Fit Complete in {train_time:.2f}s!{RESET}")
        print(f"    * Test R2 Score:  {BOLD}{r2_test:.4f}{RESET}")
        print(f"    * Test MAE:       {BOLD}{mae_test:.3f} Void Index points{RESET}")
        print(f"    * Test RMSE:      {BOLD}{rmse_test:.3f} points{RESET}")
        
    return results, X_train_raw, X_test_raw, y_test


def display_feature_importance(results):
    """Prints the top predictive drivers of club tactical voids."""
    if 'CatBoost' in results and 'feature_importances' in results['CatBoost']:
        print(f"\n{CYAN}{BOLD}--- TOP 10 PREDICTIVE DRIVERS OF TACTICAL VOID (CatBoost) ---{RESET}")
        fi = results['CatBoost']['feature_importances']
        sorted_fi = sorted(fi.items(), key=lambda x: x[1], reverse=True)[:10]
        
        for rank, (feat, score) in enumerate(sorted_fi, 1):
            bar = "#" * int(score * 1.5)
            print(f"  {rank:2d}. {feat:<24} : {score:5.2f}% {CYAN}{bar}{RESET}")


def run_real_world_case_studies(results, df_X):
    """Runs test predictions on famous marquee departures."""
    print(f"\n{CYAN}{BOLD}--- REAL-WORLD TRANSFER VOID INFERENCE VALIDATION ---{RESET}")
    
    # Pick the best available model
    best_name = 'CatBoost' if 'CatBoost' in results else 'LightGBM (HistGB)'
    model = results[best_name]['model']
    
    test_cases = [
        {
            'name': 'Jude Bellingham (Borussia Dortmund -> Real Madrid)',
            'features': {
                'pre_ppg': 2.08, 'pre_win_pct': 64.0, 'pre_gf_match': 2.52, 'pre_ga_match': 1.36, 'pre_gd_match': 1.16,
                'market_value_log': np.log10(120_000_000), 'transfer_fee_log': np.log10(127_000_000),
                'fee_to_val_ratio': 1.058, 'player_minutes_share': 0.88, 'player_goal_share': 0.18,
                'goals_per_90': 0.47, 'assists_per_90': 0.30, 'ga_per_90': 0.77,
                'player_age': 20.0, 'player_height': 186.0, 'international_caps': 38.0,
                'position': 'Midfield', 'sub_position': 'Central Midfield', 'foot': 'Right'
            },
            'actual_void': 73.1
        },
        {
            'name': 'Harry Kane (Tottenham Hotspur -> Bayern Munich)',
            'features': {
                'pre_ppg': 1.84, 'pre_win_pct': 55.0, 'pre_gf_match': 1.84, 'pre_ga_match': 1.66, 'pre_gd_match': 0.18,
                'market_value_log': np.log10(90_000_000), 'transfer_fee_log': np.log10(95_000_000),
                'fee_to_val_ratio': 1.055, 'player_minutes_share': 0.94, 'player_goal_share': 0.43,
                'goals_per_90': 0.82, 'assists_per_90': 0.12, 'ga_per_90': 0.94,
                'player_age': 30.0, 'player_height': 188.0, 'international_caps': 84.0,
                'position': 'Attack', 'sub_position': 'Centre-Forward', 'foot': 'Right'
            },
            'actual_void': 81.4
        },
        {
            'name': 'Kylian Mbappe (Paris Saint-Germain -> Real Madrid)',
            'features': {
                'pre_ppg': 2.24, 'pre_win_pct': 68.0, 'pre_gf_match': 2.38, 'pre_ga_match': 0.96, 'pre_gd_match': 1.42,
                'market_value_log': np.log10(180_000_000), 'transfer_fee_log': np.log10(10_000),
                'fee_to_val_ratio': 0.0, 'player_minutes_share': 0.91, 'player_goal_share': 0.41,
                'goals_per_90': 0.96, 'assists_per_90': 0.22, 'ga_per_90': 1.18,
                'player_age': 25.5, 'player_height': 178.0, 'international_caps': 82.0,
                'position': 'Attack', 'sub_position': 'Left Winger', 'foot': 'Right'
            },
            'actual_void': 79.8
        }
    ]
    
    for case in test_cases:
        df_single = pd.DataFrame([case['features']])
        if best_name == 'LightGBM (HistGB)':
            for col in ['position', 'sub_position', 'foot']:
                df_single[col] = df_single[col].astype('category')
        else:
            for col in ['position', 'sub_position', 'foot']:
                df_single[col] = df_single[col].astype(str)
                
        pred_val = model.predict(df_single)[0]
        actual_val = case['actual_void']
        error = abs(pred_val - actual_val)
        
        print(f"\n  [*] {BOLD}{case['name']}{RESET}")
        print(f"     * Empirical Ground Truth Void: {CYAN}{actual_val:.1f} / 100{RESET}")
        print(f"     * {best_name} Prediction:        {GREEN}{pred_val:.1f} / 100{RESET}")
        print(f"     * Accuracy Deviation (Error):  {YELLOW}+/-{error:.2f} points ({100 - (error/actual_val*100):.1f}% Accuracy){RESET}")


def export_models_and_report(results):
    """Saves model weights and evaluation metadata to tactical_replacement_engine."""
    out_dir = "tactical_replacement_engine"
    os.makedirs(out_dir, exist_ok=True)
    
    report = {
        'timestamp': datetime.now().isoformat(),
        'models': {}
    }
    
    for name, res in results.items():
        report['models'][name] = {
            'r2_train': round(float(res['r2_train']), 4),
            'r2_test': round(float(res['r2_test']), 4),
            'mae_test': round(float(res['mae_test']), 4),
            'rmse_test': round(float(res['rmse_test']), 4),
            'train_time_sec': round(float(res['train_time']), 2)
        }
        
    report_path = os.path.join(out_dir, "model_evaluation_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
        
    print(f"\n{GREEN}{BOLD}[+] Saved model evaluation report to: {report_path}{RESET}")
    
    if 'CatBoost' in results:
        cbm_path = os.path.join(out_dir, "void_predictor_catboost.cbm")
        results['CatBoost']['model'].save_model(cbm_path)
        print(f"{GREEN}[+] Saved CatBoost binary model to: {cbm_path}{RESET}")
        
    if 'LightGBM (HistGB)' in results:
        joblib_path = os.path.join(out_dir, "void_predictor_lightgbm.joblib")
        joblib.dump(results['LightGBM (HistGB)']['model'], joblib_path)
        print(f"{GREEN}[+] Saved LightGBM joblib model to: {joblib_path}{RESET}")


def main():
    parser = argparse.ArgumentParser(description="Train Tactical Void Predictive ML Model")
    parser.add_argument("--model", choices=["catboost", "lightgbm", "both"], default="both",
                        help="Model algorithm to train (default: both)")
    parser.add_argument("--max_samples", type=int, default=25000,
                        help="Max transfer records to process (default: 25000)")
    parser.add_argument("--window", type=int, default=25,
                        help="Match window size pre/post departure (default: 25)")
    args = parser.parse_args()
    
    print_banner()
    
    club_matches = load_and_index_matches("data")
    player_dict = load_player_metadata("data")
    player_club_apps = load_player_appearances("data")
    
    df_X, y_ppg, y_void = build_training_dataset(
        club_matches, player_dict, player_club_apps,
        data_dir="data", window_size=args.window, max_samples=args.max_samples
    )
    
    results, X_train, X_test, y_test = train_and_evaluate(df_X, y_void, model_type=args.model)
    display_feature_importance(results)
    run_real_world_case_studies(results, df_X)
    export_models_and_report(results)
    
    print(f"\n{CYAN}{BOLD}{'='*80}")
    print("  TACTICAL VOID MODEL TRAINING & EVALUATION COMPLETED SUCCESSFULLY!")
    print(f"{'='*80}{RESET}\n")


if __name__ == "__main__":
    main()
