"""
Master Entry Point: Tactical Void & Drop-In Replacement Engine
==============================================================
Usage:
  python run_tactical_engine.py          # Runs end-to-end demo inspection
  python run_tactical_engine.py --cli    # Launches interactive CLI explorer
  python run_tactical_engine.py --serve  # Launches web dashboard
  python run_tactical_engine.py --build  # Re-compiles dataset from CSVs
"""

import os
import sys
import subprocess

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

CUR_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_JSON = os.path.join(CUR_DIR, 'tactical_engine_data.json')

def main():
    args = sys.argv[1:]

    if '--build' in args:
        print("[*] Rebuilding tactical engine data from raw CSVs...")
        subprocess.run([sys.executable, os.path.join(CUR_DIR, 'build_engine_data.py')])
        return

    if '--serve' in args:
        print("[*] Launching web dashboard server...")
        subprocess.run([sys.executable, os.path.join(CUR_DIR, 'serve_engine.py')])
        return

    if '--cli' in args:
        subprocess.run([sys.executable, os.path.join(CUR_DIR, 'cli_explorer.py')] + [a for a in args if a != '--cli'])
        return

    # Default action: check if data exists, if not build it, then run demo
    if not os.path.exists(DATA_JSON):
        print("[*] Tactical database not found. Compiling first...")
        subprocess.run([sys.executable, os.path.join(CUR_DIR, 'build_engine_data.py')])

    print("\n" + "=" * 76)
    print(" ⚽ TACTICAL VOID & DROP-IN REPLACEMENT ENGINE: DEMO RUN")
    print("=" * 76)
    # Run CLI demonstration on Jude Bellingham and Harry Kane
    subprocess.run([sys.executable, os.path.join(CUR_DIR, 'cli_explorer.py'), '-p', 'Bellingham'])
    subprocess.run([sys.executable, os.path.join(CUR_DIR, 'cli_explorer.py'), '-p', 'Kane'])

    print("\n" + "=" * 76)
    print(" 🌟 NEXT STEPS TO EXPLORE:")
    print("   1. Run Interactive CLI:")
    print("      python tactical_replacement_engine/cli_explorer.py -p Haaland")
    print("      python tactical_replacement_engine/cli_explorer.py -p Rice")
    print("   2. Launch Interactive Web Dashboard:")
    print("      python tactical_replacement_engine/serve_engine.py")
    print("=" * 76 + "\n")

if __name__ == '__main__':
    main()
