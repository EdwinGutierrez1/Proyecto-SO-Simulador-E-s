/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto 10: I/O Simulator - Reto de Experimentación (Retrasos y Fallos)
 * Katherine Peñaloza - Edwin Gutierrez | Sistemas Operativos V Semestre
 */

import React, { useState } from 'react';
import { FaultType, DeviceType, IOMode } from '../types/io-simulator';
import { SimulatorEngine } from '../services/simulatorEngine';
import { Activity, AlertTriangle, Clock, Sliders, ShieldCheck, RefreshCw, Zap, ArrowRight } from 'lucide-react';

export const ExperimentationLab: React.FC = () => {
  const [selectedFaultDevice, setSelectedFaultDevice] = useState<DeviceType>('PRINTER');
  const [selectedFaultType, setSelectedFaultType] = useState<FaultType>('PAPER_JAM');
  const [latencyMultiplier, setLatencyMultiplier] = useState<number>(3);
  const [activeExpResults, setActiveExpResults] = useState<{
    pollingLostCycles: number;
    pollingResponseTime: number;
    irqLostCycles: number;
    irqResponseTime: number;
    analysis: string;
  } | null>(null);

  const handleRunExperiment = () => {
    // Construct scenario with the chosen fault and latency multiplier
    const simPolling = new SimulatorEngine('POLLING');
    const simInterrupts = new SimulatorEngine('INTERRUPTS');

    // Scale latency
    const baseLat = 15 * latencyMultiplier;
    simPolling.setDeviceLatency(selectedFaultDevice, baseLat);
    simInterrupts.setDeviceLatency(selectedFaultDevice, baseLat);

    // Apply fault
    simPolling.setFault(selectedFaultDevice, selectedFaultType);
    simInterrupts.setFault(selectedFaultDevice, selectedFaultType);

    // Add a critical request targeting that faulted device
    const reqData = {
      deviceType: selectedFaultDevice,
      operation: 'WRITE' as const,
      payload: `Datos del experimento de fallo [${selectedFaultType}]`,
      bytes: 2048,
      priority: 'HIGH' as const,
      processName: 'Proceso Crítico de Usuario',
      willFail: selectedFaultType,
    };

    simPolling.addRequest(reqData);
    simInterrupts.addRequest(reqData);

    // Run 50 ticks
    for (let i = 0; i < 50; i++) {
      simPolling.step();
      simInterrupts.step();
    }

    const pollingLost = simPolling.cpu.pollingCycles;
    const irqLost = simInterrupts.cpu.isrCycles;

    let analysis = '';
    if (selectedFaultType === 'PAPER_JAM') {
      analysis = `Ante un atasco de papel con latencia alta, el Sondeo mantuvo a la CPU en un bucle ciego consumiendo ${pollingLost} ciclos en vano. Por el contrario, el controlador con Interrupciones disparó la línea IRQ 7 notificando el error instantáneamente al kernel y permitiendo que la CPU continuara ejecutando tareas de usuario sin pérdida de ciclos.`;
    } else if (selectedFaultType === 'BAD_SECTOR') {
      analysis = `El sector defectuoso en disco provocó que el controlador fijara el bit ERROR. En Sondeo, el sistema tardó en enterarse y perdió ${pollingLost} ciclos esperando que el disco respondiera. Con Interrupciones, la rutina de excepción se activó de inmediato (IRQ 14) liberando la cola de E/S.`;
    } else if (selectedFaultType === 'PACKET_LOSS') {
      analysis = `La pérdida de paquetes en red evidencia la resiliencia del manejo asíncrono. Mientras el Sondeo acapara el bus de control y bloquea al proceso solicitante, las Interrupciones gestionan el timeout en segundo plano mediante el timer del sistema.`;
    } else {
      analysis = `El desbordamiento de búfer en teclado genera pulsos de error de hardware manejados de forma limpia por la ISR en modo Interrupciones.`;
    }

    setActiveExpResults({
      pollingLostCycles: pollingLost,
      pollingResponseTime: baseLat,
      irqLostCycles: irqLost,
      irqResponseTime: Math.min(baseLat, 4),
      analysis,
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#09843B]" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Reto de Experimentación: Inyección de Retrasos y Fallos de Hardware
          </h2>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
          Cumpliendo con el requerimiento del documento del proyecto, este laboratorio permite introducir
          retrasos artificiales (latencias mecánicas y jitter) y fallos reales de hardware en los dispositivos,
          contrastando cómo reacciona un sistema basado en Sondeo activo vs uno gobernado por Interrupciones.
        </p>

        {/* Experiment Setup Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              1. Seleccionar Dispositivo
            </label>
            <select
              value={selectedFaultDevice}
              onChange={(e) => {
                const dev = e.target.value as DeviceType;
                setSelectedFaultDevice(dev);
                if (dev === 'PRINTER') setSelectedFaultType('PAPER_JAM');
                if (dev === 'DISK') setSelectedFaultType('BAD_SECTOR');
                if (dev === 'NETWORK') setSelectedFaultType('PACKET_LOSS');
                if (dev === 'KEYBOARD') setSelectedFaultType('BUFFER_OVERFLOW');
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#09843B] font-medium shadow-2xs"
            >
              <option value="PRINTER">Impresora (IRQ 7 - Mecánica lenta)</option>
              <option value="DISK">Disco Duro (IRQ 14 - Bloques LBA)</option>
              <option value="NETWORK">Tarjeta de Red (IRQ 11 - Tramas Ethernet)</option>
              <option value="KEYBOARD">Teclado (IRQ 1 - Entrada de caracteres)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              2. Fallo a Inyectar
            </label>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[#09843B] font-bold shadow-2xs">
              {selectedFaultType === 'PAPER_JAM' && 'Atasco de Papel (Paper Jam)'}
              {selectedFaultType === 'BAD_SECTOR' && 'Sector Defectuoso CRC (Bad Sector)'}
              {selectedFaultType === 'PACKET_LOSS' && 'Pérdida de Paquetes / Link Down'}
              {selectedFaultType === 'BUFFER_OVERFLOW' && 'Desbordamiento de Búfer FIFO'}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              3. Factor de Retraso / Latencia: {latencyMultiplier}x
            </label>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={latencyMultiplier}
              onChange={(e) => setLatencyMultiplier(parseInt(e.target.value, 10))}
              className="w-full accent-[#09843B] h-2 bg-slate-200 rounded-lg cursor-pointer mt-2"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleRunExperiment}
            className="px-4 py-2 rounded-xl bg-[#09843B] hover:bg-[#076b30] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            <span>Ejecutar Prueba de Resiliencia</span>
          </button>
        </div>
      </div>

      {/* Results Comparison Grid */}
      {activeExpResults && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Polling Result */}
          <div className="bg-white border border-amber-300 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Comportamiento en Sondeo (Polling)</h3>
              </div>
              <span className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-bold border border-amber-200">
                Alta Vulnerabilidad
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-sans">Ciclos de CPU desperdiciados:</span>
                <span className="text-base font-bold text-amber-600">
                  {activeExpResults.pollingLostCycles} ciclos perdidos
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-sans">Impacto en la CPU:</span>
                <span className="text-rose-600 font-bold">Bloqueo por espera activa (100% busy)</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed pt-2">
              Durante todo el tiempo que el dispositivo estuvo atascado o retrasado, la CPU fue incapaz de hacer
              trabajo útil porque estaba consumiendo ciclos en el bucle <code className="font-mono text-[#09843B]">while(!ready)</code>.
            </p>
          </div>

          {/* Interrupts Result */}
          <div className="bg-white border border-emerald-300 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#09843B]" />
                <h3 className="text-sm font-bold text-slate-900">Comportamiento en Interrupciones (IRQ)</h3>
              </div>
              <span className="text-xs text-[#09843B] bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                Alta Resiliencia
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-sans">Ciclos de CPU desperdiciados:</span>
                <span className="text-base font-bold text-[#09843B]">
                  0 ciclos (Solo {activeExpResults.irqLostCycles} de ISR)
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-sans">Impacto en la CPU:</span>
                <span className="text-[#09843B] font-bold">Cero bloqueo (CPU disponible para usuario)</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed pt-2">
              El controlador de hardware manejó el retraso y notificó la falla mediante la línea de interrupción
              correspondiente. El kernel ejecutó la rutina de error y liberó inmediatamente los recursos.
            </p>
          </div>
        </div>
      )}

      {/* Analysis Card */}
      {activeExpResults && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-2.5 shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#09843B]" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Análisis Científico del Reto de Experimentación
            </h4>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans">
            {activeExpResults.analysis}
          </p>
        </div>
      )}
    </div>
  );
};
