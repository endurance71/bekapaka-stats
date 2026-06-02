import requests
from bs4 import BeautifulSoup

url = 'https://www.kalk-koszalin.com/poddzial,terminarz,30.html'
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
}

try:
    r = requests.get(url, headers=headers, timeout=10)
    r.encoding = 'utf-8'
    soup = BeautifulSoup(r.text, 'html.parser')
    print("="*80)
    print("Inspect divs with class pusty2 or roundUrl links:")
    # Check if there are round links
    round_links = []
    for a in soup.find_all('a', href=True):
        if 'kolejka_id=' in a['href'] or 'terminarz' in a['href'] or 'runda' in a['href']:
            round_links.append((a.get_text(strip=True), a['href']))
    print(f"Found {len(round_links)} links related to schedule/rounds:")
    for link in round_links[:20]:
        print(link)
        
    pusty2_divs = soup.find_all('div', class_='pusty2')
    print(f"Found {len(pusty2_divs)} divs of class 'pusty2'")
    for div in pusty2_divs[:5]:
        print(div.get_text(" ", strip=True))
        
    # Check if there are tables inside content
    content_div = soup.find('div', id='content') or soup.find('div', class_='content')
    if content_div:
        print("Content Div found, character length:", len(content_div.get_text()))
        # Print first 500 characters
        print(content_div.get_text(separator=' | ', strip=True)[:1000])
    else:
        print("No content div found")
        # Print body text summary
        print(soup.body.get_text(separator=' | ', strip=True)[:1000])
except Exception as e:
    print(f"Error: {e}")
