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

  const timerRef        = useRef<number | null>(null);
  const charRef         = useRef('.');
  const powerRef        = useRef(10);
  const isPredefinedRef = useRef(false);
  const esRef           = useRef<EventSource | null>(null);
  const lastTickRef     = useRef<{ at: number; remaining: number } | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const goOffline = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    lastTickRef.current = null;
    setIsOffline(true);
  }, []);

  useEffect(() => {
    if (!token || isOffline || token === 'offline') return;

    const es = new EventSource('/api/microwave/stream');
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        setState(d.state ?? 'Idle');
        setOutput(d.output ?? '');
        if (d.state === 'Heating') {
          lastTickRef.current = { at: Date.now(), remaining: d.remainingSeconds ?? 0 };
        } else {
          lastTickRef.current = null;
          setTime(d.remainingSeconds ?? 0);
        }
      } catch { }
    };

    es.onerror = () => goOffline();

    return () => { es.close(); esRef.current = null; lastTickRef.current = null; };
  }, [token, isOffline, goOffline]);

  useEffect(() => {
    if (isOffline) return;
    const id = setInterval(() => {
      const tick = lastTickRef.current;
      if (!tick) return;
      const elapsed = Math.floor((Date.now() - tick.at) / 1000);
      setTime(Math.max(0, tick.remaining - elapsed));
    }, 250);
    return () => clearInterval(id);
  }, [isOffline]);

  useEffect(() => {
    if (!isOffline || !token || token === 'offline') return;

    const probe = setInterval(async () => {
      try {
        await api.get('/microwave/status');
        stopTimer();
        setState('Idle'); setTime(0); setOutput(''); setIsPredefined(false);
        isPredefinedRef.current = false;
        setIsOffline(false);
      } catch { }
    }, 5000);

    return () => clearInterval(probe);
  }, [isOffline, token, stopTimer]);

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
        setOutput(o => o + charRef.current.repeat(powerRef.current));
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
      if (!err.response || err.response.status !== 401) {
        setIsOffline(true);
        setToken('offline');
      } else {
        setMsg(err.response.data?.mensagem || 'Credenciais inválidas.');
      }
    } finally { setLoading(false); }
  };

  const simAction = useCallback((action: string, data: any = {}) => {
    if (action === 'quick-start') {
      if (state === 'Heating') {
        if (isPredefinedRef.current) { setMsg('Programas pré-definidos não permitem acréscimo de tempo.'); return; }
        setTime(t => t + 30);
      } else if (state === 'Paused') {
        setState('Heating');
      } else {
        charRef.current = '.'; powerRef.current = 10; isPredefinedRef.current = false;
        setIsPredefined(false); setOutput(''); setTime(30); setState('Heating');
      }
    } else if (action === 'start-program') {
      if (state !== 'Idle') { setMsg('O micro-ondas já está em funcionamento.'); return; }
      const p = PREDEFINED_PROGRAMS.find(x => x.name === data.programName);
      if (!p) { setMsg('Programa não encontrado.'); return; }
      charRef.current = p.heatingChar; powerRef.current = p.power; isPredefinedRef.current = true;
      setIsPredefined(true); setOutput(''); setTime(p.durationSeconds); setState('Heating');
    } else if (action === 'pause-cancel') {
      if (state === 'Heating') { setState('Paused'); stopTimer(); }
      else { stopTimer(); setState('Idle'); setTime(0); setOutput(''); setIsPredefined(false); isPredefinedRef.current = false; }
    }
    setMsg('');
  }, [state, stopTimer]);

  const handleAction = useCallback(async (action: string, data: any = {}) => {
    if (loading) return;
    setLoading(true); setMsg('');
    if (isOffline) { simAction(action, data); setLoading(false); return; }

    try {
      const endpoint = action === 'start-program' ? '/microwave/start-program' : `/microwave/${action}`;
      const res = await api.post(endpoint, data);
      setState(res.data.state);
      setTime(res.data.remainingSeconds);
      setOutput(res.data.output ?? '');
      setIsPredefined(res.data.isPredefined ?? false);
      isPredefinedRef.current = res.data.isPredefined ?? false;
    } catch (err: any) {
      if (err.response?.status === 401) {
        sessionStorage.removeItem('microwave_token'); setToken(null);
      } else if (!err.response) {
        goOffline();
        simAction(action, data);
      } else {
        setMsg(err.response.data?.mensagem || 'Erro ao processar.');
      }
    } finally { setLoading(false); }
  }, [loading, isOffline, simAction, goOffline]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (!token && !isOffline) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 w-full max-w-sm shadow-2xl flex flex-col gap-4">
          <h2 className="text-white text-xl font-black text-center tracking-tighter">Micro-ondas Digital</h2>
          {msg && <p role="alert" className="text-rose-500 text-xs text-center font-bold uppercase">{msg}</p>}
          <input className="bg-black border border-zinc-800 p-3 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            placeholder="Usuario" value={user} onChange={e => setUser(e.target.value)} autoComplete="username" />
          <input type="password" className="bg-black border border-zinc-800 p-3 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            placeholder="Senha" value={pass} onChange={e => setPass(e.target.value)} autoComplete="current-password" />
          <button type="submit" disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white p-3 rounded-xl font-black text-sm transition-all">
            {loading ? 'Aguarde...' : 'Entrar'}
          </button>
          <button type="button" onClick={() => { setIsOffline(true); setToken('offline'); }}
            className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest hover:text-zinc-400 transition-colors">
            Modo Simulação
          </button>
        </form>
      </div>
    );
  }

  const isHeating = state === 'Heating';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
      {isOffline && (
        <div role="alert" className="w-full max-w-2xl mb-4 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-center border bg-amber-950/50 border-amber-700/60 text-amber-300">
          Modo Offline — Backend indisponivel. Reconectando automaticamente...
          <span className="inline-block ml-2 animate-pulse">⟳</span>
        </div>
      )}

      <main className={`bg-zinc-900 p-4 md:p-8 rounded-3xl border-4 flex flex-col md:flex-row gap-8 shadow-2xl transition-colors duration-500 ${isOffline ? 'border-amber-900/40' : 'border-zinc-800'}`}>
        <section className="flex flex-col gap-4">
          <div className="w-full md:w-[500px] min-h-[200px] md:min-h-[280px] bg-black border-4 border-zinc-800 rounded-2xl flex items-center justify-center p-8 relative overflow-hidden shadow-inner"
            aria-live="polite" aria-label="Visor de aquecimento">
            <div className={`absolute inset-0 bg-yellow-500/10 transition-opacity ${isHeating ? 'opacity-100' : 'opacity-0'}`} />
            <p className="text-emerald-500 font-mono text-lg md:text-xl break-all text-center leading-relaxed z-10 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
              {output || (state === 'Idle' ? 'SISTEMA PRONTO' : '')}
            </p>
          </div>
          {msg && <p role="alert" className="text-rose-400 text-xs text-center font-bold">{msg}</p>}
        </section>

        <section className="w-full md:w-72 flex flex-col gap-6" aria-label="Painel de controle">
          <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 flex flex-col items-center font-mono">
            <time className="text-5xl md:text-6xl text-emerald-400 tracking-tighter" aria-label={`Tempo restante: ${fmt(time)}`}>
              {fmt(time)}
            </time>
            <span className={`text-[10px] font-black uppercase tracking-widest mt-2 ${isHeating ? 'text-rose-400 animate-pulse' : state === 'Paused' ? 'text-amber-400' : 'text-zinc-600'}`}>
              {STATE_LABEL[state] ?? state}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button disabled={loading} onClick={() => handleAction('quick-start')}
              aria-label="Inicio rapido 30 segundos"
              className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 p-4 rounded-xl font-black text-sm transition-all active:scale-95 focus:ring-2 focus:ring-emerald-500 outline-none">
              START
            </button>
            <button disabled={loading || !isHeating || isPredefined} onClick={() => handleAction('quick-start')}
              aria-label="Adicionar 30 segundos"
              className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 p-4 rounded-xl font-bold text-sm transition-all active:scale-95 focus:ring-2 focus:ring-zinc-600 outline-none">
              +30s
            </button>
            <button disabled={loading} onClick={() => handleAction('pause-cancel')}
              aria-label="Pausar ou cancelar"
              className="col-span-2 bg-rose-900 hover:bg-rose-800 disabled:opacity-50 p-4 rounded-xl font-bold text-sm uppercase tracking-wide transition-all active:scale-95 focus:ring-2 focus:ring-rose-600 outline-none">
              {state === 'Paused' ? 'Cancelar' : 'Pausa / Cancelar'}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-1">Programas automáticos</h2>
            <div className="grid grid-cols-2 gap-2">
              {PREDEFINED_PROGRAMS.map(p => (
                <button key={p.name} disabled={loading || state !== 'Idle'}
                  title={state !== 'Idle' ? 'Micro-ondas em uso' : undefined}
                  onClick={() => handleAction('start-program', { programName: p.name })}
                  className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 p-3 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all active:scale-95 focus:ring-2 focus:ring-zinc-600 outline-none text-left truncate">
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => { sessionStorage.removeItem('microwave_token'); setToken(null); setIsOffline(false); stopTimer(); setState('Idle'); setTime(0); setOutput(''); }}
            className="text-zinc-700 text-[10px] uppercase tracking-widest hover:text-zinc-500 transition-colors text-center">
            Sair
          </button>
        </section>
      </main>
    </div>
  );
}