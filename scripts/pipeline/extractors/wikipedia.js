const axios = require('axios');
const logger = require('../utils/logger');

async function extractWikipediaData(name, explicitUrl) {
  const translate = require('google-translate-api-x');
  try {
    let lang = 'en';
    let title = '';

    if (explicitUrl) {
      logger.info(`Starting Wikipedia API extraction for ${name} using explicit URL: ${explicitUrl}`);
      // Parse lang and title from URL e.g. https://fr.wikipedia.org/wiki/Ngbaka_(peuple)
      const urlObj = new URL(explicitUrl);
      lang = urlObj.hostname.split('.')[0];
      // get the part after /wiki/
      const pathnameParts = urlObj.pathname.split('/wiki/');
      if (pathnameParts.length > 1) {
        title = decodeURIComponent(pathnameParts[1]);
      } else {
        logger.warn(`Could not parse title from URL: ${explicitUrl}`);
        return [];
      }
    } else {
      logger.info(`Starting Wikipedia API extraction for ${name} using search`);
      // Fallback search if no explicit URL is provided
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name + ' people')}&utf8=&format=json`;
      const searchRes = await axios.get(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GitHub-Action-Script' }
      });
      
      if (!searchRes.data.query.search.length) {
        logger.warn(`No Wikipedia article found for ${name}`);
        return [];
      }
      title = searchRes.data.query.search[0].title;
    }

    logger.info(`Fetching Wikipedia article. Lang: ${lang}, Title: ${title}`);

    // Fetch page sections and text
    const extractUrl = `https://${lang}.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=sections|text&format=json`;
    const extractRes = await axios.get(extractUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GitHub-Action-Script' }
    });
    
    if (extractRes.data.error) {
       logger.error(`Wikipedia API error for ${title}: ${extractRes.data.error.info}`);
       return [];
    }
    
    const parse = extractRes.data.parse;

    // We'll use cheerio to parse the HTML string from Wikipedia since the API returns rendered HTML
    const cheerio = require('cheerio');
    const $ = cheerio.load(parse.text['*']);
    
    // Clean up pronunciation guides, citations, and other noise
    $('.mw-parser-output .IPA-label-small, .references, .infobox, .navbox, .rt-commentedText, style, .reference, .ipa, sup, .mw-editsection').remove();

    // Attempting to scrape the introduction section (before the first h2)
    let leadText = '';
    const firstP = $('.mw-parser-output > p:not(.mw-empty-elt)').first();
    if (firstP.length) {
       leadText = firstP.text().trim();
    }

    const content = [];
    if (leadText) {
       leadText = leadText.replace(/\[\d+\]/g, '').replace(/\(\s*\)/g, '').replace(/\(;\s*/g, '(').replace(/;\s*\)/g, ')').trim();
       if (lang !== 'en' && leadText) {
           const res = await translate(leadText, { to: 'en' });
           leadText = res.text;
       }
       content.push({
           subtitle: "Overview",
           text: leadText,
           image: ""
       });
    }

    // Now extract specific sections (e.g. History, Culture, Society, Art)
    const targetKeywords = ['history', 'culture', 'society', 'origins', 'demographics', 'art', 'arts', 'histoire', 'société', 'arts et culture'];
    
    for (const section of parse.sections) {
      const sectionName = section.line.toLowerCase();
      if (section.toclevel === 1 && targetKeywords.some(kw => sectionName.includes(kw))) {
         // Find the h2 or its container (handle both span-based anchors and native ids)
         let headEl = $(`h2#${section.anchor.replace(/\./g, '\\.')}, h2:has(span#${section.anchor.replace(/\./g, '\\.')})`);
         if (headEl.length) {
            // Wikipedia sometimes wraps headers in div.mw-heading
            if (headEl.parent().hasClass('mw-heading')) {
               headEl = headEl.parent();
            }

            // Get all paragraphs until the next mw-heading2 or h2
            let sectionText = '';
            let nextEl = headEl.next();
            while (nextEl.length && !nextEl.is('h2') && !nextEl.hasClass('mw-heading2')) {
              // We want to capture p and h3 for subheadings
              if (nextEl.is('p') && nextEl.text().trim()) {
                 sectionText += nextEl.text().trim() + ' ';
              } else if (nextEl.is('h3') || nextEl.hasClass('mw-heading3')) {
                 sectionText += '\n\n' + nextEl.text().trim() + ':\n';
              }
              nextEl = nextEl.next();
            }
            if (sectionText.trim()) {
                sectionText = sectionText.trim().replace(/\[\d+\]/g, '').replace(/\(\s*\)/g, '').replace(/\(;\s*/g, '(').replace(/;\s*\)/g, ')').trim();
                let finalSubtitle = section.line;
                
                if (lang !== 'en') {
                   const resText = await translate(sectionText, { to: 'en' });
                   sectionText = resText.text;
                   const resTitle = await translate(finalSubtitle, { to: 'en' });
                   finalSubtitle = resTitle.text;
                }
                content.push({
                   subtitle: finalSubtitle,
                   text: sectionText,
                   image: ""
                });
            }
         }
      }
    }

    logger.info(`Extracted ${content.length} content block(s) from Wikipedia for ${title}`);
    return content;

  } catch (error) {
    logger.error(`Failed to extract data from Wikipedia for ${name}: ${error.stack || error.message}`);
    return [];
  }
}

module.exports = { extractWikipediaData };
