import requests
from bs4 import BeautifulSoup

url = 'https://www.kalk-koszalin.com/poddzial,tabela,35.html'
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
}

try:
    r = requests.get(url, headers=headers, timeout=10)
    r.encoding = 'utf-8'
    soup = BeautifulSoup(r.text, 'html.parser')
    tables = soup.find_all('table')
    print(f"Found {len(tables)} tables")
    for i, table in enumerate(tables):
        print(f"\n--- Table {i} ---")
        rows = table.find_all('tr')
        print(f"Rows count: {len(rows)}")
        for j, row in enumerate(rows[:15]):
            cells = [c.get_text(strip=True) for c in row.find_all(['td', 'th'])]
            print(f"Row {j}: {cells}")
except Exception as e:
    print(f"Error: {e}")
