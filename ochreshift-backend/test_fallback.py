import sys
sys.path.append('.')
from db import upsert_bot
try:
    upsert_bot(
        bot_id='gurunanak-boutique-best-boutique-in-mohali-chandigarh-amp-zirakpur-ethnic-wear-amp-bridal-couture',
        owner_user_id='test-user-id',
        name='test',
        accent='#ffffff',
        welcome='welcome',
        suggestions=['1'],
        allowed_domains=['*']
    )
    print("Success")
except Exception as e:
    print("Error:", type(e).__name__, "-", e)
