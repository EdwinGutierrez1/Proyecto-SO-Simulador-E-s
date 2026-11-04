/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto 10: I/O Simulator - Comparativa Sondeo (Polling) vs Interrupciones (IRQ)
 * Katherine Peñaloza - Edwin Gutierrez | Sistemas Operativos V Semestre
 */

import React, { useState } from 'react';
import { SimulatorEngine, PREDEFINED_TEST_SCENARIOS } from '../services/simulatorEngine';
import { ComparisonMetrics, TestScenario } from '../types/io-simulator';
import { GitCompare, Play, CheckCircle2, AlertTriangle, ArrowRight, Zap, RefreshCw, Cpu, Clock, Gauge } from 'lucide-react';

export const ComparisonBench: React.FC = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('SCENARIO_NORMAL');
  const [ticksCount, setTicksCount] = useState<number>(75);
  const [results, setResults] = useState<{
    pollingMetrics: ComparisonMetrics;
    interruptMetrics: ComparisonMetrics;
  } | null>(() => {
    // Run initial benchmark on mount
    const scenario = PREDEFINED_TEST_SCENARIOS[0];
    return SimulatorEngine.runComparativeBenchmark(scenario, 75);
  });
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const currentScenario =
    PREDEFINED_TEST_SCENARIOS.find((s) => s.id === selectedScenarioId) || PREDEFINED_TEST_SCENARIOS[0];

  const handleRunBenchmark = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = SimulatorEngine.runComparativeBenchmark(currentScenario, ticksCount);
      setResults(res);
      setIsRunning(false);
    }, 150);
  };

  const pol = results?.pollingMetrics;
  const irq = results?.interruptMetrics;

  return (
    <div className="space-y-6">
      {/* Top Banner & Scenario Selector */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-[#09843B]" />
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Banco de Comparación Directa: Sondeo vs Interrupciones
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ejecución cuantitativa controlada de la misma carga de trabajo bajo Sondeo (Busy-Waiting) e Interrupciones (Hardware IRQ).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunBenchmark}
              disabled={isRunning}
              className="px-4 py-2 rounded-xl bg-[#09843B] hover:bg-[#076b30] disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? 'Ejecutando Benchmark...' : 'Ejecutar Comparativa'}</span>
            </button>
          </div>
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Escenario de Prueba
            </label>
            <select
              value={selectedScenarioId}
              onChange={(e) => setSelectedScenarioId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#09843B] font-medium shadow-2xs"
            >
              {PREDEFINED_TEST_SCENARIOS.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Ticks de Reloj de Simulación
            </label>
            <select
              value={ticksCount}
              onChange={(e) => setTicksCount(parseInt(e.target.value, 10))}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#09843B] font-medium shadow-2xs"
            >
              <option value={50}>50 Ticks (Carga corta)</option>
              <option value={75}>75 Ticks (Recomendado)</option>
              <option value={120}>120 Ticks (Carga extendida)</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
              Carga del Escenario
            </span>
            <p className="text-slate-800 text-[11px] font-medium truncate">
              {currentScenario.requestsToInject.length} solicitudes E/S inyectadas simultáneamente
            </p>
          </div>
        </div>
      </div>

      {/* Side by Side Comparative Cards */}
      {pol && irq && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Polling Card */}
          <div className="bg-white border border-amber-300 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Sondeo (Programmed I/O)</h3>
                  <p className="text-xs text-amber-700 font-medium">Bucle de Espera Activa (Busy-Waiting)</p>
                </div>
              </div>
              <span className="text-xs font-mono text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-bold">
                STATUS_REG Polling
              </span>
            </div>

            {/* Polling Metrics */}
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px] font-sans font-medium">Eficiencia de CPU (Cómputo Útil)</span>
                  <span className="text-2xl font-bold text-amber-600">{pol.cpuEfficiencyPct}%</span>
                </div>
                <div className="text-right text-[11px] text-slate-600">
                  <div>Útil: <strong className="text-slate-800">{pol.usefulCpuTicks}t</strong></div>
                  <div className="text-amber-700 font-bold">Desperdiciado: {pol.pollingWasteTicks}t</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block font-sans">Espera Promedio</span>
                  <span className="text-base font-bold text-slate-900">{pol.avgWaitTicks} ticks</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block font-sans">Retorno Total</span>
                  <span className="text-base font-bold text-slate-900">{pol.avgTurnaroundTicks} ticks</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-600 font-sans">Solicitudes completadas:</span>
                <span className="text-slate-900 font-bold">
                  {pol.totalRequestsCompleted} de {currentScenario.requestsToInject.length}
                </span>
              </div>
            </div>

            {/* Visual CPU Time Allocation */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Distribución Temporal de CPU</span>
                <span className="font-mono text-amber-700 font-bold">{pol.pollingWasteTicks} ciclos perdidos</span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                <div
                  className="bg-[#09843B]"
                  style={{ width: `${(pol.usefulCpuTicks / pol.totalTicks) * 100}%` }}
                  title="Útil"
                />
                <div
                  className="bg-amber-500"
                  style={{ width: `${(pol.pollingWasteTicks / pol.totalTicks) * 100}%` }}
                  title="Sondeo"
                />
              </div>
              <p className="text-[11px] text-slate-500 italic">
                La CPU queda secuestrada comprobando registros continuamente sin permitir que otros procesos avancen.
              </p>
            </div>
          </div>

          {/* Interrupts Card */}
          <div className="bg-white border border-emerald-300 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-[#09843B] border border-emerald-200">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Interrupciones (Interrupt-Driven)</h3>
                  <p className="text-xs text-[#09843B] font-medium">Asíncrono con Rutina ISR de Hardware</p>
                </div>
              </div>
              <span className="text-xs font-mono text-[#09843B] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold">
                Líneas IRQ + PIC
              </span>
            </div>

            {/* Interrupts Metrics */}
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px] font-sans font-medium">Eficiencia de CPU (Cómputo Útil)</span>
                  <span className="text-2xl font-bold text-[#09843B]">{irq.cpuEfficiencyPct}%</span>
                </div>
                <div className="text-right text-[11px] text-slate-600">
                  <div className="text-[#09843B] font-bold">Útil: {irq.usefulCpuTicks}t</div>
                  <div>Overhead ISR: {irq.isrOverheadTicks}t</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block font-sans">Espera Promedio</span>
                  <span className="text-base font-bold text-slate-900">{irq.avgWaitTicks} ticks</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block font-sans">Retorno Total</span>
                  <span className="text-base font-bold text-slate-900">{irq.avgTurnaroundTicks} ticks</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-600 font-sans">Solicitudes completadas:</span>
                <span className="text-slate-900 font-bold">
                  {irq.totalRequestsCompleted} de {currentScenario.requestsToInject.length}
                </span>
              </div>
            </div>

            {/* Visual CPU Time Allocation */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Distribución Temporal de CPU</span>
                <span className="font-mono text-[#09843B] font-bold">{irq.usefulCpuTicks} ciclos útiles</span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                <div
                  className="bg-[#09843B]"
                  style={{ width: `${(irq.usefulCpuTicks / irq.totalTicks) * 100}%` }}
                  title="Útil"
                />
                <div
                  className="bg-purple-500"
                  style={{ width: `${(irq.isrOverheadTicks / irq.totalTicks) * 100}%` }}
                  title="Overhead ISR"
                />
              </div>
              <p className="text-[11px] text-slate-500 italic">
                La CPU solo gasta una fracción mínima (1-3%) atendiendo la ISR en el momento exacto en que el periférico termina.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Analytical Conclusion Box */}
      {pol && irq && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#09843B]" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Dictamen Comparativo del Sistema Operativo
            </h3>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700 leading-relaxed font-sans">
            <p>
              <strong>Ganancia de Rendimiento:</strong> El mecanismo de{' '}
              <span className="text-[#09843B] font-bold">Interrupciones</span> liberó un{' '}
              <span className="text-[#09843B] font-bold font-mono">
                +{(irq.cpuEfficiencyPct - pol.cpuEfficiencyPct).toFixed(1)}%
              </span>{' '}
              adicional de capacidad de cómputo para tareas de usuario, eliminando los{' '}
              <span className="text-amber-700 font-mono font-bold">{pol.pollingWasteTicks} ciclos</span> que el
              Sondeo desperdició testeando los registros de estado (<code className="font-mono text-[#09843B]">STATUS_REG</code>).
            </p>
            <p>
              <strong>Cuándo conviene cada uno:</strong> El Sondeo es únicamente viable en controladores ultra-rápidos
              o sistemas embebidos de un solo hilo donde el overhead de guardar registros en pila y cambiar de contexto
              supera el tiempo de la propia transferencia. Para periféricos con latencia mecánica (disco, impresora) o
              red interactiva, las <strong>Interrupciones</strong> son indiscutiblemente superiores.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
