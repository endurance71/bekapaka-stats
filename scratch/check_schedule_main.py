import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
}

regular_url = 'https://www.kalk-koszalin.com/poddzial,terminarz-dywizja-2,36.html'
playoff_url = 'https://www.kalk-koszalin.com/poddzial,terminarz,30.html'

def get_kolejka_links(url):
    r = requests.get(url, headers=headers, timeout=10)
    r.encoding = 'utf-8'
    soup = BeautifulSoup(r.text, 'html.parser')
    links = []
    for a in soup.find_all('a', href=True):
        if 'kolejka_id=' in a['href']:
            links.append((a.get_text(strip=True), urljoin('https://www.kalk-koszalin.com', a['href'])))
    return links

print("Links on Regular Schedule page:")
reg_links = get_kolejka_links(regular_url)
print(f"Total: {len(reg_links)}")
for label, link in reg_links[:10]:
    print(f" - {label}: {link}")

print("\nLinks on Playoff Schedule page:")
play_links = get_kolejka_links(playoff_url)
print(f"Total: {len(play_links)}")
for label, link in play_links[:10]:
    print(f" - {label}: {link}")
