import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Zap, Chrome } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background patterns */}
      <div className="absolute top-10 left-10 w-32 h-32 border-8 border-meme-black rounded-full opacity-10 animate-bounce" />
      <div className="absolute bottom-10 right-10 w-40 h-40 border-8 border-meme-black opacity-10 rotate-45" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        className="neo-box bg-white p-12 max-w-lg w-full flex flex-col items-center text-center relative z-10"
      >
        <div className="w-24 h-24 bg-meme-black rounded-full flex items-center justify-center mb-8 shadow-[8px_8px_0px_#FF007A]">
          <Zap className="w-12 h-12 text-meme-yellow fill-current" />
        </div>
        
        <h1 className="text-7xl font-black italic tracking-tighter uppercase mb-4 leading-none">
          BLEENFI
        </h1>
        <div className="bg-meme-pink text-white px-6 py-2 font-black text-xs uppercase tracking-[0.3em] mb-12 -rotate-2">
          LFG!! Protocol Shilling
        </div>

        <div className="space-y-6 w-full">
          <button
            onClick={handleGoogleLogin}
            className="neo-btn w-full flex items-center justify-center gap-4 bg-meme-green text-meme-black hover:bg-meme-black hover:text-white"
          >
            <Chrome className="w-6 h-6" />
            ENTER THE ARENA
          </button>
          
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
            Shill Blin. Earn Points. Dominate.
          </p>
        </div>
      </motion.div>

      {/* Floaters */}
      <div className="mt-12 flex gap-8">
        {['#1 COMMUNITY', 'GM ENERGY', 'BULLISH'].map((tag) => (
          <div key={tag} className="neo-box bg-meme-black text-white px-4 py-1 text-[10px] font-black uppercase tracking-widest transform hover:scale-110 transition-transform">
            {tag}
          </div>
        ))}
      </div>
    </div>
  );
}
