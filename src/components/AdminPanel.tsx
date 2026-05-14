import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { Campaign } from '../types';
import { ShieldCheck, Plus, Link, Type, FileText, Star, AlertTriangle, CheckCircle, List, Trash2, Power, PowerOff, Edit3, Save, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminPanel() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    targetLink: '',
    description: '',
    pointsPerReply: 3,
    maxEntries: 0,
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Campaign>>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'campaigns'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCampaigns(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Campaign)));
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || loading) return;

    const { title, targetLink, description, pointsPerReply, maxEntries } = formData;
    const twitterRegex = /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/[0-9]+(\?.*)?$/;

    if (title.trim().length < 5) {
      setStatus({ type: 'error', text: 'MISSION NAME TOO SHORT. MIN 5 CHARS.' });
      return;
    }

    if (!twitterRegex.test(targetLink)) {
      setStatus({ type: 'error', text: 'INVALID X LINK. MUST BE A TWEET STATUS URL.' });
      return;
    }

    if (description.trim().length < 20) {
      setStatus({ type: 'error', text: 'INSTRUCTIONS TOO VAGUE. BE MORE SPECIFIC (MIN 20 CHARS).' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      await addDoc(collection(db, 'campaigns'), {
        ...formData,
        maxEntries: maxEntries > 0 ? maxEntries : null,
        currentEntries: 0,
        active: true,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });

      setStatus({ type: 'success', text: 'Campaign deployed to the masses!' });
      setFormData({
        title: '',
        targetLink: '',
        description: '',
        pointsPerReply: 3,
        maxEntries: 0,
      });
    } catch (error) {
      console.error("Campaign creation error:", error);
      setStatus({ type: 'error', text: 'Deployment failed. The blockchain is angry.' });
    } finally {
      setLoading(false);
    }
  };

  const toggleCampaign = async (id: string, active: boolean) => {
    try {
      await updateDoc(doc(db, 'campaigns', id), { active });
    } catch (error) {
      console.error("Toggle error:", error);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!window.confirm("DELETE MISSION PERMANENTLY?")) return;
    try {
      await deleteDoc(doc(db, 'campaigns', id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const startEditing = (campaign: Campaign) => {
    setEditingId(campaign.id);
    setEditData({ ...campaign });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateDoc(doc(db, 'campaigns', editingId), editData);
      setEditingId(null);
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <header className="flex items-center gap-6 p-8 neo-box bg-meme-black text-white">
        <div className="p-4 bg-meme-yellow text-meme-black">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-meme-yellow">COMMAND CENTER</h1>
          <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.3em]">ADMIN PRIVILEGES GRANTED</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Creation Form */}
        <section className="neo-box bg-white p-10 h-fit">
          <h2 className="text-2xl font-black uppercase italic tracking-tight mb-10 flex items-center gap-3 text-meme-pink">
            <Plus className="w-6 h-6 stroke-[3]" /> LAUNCH NEW MISSION
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-meme-black/40">Mission Name</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="GENESIS DROP"
                className="neo-input w-full"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-meme-black/40">Points/Reply</label>
                <input
                  required
                  type="number"
                  min="1"
                  max="10"
                  value={formData.pointsPerReply}
                  onChange={(e) => setFormData(prev => ({ ...prev, pointsPerReply: parseInt(e.target.value) }))}
                  className="neo-input w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-meme-black/40">Max Entries (0=unlimited)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxEntries}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxEntries: parseInt(e.target.value) }))}
                  className="neo-input w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-meme-black/40">Target X Link</label>
              <input
                required
                type="url"
                value={formData.targetLink}
                onChange={(e) => setFormData(prev => ({ ...prev, targetLink: e.target.value }))}
                placeholder="https://x.com/..."
                className="neo-input w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-meme-black/40">Briefing</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="MISSION OBJECTIVES..."
                className="neo-input w-full"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="neo-btn w-full h-18 bg-meme-black text-meme-yellow hover:bg-meme-pink hover:text-white"
            >
              {loading ? 'DEPLOYING...' : 'BROADCAST MISSION'}
            </button>

            {status && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "p-4 border-4 font-black text-xs uppercase tracking-widest flex items-center gap-4",
                  status.type === 'success' ? "bg-meme-green border-meme-black" : "bg-red-500 text-white border-meme-black"
                )}
              >
                {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                {status.text}
              </motion.div>
            )}
          </form>
        </section>

        {/* Campaign List */}
        <section className="neo-box bg-white p-10">
          <h2 className="text-2xl font-black uppercase italic tracking-tight mb-10 flex items-center gap-3 text-meme-green">
            <List className="w-6 h-6 stroke-[3]" /> ACTIVE MISSIONS
          </h2>

          <div className="space-y-6">
            {campaigns.map((camp) => (
              <div key={camp.id} className="neo-box p-6 bg-meme-yellow/10">
                {editingId === camp.id ? (
                  <div className="space-y-4">
                    <input 
                      className="neo-input w-full text-xs" 
                      value={editData.title} 
                      onChange={e => setEditData({...editData, title: e.target.value})}
                    />
                    <textarea 
                      className="neo-input w-full text-xs" 
                      rows={2}
                      value={editData.description} 
                      onChange={e => setEditData({...editData, description: e.target.value})}
                    />
                    <div className="flex gap-2">
                       <button onClick={saveEdit} className="neo-btn bg-meme-green p-2 flex-1"><Save className="w-4 h-4 mx-auto" /></button>
                       <button onClick={() => setEditingId(null)} className="neo-btn bg-white p-2 flex-1"><X className="w-4 h-4 mx-auto" /></button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-black text-sm uppercase leading-tight">{camp.title}</h3>
                        <p className="text-[10px] font-bold opacity-40 uppercase">
                          Entries: {camp.currentEntries} / {camp.maxEntries || '∞'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => toggleCampaign(camp.id, !camp.active)}
                          className={cn("p-2 neo-box", camp.active ? "bg-meme-green" : "bg-meme-pink")}
                        >
                          {camp.active ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
                        </button>
                        <button onClick={() => startEditing(camp)} className="p-2 neo-box bg-white"><Edit3 className="w-3 h-3" /></button>
                        <button onClick={() => deleteCampaign(camp.id)} className="p-2 neo-box bg-red-500 text-white"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                    <div className="w-full bg-meme-black/10 h-2 mt-4 overflow-hidden border-2 border-meme-black">
                      <div 
                        className="h-full bg-meme-pink transition-all duration-500" 
                        style={{ width: `${camp.maxEntries ? (camp.currentEntries / camp.maxEntries) * 100 : 0}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="p-8 neo-box bg-meme-pink text-white font-black text-xs uppercase tracking-widest leading-relaxed flex gap-6 items-start">
        <AlertTriangle className="w-8 h-8 text-meme-yellow shrink-0 animate-pulse" />
        <p>
          COMMANDER: MISSIONS CAN BE DEACTIVATED AT ANY TIME. ONCE A LIMIT IS HIT, THE SYSTEM WILL AUTO-CLOSE THE PORTAL. 
        </p>
      </div>
    </div>
  );
}
