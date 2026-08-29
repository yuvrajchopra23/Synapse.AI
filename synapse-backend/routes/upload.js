const express =  require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const JSZip = require('jszip');

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: 15 * 1024 * 1024}, //15mb per file
    fileFilter: (req, file, cb) => {
        const allowed = [
            'application/pdf',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
        ];
        if (allowed.includes(file.mimetype)){
            cb(null, true);
        }else{
            cb(new Error(`File type not supported: ${file.mimetype}`));
        }
    }
});

// Extract text from a single file buffer
async function extractText(buffer, mimetype, originalname){
    try{
        //pdf
        if (mimetype === 'application/pdf') {
            const data = await pdfParse(buffer);
            return data.text || '';
        }

        //pptx
        if (mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'){
            const zip = await JSZip.loadAsync(buffer);
            const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
            .sort((a,b) => {
                const numA = parseInt(a.match(/slide(\d+)/)?.[1] || 0);
                const numB = parseInt(b.match(/slide(\d+)/)?.[1] || 0);
                return numA - numB;
            });

            const SlideTexts = [];
            for(const slideFile of slideFiles) {
                const xml = await zip.files[slideFile].async('string');
                const text = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                if (text) SlideTexts.push(text);
            }
            return SlideTexts.join('\n\n');
        }

        //DOCX
        if(mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||mimetype === 'application/msword') {
            const result = await mammoth.extractRawText({ buffer });
            return result.value || '';
        }

        //XLSX/XLS
        if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || mimetype === 'application/vnd.ms-excel') {
            const workbook = XLSX.read(buffer, {type: 'buffer'});
            const allSheets = [];
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const csv = XLSX.utils.sheet_to_csv(sheet);
                if(csv.trim()) allSheets.push(`Sheet: ${sheetName}\n${csv}`);
            });
            return allSheets.join('\n\n');
        }

        //plain Text
        if (mimetype === 'text/plain'){
            return buffer.toString('utf-8');
        }
        return '';
    }catch (err){
        console.error(`Error extracting from ${originalname}: `, err.message);
        return '';
    }
}

//POST /api/upload - accept multiple files
router.post('/',upload.array('files', 10), async(req, res) => {
    try{
        if(!req.files || req.files.length === 0) {
            return res.status(400).json({error: 'no Files uploaded'});
        }

        const results = [];

        for(const file of req.files){
            const text = await extractText(file.buffer, file.mimetype, file.originalname);

            const cleaned = text.replace(/\x00/g, '').replace(/\s+/g, ' ').trim();

            results.push({
                filename: file.originalname,
                mimetype: file.mimetype,
                text: cleaned,
                charCount: cleaned.length,
            });
        }

        //filter out files with no extractable text
        const valid = results.filter(r => r.text.length > 30);

        if (valid.length === 0){
            return res.status(400).json({
                error: 'could not extract readable text from any of the uploaded files.'
            });
        }

        //Merge all file texts with clear separators
        const truncated = mergedText.substring(0, 12000);

        res.json({
            text: truncated,
            files: valid.map(r => ({filename: r.filename, charCount: r.charCount})),
            totalChars: truncated.length,
            fileCount: valid.length,
        });
    }catch(err){
        console.error('upload Error: ', err);
        res.status(500).json({error: 'Failed to process files: ' + err.message});
    }
});

module.exports = router;