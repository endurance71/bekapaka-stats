import requests
from bs4 import BeautifulSoup

url = 'https://www.kalk-koszalin.com/poddzial,statystyki-indywidualne,32.html'
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
}

try:
    r = requests.get(url, headers=headers, timeout=10)
    r.encoding = 'utf-8'
    soup = BeautifulSoup(r.text, 'html.parser')
    
    print("Select boxes:")
    for select in soup.find_all('select'):
        print(f"Name: {select.get('name')}, Id: {select.get('id')}")
        for option in select.find_all('option'):
            print(f"  - {option.get_text(strip=True)} (value: {option.get('value')})")
            
    print("\nButtons or other inputs:")
    for button in soup.find_all(['button', 'input']):
        print(f"Type: {button.get('type')}, Name: {button.get('name')}, Value: {button.get('value')}")
except Exception as e:
    print(f"Error: {e}")
