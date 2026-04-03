import React, { useEffect, useState } from 'react';
import { Rocket, Target, Activity, LogOut, Cpu } from 'lucide-react';
import { useUser, useAuth, useClerk } from '@clerk/clerk-react';

// Error Boundary to prevent white/black screen crashes
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
  const [aiInput, setAiInput] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const { user, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();

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

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));

  useEffect(() => {
    if (!authToken) return;
    fetch('/api/campaigns', { headers: { Authorization: `Bearer ${authToken}` } })
      .then(res => res.ok ? setNetworkStatus("API: Online") : setNetworkStatus("API: Unstable"))
      .catch(() => setNetworkStatus("API: Offline"));
  }, [authToken]);

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

  const pingCampaign = async () => {
    const creatorRole = user?.publicMetadata?.role || 'Creator';
    if (creatorRole !== 'Creator') {
       addLog('Access Denied. Only Creators can deploy blueprints.');
       return;
    }
    addLog(`Creating test campaign for ${user?.primaryEmailAddress?.emailAddress}...`);
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
          hook: 'Next-Gen Quantum Hardware Framework',
          blueprint: 'Disrupting existing classical compute bottlenecks.',
          fundingGoal: 5000000
        }) 
      });
      const data = await res.json();
      addLog(`Success - Campaign ID: ${data._id || 'Test Mode'}`);
    } catch (err: any) {
      addLog(`Error: ${err.message}`);
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
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Rocket className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Creator Dashboard</h1>
              <div className="inline-flex items-center gap-2 text-gray-500 text-sm mt-1">
                <Activity className="w-4 h-4 text-green-500" /> {networkStatus}
              </div>
            </div>
          </div>
          <button onClick={() => signOut()} className="text-gray-500 hover:text-red-500 flex items-center gap-2 text-sm font-medium transition-colors bg-gray-50 hover:bg-red-50 px-4 py-2 rounded-lg border border-gray-200 hover:border-red-200">
             <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Controls */}
          <div className="space-y-6">
            
            {/* Identity Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
               <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Account Profile</h3>
               <p className="text-gray-900 font-medium truncate">{user?.primaryEmailAddress?.emailAddress}</p>
               <p className="text-sm text-gray-600 mt-1">Role: <span className="font-semibold text-blue-600">{(user?.publicMetadata?.role as string) || 'Creator'}</span></p>
            </div>
            
            {/* Quick Actions */}
            <div>
              <h2 className="text-gray-800 font-semibold mb-3">Quick Actions</h2>
              <button onClick={pingCampaign} className="w-full flex items-center gap-4 bg-white border p-4 rounded-xl transition-all duration-200 text-left hover:border-blue-300 hover:shadow-md cursor-pointer">
                <div className="p-3 flex-shrink-0 rounded-lg bg-blue-50 text-blue-600">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Create Sample Campaign</div>
                  <div className="text-xs mt-1 text-gray-500">Launch a test campaign configuration to the API.</div>
                </div>
              </button>
            </div>
            
            {/* AI Generator */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-500" /> AI Campaign Assistant
              </h2>
              <form onSubmit={handleAiSubmit} className="flex flex-col gap-3">
                <input 
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Describe your project idea..."
                  className="glass-input"
                  disabled={aiLoading}
                />
                <button type="submit" className="premium-btn w-full p-3 rounded-lg text-sm font-semibold" disabled={aiLoading}>
                  {aiLoading ? 'Generating Pitch...' : 'Generate Pitch'}
                </button>
              </form>
            </div>
          </div>

          {/* Activity Logs & AI Output */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
            <div className="bg-gray-50 border-b border-gray-100 p-4">
              <h2 className="text-gray-700 font-semibold text-sm">Campaign Assistant & Logs</h2>
            </div>
            <div className="p-6 overflow-y-auto flex-grow space-y-4">
              {aiOutput ? (
                <div className="text-gray-800 prose text-sm">
                  <div className="text-blue-600 font-semibold mb-2">Generated Pitch:</div>
                  <div className="whitespace-pre-wrap">{aiOutput}</div>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-gray-400 text-center text-sm mt-12">No recent activity.</div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log, i) => (
                    <div key={i} className={`text-sm p-3 rounded-lg border ${log.includes('Denied') || log.includes('Error') ? 'bg-red-50 border-red-100 text-red-700' : 'bg-gray-50 border-gray-100 text-gray-700'}`}>
                      {log}
                    </div>
                  ))}
                </div>
              )}
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
