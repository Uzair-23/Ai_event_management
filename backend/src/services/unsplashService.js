const axios = require('axios');

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;

// Fetch a photo URL from Unsplash based on a query (category/title)
exports.fetchImageForQuery = async (query) => {
  // if we don't have an API key, fall back to the public source (no auth required)
  if (!UNSPLASH_KEY) return `https://source.unsplash.com/featured/?${encodeURIComponent(query)}`;
  try {
    const res = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query, per_page: 1 },
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
    });
    const results = res.data.results;
    if (!results || !results.length) return `https://source.unsplash.com/featured/?${encodeURIComponent(query)}`;
    // prefer a regular-sized image for performance
    return results[0].urls.regular || results[0].urls.small || results[0].urls.full; // store a reasonable size
  } catch (err) {
    console.error('Unsplash error', err.message);
    return `https://source.unsplash.com/featured/?${encodeURIComponent(query)}`;
  }
};