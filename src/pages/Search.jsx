import { useEffect, useRef, useState } from 'react';
import { saveSelection } from '../utils/selection';
import { useNavigate } from 'react-router-dom';
import { searchImages } from '../utils/api';
import '../css/Search.css';

function Search() {
  const [q, setQ] = useState('');
  const [committedQuery, setCommittedQuery] = useState('');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const perPage = 20;

  const doSearch = async (query, pg) => {
    try {
      const { images, totalPages: tp } = await searchImages(query, {
        page: pg,
        perPage
      });
      return { images: images || [], totalPages: tp || 0 };
    } catch (e) {
      throw new Error(e?.message || 'Search failed');
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const query = q.trim();
    if (query.length < 2) return;
    setStatus('loading');
    setError('');
    setCommittedQuery(query);
    setPage(1);
    try {
      const { images, totalPages: tp } = await doSearch(query, 1);
      setItems(images);
      setTotalPages(tp);
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setError(err.message);
      setItems([]);
      setTotalPages(0);
    }
  };

  const onLoadMore = async () => {
    if (!committedQuery) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { images } = await doSearch(committedQuery, nextPage);
      setItems((prev) => [...prev, ...images]);
      setPage(nextPage);
    } catch (err) {
      setStatus('error');
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const canLoadMore =
    status === 'done' &&
    committedQuery &&
    (totalPages === 0 || page < totalPages);

  return (
    <main className="search-root">
      <header className="search-header">
        <form className="search-search" onSubmit={onSubmit} role="search">
          <input
            ref={inputRef}
            className="search-input"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Search images, e.g. "tiger"'
            aria-label="Search images"
          />
          <button
            className="search-btn primary"
            type="submit"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Searching…' : 'Search'}
          </button>
        </form>
      </header>

      {status === 'error' && (
        <div className="search-error">Error: {error}</div>
      )}

      <section className="search-grid" aria-live="polite">
        {items.map((img) => (
          <div key={img.id} className="search-card">
            <a
              className="search-card-link"
              href={img.url}
              target="_blank"
              rel="noreferrer"
              title={img.description || 'Image'}
            >
              <img
                src={img.thumbnail || img.url}
                alt={img.description || 'Image'}
                loading="lazy"
              />
            </a>

            <div className="search-meta">
              <span className="search-title-small">
                {img.description || 'Image'}
              </span>
              {img.author && (
                <span className="search-credit">{img.author}</span>
              )}
            </div>

            <div className="search-actions">
              <button
                className="search-btn"
                onClick={() => {
                  saveSelection({
                    kind: 'image',
                    url: img.url,
                    thumbnail: img.thumbnail || img.url,
                    description: img.description || 'Image',
                    author: img.author || ''
                  });
                  navigate('/escher');
                }}
              >
                Use in Escher
              </button>
            </div>
          </div>
        ))}
      </section>

      {canLoadMore && (
        <div className="search-loadmore">
          <button
            className="search-btn"
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}

      <footer className="search-footer">
        <small>Images open in a new tab.</small>
      </footer>
    </main>
  );
}

export default Search;
