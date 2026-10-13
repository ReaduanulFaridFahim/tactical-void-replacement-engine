"""
Tactical Replacement Engine Web Server
--------------------------------------
Serves the interactive dashboard locally on a free port
and automatically opens the default web browser.
"""

import os
import sys
import socket
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class EngineHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def find_free_port(start_port=8085):
    for port in range(start_port, start_port + 20):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('127.0.0.1', port))
                return port
            except OSError:
                continue
    return start_port

def run():
    port = find_free_port()
    server_address = ('127.0.0.1', port)
    httpd = HTTPServer(server_address, EngineHandler)
    url = f"http://127.0.0.1:{port}/"
    print("=" * 70)
    print("⚽ TACTICAL VOID & DROP-IN REPLACEMENT ENGINE DASHBOARD")
    print(f"🌐 Serving locally at: {url}")
    print(f"📁 Directory: {DIRECTORY}")
    print("=" * 70)
    print("🚀 Opening dashboard in your default browser...")
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"Could not open browser automatically: {e}")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == '__main__':
    run()
