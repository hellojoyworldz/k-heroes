import socket
import threading
import sys

def pipe(src, dst):
    try:
        while True:
            data = src.recv(4096)
            if not data:
                break
            dst.sendall(data)
    except:
        pass
    finally:
        try:
            src.close()
        except:
            pass
        try:
            dst.close()
        except:
            pass

def handle(client):
    try:
        # Use IPv6 or IPv4 depending on resolution (socket.create_connection does both automatically)
        remote = socket.create_connection(('db.bcahamsybviciwqbqgyp.supabase.co', 5432))
    except Exception as e:
        print(f"[TUNNEL] Failed to connect to Supabase: {e}", file=sys.stderr)
        client.close()
        return
    threading.Thread(target=pipe, args=(client, remote), daemon=True).start()
    threading.Thread(target=pipe, args=(remote, client), daemon=True).start()

def main():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        server.bind(('127.0.0.1', 5433))
    except Exception as e:
        print(f"[TUNNEL] Error binding to local port 5433: {e}", file=sys.stderr)
        sys.exit(1)
    
    server.listen(100)
    print("[TUNNEL] Started. listening on localhost:5433 -> db.bcahamsybviciwqbqgyp.supabase.co:5432")
    sys.stdout.flush()
    
    while True:
        try:
            client, _ = server.accept()
            handle(client)
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"[TUNNEL] Error accepting connection: {e}", file=sys.stderr)

if __name__ == '__main__':
    main()
