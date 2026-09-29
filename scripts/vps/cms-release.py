#!/usr/bin/env python3
"""Bezpieczny backup CMS i przypięcie sprawdzonego obrazu na VPS BeKaPaKa."""

import argparse
import hashlib
import os
import re
import sqlite3
import tarfile
import tempfile
from pathlib import Path


DEFAULT_PROJECT = Path('/opt/bekapaka-stats')
DEFAULT_BACKUPS = Path('/home/debian/backups')


def backup(project: Path, backups: Path) -> Path:
    db = project / 'data/cms-data/data.db'
    uploads = project / 'data/cms-uploads'
    if not db.is_file() or not uploads.is_dir():
        raise RuntimeError('Brak bazy SQLite lub katalogu uploadów CMS; nie wdrażaj nowego obrazu')
    backups.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(backups, 0o700)
    target = Path(tempfile.mkdtemp(prefix='bekapaka-cms-', dir=backups))
    os.chmod(target, 0o700)
    db_copy = target / 'data.db'
    archive = target / 'cms-uploads.tar.gz'
    with sqlite3.connect(f'file:{db}?mode=ro', uri=True) as source:
        with sqlite3.connect(db_copy) as destination:
            source.backup(destination)
            check = destination.execute('PRAGMA quick_check').fetchone()[0]
            if check != 'ok':
                raise RuntimeError(f'Kopia SQLite nie przeszła quick_check: {check}')
    os.chmod(db_copy, 0o600)
    with tarfile.open(archive, 'w:gz') as handle:
        handle.add(uploads, arcname='cms-uploads')
    os.chmod(archive, 0o600)
    with tarfile.open(archive, 'r:gz') as handle:
        if not handle.getmembers():
            raise RuntimeError('Archiwum uploadów CMS jest puste')
    for artifact in (db_copy, archive):
        digest = hashlib.sha256(artifact.read_bytes()).hexdigest()
        print(f'{artifact.name} sha256={digest}')
    return target


def pin_tag(project: Path, tag: str) -> None:
    if not re.fullmatch(r'[0-9a-f]{40}', tag):
        raise ValueError('Tag CMS musi być pełnym SHA commita (40 znaków)')
    env_path = project / '.env'
    if env_path.is_symlink() or not env_path.is_file():
        raise RuntimeError('Brak zwykłego pliku .env na VPS')
    original = env_path.read_text(encoding='utf-8')
    lines = [line for line in original.splitlines() if not line.startswith('BKPK_CMS_IMAGE_TAG=')]
    lines.append(f'BKPK_CMS_IMAGE_TAG={tag}')
    fd, temp_name = tempfile.mkstemp(prefix='.env.cms-', dir=project)
    try:
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, 'w', encoding='utf-8') as handle:
            handle.write('\n'.join(lines) + '\n')
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_name, env_path)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['backup', 'pin'])
    parser.add_argument('tag', nargs='?')
    parser.add_argument('--project-dir', type=Path, default=DEFAULT_PROJECT)
    parser.add_argument('--backup-root', type=Path, default=DEFAULT_BACKUPS)
    args = parser.parse_args()
    if args.action == 'backup':
        print(f'Zweryfikowany backup CMS: {backup(args.project_dir, args.backup_root)}')
    else:
        if not args.tag:
            parser.error('pin wymaga tagu SHA')
        pin_tag(args.project_dir, args.tag)
        print('Przypięto sprawdzony obraz CMS w .env')


if __name__ == '__main__':
    main()
