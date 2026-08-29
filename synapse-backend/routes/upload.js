const express  = require('express');
const multer   = require('multer');
const pdfParse = require('pdf-parse');
const mammoth  = require('mammoth');
const XLSX     = require('xlsx');
const JSZip    = require('jszip');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Check by extension — more reliable than MIME type
    const filename = file.originalname.toLowerCase();
    const allowed  = ['.pdf','.ppt','.pptx','.doc','.docx','.xls','.xlsx','.txt'];
    const ext      = '.' + filename.split('.').pop();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not supported: ${ext}`));
    }
  }
});

async function extractText(buffer, originalname) {
  const ext = originalname.toLowerCase().split('.').pop();
  try {
    if (ext === 'pdf') {
      const data = await pdfParse(buffer);
      return data.text || '';
    }
    if (ext === 'pptx' || ext === 'ppt') {
      const zip        = await JSZip.loadAsync(buffer);
      const slideFiles = Object.keys(zip.files)
        .filter(n => n.startsWith('ppt/slides/slide') && n.endsWith('.xml'))
        .sort((a, b) => {
          const nA = parseInt(a.match(/slide(\d+)/)?.[1] || 0);
          const nB = parseInt(b.match(/slide(\d+)/)?.[1] || 0);
          return nA - nB;
        });
      const texts = [];
      for (const f of slideFiles) {
        const xml  = await zip.files[f].async('string');
        const text = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (text) texts.push(text);
      }
      return texts.join('\n\n');
    }
    if (ext === 'docx' || ext === 'doc') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    }
    if (ext === 'xlsx' || ext === 'xls') {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheets   = [];
      workbook.SheetNames.forEach(name => {
        const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[name]);
        if (csv.trim()) sheets.push(`Sheet: ${name}\n${csv}`);
      });
      return sheets.join('\n\n');
    }
    if (ext === 'txt') return buffer.toString('utf-8');
    return '';
  } catch (err) {
    console.error(`Error extracting from ${originalname}:`, err.message);
    return '';
  }
}

router.post('/', upload.array('files', 10), async (req, res) => {
  try {
    console.log('Files received:', req.files?.map(f => ({
      name: f.originalname, type: f.mimetype, size: f.size
    })));

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];
    for (const file of req.files) {
      const text    = await extractText(file.buffer, file.originalname);
      const cleaned = text.replace(/\x00/g, '').replace(/\s+/g, ' ').trim();
      results.push({ filename: file.originalname, text: cleaned, charCount: cleaned.length });
    }

    const valid = results.filter(r => r.text.length > 30);
    if (valid.length === 0) {
      return res.status(400).json({ error: 'Could not extract readable text from any uploaded files.' });
    }

    // Limit each file's text so multiple files don't overflow
    const mergedText = valid
    .map(r => {
    // Give each file equal share of the budget
    const perFileLimit = Math.floor(6000 / valid.length);
    const limitedText  = r.text.substring(0, perFileLimit);
    return `=== SOURCE: ${r.filename} ===\n${limitedText}`;
    })
    .join('\n\n');

    const truncated = mergedText.substring(0, 6000);

    res.json({
      text:       truncated,
      files:      valid.map(r => ({ filename: r.filename, charCount: r.charCount })),
      totalChars: truncated.length,
      fileCount:  valid.length,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process files: ' + err.message });
  }
});

module.exports = router;