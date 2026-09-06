import sys
sys.path.append('.')
from db import _sqlite_upsert_bot
try:
    _sqlite_upsert_bot(
        bot_id='gurunanak-boutique-best-boutique-in-mohali-chandigarh-amp-zirakpur-ethnic-wear-amp-bridal-couture',
        owner_user_id='test-user-id',
        name='test'
    )
    print("Success")
except Exception as e:
    print("Error:", type(e).__name__, "-", e)
