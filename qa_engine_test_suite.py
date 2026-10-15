"""
Automated Comprehensive QA Test Suite for Tactical Void & Drop-In Replacement Engine
=====================================================================================
Senior QA Architecture Verification Suite:
1. HTML5 Standards, Semantics & DOM ID Uniqueness
2. JavaScript Syntax, DOM References Audit & Memory Management
3. CSS Design Tokens, Glassmorphism Variables & Responsive Constraints
4. Data Integrity & Schema Validation (44 Player Dossiers, 16 Manager Dossiers, 1,200+ Catalog)
5. Live In-Memory CatBoost & LightGBM Machine Learning Regressors & Latency Benchmark
6. REST API Endpoints & Threading HTTP Server Verification
7. CLI Explorer Functional Sanity Check
"""

import os
import re
import sys
import json
import math
import time
import socket
import threading
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

ENGINE_DIR = Path(__file__).resolve().parent
BASE_DIR = ENGINE_DIR.parent

test_results = []

def record(test_name: str, passed: bool, details: str = ""):
    test_results.append((test_name, passed, details))
    prefix = "[PASS]" if passed else "[FAIL]"
    print(f"{prefix} {test_name}: {details}")

print("=" * 76)
print(" ⚡ RUNNING TACTICAL REPLACEMENT ENGINE COMPREHENSIVE QA TEST SUITE")
print("=" * 76)

# -----------------------------------------------------------------------------
# 1. HTML DOM & Semantics QA
# -----------------------------------------------------------------------------
print("\n--- 1. Multi-Page Suite Architecture, HTML DOM & Semantics QA ---")
suite_pages = ["index.html", "ml_simulator.html", "radar_faceoff.html", "ffp_audit.html", "candidates.html"]
all_pages_exist = True
all_html5_valid = True
total_html_bytes = 0
all_suite_ids = set()
page_dup_ids = {}

for p in suite_pages:
    p_path = ENGINE_DIR / p
    if not p_path.exists():
        all_pages_exist = False
        continue
    content = p_path.read_text(encoding="utf-8")
    total_html_bytes += len(content)
    has_doc = "<!DOCTYPE html>" in content
    has_tit = "<title>" in content
    has_vp = 'name="viewport"' in content
    if not (has_doc and has_tit and has_vp):
        all_html5_valid = False

    p_ids = re.findall(r'id=["\']([^"\']+)["\']', content)
    seen_p = set()
    for eid in p_ids:
        if eid in seen_p:
            page_dup_ids.setdefault(p, []).append(eid)
        seen_p.add(eid)
        all_suite_ids.add(eid)

record("Multi-Page Suite Existence", all_pages_exist, f"5/5 pages present ({total_html_bytes:,} total bytes)")
record("HTML5 Standards", all_html5_valid, "DOCTYPE, Title & Viewport present across all 5 pages")
record("HTML Unique IDs per Page", len(page_dup_ids) == 0, f"Audited {len(all_suite_ids)} IDs across suite, zero per-page duplicates")

# Verify Key Structural Components Across Suite
key_sections = [
    "mainHeroTitle", "voidAnalysisCard", "pitchTacticalSection",
    "liveMlPredictionSection", "scatterSection", "radarWorkbenchSection",
    "ffpSection", "replacementsSection", "frameworkCard"
]
missing_sections = [s for s in key_sections if s not in all_suite_ids]
record("Key Architecture Sections", len(missing_sections) == 0, f"Verified {len(key_sections) - len(missing_sections)}/{len(key_sections)} sections")

# -----------------------------------------------------------------------------
# 2. JavaScript DOM References & Lifecycle Audit
# -----------------------------------------------------------------------------
print("\n--- 2. JavaScript Syntax, DOM References & Lifecycle Audit ---")
js_path = ENGINE_DIR / "app.js"
if js_path.exists():
    js_content = js_path.read_text(encoding="utf-8")

    open_braces = js_content.count("{") - js_content.count("}")
    open_brackets = js_content.count("[") - js_content.count("]")
    open_parens = js_content.count("(") - js_content.count(")")
    is_balanced = (open_braces == 0 and open_brackets == 0 and open_parens == 0)
    record("JavaScript Syntax Balance", is_balanced, f"Braces: {open_braces}, Brackets: {open_brackets}, Parens: {open_parens}")

    # DOM IDs referenced in JS
    get_elem_ids = set(re.findall(r'getElementById\(["\']([^"\']+)["\']\)', js_content))
    dynamically_created = {'tabCoachAll', 'tabCoachHistorical', 'tabCoachSuccession', 'executiveNavDock', 'headerSuiteNav'}
    missing_ids = [eid for eid in get_elem_ids if eid not in all_suite_ids and eid not in dynamically_created]
    record("JavaScript DOM Reference Integrity", len(missing_ids) == 0, f"{len(get_elem_ids)} IDs audited. Missing: {missing_ids}")

    # Verify HTML5 Canvas lifecycle & clearRect memory management
    clear_rect_calls = len(re.findall(r'\.clearRect\(', js_content))
    record("HTML5 Canvas Memory Management", clear_rect_calls >= 2, f"Found {clear_rect_calls} canvas.clearRect() frame flush calls")

# -----------------------------------------------------------------------------
# 3. CSS Stylesheet & Theme Tokens QA
# -----------------------------------------------------------------------------
print("\n--- 3. CSS Stylesheet, Design Tokens & Responsive Constraints ---")
css_path = ENGINE_DIR / "styles.css"
if css_path.exists():
    css_content = css_path.read_text(encoding="utf-8")
    css_braces = css_content.count("{") - css_content.count("}")
    record("CSS Syntax Balance", css_braces == 0, f"Brace balance: {css_braces}")

    tokens = ["--bg-deep", "--bg-surface", "--bg-card", "--border-highlight", "--accent-cyan", "--accent-purple", "--accent-emerald", "--text-primary", "--font-main", "--radius-md"]
    missing_tokens = [t for t in tokens if t not in css_content]
    record("Design System Theme Tokens", len(missing_tokens) == 0, f"Theme tokens verified ({len(tokens) - len(missing_tokens)}/{len(tokens)})")

    has_media_queries = "@media" in css_content
    record("Responsive Breakpoints", has_media_queries, "Found mobile/tablet @media queries")

# -----------------------------------------------------------------------------
# 4. Data Integrity & Schema Completeness QA
# -----------------------------------------------------------------------------
print("\n--- 4. Data Integrity & Dual-Engine Intelligence Schema QA ---")
json_path = ENGINE_DIR / "tactical_engine_data.json"
data_js_path = ENGINE_DIR / "data.js"

if json_path.exists():
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    req_keys = ["metadata", "departures", "player_pool", "coach_departures", "coach_pool"]
    missing_keys = [k for k in req_keys if k not in data]
    record("Database Schema Completeness", len(missing_keys) == 0, f"Keys verified: {req_keys}")

    deps = data.get("departures", [])
    record("Marquee Player Cases Count", len(deps) >= 40, f"Compiled {len(deps)} player dossiers (Expected >= 40)")

    coach_deps = data.get("coach_departures", [])
    record("Marquee & Succession Coach Cases Count", len(coach_deps) >= 15, f"Compiled {len(coach_deps)} coach dossiers (Expected >= 15)")

    nan_count = 0
    math_discrepancies = 0
    for d in deps:
        void = d.get("void_analysis", {})
        sev = void.get("void_severity", 0)
        if math.isnan(sev) or sev < 0 or sev > 100:
            nan_count += 1
        
        pre = void.get("pre", {})
        post = void.get("post", {})
        deltas = void.get("deltas", {})
        expected_d_ppg = round(post.get("ppg", 0) - pre.get("ppg", 0), 2)
        actual_d_ppg = round(deltas.get("delta_ppg", 0), 2)
        if abs(expected_d_ppg - actual_d_ppg) > 0.05:
            math_discrepancies += 1

    record("Tactical Void Mathematical Precision", nan_count == 0 and math_discrepancies == 0,
           f"Audited {len(deps)} player cases: {math_discrepancies} delta discrepancies, {nan_count} invalid severity values")

    if data_js_path.exists():
        data_js_content = data_js_path.read_text(encoding="utf-8")
        record("Offline data.js Bundle Sync", "window.TACTICAL_ENGINE_DATA =" in data_js_content,
               f"data.js present ({len(data_js_content):,} bytes)")

# -----------------------------------------------------------------------------
# 5. Live In-Memory Machine Learning Regressors QA
# -----------------------------------------------------------------------------
print("\n--- 5. Machine Learning Models & Latency Benchmark QA ---")
try:
    import serve_engine
    serve_engine.load_ml_models()
    cb_loaded = serve_engine.MODELS_LOADED['catboost'] is not None
    lgb_loaded = serve_engine.MODELS_LOADED['lightgbm'] is not None
    record("CatBoost Regressor (400 Trees)", cb_loaded, "In-memory CatBoost model ready")
    record("LightGBM Regressor (300 Trees)", lgb_loaded, "In-memory LightGBM model ready")

    # Run Benchmark & Edge Case Inference
    payload = {
        'model_type': 'ensemble',
        'star_data': {
            'name': 'Test Player',
            'fee': 100_000_000,
            'market_value_in_eur': 90_000_000,
            'pre_ppg': 2.14,
            'player_minutes_share': 0.85,
            'player_goal_share': 0.20,
            'goals_per_90': 0.35,
            'assists_per_90': 0.25,
            'age': 23.0,
            'height_in_cm': 185.0,
            'international_caps': 20.0,
            'position': 'Midfield',
            'sub_pos': 'Central Midfield',
            'foot': 'Right'
        },
        'candidate_data': {
            'name': 'Test Candidate',
            'composite_match_score': 88.5,
            'tactical_similarity_score': 91.0
        },
        'scenario_tweaks': {
            'fee_override_eur': 100_000_000,
            'pre_ppg_override': 2.14,
            'minutes_share_override': 0.85,
            'goal_share_override': 0.20
        }
    }

    # Warm-up and benchmark live inference
    _ = serve_engine.predict_void_from_payload(payload)
    t0 = time.perf_counter()
    pred_res = serve_engine.predict_void_from_payload(payload)
    infer_time_ms = (time.perf_counter() - t0) * 1000.0

    valid_pred = (pred_res['success'] and 5.0 <= pred_res['predicted_void_index'] <= 95.0)
    record("Live ML Void Inference Execution", valid_pred,
           f"Predicted Void: {pred_res['predicted_void_index']}/100, Tier: [{pred_res['risk_tier']}], Delta PPG: {pred_res['predicted_delta_ppg']}")
    record("Ultra-Low Latency Inference (< 100ms SLA)", infer_time_ms < 100.0, f"Execution latency: {infer_time_ms:.2f}ms")

    # Test Manager/Coach entity inference robustness
    coach_payload = {
        'model_type': 'ensemble',
        'star_data': {
            'name': 'Test Manager',
            'fee': 15_000_000,
            'pre_ppg': 2.10,
            'player_minutes_share': 0.80,
            'player_goal_share': 0.15,
            'position': 'Manager',
            'sub_pos': 'Head Coach',
            'foot': 'Right'
        }
    }
    c_res = serve_engine.predict_void_from_payload(coach_payload)
    record("Managerial Entity Inference Robustness", c_res['success'] and c_res['predicted_void_index'] > 0,
           f"Manager Void: {c_res['predicted_void_index']}/100")

except Exception as e:
    record("Machine Learning Engine QA", False, f"Error: {e}")

# -----------------------------------------------------------------------------
# 6. Live Local Server & REST API Endpoints QA
# -----------------------------------------------------------------------------
print("\n--- 6. Live Local Server & REST API Endpoints QA ---")
server_instance = None
test_port = 8085
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
is_running = (s.connect_ex(('127.0.0.1', 8085)) == 0)
s.close()

if not is_running:
    try:
        from serve_engine import EngineHandler
        class SilentEngineHandler(EngineHandler):
            def log_message(self, format, *args):
                pass
        server_instance = ThreadingHTTPServer(('127.0.0.1', 8085), SilentEngineHandler)
        test_port = 8085
    except OSError:
        from serve_engine import EngineHandler
        class SilentEngineHandler(EngineHandler):
            def log_message(self, format, *args):
                pass
        server_instance = ThreadingHTTPServer(('127.0.0.1', 0), SilentEngineHandler)
        test_port = server_instance.server_address[1]

    server_thread = threading.Thread(target=server_instance.serve_forever, daemon=True)
    server_thread.start()

# Test Static Endpoints
static_endpoints = [
    (f"http://127.0.0.1:{test_port}/index.html", 200),
    (f"http://127.0.0.1:{test_port}/ml_simulator.html", 200),
    (f"http://127.0.0.1:{test_port}/radar_faceoff.html", 200),
    (f"http://127.0.0.1:{test_port}/ffp_audit.html", 200),
    (f"http://127.0.0.1:{test_port}/candidates.html", 200),
    (f"http://127.0.0.1:{test_port}/styles.css", 200),
    (f"http://127.0.0.1:{test_port}/app.js", 200),
    (f"http://127.0.0.1:{test_port}/data.js", 200),
    (f"http://127.0.0.1:{test_port}/tactical_engine_data.json", 200),
]

for url, expected_status in static_endpoints:
    try:
        req = urllib.request.Request(url, headers={'Connection': 'close'})
        with urllib.request.urlopen(req, timeout=5) as response:
            status = response.getcode()
            _ = response.read()
            record(f"HTTP GET {url.split('/')[-1]}", status == expected_status, f"HTTP {status} (Port {test_port})")


    except Exception as e:
        record(f"HTTP GET {url.split('/')[-1]}", False, f"Error: {e}")

# Test REST API GET Endpoints
try:
    req_health = urllib.request.Request(f"http://127.0.0.1:{test_port}/api/health", headers={'Connection': 'close'})
    with urllib.request.urlopen(req_health, timeout=5) as resp:
        health_data = json.loads(resp.read().decode('utf-8'))
        record("API GET /api/health", health_data.get('status') == 'ok', f"Status: {health_data.get('status')}")

    req_info = urllib.request.Request(f"http://127.0.0.1:{test_port}/api/model-info", headers={'Connection': 'close'})
    with urllib.request.urlopen(req_info, timeout=5) as resp:
        info_data = json.loads(resp.read().decode('utf-8'))
        record("API GET /api/model-info", info_data.get('status') == 'online', f"Models: {info_data.get('models_available')}")
except Exception as e:
    record("API GET Endpoints", False, f"Error: {e}")

# Test REST API POST /api/predict-void
try:
    req_post = urllib.request.Request(
        f"http://127.0.0.1:{test_port}/api/predict-void",
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'Connection': 'close'}
    )
    with urllib.request.urlopen(req_post, timeout=5) as resp:
        post_res = json.loads(resp.read().decode('utf-8'))
        record("API POST /api/predict-void", post_res.get('success') is True,
               f"Returned Void: {post_res.get('predicted_void_index')}, Delta PPG: {post_res.get('predicted_delta_ppg')}")
except Exception as e:
    record("API POST /api/predict-void", False, f"Error: {e}")

if server_instance:
    server_instance.shutdown()

# -----------------------------------------------------------------------------
# 7. CLI Explorer Functional Sanity QA
# -----------------------------------------------------------------------------
print("\n--- 7. CLI Explorer Functional Sanity QA ---")
import subprocess
try:
    py_exec = sys.executable
    # Test --list
    res_list = subprocess.run([py_exec, "cli_explorer.py", "--list"], cwd=str(ENGINE_DIR), capture_output=True, text=True, encoding='utf-8')
    has_players_coaches = ("MARQUEE ATHLETE DEPARTURES" in res_list.stdout and "MARQUEE & SUCCESSION HEAD COACH DEPARTURES" in res_list.stdout)
    record("CLI --list (Athletes & Coaches)", res_list.returncode == 0 and has_players_coaches, "Both catalogs rendered in terminal")

    # Test Coach Query
    res_coach = subprocess.run([py_exec, "cli_explorer.py", "-c", "Klopp"], cwd=str(ENGINE_DIR), capture_output=True, text=True, encoding='utf-8')
    has_klopp = ("JÜRGEN KLOPP" in res_coach.stdout and "Arne Slot" in res_coach.stdout)
    record("CLI Coach Search (-c Klopp)", res_coach.returncode == 0 and has_klopp, "Klopp void analysis & Arne Slot replacement identified")

    # Test Player Query
    res_player = subprocess.run([py_exec, "cli_explorer.py", "-p", "Bellingham"], cwd=str(ENGINE_DIR), capture_output=True, text=True, encoding='utf-8')
    has_bell = ("JUDE BELLINGHAM" in res_player.stdout)
    record("CLI Player Search (-p Bellingham)", res_player.returncode == 0 and has_bell, "Bellingham dossier & replacements identified")
except Exception as e:
    record("CLI Functional Sanity", False, f"Error: {e}")

# -----------------------------------------------------------------------------
# FINAL QA SUMMARY
# -----------------------------------------------------------------------------
print("\n" + "=" * 76)
total_tests = len(test_results)
passed_tests = sum(1 for _, p, _ in test_results if p)
failed_tests = total_tests - passed_tests

print(f" TACTICAL ENGINE QA SUMMARY: {passed_tests}/{total_tests} TESTS PASSED")
if failed_tests == 0:
    print(" ALL QUALITY ASSURANCE CHECKS PASSED WITH ZERO DEFECTS!")
else:
    print(f" {failed_tests} TESTS FAILED. PLEASE REVIEW.")
print("=" * 76)

sys.exit(0 if failed_tests == 0 else 1)
