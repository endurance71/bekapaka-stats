import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

url = 'https://www.kalk-koszalin.com/poddzial,statystyki-indywidualne,32.html'
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
}

r = requests.get(url, headers=headers, timeout=10)
r.encoding = 'utf-8'
soup = BeautifulSoup(r.text, 'html.parser')

print("Links on stats page:")
for a in soup.find_all('a', href=True):
    href = a['href']
    text = a.get_text(strip=True)
    if 'srednie' in href or 'statystyki' in href or 'poddzial' in href:
        print(f"'{text}' -> {urljoin('https://www.kalk-koszalin.com', href)}")

print("\nForm inputs and select elements:")
for select in soup.find_all('select'):
    print(f"Select name: {select.get('name') or select.get('id')}")
    for option in select.find_all('option'):
        print(f"  Option text: '{option.get_text(strip=True)}' -> value: {option.get('value')}")
