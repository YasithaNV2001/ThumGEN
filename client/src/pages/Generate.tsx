import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PlusIcon, SparklesIcon } from "lucide-react";
import { colorSchemes, type AspectRatio, type IThumbnail, type ThumbnailStyle } from "../assets/assets";
import SoftBackDrop from "../components/SoftBackDrop";
import AspectRatioSelector from "../components/AspectRatioSelector";
import StyleSelector from "../components/StyleSelector.tsx";
import ColorSchemeSelector from "../components/ColorSchemeSelector.tsx";
import PreviewPanel from "../components/PreviewPanel.tsx";
import { useAuth } from "../context/AuthContext.tsx";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../configs/api.ts";

const TITLE_MAX = 100;
const DETAILS_MAX = 500;

const Generate = () => {

  const { id } = useParams();
  const navigate = useNavigate()
  const { isLoggedIn, user, setCredits, guestLogin } = useAuth()

  const [title, setTitle] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [thumbnail, setThumbnail] = useState<IThumbnail | null>(null);
  const [loading, setLoading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [colorSchemeId, setColorSchemeId] = useState<string>(colorSchemes[0].id);
  const [style, setStyle] = useState<ThumbnailStyle>('Bold & Graphic');
  const [textOverlay, setTextOverlay] = useState(true);
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);

  const outOfCredits = isLoggedIn && user?.credits === 0;

  const resetForm = () => {
    setTitle('');
    setAdditionalDetails('');
    setThumbnail(null);
    setAspectRatio('16:9');
    setColorSchemeId(colorSchemes[0].id);
    setStyle('Bold & Graphic');
    setTextOverlay(true);
  };

  const handleGenerate = async () => {
    if (!title.trim()) return toast.error('Title is required');
    if (outOfCredits) return toast.error('You have used all your free credits');

    setLoading(true);
    setThumbnail(null);
    try {
      // Visitors can generate straight away: start a guest session on first use
      if (!isLoggedIn && !(await guestLogin())) return;

      const { data } = await api.post(`/api/thumbnail/generate`, {
        title: title.trim(),
        prompt: additionalDetails.trim(),
        style,
        aspect_ratio: aspectRatio,
        color_scheme: colorSchemeId,
        text_overlay: textOverlay,
      });
      setThumbnail(data.thumbnail);
      setCredits(data.credits);
      toast.success(data.message);
      navigate('/generate/' + data.thumbnail._id, { replace: true });
    } catch (error: any) {
      // A failed generation refunds the credit; keep the counter in sync
      const credits = error?.response?.data?.credits;
      if (typeof credits === 'number') setCredits(credits);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Viewing a saved thumbnail: load it and fill the form with its settings
  useEffect(() => {
    if (!id) {
      resetForm();
      return;
    }
    if (thumbnail?._id === id) return;

    (async () => {
      try {
        const { data } = await api.get(`/api/user/thumbnails/${id}`);
        const thumb: IThumbnail = data.thumbnail;
        setThumbnail(thumb);
        setTitle(thumb.title || '');
        setAdditionalDetails(thumb.user_prompt || '');
        setColorSchemeId(thumb.color_scheme || colorSchemes[0].id);
        setAspectRatio(thumb.aspect_ratio || '16:9');
        setStyle(thumb.style || 'Bold & Graphic');
        setTextOverlay(thumb.text_overlay ?? true);
      } catch (error) {
        toast.error(getErrorMessage(error));
        navigate('/generate', { replace: true });
      }
    })();
  }, [id]);

  const viewing = !!id;

  return (
    <>
      <SoftBackDrop />
      <div className="pt-24 min-h-screen">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-28 lg:pb-8">
          <div className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* Left panel */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/8 border border-white/12 shadow-xl space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-100">
                      {viewing ? 'Thumbnail Details' : 'Create Your Thumbnail'}
                    </h2>
                    <p className="text-sm text-zinc-400">
                      {viewing ? 'Settings used for this thumbnail' : 'Describe your vision and let AI bring it to life'}
                    </p>
                  </div>
                  {isLoggedIn && (
                    <span className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/30">
                      {user?.credits ?? 0} credits
                    </span>
                  )}
                </div>

                <fieldset disabled={viewing || loading} className="space-y-5 disabled:opacity-70">
                  {/* TITLE INPUT */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium mb-1.5">Title or Topic</label>
                    <input
                      id="title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={TITLE_MAX}
                      placeholder="e.g., 10 Tips for Better Sleep"
                      className="w-full px-4 py-3 rounded-lg border border-white/12 bg-black/20
                    text-zinc-100 placeholder:text-zinc-400
                    focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <div className="flex justify-end">
                      <span className="text-xs text-zinc-400">{title.length}/{TITLE_MAX}</span>
                    </div>
                  </div>

                  <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} />

                  <StyleSelector value={style} onChange={setStyle}
                    isOpen={styleDropdownOpen} setIsOpen={setStyleDropdownOpen} />

                  <ColorSchemeSelector value={colorSchemeId} onChange={setColorSchemeId} />

                  {/* TEXT OVERLAY TOGGLE */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium">
                      Add title text to image
                      <span className="block text-xs text-zinc-400 font-normal">Turn off for a text-free background</span>
                    </span>
                    <input type="checkbox" checked={textOverlay} onChange={(e) => setTextOverlay(e.target.checked)}
                      className="size-5 accent-pink-500" />
                  </label>

                  {/* ADDITIONAL DETAILS INPUT */}
                  <div className="space-y-2">
                    <label htmlFor="details" className="block text-sm font-medium">
                      Additional Prompts <span className="text-zinc-400 text-xs">(optional)</span>
                    </label>
                    <textarea id="details" value={additionalDetails}
                      onChange={(e) => setAdditionalDetails(e.target.value)} rows={3}
                      maxLength={DETAILS_MAX}
                      placeholder="Add any specific elements, mood or style preferences..."
                      className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/6 text-zinc-100
                    placeholder:text-zinc-400 focus:outline-none
                    focus:ring-2 focus:ring-pink-500 resize-none" />
                    <div className="flex justify-end">
                      <span className="text-xs text-zinc-400">{additionalDetails.length}/{DETAILS_MAX}</span>
                    </div>
                  </div>
                </fieldset>

                {/* BUTTONS */}
                {viewing ? (
                  <Link to="/generate"
                    className="text-[15px] w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-2
                    bg-white/10 hover:bg-white/15 border border-white/15 transition">
                    <PlusIcon className="size-4" /> Create New Thumbnail
                  </Link>
                ) : (
                  <button
                    onClick={handleGenerate}
                    disabled={loading || outOfCredits}
                    className="text-[15px] w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-2
                    bg-linear-to-b from-pink-500 to-pink-600 hover:from-pink-700
                    disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    <SparklesIcon className="size-4" />
                    {loading ? "Generating..."
                      : outOfCredits ? "No credits left"
                      : isLoggedIn ? "Generate Thumbnail (1 credit)"
                      : "Generate Free (no sign-up)"}
                  </button>
                )}

                {outOfCredits && user?.isGuest && (
                  <p className="text-xs text-center text-zinc-400">
                    Enjoyed it? <Link to="/login" className="text-pink-400 hover:underline">Create a free account</Link> for more credits.
                  </p>
                )}
              </div>
            </div>

            {/* Right panel */}
            <div>
              <div className="p-6 rounded-2xl bg-white/8 border border-white/10 shadow-xl">
                <h2 className="text-lg font-semibold text-zinc-100 mb-4">Preview</h2>
                <PreviewPanel thumbnail={thumbnail}
                  isLoading={loading}
                  aspectRatio={aspectRatio} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Generate;
