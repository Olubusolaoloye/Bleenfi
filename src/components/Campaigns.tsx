import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { Campaign } from '../types';
import { Flag, ExternalLink, Flame, Info, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { submitEngagement, validateTwitterLink } from '../services/submissionService';
import { cn } from '../lib/utils';

export default function Campaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, { type: 'success' | 'error', text: string } | null>>({});

  useEffect(() => {
    const q = query(
      collection(db, 'campaigns'),
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Campaign));
      setCampaigns(docs);
      setLoading(false);
    }, (error) => {
      console.error("Campaigns error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCampaignSubmit = async (campId: string) => {
    const link = links[campId];
    if (!user || !link || !link.trim() || submittingId === campId) return;

    if (!validateTwitterLink(link)) {
      setMessages(prev => ({ 
        ...prev, 
        [campId]: { type: 'error', text: 'INVALID LINK. MUST BE A VALID X STATUS URL.' } 
      }));
      return;
    }

    setSubmittingId(campId);
    setMessages(prev => ({ ...prev, [campId]: null }));

    try {
      const result = await submitEngagement(user.uid, link, 'reply', campId);
      setMessages(prev => ({ ...prev, [campId]: { type: 'success', text: `MISSION ACCOMPLISHED! +${result.pointsEarned} PTS SECURED.` } }));
      setLinks(prev => ({ ...prev, [campId]: '' }));
    } catch (error: any) {
      console.error("Campaign sub failed:", error);
      let errorText = 'MISSION FAILED. SYSTEM REJECTED SUBMISSION.';
      if (error.message === 'DUPLICATE_LINK') errorText = 'ALREADY SUBMITTED THIS LINK. NO DUPLICATES.';
      if (error.message === 'CAMPAIGN_LIMIT_REACHED') errorText = 'MISSION CAPACITY REACHED.';
      if (error.message === 'CAMPAIGN_INACTIVE') errorText = 'MISSION EXPIRED.';
      setMessages(prev => ({ ...prev, [campId]: { type: 'error', text: errorText } }));
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header className="text-center space-y-4">
        <h1 className="text-6xl font-black uppercase italic tracking-tighter drop-shadow-[4px_4px_0px_#FF007A]">DAILY MISSIONS</h1>
        <p className="text-xs font-black opacity-60 uppercase tracking-[0.3em]">RECRUITING SHILLERS FOR THE BLIN REVOLUTION</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-8 border-meme-black border-t-meme-pink rounded-full animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="neo-box p-20 text-center space-y-6 bg-white/50 border-dashed">
          <Info className="w-16 h-16 mx-auto opacity-20" />
          <p className="font-black text-sm uppercase tracking-widest opacity-40">CRICKETS... CHECK BACK LATER ANON</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10">
          {campaigns.map((camp) => (
            <motion.div
              key={camp.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="neo-box relative bg-white overflow-hidden flex flex-col"
            >
              {/* Sticker Decor */}
              <div className="absolute top-2 right-2 bg-meme-green border-4 border-meme-black px-4 py-1 font-black text-[10px] uppercase tracking-widest rotate-6 z-20 shadow-md">
                HOT DROP
              </div>

              <div className="p-10 border-b-4 border-meme-black">
                <div className="flex flex-col md:flex-row justify-between gap-10">
                  <div className="space-y-6 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="bg-meme-pink text-white text-[10px] font-black px-3 py-1 uppercase flex items-center gap-2">
                        <Flame className="w-3 h-3 fill-current animate-pulse" /> LIVE NOW
                      </span>
                      <span className="text-[10px] font-mono font-bold opacity-30 uppercase">
                        DEPLOYED {format(camp.createdAt.toDate(), 'PPP')}
                      </span>
                    </div>
                    
                    <h2 className="text-4xl font-black uppercase tracking-tight leading-none">
                      {camp.title}
                    </h2>
                    
                    <p className="text-sm font-bold leading-relaxed opacity-60 max-w-xl">
                      {camp.description}
                    </p>
                    
                    <div className="pt-2">
                      <a
                        href={camp.targetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="neo-btn inline-flex items-center gap-3 bg-meme-black text-meme-yellow hover:bg-meme-green hover:text-meme-black"
                      >
                        <ExternalLink className="w-5 h-5 stroke-[3]" /> SHILL THIS LINK
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-col items-center md:items-end justify-center min-w-[200px] bg-meme-yellow/10 p-6 border-4 border-dashed border-meme-black/20">
                    <div className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-2 text-right">REWARD DRIP</div>
                    <div className="text-6xl font-black italic tracking-tighter text-right text-meme-pink leading-none">
                      +{camp.pointsPerReply}
                    </div>
                    <div className="text-xl font-black italic mb-4">PTS</div>
                    
                    <div className="w-full space-y-1">
                      <div className="flex justify-between text-[8px] font-black opacity-40 uppercase">
                        <span>Progress</span>
                        <span>{camp.currentEntries} / {camp.maxEntries || '∞'}</span>
                      </div>
                      <div className="w-full bg-meme-black/10 h-3 border-2 border-meme-black overflow-hidden relative">
                         <div 
                          className="h-full bg-meme-green" 
                          style={{ width: `${camp.maxEntries ? Math.min((camp.currentEntries / camp.maxEntries) * 100, 100) : 0}%` }}
                         />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submission Area */}
              <div className="bg-meme-black/5 p-8">
                 <div className="max-w-2xl">
                    <label className="block text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">Submit your shill link directly here</label>
                    <div className="flex gap-4">
                       <input 
                          type="text"
                          value={links[camp.id] || ''}
                          onChange={(e) => setLinks(prev => ({ ...prev, [camp.id]: e.target.value }))}
                          placeholder="https://x.com/your-reply..."
                          className="neo-input flex-1 h-14"
                       />
                       <button 
                          onClick={() => handleCampaignSubmit(camp.id)}
                          disabled={submittingId === camp.id || !links[camp.id]}
                          className="neo-btn bg-meme-black text-white px-8 disabled:opacity-50"
                       >
                          {submittingId === camp.id ? '...' : <Send className="w-6 h-6" />}
                       </button>
                    </div>
                    <AnimatePresence>
                      {messages[camp.id] && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={cn(
                            "mt-4 p-4 border-4 font-black text-[10px] uppercase tracking-widest flex items-center gap-3",
                            messages[camp.id]?.type === 'success' ? "bg-meme-green border-meme-black" : "bg-red-500 text-white border-meme-black"
                          )}
                        >
                          {messages[camp.id]?.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                          {messages[camp.id]?.text}
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
