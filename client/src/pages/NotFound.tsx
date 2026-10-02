import { Link } from "react-router-dom";
import SoftBackDrop from "../components/SoftBackDrop";

const NotFound = () => {
  return (
    <>
      <SoftBackDrop />
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <p className="text-7xl font-bold text-pink-500">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-100">Page not found</h1>
        <p className="mt-2 text-zinc-400">The page you're looking for doesn't exist or was moved.</p>
        <Link to="/" className="mt-8 px-6 py-2.5 bg-pink-600 hover:bg-pink-700 rounded-full transition">
          Back to home
        </Link>
      </div>
    </>
  );
};

export default NotFound;
