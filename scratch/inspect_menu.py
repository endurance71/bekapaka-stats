import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

url = 'https://www.kalk-koszalin.com/dzial,dywizja-2,4.html'
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
}

try:
    r = requests.get(url, headers=headers, timeout=10)
    r.encoding = 'utf-8'
    soup = BeautifulSoup(r.text, 'html.parser')
    
    # Print links in menu classes if any
    for div in soup.find_all('div'):
        classes = div.get('class', [])
        if any(c in ' '.join(classes).lower() for c in ['menu', 'nav', 'sidebar', 'panel']):
            print(f"\n--- Found div with class {classes} ---")
            for a in div.find_all('a', href=True):
                print(f"  {a.get_text(strip=True)}: {urljoin('https://www.kalk-koszalin.com', a['href'])}")
except Exception as e:
    print(f"Error: {e}")
