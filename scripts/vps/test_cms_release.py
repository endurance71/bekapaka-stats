import importlib.util
import os
import sqlite3
import tempfile
import unittest
from pathlib import Path


SPEC = importlib.util.spec_from_file_location('cms_release', Path(__file__).with_name('cms-release.py'))
cms_release = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(cms_release)


class CmsReleaseTests(unittest.TestCase):
    def test_backup_preserves_live_sqlite_and_uploads(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            project = root / 'project'
            db = project / 'data/cms-data/data.db'
            db.parent.mkdir(parents=True)
            with sqlite3.connect(db) as connection:
                connection.execute('CREATE TABLE entries (value TEXT)')
                connection.execute("INSERT INTO entries VALUES ('content')")
            uploads = project / 'data/cms-uploads'
            uploads.mkdir()
            (uploads / 'photo.txt').write_text('image', encoding='utf-8')

            target = cms_release.backup(project, root / 'backups')
            with sqlite3.connect(target / 'data.db') as copy:
                self.assertEqual(copy.execute('SELECT value FROM entries').fetchone()[0], 'content')
            self.assertTrue((target / 'cms-uploads.tar.gz').is_file())
            self.assertEqual((target / 'data.db').stat().st_mode & 0o777, 0o600)
            self.assertEqual(target.stat().st_mode & 0o777, 0o700)

    def test_pin_keeps_other_environment_values_private(self):
        with tempfile.TemporaryDirectory() as directory:
            project = Path(directory)
            env = project / '.env'
            env.write_text('SECRET=keep-this\nBKPK_CMS_IMAGE_TAG=old\n', encoding='utf-8')
            os.chmod(env, 0o600)
            cms_release.pin_tag(project, 'a' * 40)
            self.assertEqual(env.read_text(encoding='utf-8'), f'SECRET=keep-this\nBKPK_CMS_IMAGE_TAG={"a" * 40}\n')
            self.assertEqual(env.stat().st_mode & 0o777, 0o600)
            with self.assertRaises(ValueError):
                cms_release.pin_tag(project, 'latest')
