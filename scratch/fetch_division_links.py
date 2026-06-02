import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

url = 'https://www.kalk-koszalin.com/dzial,dywizja-2,4.html'
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
}

r = requests.get(url, headers=headers, timeout=10)
r.encoding = 'utf-8'
soup = BeautifulSoup(r.text, 'html.parser')

links = []
for a in soup.find_all('a', href=True):
    href = a['href']
    text = a.get_text(strip=True)
    if 'tabela' in text.lower() or 'tabela' in href.lower():
        links.append((text, urljoin('https://www.kalk-koszalin.com', href)))

print(f"Links found on Division 2 page:")
for text, l in links:
    print(f"'{text}' -> {l}")
