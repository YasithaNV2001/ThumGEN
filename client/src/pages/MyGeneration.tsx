import { useEffect, useState } from "react";
import { type IThumbnail } from "../assets/assets";
import SoftBackDrop from "../components/SoftBackDrop";
import { useNavigate, Link } from "react-router-dom";
import { ArrowUpRightIcon, DownloadIcon, Loader2Icon, SparklesIcon, TrashIcon } from "lucide-react";
import api, { getErrorMessage } from "../configs/api";
import { downloadImage } from "../utils/download";
import toast from "react-hot-toast";

const PAGE_SIZE = 12;

const aspectRatioClassesMap: Record<string, string> = {
  "16:9": "aspect-video",
  "1:1": "aspect-square",
  "9:16": "aspect-[9/16]",
};

const MyGeneration = () => {
  const navigate = useNavigate();

  const [thumbnails, setThumbnails] = useState<IThumbnail[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchThumbnails = async (pageToLoad: number) => {
    try {
      pageToLoad === 1 ? setLoading(true) : setLoadingMore(true);
      const { data } = await api.get(`/api/user/thumbnails`, { params: { page: pageToLoad, limit: PAGE_SIZE } });
      setThumbnails((prev) => (pageToLoad === 1 ? data.thumbnails : [...prev, ...data.thumbnails]));
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this thumbnail?")) return;
    try {
      const { data } = await api.delete(`/api/thumbnail/delete/${id}`);
      toast.success(data.message);
      setThumbnails((prev) => prev.filter((t) => t._id !== id));
      setTotal((prev) => prev - 1);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  useEffect(() => {
    fetchThumbnails(1);
  }, []);

  const previewLink = (thumb: IThumbnail) =>
    `/preview?${new URLSearchParams({ thumbnail_url: thumb.image_url || "", title: thumb.title })}`;

  return (
    <>
      <SoftBackDrop />
      <div className="mt-32 min-h-screen px-6 md:px-16 lg:px-24 xl:px-32">
        {/*HEADER*/}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-200">My Generations</h1>
            <p className="text-sm text-zinc-400 mt-1">
              View and manage all your AI-generated thumbnails{total > 0 && ` (${total})`}
            </p>
          </div>
          <Link to="/generate" className="flex items-center gap-2 px-5 py-2.5 bg-pink-600 hover:bg-pink-700 rounded-full text-sm transition">
            <SparklesIcon className="size-4" /> New Thumbnail
          </Link>
        </div>

        {/*LOADING*/}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/6 border border-white/10 animate-pulse h-65" />
            ))}
          </div>
        )}

        {/*EMPTY STATE*/}
        {!loading && thumbnails.length === 0 && (
          <div className="text-center py-24">
            <h3 className="text-lg font-semibold text-zinc-200">No thumbnails generated yet</h3>
            <p className="text-sm text-zinc-400 mt-2">Start creating your first AI-generated thumbnail.</p>
            <Link to="/generate" className="inline-block mt-6 px-6 py-2.5 bg-pink-600 hover:bg-pink-700 rounded-full transition">
              Generate one now
            </Link>
          </div>
        )}

        {/*GRID */}
        {!loading && thumbnails.length > 0 && (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-8">
            {thumbnails.map((thumb) => {
              const aspectClass = aspectRatioClassesMap[thumb.aspect_ratio || "16:9"];
              return (
                <div
                  key={thumb._id}
                  onClick={() => navigate(`/generate/${thumb._id}`)}
                  className="mb-8 group relative cursor-pointer rounded-2xl bg-white/6 border border-white/10
                  transition shadow-xl break-inside-avoid"
                >
                  {/*IMAGE CONTAINER*/}
                  <div className={`relative overflow-hidden rounded-t-2xl ${aspectClass} bg-black`}>
                    {thumb.image_url ? (
                      <img
                        src={thumb.image_url.replace(/^http:\/\//i, 'https://')}
                        alt={thumb.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-zinc-400">
                        {thumb.isGenerating ? "Generating..." : "No Image"}
                      </div>
                    )}
                  </div>

                  {/*CONTENT*/}
                  <div className="p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2">{thumb.title}</h3>

                    <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
                      <span className="px-2 py-0.5 rounded bg-white/8">{thumb.style}</span>
                      {thumb.color_scheme && <span className="px-2 py-0.5 rounded bg-white/8 capitalize">{thumb.color_scheme}</span>}
                      <span className="px-2 py-0.5 rounded bg-white/8">{thumb.aspect_ratio}</span>
                    </div>

                    {thumb.createdAt && (
                      <p className="text-xs text-zinc-500">{new Date(thumb.createdAt).toDateString()}</p>
                    )}
                  </div>

                  {/*ACTIONS*/}
                  {thumb.image_url && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-2 right-2 max-sm:flex sm:hidden group-hover:flex gap-1.5"
                    >
                      <button type="button" title="Delete" aria-label="Delete thumbnail" onClick={() => handleDelete(thumb._id)}>
                        <TrashIcon className="size-6 bg-black/50 p-1 rounded hover:bg-pink-600 transition-all" />
                      </button>
                      <button type="button" title="Download" aria-label="Download thumbnail"
                        onClick={() => downloadImage(thumb.image_url!, thumb.title)}>
                        <DownloadIcon className="size-6 bg-black/50 p-1 rounded hover:bg-pink-600 transition-all" />
                      </button>
                      <Link title="Preview on YouTube" aria-label="Preview on YouTube" target="_blank" to={previewLink(thumb)}>
                        <ArrowUpRightIcon className="size-6 bg-black/50 p-1 rounded hover:bg-pink-600 transition-all" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/*LOAD MORE*/}
        {!loading && page < totalPages && (
          <div className="flex justify-center pb-16">
            <button
              onClick={() => fetchThumbnails(page + 1)}
              disabled={loadingMore}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/15 bg-white/8 hover:bg-white/12 transition disabled:opacity-60"
            >
              {loadingMore && <Loader2Icon className="size-4 animate-spin" />}
              Load more
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default MyGeneration;
