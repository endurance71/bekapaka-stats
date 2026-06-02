import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

categories = {
    'points': 'https://www.kalk-koszalin.com/poddzial,srednie,49,pkt,,statystyki,32.html',
    'steals': 'https://www.kalk-koszalin.com/poddzial,srednie,49,prz,,statystyki,32.html',
    'blocks': 'https://www.kalk-koszalin.com/poddzial,srednie,49,bl,,statystyki,32.html',
    '3pt': 'https://www.kalk-koszalin.com/poddzial,srednie,49,proc3,,statystyki,32.html',
    'rebounds': 'https://www.kalk-koszalin.com/poddzial,srednie,49,zbiorki,,statystyki,32.html',
    'assists': 'https://www.kalk-koszalin.com/poddzial,srednie,49,asysty,,statystyki,32.html'
}

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
}

for name, url in categories.items():
    print("="*80)
    print(f"Category: {name} -> URL: {url}")
    print("="*80)
    try:
        r = requests.get(url, headers=headers, timeout=10)
        r.encoding = 'utf-8'
        soup = BeautifulSoup(r.text, 'html.parser')
        table = soup.find('table')
        if table:
            rows = table.find_all('tr')
            print(f"Rows count: {len(rows)}")
            for j, row in enumerate(rows[:5]):
                cells = [c.get_text(strip=True) for c in row.find_all(['td', 'th'])]
                print(f"Row {j}: {cells}")
        else:
            print("No table found")
    except Exception as e:
        print(f"Error: {e}")
