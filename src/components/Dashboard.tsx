import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, onSnapshot, doc, increment, updateDoc, getDocs } from 'firebase/firestore';
import { Submission, SubmissionType, Campaign } from '../types';
import { Send, History, Trophy, TrendingUp, AlertCircle, CheckCircle2, ChevronDown, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { submitEngagement, validateTwitterLink } from '../services/submissionService';

type SortOption = 'newest' | 'points-high' | 'points-low';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [link, setLink] = useState('');
  const [type, setType] = useState<SubmissionType>('tweet');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    let q = query(
      collection(db, 'submissions'),
      where('userId', '==', user.uid)
    );

    // Apply sorting logic
    if (sortBy === 'newest') {
      q = query(q, orderBy('createdAt', 'desc'));
    } else if (sortBy === 'points-high') {
      q = query(q, orderBy('pointsEarned', 'desc'), orderBy('createdAt', 'desc'));
    } else if (sortBy === 'points-low') {
      q = query(q, orderBy('pointsEarned', 'asc'), orderBy('createdAt', 'desc'));
    }

    q = query(q, limit(20));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Submission));
      setSubmissions(docs);
    });

    const campaignsQuery = query(collection(db, 'campaigns'), where('active', '==', true));
    getDocs(campaignsQuery).then(snapshot => {
      setActiveCampaigns(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Campaign)));
    });

    return () => unsubscribe();
  }, [user, sortBy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !link.trim() || isSubmitting) return;

    if (!validateTwitterLink(link)) {
      setMessage({ 
        type: 'error', 
        text: 'INVALID LINK FORMAT. MUST BE A VALID X STATUS LINK (e.g., https://x.com/user/status/1234...)' 
      });
      // Simple shake effect via state would be nice but let's stick to the message for now as requested.
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await submitEngagement(user.uid, link, type, selectedCampaignId);
      setMessage({ type: 'success', text: `DRIP SECURED! +${result.pointsEarned} POINTS ADDED TO BAG.` });
      setLink('');
      setSelectedCampaignId('');
    } catch (error: any) {
      console.error("Submission failed:", error);
      let errorText = 'MISSION FAILED. PROTOCOL ERROR.';
      if (error.message === 'DUPLICATE_LINK') errorText = 'LINK ALREADY IN DATABASE. NO DOUBLE DIPPING!';
      if (error.message === 'CAMPAIGN_LIMIT_REACHED') errorText = 'CAMPAIGN LIMIT REACHED. TRY A DIFFERENT ONE.';
      if (error.message === 'CAMPAIGN_INACTIVE') errorText = 'CAMPAIGN IS NO LONGER ACTIVE.';
      
      setMessage({ type: 'error', text: errorText });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      {/* Left Column: Stats & Submission */}
      <div className="lg:col-span-2 space-y-10">
        <div className="grid grid-cols-2 gap-6">
          <div className="neo-box p-8 bg-meme-green overflow-hidden relative">
            <div className="flex items-center gap-3 mb-2 font-mono font-black uppercase text-xs tracking-widest">
              <Trophy className="w-4 h-4" /> Bleen Power
            </div>
            <div className="flex items-baseline gap-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={profile?.points || 0}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="text-6xl font-black italic tracking-tighter leading-none"
                >
                  {profile?.points || 0}
                </motion.div>
              </AnimatePresence>
            </div>
            {/* Visual Flash for gain */}
            <AnimatePresence>
              {message?.type === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 2] }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 bg-white/30 pointer-events-none z-0"
                />
              )}
            </AnimatePresence>
          </div>
          <div className="neo-box p-8 bg-meme-pink text-white">
            <div className="flex items-center gap-3 mb-2 font-mono font-black uppercase text-xs tracking-widest">
              <TrendingUp className="w-4 h-4" /> Shill Count
            </div>
            <div className="text-6xl font-black italic tracking-tighter leading-none">
              {submissions.length}
            </div>
          </div>
        </div>

        <section className="neo-box p-10 bg-white">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black uppercase italic tracking-tight flex items-center gap-3">
              <Send className="w-8 h-8" /> Shill & Earn
            </h2>
            <div className="bg-meme-black text-meme-yellow px-4 py-1 font-black text-[10px] uppercase tracking-[0.2em]">
              Points = Utility
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-[0.2em]">Drop the X Link</label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://x.com/your-shill/status/69420..."
                className="neo-input w-full h-16 text-lg"
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setType('tweet')}
                  className={cn(
                    "neo-btn flex-1",
                    type === 'tweet' ? "bg-meme-black text-white" : "bg-white text-meme-black hover:bg-meme-yellow"
                  )}
                >
                  New Tweet (+2)
                </button>
                <button
                  type="button"
                  onClick={() => setType('reply')}
                  className={cn(
                    "neo-btn flex-1",
                    type === 'reply' ? "bg-meme-black text-white" : "bg-white text-meme-black hover:bg-meme-yellow"
                  )}
                >
                  Reply (+1)
                </button>
              </div>

              {type === 'reply' && activeCampaigns.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 pt-6 border-t-4 border-meme-black"
                >
                  <label className="text-xs font-black uppercase tracking-[0.2em]">Daily Campaign Bonus</label>
                  <div className="relative">
                    <select
                      value={selectedCampaignId}
                      onChange={(e) => setSelectedCampaignId(e.target.value)}
                      className="neo-input w-full h-14 appearance-none pr-10 cursor-pointer"
                    >
                      <option value="">No Bonus (Standard Shill)</option>
                      {activeCampaigns.map(camp => (
                        <option key={camp.id} value={camp.id}>{camp.title.toUpperCase()} (+{camp.pointsPerReply} PTS)</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 pointer-events-none stroke-[3]" />
                  </div>
                </motion.div>
              )}
            </div>

            <button
              disabled={isSubmitting || !link}
              className="neo-btn w-full h-20 text-2xl bg-meme-pink text-white hover:bg-white hover:text-meme-pink disabled:opacity-30 disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-none"
            >
              {isSubmitting ? 'VERIFYING DRIP...' : 'SEND IT TO THE MOON'}
            </button>

            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn(
                    "flex items-center gap-4 p-6 border-4 font-black text-sm uppercase tracking-tighter",
                    message.type === 'success' ? "bg-meme-green border-meme-black" : "bg-red-500 text-white border-meme-black"
                  )}
                >
                  {message.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </section>
      </div>

      {/* Right Column: History */}
      <div className="space-y-8">
        <section className="neo-box bg-white p-8 h-full">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-3">
              <History className="w-6 h-6" /> Feed
            </h2>
            <div className="relative group">
               <button className="p-2 neo-box bg-meme-yellow hover:bg-meme-black hover:text-white transition-colors">
                  <Filter className="w-4 h-4" />
               </button>
               <div className="absolute right-0 top-full mt-2 w-48 neo-box bg-white z-50 hidden group-hover:block border-4 border-meme-black">
                  {(['newest', 'points-high', 'points-low'] as SortOption[]).map(opt => (
                    <button 
                      key={opt}
                      onClick={() => setSortBy(opt)}
                      className={cn(
                        "w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-meme-yellow transition-colors",
                        sortBy === opt && "bg-meme-black text-white"
                      )}
                    >
                      {opt.replace('-', ' ')}
                    </button>
                  ))}
               </div>
            </div>
          </div>

          <div className="space-y-6">
            {submissions.length === 0 ? (
              <div className="text-center py-20 opacity-20 font-black text-sm uppercase tracking-[0.3em] rotate-12">
                Empty Bag
              </div>
            ) : (
              submissions.map((sub) => (
                <div key={sub.id} className="border-b-4 border-meme-black pb-6 last:border-0 group">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black uppercase bg-meme-black text-white px-3 py-1">
                      {sub.type}
                    </span>
                    <span className="font-mono text-[10px] font-bold opacity-40">
                      {sub.createdAt ? formatDistanceToNow(sub.createdAt.toDate(), { addSuffix: true }) : 'NOW'}
                    </span>
                  </div>
                  <a 
                    href={sub.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs font-mono font-bold break-all line-clamp-1 opacity-50 hover:opacity-100 hover:text-meme-pink transition-all"
                  >
                    {sub.link}
                  </a>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-meme-green animate-pulse" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-meme-green">Verified</span>
                    </div>
                    <span className="font-black text-xl italic tracking-tighter">+{sub.pointsEarned} PTS</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
