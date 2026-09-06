import sys
sys.path.append('.')
from dotenv import load_dotenv
load_dotenv()
from db import _get_pool
try:
    with _get_pool().connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT owner_user_id, COUNT(*) FROM bots GROUP BY owner_user_id")
            rows = cur.fetchall()
            print("Postgres bot counts:")
            for r in rows:
                print(r)
except Exception as e:
    print("Postgres error:", e)
