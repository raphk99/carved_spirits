const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');
const { extractJoshuaProjectData } = require('./extractors/joshuaProject');
const { extractWikipediaData } = require('./extractors/wikipedia');
const { generateTargetGroups } = require('./target-generator');

async function extractData() {
  const targetGroupsPath = path.join(__dirname, 'inputs', 'target-groups.json');
  if (!fs.existsSync(targetGroupsPath)) {
    logger.error(`Target groups file not found at ${targetGroupsPath}. Please run with --generate first.`);
    return;
  }

  const targetGroups = JSON.parse(fs.readFileSync(targetGroupsPath, 'utf8'));
  logger.info('Starting full extraction pipeline', { targetGroups: Object.keys(targetGroups) });
  const results = [];

  for (const [name, urls] of Object.entries(targetGroups)) {
    try {
      logger.info(`Processing group: ${name}`);

      const jpUrl = Array.isArray(urls) ? urls[0] : urls;
      const wikiUrl = Array.isArray(urls) && urls.length > 1 ? urls[1] : null;

      // 1. Fetch Joshua Project Data
      const jpData = await extractJoshuaProjectData(name, jpUrl);

      // 2. Fetch Wikipedia Content
      const wikiContent = await extractWikipediaData(name, wikiUrl);

      // 3. Merge data
      const mergedContent = [];
      
      // If we got some basic intro from Joshua project, we could add it, but 
      // the instruction says content should be retrieved from wikipedia.
      // So we just use wikiContent directly.
      if (wikiContent.length > 0) {
         mergedContent.push(...wikiContent);
      } else {
         logger.warn(`No content blocks found on Wikipedia for ${name}`);
      }

      const finalGroupObj = {
        id: jpData.id,
        type: "ethnic_group",
        label: jpData.label,
        subtitle: jpData.subtitle || `People of ${jpData.primaryLocation || 'Unknown'}`,
        date: jpData.date,
        coordinatesList: jpData.coordinatesList,
        content: mergedContent
      };

      // Add population if found just as an extra text block on top
      if (jpData.population) {
         if (finalGroupObj.content.length > 0) {
             finalGroupObj.content[0].text = `Population: ${jpData.population}. ` + finalGroupObj.content[0].text;
         } else {
             finalGroupObj.content.push({
                subtitle: "Overview",
                text: `Population: ${jpData.population}.`,
                image: ""
             });
         }
      }

      results.push(finalGroupObj);
      logger.info(`Successfully processed ${name}`);

    } catch (error) {
       logger.error(`Error processing ${name}`, { error: error.message });
    }
  }

  // 4. Output to json
  const outputsDir = path.join(__dirname, 'outputs');
  if (!fs.existsSync(outputsDir)) {
    fs.mkdirSync(outputsDir, { recursive: true });
  }
  const outputPath = path.join(outputsDir, 'events-output.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  logger.info(`Pipeline completed successfully. Wrote ${results.length} groups to ${outputPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  const runGenerate = args.includes('--generate') || args.includes('--all');
  const runExtract = args.includes('--extract') || args.includes('--all');
  
  if (!runGenerate && !runExtract) {
     console.log("Usage: node index.js [--generate] [--extract] [--all]");
     return;
  }

  if (runGenerate) {
    logger.info('Running generation step...');
    await generateTargetGroups();
  }

  if (runExtract) {
    logger.info('Running extraction step...');
    await extractData();
  }
}

main().catch(err => {
  logger.error('Pipeline failed', { error: err.message });
});
