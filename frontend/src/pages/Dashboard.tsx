import React, { useEffect, useState } from 'react';
import { Rocket, Target, Activity, Cpu, Wallet, Banknote, CreditCard, Loader2, Info, LayoutList, ArrowUpRight } from 'lucide-react';
import { useUser, useAuth } from '@clerk/clerk-react';

// Error Boundary unchanged
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 max-w-md text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
            <p className="text-gray-600 text-sm mb-4">{this.state.error}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function DashboardContent() {
  const [networkStatus, setNetworkStatus] = useState<string>("Connecting...");
  const [logs, setLogs] = useState<string[]>([]);
  const [authToken, setAuthToken] = useState<string>('');
  const [myCampaigns, setMyCampaigns] = useState<any[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  
  // Campaign Form State
  const [hook, setHook] = useState('');
  const [blueprint, setBlueprint] = useState('');
  const [fundingGoal, setFundingGoal] = useState<number | ''>('');
  const [category, setCategory] = useState<string>('Tech');
  const [displayName, setDisplayName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Generator State
  const [aiInput, setAiInput] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const { user, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();

  // Pre-fill creator identity from Clerk when user loads
  useEffect(() => {
    if (user) {
      setDisplayName(
        user.username ||
        user.fullName ||
        user.firstName ||
        user.primaryEmailAddress?.emailAddress?.split('@')[0] ||
        ''
      );
      setContactEmail(user.primaryEmailAddress?.emailAddress || '');
    }
  }, [user?.id]);

  useEffect(() => {
    async function loadToken() {
      try {
        const token = await getToken();
        if (token) setAuthToken(token);
      } catch (e) {
        console.error('Failed to get token:', e);
      }
    }
    loadToken();
  }, [getToken]);

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));

  // Network Heartbeat
  useEffect(() => {
    if (!authToken) return;
    fetch('/api/campaigns', { headers: { Authorization: `Bearer ${authToken}` } })
      .then(res => res.ok ? setNetworkStatus("API: Connected") : setNetworkStatus("API: Unstable"))
      .catch(() => setNetworkStatus("API: Offline"));
  }, [authToken]);

  // Fetch 'Me' Campaigns
  useEffect(() => {
    if (!user?.id || !authToken) return;
    setLoadingCampaigns(true);
    fetch('/api/campaigns/me', {
       headers: { 
         Authorization: `Bearer ${authToken}`,
         'x-user-id': user.id
       }
    })
    .then(r => r.json())
    .then(data => {
       setMyCampaigns(data.campaigns || []);
       setLoadingCampaigns(false);
    })
    .catch(e => {
        addLog(`Error syncing projects: ${e.message}`);
        setLoadingCampaigns(false);
    });
  }, [user?.id, authToken]);

  // Derived Stats
  const totalRaised = myCampaigns?.reduce((sum, camp) => sum + (camp.currentFunding || 0), 0) || 0;
  // A simple simulated available balance based on raised minus some mock fee
  const availableBalance = totalRaised > 0 ? totalRaised * 0.95 : 0;

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || aiLoading) return;
    setAiLoading(true);
    setAiOutput('');
    try {
      const token = await getToken();
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ prompt: aiInput }),
      });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const text = await res.text();
      setAiOutput(text);
    } catch (err: any) {
      setAiOutput(`Error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const deployCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hook || !blueprint || !fundingGoal) return;

    const creatorRole = user?.publicMetadata?.role || 'Creator';
    if (creatorRole !== 'Creator') {
       addLog('Access Denied. Only Creators can deploy blueprints.');
       return;
    }
    
    setIsSubmitting(true);
    addLog(`Deploying campaign "${hook}"...`);
    
    try {
      const token = await getToken();
      const res = await fetch('/api/campaigns', {
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          creatorId: user?.id || '650000000000000000000000',
          creatorName: displayName || user?.username || user?.firstName || 'Creator',
          contactEmail: contactEmail || user?.primaryEmailAddress?.emailAddress || '',
          category,
          hook,
          blueprint,
          fundingGoal: Number(fundingGoal),
          status: 'Active'
        }) 
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'System fault on campaign deployment');
      
      const newCampaign = data.campaign || data;
      addLog(`Success! Campaign goes live. ID: ${newCampaign._id || 'Test Mode'}`);
      
      // Prepend the new campaign to the list dynamically
      setMyCampaigns(prev => [newCampaign, ...prev]);

      // Clear form
      setHook('');
      setBlueprint('');
      setFundingGoal('');
      
    } catch (err: any) {
      addLog(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Rocket className="w-10 h-10 text-blue-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Rocket className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Creator Studio</h1>
              <div className="inline-flex items-center gap-2 text-gray-500 text-sm mt-1">
                <Activity className="w-4 h-4 text-green-500" /> {networkStatus}
              </div>
            </div>
          </div>
          <div className="text-right">
             <p className="text-gray-900 font-medium text-sm">{user?.primaryEmailAddress?.emailAddress}</p>
             <p className="text-xs text-blue-600 font-semibold uppercase mt-1">{(user?.publicMetadata?.role as string) || 'Creator'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Workspace & Analytics */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Live Projects Matrix */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <LayoutList className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-xl font-bold text-gray-900">Live Projects</h2>
                </div>
                <div className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {myCampaigns.length} Deployed
                </div>
              </div>
              
              {loadingCampaigns ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              ) : myCampaigns.length === 0 ? (
                <div className="text-center bg-gray-50 rounded-lg p-8 border border-dashed border-gray-200">
                  <p className="text-gray-500 font-medium mb-1">No active projects detected.</p>
                  <p className="text-sm text-gray-400">Launch a new project below to populate the matrix.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                        <th className="pb-3 pl-2 font-semibold">Project Name</th>
                        <th className="pb-3 font-semibold">Goal</th>
                        <th className="pb-3 font-semibold">Raised</th>
                        <th className="pb-3 font-semibold text-right pr-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {myCampaigns.map(camp => {
                         const percent = Math.min(100, Math.round((camp.currentFunding / camp.fundingGoal) * 100));
                         return (
                           <tr key={camp._id} className="hover:bg-gray-50 transition-colors">
                             <td className="py-4 pl-2">
                               <p className="font-semibold text-gray-900 text-sm max-w-[200px] truncate">{camp.hook}</p>
                               <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                 <div className={`h-1.5 rounded-full ${percent >= 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${percent}%` }}></div>
                               </div>
                             </td>
                             <td className="py-4 text-sm text-gray-600 font-medium">${camp.fundingGoal.toLocaleString()}</td>
                             <td className="py-4 text-sm font-bold text-gray-900">${(camp.currentFunding || 0).toLocaleString()}</td>
                             <td className="py-4 pr-2 text-right">
                               <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                 camp.status === 'Funded' ? 'bg-green-100 text-green-800' : 
                                 camp.status === 'Active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                               }`}>
                                 {camp.status}
                               </span>
                             </td>
                           </tr>
                         );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Campaign Creation Form */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Launch New Project</h2>
              </div>
              
              <form onSubmit={deployCampaign} className="space-y-5">

                {/* ── Creator Identity ── */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-4">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Creator Identity — visible to backers</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Display Name *</label>
                      <input
                        required
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="text-black w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Your name or @handle"
                      />
                      <p className="text-xs text-gray-400 mt-1">Shown as "Created by" on project cards</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Email</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="text-black w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="you@company.com"
                      />
                      <p className="text-xs text-gray-400 mt-1">Visible to lead-tier investors only</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Project Name (Hook)</label>
                  <input 
                    required
                    type="text"
                    value={hook}
                    onChange={(e) => setHook(e.target.value)}
                    className=" text-black w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Project Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Project Blueprint</label>
                  <textarea 
                    required
                    rows={4}
                    value={blueprint}
                    onChange={(e) => setBlueprint(e.target.value)}
                    className=" text-black w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                    placeholder="Describe your vision, roadmap, and how the funds will be used..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Funding Goal ($)</label>
                  <input 
                    required
                    type="number"
                    min="1"
                    value={fundingGoal}
                    onChange={(e) => setFundingGoal(e.target.value ? Number(e.target.value) : '')}
                    className=" text-black w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className=" text-black w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="Tech">Tech</option>
                    <option value="Creative">Creative</option>
                    <option value="Community">Community</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Deploying...</>
                    ) : (
                      <><Rocket className="w-5 h-5" /> Publish to Explore</>
                    )}
                  </button>
                </div>
              </form>
            </div>
            
            {/* AI Generator */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl shadow-sm border border-blue-100">
              <h2 className="text-blue-900 font-semibold mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-600" /> AI Pitch Generator
              </h2>
              <form onSubmit={handleAiSubmit} className="flex gap-3 mb-4">
                <input
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Need help? Type an idea..."
                  className="flex-grow px-4 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400 outline-none text-black"
                  disabled={aiLoading}
                />
                <button type="submit" className="px-6 py-3 bg-white text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 rounded-lg font-semibold transition-colors flex items-center gap-2" disabled={aiLoading}>
                  {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate'}
                </button>
              </form>

              {aiOutput && (
                <div className="bg-white p-4 rounded-lg border border-blue-100 text-sm text-gray-700">
                  <div className="whitespace-pre-wrap mb-4">{aiOutput}</div>
                  <button
                    type="button"
                    onClick={() => setBlueprint(aiOutput)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline disabled:opacity-50 flex items-center gap-1"
                  >
                     <ArrowUpRight className="w-3 h-3" /> Use as Blueprint
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Payment Module & Logs */}
          <div className="space-y-6">
            
            {/* Financial Module */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-5 h-5 text-green-500" />
                <h2 className="text-gray-900 font-bold">Financial Dashboard</h2>
              </div>
              
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 mb-6 text-center text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-6 -mt-6 opacity-10">
                   <Banknote className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Available Balance</div>
                  <div className="text-4xl font-extrabold mb-1">${availableBalance.toLocaleString()}</div>
                  <div className="text-xs text-green-400 font-medium">Total Raised: ${totalRaised.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => alert("Withdrawal module not yet integrated. Please hook up your banking details later.")}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 font-semibold transition-all shadow-md hover:shadow-blue-500/20"
                >
                  <Banknote className="w-5 h-5" /> Withdraw Funds
                </button>
                <button
                  onClick={() => alert("Stripe / Banking integration module pending.")}
                  className="w-full py-3 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg flex items-center justify-center gap-2 font-semibold transition-colors"
                >
                  <CreditCard className="w-5 h-5" /> Payout Settings
                </button>
              </div>
              
              <div className="mt-5 flex items-start gap-2 text-xs text-gray-500 p-3 bg-blue-50/50 rounded-lg border border-blue-50">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p>Withdrawals are subject to 5% platform protocol fees. Integration hooks with banking apis will be ready once enterprise rollout is complete.</p>
              </div>
            </div>

            {/* System Logs */}
            <div className="bg-gray-900 p-6 rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px]">
              <div className="flex items-center gap-2 mb-4">
                 <div className="text-gray-300 font-semibold text-sm">System Console</div>
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              </div>
              <div className="overflow-y-auto flex-grow space-y-3 pr-2">
                {logs.length === 0 ? (
                  <div className="text-gray-600 text-center text-sm mt-12">System idle. Ready for operations.</div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className={`text-xs font-mono p-2 rounded ${log.includes('Denied') || log.includes('Error') ? 'bg-red-900/40 text-red-400 border l border-red-800/30' : 'bg-gray-800/50 text-green-400 border border-gray-700/50'}`}>
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}
