const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('./utils/logger');

async function generateTargetGroups() {
  const keysPath = path.join(__dirname, 'inputs', 'keys.json');
  const outputPath = path.join(__dirname, 'inputs', 'target-groups.json');
  
  if (!fs.existsSync(keysPath)) {
    logger.error(`Keys file not found at ${keysPath}`);
    return;
  }

  const keys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
  const targetGroups = {};

  logger.info(`Starting target group generation for ${keys.length} keys`);

  for (const key of keys) {
    try {
      logger.info(`Resolving URLs for: ${key}`);
      
      let wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(key.charAt(0).toUpperCase() + key.slice(1))}_people`;
      
      // Try to verify via Wikipedia Search API
      try {
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(key + ' people')}&utf8=&format=json`;
        const searchRes = await axios.get(searchUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GitHub-Action-Script' },
          timeout: 5000
        });
        if (searchRes.data.query.search.length > 0) {
           wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(searchRes.data.query.search[0].title.replace(/ /g, '_'))}`;
        }
      } catch (err) {
        logger.warn(`Wikipedia search failed for ${key}, using fallback URL.`);
      }

      // Joshua Project is aggressively blocking automated requests (404/hangs)
      // We will provide a manual search link instead, extractors will fail gracefully
      const jpUrl = `https://joshuaproject.net/search?term=${encodeURIComponent(key)}`;
      
      targetGroups[key] = [jpUrl, wikiUrl];
      logger.info(`Generated target group for ${key}`);
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
       logger.error(`Error generating url for ${key}`, { error: error.message });
    }
  }

  // Ensure inputs directory exists
  const inputsDir = path.dirname(outputPath);
  if (!fs.existsSync(inputsDir)) {
    fs.mkdirSync(inputsDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(targetGroups, null, 2));
  logger.info(`Generated target groups saved to ${outputPath}`);
  return targetGroups;
}

module.exports = { generateTargetGroups };

// If run directly
if (require.main === module) {
  generateTargetGroups().catch(err => {
    logger.error('Target generation failed', { error: err.message });
  });
}
