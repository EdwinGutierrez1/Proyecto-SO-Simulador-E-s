/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto 10: I/O Simulator - Matriz de Pruebas (Normales, Límite, Error)
 * Katherine Peñaloza - Edwin Gutierrez | Sistemas Operativos V Semestre
 */

import React, { useState } from 'react';
import { PREDEFINED_TEST_SCENARIOS, SimulatorEngine } from '../services/simulatorEngine';
import { TestScenario, ComparisonMetrics } from '../types/io-simulator';
import { HelpCircle, Play, CheckCircle2, AlertTriangle, Layers, Clock, Cpu } from 'lucide-react';

export const TestMatrixView: React.FC = () => {
  const [testResults, setTestResults] = useState<
    Record<
      string,
      {
        polling: ComparisonMetrics;
        interrupts: ComparisonMetrics;
        executedAt: string;
      }
    >
  >({});
  const [runningId, setRunningId] = useState<string | null>(null);

  const handleRunTest = (scenario: TestScenario) => {
    setRunningId(scenario.id);
    setTimeout(() => {
      const benchmark = SimulatorEngine.runComparativeBenchmark(scenario, 70);
      setTestResults((prev) => ({
        ...prev,
        [scenario.id]: {
          polling: benchmark.pollingMetrics,
          interrupts: benchmark.interruptMetrics,
          executedAt: new Date().toLocaleTimeString('es-CO'),
        },
      }));
      setRunningId(null);
    }, 150);
  };

  const handleRunAll = () => {
    PREDEFINED_TEST_SCENARIOS.forEach((scenario, index) => {
      setTimeout(() => {
        handleRunTest(scenario);
      }, index * 200);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#09843B]" />
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Matriz de Pruebas Controladas (Rúbrica de Evaluación)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Evaluación con casos normales, límite y de error según la rúbrica docente (Páginas 2 y 14 del documento base).
              Cada prueba incluye datos de entrada, comportamiento esperado, resultados observados y conclusiones.
            </p>
          </div>

          <button
            onClick={handleRunAll}
            className="px-4 py-2 rounded-xl bg-[#09843B] hover:bg-[#076b30] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ejecutar Todas las Pruebas</span>
          </button>
        </div>
      </div>

      {/* Test Scenarios Cards */}
      <div className="space-y-4">
        {PREDEFINED_TEST_SCENARIOS.map((sc) => {
          const res = testResults[sc.id];
          const isRunning = runningId === sc.id;

          return (
            <div
              key={sc.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4 transition-all shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-lg uppercase tracking-wider ${
                      sc.category === 'NORMAL'
                        ? 'bg-emerald-50 text-[#09843B] border border-emerald-200'
                        : sc.category === 'LIMITE'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : sc.category === 'ERROR'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    Escenario {sc.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{sc.name}</h3>
                </div>

                <div className="flex items-center gap-3">
                  {res && (
                    <span className="text-[11px] text-slate-500 font-mono">
                      Ejecutado: {res.executedAt}
                    </span>
                  )}
                  <button
                    onClick={() => handleRunTest(sc)}
                    disabled={isRunning}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-800 text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-2xs transition-all cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current text-[#09843B]" />
                    <span>{isRunning ? 'Probando...' : 'Ejecutar Caso'}</span>
                  </button>
                </div>
              </div>

              {/* Description and Data Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Problema y Datos de Entrada
                  </span>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {sc.description}
                  </p>
                  <div className="text-[11px] text-slate-500 flex flex-wrap gap-2 pt-1 font-mono">
                    <span>Solicitudes: <strong className="text-slate-800">{sc.requestsToInject.length}</strong></span>
                    <span>·</span>
                    <span>
                      Dispositivos:{' '}
                      <strong className="text-slate-800">
                        {Array.from(new Set(sc.requestsToInject.map((r) => r.deviceType))).join(', ')}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Comportamiento Esperado por Teoría de SO
                  </span>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {sc.expectedOutcome}
                  </p>
                </div>
              </div>

              {/* Observed Results & Conclusion (if executed) */}
              {res && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                  <span className="text-[10px] uppercase font-bold text-[#09843B] tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resultados Observados en la Ejecución
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
                      <div className="text-amber-800 font-bold mb-1 font-sans">Mecanismo Sondeo (Polling):</div>
                      <div className="space-y-1 text-slate-700">
                        <div>Eficiencia CPU: <strong className="text-amber-700">{res.polling.cpuEfficiencyPct}%</strong></div>
                        <div>Ciclos desperdiciados: <strong className="text-slate-900">{res.polling.pollingWasteTicks} ticks</strong></div>
                        <div>Espera Promedio: <strong className="text-slate-900">{res.polling.avgWaitTicks} ticks</strong></div>
                        <div>Completadas: <strong className="text-slate-900">{res.polling.totalRequestsCompleted}</strong></div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                      <div className="text-[#09843B] font-bold mb-1 font-sans">Mecanismo Interrupciones (IRQ):</div>
                      <div className="space-y-1 text-slate-700">
                        <div>Eficiencia CPU: <strong className="text-[#09843B]">{res.interrupts.cpuEfficiencyPct}%</strong></div>
                        <div>Overhead ISR: <strong className="text-slate-900">{res.interrupts.isrOverheadTicks} ticks</strong></div>
                        <div>Espera Promedio: <strong className="text-slate-900">{res.interrupts.avgWaitTicks} ticks</strong></div>
                        <div>Completadas: <strong className="text-slate-900">{res.interrupts.totalRequestsCompleted}</strong></div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1 font-sans">
                    <span className="font-bold text-slate-900 block">Conclusión Técnica Sustentada:</span>
                    <p>
                      En este caso ({sc.name}), el uso de Interrupciones supera al Sondeo con una ganancia de eficiencia
                      del{' '}
                      <span className="text-[#09843B] font-bold font-mono">
                        {(res.interrupts.cpuEfficiencyPct - res.polling.cpuEfficiencyPct).toFixed(1)}%
                      </span>
                      . Los resultados empíricos validan el principio del diseño de sistemas operativos: el busy-waiting
                      solo es tolerable con periféricos de latencia comparable al ciclo de instrucción.
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
