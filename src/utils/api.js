const UNSPLASH_BASE = 'https://api.unsplash.com';
const PEXELS_BASE = 'https://api.pexels.com/v1';
const PIXABAY_BASE = 'https://pixabay.com/api';

const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
const PEXELS_KEY = import.meta.env.VITE_PEXELS_API_KEY;
const PIXABAY_KEY = import.meta.env.VITE_PIXABAY_API_KEY;

export async function searchUnsplash(query, page = 1, perPage = 12) {
  const res = await fetch(
    `${UNSPLASH_BASE}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
    { headers: { 'Accept-Version': 'v1', Authorization: `Client-ID ${UNSPLASH_KEY}` } }
  );
  if (!res.ok) throw new Error(`Unsplash API error: ${res.status}`);
  const json = await res.json();
  return {
    images: json.results.map(i => ({
      id: i.id,
      url: i.urls.regular,
      thumbnail: i.urls.small,
      description: i.alt_description || i.description,
      author: i.user.name,
      downloadUrl: i.urls.full
    })),
    totalPages: json.total_pages,
    total: json.total
  };
}

export async function searchPexels(query, page = 1, perPage = 12) {
  const res = await fetch(
    `${PEXELS_BASE}/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
    { headers: { Authorization: PEXELS_KEY } }
  );
  if (!res.ok) throw new Error(`Pexels API error: ${res.status}`);
  const json = await res.json();
  return {
    images: json.photos.map(p => ({
      id: p.id,
      url: p.src.large,
      thumbnail: p.src.medium,
      description: p.alt,
      author: p.photographer,
      downloadUrl: p.src.original
    })),
    totalPages: Math.ceil(json.total_results / perPage),
    total: json.total_results
  };
}

export async function searchPixabay(query, page = 1, perPage = 12) {
  const res = await fetch(
    `${PIXABAY_BASE}/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&page=${page}&per_page=${perPage}&safesearch=true`
  );
  if (!res.ok) throw new Error(`Pixabay API error: ${res.status}`);
  const json = await res.json();
  return {
    images: json.hits.map(i => ({
      id: i.id,
      url: i.webformatURL,
      thumbnail: i.previewURL,
      description: i.tags,
      author: i.user,
      downloadUrl: i.fullHDURL || i.webformatURL
    })),
    totalPages: Math.ceil(json.totalHits / perPage),
    total: json.totalHits
  };
}

export async function searchImages(query, { page = 1, perPage = 12 } = {}) {
  const providers = [searchPexels, searchPixabay, searchUnsplash];
  for (const fn of providers) {
    try {
      return await fn(query, page, perPage);
    } catch (err) {
      console.warn(`${fn.name} failed:`, err);
    }
  }
  return { images: [], totalPages: 0, total: 0 };
}
