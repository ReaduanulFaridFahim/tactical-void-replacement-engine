"""
Tactical Void & Drop-In Replacement CLI Explorer
=================================================
Interactive command-line tool to analyze club performance drop-offs
and discover optimal tactical replacements for departed football stars
and talismanic head coaches/managers.
"""

import os
import sys
import json
import argparse

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Dynamic path resolution to ensure CLI works from any directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
POTENTIAL_PATHS = [
    os.path.join(SCRIPT_DIR, 'tactical_engine_data.json'),
    os.path.join(os.getcwd(), 'tactical_engine_data.json'),
    os.path.join(os.getcwd(), 'tactical_replacement_engine', 'tactical_engine_data.json')
]

DATA_PATH = next((p for p in POTENTIAL_PATHS if os.path.exists(p)), POTENTIAL_PATHS[0])

def load_engine_data():
    if not os.path.exists(DATA_PATH):
        print(f"Error: Database not found at {DATA_PATH}. Please run build_engine_data.py first.")
        sys.exit(1)
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def format_currency(val):
    if not val or val == 0:
        return "€0"
    if val >= 1_000_000:
        return f"€{val / 1_000_000:.1f}M"
    elif val >= 1_000:
        return f"€{val / 1_000:.0f}K"
    return f"€{val:.0f}"

def render_player_summary(dep):
    meta = dep['departure_meta']
    void = dep['void_analysis']
    pre = void['pre']
    post = void['post']
    deltas = void['deltas']
    star = dep['star_stats']

    print("=" * 86)
    print(f"  ⚽ MARQUEE ATHLETE DEPARTURE: {meta['player_name'].upper()}")
    print(f"     {meta['from_club_name']} ➔ {meta['to_club_name']}")
    print(f"     Fee: {format_currency(meta['transfer_fee'])} | Date: {meta['transfer_date']} | Role: {meta.get('role_tag', 'Talisman')}")
    print("=" * 86)

    # Tactical Void Box
    severity = void['void_severity']
    tier = void['severity_tier']
    desc = void['severity_desc']
    print(f"\n[!] TACTICAL VOID SEVERITY: {severity}/100 ➔ [{tier}]")
    print(f"    Impact Assessment: {desc}\n")

    print(f"{'METRIC':<26} | {'PRE-DEPARTURE (25G)':<20} | {'POST-DEPARTURE (25G)':<20} | {'TACTICAL DELTA':<15}")
    print("-" * 86)
    print(f"{'Points Per Game (PPG)':<26} | {pre['ppg']:<20.2f} | {post['ppg']:<20.2f} | {deltas['delta_ppg']:+0.2f}")
    print(f"{'Win Rate (%)':<26} | {pre['win_rate']:<20.1f}% | {post['win_rate']:<20.1f}% | {deltas['delta_win_rate']:+0.1f}%")
    print(f"{'Goals Scored / Game':<26} | {pre['goals_for_pg']:<20.2f} | {post['goals_for_pg']:<20.2f} | {deltas['delta_gf_pg']:+0.2f}")
    print(f"{'Goals Conceded / Game':<26} | {pre['goals_against_pg']:<20.2f} | {post['goals_against_pg']:<20.2f} | {deltas['delta_ga_pg']:+0.2f}")
    print(f"{'Clean Sheet Rate (%)':<26} | {pre['clean_sheet_pct']:<20.1f}% | {post['clean_sheet_pct']:<20.1f}% | {round(post['clean_sheet_pct'] - pre['clean_sheet_pct'], 1):+0.1f}%")
    post_form = list(post['top_formations'].keys())[0] if post.get('top_formations') else 'Dynamic'
    print(f"{'Primary Formation':<26} | {dep['primary_formation']:<20} | {post_form:<20} | Shift")
    print("-" * 86)

    # Departed Star Profile
    print(f"\n👤 DEPARTED STAR BENCHMARK: {meta['player_name']} ({star.get('foot', 'Right')} foot, {star.get('height_in_cm', 180)}cm)")
    print(f"   Career Output: {star.get('goals_per_90', 0)} G/90 | {star.get('assists_per_90', 0)} A/90 | {star.get('ga_per_90', 0)} G+A/90 | {star.get('minutes_per_app', 0)} Min/Match\n")

    # Recommendations Table
    recs = dep['recommendations']
    print(f"🎯 TOP DROP-IN TACTICAL REPLACEMENTS (RANKED BY COMPOSITE MATCH SCORE)")
    print("-" * 86)
    header = f"{'#':<3} {'CANDIDATE':<20} {'CURRENT CLUB':<18} {'AGE':<4} {'VALUATION':<10} {'TACT':<6} {'FORM':<6} {'MATCH %':<8}"
    print(header)
    print("-" * 86)

    for idx, r in enumerate(recs, 1):
        name_trunc = r['name'][:19]
        club_trunc = r['current_club_name'][:17]
        val_str = format_currency(r['market_value_in_eur'])
        line = f"{idx:<3} {name_trunc:<20} {club_trunc:<18} {r['age']:<4} {val_str:<10} {r['tactical_similarity_score']:<6.1f} {r['formation_compatibility_score']:<6.1f} {r['composite_match_score']:<8.1f}%"
        print(line)

    print("-" * 86)
    if recs:
        top1 = recs[0]
        print(f"\n💡 SCOUTING RECOMMENDATION #1: {top1['name']} ({top1['current_club_name']})")
        print(f"   • Overall Fit: {top1['composite_match_score']}% Match")
        print(f"   • Financial Advantage: Costs {format_currency(top1['market_value_in_eur'])} ➔ Arbitrage Savings: {format_currency(top1['savings_eur'])} ({top1['savings_pct']}% of received fee)")
        print(f"   • Tactical Alignment: {top1['goals_per_90']} G/90 | {top1['assists_per_90']} A/90 | {top1['ga_per_90']} G+A/90 (vs Star {star.get('ga_per_90', 0)})")
        print(f"   • Preferred System: {top1['top_formation']} (Club deployed {dep['primary_formation']})")
    print("=" * 86)

def render_coach_summary(cdep):
    meta = cdep['departure_meta']
    void = cdep['void_analysis']
    pre = void['pre']
    post = void['post']
    deltas = void['deltas']
    star = cdep['star_stats']
    recs = cdep.get('recommendations', [])

    case_type = "MANAGERIAL SUCCESSION PLANNING" if meta.get('is_succession_case') else "MARQUEE COACH DEPARTURE"
    dest = meta.get('to_destination', 'Transition / Sabbatical')

    print("=" * 86)
    print(f"  👔 {case_type}: {meta['coach_name'].upper()}")
    print(f"     {meta['from_club_name']} ➔ {dest}")
    print(f"     Annual Wage: {format_currency(meta.get('annual_wage', 0))}/yr | Date: {meta['departure_date']}")
    print(f"     Formation: {meta.get('primary_formation', 'Dynamic')} | Philosophy: {meta.get('philosophy_tag', 'Master Tactician')}")
    print("=" * 86)

    # Tactical Void Box
    severity = void['void_severity']
    tier = void['severity_tier']
    desc = void['severity_desc']
    print(f"\n[!] MANAGERIAL TACTICAL VOID SEVERITY: {severity}/100 ➔ [{tier}]")
    print(f"    Impact Assessment: {desc}\n")

    print(f"{'METRIC':<26} | {'PRE-DEPARTURE (25G)':<20} | {'POST-DEPARTURE (25G)':<20} | {'TACTICAL DELTA':<15}")
    print("-" * 86)
    print(f"{'Points Per Game (PPG)':<26} | {pre['ppg']:<20.2f} | {post['ppg']:<20.2f} | {deltas['delta_ppg']:+0.2f}")
    print(f"{'Win Rate (%)':<26} | {pre['win_rate']:<20.1f}% | {post['win_rate']:<20.1f}% | {deltas['delta_win_rate']:+0.1f}%")
    print(f"{'Goals Scored / Game':<26} | {pre['goals_for_pg']:<20.2f} | {post['goals_for_pg']:<20.2f} | {deltas['delta_gf_pg']:+0.2f}")
    print(f"{'Goals Conceded / Game':<26} | {pre['goals_against_pg']:<20.2f} | {post['goals_against_pg']:<20.2f} | {deltas['delta_ga_pg']:+0.2f}")
    print(f"{'Clean Sheet Rate (%)':<26} | {pre['clean_sheet_pct']:<20.1f}% | {post['clean_sheet_pct']:<20.1f}% | {round(post['clean_sheet_pct'] - pre['clean_sheet_pct'], 1):+0.1f}%")
    post_form = list(post.get('top_formations', {}).keys())[0] if post.get('top_formations') else 'Dynamic'
    print(f"{'Primary Formation':<26} | {meta.get('primary_formation', '4-3-3'):<20} | {post_form:<20} | Shift")
    print("-" * 86)

    # Departed Coach Benchmark
    trophies = star.get('trophies', 'League & Cup Silverware')
    print(f"\n👔 DEPARTED HEAD COACH BENCHMARK: {meta['coach_name']} (Age {star.get('age', meta.get('age', 50))}, {star.get('nat', meta.get('nat', 'Europe'))})")
    print(f"   Career Track Record: {star.get('total_games', 0)} Matches | {star.get('win_pct', 0):.1f}% Win Rate | {star.get('ppg', 0):.2f} PPG")
    print(f"   Honors & Silverware: {trophies}")
    print(f"   Archetype: {star.get('tactical_archetype', meta.get('philosophy_tag', 'Elite Tactician'))}\n")

    # Recommendations Table
    print(f"🎯 TOP DROP-IN HEAD COACH REPLACEMENTS (RANKED BY MANAGERIAL MATCH SCORE)")
    print("-" * 86)
    header = f"{'#':<3} {'CANDIDATE':<20} {'CURRENT CLUB':<18} {'AGE':<4} {'ANNUAL WAGE':<12} {'BUYOUT':<8} {'MATCH %':<8}"
    print(header)
    print("-" * 86)

    for idx, r in enumerate(recs, 1):
        name_trunc = r['name'][:19]
        club_trunc = (r.get('current_club') or 'Free Agent')[:17]
        wage_str = format_currency(r.get('annual_wage_eur', 0)) + "/yr"
        buyout_str = format_currency(r.get('buyout_clause_eur', 0))
        line = f"{idx:<3} {name_trunc:<20} {club_trunc:<18} {r.get('age', 45):<4} {wage_str:<12} {buyout_str:<8} {r.get('composite_match_score', 80.0):<8.1f}%"
        print(line)

    print("-" * 86)
    if recs:
        top1 = recs[0]
        print(f"\n💡 MANAGERIAL APPOINTMENT RECOMMENDATION #1: {top1['name']} ({top1.get('current_club') or 'Free Agent'})")
        print(f"   • Succession Match Fit: {top1.get('composite_match_score', 80.0)}% Overall")
        print(f"   • Financial Structuring: Wage {format_currency(top1.get('annual_wage_eur', 0))}/yr | Contract Buyout: {format_currency(top1.get('buyout_clause_eur', 0))}")
        print(f"   • Tactical Blueprint: {top1.get('tactical_archetype', 'Modern High-Tempo Pressing')} (Preferred: {top1.get('top_formation', '4-3-3')})")
        print(f"   • Track Record: {top1.get('total_games', 0)} Matches | {top1.get('win_pct', 0):.1f}% Win Rate | {top1.get('ppg', 0):.2f} PPG | {top1.get('trophies', 'Trophies')}")
        print(f"   • Agency Pipeline: {top1.get('agent', 'Direct Representation')} | Status: {top1.get('contract_status', 'Active')}")
    print("=" * 86)

def list_all_departures(departures, coach_departures):
    print("\n" + "=" * 80)
    print("       ⚡ TACTICAL VOID & DROP-IN REPLACEMENT ENGINE DOSSIERS")
    print("=" * 80)

    print(f"\n⚽ MARQUEE ATHLETE DEPARTURES ({len(departures)} Dossiers):")
    print("-" * 80)
    print(f"{'#':<3} {'ATHLETE':<24} {'ORIGIN CLUB':<22} {'FEE':<12} {'YEAR'}")
    print("-" * 80)
    for i, d in enumerate(departures, 1):
        m = d['departure_meta']
        yr = m['transfer_date'].split('-')[0]
        fee = format_currency(m['transfer_fee'])
        print(f"{i:<3} {m['player_name']:<24} {m['from_club_name']:<22} {fee:<12} {yr}")

    print(f"\n👔 MARQUEE & SUCCESSION HEAD COACH DEPARTURES ({len(coach_departures)} Dossiers):")
    print("-" * 80)
    print(f"{'#':<3} {'HEAD COACH':<24} {'CLUB':<22} {'ANNUAL WAGE':<12} {'TYPE'}")
    print("-" * 80)
    for i, cd in enumerate(coach_departures, 1):
        m = cd['departure_meta']
        wage = format_currency(m.get('annual_wage', 0))
        ctype = "Succession" if m.get('is_succession_case') else "Marquee Exit"
        print(f"{i:<3} {m['coach_name']:<24} {m['from_club_name']:<22} {wage:<12} {ctype}")

    print("=" * 80)
    print("\nQuick Inspection Examples:")
    print("  python cli_explorer.py -p Bellingham")
    print("  python cli_explorer.py -p Salah")
    print("  python cli_explorer.py -c Klopp")
    print("  python cli_explorer.py -c \"Ten Hag\"")
    print("  python cli_explorer.py -q Guardiola\n")

def main():
    parser = argparse.ArgumentParser(description="Tactical Void & Drop-In Replacement CLI Explorer")
    parser.add_argument('-p', '--player', type=str, help="Filter by departed player name (e.g. Bellingham, Kane, Rice, Salah)")
    parser.add_argument('-c', '--coach', type=str, help="Filter by head coach name (e.g. Klopp, Ten Hag, Guardiola, Alonso)")
    parser.add_argument('-q', '--query', type=str, help="Unified search across both players and coaches")
    parser.add_argument('positional_query', nargs='?', type=str, help="Optional search query without flag")
    parser.add_argument('-l', '--list', action='store_true', help="List all available marquee dossiers")
    args = parser.parse_args()

    engine_data = load_engine_data()
    departures = engine_data.get('departures', [])
    coach_departures = engine_data.get('coach_departures', [])

    search_query = args.query or args.positional_query

    # Show catalog if --list or no query given
    if args.list or (not args.player and not args.coach and not search_query and len(sys.argv) == 1):
        list_all_departures(departures, coach_departures)
        return

    # Specific coach search
    if args.coach:
        q = args.coach.lower()
        matches = [cd for cd in coach_departures if q in cd['departure_meta']['coach_name'].lower()]
        if not matches:
            print(f"\n[!] No head coach dossier found matching '{args.coach}'. Use --list to see all available cases.")
            return
        for m in matches:
            render_coach_summary(m)
        return

    # Specific player search
    if args.player:
        q = args.player.lower()
        matches = [d for d in departures if q in d['departure_meta']['player_name'].lower()]
        if not matches:
            # Fallback check if it was a coach
            coach_matches = [cd for cd in coach_departures if q in cd['departure_meta']['coach_name'].lower()]
            if coach_matches:
                for cm in coach_matches:
                    render_coach_summary(cm)
                return
            print(f"\n[!] No athlete departure found matching '{args.player}'. Use --list to see all available cases.")
            return
        for m in matches:
            render_player_summary(m)
        return

    # Unified search
    if search_query:
        q = search_query.lower()
        p_matches = [d for d in departures if q in d['departure_meta']['player_name'].lower()]
        c_matches = [cd for cd in coach_departures if q in cd['departure_meta']['coach_name'].lower()]

        if not p_matches and not c_matches:
            print(f"\n[!] No player or coach dossier found matching '{search_query}'. Use --list to inspect available cases.")
            return

        for pm in p_matches:
            render_player_summary(pm)
        for cm in c_matches:
            render_coach_summary(cm)

if __name__ == '__main__':
    main()
