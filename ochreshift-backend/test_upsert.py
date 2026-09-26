import sys
from dotenv import load_dotenv
load_dotenv()
from db import upsert_bot
try:
    upsert_bot("test_bot_123", "gX3IMA4e4HZA5A5QNcKyxPF1mAY1ssNY", "Test Bot", None, None, None, None, None, None, None, None, None, None)
    print("Success")
except Exception as e:
    import traceback
    traceback.print_exc()
