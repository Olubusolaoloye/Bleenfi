import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { auth } from '../firebase';
import { LogOut, Zap, LayoutDashboard, Flag, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Navbar() {
  const { user, profile, isAdmin } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const navItems = [
    { label: 'DASHBOARD', path: '/', icon: LayoutDashboard },
    { label: 'CAMPAIGNS', path: '/campaigns', icon: Flag },
    ...(isAdmin ? [{ label: 'ADMIN', path: '/admin', icon: ShieldCheck }] : []),
  ];

  return (
    <nav className="border-b-4 border-meme-black bg-meme-yellow sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-meme-black p-2 shadow-[2px_2px_0px_#FF007A]">
              <Zap className="w-6 h-6 text-meme-yellow fill-current group-hover:animate-pulse" />
            </div>
            <span className="font-black text-2xl tracking-tighter uppercase italic">BLEENFI</span>
          </Link>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "px-4 py-2 text-xs font-black transition-all hover:bg-meme-black hover:text-white border-2 border-transparent hover:border-meme-black",
                    location.pathname === item.path && "bg-meme-black text-white"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-6 pl-6 border-l-4 border-meme-black">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Wallet Bal</div>
                <div className="font-black text-2xl leading-none italic">{profile?.points || 0} <span className="text-xs">PTS</span></div>
              </div>
              
              <button
                onClick={() => auth.signOut()}
                className="neo-btn p-2 bg-meme-pink text-white hover:bg-white hover:text-meme-pink border-2"
                title="GTFO"
              >
                <LogOut className="w-5 h-5 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
