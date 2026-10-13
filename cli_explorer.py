"""
Tactical Void & Drop-In Replacement CLI Explorer
=================================================
Interactive command-line tool to analyze club performance drop-offs
and discover optimal tactical replacements for departed football stars.
"""

import os
import sys
import json
import argparse

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

DATA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tactical_engine_data.json')

def load_engine_data():
    if not os.path.exists(DATA_PATH):
        print(f"Error: Database not found at {DATA_PATH}. Please run build_engine_data.py first.")
        sys.exit(1)
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def format_currency(val):
    if val >= 1_000_000:
        return f"€{val / 1_000_000:.1f}M"
    elif val >= 1_000:
        return f"€{val / 1_000:.0f}K"
    return f"€{val:.0f}"

def render_departure_summary(dep):
    meta = dep['departure_meta']
    void = dep['void_analysis']
    pre = void['pre']
    post = void['post']
    deltas = void['deltas']
    star = dep['star_stats']

    print("=" * 82)
    print(f"  ⚽ MARQUEE DEPARTURE: {meta['player_name'].upper()}")
    print(f"     {meta['from_club_name']} ➔ {meta['to_club_name']}")
    print(f"     Fee: {format_currency(meta['transfer_fee'])} | Date: {meta['transfer_date']} | Role: {meta.get('role_tag', 'Talisman')}")
    print("=" * 82)

    # Tactical Void Box
    severity = void['void_severity']
    tier = void['severity_tier']
    desc = void['severity_desc']
    print(f"\n[!] TACTICAL VOID SEVERITY: {severity}/100 ➔ [{tier}]")
    print(f"    Impact Assessment: {desc}\n")

    print(f"{'METRIC':<26} | {'PRE-DEPARTURE (25G)':<20} | {'POST-DEPARTURE (25G)':<20} | {'TACTICAL DELTA':<15}")
    print("-" * 82)
    print(f"{'Points Per Game (PPG)':<26} | {pre['ppg']:<20.2f} | {post['ppg']:<20.2f} | {deltas['delta_ppg']:+0.2f}")
    print(f"{'Win Rate (%)':<26} | {pre['win_rate']:<20.1f}% | {post['win_rate']:<20.1f}% | {deltas['delta_win_rate']:+0.1f}%")
    print(f"{'Goals Scored / Game':<26} | {pre['goals_for_pg']:<20.2f} | {post['goals_for_pg']:<20.2f} | {deltas['delta_gf_pg']:+0.2f}")
    print(f"{'Goals Conceded / Game':<26} | {pre['goals_against_pg']:<20.2f} | {post['goals_against_pg']:<20.2f} | {deltas['delta_ga_pg']:+0.2f}")
    print(f"{'Clean Sheet Rate (%)':<26} | {pre['clean_sheet_pct']:<20.1f}% | {post['clean_sheet_pct']:<20.1f}% | {round(post['clean_sheet_pct'] - pre['clean_sheet_pct'], 1):+0.1f}%")
    print(f"{'Primary Formation':<26} | {dep['primary_formation']:<20} | {list(post['top_formations'].keys())[0] if post.get('top_formations') else 'Dynamic':<20} | Shift")
    print("-" * 82)

    # Departed Star Profile
    print(f"\n👤 DEPARTED STAR BENCHMARK: {meta['player_name']} ({star.get('foot', 'Right')} foot, {star.get('height_in_cm', 180)}cm)")
    print(f"   Career Output: {star['goals_per_90']} G/90 | {star['assists_per_90']} A/90 | {star['ga_per_90']} G+A/90 | {star['minutes_per_app']} Min/Match\n")

    # Recommendations Table
    recs = dep['recommendations']
    print(f"🎯 TOP DROP-IN TACTICAL REPLACEMENTS (RANKED BY COMPOSITE MATCH SCORE)")
    print("-" * 82)
    header = f"{'#':<3} {'CANDIDATE':<20} {'CURRENT CLUB':<18} {'AGE':<4} {'VALUATION':<10} {'TACT':<6} {'FORM':<6} {'MATCH %':<8}"
    print(header)
    print("-" * 82)

    for idx, r in enumerate(recs, 1):
        name_trunc = r['name'][:19]
        club_trunc = r['current_club_name'][:17]
        val_str = format_currency(r['market_value_in_eur'])
        line = f"{idx:<3} {name_trunc:<20} {club_trunc:<18} {r['age']:<4} {val_str:<10} {r['tactical_similarity_score']:<6.1f} {r['formation_compatibility_score']:<6.1f} {r['composite_match_score']:<8.1f}%"
        print(line)

    print("-" * 82)
    if recs:
        top1 = recs[0]
        print(f"\n💡 SCOUTING RECOMMENDATION #1: {top1['name']} ({top1['current_club_name']})")
        print(f"   • Overall Fit: {top1['composite_match_score']}% Match")
        print(f"   • Financial Advantage: Costs {format_currency(top1['market_value_in_eur'])} ➔ Arbitrage Savings: {format_currency(top1['savings_eur'])} ({top1['savings_pct']}% of received fee)")
        print(f"   • Tactical Alignment: {top1['goals_per_90']} G/90 | {top1['assists_per_90']} A/90 | {top1['ga_per_90']} G+A/90 (vs Star {star['ga_per_90']})")
        print(f"   • Preferred System: {top1['top_formation']} (Club played {dep['primary_formation']})")
    print("=" * 82)

def main():
    parser = argparse.ArgumentParser(description="Tactical Void & Drop-In Replacement CLI")
    parser.add_argument('-p', '--player', type=str, help="Filter by departed player name (e.g. Bellingham, Kane, Rice, Haaland)")
    parser.add_argument('-l', '--list', action='store_true', help="List all available departures")
    args = parser.parse_args()

    engine_data = load_engine_data()
    departures = engine_data.get('departures', [])

    if args.list or (not args.player and len(sys.argv) == 1):
        print("\n⚽ AVAILABLE MARQUEE DEPARTURES IN TACTICAL ENGINE:")
        print("=" * 72)
        print(f"{'#':<3} {'PLAYER':<22} {'ORIGIN CLUB':<20} {'FEE':<12} {'YEAR'}")
        print("-" * 72)
        for i, d in enumerate(departures, 1):
            m = d['departure_meta']
            yr = m['transfer_date'].split('-')[0]
            fee = format_currency(m['transfer_fee'])
            print(f"{i:<3} {m['player_name']:<22} {m['from_club_name']:<20} {fee:<12} {yr}")
        print("=" * 72)
        print("\nRun with a player name to inspect, for example:")
        print("  python cli_explorer.py -p Bellingham")
        print("  python cli_explorer.py -p Kane")
        print("  python cli_explorer.py -p Rice\n")
        return

    query = args.player.lower()
    matches = [d for d in departures if query in d['departure_meta']['player_name'].lower()]

    if not matches:
        print(f"No marquee departure found matching '{args.player}'. Use --list to see available cases.")
        return

    for match in matches:
        render_departure_summary(match)

if __name__ == '__main__':
    main()
