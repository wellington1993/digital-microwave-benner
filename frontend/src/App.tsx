import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api';

const PREDEFINED_PROGRAMS = [
  { name: 'Pipoca', alimento: 'Pipoca (de micro-ondas)', durationSeconds: 180, power: 7, heatingChar: '*', instructions: 'Observar o barulho de estouros...', isPredefined: true },
  { name: 'Leite', alimento: 'Leite', durationSeconds: 300, power: 5, heatingChar: 'o', instructions: 'Cuidado com choque térmico...', isPredefined: true },
  { name: 'Carnes de boi', alimento: 'Carne em pedaço', durationSeconds: 840, power: 4, heatingChar: 'b', instructions: 'Interrompa na metade e vire...', isPredefined: true },
  { name: 'Frango', alimento: 'Frango (qualquer corte)', durationSeconds: 480, power: 7, heatingChar: 'f', instructions: 'Interrompa na metade e vire...', isPredefined: true },
  { name: 'Feijão', alimento: 'Feijão congelado', durationSeconds: 480, power: 9, heatingChar: 'j', instructions: 'Deixe o recipiente destampado...', isPredefined: true }
];

export default function App() {
  const [isOffline, setIsOffline] = useState(false);
  const [state, setState] = useState('Idle');
  const [time, setTime] = useState(0);
  const [output, setOutput] = useState('');
  const [power, setPower] = useState(10);
  const [char, setChar] = useState('.');
  const [isPredefined, setIsPredefined] = useState(false);
  const [msg, setMsg] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkConn = () => {
      api.get('/microwave/status').catch(() => setIsOffline(true));
    };
    checkConn();
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
    if (isOffline) {
      if (action === 'start') {
        if (state === 'Heating') {
          if (isPredefined) {
            setMsg('Nao e permitido acrescimo de tempo em programas pre-definidos.');
            return;
          }
          setTime(t => t + 30);
        } else {
          const d = data || { durationSeconds: 30, power: 10, heatingChar: '.', isPredefined: false };
          setTime(d.durationSeconds);
          setPower(d.power);
          setChar(d.heatingChar);
          setIsPredefined(d.isPredefined);
          setState('Heating');
          setOutput('');
          setMsg('');
        }
      } else if (action === 'pause') {
        if (state === 'Heating') {
          setState('Paused');
          stopTimer();
        } else if (state === 'Paused') {
          setState('Idle');
          setTime(0);
          setOutput('');
        } else {
          setTime(0);
          setPower(10);
        }
      }
      return;
    }

    try {
      const res = await api.post(`/microwave/${action}`, data);
      const s = res.data;
      setState(s.state);
      setTime(s.remainingSeconds);
      setOutput(s.output);
    } catch {
      setIsOffline(true);
      handleAction(action, data);
    }
  };

  useEffect(() => {
    if (state === 'Heating' && isOffline) {
      startTimer();
    }
    return () => stopTimer();
  }, [state, isOffline, startTimer]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      {isOffline && (
        <div className="bg-orange-700 border border-orange-500 w-full max-w-2xl p-3 mb-4 rounded text-sm text-center">
          <strong>SERVIDOR INDISPONÍVEL:</strong> Rodando em modo de simulaçao local.
        </div>
      )}

      <div className={`bg-zinc-800 p-6 rounded-2xl border-4 flex gap-6 shadow-2xl ${isOffline ? 'border-orange-900' : 'border-zinc-700'}`}>
        <div className="flex flex-col gap-4">
          <div className="w-96 h-64 bg-black border-2 border-zinc-700 rounded flex items-center justify-center p-4 relative">
            <div className={`absolute inset-0 bg-yellow-500/5 transition-opacity ${state === 'Heating' ? 'opacity-100' : 'opacity-0'}`}></div>
            <div className="text-green-500 font-mono text-lg break-all text-center leading-tight">
              {output || (state === 'Idle' ? 'PRONTO' : '')}
            </div>
          </div>
          {msg && <div className="text-red-400 text-xs italic text-center">{msg}</div>}
        </div>

        <div className="w-56 flex flex-col gap-4">
          <div className="bg-zinc-950 p-4 rounded border border-zinc-700">
            <div className="text-4xl font-mono text-green-400 text-center">{formatTime(time)}</div>
            <div className="text-[10px] text-zinc-500 text-center uppercase tracking-widest mt-1">{state}</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleAction('start', { durationSeconds: 30, power: 10, heatingChar: '.', isPredefined: false })} className="bg-emerald-800 p-3 rounded font-bold text-xs hover:bg-emerald-700 transition-colors">START</button>
            <button onClick={() => handleAction('start')} className="bg-zinc-700 p-3 rounded font-bold text-xs hover:bg-zinc-600">+30s</button>
            <button onClick={() => handleAction('pause')} className="col-span-2 bg-rose-900 p-3 rounded font-bold text-xs hover:bg-rose-800 transition-colors uppercase">Pause / Cancel</button>
          </div>

          <div className="flex flex-col gap-1 mt-2">
            <span className="text-[9px] text-zinc-500 font-bold uppercase">Programas</span>
            <div className="grid grid-cols-2 gap-1">
              {PREDEFINED_PROGRAMS.slice(0, 4).map(p => (
                <button key={p.name} onClick={() => handleAction('start', p)} className="bg-zinc-700 p-2 rounded text-[9px] hover:bg-zinc-600 transition-colors uppercase">{p.name}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
