"""Skraper KALK v2 (kalk-koszalin.com po redesignie SportSync).

Moduły parsują pojedyncze strony do słowników zgodnych z `docs/kalk-v2-contract.md`;
`pipeline.py` składa je w plik sezonu, `validate.py` pilnuje inwariantów przed zapisem.
Pobieranie wyłącznie przez Scrapling (`kalk.http`).
"""

from .common import PARSER_VERSION, CONTRACT_VERSION  # noqa: F401
