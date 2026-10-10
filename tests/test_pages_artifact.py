"""Regress the actual Pages archive and fail closed on hidden input."""
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location('pages_packager', Path(__file__).resolve().parents[1] / 'tools/package-pages-artifact.py')
PACKAGER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PACKAGER)
SHA = 'a' * 40


class PagesArtifactTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.site = self.root / 'site'
        self.site.mkdir()
        self.archive = self.root / 'artifact.tar'
        for name in PACKAGER.REQUIRED_FILES:
            self.write(name, (SHA + '\n').encode() if name == 'deployment-sha.txt' else b'{"public":true}\n')
        self.write('index.html', b'<h1>BANHALMI</h1>\n')
        self.write('hu/index.html', '<h1>Portr\u00e9</h1>\n'.encode())

    def write(self, name, data):
        target = self.site / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        return target

    def pack(self):
        return PACKAGER.package(self.site, self.archive, SHA)

    def test_preserves_discovery_and_all_visible_file_bytes(self):
        report = self.pack()
        with tarfile.open(self.archive) as archive:
            self.assertIn('./.well-known/agent.json', archive.getnames())
            for member in archive:
                if member.isfile():
                    self.assertTrue(member.name.startswith('./'))
                    self.assertEqual(archive.extractfile(member).read(), (self.site / member.name[2:]).read_bytes())
        self.assertTrue(report['byte_identity_verified'])
        self.assertEqual(report['expected_commit'], SHA)

    def test_source_is_not_changed(self):
        before = {p.relative_to(self.site): p.read_bytes() for p in self.site.rglob('*') if p.is_file()}
        self.pack()
        after = {p.relative_to(self.site): p.read_bytes() for p in self.site.rglob('*') if p.is_file()}
        self.assertEqual(before, after)

    def test_known_non_public_hidden_files_stay_excluded(self):
        self.write('.DS_Store', b'junk')
        self.write('assets/.DS_Store', b'junk')
        self.write('docs/.responsive-4k-audit-ready', b'ready')
        self.pack()
        with tarfile.open(self.archive) as archive:
            hidden_files = [m.name for m in archive if m.isfile() and any(p.startswith('.') for p in Path(m.name[2:]).parts)]
            self.assertEqual(hidden_files, ['./.well-known/agent.json'])

    def test_authority_ledgers_are_source_only_without_hiding_other_docs(self):
        # Internal evidence audit snapshots are repository documents, not public URLs.
        self.write('docs/authority-evidence-audit-ledger-20261010.json', b'{"sourceOnly": true}\n')
        self.write('docs/authority-evidence-audit-ledger-20261010.md', b'# Audit snapshot\n')
        self.write('docs/public-release-notes.md', b'# Public documentation\n')
        self.pack()
        with tarfile.open(self.archive) as archive:
            names = archive.getnames()
            self.assertNotIn('./docs/authority-evidence-audit-ledger-20261010.json', names)
            self.assertNotIn('./docs/authority-evidence-audit-ledger-20261010.md', names)
            self.assertIn('./docs/public-release-notes.md', names)
            self.assertIn('./.well-known/agent.json', names)
        self.assertTrue((self.site / 'docs/authority-evidence-audit-ledger-20261010.json').exists())
        self.assertTrue((self.site / 'docs/authority-evidence-audit-ledger-20261010.md').exists())

    def test_unknown_hidden_file_is_rejected(self):
        self.write('.env', b'not-a-real-secret')
        with self.assertRaisesRegex(ValueError, 'Unreviewed hidden'):
            self.pack()

    def test_unknown_hidden_directory_is_rejected(self):
        self.write('assets/.cache/data', b'internal')
        with self.assertRaisesRegex(ValueError, 'Unreviewed hidden'):
            self.pack()

    def test_additional_well_known_file_requires_review(self):
        self.write('.well-known/unreviewed.json', b'{}')
        with self.assertRaisesRegex(ValueError, 'Unreviewed hidden'):
            self.pack()

    def test_non_public_tree_is_rejected(self):
        self.write('.github/workflows/never-public.yml', b'name: internal')
        with self.assertRaisesRegex(ValueError, 'Non-public tree'):
            self.pack()

    def test_symlink_is_rejected(self):
        (self.site / 'external').symlink_to(self.root)
        with self.assertRaisesRegex(ValueError, 'Symlinks'):
            self.pack()

    def test_repeated_inode_is_stored_as_regular_bytes(self):
        os.link(self.site / 'index.html', self.site / 'copy.html')
        self.pack()
        with tarfile.open(self.archive) as archive:
            self.assertTrue(all(member.isfile() or member.isdir() for member in archive))
            self.assertEqual(archive.extractfile('./copy.html').read(), (self.site / 'index.html').read_bytes())

    def test_missing_discovery_file_is_rejected(self):
        (self.site / '.well-known/agent.json').unlink()
        with self.assertRaisesRegex(ValueError, 'Missing required discovery'):
            self.pack()

    def test_wrong_deployment_sha_is_rejected(self):
        self.write('deployment-sha.txt', ('b' * 40).encode())
        with self.assertRaisesRegex(ValueError, 'deployment SHA'):
            self.pack()

    def test_output_inside_site_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'outside'):
            PACKAGER.package(self.site, self.site / 'artifact.tar', SHA)

    def test_repeat_pack_is_deterministic(self):
        self.assertEqual(self.pack()['archive_sha256'], self.pack()['archive_sha256'])

    def test_tar_byte_drift_is_rejected(self):
        expected = PACKAGER.public_manifest(self.site)
        self.write('index.html', b'changed')
        self.pack()
        with self.assertRaisesRegex(ValueError, 'byte_drift'):
            PACKAGER.verify_archive(self.archive, expected)

    def test_extra_tar_member_is_rejected(self):
        self.pack()
        with tarfile.open(self.archive, 'a') as archive:
            info = tarfile.TarInfo('./unexpected.txt')
            info.size = 1
            archive.addfile(info, io.BytesIO(b'x'))
        with self.assertRaisesRegex(ValueError, 'Unexpected tar member'):
            PACKAGER.verify_archive(self.archive, PACKAGER.public_manifest(self.site))

    def test_duplicate_tar_member_is_rejected(self):
        self.pack()
        with tarfile.open(self.archive, 'a') as archive:
            info = tarfile.TarInfo('./index.html')
            info.size = 1
            archive.addfile(info, io.BytesIO(b'x'))
        with self.assertRaisesRegex(ValueError, 'duplicate tar member'):
            PACKAGER.verify_archive(self.archive, PACKAGER.public_manifest(self.site))

    def test_pages_tar_matches_official_root_shape(self):
        self.pack()
        with tarfile.open(self.archive) as archive:
            names = archive.getnames()
            self.assertEqual(names[0], '.')
            self.assertIn('./index.html', names)
            self.assertIn('./.well-known', names)
            self.assertIn('./.well-known/agent.json', names)
            self.assertNotIn('index.html', names)

    def test_official_v4_exclusion_reproduces_missing_discovery(self):
        subprocess.run(['tar', '--directory', str(self.site), '-cf', str(self.archive), '--exclude=.git', '--exclude=.github', '--exclude=.[^/]*', '.'], check=True)
        with tarfile.open(self.archive) as archive:
            self.assertNotIn('./.well-known/agent.json', archive.getnames())
            self.assertIn('./index.html', archive.getnames())


if __name__ == '__main__':
    unittest.main()
