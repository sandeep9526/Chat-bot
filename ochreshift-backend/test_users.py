import os
from dotenv import load_dotenv
load_dotenv()
from db import _get_pool

def run():
    pool = _get_pool()
    with pool.connection() as conn, conn.cursor() as cur:
        cur.execute('SELECT email, "emailVerified" FROM "user" LIMIT 10')
        print(cur.fetchall())

run()
