#!/usr/bin/env node
/**
 * Download official Pikafish Android arm64 binary + NNUE into the local Expo module.
 * Usage: npm run fetch-pikafish-assets
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const MODULE = path.join(ROOT, 'modules/pikafish-engine');
const VENDOR = path.join(MODULE, 'vendor');
const JNI = path.join(MODULE, 'android/src/main/jniLibs/arm64-v8a');
const ASSETS = path.join(MODULE, 'android/src/main/assets');

// Pin a known release; bump when upgrading the engine.
const RELEASE_TAG = '2024-12-06';
const BASE = `https://github.com/official-pikafish/Pikafish/releases/download/${RELEASE_TAG}`;
const FILES = {
  android: `${BASE}/pikafish-android-armv8.tar`,
  nnue: `${BASE}/pikafish.nnue`,
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = (u) => {
      https
        .get(u, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            get(res.headers.location);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} for ${u}`));
            return;
          }
          res.pipe(file);
          file.on('finish', () => file.close(() => resolve()));
        })
        .on('error', reject);
    };
    get(url);
  });
}

function findBinary(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory() && !name.startsWith('.')) {
      const hit = findBinary(p);
      if (hit) return hit;
    } else if (st.isFile() && st.size > 500_000 && !name.endsWith('.nnue') && !name.endsWith('.tar')) {
      return p;
    }
  }
  return null;
}

async function main() {
  fs.mkdirSync(VENDOR, { recursive: true });
  fs.mkdirSync(JNI, { recursive: true });
  fs.mkdirSync(ASSETS, { recursive: true });

  const tarPath = path.join(VENDOR, 'pikafish-android-armv8.tar');
  const nnuePath = path.join(ASSETS, 'pikafish.nnue');
  const soPath = path.join(JNI, 'libpikafish.so');

  if (!fs.existsSync(nnuePath) || fs.statSync(nnuePath).size < 1_000_000) {
    console.log('Downloading pikafish.nnue…');
    await download(FILES.nnue, nnuePath);
    console.log(`  → ${nnuePath} (${(fs.statSync(nnuePath).size / 1e6).toFixed(1)} MB)`);
  } else {
    console.log('NNUE already present, skip.');
  }

  if (!fs.existsSync(soPath) || fs.statSync(soPath).size < 100_000) {
    console.log('Downloading Android arm64 binary…');
    await download(FILES.android, tarPath);
    execFileSync('tar', ['-xf', tarPath, '-C', VENDOR], { stdio: 'inherit' });
    const found = findBinary(VENDOR);
    if (!found) throw new Error('Could not find binary inside tar');
    fs.copyFileSync(found, soPath);
    console.log(`  → ${soPath}`);
  } else {
    console.log('Binary already present, skip.');
  }

  console.log('Done. Rebuild with: npx expo run:android');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
