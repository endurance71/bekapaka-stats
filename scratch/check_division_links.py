import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, htmllike Gecko) Chrome/125.0.0.0 Safari/537.36'
}

division_url = 'https://www.kalk-koszalin.com/dzial,dywizja-2,4.html'
r = requests.get(division_url, headers=headers, timeout=10)
r.encoding = 'utf-8'
soup = BeautifulSoup(r.text, 'html.parser')

print("Anchors on Division page:")
for a in soup.find_all('a', href=True):
    href = a['href']
    text = a.get_text(strip=True)
    if 'tabela' in text.lower() or 'terminarz' in text.lower() or 'statystyki' in text.lower():
        print(f" - {text}: {urljoin('https://www.kalk-koszalin.com', href)}")
