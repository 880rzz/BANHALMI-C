#!/usr/bin/env python3
"""Apply an immutable, pre-reviewed text delta to the owned remediation branch."""
import base64,hashlib,json,os,subprocess,zlib
from pathlib import Path
BASE='a2beb5a5d067803aa6df83c38acb8d3e6a95c68c'
BRANCH='fix/pricing-content-parity-20261006'
DIGEST='7832c1fe4532e4a105de42d28663f29bbe5c9d3333dcec04c3e54e649619f7e6'
HERE=Path(__file__).resolve().parent
root=Path.cwd().resolve()
encoded=''.join((HERE/('private-city.patch.'+str(i))).read_text().strip() for i in range(4))
raw=zlib.decompress(base64.b64decode(encoded,validate=True))
assert hashlib.sha256(raw).hexdigest()==DIGEST,'Reviewed patch digest mismatch'
d=json.loads(raw)
assert d['repository']=='880rzz/BANHALMI-C' and d['base']==BASE and d['branch']==BRANCH
assert os.environ['GITHUB_REPOSITORY']==d['repository']
assert os.environ['GITHUB_REF']=='refs/heads/'+BRANCH
subprocess.run(['git','merge-base','--is-ancestor',BASE,'HEAD'],check=True)
sha=lambda s:hashlib.sha256(s).hexdigest()
def digest(rows):return sha(json.dumps(rows,separators=(',',':')).encode())
before=[];after=[];out={}
for name,hunks in d['files']:
 p=Path(name)
 assert not p.is_absolute() and '..' not in p.parts and '.git' not in p.parts and '.github' not in p.parts
 assert p.suffix in ('.html','.js','.mjs','.json','.py'),name
 path=root/p
 assert not path.is_symlink() and path.resolve().is_relative_to(root),name
 if name in d['new']:
  assert not path.exists(),name+' unexpectedly exists'
  text='';before.append([name,None])
 else:
  text=path.read_text();before.append([name,sha(path.read_bytes())])
 last=0
 for start,end,_ in hunks:
  assert last<=start<=end<=len(text),name+' invalid hunk'
  last=end
 for start,end,replace in reversed(hunks):text=text[:start]+replace+text[end:]
 out[name]=text;after.append([name,sha(text.encode())])
assert digest(before)==d['before'],'Source content drift; no files written'
assert digest(after)==d['after'],'Result digest mismatch; no files written'
for name,text in out.items():
 p=root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
print(json.dumps({'base':BASE,'files':list(out),'beforeDigest':d['before'],'afterDigest':d['after'],'status':'byte-verified'},indent=2))
