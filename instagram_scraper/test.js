const scrapeInstagram = require('./scraper');

const reelUrl = 'https://www.instagram.com/reel/DImir84yvCr/';
const imageUrl = 'https://www.instagram.com/p/DIrQGzqIBL-/';
const multiImageUrl = 'https://www.instagram.com/p/DIoFlnWvt5a/';

async function testScraper() {
  const reelResult = await scrapeInstagram(reelUrl);
  console.log('Reel URL:', reelResult);

  const imageResult = await scrapeInstagram(imageUrl);
  console.log('Image URL:', imageResult);

  const multiImageResult = await scrapeInstagram(multiImageUrl);
  console.log('Multi Image URL:', multiImageResult);
}

testScraper();