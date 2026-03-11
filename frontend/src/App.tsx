import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api';

const PREDEFINED_PROGRAMS = [
  { name: 'Pipoca', alimento: 'Pipoca (de micro-ondas)', durationSeconds: 180, power: 7, heatingChar: '*', instructions: 'Observar o barulho de estouros do milho...', isPredefined: true },
  { name: 'Leite', alimento: 'Leite', durationSeconds: 300, power: 5, heatingChar: 'o', instructions: 'Cuidado com aquecimento de liquidos...', isPredefined: true },
  { name: 'Carnes de boi', alimento: 'Carne em pedaço ou fatias', durationSeconds: 840, power: 4, heatingChar: 'b', instructions: 'Interrompa o processo na metade...', isPredefined: true },
  { name: 'Frango', alimento: 'Frango (qualquer corte)', durationSeconds: 480, power: 7, heatingChar: 'f', instructions: 'Interrompa o processo na metade...', isPredefined: true },
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
  const [state, setState] = useState('Idle');
  const [time, setTime] = useState(0);
  const [output, setOutput] = useState('');
  const [power, setPower] = useState(10);
  const [char, setChar] = useState('.');
  const [isPredefined, setIsPredefined] = useState(false);
  const [msg, setMsg] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    api.get('/microwave/status').catch(() => setIsOffline(true));
    window.addEventListener('backend-offline', () => setIsOffline(true));
  }, []);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          stopTimer();
          setState('Idle');
          setOutput((o) => o + " Aquecimento concluido");
          return 0;
        }
        setOutput((o) => o + char.repeat(power) + " ");
        return prev - 1;
      });
    }, 1000);
  }, [char, power]);

  const handleAction = async (action: string, data?: any) => {
    if (loading) return;
    setLoading(true);
    setMsg('');

    if (isOffline) {
      if (action === 'start') {
        if (state === 'Heating') {
          if (isPredefined) {
            setMsg('Nao e permitido acrescimo de tempo em programas pre-definidos.');
          } else {
            setTime(t => Math.min(t + 30, 120));
          }
        } else {
          const d = data || { durationSeconds: 30, power: 10, heatingChar: '.', isPredefined: false };
          setTime(d.durationSeconds);
          setPower(d.power);
          setChar(d.heatingChar);
          setIsPredefined(d.isPredefined);
          setState('Heating');
          setOutput('');
        }
      } else if (action === 'pause') {
        if (state === 'Heating') {
          setState('Paused');
          stopTimer();
        } else {
          setState('Idle');
          setTime(0);
          setOutput('');
        }
      }
      setLoading(false);
      return;
    }

    try {
      const res = await api.post(`/microwave/${action}`, data);
      setState(res.data.state);
      setTime(res.data.remainingSeconds);
      setOutput(res.data.output);
    } catch {
      setIsOffline(true);
      // Fallback imediato para local se falhar
      handleAction(action, data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (state === 'Heating' && isOffline) startTimer();
    return () => stopTimer();
  }, [state, isOffline, startTimer]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-emerald-500/30">
      
      {isOffline && (
        <div role="alert" className="bg-amber-900/40 border border-amber-500/50 w-full max-w-2xl p-4 mb-6 rounded-xl text-sm text-center text-amber-200 backdrop-blur-sm">
          <strong>SISTEMA EM MODO DE SEGURANÇA:</strong> Backend offline. Funçoes basicas operando via simulaçao local.
        </div>
      )}

      <main className={`bg-zinc-900 p-4 md:p-8 rounded-3xl border-4 flex flex-col md:flex-row gap-8 shadow-2xl transition-all duration-500 ${isOffline ? 'border-amber-900/50' : 'border-zinc-800'}`}>
        
        {/* Porta do Micro-ondas */}
        <section className="flex flex-col gap-4">
          <div className="w-full md:w-[500px] h-64 md:h-80 bg-black border-4 border-zinc-800 rounded-2xl relative overflow-hidden flex items-center justify-center p-8 shadow-inner">
            <div className={`absolute inset-0 bg-yellow-500/10 transition-opacity duration-700 ${state === 'Heating' ? 'opacity-100' : 'opacity-0'}`}></div>
            <div className="text-emerald-500 font-mono text-lg md:text-2xl break-all text-center leading-relaxed z-10 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
              {output || (state === 'Idle' ? 'PRONTO PARA USO' : '')}
            </div>
          </div>
          {msg && <p className="text-rose-400 text-xs md:text-sm italic text-center animate-bounce">{msg}</p>}
        </section>

        {/* Painel de Controle */}
        <section className="w-full md:w-72 flex flex-col gap-6">
          {/* Visor Digital */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-inner flex flex-col items-center">
            <div className="text-5xl md:text-6xl font-mono text-emerald-400 tracking-tighter" aria-label="Tempo restante">
              {formatTime(time)}
            </div>
            <div className={`text-xs font-black uppercase tracking-[0.2em] mt-2 ${state === 'Heating' ? 'text-rose-500 animate-pulse' : 'text-zinc-600'}`}>
              {STATE_MAP[state] || state}
            </div>
          </div>

          {/* Botoes de Comando */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              disabled={loading}
              onClick={() => handleAction('start', { durationSeconds: 30, power: 10, heatingChar: '.', isPredefined: false })}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 p-4 rounded-xl font-black text-sm transition-all active:scale-95 focus:ring-2 focus:ring-emerald-500 outline-none"
              aria-label="Iniciar aquecimento de 30 segundos"
            >
              START
            </button>
            <button 
              disabled={loading || (state === 'Heating' && isPredefined)}
              onClick={() => handleAction('start')}
              className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 p-4 rounded-xl font-bold text-sm transition-all active:scale-95 focus:ring-2 focus:ring-zinc-500 outline-none"
              aria-label="Acrescentar 30 segundos"
            >
              +30s
            </button>
            <button 
              disabled={loading}
              onClick={() => handleAction('pause')}
              className="col-span-2 bg-rose-800 hover:bg-rose-700 p-4 rounded-xl font-bold text-sm transition-all active:scale-95 focus:ring-2 focus:ring-rose-500 outline-none uppercase"
              aria-label="Pausar ou cancelar aquecimento"
            >
              Pausa / Cancelar
            </button>
          </div>

          {/* Grade de Programas */}
          <div className="flex flex-col gap-2">
            <h2 className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest ml-1">Programas Automaticos</h2>
            <div className="grid grid-cols-2 gap-2">
              {PREDEFINED_PROGRAMS.map(p => (
                <button 
                  key={p.name}
                  disabled={loading || state !== 'Idle'}
                  onClick={() => handleAction('start', p)}
                  className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 p-3 rounded-lg text-[11px] font-bold transition-all uppercase text-left truncate px-3 focus:ring-2 focus:ring-zinc-600 outline-none"
                  title={p.alimento}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
