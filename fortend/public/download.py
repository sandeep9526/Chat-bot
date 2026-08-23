import urllib.request
import re

url = 'https://drive.google.com/uc?export=download&id=1s-LAnb_TZoumlb54WI0DJA-VHpBnJX_S'

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    response = urllib.request.urlopen(req)
    html = response.read().decode('utf-8')
    # Find confirm token
    match = re.search(r'confirm=([&a-zA-Z0-9_-]+)', html)
    if match:
        confirm_token = match.group(1)
        print("Found token:", confirm_token)
        url += f'&confirm={confirm_token}'
        urllib.request.urlretrieve(url, 'demo.mp4')
        print("Downloaded demo.mp4")
    else:
        print("No token found. HTML:")
        print(html[:500])
except Exception as e:
    print(e)
