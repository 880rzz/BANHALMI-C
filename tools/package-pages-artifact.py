#!/usr/bin/env python3
"""Package public Pages bytes, preserving allowlisted machine discovery.

This is read-only with respect to the source site. It replaces the v4 Pages
packager's unconditional dotfile exclusion, not the source integrity gate.
Every archived file is checked by name and SHA-256 after tar creation.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import tarfile
from pathlib import Path

PUBLIC_HIDDEN_FILES = frozenset({'.well-known/agent.json'})
INTERNAL_HIDDEN_FILES = frozenset({'docs/.responsive-4k-audit-ready'})
# Source-only audit snapshots must remain in Git, never in the public Pages archive.
INTERNAL_SOURCE_ONLY_FILES = frozenset({
    'docs/authority-evidence-audit-ledger-20261010.json',
    'docs/authority-evidence-audit-ledger-20261010.md',
})
FORBIDDEN_ROOTS = frozenset({'.git', '.github', 'node_modules', '_site', 'tools', 'tests', 'artifacts'})
REQUIRED_FILES = frozenset({
    'deployment-sha.txt', '.well-known/agent.json',
    'api/v1/identity.json', 'api/v1/services.json',
    'api/v1/locations.json', 'api/v1/actions.json',
})


def digest_file(path: Path) -> str:
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def public_manifest(site: Path) -> dict[str, str]:
    """Reject unknown hidden paths and links instead of publishing silently."""
    if not site.is_dir():
        raise ValueError(f'Site directory does not exist: {site}')
    manifest = {}
    for path in sorted(site.rglob('*')):
        rel = path.relative_to(site)
        name = rel.as_posix()
        if path.is_symlink():
            raise ValueError(f'Symlinks are forbidden in the Pages input: {name}')
        if rel.parts[0] in FORBIDDEN_ROOTS:
            raise ValueError(f'Non-public tree in Pages input: {name}')
        if name in INTERNAL_SOURCE_ONLY_FILES and path.is_file():
            continue
        hidden = any(part.startswith('.') for part in rel.parts)
        if hidden:
            if name in PUBLIC_HIDDEN_FILES or name == '.well-known' and path.is_dir():
                pass
            elif (path.name == '.DS_Store' or name in INTERNAL_HIDDEN_FILES) and path.is_file():
                continue
            else:
                raise ValueError(f'Unreviewed hidden path: {name}')
        if path.is_dir():
            continue
        if not path.is_file():
            raise ValueError(f'Non-regular input: {name}')
        manifest[name] = digest_file(path)
    missing = REQUIRED_FILES.difference(manifest)
    if missing:
        raise ValueError('Missing required discovery files: ' + ', '.join(sorted(missing)))
    return manifest


def archive_directories(expected: dict[str, str]) -> set[str]:
    """Return the Pages-compatible root and directory members."""
    directories = {'.'}
    for name in expected:
        parent = Path(name).parent
        while parent != Path('.'):
            directories.add('./' + parent.as_posix())
            parent = parent.parent
    return directories


def verify_archive(archive: Path, expected: dict[str, str]) -> None:
    """Check the actual deployable tar, including the Pages root layout."""
    actual = {}
    expected_dirs = archive_directories(expected)
    seen = set()
    with tarfile.open(archive, 'r:') as bundle:
        for member in bundle:
            if member.name in seen:
                raise ValueError(f'Invalid or duplicate tar member: {member.name}')
            seen.add(member.name)
            if member.isdir():
                if member.name not in expected_dirs:
                    raise ValueError(f'Unexpected tar directory: {member.name}')
                continue
            if not member.isfile():
                raise ValueError(f'Invalid tar member type: {member.name}')
            if not member.name.startswith('./'):
                raise ValueError(f'Pages tar file must use ./ root prefix: {member.name}')
            name = member.name[2:]
            if name not in expected:
                raise ValueError(f'Unexpected tar member: {member.name}')
            stream = bundle.extractfile(member)
            if stream is None:
                raise ValueError(f'Unreadable tar member: {member.name}')
            with stream:
                actual[name] = hashlib.file_digest(stream, 'sha256').hexdigest()
    missing_dirs = sorted(expected_dirs - seen)
    if missing_dirs:
        raise ValueError(f'Packed artifact missing Pages directories: {missing_dirs}')
    if actual != expected:
        missing = sorted(set(expected) - set(actual))
        drift = sorted(name for name in actual if actual[name] != expected[name])
        raise ValueError(f'Packed artifact mismatch: missing={missing}, byte_drift={drift}')


def package(site: Path, output: Path, expected_sha: str) -> dict:
    site = site.resolve(strict=True)
    output = output.resolve()
    if output.is_relative_to(site):
        raise ValueError('Archive output must be outside the public site directory')
    if not re.fullmatch(r'[0-9a-f]{40}', expected_sha):
        raise ValueError('Expected SHA must be an explicit 40-character commit ID')
    manifest = public_manifest(site)
    if (site / 'deployment-sha.txt').read_text().strip() != expected_sha:
        raise ValueError('Site deployment SHA differs from the expected commit')
    output.parent.mkdir(parents=True, exist_ok=True)
    # Match the Pages action's tar root contract: a "." root entry and "./"
    # member paths. Keep deterministic metadata and write repeated inodes as
    # regular bytes so no hard links or symbolic links reach Pages.
    with tarfile.open(output, 'w', format=tarfile.GNU_FORMAT) as bundle:
        for directory in sorted(archive_directories(manifest), key=lambda item: (item.count('/'), item)):
            info = tarfile.TarInfo(directory)
            info.type = tarfile.DIRTYPE
            info.mode = 0o755
            info.uid = info.gid = info.mtime = 0
            info.uname = info.gname = ''
            bundle.addfile(info)
        for name in sorted(manifest):
            path = site / name
            info = bundle.gettarinfo(str(path), arcname='./' + name)
            info.type = tarfile.REGTYPE
            info.linkname = ''
            info.size = path.stat().st_size
            info.uid = info.gid = info.mtime = 0
            info.uname = info.gname = ''
            with path.open('rb') as stream:
                bundle.addfile(info, stream)
    verify_archive(output, manifest)
    if public_manifest(site) != manifest:
        raise ValueError('Public input changed while the artifact was being packaged')
    return {
        'expected_commit': expected_sha,
        'public_files': len(manifest),
        'preserved_hidden_files': sorted(PUBLIC_HIDDEN_FILES),
        'archive_sha256': digest_file(output),
        'byte_identity_verified': True,
        'source_mutated': False,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--site', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--expected-sha', required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(package(args.site, args.output, args.expected_sha), indent=2))
    except (OSError, ValueError, tarfile.TarError) as error:
        parser.exit(1, f'Pages packaging failed: {error}\n')


if __name__ == '__main__':
    main()
