import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

url = 'https://www.kalk-koszalin.com/poddzial,statystyki-indywidualne,32.html'
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
}

try:
    r = requests.get(url, headers=headers, timeout=10)
    r.encoding = 'utf-8'
    soup = BeautifulSoup(r.text, 'html.parser')
    
    print("ALL Links on stats page:")
    links_seen = set()
    for a in soup.find_all('a', href=True):
        href = a['href']
        text = a.get_text(strip=True)
        full_url = urljoin('https://www.kalk-koszalin.com', href)
        if full_url not in links_seen:
            links_seen.add(full_url)
            # print if it looks like a stat page or section
            if any(k in href.lower() or k in text.lower() for k in ['statystyki', 'ranking', 'poddzial', 'dzial']):
                print(f" - {text}: {full_url}")
except Exception as e:
    print(f"Error: {e}")
