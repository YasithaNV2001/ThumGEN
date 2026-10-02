import { yt_html } from "../assets/assets.ts"
import { Link, useSearchParams } from "react-router-dom";

// Query params end up inside HTML, so escape them to prevent script injection via a crafted link
const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

// Only allow images hosted on Cloudinary over HTTPS
const isSafeImageUrl = (value: string | null): value is string => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com';
  } catch {
    return false;
  }
};

const YtPreview = () => {
  const [searchParams] = useSearchParams();
  const thumbnailUrl = searchParams.get('thumbnail_url');
  const title = searchParams.get('title') || 'Untitled video';

  if (!isSafeImageUrl(thumbnailUrl)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-zinc-300">This preview link is invalid.</p>
        <Link to="/my-generation" className="px-6 py-2.5 bg-pink-600 hover:bg-pink-700 rounded-full">Go to My Generations</Link>
      </div>
    );
  }

  const html = yt_html
    .replace("%%THUMBNAIL_URL%%", escapeHtml(thumbnailUrl))
    .replace("%%TITLE%%", escapeHtml(title));

  return (
    <div className="fixed inset-0 z-100 bg-black">
      {/* Scripts are needed for the Tailwind CDN, but without allow-same-origin the
          iframe runs in an opaque origin and can't touch our cookies or DOM */}
      <iframe srcDoc={html} title="YouTube preview" sandbox="allow-scripts" width="100%" height="100%" />
    </div>
  )
}

export default YtPreview
