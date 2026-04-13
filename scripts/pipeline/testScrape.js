const axios = require('axios');
const cheerio = require('cheerio');

async function testSearch(query) {
  try {
    const { data } = await axios.get(`https://joshuaproject.net/global_search?q=${query}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const $ = cheerio.load(data);
    const links = [];
    $('a[href^="/people_groups/"]').each((i, el) => {
      links.push($(el).attr('href'));
    });
    console.log('Links found:', links.slice(0, 5));
  } catch (err) {
    console.error(err.message);
  }
}

testSearch('bamileke');
testSearch('igbo');
