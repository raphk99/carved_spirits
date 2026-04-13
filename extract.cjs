const fs = require('fs');
const idx = fs.readFileSync('index.html', 'utf8');

const startMatch = '<script type=\"module\">';
const endMatch = '<\/script>';

const idxStart = idx.lastIndexOf(startMatch);
const idxEnd = idx.indexOf(endMatch, idxStart);
let scriptBody = idx.slice(idxStart + startMatch.length, idxEnd);

// A small fix to the code:
// Original: ...
// I will save the extracted script as js/main-new.js
fs.writeFileSync('js/main-new.js', scriptBody.trim());

// Also replace index.html to point to it
const newIdx = idx.substring(0, idxStart) + startMatch + '\n  </script>\n  <script type=\"module\" src=\"./js/main-new.js\"></script>\n' + idx.substring(idxEnd + endMatch.length);
fs.writeFileSync('index.html', newIdx);
