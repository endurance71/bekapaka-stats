"""Regresje: KALK nie może importować częściowych ani starych danych po błędzie pobrania."""

import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import kalk_fetch
import kalk_scrape_gaps
import kalk_scraper


class KalkFetchTests(unittest.TestCase):
    def test_fetcher_returns_html(self):
        with patch.object(kalk_fetch.Fetcher, 'get', return_value=SimpleNamespace(status=200, body=b'<h1>OK</h1>')) as get:
            self.assertEqual(kalk_fetch.fetch_html('https://www.kalk-koszalin.com/test'), '<h1>OK</h1>')
            get.assert_called_once_with('https://www.kalk-koszalin.com/test', timeout=30, retries=2, stealthy_headers=True)

    def test_fetcher_rejects_http_error_and_empty_body(self):
        for page in (SimpleNamespace(status=503, body=b'error'), SimpleNamespace(status=200, body=b'')):
            with self.subTest(page=page), patch.object(kalk_fetch.Fetcher, 'get', return_value=page):
                with self.assertRaises(kalk_fetch.KalkFetchError):
                    kalk_fetch.fetch_html('https://www.kalk-koszalin.com/test')

    def test_fetcher_rejects_non_kalk_target(self):
        with patch.object(kalk_fetch.Fetcher, 'get') as get:
            with self.assertRaises(kalk_fetch.KalkFetchError):
                kalk_fetch.fetch_html('http://127.0.0.1/secret')
            get.assert_not_called()

    def test_gap_urls_keep_commas_inside_match_path(self):
        first = 'https://www.kalk-koszalin.com/mecz,foo,1,0.html'
        second = 'https://www.kalk-koszalin.com/mecz,bar,2,0.html'
        with patch.dict('os.environ', {'KALK_GAP_URLS': f'{first},{second}'}), patch('sys.argv', ['kalk_scrape_gaps.py']):
            self.assertEqual(kalk_scrape_gaps.collect_urls(), [first, second])

    def test_full_scrape_failure_does_not_overwrite_previous_json(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'kalk_stats.json'
            output.write_text('previous', encoding='utf-8')
            with patch.object(kalk_scraper, 'OUTPUT_FILE', output), patch.object(kalk_scraper, 'RATE_LIMIT_SECONDS', 0), patch.object(kalk_scraper, 'fetch_html', side_effect=kalk_fetch.KalkFetchError('offline')):
                with patch('sys.argv', ['kalk_scraper.py']):
                    with self.assertRaises(kalk_fetch.KalkFetchError):
                        kalk_scraper.main()
            self.assertEqual(output.read_text(encoding='utf-8'), 'previous')

    def test_maintenance_page_does_not_replace_data(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'kalk_stats.json'
            output.write_text('previous', encoding='utf-8')
            with patch.object(kalk_scraper, 'OUTPUT_FILE', output), patch.object(kalk_scraper, 'RATE_LIMIT_SECONDS', 0), patch.object(kalk_scraper, 'fetch_html', return_value='<html><title>Przerwa techniczna</title></html>'):
                with patch('sys.argv', ['kalk_scraper.py']):
                    with self.assertRaisesRegex(ValueError, 'wymaganych sekcji'):
                        kalk_scraper.main()
            self.assertEqual(output.read_text(encoding='utf-8'), 'previous')

    def test_gap_scrape_is_atomic_when_one_url_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'kalk_stats.json'
            output.write_text('previous', encoding='utf-8')
            with patch.object(kalk_scrape_gaps, 'OUTPUT_FILE', output), patch.object(kalk_scrape_gaps, 'collect_urls', return_value=['ok', 'failed']), patch.object(kalk_scrape_gaps, 'fetch_html', side_effect=['<html></html>', kalk_fetch.KalkFetchError('offline')]), patch.object(kalk_scrape_gaps, 'parse_match_page', return_value={'id': '1'}):
                with self.assertRaises(SystemExit) as result:
                    kalk_scrape_gaps.main()
            self.assertEqual(result.exception.code, 2)
            self.assertEqual(output.read_text(encoding='utf-8'), 'previous')


if __name__ == '__main__':
    unittest.main()
