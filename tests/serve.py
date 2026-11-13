"""Test server with room for several browsers at once. Usage: python3 tests/serve.py <port>"""
import sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
class Server(ThreadingHTTPServer):
    request_queue_size=256
Server(("127.0.0.1",int(sys.argv[1])),Quiet).serve_forever()
