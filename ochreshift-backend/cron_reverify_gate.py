import os
import psycopg
from psycopg.rows import dict_row

def enforce_24h_reverification():
    db_url = os.getenv("APP_DATABASE_URL") or os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not set, skipping reverification enforcement.")
        return

    try:
        with psycopg.connect(db_url) as conn:
            with conn.cursor() as cur:
                # Find users who are > 24h old, whose email is currently 'verified'
                # but who haven't been forced to reverify yet.
                query = """
                SELECT u.id 
                FROM "user" u
                LEFT JOIN email_campaign_logs l ON u.id = l.user_id AND l.campaign_stage = 'reverification_enforced'
                WHERE (now() - u."createdAt") > interval '24 hours'
                  AND u."emailVerified" = true
                  AND l.id IS NULL
                """
                cur.execute(query)
                users_to_reverify = cur.fetchall()

                for (user_id,) in users_to_reverify:
                    print(f"Enforcing 24h re-verification for user {user_id}")
                    # 1. Reset email verification status
                    cur.execute('UPDATE "user" SET "emailVerified" = false WHERE id = %s', (user_id,))
                    # 2. Mark as enforced so we don't reset them again after they re-verify
                    cur.execute("INSERT INTO email_campaign_logs (user_id, campaign_stage) VALUES (%s, 'reverification_enforced')", (user_id,))
                
                conn.commit()
                print(f"Processed {len(users_to_reverify)} users.")

    except Exception as e:
        print(f"Error enforcing reverification: {e}")

if __name__ == "__main__":
    print("Running 24h Re-verification Gate...")
    enforce_24h_reverification()
    print("Done.")
