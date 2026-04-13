const fs = require('fs');
const idx = fs.readFileSync('index.html', 'utf8');

const startMatch = '<script type=\"module\">';
const endMatch = '<\/script>';

const idxStart = idx.lastIndexOf(startMatch);
const idxEnd = idx.indexOf(endMatch, idxStart);
const scriptBody = idx.slice(idxStart + startMatch.length, idxEnd);

fs.writeFileSync('js/main-new.js', scriptBody);
