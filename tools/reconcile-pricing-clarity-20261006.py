#!/usr/bin/env python3
"""Deterministic HU/EN/DE copy reconciliation. Never changes prices or formulas.

Run --apply on a remediation branch; --check is a non-mutating regression gate.
Only existing public copy, its legacy source generators and the pricing guide
are reconciled. ART and externally stored records are never touched.
"""
from pathlib import Path
import argparse
import html
import json
import re
import sys

HERE = Path(__file__).resolve()
SCRIPT = 'tools/reconcile-pricing-clarity-20261006.py'
COPY = json.loads((HERE.parent / 'content/pricing-clarity-20261006.json').read_text())

def replace_one(text, old, new, label):
    if old == new or new in text and old not in text:
        return text
    if text.count(old) != 1:
        raise ValueError(f'{label}: expected exactly one source copy match, found {text.count(old)}')
    return text.replace(old, new, 1)

def sub_one(pattern, replacement, text, label):
    result, n = re.subn(pattern, replacement, text, flags=re.S)
    if n != 1:
        raise ValueError(f'{label}: expected one structural match, found {n}')
    return result

def reconcile(root):
    changes = {}
    literal_pairs = []
    def save(path, after):
        before = (root/path).read_text()
        if before != after:
            changes[path] = after
    for lang, d in COPY.items():
        quote = d['quote']
        q = (root/quote).read_text()
        # Matching selected category cards leaves radio values and submission fields intact.
        for key in ('art', 'event'):
            def card(m, key=key):
                body = m[0]
                body = sub_one(r'<strong>.*?</strong>', lambda _: '<strong>'+html.escape(d[key+'Title'])+'</strong>', body, quote+': category title')
                body = sub_one(r'<em>.*?</em>', lambda _: '<em>'+html.escape(d[key+'Short'])+'</em>', body, quote+': category description')
                for attr in ('aria-label', 'data-tooltip'):
                    body = sub_one(r'\b'+attr+r'="[^"]*"', lambda _,attr=attr: attr+'="'+html.escape(d[key+'Tip'], quote=True)+'"', body, quote+': tooltip')
                return body
            q = sub_one(r'<label\b[^>]*\bfor="category-'+key+r'"[^>]*>.*?</label>', card, q, quote+': category '+key)
        # Explain inclusions at the active decision, not in another FAQ or machine-only file.
        for category, copy in d['inclusions'].items():
            marker = f'<p class="microcopy" data-pricing-clarity="{category}">{html.escape(copy)}</p>'
            pattern = r'(<div\b[^>]*\bdata-panel="'+category+r'"[^>]*>)(?:<p class="microcopy" data-pricing-clarity="'+category+r'">.*?</p>)?'
            q = sub_one(pattern, lambda m: m[1]+marker, q, quote+': inclusions '+category)
        # Purpose-neutral durations also work when a personal Fine Art or nude option is chosen.
        for code, value in zip(('art60','art120','art180'), d['artDuration']):
            q = sub_one(r'(<option\b[^>]*\bvalue="'+code+r'"[^>]*>).*?(</option>)', lambda m,value=value: m[1]+html.escape(value)+m[2], q, quote+': duration '+code)
        q = sub_one(r'(<select\b[^>]*\bid="art_duration"[^>]*>.*?</select>)<p class="microcopy">.*?</p>', lambda m: m[1]+'<p class="microcopy">'+html.escape(d['artMicro'])+'</p>', q, quote+': duration explanation')
        def purpose(m):
            body = sub_one(r'<strong>.*?</strong>', lambda _: '<strong>'+html.escape(d['artGuideTitle'])+'</strong>', m[2], quote+': purpose heading')
            return m[1] + sub_one(r'<p>.*?</p>', lambda _: '<p>'+html.escape(d['artGuide'])+'</p>', body, quote+': purpose paragraph')
        q = sub_one(r'(<div\b[^>]*\bdata-panel="art"[^>]*>\s*)(<div\b[^>]*\bclass="quote-decision-guide"[^>]*>.*?</div>)', purpose, q, quote+': purpose guide')
        # Remove an accidental visible backslash-n between options, not escaped data in scripts.
        q = re.sub(r'(</label>)\\n(?=<label)', r'\1\n', q)
        if lang == 'de':
            q = q.replace('Beschreibe die Idee kurz, damit die Produktion individuell geplant werden kann.', 'Beschreiben Sie die Idee kurz, damit die Produktion individuell geplant werden kann.')
        for key in ('travel','travelHelp'):
            q = replace_one(q, d[key+'Old'], d[key], quote+': '+key)
            literal_pairs.append((d[key+'Old'], d[key]))
        save(quote, q)
        terms = (root/d['terms']).read_text()
        save(d['terms'], replace_one(terms, d['travelOld'], d['travel'], d['terms']+': travel'))
        fine = (root/d['fine']).read_text()
        fine = replace_one(fine, d['fineLeadOld'], d['fineLead'], d['fine']+': dual purpose')
        literal_pairs.append((d['fineLeadOld'], d['fineLead']))
        if 'eyebrowOld' in d:
            fine = replace_one(fine, d['eyebrowOld'], html.escape(d['eyebrow']), d['fine']+': eyebrow')
        save(d['fine'], fine)
        literal_pairs.append((d['archiveOld'],d['archiveNew']))
    # Menu entry is a gateway: no route removal or change of artistic authority.
    for file in ('assets/js/mega-menu.js', 'assets/js/mega-menu-v65-base.js'):
        text = (root/file).read_text()
        for d in COPY.values():
            text = replace_one(text, d['archiveOld'], d['archiveNew'], file+': archive boundary')
        save(file,text)
    # Describe the existing calculator without introducing another price authority.
    file = 'pricing-guide.json'
    guide = json.loads((root/file).read_text())
    guide['requiredInputsByService']['businessEventPhotography'] = list(guide['requiredInputsByService']['cLevelEventPhotography'])
    guide['conditionalInputs']['travelCountry'] = 'Ask for client-office or other non-studio locations. Listed studios have no vehicle-travel addition. Austria/Hungary use the per-vehicle component; other countries require a custom travel quote.'
    guide['inputRules'][0] = 'packageCode must resolve to pricing.json. The eventBusiness calculator code resolves to services[id=event].publicArchitecture.businessEvent and priceComponentsGrossEUR.businessEventEntry; other codes resolve to services[].packages[].code. Do not substitute C-Level pricing for Business coverage.'
    guide['calculatorPackageResolution'] = {
        'eventBusiness': {
            'canonicalPricingSource': 'https://www.norbertbanhalmi.com/pricing.json',
            'serviceId': 'event',
            'publicArchitectureKey': 'businessEvent',
            'priceComponent': 'businessEventEntry',
            'scope': 'Up to one hour of straightforward Business Event Coverage; additional team, travel and optional services follow the existing calculator and written offer.'
        }
    }
    guide['dateModified'] = '2026-10-06'
    save(file, json.dumps(guide,ensure_ascii=False,indent=2)+'\n')
    file = 'project-policy.json'
    policy = json.loads((root/file).read_text())
    policy['commercialInterpretation']['travel'] = 'For portrait, branding, Fine Art and corporate-event bookings, the selected package covers the agreed photographic work. Studio sessions in Vienna or Budapest have no travel surcharge. For a client office or another venue, travel and any venue costs are separate items in the estimate and final written offer. Private celebrations include local travel within Vienna or Budapest. Enter the exact venue address and select its area; outside these cities the standard travel rules apply. Venue hire and optional production services are not included.'
    policy['dateModified'] = '2026-10-06'
    save(file, json.dumps(policy,ensure_ascii=False,indent=2)+'\n')
    # Reconcile literal legacy generators rather than adding a runtime override.
    # Tests are never changed here, and the correction cannot write outside the C checkout.
    for directory in ('tools','scripts'):
        for p in (root/directory).rglob('*'):
            if not p.is_file() or p.suffix not in ('.js','.mjs','.cjs','.py') or p.name==HERE.name:
                continue
            if not re.match(r'(generate|apply|restore|simplify|harden|remediate|optimize)',p.name):
                continue
            before=p.read_text(); after=before
            for old,new in literal_pairs:
                after=after.replace(old,new)
                after=after.replace(json.dumps(old,ensure_ascii=True)[1:-1],json.dumps(new,ensure_ascii=True)[1:-1])
            if after!=before:changes[str(p.relative_to(root))]=after
    package = root/'package.json'
    if package.exists():
        data=json.loads(package.read_text())
        check='python3 '+SCRIPT+' --check'
        if check not in data['scripts']['test']:
            data['scripts']['test']=check+' && '+data['scripts']['test']
        save('package.json',json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    # Monetary truth is read-only; no formula, price table, IDs, tax rate or conversion changes.
    prices=json.loads((root/'pricing.json').read_text())
    expected={'headshotCvGross':120,'individualQuick30':220,'individualGuided60':420,'individualGuided120':690,'brandFastOneHour':499,'brandTwoHours':790,'fineArtOneHour':690,'fineArtTwoHours':990,'fineArtThreeHours':1290,'businessEventEntry':490,'eventOneHour':590,'travelPerVehicleGross':240,'retouchedImagePortrait':35,'retouchedImageFineArt':45,'retouchedImageGroup':29}
    for key,value in expected.items():
        if prices['priceComponentsGrossEUR'][key]!=value:
            raise ValueError('Approved price changed; review copy before proceeding: '+key)
    return changes

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    mode=ap.add_mutually_exclusive_group(required=True)
    mode.add_argument('--apply',action='store_true');mode.add_argument('--check',action='store_true')
    ap.add_argument('--root',type=Path,default=HERE.parent.parent)
    args=ap.parse_args();root=args.root.resolve()
    if not (root/'pricing.json').exists() or not (root/'requestaquote/index.html').exists():
        raise ValueError('Not the BANHALMI-C source tree')
    changes=reconcile(root)
    if args.check:
        if changes:raise ValueError('Content parity regression in: '+', '.join(changes))
        print('Pricing clarity: HU/EN/DE purpose, inclusions, travel and machine routing PASS; prices unchanged.')
    else:
        for name,text in changes.items():(root/name).write_text(text)
        print(json.dumps({'modified':list(changes),'count':len(changes)},ensure_ascii=False))
    return 0

if __name__=='__main__':
    try:sys.exit(main())
    except (ValueError,KeyError,OSError) as e:
        print(str(e),file=sys.stderr);sys.exit(1)
