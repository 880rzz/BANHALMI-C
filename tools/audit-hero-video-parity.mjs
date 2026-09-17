import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const pages = ['index.html', 'hu/index.html', 'de-at/index.html'];
const failures = [];

for (const relative of pages) {
  const html = fs.readFileSync(path.join(root, relative), 'utf8');
  const videos = html.match(/<video\b[^>]*class="hero-video"[^>]*>[\s\S]*?<\/video>/g) || [];
  if (videos.length !== 1) {
    failures.push(`${relative}: expected one hero video, found ${videos.length}`);
    continue;
  }
  const video = videos[0];
  if (!/preload="none"/.test(video)) failures.push(`${relative}: hero video must use preload="none"`);
  if (/\sautoplay(?:\s|=|>)/.test(video)) failures.push(`${relative}: hero video must not autoplay`);
  if (/\sposter=/.test(video)) failures.push(`${relative}: duplicate poster request must not be present`);
  if (!/muted/.test(video) || !/playsinline/.test(video) || !/loop/.test(video)) failures.push(`${relative}: muted, playsinline and loop are required`);
  if (!/data-src="\/assets\/video\/hero-signature\.webm"/.test(video)) failures.push(`${relative}: lazy WebM source missing`);
  if (!/data-src="\/assets\/video\/hero-signature\.mp4"/.test(video)) failures.push(`${relative}: lazy MP4 source missing`);
  if (/<source\s+src=/.test(video)) failures.push(`${relative}: video sources must not have eager src attributes`);
  if (video.indexOf('hero-signature.webm') > video.indexOf('hero-signature.mp4')) failures.push(`${relative}: WebM must precede MP4`);
  if (!html.includes('data-banhalmi-lcp-preload')) failures.push(`${relative}: responsive hero image preload missing`);
  if (!html.includes('hero-signature-640.avif')) failures.push(`${relative}: responsive AVIF hero source missing`);
}

for (const asset of ['assets/video/hero-signature.webm', 'assets/video/hero-signature.mp4']) {
  const full = path.join(root, asset);
  if (!fs.existsSync(full)) failures.push(`${asset}: file missing`);
}

const js = fs.readFileSync(path.join(root, 'assets/js/main.js'), 'utf8');
for (const token of ["source[data-src]", "source.src=source.getAttribute('data-src')", 'video.load()', "prefers-reduced-motion: reduce", "mouseenter", "is-tapped"]) {
  if (!js.includes(token)) failures.push(`assets/js/main.js: lazy hero-video token missing: ${token}`);
}
const css = fs.readFileSync(path.join(root, 'assets/css/style.css'), 'utf8');
if (!css.includes('@media (hover:hover) and (prefers-reduced-motion: no-preference)')) failures.push('assets/css/style.css: desktop hover rule missing');
if (!css.includes('@media (hover:none) and (prefers-reduced-motion: no-preference)')) failures.push('assets/css/style.css: touch interaction rule missing');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Hero video parity and performance audit passed for EN, HU and DE homepages.');
