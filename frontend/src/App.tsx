import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from './api';

const PREDEFINED_PROGRAMS = [
  { name: 'Pipoca',        durationSeconds: 180, power: 7, heatingChar: '*' },
  { name: 'Leite',         durationSeconds: 300, power: 5, heatingChar: 'o' },
  { name: 'Carnes de boi', durationSeconds: 840, power: 4, heatingChar: 'b' },
  { name: 'Frango',        durationSeconds: 480, power: 7, heatingChar: 'f' },
  { name: 'Feijão',        durationSeconds: 480, power: 9, heatingChar: 'j' },
];

const STATE_LABEL: Record<string, string> = {
  Idle: 'Ocioso', Heating: 'Aquecendo', Paused: 'Pausado',
};

export default function App() {
  const [token,        setToken]        = useState<string | null>(sessionStorage.getItem('microwave_token'));
  const [isOffline,    setIsOffline]    = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [user,         setUser]         = useState('admin');
  const [pass,         setPass]         = useState('admin');
  const [state,        setState]        = useState('Idle');
  const [time,         setTime]         = useState(0);
  const [output,       setOutput]       = useState('');
  const [isPredefined, setIsPredefined] = useState(false);
  const [msg,          setMsg]          = useState('');

  const timerRef        = useRef<any>(null);
  const charRef         = useRef('.');
  const powerRef        = useRef(10);
  const isPredefinedRef = useRef(false);
  const debounceRef     = useRef<any>(null);
  const esRef           = useRef<EventSource | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const goOffline = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    setIsOffline(true);
  }, []);

  const runSimulationAction = useCallback((action: string, data: any = {}) => {
    if (action === 'quick-start') {
      if (state === 'Heating' || state === 'Paused') {
        if (isPredefinedRef.current) { setMsg('Programas não permitem acréscimo.'); return; }
        setTime(t => Math.min(t + 30, 1200));
        setState('Heating');
      } else {
        charRef.current = '.'; powerRef.current = 10; isPredefinedRef.current = false;
        setIsPredefined(false); setOutput(''); setTime(30); setState('Heating');
      }
    } else if (action === 'start-program') {
      if (state !== 'Idle') { setMsg('O micro-ondas já está em uso.'); return; }
      const p = PREDEFINED_PROGRAMS.find(x => x.name === data.programName);
      if (p) {
        charRef.current = p.heatingChar; powerRef.current = p.power; isPredefinedRef.current = true;
        setIsPredefined(true); setOutput(''); setTime(p.durationSeconds); setState('Heating');
      }
    } else if (action === 'pause-cancel') {
      if (state === 'Heating') { setState('Paused'); stopTimer(); }
      else { stopTimer(); setState('Idle'); setTime(0); setOutput(''); setIsPredefined(false); isPredefinedRef.current = false; }
    }
    setMsg('');
  }, [state, stopTimer]);

  useEffect(() => {
    if (!token || isOffline || token === 'offline') return;

    const es = new EventSource('/api/microwave/stream');
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        setState(d.state ?? 'Idle');
        setTime(d.remainingSeconds ?? 0);
        setOutput(d.output ?? '');
        if (d.state === 'Heating') {
           isPredefinedRef.current = d.isPredefined ?? false;
           setIsPredefined(d.isPredefined ?? false);
        }
      } catch { }
    };

    es.onerror = () => goOffline();

    return () => { es.close(); esRef.current = null; };
  }, [token, isOffline, goOffline]);

  useEffect(() => {
    if (!isOffline || !token) return;

    const probe = setInterval(async () => {
      try {
        await api.get('/microwave/status');
        setIsOffline(false);
        if (token === 'offline') setToken(null);
      } catch { }
    }, 5000);

    return () => clearInterval(probe);
  }, [isOffline, token]);

  useEffect(() => {
    if (!isOffline || state !== 'Heating') { stopTimer(); return; }

    stopTimer();
    timerRef.current = setInterval(() => {
      setTime(prev => {
        if (prev <= 1) {
          stopTimer();
          setState('Idle');
          setOutput(o => o.trim() + ' Aquecimento concluído.');
          setTimeout(() => setOutput(''), 2500);
          return 0;
        }
        setOutput(o => o + charRef.current.repeat(powerRef.current) + " ");
        return prev - 1;
      });
    }, 1000);

    return stopTimer;
  }, [state, isOffline, stopTimer]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMsg('');
    try {
      const res = await api.post('/auth/login', { username: user, password: pass });
      sessionStorage.setItem('microwave_token', res.data.token);
      setToken(res.data.token);
    } catch (err: any) {
      if (!err.response) {
        setIsOffline(true);
        setToken('offline');
      } else if (err.response?.status === 401) {
        setMsg(err.response.data.mensagem);
      } else {
        setMsg('Erro ao conectar ao servidor.');
      }
    } finally { setLoading(false); }
  };

  const handleAction = useCallback(async (action: string, data: any = {}) => {
    if (loading && action !== 'quick-start') return;
    setLoading(true); setMsg('');

    if (isOffline) {
      runSimulationAction(action, data);
      setLoading(false); return;
    }

    try {
      const endpoint = action === 'start-program' ? '/microwave/start-program' : `/microwave/${action}`;
      const res = await api.post(endpoint, data);
      setState(res.data.state);
      setTime(res.data.remainingSeconds);
      setOutput(res.data.output ?? '');
    } catch (err: any) {
      if (err.response?.status === 401) {
        sessionStorage.removeItem('microwave_token'); setToken(null);
      } else if (err.response?.data?.mensagem) {
        setMsg(err.response.data.mensagem);
      } else {
        goOffline();
        runSimulationAction(action, data);
      }
    } finally { setLoading(false); }
  }, [loading, isOffline, state, stopTimer, runSimulationAction, goOffline]);

  const handleQuickStart = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (isOffline) {
       if (state === 'Heating' && isPredefinedRef.current) {
          setMsg('Programas não permitem acréscimo.');
          return;
       }
       setTime(t => Math.min(t + 30, 1200));
       setState('Heating');
    }

    debounceRef.current = setTimeout(() => {
      handleAction('quick-start');
    }, 300);
  };

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (!token && !isOffline) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 w-full max-w-sm shadow-2xl flex flex-col gap-4">
          <h2 className="text-white text-xl font-black text-center uppercase tracking-tighter">Microwave Access</h2>
          {msg && <div role="alert" className="text-rose-500 text-xs text-center font-bold uppercase">{msg}</div>}
          <input className="bg-black border border-zinc-800 p-3 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Usuário" value={user} onChange={e => setUser(e.target.value)} />
          <input type="password" title="senha" className="bg-black border border-zinc-800 p-3 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Senha" value={pass} onChange={e => setPass(e.target.value)} />
          <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl font-black transition-all">ENTRAR</button>
          <button type="button" onClick={() => { setIsOffline(true); setToken('offline'); }} className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest">Modo Simulação</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 font-sans">
      {isOffline && (
        <div role="alert" className="bg-amber-900/40 border border-amber-500/50 w-full max-w-2xl p-4 mb-6 rounded-xl text-xs text-center text-amber-200">
          <strong>SERVIDOR OFFLINE:</strong> Simulação local ativada. Reconectando automaticamente...
        </div>
      )}

      <main className={`bg-zinc-900 p-4 md:p-8 rounded-3xl border-4 flex flex-col md:flex-row gap-8 shadow-2xl ${isOffline ? 'border-amber-900/50' : 'border-zinc-800'}`}>
        <section className="flex flex-col gap-4">
          <div className="w-full md:w-[500px] h-64 md:h-80 bg-black border-4 border-zinc-800 rounded-2xl relative overflow-hidden flex items-center justify-center p-8 shadow-inner">
            <div className={`absolute inset-0 bg-yellow-500/10 transition-opacity ${state === 'Heating' ? 'opacity-100' : 'opacity-0'}`}></div>
            <p className="text-emerald-500 font-mono text-lg md:text-2xl break-all text-center leading-relaxed z-10 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
              {output || (state === 'Idle' ? 'PRONTO' : '')}
            </p>
          </div>
          {msg && <p className="text-rose-400 text-xs text-center font-bold">{msg}</p>}
        </section>

        <section className="w-full md:w-72 flex flex-col gap-6">
          <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-inner flex flex-col items-center font-mono">
            <div className="text-5xl md:text-6xl text-emerald-400 tracking-tighter" aria-label="Tempo restante">{fmt(time)}</div>
            <div className={`text-[10px] font-black uppercase tracking-widest mt-2 ${state === 'Heating' ? 'text-rose-500 animate-pulse' : 'text-zinc-600'}`}>{STATE_LABEL[state] || state}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button disabled={loading} onClick={() => handleAction('start', { durationSeconds: 30, power: 10, heatingChar: '.', isPredefined: false })} className="bg-emerald-600 hover:bg-emerald-500 p-4 rounded-xl font-black text-sm uppercase transition-all active:scale-95 focus:ring-2 focus:ring-emerald-500">Start</button>
            <button disabled={loading} onClick={handleQuickStart} className="bg-zinc-800 hover:bg-zinc-700 p-4 rounded-xl font-bold text-sm uppercase transition-all active:scale-95 focus:ring-2 focus:ring-zinc-500">+30s</button>
            <button disabled={loading} onClick={() => handleAction('pause-cancel')} className="col-span-2 bg-rose-800 hover:bg-rose-700 p-4 rounded-xl font-bold text-sm uppercase transition-all active:scale-95 focus:ring-2 focus:ring-rose-500">Pausa / Cancelar</button>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest ml-1">Programas Fixos</h2>
            <div className="grid grid-cols-2 gap-2">
              {PREDEFINED_PROGRAMS.map(p => (
                <button key={p.name} disabled={loading} onClick={() => handleAction('start-program', { programName: p.name })} className="bg-zinc-800 hover:bg-zinc-700 p-3 rounded-lg text-[11px] font-bold uppercase text-left truncate px-3 transition-all active:scale-95 focus:ring-2 focus:ring-zinc-600">{p.name}</button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
