import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api';

const PREDEFINED_PROGRAMS = [
  { name: 'Pipoca', alimento: 'Pipoca (de micro-ondas)', durationSeconds: 180, power: 7, heatingChar: '*', instructions: 'Observar o barulho de estouros...', isPredefined: true },
  { name: 'Leite', alimento: 'Leite', durationSeconds: 300, power: 5, heatingChar: 'o', instructions: 'Cuidado com choque térmico...', isPredefined: true },
  { name: 'Carnes de boi', alimento: 'Carne em pedaço', durationSeconds: 840, power: 4, heatingChar: 'b', instructions: 'Interrompa na metade...', isPredefined: true },
  { name: 'Frango', alimento: 'Frango (qualquer corte)', durationSeconds: 480, power: 7, heatingChar: 'f', instructions: 'Interrompa na metade...', isPredefined: true },
  { name: 'Feijão', alimento: 'Feijão congelado', durationSeconds: 480, power: 9, heatingChar: 'j', instructions: 'Deixe o recipiente destampado...', isPredefined: true }
];

const STATE_MAP: Record<string, string> = {
  'Idle': 'Ocioso',
  'Heating': 'Aquecendo',
  'Active': 'Aquecendo',
  'Paused': 'Pausado'
};

export default function App() {
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(sessionStorage.getItem('microwave_token'));
  const [user, setUser] = useState('admin');
  const [pass, setPass] = useState('admin');
  
  const [state, setState] = useState('Idle');
  const [time, setTime] = useState(0);
  const [output, setOutput] = useState('');
  const [power, setPower] = useState(10);
  const [char, setChar] = useState('.');
  const [isPredefined, setIsPredefined] = useState(false);
  const [msg, setMsg] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Stream SSE e Auto-deteçao
  useEffect(() => {
    if (isOffline || !token || token === 'offline') return;

    const eventSource = new EventSource('/api/microwave/stream');
    eventSource.onmessage = (event) => {
      const s = JSON.parse(event.data);
      setState(s.state);
      setTime(s.remainingSeconds);
      setOutput(s.output);
      setIsOffline(false);
    };
    eventSource.onerror = () => setIsOffline(true);
    return () => eventSource.close();
  }, [isOffline, token]);

  // Monitor de reconexao automática
  useEffect(() => {
    if (!isOffline || !token || token === 'offline') return;

    const probe = setInterval(async () => {
      try {
        await api.get('/microwave/status');
        setIsOffline(false);
      } catch { }
    }, 5000);

    return () => clearInterval(probe);
  }, [isOffline, token]);

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          stopTimer(); setState('Idle');
          setOutput((o) => o + " Aquecimento concluido");
          return 0;
        }
        setOutput((o) => o + char.repeat(power) + " ");
        return prev - 1;
      });
    }, 1000);
  }, [char, power]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      const res = await api.post('/auth/login', { username: user, password: pass });
      sessionStorage.setItem('microwave_token', res.data.token);
      setToken(res.data.token);
    } catch (err: any) {
      if (!err.response) {
        setIsOffline(true); setToken('offline');
      } else {
        setMsg(err.response?.data?.mensagem || 'Credenciais invalidas.');
      }
    } finally { setLoading(false); }
  };

  const handleAction = async (action: string, data: any = {}) => {
    if (loading && action !== 'quick-start') return; 
    setLoading(true); setMsg('');

    if (isOffline) {
      if (action === 'start' || action === 'quick-start') {
        if (state === 'Heating') {
          if (isPredefined) { setMsg('Nao permitido acrescimo em programas fixos.'); }
          else { setTime(t => Math.min(t + 30, 120)); }
        } else {
          const d = data.durationSeconds ? data : { durationSeconds: 30, power: 10, heatingChar: '.', isPredefined: false };
          setTime(d.durationSeconds); setPower(d.power); setChar(d.heatingChar);
          setIsPredefined(!!d.isPredefined); setState('Heating'); setOutput('');
        }
      } else if (action === 'pause-cancel') {
        if (state === 'Heating') { setState('Paused'); stopTimer(); }
        else { setState('Idle'); setTime(0); setOutput(''); }
      }
      setLoading(false); return;
    }

    try {
      const endpoint = action === 'start-program' ? '/microwave/start-program' : `/microwave/${action}`;
      const res = await api.post(endpoint, data);
      setState(res.data.state);
      setTime(res.data.remainingSeconds);
      setOutput(res.data.output);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setToken(null); sessionStorage.removeItem('microwave_token');
      } else {
        setIsOffline(true); handleAction(action, data);
      }
    } finally { setLoading(false); }
  };

  const handleQuickStartDebounced = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (isOffline && !isPredefined) setTime(t => t + 30);
    debounceRef.current = setTimeout(() => handleAction('quick-start'), 300);
  };

  useEffect(() => {
    if (state === 'Heating' && isOffline) startTimer();
    return () => stopTimer();
  }, [state, isOffline, startTimer]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (!token && !isOffline) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 w-full max-w-sm shadow-2xl flex flex-col gap-4">
          <h2 className="text-white text-xl font-black text-center uppercase tracking-tighter">Microwave Login</h2>
          {msg && <p className="text-rose-500 text-xs text-center font-bold uppercase">{msg}</p>}
          <input className="bg-black border border-zinc-800 p-3 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Usuario" value={user} onChange={e => setUser(e.target.value)} />
          <input type="password" className="bg-black border border-zinc-800 p-3 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Senha" value={pass} onChange={e => setPass(e.target.value)} />
          <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl font-black transition-all uppercase">Entrar</button>
          <button type="button" onClick={() => { setIsOffline(true); setToken('offline'); }} className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest hover:text-zinc-400 transition-colors">Modo Simulacao</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-emerald-500/30">
      {isOffline && (
        <div role="alert" className="bg-amber-900/40 border border-amber-500/50 w-full max-w-2xl p-4 mb-6 rounded-xl text-xs text-center text-amber-200 backdrop-blur-sm">
          <strong>SERVIDOR OFFLINE:</strong> Simulacao local ativada. Reconectando automaticamente...
        </div>
      )}

      <main className={`bg-zinc-900 p-4 md:p-8 rounded-3xl border-4 flex flex-col md:flex-row gap-8 shadow-2xl transition-all duration-500 ${isOffline ? 'border-amber-900/50' : 'border-zinc-800'}`}>
        <section className="flex flex-col gap-4">
          <div className="w-full md:w-[500px] h-64 md:h-80 bg-black border-4 border-zinc-800 rounded-2xl relative overflow-hidden flex items-center justify-center p-8 shadow-inner">
            <div className={`absolute inset-0 bg-yellow-500/10 transition-opacity duration-700 ${state === 'Heating' ? 'opacity-100' : 'opacity-0'}`}></div>
            <div className="text-emerald-500 font-mono text-lg md:text-2xl break-all text-center leading-relaxed z-10 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
              {output || (state === 'Idle' ? 'SISTEMA PRONTO' : '')}
            </div>
          </div>
          {msg && <p className="text-rose-400 text-xs text-center font-bold">{msg}</p>}
        </section>

        <section className="w-full md:w-72 flex flex-col gap-6">
          <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-inner flex flex-col items-center font-mono">
            <div className="text-5xl md:text-6xl text-emerald-400 tracking-tighter" aria-label="Tempo restante">{formatTime(time)}</div>
            <div className={`text-[10px] font-black uppercase tracking-[0.2em] mt-2 ${state === 'Heating' ? 'text-rose-500 animate-pulse' : 'text-zinc-600'}`}>{STATE_MAP[state] || state}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button disabled={loading} onClick={() => handleAction('start', { durationSeconds: 30, power: 10, heatingChar: '.', isPredefined: false })} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 p-4 rounded-xl font-black text-sm transition-all active:scale-95 focus:ring-2 focus:ring-emerald-500 outline-none uppercase">Start</button>
            <button disabled={loading || (state === 'Heating' && isPredefined)} onClick={handleQuickStartDebounced} className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 p-4 rounded-xl font-bold text-sm transition-all active:scale-95 focus:ring-2 focus:ring-zinc-500 outline-none uppercase">+30s</button>
            <button disabled={loading} onClick={() => handleAction('pause-cancel')} className="col-span-2 bg-rose-800 hover:bg-rose-700 p-4 rounded-xl font-bold text-sm transition-all active:scale-95 focus:ring-2 focus:ring-rose-500 outline-none uppercase">Pausa / Cancelar</button>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest ml-1">Programas Fixos</h2>
            <div className="grid grid-cols-2 gap-2">
              {PREDEFINED_PROGRAMS.map(p => (
                <button key={p.name} disabled={loading || state !== 'Idle'} onClick={() => handleAction('start-program', { programName: p.name })} className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 p-3 rounded-lg text-[11px] font-bold transition-all uppercase text-left truncate px-3 focus:ring-2 focus:ring-zinc-600 outline-none" title={p.alimento}>{p.name}</button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
