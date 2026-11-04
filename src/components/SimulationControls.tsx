/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto 10: I/O Simulator - Simulador de Periféricos & Interrupciones
 * Katherine Peñaloza - Edwin Gutierrez | Sistemas Operativos V Semestre
 */

import React from 'react';
import { IOMode } from '../types/io-simulator';
import { Play, Pause, SkipForward, RotateCcw, Zap, RefreshCw, Sparkles } from 'lucide-react';

interface SimulationControlsProps {
  isRunning: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  mode: IOMode;
  onChangeMode: (newMode: IOMode) => void;
  speedMs: number;
  onChangeSpeed: (newSpeedMs: number) => void;
  autoGenerate: boolean;
  onToggleAutoGenerate: () => void;
  tickCount: number;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isRunning,
  onTogglePlay,
  onStep,
  onReset,
  mode,
  onChangeMode,
  speedMs,
  onChangeSpeed,
  autoGenerate,
  onToggleAutoGenerate,
  tickCount,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
      {/* Primary Action Buttons: Play/Pause, Step, Reset */}
      <div className="flex items-center gap-2.5 w-full md:w-auto">
        <button
          onClick={onTogglePlay}
          className={`flex-1 md:flex-none px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-[#09843B] hover:bg-[#076b30] text-white'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pausar Simulación</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Iniciar Simulación</span>
            </>
          )}
        </button>

        <button
          onClick={onStep}
          disabled={isRunning}
          className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors shadow-xs"
          title="Avanzar exactamente 1 tick de reloj de CPU"
        >
          <SkipForward className="w-4 h-4 text-[#09843B]" />
          <span className="hidden sm:inline">Paso a Paso</span>
        </button>

        <button
          onClick={onReset}
          className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors shadow-xs"
          title="Reiniciar ticks y estado de dispositivos"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reiniciar</span>
        </button>

        <div className="ml-1 font-mono text-xs px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 shadow-xs">
          <span className="text-slate-400 font-sans">Tick: </span>
          <span className="font-bold text-[#09843B]">{tickCount}</span>
        </div>
      </div>

      {/* Mechanism Selector (Segmented Tab Control) */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 w-full md:w-auto">
        <button
          onClick={() => onChangeMode('INTERRUPTS')}
          className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === 'INTERRUPTS'
              ? 'bg-[#09843B] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${mode === 'INTERRUPTS' ? 'text-white' : 'text-[#09843B]'}`} />
          <span>Interrupciones (IRQ)</span>
        </button>

        <button
          onClick={() => onChangeMode('POLLING')}
          className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === 'POLLING'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${mode === 'POLLING' ? 'text-white' : 'text-amber-600'}`} />
          <span>Sondeo (Polling)</span>
        </button>
      </div>

      {/* Speed & Auto-generation Controls */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
        {/* Auto generator toggle */}
        <button
          onClick={onToggleAutoGenerate}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all shadow-xs cursor-pointer ${
            autoGenerate
              ? 'bg-emerald-50 text-[#09843B] border-emerald-300 font-bold'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
          title="Genera solicitudes de entrada/salida de forma automática y continua"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#09843B]" />
          <span>Carga Auto: {autoGenerate ? 'ACTIVA' : 'OFF'}</span>
        </button>

        {/* Speed Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium hidden lg:inline">Velocidad:</span>
          <select
            value={speedMs}
            onChange={(e) => onChangeSpeed(parseInt(e.target.value, 10))}
            className="bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#09843B] shadow-xs"
          >
            <option value={1500}>0.5x (Lenta)</option>
            <option value={800}>1.0x (Normal)</option>
            <option value={400}>2.0x (Rápida)</option>
            <option value={150}>5.0x (Ultra)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
