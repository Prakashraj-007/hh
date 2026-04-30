/**
 * imageForensics.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Client-side port of the HackHustle Vision Fraud Detection pipeline.
 * Mirrors: services/ela.py, services/hashing.py, services/exif.py, services/scoring.py
 *
 * Five forensic checks (all run in-browser via Canvas API + EXIF parsing):
 *  1. ELA   – Error Level Analysis: detects pixel-level tampering / editing
 *  2. pHash – Perceptual Hash: detects near-duplicate / reused images
 *  3. EXIF  – Metadata inspection: detects old or stripped metadata
 *  4. AI    – AI Generation Detection: filename patterns + texture smoothness
 *  5. Score – Composite fraud score (0-100, 100 = max suspicion)
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Load an image File/Blob into an HTMLImageElement.
 */
function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Draw an HTMLImageElement onto a new OffscreenCanvas (or regular Canvas) and
 * return the 2D context together with width/height.
 */
function imgToCanvas(img, maxSize = 256) {
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  let canvas, ctx;
  if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(w, h);
    ctx = canvas.getContext('2d');
  } else {
    canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    ctx = canvas.getContext('2d');
  }
  ctx.drawImage(img, 0, 0, w, h);
  return { canvas, ctx, w, h };
}

/**
 * Re-compress a canvas at JPEG quality 'q' and reload it as an image.
 */
async function recompressCanvas(canvas, quality = 0.90) {
  let blob;
  if (canvas instanceof OffscreenCanvas) {
    blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
  } else {
    blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', quality));
  }
  const url = URL.createObjectURL(blob);
  const img2 = new Image();
  await new Promise((res, rej) => { img2.onload = res; img2.onerror = rej; img2.src = url; });
  URL.revokeObjectURL(url);
  return img2;
}

// ─── 1. ELA – Error Level Analysis ────────────────────────────────────────────
// Python equivalent: services/ela.py :: detect_ela()
//
// Strategy:
//   a) Draw original image to canvas → get pixel data
//   b) Re-save at 90% JPEG quality → reload → get pixel data
//   c) Compute per-channel absolute difference
//   d) Brighten ×5 and compute mean
//   e) If mean > threshold → editing detected

/**
 * @param {HTMLImageElement} img
 * @param {number} threshold  (default 25, same as Python service)
 * @returns {{ elaFlag: boolean, elaMean: number, elaImageDataUrl: string|null }}
 */
async function detectELA(img, threshold = 25) {
  try {
    const { canvas, ctx, w, h } = imgToCanvas(img, 512);

    // Original pixel data
    const origData = ctx.getImageData(0, 0, w, h).data;

    // Re-compressed image
    const compressed = await recompressCanvas(canvas, 0.90);

    // Draw compressed version onto a fresh canvas
    let cCanvas, cCtx;
    if (typeof OffscreenCanvas !== 'undefined') {
      cCanvas = new OffscreenCanvas(w, h);
      cCtx = cCanvas.getContext('2d');
    } else {
      cCanvas = document.createElement('canvas');
      cCanvas.width = w; cCanvas.height = h;
      cCtx = cCanvas.getContext('2d');
    }
    cCtx.drawImage(compressed, 0, 0, w, h);
    const compData = cCtx.getImageData(0, 0, w, h).data;

    // Difference × 5 brightness boost
    let totalDiff = 0;
    const elaPixels = new Uint8ClampedArray(origData.length);
    for (let i = 0; i < origData.length; i += 4) {
      const dr = Math.min(255, Math.abs(origData[i]     - compData[i])     * 5);
      const dg = Math.min(255, Math.abs(origData[i + 1] - compData[i + 1]) * 5);
      const db = Math.min(255, Math.abs(origData[i + 2] - compData[i + 2]) * 5);
      elaPixels[i]     = dr;
      elaPixels[i + 1] = dg;
      elaPixels[i + 2] = db;
      elaPixels[i + 3] = 255;
      totalDiff += (dr + dg + db) / 3;
    }
    const elaMean = totalDiff / (w * h);

    // Build ELA visualisation image
    let elaImageDataUrl = null;
    try {
      let visCanvas, visCtx;
      if (typeof OffscreenCanvas !== 'undefined') {
        visCanvas = new OffscreenCanvas(w, h);
        visCtx = visCanvas.getContext('2d');
      } else {
        visCanvas = document.createElement('canvas');
        visCanvas.width = w; visCanvas.height = h;
        visCtx = visCanvas.getContext('2d');
      }
      const id = visCtx.createImageData(w, h);
      id.data.set(elaPixels);
      visCtx.putImageData(id, 0, 0);

      if (visCanvas instanceof OffscreenCanvas) {
        const b = await visCanvas.convertToBlob({ type: 'image/png' });
        elaImageDataUrl = await new Promise(r => {
          const fr = new FileReader();
          fr.onload = () => r(fr.result);
          fr.readAsDataURL(b);
        });
      } else {
        elaImageDataUrl = visCanvas.toDataURL('image/png');
      }
    } catch (_) { /* visualisation optional */ }

    return { elaFlag: elaMean > threshold, elaMean: Math.round(elaMean * 100) / 100, elaImageDataUrl };
  } catch (e) {
    console.error('ELA error:', e);
    return { elaFlag: false, elaMean: 0, elaImageDataUrl: null };
  }
}

// ─── 2. Perceptual Hash (pHash) ────────────────────────────────────────────────
// Python equivalent: services/hashing.py :: check_hash() using imagehash.phash()
//
// pHash algorithm:
//   a) Resize to 32×32
//   b) Convert to greyscale
//   c) Apply DCT (Discrete Cosine Transform) on 8×8 top-left block
//   d) Compare each DCT value to median → 64-bit hash
//   e) Hamming distance to stored reference hashes

/**
 * Compute a 64-bit perceptual hash of an image.
 * Returns a Uint8Array of length 64 (each element is 0 or 1).
 * @param {HTMLImageElement} img
 */
function computePHash(img) {
  // Step 1: resize to 32×32 greyscale
  const SIZE = 32;
  let canvas, ctx;
  if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(SIZE, SIZE);
    ctx = canvas.getContext('2d');
  } else {
    canvas = document.createElement('canvas');
    canvas.width = SIZE; canvas.height = SIZE;
    ctx = canvas.getContext('2d');
  }
  ctx.drawImage(img, 0, 0, SIZE, SIZE);
  const data = ctx.getImageData(0, 0, SIZE, SIZE).data;

  // Step 2: greyscale matrix
  const grey = new Float64Array(SIZE * SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    grey[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }

  // Step 3: 2D DCT (only the 8×8 top-left block matters for pHash)
  const DCTSIZE = 8;
  const dct = new Float64Array(DCTSIZE * DCTSIZE);
  for (let u = 0; u < DCTSIZE; u++) {
    for (let v = 0; v < DCTSIZE; v++) {
      let sum = 0;
      for (let x = 0; x < SIZE; x++) {
        for (let y = 0; y < SIZE; y++) {
          sum += grey[x * SIZE + y] *
            Math.cos(((2 * x + 1) * u * Math.PI) / (2 * SIZE)) *
            Math.cos(((2 * y + 1) * v * Math.PI) / (2 * SIZE));
        }
      }
      const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
      const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
      dct[u * DCTSIZE + v] = (2 / SIZE) * cu * cv * sum;
    }
  }

  // Step 4: exclude DC component (index 0), compute median of remaining 63 values
  const vals = Array.from(dct).slice(1);
  const sorted = [...vals].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  // Step 5: binary hash — 1 if above median, else 0
  const hash = new Uint8Array(64);
  for (let i = 0; i < 63; i++) hash[i] = vals[i] >= median ? 1 : 0;
  return hash;
}

/**
 * Hamming distance between two pHash Uint8Arrays.
 */
function hammingDistance(h1, h2) {
  let dist = 0;
  for (let i = 0; i < 64; i++) dist += h1[i] !== h2[i] ? 1 : 0;
  return dist;
}

/**
 * Check hash similarity against stored previous hashes in localStorage.
 * Returns { hashFlag: boolean, hashDistance: number }
 * @param {HTMLImageElement} img
 * @param {number} threshold  hamming distance < threshold → duplicate
 */
function checkHash(img, threshold = 5) {
  const hash = computePHash(img);

  // Persist this hash for future duplicate detection
  const stored = JSON.parse(localStorage.getItem('imageHashes') || '[]');

  let minDist = 999;
  for (const h of stored) {
    const d = hammingDistance(hash, new Uint8Array(h));
    if (d < minDist) minDist = d;
  }

  // Save current hash
  stored.push(Array.from(hash));
  // Keep only last 200 hashes to avoid storage bloat
  if (stored.length > 200) stored.shift();
  localStorage.setItem('imageHashes', JSON.stringify(stored));

  return {
    hashFlag: minDist < threshold,
    hashDistance: minDist === 999 ? 64 : minDist // 64 = no match (max hamming)
  };
}

// ─── 3. EXIF Metadata Analysis ─────────────────────────────────────────────────
// Python equivalent: services/exif.py :: check_exif()
//
// We use a lightweight client-side EXIF parser (no dep needed — we parse the
// raw JPEG bytes ourselves to find DateTimeOriginal tag 0x9003 / DateTime 0x0132).

/**
 * Read the first `maxBytes` bytes of a File as a Uint8Array.
 */
function readFileBytes(file, maxBytes = 65536) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(new Uint8Array(e.target.result));
    reader.onerror = reject;
    reader.readAsArrayBuffer(file.slice(0, maxBytes));
  });
}

/**
 * Minimal JPEG EXIF date parser.
 * Returns { status: "VALID" | "OLD" | "MISSING" | "ERROR", dateTaken: Date|null }
 * @param {File} file
 */
async function checkExif(file) {
  try {
    if (!file.type.includes('jpeg') && !file.type.includes('jpg') && !file.name.toLowerCase().endsWith('.jpg') && !file.name.toLowerCase().endsWith('.jpeg')) {
      // PNG, WebP etc. rarely carry EXIF — treat as MISSING
      return { status: 'MISSING', dateTaken: null };
    }

    const bytes = await readFileBytes(file, 131072);

    // Find APP1 marker (0xFF 0xE1)
    let exifOffset = -1;
    for (let i = 0; i < bytes.length - 1; i++) {
      if (bytes[i] === 0xFF && bytes[i + 1] === 0xE1) {
        exifOffset = i + 4; // skip marker + length
        break;
      }
    }
    if (exifOffset < 0) return { status: 'MISSING', dateTaken: null };

    // Check for "Exif\0\0" signature
    const sig = String.fromCharCode(...bytes.slice(exifOffset, exifOffset + 6));
    if (!sig.startsWith('Exif')) return { status: 'MISSING', dateTaken: null };

    const tiffStart = exifOffset + 6;
    const littleEndian = bytes[tiffStart] === 0x49; // 'II'

    function readUint16(offset) {
      return littleEndian
        ? bytes[offset] | (bytes[offset + 1] << 8)
        : (bytes[offset] << 8) | bytes[offset + 1];
    }
    function readUint32(offset) {
      return littleEndian
        ? bytes[offset] | (bytes[offset+1]<<8) | (bytes[offset+2]<<16) | (bytes[offset+3]<<24)
        : (bytes[offset]<<24) | (bytes[offset+1]<<16) | (bytes[offset+2]<<8) | bytes[offset+3];
    }

    const ifdOffset = readUint32(tiffStart + 4);
    let pos = tiffStart + ifdOffset;
    const numEntries = readUint16(pos);
    pos += 2;

    const DATE_TAGS = [0x9003 /* DateTimeOriginal */, 0x0132 /* DateTime */];
    let dateStr = null;
    let subIfdOffset = -1;

    for (let i = 0; i < numEntries; i++) {
      const tag = readUint16(pos);
      const type = readUint16(pos + 2);
      const count = readUint32(pos + 4);
      const valOffset = pos + 8;

      if (DATE_TAGS.includes(tag) && type === 2 /* ASCII */ && count >= 19) {
        const dataOffset = tiffStart + readUint32(valOffset);
        dateStr = String.fromCharCode(...bytes.slice(dataOffset, dataOffset + 19));
        break;
      }
      if (tag === 0x8769 /* ExifIFD pointer */) {
        subIfdOffset = tiffStart + readUint32(valOffset);
      }
      pos += 12;
    }

    // Check sub-IFD for DateTimeOriginal if not found yet
    if (!dateStr && subIfdOffset > 0) {
      let spos = subIfdOffset;
      const sEntries = readUint16(spos);
      spos += 2;
      for (let i = 0; i < sEntries; i++) {
        const tag = readUint16(spos);
        const type = readUint16(spos + 2);
        const count = readUint32(spos + 4);
        const valOffset = spos + 8;
        if (DATE_TAGS.includes(tag) && type === 2 && count >= 19) {
          const dataOffset = tiffStart + readUint32(valOffset);
          dateStr = String.fromCharCode(...bytes.slice(dataOffset, dataOffset + 19));
          break;
        }
        spos += 12;
      }
    }

    if (!dateStr) return { status: 'MISSING', dateTaken: null };

    // Parse "YYYY:MM:DD HH:MM:SS"
    const [datePart, timePart] = dateStr.split(' ');
    const [y, mo, d] = datePart.split(':').map(Number);
    const [hh, mm, ss] = (timePart || '00:00:00').split(':').map(Number);
    const taken = new Date(y, mo - 1, d, hh, mm, ss);

    const daysDiff = (Date.now() - taken.getTime()) / (1000 * 60 * 60 * 24);
    const status = daysDiff > 30 ? 'OLD' : 'VALID';

    return { status, dateTaken: taken };
  } catch (e) {
    console.error('EXIF error:', e);
    return { status: 'ERROR', dateTaken: null };
  }
}

// ─── 4. AI Generation Detection ───────────────────────────────────────────────
//
// Two signals:
//   a) Filename pattern: ChatGPT, DALL-E, Midjourney, Gemini, etc.  → -35
//   b) Local texture smoothness: AI images have unnaturally low pixel
//      variance in 4×4 blocks (no camera photon noise)              → -20

/**
 * @param {HTMLImageElement} img
 * @param {File} file
 * @returns {{ aiFlags: string[], aiDeduction: number }}
 */
function detectAIGeneration(img, file) {
  const aiFlags = [];
  let aiDeduction = 0;

  // ── Signal 1: Filename pattern match ──────────────────────────────────────
  const fname = (file.name || '').toLowerCase();
  const AI_PATTERNS = [
    'chatgpt', 'dall-e', 'dalle', 'midjourney', 'stable-diff', 'stablediff',
    'stable_diff', 'gemini', 'leonardo', 'image_fx', 'imagefx', 'adobe-firefly',
    'firefly', 'bing-image', 'copilot', 'ai-generated', 'ai_generated',
    'generated-image', 'ideogram', 'runway', 'sora', 'openai', 'gpt-image',
  ];
  if (AI_PATTERNS.some(p => fname.includes(p))) {
    aiDeduction += 35;
    aiFlags.push('AI_FILENAME_PATTERN');
  }

  // ── Signal 2: Local texture variance (smoothness test) ────────────────────
  // AI images rendered by diffusion models are unnaturally smooth — they lack
  // the high-frequency photon noise present in real camera images.
  // Method: compute average variance of greyscale values inside 4×4 blocks
  // across a 64×64 downsample. Real photos: avgVar > 80; AI images: avgVar < 40.
  try {
    const SIZE = 64;
    let canvas, ctx;
    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(SIZE, SIZE);
      ctx = canvas.getContext('2d');
    } else {
      canvas = document.createElement('canvas');
      canvas.width = SIZE; canvas.height = SIZE;
      ctx = canvas.getContext('2d');
    }
    ctx.drawImage(img, 0, 0, SIZE, SIZE);
    const data = ctx.getImageData(0, 0, SIZE, SIZE).data;

    // Convert to greyscale
    const grey = new Float32Array(SIZE * SIZE);
    for (let i = 0; i < SIZE * SIZE; i++) {
      grey[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    }

    // Compute variance in each 4×4 block
    let totalVariance = 0;
    let blockCount = 0;
    const BLOCK = 4;
    for (let by = 0; by <= SIZE - BLOCK; by += BLOCK) {
      for (let bx = 0; bx <= SIZE - BLOCK; bx += BLOCK) {
        const vals = [];
        for (let y = by; y < by + BLOCK; y++) {
          for (let x = bx; x < bx + BLOCK; x++) {
            vals.push(grey[y * SIZE + x]);
          }
        }
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
        totalVariance += variance;
        blockCount++;
      }
    }
    const avgVar = totalVariance / blockCount;

    // Threshold tuned empirically: AI ≈ 10–40, real camera ≈ 80–400
    if (avgVar < 45) {
      aiDeduction += 20;
      aiFlags.push('AI_SMOOTH_TEXTURE');
    }
  } catch (_) { /* non-fatal */ }

  return { aiFlags, aiDeduction };
}

// ─── 5. Composite Scoring ──────────────────────────────────────────────────────
// Python equivalent: services/scoring.py :: compute_score()
//
// Score starts at 100 (fully authentic). Deductions:
//   ELA edit detected           → -20  flag: POSSIBLE_EDIT
//   Duplicate hash (< 5 dist)   → -25  flag: DUPLICATE_IMAGE
//   Old EXIF (> 30 days)        → -20  flag: OLD_IMAGE_REUSE
//   Missing EXIF                → -10  flag: METADATA_STRIPPED
//   AI filename pattern         → -35  flag: AI_FILENAME_PATTERN
//   AI texture smoothness       → -20  flag: AI_SMOOTH_TEXTURE
//
// imageScore 0 = clean, 100 = maximum suspicion
// (inverted from Python's "authenticity" so it fits the risk engine)

/**
 * @typedef {{ imageScore: number, flags: string[], elaMean: number, hashDistance: number, exifStatus: string, dateTaken: Date|null, elaImageDataUrl: string|null }}
 */

/**
 * Full forensic pipeline on a user-uploaded image File.
 * @param {File} file
 * @returns {Promise<ImageForensicsResult>}
 */
export async function analyzeImage(file) {
  const img = await loadImageFromFile(file);

  // Run all checks — ELA and EXIF in parallel, hash + AI are synchronous
  const [elaResult, exifResult] = await Promise.all([
    detectELA(img),
    checkExif(file)
  ]);
  const hashResult = checkHash(img);
  const aiResult   = detectAIGeneration(img, file);

  // Composite score (deduction model: start at 100, subtract for each fraud signal)
  let authenticity = 100;
  const flags = [];

  // 1. ELA — pixel-level editing
  if (elaResult.elaFlag) {
    authenticity -= 20;
    flags.push('POSSIBLE_EDIT');
  }

  // 2. pHash — duplicate / reused image
  if (hashResult.hashFlag) {
    authenticity -= 25;
    flags.push('DUPLICATE_IMAGE');
  }

  // 3. EXIF — old or missing metadata
  if (exifResult.status === 'OLD') {
    authenticity -= 20;
    flags.push('OLD_IMAGE_REUSE');
  } else if (exifResult.status === 'MISSING') {
    authenticity -= 10;
    flags.push('METADATA_STRIPPED');
  } else if (exifResult.status === 'ERROR') {
    flags.push('EXIF_ERROR');
  }

  // 4. AI Generation — filename pattern or unnaturally smooth texture
  if (aiResult.aiDeduction > 0) {
    authenticity -= aiResult.aiDeduction;  // up to -55 combined
    flags.push(...aiResult.aiFlags);
  }

  // imageScore = suspicion score (0 = clean, 100 = max suspicious)
  const imageScore = Math.min(100, Math.max(0, 100 - authenticity));

  return {
    imageScore,
    flags,
    elaMean:         elaResult.elaMean,
    elaFlag:         elaResult.elaFlag,
    elaImageDataUrl: elaResult.elaImageDataUrl,
    hashDistance:    hashResult.hashDistance,
    hashFlag:        hashResult.hashFlag,
    exifStatus:      exifResult.status,
    dateTaken:       exifResult.dateTaken,
    aiFlags:         aiResult.aiFlags,
  };
}
