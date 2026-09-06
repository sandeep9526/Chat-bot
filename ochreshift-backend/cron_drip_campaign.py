import os
import psycopg
from psycopg.rows import dict_row
from notifications import send_email

# Shared db connection logic or inline
def get_db_url():
    return os.getenv("APP_DATABASE_URL") or os.getenv("DATABASE_URL")

def check_and_send_drip_campaigns():
    db_url = get_db_url()
    if not db_url:
        print("DATABASE_URL not set, skipping drip campaign.")
        return

    try:
        with psycopg.connect(db_url) as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                # Create table if it doesn't exist (since it's not run by default migrations)
                cur.execute("""
                CREATE TABLE IF NOT EXISTS email_campaign_logs (
                  id BIGSERIAL PRIMARY KEY,
                  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                  campaign_stage TEXT NOT NULL,
                  sent_at TIMESTAMPTZ DEFAULT now(),
                  UNIQUE(user_id, campaign_stage)
                );
                """)
                conn.commit()

                # Get users who don't have bots
                # And their account age
                query = """
                SELECT 
                    u.id, u.email, u.name, 
                    EXTRACT(DAY FROM (now() - u."createdAt")) AS days_since_signup
                FROM "user" u
                LEFT JOIN bots b ON u.id = b.owner_user_id
                WHERE b.bot_id IS NULL
                """
                cur.execute(query)
                users_without_bots = cur.fetchall()

                for user in users_without_bots:
                    days = int(user["days_since_signup"])
                    user_id = user["id"]
                    email = user["email"]
                    name = user["name"] or "there"

                    stage_to_send = None

                    if days == 0:
                        stage_to_send = "welcome_ready"
                    elif days == 1:
                        stage_to_send = "day_1_reminder"
                    elif days == 2:
                        stage_to_send = "day_2_negative"
                    elif days == 5:
                        stage_to_send = "day_5_offer"

                    if stage_to_send:
                        # Check if already sent
                        cur.execute("SELECT 1 FROM email_campaign_logs WHERE user_id = %s AND campaign_stage = %s", (user_id, stage_to_send))
                        if not cur.fetchone():
                            # Send email
                            print(f"Sending {stage_to_send} to {email}")
                            
                            subject = ""
                            body = ""
                            if stage_to_send == "welcome_ready":
                                subject = "Welcome to Ochreshift! Ready to create an agent?"
                                body = f"Hi {name},<br><br>Welcome! You haven't created your first agent yet. It only takes a minute."
                            elif stage_to_send == "day_1_reminder":
                                subject = "Don't miss out on automating your support"
                                body = f"Hi {name},<br><br>We noticed you still haven't set up your agent. Create one today to see the magic."
                            elif stage_to_send == "day_2_negative":
                                subject = "Are you giving up on 24/7 customer support?"
                                body = f"Hi {name},<br><br>Your competitors are automating their support. Don't fall behind. Setup your agent now."
                            elif stage_to_send == "day_5_offer":
                                subject = "Special Offer: Extended Free Trial!"
                                body = f"Hi {name},<br><br>We want you to succeed. Here is a special extended trial if you create an agent today."

                            # Actually send the email using existing notifications.py logic
                            html_body = f"<html><body>{body}</body></html>"
                            send_email(email, subject, html_body)

                            # Log it
                            cur.execute("INSERT INTO email_campaign_logs (user_id, campaign_stage) VALUES (%s, %s)", (user_id, stage_to_send))
                            conn.commit()

    except Exception as e:
        print(f"Error running drip campaigns: {e}")

if __name__ == "__main__":
    print("Running Drip Campaigns...")
    check_and_send_drip_campaigns()
    print("Done.")
