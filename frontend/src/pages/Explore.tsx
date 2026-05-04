import React, { useEffect, useState, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import { apiUrl } from '../lib/api';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Loader2, Sparkles, TrendingUp, CheckCircle, X, ChevronRight,
  Users, BarChart3, Shield, Globe, Mail, FileText, Zap,
  Star, CreditCard, Lock, ArrowRight, Share2, BookOpen,
  AlertCircle, Wallet, BadgeCheck, Building2, Lightbulb, Heart, Layers,
  Search, SlidersHorizontal, Cpu
} from 'lucide-react';

/* ─────────────────────────── Types ─────────────────────────── */
interface Backer { username: string; amount: number; date: string; }
interface Campaign {
  _id: string;
  hook: string;
  blueprint: string;
  fundingGoal: number;
  currentFunding: number;
  status: string;
  creatorName: string;
  contactEmail?: string;
  category: string;
  createdAt?: string;
  backers?: Backer[];
  requiredSkills?: string[];
}

/* ─────────────────────────── Design tokens ─────────────────── */
const CAT: Record<string, {
  icon: React.ElementType;
  glow: string;
  pill: string;
  bar: string;
  banner: string;
}> = {
  Tech: { icon: Zap, glow: 'hover:shadow-violet-500/20', pill: 'bg-violet-500/15 text-violet-300 border-violet-500/25', bar: 'from-violet-500 to-indigo-500', banner: 'from-violet-900/40 via-indigo-900/30 to-transparent' },
  Creative: { icon: Lightbulb, glow: 'hover:shadow-rose-500/20', pill: 'bg-rose-500/15    text-rose-300    border-rose-500/25', bar: 'from-rose-500 to-pink-500', banner: 'from-rose-900/40    via-pink-900/30    to-transparent' },
  Community: { icon: Heart, glow: 'hover:shadow-emerald-500/20', pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25', bar: 'from-emerald-500 to-teal-500', banner: 'from-emerald-900/40 via-teal-900/30    to-transparent' },
  Other: { icon: Layers, glow: 'hover:shadow-amber-500/20', pill: 'bg-amber-500/15   text-amber-300   border-amber-500/25', bar: 'from-amber-500 to-orange-500', banner: 'from-amber-900/40   via-orange-900/30  to-transparent' },
};
const fallCat = CAT.Other;
const getCat = (c: string) => CAT[c] ?? fallCat;

const TIERS = [
  { label: 'Seed', sub: 'Early backer', amount: 5000, equity: 0.01, icon: '🌱', perks: ['Early product access', 'Shareholder certificate', 'Monthly newsletter'] },
  { label: 'Growth', sub: 'Growth investor', amount: 25000, equity: 0.05, icon: '📈', perks: ['All Seed perks', 'Quarterly board update', 'Priority support line'] },
  { label: 'Lead', sub: 'Strategic partner', amount: 100000, equity: 0.15, icon: '🏆', perks: ['All Growth perks', 'Advisory board seat', 'Co-branding rights', 'Direct founder access'] },
  { label: 'Custom', sub: 'Pay as you wish', amount: 0, equity: 0, icon: '💫', perks: ['Official Backer Certificate', 'Project Updates'] },
];

/* ─────────────────────────── Reusable Section ──────────────── */
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{title}</h3>
      </div>
      <div className="bg-white/2 border border-white/6 rounded-2xl p-4">
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════ Main Component ════════════════════════════ */
export default function Explore() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fundingId, setFundingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('Newest');
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const certRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<'tiers' | 'form' | 'confirm' | 'done' | 'skill'>('tiers');
  const [pledgeSkill, setPledgeSkill] = useState('');
  const [pledgeHours, setPledgeHours] = useState('');
  const [pledgeValue, setPledgeValue] = useState('');
  const [isPledging, setIsPledging] = useState(false);
  const { getToken } = useAuth();
  const { user } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const downloadCertificate = async () => {
    if (!certRef.current) return;
    const canvas = await html2canvas(certRef.current, { backgroundColor: '#080b12' });
    const link = document.createElement('a');
    link.download = `Certificate_${selected?.hook || 'Investment'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);
  useEffect(() => {
    document.body.style.overflow = selected ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selected]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closePanel(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const fetchCampaigns = async () => {
    try {
      const token = await getToken();
      const res = await fetch(apiUrl('/api/campaigns'), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load campaigns');
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const openPanel = (c: Campaign) => { setSelected(c); setSelectedTier(null); setStep('tiers'); };
  const closePanel = useCallback(() => { setSelected(null); setSelectedTier(null); setStep('tiers'); }, []);

  const handleInvestSkill = async () => {
    if (!selected || !pledgeSkill || !pledgeHours || !pledgeValue) return;
    setIsPledging(true);
    try {
      const token = await getToken();
      const res = await fetch(apiUrl(`/api/campaigns/${selected._id}/invest-skill`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userId: user?.id,
          username: user?.username || user?.firstName || 'Anonymous',
          skill: pledgeSkill,
          hoursPledged: Number(pledgeHours),
          estimatedValue: Number(pledgeValue)
        })
      });
      if (!res.ok) throw new Error('Failed to pledge skill');
      alert('Skill pledged successfully! The founder will review it.');
      setStep('done'); // Or close panel
    } catch (e) {
      alert('Failed to pledge skill');
    } finally {
      setIsPledging(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const initiateRazorpay = async (id: string, amount: number) => {
    setFundingId(id);
    const backerUsername = user?.username || user?.firstName || 'Anonymous';
    try {
      const token = await getToken();
      const res = await fetch(apiUrl(`/api/campaigns/${id}/razorpay-order`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, backerUsername }),
      });
      if (!res.ok) throw new Error();
      const order = await res.json();

      if (order.isMock) {
        // Handle mock mode locally
        await fetch(apiUrl(`/api/campaigns/${id}/razorpay-verify`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ isMock: true, amount, backerUsername }),
        });
        fetchCampaigns();
        setStep('done');
        setFundingId(null);
        return;
      }

      const resScript = await loadRazorpayScript();
      if (!resScript) {
        alert('Razorpay SDK failed to load. Are you online?');
        setFundingId(null);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Crowdfunding Platform',
        description: `Investment in ${selected?.hook || 'Venture'}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            const freshToken = await getToken();
            const res = await fetch(apiUrl(`/api/campaigns/${id}/razorpay-verify`), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${freshToken}` },
              body: JSON.stringify({ ...response, amount, backerUsername }),
            });

            if (!res.ok) throw new Error('Verification failed on server');

            await fetchCampaigns();

            // Update the locally selected campaign so the side panel shows the new amount
            setSelected(prev => prev ? {
              ...prev,
              currentFunding: prev.currentFunding + amount,
              backers: [...(prev.backers || []), { username: backerUsername, amount, date: new Date().toISOString() }]
            } : null);

            setStep('done');
          } catch (e) {
            console.error(e);
            alert('Payment verification failed. Please contact support if you were charged.');
          }
        },
        prefill: {
          name: backerUsername,
          email: user?.primaryEmailAddress?.emailAddress || '',
        },
        theme: {
          color: '#4f46e5', // Indigo 600
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on('payment.failed', function (response: any) {
        alert(response.error.description);
      });
      paymentObject.open();

    } catch (e) {
      alert('Checkout initialization failed. Please try again.');
    } finally {
      setFundingId(null);
    }
  };

  const filtered = campaigns
    .filter(c => activeCategory === 'All' || c.category === activeCategory)
    .filter(c => c.hook.toLowerCase().includes(searchQuery.toLowerCase()) || c.blueprint.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortOption === 'Most Funded') return b.currentFunding - a.currentFunding;
      if (sortOption === 'Goal Amount') return b.fundingGoal - a.fundingGoal;
      // Default: Newest
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  const totalRaised = campaigns.reduce((s, c) => s + c.currentFunding, 0);

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#080b12]">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-[3px] border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <div className="absolute inset-0 rounded-full border-[3px] border-violet-500/10 border-b-violet-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.4s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-indigo-400 animate-pulse" />
        </div>
      </div>
      <p className="text-gray-500 mt-6 text-sm tracking-widest uppercase font-medium">Scanning deal flow…</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080b12] text-white font-sans">

      {/* ══ HERO ══ */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -top-20 right-1/4 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_0%,rgba(99,102,241,0.08),transparent_60%)]" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-xs font-bold text-indigo-400 mb-6 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" /> Live Deal Flow
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end gap-10">
            <div className="flex-grow">
              <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.05] mb-4">
                Back the Next<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400">Big Thing.</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-xl leading-relaxed">
                Institutional-grade deal flow, curated for builders and believers. Discover, invest, and build the future—together.
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {[
                { label: 'Active Deals', value: campaigns.length.toString(), color: 'text-white' },
                { label: 'Total Raised', value: `₹${(totalRaised / 1000).toFixed(1)}k`, color: 'text-emerald-400' },
                { label: 'Fully Funded', value: campaigns.filter(c => c.status === 'Funded').length.toString(), color: 'text-indigo-400' },
              ].map((s, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <div className="w-px h-12 bg-white/8 mx-4" />}
                  <div className="text-center px-2">
                    <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-gray-600 uppercase tracking-widest mt-1 font-medium">{s.label}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ STICKY FILTER BAR ══ */}
      <div className="sticky top-0 z-30 bg-[#080b12]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {['All', 'Tech', 'Creative', 'Community', 'Other'].map(cat => {
              const ct = getCat(cat);
              const Icon = cat !== 'All' ? ct.icon : Sparkles;
              const isActive = activeCategory === cat;
              const count = cat === 'All' ? campaigns.length : campaigns.filter(c => c.category === cat).length;
              return (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-250 ${isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-[1.03]'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/8 hover:border-white/15'
                    }`}>
                  <Icon className="w-3.5 h-3.5" />
                  {cat}
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-600'}`}>{count}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 ml-auto shrink-0 w-full md:w-auto">
            <div className="relative flex-grow md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search ventures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 outline-none transition-all"
              />
            </div>
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="appearance-none bg-white/5 border border-white/10 hover:border-white/20 rounded-xl pl-9 pr-8 py-2 text-sm text-white outline-none cursor-pointer transition-all"
              >
                <option value="Newest" className="bg-[#0e1220]">Newest</option>
                <option value="Most Funded" className="bg-[#0e1220]">Most Funded</option>
                <option value="Goal Amount" className="bg-[#0e1220]">Goal Amount</option>
              </select>
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 rotate-90 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ══ CARD GRID ══ */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm font-medium mb-8 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" /> {error}
          </div>
        )}

        {filtered.length === 0 && !error ? (
          <div className="text-center py-28 bg-white/2 rounded-3xl border border-white/5">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Sparkles className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No ventures in <span className="text-indigo-400">{activeCategory}</span></h3>
            <p className="text-gray-600 text-sm">Try a different category or check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(campaign => {
              const pct = Math.min(100, Math.round((campaign.currentFunding / campaign.fundingGoal) * 100));
              const isFunded = campaign.status === 'Funded';
              const ct = getCat(campaign.category);
              const Icon = ct.icon;
              const daysLeft = campaign.createdAt
                ? Math.max(0, 30 - Math.floor((Date.now() - new Date(campaign.createdAt).getTime()) / 86400000))
                : 30;

              return (
                <div key={campaign._id} onClick={() => openPanel(campaign)}
                  className={`group relative cursor-pointer rounded-2xl overflow-hidden border border-white/8 bg-[#0e1220] hover:border-white/20 hover:shadow-2xl ${ct.glow} transition-all duration-300 flex flex-col hover:-translate-y-0.5`}>

                  {/* Coloured top strip */}
                  <div className={`h-px w-full bg-gradient-to-r ${ct.bar}`} />
                  {/* Ambient top gradient */}
                  <div className={`absolute inset-x-0 top-0 h-40 bg-gradient-to-b ${ct.banner} opacity-60 pointer-events-none`} />

                  <div className="relative p-5 flex flex-col h-full">
                    {/* Row 1: badges */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${ct.pill}`}>
                        <Icon className="w-3 h-3" /> {campaign.category}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${isFunded ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                        : pct >= 75 ? 'bg-amber-500/15   text-amber-400   border border-amber-500/25'
                          : 'bg-sky-500/15     text-sky-400     border border-sky-500/25'
                        }`}>
                        {isFunded ? '✓ Funded' : `${daysLeft}d left`}
                      </span>
                    </div>

                    {/* Title / description */}
                    <h3 className="text-base font-black text-white leading-snug line-clamp-2 mb-1.5 group-hover:text-indigo-300 transition-colors">
                      {campaign.hook}
                    </h3>
                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-3">
                      {campaign.blueprint}
                    </p>

                    {campaign.requiredSkills && campaign.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4 flex-grow content-start">
                        {campaign.requiredSkills.slice(0, 3).map(skill => (
                          <span key={skill} className="px-1.5 py-0.5 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                            {skill}
                          </span>
                        ))}
                        {campaign.requiredSkills.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-gray-400 text-[10px] font-bold">
                            +{campaign.requiredSkills.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Creator row */}
                    <div className="flex items-center gap-2 mb-5 bg-white/3 border border-white/6 rounded-xl px-3 py-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-black text-white shrink-0">
                        {(campaign.creatorName || 'A').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-gray-400 flex-grow">
                        by <span className="text-white font-semibold">@{campaign.creatorName || 'anon'}</span>
                      </span>
                      <BadgeCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="text-xs text-gray-600">{campaign.backers?.length ?? 0} backers</span>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-bold text-white">₹{campaign.currentFunding.toLocaleString()}</span>
                        <span className="text-gray-600">of ₹{campaign.fundingGoal.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${ct.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between mt-1.5 text-xs">
                        <span className="text-gray-600">{pct}% funded</span>
                        {!isFunded && <span className="text-gray-600">₹{(campaign.fundingGoal - campaign.currentFunding).toLocaleString()} to go</span>}
                      </div>
                    </div>

                    {/* CTA */}
                    <button className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 ${isFunded
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                      : 'bg-white/6 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-violet-600 text-gray-300 hover:text-white border border-white/10 hover:border-transparent hover:shadow-lg hover:shadow-indigo-500/20'
                      }`}>
                      {isFunded
                        ? <><CheckCircle className="w-3.5 h-3.5" /> Goal Reached</>
                        : <><ChevronRight className="w-3.5 h-3.5" /> Open Deal Room</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════ SIDE PANEL ══════════════════════ */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={closePanel} />

          <aside className="relative ml-auto w-full max-w-[660px] h-full bg-[#0a0d16] border-l border-white/8 flex flex-col shadow-2xl"
            style={{ animation: 'slideIn .32s cubic-bezier(.4,0,.2,1) both' }}>

            {/* Accent top bar */}
            <div className={`h-[3px] w-full bg-gradient-to-r ${getCat(selected.category).bar} flex-shrink-0`} />

            {/* Panel header */}
            <header className="flex items-center gap-3 px-7 py-4 border-b border-white/6 flex-shrink-0">
              <div className="p-2 bg-indigo-500/12 border border-indigo-500/20 rounded-xl">
                <Building2 className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Deal Room</p>
                <p className="text-sm font-black text-white truncate">{selected.hook}</p>
              </div>
              <button onClick={() => { try { navigator.clipboard.writeText(window.location.href); } catch { } }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-all" title="Copy link">
                <Share2 className="w-4 h-4" />
              </button>
              <button onClick={closePanel} className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all">
                <X className="w-4 h-4" />
              </button>
            </header>

            {/* Scrollable body */}
            <div className="flex-grow overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2435 transparent' }}>
              <div className="px-7 py-6 space-y-7">

                {/* Identity */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl font-black text-white shrink-0 shadow-lg shadow-indigo-500/30">
                    {(selected.creatorName || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-grow min-w-0">
                    <h2 className="text-xl font-black text-white leading-tight line-clamp-2 mb-2">{selected.hook}</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-indigo-300 font-semibold">@{selected.creatorName || 'anonymous'}</span>
                      <BadgeCheck className="w-4 h-4 text-indigo-400" />
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${getCat(selected.category).pill}`}>
                        {selected.category}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-lg ${selected.status === 'Funded'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : 'bg-sky-500/15 text-sky-400 border border-sky-500/20'
                        }`}>{selected.status}</span>
                    </div>
                  </div>
                </div>

                {/* Funding metrics */}
                <div className="bg-gradient-to-br from-white/4 to-white/2 border border-white/8 rounded-2xl p-5">
                  {(() => {
                    const pct = Math.min(100, Math.round((selected.currentFunding / selected.fundingGoal) * 100));
                    return (
                      <>
                        <div className="flex items-end justify-between mb-4">
                          <div>
                            <div className="text-3xl font-black text-white leading-none">₹{selected.currentFunding.toLocaleString()}</div>
                            <div className="text-sm text-gray-500 mt-1">raised of <span className="text-gray-300 font-semibold">₹{selected.fundingGoal.toLocaleString()}</span></div>
                          </div>
                          <div className="text-right">
                            <div className={`text-4xl font-black ${pct >= 75 ? 'text-emerald-400' : 'text-indigo-400'}`}>{pct}%</div>
                            <div className="text-xs text-gray-600 mt-0.5">funded</div>
                          </div>
                        </div>
                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-4">
                          <div className={`h-full rounded-full bg-gradient-to-r ${getCat(selected.category).bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: 'Backers', value: (selected.backers?.length ?? 0).toString() },
                            { label: 'Days Left', value: '30' },
                            { label: 'Remaining', value: `₹${Math.max(0, selected.fundingGoal - selected.currentFunding).toLocaleString()}` },
                          ].map(m => (
                            <div key={m.label} className="bg-white/4 rounded-xl p-3 text-center">
                              <div className="text-base font-black text-white">{m.value}</div>
                              <div className="text-[11px] text-gray-600 mt-0.5">{m.label}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Blueprint */}
                <Section icon={<BookOpen className="w-4 h-4 text-indigo-400" />} title="Project Blueprint">
                  <p className="text-gray-400 text-sm leading-relaxed">{selected.blueprint}</p>
                </Section>

                {/* Creator info */}
                <Section icon={<Users className="w-4 h-4 text-indigo-400" />} title="Creator Profile">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-base font-black text-white">
                        {(selected.creatorName || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{selected.creatorName || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5 text-indigo-400" /> Verified Creator</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs bg-white/3 rounded-xl px-3 py-2.5 border border-white/5">
                      <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                      {selected.contactEmail
                        ? <span className="text-gray-300 font-medium">{selected.contactEmail}</span>
                        : <span className="text-gray-600 italic">Contact email visible to lead-tier investors</span>
                      }
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-gray-600 bg-white/3 rounded-xl px-3 py-2.5 border border-white/5">
                      <Globe className="w-4 h-4 text-gray-600 shrink-0" />
                      Company site accessible to lead-tier backers
                    </div>
                  </div>
                </Section>

                {/* Recent backers */}
                {(selected.backers?.length ?? 0) > 0 && (
                  <Section icon={<Star className="w-4 h-4 text-amber-400" />} title="Recent Backers">
                    <div className="space-y-2">
                      {[...(selected.backers ?? [])].reverse().slice(0, 6).map((b, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white/3 border border-white/6 rounded-xl px-4 py-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {b.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-300 font-medium flex-grow">@{b.username}</span>
                          <span className="text-sm font-bold text-emerald-400">+₹{b.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Terms */}
                <Section icon={<FileText className="w-4 h-4 text-indigo-400" />} title="Terms & Conditions">
                  <div className="space-y-2.5 text-xs text-gray-500 leading-relaxed">
                    {[
                      ['Equity Model', 'Investments provide proportional equity based on contribution vs. funding goal. Final allocation confirmed upon campaign closure.'],
                      ['Platform Fee', 'A 5% protocol fee is deducted from total raised. Net proceeds disbursed to creator upon campaign success.'],
                      ['No Guarantee', 'Investments carry business risk. Past creator performance does not guarantee future results.'],
                      ['Refund Policy', 'If a campaign misses its goal, all contributions are automatically refunded within 7 business days.'],
                      ['Data & Privacy', 'Your username and amount are permanently logged on the project ledger for full transparency.'],
                    ].map(([title, body]) => (
                      <div key={title} className="bg-white/3 border border-white/5 rounded-xl px-4 py-3">
                        <span className="text-gray-300 font-semibold">{title}: </span>{body}
                      </div>
                    ))}
                  </div>
                </Section>

                {/* ══ INVESTMENT PANEL ══ */}
                {selected.status !== 'Funded' && (
                  <Section icon={<Wallet className="w-4 h-4 text-indigo-400" />} title="Investment Panel">

                    {/* Step 1 – Pick tier */}
                    {step === 'tiers' && (
                      <div className="space-y-3">
                        {TIERS.map((tier, idx) => {
                          const isCustom = tier.label === 'Custom';
                          const isSelected = selectedTier === idx;
                          return (
                            <div key={idx} className={`border rounded-2xl p-4 transition-all duration-250 ${isSelected ? 'border-indigo-500 bg-indigo-500/10 shadow-xl shadow-indigo-500/10' : 'border-white/8 bg-white/3 hover:border-white/18 hover:bg-white/5'}`}>
                              <div className="flex items-start gap-4 cursor-pointer" onClick={() => setSelectedTier(idx)}>
                                <span className="text-2xl mt-0.5 shrink-0">{tier.icon}</span>
                                <div className="flex-grow min-w-0">
                                  <div className="flex items-baseline justify-between mb-1">
                                    <div>
                                      <span className="font-black text-white text-sm">{tier.label}</span>
                                      <span className="text-xs text-gray-500 ml-2">{tier.sub}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-lg font-black text-indigo-300">{isCustom ? '₹ Custom' : `₹${tier.amount.toLocaleString()}`}</span>
                                      {!isCustom && <span className="text-xs text-gray-600 ml-1">{tier.equity}% equity</span>}
                                    </div>
                                  </div>
                                  {!isCustom && (
                                    <p className="text-xs text-gray-600 mb-2">
                                      ~{((tier.amount / selected.fundingGoal) * 100).toFixed(4)}% project share
                                    </p>
                                  )}
                                  <ul className="space-y-1">
                                    {tier.perks.map(p => (
                                      <li key={p} className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <CheckCircle className="w-3 h-3 text-indigo-400 shrink-0" /> {p}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-1 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-white/20'}`} />
                              </div>

                              {/* Custom Input */}
                              {isCustom && isSelected && (
                                <div className="mt-4 pt-4 border-t border-white/10">
                                  <label className="block text-xs font-semibold text-gray-400 mb-2">Enter Amount (₹)</label>
                                  <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                    <input
                                      type="number"
                                      value={customAmount}
                                      onChange={(e) => setCustomAmount(e.target.value)}
                                      placeholder="100+"
                                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white font-bold outline-none focus:border-indigo-500 transition-colors"
                                    />
                                  </div>
                                  {Number(customAmount) > 0 && Number(customAmount) < 100 && (
                                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Minimum investment is ₹100</p>
                                  )}
                                  {Number(customAmount) > (selected.fundingGoal - selected.currentFunding) && (
                                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Cannot exceed remaining goal (₹{(selected.fundingGoal - selected.currentFunding).toLocaleString()})</p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <button
                          disabled={selectedTier === null || (TIERS[selectedTier].label === 'Custom' && (Number(customAmount) < 100 || Number(customAmount) > (selected.fundingGoal - selected.currentFunding)))}
                          onClick={() => setStep('form')}
                          className="w-full py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                          Proceed to Payment <ArrowRight className="w-4 h-4" />
                        </button>

                        {selected.requiredSkills && selected.requiredSkills.length > 0 && (
                          <div className="pt-2 border-t border-white/10 mt-4 text-center">
                            <p className="text-xs text-gray-400 mb-2">Or invest your time and expertise for equity.</p>
                            <button
                              onClick={() => setStep('skill')}
                              className="w-full py-3 rounded-2xl font-bold text-sm bg-white/5 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-2">
                              <Cpu className="w-4 h-4" /> Invest Skills Instead
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step - Skill Investment */}
                    {step === 'skill' && (
                      <div className="space-y-4">
                        <div className="bg-gradient-to-br from-indigo-500/12 to-violet-500/8 border border-indigo-500/20 rounded-2xl p-5">
                          <h4 className="font-black text-white text-base mb-2">Pledge Your Skills</h4>
                          <p className="text-xs text-indigo-300 leading-relaxed">
                            Contribute your expertise instead of capital. The founder will review your offer and, if accepted, your contribution will be recorded as equity value.
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Select a needed skill</label>
                          <select
                            value={pledgeSkill}
                            onChange={e => setPledgeSkill(e.target.value)}
                            className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-sm text-black outline-none focus:border-indigo-500 transition-colors">
                            <option value="" className="bg-[#0e1220]">-- Select Skill --</option>
                            {selected.requiredSkills?.map((s: string) => (
                              <option key={s} value={s} className="bg-[#0e1220]">{s}</option>
                            ))}
                            <option value="Other" className="bg-[#0e1220]">Other (Specify later)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Hours Pledged</label>
                          <input
                            type="number" min="1"
                            value={pledgeHours}
                            onChange={e => setPledgeHours(e.target.value)}
                            placeholder="e.g. 20"
                            className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-sm text-black outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Estimated Value (₹)</label>
                          <input
                            type="number" min="1"
                            value={pledgeValue}
                            onChange={e => setPledgeValue(e.target.value)}
                            placeholder="e.g. 50000"
                            className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-sm text-black outline-none focus:border-indigo-500 transition-colors"
                          />
                          <p className="text-[10px] text-gray-500 mt-1">Value of your time in rupees for equity calculation.</p>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button onClick={() => setStep('tiers')} className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-white/6 hover:bg-white/10 text-gray-400 transition-all border border-white/8">Back</button>
                          <button
                            disabled={isPledging || !pledgeSkill || !pledgeHours || !pledgeValue}
                            onClick={handleInvestSkill}
                            className="flex-1 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                            {isPledging ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Pledge'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 2 – Payment form */}
                    {step === 'form' && selectedTier !== null && (
                      <div className="space-y-4">
                        <div className="bg-gradient-to-br from-indigo-500/12 to-violet-500/8 border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-4">
                          <span className="text-3xl">{TIERS[selectedTier].icon}</span>
                          <div className="flex-grow">
                            <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">{TIERS[selectedTier].label} Tier</p>
                            <p className="text-2xl font-black text-white">₹{TIERS[selectedTier].label === 'Custom' ? Number(customAmount).toLocaleString() : TIERS[selectedTier].amount.toLocaleString()}</p>
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            <div className="text-indigo-400 font-bold text-sm">
                              {TIERS[selectedTier].label === 'Custom' ? ((Number(customAmount) / selected.fundingGoal) * 100).toFixed(4) : TIERS[selectedTier].equity}%
                            </div>
                            <div>equity</div>
                          </div>
                        </div>
                        <input disabled placeholder="Full Legal Name"
                          className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-gray-600 cursor-not-allowed outline-none" />
                        <div className="relative">
                          <input disabled placeholder="•••• •••• •••• ••••"
                            className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-gray-600 cursor-not-allowed outline-none pr-20" />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                            <div className="w-8 h-5 bg-yellow-500/20 rounded text-[9px] text-yellow-500 flex items-center justify-center font-black">VISA</div>
                            <div className="w-8 h-5 bg-red-500/20 rounded text-[9px] text-red-400 flex items-center justify-center font-black">MC</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input disabled placeholder="MM / YY" className="bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-gray-600 cursor-not-allowed outline-none" />
                          <input disabled placeholder="CVV •••" className="bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-gray-600 cursor-not-allowed outline-none" />
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-gray-600 bg-white/3 border border-white/6 rounded-xl px-4 py-3">
                          <Lock className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" />
                          Payment gateway (Stripe / Razorpay) will be connected here. Currently using simulated funding injection for demo.
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => setStep('tiers')} className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-white/6 hover:bg-white/10 text-gray-400 hover:text-white border border-white/8 transition-all">Back</button>
                          <button onClick={() => setStep('confirm')} className="flex-1 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg">
                            <Shield className="w-4 h-4" /> Review & Confirm
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 3 – Confirm */}
                    {step === 'confirm' && selectedTier !== null && (
                      <div className="bg-gradient-to-br from-white/4 to-white/2 border border-white/10 rounded-2xl p-5 space-y-4">
                        <h4 className="font-black text-white text-sm">Confirm Your Investment</h4>
                        <div className="space-y-2.5 text-sm">
                          {(() => {
                            const amt = TIERS[selectedTier].label === 'Custom' ? Number(customAmount) : TIERS[selectedTier].amount;
                            const eq = TIERS[selectedTier].label === 'Custom' ? ((amt / selected.fundingGoal) * 100).toFixed(4) : TIERS[selectedTier].equity;
                            return ([
                              ['Tier', TIERS[selectedTier].label, 'text-white'],
                              ['Amount', `₹${amt.toLocaleString()}`, 'text-white'],
                              ['Equity', `${eq}%`, 'text-indigo-400'],
                              ['Project Share', `~${((amt / selected.fundingGoal) * 100).toFixed(4)}%`, 'text-gray-300'],
                              ['Platform Fee 5%', `₹${(amt * 0.05).toLocaleString()}`, 'text-gray-400'],
                            ] as [string, string, string][]).map(([label, val, cls]) => (
                              <div key={label} className="flex justify-between items-center">
                                <span className="text-gray-500">{label}</span>
                                <span className={`font-bold ${cls}`}>{val}</span>
                              </div>
                            ));
                          })()}
                          <div className="border-t border-white/8 pt-3 flex justify-between items-center">
                            <span className="font-black text-white">Total Charged</span>
                            <span className="font-black text-white text-lg">
                              ₹{((TIERS[selectedTier].label === 'Custom' ? Number(customAmount) : TIERS[selectedTier].amount) * 1.05).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-3 pt-1">
                          <button onClick={() => setStep('form')} className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-white/6 hover:bg-white/10 text-gray-400 transition-all border border-white/8">Back</button>
                          <button disabled={!!fundingId} onClick={() => initiateRazorpay(selected._id, TIERS[selectedTier].label === 'Custom' ? Number(customAmount) : TIERS[selectedTier].amount)}
                            className="flex-1 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                            {fundingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4" />Checkout with Razorpay</>}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 4 – Done */}
                    {step === 'done' && (
                      <div className="space-y-4">
                        <div
                          ref={certRef}
                          className="relative bg-gradient-to-br from-[#0a0f1c] to-[#0d1424] border-2 border-[#1e293b] rounded-xl p-8 overflow-hidden"
                          style={{ width: '100%', minHeight: '400px' }}
                        >
                          {/* Certificate background elements */}
                          <div className="absolute top-0 left-0 w-full h-full border-[6px] border-double border-indigo-500/20 rounded-xl pointer-events-none" />
                          <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
                          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

                          <div className="relative z-10 flex flex-col h-full justify-between text-center space-y-6">
                            <div>
                              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                                <Shield className="w-8 h-8 text-white" />
                              </div>
                              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-violet-300 tracking-widest uppercase" style={{ fontFamily: 'serif' }}>Certificate of Investment</h2>
                              <p className="text-indigo-500/60 text-xs tracking-[0.2em] mt-1 font-bold">OFFICIAL BACKER DOCUMENT</p>
                            </div>

                            <div className="space-y-4">
                              <p className="text-gray-400 italic text-sm">This formally certifies that</p>
                              <h3 className="text-3xl font-black text-white">{user?.username || user?.firstName || 'Esteemed Investor'}</h3>
                              <p className="text-gray-400 italic text-sm">has successfully invested the sum of</p>
                              <div className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                                ₹{TIERS[selectedTier!].label === 'Custom' ? Number(customAmount).toLocaleString() : TIERS[selectedTier!].amount.toLocaleString()}
                              </div>
                              <p className="text-gray-400 italic text-sm">into the venture known as</p>
                              <h4 className="text-xl font-bold text-indigo-100">{selected.hook}</h4>
                            </div>

                            <div className="flex justify-between items-end border-t border-indigo-500/20 pt-6 mt-6">
                              <div className="text-left">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Equity Stake</p>
                                <p className="text-lg font-black text-indigo-300">{TIERS[selectedTier!].label === 'Custom' ? ((Number(customAmount) / selected.fundingGoal) * 100).toFixed(4) : TIERS[selectedTier!].equity}%</p>
                              </div>
                              <div className="text-center">
                                <div className="w-12 h-12 rounded-full border border-emerald-500/30 flex items-center justify-center mb-2 mx-auto">
                                  <BadgeCheck className="w-6 h-6 text-emerald-400" />
                                </div>
                                <p className="text-[9px] text-gray-500 uppercase tracking-widest">Verified on Ledger</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Date</p>
                                <p className="text-sm font-bold text-gray-300">{new Date().toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 mt-4">
                          <button onClick={closePanel} className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-white/6 hover:bg-white/10 text-gray-300 transition-all border border-white/8">
                            Close Panel
                          </button>
                          <button onClick={downloadCertificate} className="flex-1 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg">
                            <CheckCircle className="w-4 h-4" /> Download Certificate
                          </button>
                        </div>
                      </div>
                    )}
                  </Section>
                )}

                {/* Fully funded state */}
                {selected.status === 'Funded' && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <h4 className="font-black text-white mb-1">Fully Funded</h4>
                    <p className="text-sm text-gray-500">This venture reached its goal. Stay tuned for creator updates.</p>
                  </div>
                )}

              </div>
            </div>{/* end scroll */}

            {/* Panel footer */}
            <footer className="px-7 py-3.5 border-t border-white/6 bg-[#080b12] flex items-center justify-center gap-2 text-xs text-gray-700 flex-shrink-0">
              <Lock className="w-3 h-3" />
              256-bit encrypted &nbsp;·&nbsp; Powered by enterprise ledger
            </footer>
          </aside>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
