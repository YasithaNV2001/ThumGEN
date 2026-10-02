import { CoinsIcon, MenuIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `hover:text-pink-300 transition ${isActive ? "text-pink-400" : ""}`;

export default function Navbar() {
  const { isLoggedIn, user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const links = [
    { to: "/", label: "Home", end: true },
    { to: "/generate", label: "Generate" },
    ...(isLoggedIn
      ? [{ to: "/my-generation", label: "My Generations" }]
      : [{ to: "/#features", label: "Features" }]),
    { to: "/#contact", label: "Contact us" },
  ];

  return (
    <>
      <motion.nav
        className="fixed top-0 z-50 flex items-center justify-between w-full py-4 px-6 md:px-16 lg:px-24 xl:px-32 backdrop-blur"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
      >
        <Link to="/" aria-label="ThumGEN home">
          <img src="/logo.svg" alt="ThumGEN" className="w-auto h-8.5" />
        </Link>

        <div className="hidden md:flex items-center gap-8 transition duration-500">
          {links.map((link) =>
            link.to.includes("#") ? (
              <a key={link.to} href={link.to} className="hover:text-pink-300 transition">{link.label}</a>
            ) : (
              <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>{link.label}</NavLink>
            )
          )}
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <span
                title="Generations left"
                className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/10 border border-white/10"
              >
                <CoinsIcon className="size-3.5 text-pink-400" />
                {user?.credits ?? 0} credits
              </span>
              <div className="relative group">
                <button
                  aria-label="Account menu"
                  className="rounded-full size-8 bg-white/20 border-2 border-white/10"
                >
                  {user?.name.charAt(0).toUpperCase()}
                </button>
                <div className="absolute hidden group-hover:block group-focus-within:block top-6 right-0 pt-4">
                  <div className="min-w-44 rounded-lg bg-zinc-900 border border-white/10 p-3 text-sm space-y-2 shadow-xl">
                    <p className="font-medium text-zinc-100 truncate">{user?.name}</p>
                    <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
                    <button
                      onClick={() => logout()}
                      className="w-full mt-1 bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-1.5 rounded transition"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <button
              onClick={() => navigate(`/login`)}
              className="hidden md:block px-6 py-2.5 bg-pink-600 hover:bg-pink-700 active:scale-95 transition-all rounded-full"
            >
              Get Started
            </button>
          )}

          <button onClick={() => setIsOpen(true)} className="md:hidden" aria-label="Open menu">
            <MenuIcon size={26} className="active:scale-90 transition" />
          </button>
        </div>
      </motion.nav>

      <div
        className={`fixed inset-0 z-100 bg-black/40 backdrop-blur flex flex-col items-center
                justify-center text-lg gap-8 md:hidden transition-transform duration-400 ${
                  isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
      >
        {links.map((link) =>
          link.to.includes("#") ? (
            <a key={link.to} href={link.to} onClick={() => setIsOpen(false)}>{link.label}</a>
          ) : (
            <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setIsOpen(false)} className={linkClass}>
              {link.label}
            </NavLink>
          )
        )}

        {isLoggedIn ? (
          <>
            <span className="text-sm text-zinc-300">{user?.credits ?? 0} credits left</span>
            <button onClick={() => { setIsOpen(false); logout() }}>Logout</button>
          </>
        ) : (
          <Link onClick={() => setIsOpen(false)} to="/login">Login</Link>
        )}

        <button
          onClick={() => setIsOpen(false)}
          aria-label="Close menu"
          className="active:ring-3 active:ring-white
                aspect-square size-10 p-1 items-center justify-center bg-pink-600 hover:bg-pink-700
                 transition text-white rounded-md flex"
        >
          <XIcon />
        </button>
      </div>
    </>
  );
}
