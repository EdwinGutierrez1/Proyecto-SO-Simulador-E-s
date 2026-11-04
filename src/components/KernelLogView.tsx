/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto 10: I/O Simulator - Consola de Registro del Kernel (Kernel Log)
 * Katherine Peñaloza - Edwin Gutierrez | Sistemas Operativos V Semestre
 */

import React, { useState } from 'react';
import { KernelLogEntry, LogSeverity } from '../types/io-simulator';
import { Terminal, Filter, Zap, RefreshCw, AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';

interface KernelLogViewProps {
  logs: KernelLogEntry[];
  onClearLogs?: () => void;
}

export const KernelLogView: React.FC<KernelLogViewProps> = ({ logs, onClearLogs }) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const filteredLogs = logs.filter((log) => {
    if (filterSeverity === 'ALL') return true;
    if (filterSeverity === 'IRQ') return log.severity === 'IRQ';
    if (filterSeverity === 'POLLING') return log.severity === 'POLLING';
    if (filterSeverity === 'ERROR') return log.severity === 'ERROR' || log.severity === 'WARNING';
    return true;
  });

  const getSeverityBadge = (severity: LogSeverity) => {
    switch (severity) {
      case 'IRQ':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-purple-600" />
            IRQ
          </span>
        );
      case 'POLLING':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold flex items-center gap-1">
            <RefreshCw className="w-2.5 h-2.5 text-amber-600" />
            SONDEO
          </span>
        );
      case 'ERROR':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
            ERROR
          </span>
        );
      case 'WARNING':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
            WARN
          </span>
        );
      case 'SUCCESS':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-[#09843B] border border-emerald-200 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5 text-[#09843B]" />
            DONE
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
            INFO
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-xs">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#09843B]" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Registro de Eventos del Kernel (Kernel I/O Log)
          </h3>
          <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded font-medium border border-slate-200">
            {logs.length} eventos
          </span>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setFilterSeverity('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filterSeverity === 'ALL'
                ? 'bg-[#09843B] text-white shadow-2xs'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterSeverity('IRQ')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filterSeverity === 'IRQ'
                ? 'bg-purple-700 text-white shadow-2xs'
                : 'bg-slate-50 text-slate-600 hover:text-purple-700 border border-slate-200'
            }`}
          >
            Interrupciones
          </button>
          <button
            onClick={() => setFilterSeverity('POLLING')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filterSeverity === 'POLLING'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-slate-50 text-slate-600 hover:text-amber-700 border border-slate-200'
            }`}
          >
            Sondeo
          </button>
          <button
            onClick={() => setFilterSeverity('ERROR')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filterSeverity === 'ERROR'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-slate-50 text-slate-600 hover:text-rose-700 border border-slate-200'
            }`}
          >
            Fallos
          </button>
        </div>
      </div>

      {/* Terminal Scroll Container - Light theme with clear contrast */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-60 overflow-y-auto space-y-2 font-mono text-xs shadow-inner">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2.5 pb-2 border-b border-slate-200/70 last:border-none last:pb-0"
            >
              <span className="text-[10px] text-slate-500 shrink-0 select-none font-bold">
                [{log.timestamp}] T{log.tick}
              </span>
              <div className="shrink-0">{getSeverityBadge(log.severity)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-slate-900 font-bold text-[11px] truncate">
                  {log.title}
                </div>
                <div className="text-slate-600 text-[10px] break-words leading-tight mt-0.5">
                  {log.description}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-slate-400 text-xs italic">
            No hay eventos registrados con el filtro seleccionado.
          </div>
        )}
      </div>
    </div>
  );
};
