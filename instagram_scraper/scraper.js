const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeInstagram(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    let imageUrl = $('meta[property="og:image"]').attr('content');
    let videoUrl = $('meta[property="og:video"]').attr('content');

    if (imageUrl) {
      return imageUrl;
    } else if (videoUrl) {
      return videoUrl;
    } else {
      // Try to extract the URL from the video tag
      videoUrl = $('video').attr('src');
      if (videoUrl) {
        return videoUrl;
      }
      return null;
    }
  } catch (error) {
    console.error('Error scraping Instagram:', error.message);
    return null;
  }
}

module.exports = scrapeInstagram;