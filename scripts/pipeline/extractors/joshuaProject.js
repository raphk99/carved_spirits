const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

async function extractJoshuaProjectData(name, url) {
  try {
    logger.info(`Starting Joshua Project extraction for ${name}`, { url });
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(data);

    const result = {
      id: name,
      label: name.charAt(0).toUpperCase() + name.slice(1) + ' People',
      subtitle: '',
      date: new Date().toISOString().slice(0, 7), // YYYY-MM
      coordinatesList: [],
      population: null,
      primaryLocation: null
    };

    // Extract title/subtitle
    result.subtitle = $('h1').text().trim() || result.label;

    // Extract population
    $('.stat-label').each((i, el) => {
      const text = $(el).text();
      if (text.includes('Population')) {
        const popText = $(el).next('.stat-value').text().trim();
        result.population = popText;
      }
    });

    // Extract location
    const locationEl = $('a[href^="/countries/"]').first();
    if (locationEl.length) {
      result.primaryLocation = locationEl.text().trim();
    }

    // Attempt to extract coordinates from scripts or specific divs
    // Joshua Project often puts lat/lon in var map = ... or specific classes
    let lat = null;
    let lon = null;
    $('.field-label').each((i, el) => {
      if ($(el).text().includes('Latitude')) {
        lat = parseFloat($(el).next().text().trim());
      }
      if ($(el).text().includes('Longitude')) {
        lon = parseFloat($(el).next().text().trim());
      }
    });

    // Fallback: search scripts
    if (lat === null || lon === null) {
      $('script').each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent && scriptContent.includes('latitude') && scriptContent.includes('longitude')) {
          const latMatch = scriptContent.match(/"latitude":\s*(-?\d+(\.\d+)?)/);
          const lonMatch = scriptContent.match(/"longitude":\s*(-?\d+(\.\d+)?)/);
          if (latMatch && latMatch[1]) lat = parseFloat(latMatch[1]);
          if (lonMatch && lonMatch[1]) lon = parseFloat(lonMatch[1]);
        }
      });
    }

    if (lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon)) {
      result.coordinatesList.push({ lat, lon });
    }

    logger.info(`Successfully extracted Joshua Project data for ${name}`, { 
      population: result.population, 
      location: result.primaryLocation,
      hasCoordinates: result.coordinatesList.length > 0 
    });

    return result;

  } catch (error) {
    logger.error(`Failed to extract data from Joshua Project for ${name}`, { 
      url, 
      error: error.message 
    });
    // Return a partial object so the pipeline can continue
    return {
      id: name,
      label: name.charAt(0).toUpperCase() + name.slice(1) + ' People',
      coordinatesList: [],
      error: 'Joshua Project extraction failed'
    };
  }
}

module.exports = {
  extractJoshuaProjectData
};
