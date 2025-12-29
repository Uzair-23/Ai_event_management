const axios = require('axios');

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;

// Fetch a photo URL from Unsplash based on a query (category/title)
exports.fetchImageForQuery = async (query) => {
  if (!UNSPLASH_KEY) return null;
  try {
    const res = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query, per_page: 1 },
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
    });
    const results = res.data.results;
    if (!results || !results.length) return null;
    return results[0].urls.full; // store full-sized url
  } catch (err) {
    console.error('Unsplash error', err.message);
    return null;
  }
};