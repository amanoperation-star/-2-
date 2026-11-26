import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const apkDistDir = path.join(rootDir, 'dist-apk');

// Essential core audio files bundled directly inside the APK (~7 MB total)
// All additional Sheikh Adhans, Ruqyah, and Adhkar remain downloadable on demand from Settings -> "حفظ بدون نت"
const ESSENTIAL_APK_AUDIO_FILES = new Set([
  'adhan-makkah.mp3',
  'adhan-madinah.mp3',
  'adhan-fajr-makkah.mp3',
  'adhan-fajr-madinah.mp3',
  'dua-shaarawy.mp3',
  'dua-after-adhan.mp3',
  'iqama-classic.mp3',
  'prayer-alert-mishary.mp3',
  'salawat-mishary.mp3',
  'salawat-dosari.mp3',
  'salawat-muaiqly.mp3',
  'salawat-naqshabandi.mp3',
  'salawat-naqshabandi-radio.mp3',
]);

function removeEmptyDirs(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const fullSub = path.join(dirPath, entry.name);
      removeEmptyDirs(fullSub);
      if (fs.readdirSync(fullSub).length === 0) {
        fs.rmdirSync(fullSub);
      }
    }
  }
}

function walkFiles(dirPath, list = []) {
  if (!fs.existsSync(dirPath)) return list;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, list);
    } else {
      list.push(fullPath);
    }
  }
  return list;
}

if (!fs.existsSync(distDir)) {
  console.error('Error: dist/ directory not found. Run "npm run build" first.');
  process.exit(1);
}

fs.rmSync(apkDistDir, { recursive: true, force: true });
fs.cpSync(distDir, apkDistDir, { recursive: true });

const audioDir = path.join(apkDistDir, 'audio');
let keptCount = 0;
let keptBytes = 0;
let trimmedCount = 0;
let trimmedBytes = 0;

if (fs.existsSync(audioDir)) {
  const allAudioFiles = walkFiles(audioDir);
  for (const filePath of allAudioFiles) {
    const relFromAudio = path.relative(audioDir, filePath).replace(/\\/g, '/');
    const size = fs.statSync(filePath).size;
    if (ESSENTIAL_APK_AUDIO_FILES.has(relFromAudio)) {
      keptCount++;
      keptBytes += size;
    } else {
      fs.unlinkSync(filePath);
      trimmedCount++;
      trimmedBytes += size;
    }
  }
  removeEmptyDirs(audioDir);
}

const keptMb = (keptBytes / (1024 * 1024)).toFixed(2);
const trimmedMb = (trimmedBytes / (1024 * 1024)).toFixed(2);
console.log(
  `[prepare-apk-assets] Ready in dist-apk/: kept ${keptCount} essential audio files (${keptMb} MB), trimmed ${trimmedCount} optional files (${trimmedMb} MB).`
);
