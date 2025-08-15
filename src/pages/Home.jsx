import { useMemo, useEffect } from 'react';
import '../css/Home.css';

const wallpaperFiles = import.meta.glob('../wallpapers/*.png', {
  eager: true,
  query: '?url',
  import: 'default'
});

const wallpaperUrls = Object.values(wallpaperFiles);

export default function Wallpaper() {
  const bgUrl = useMemo(() => {
    if (!wallpaperUrls.length) return 'none';
    const i = Math.floor(Math.random() * wallpaperUrls.length);
    return `url("${wallpaperUrls[i]}")`;
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--bg-image', bgUrl);
  }, [bgUrl]);

  return <div className="wallpaper" />;
}
