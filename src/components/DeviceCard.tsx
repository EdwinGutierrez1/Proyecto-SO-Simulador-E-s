/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto 10: I/O Simulator - Tarjeta de Dispositivo Periférico
 * Katherine Peñaloza - Edwin Gutierrez | Sistemas Operativos V Semestre
 */

import React from 'react';
import { IODevice, FaultType, IORequest } from '../types/io-simulator';
import {
  Keyboard,
  HardDrive,
  Printer,
  Network,
  AlertTriangle,
  Play,
  Clock,
  Layers,
  Sliders,
  Check,
  Send,
} from 'lucide-react';

interface DeviceCardProps {
  device: IODevice;
  onInjectQuickEvent: (deviceId: IODevice['id']) => void;
  onToggleFault: (deviceId: IODevice['id'], fault: FaultType) => void;
  onChangeLatency: (deviceId: IODevice['id'], latencyTicks: number) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  onInjectQuickEvent,
  onToggleFault,
  onChangeLatency,
}) => {
  const getDeviceIcon = () => {
    switch (device.id) {
      case 'KEYBOARD':
        return <Keyboard className="w-5 h-5" />;
      case 'DISK':
        return <HardDrive className="w-5 h-5" />;
      case 'PRINTER':
        return <Printer className="w-5 h-5" />;
      case 'NETWORK':
        return <Network className="w-5 h-5" />;
    }
  };

  const getSpecificFault = (): FaultType => {
    switch (device.id) {
      case 'KEYBOARD':
        return 'BUFFER_OVERFLOW';
      case 'DISK':
        return 'BAD_SECTOR';
      case 'PRINTER':
        return 'PAPER_JAM';
      case 'NETWORK':
        return 'PACKET_LOSS';
    }
  };

  const getFaultButtonLabel = () => {
    switch (device.id) {
      case 'KEYBOARD':
        return 'Buffer Overflow';
      case 'DISK':
        return 'Sector Dañado (CRC)';
      case 'PRINTER':
        return 'Atasco de Papel';
      case 'NETWORK':
        return 'Pérdida de Paquetes';
    }
  };

  const getQuickActionLabel = () => {
    switch (device.id) {
      case 'KEYBOARD':
        return 'Teclear Teclas';
      case 'DISK':
        return 'Leer Bloque 4KB';
      case 'PRINTER':
        return 'Imprimir Página';
      case 'NETWORK':
        return 'Enviar Paquete';
    }
  };

  const specificFault = getSpecificFault();
  const hasActiveFault = device.activeFault !== 'NONE';

  return (
    <div
      className={`bg-white border rounded-2xl p-4 flex flex-col justify-between space-y-4 transition-all shadow-xs ${
        hasActiveFault
          ? 'border-rose-300 ring-2 ring-rose-500/10'
          : device.status === 'BUSY'
          ? 'border-emerald-400 ring-2 ring-emerald-500/10 shadow-sm'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl transition-colors ${
                hasActiveFault
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : device.status === 'BUSY'
                  ? 'bg-emerald-50 text-[#09843B] border border-emerald-200'
                  : 'bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              {getDeviceIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">{device.displayName}</h3>
                <span className="text-[10px] font-mono text-[#09843B] bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-200/60">
                  IRQ {device.irqNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{device.name}</p>
            </div>
          </div>

          {/* Status Label */}
          <div className="text-right">
            {hasActiveFault ? (
              <span className="text-xs font-bold text-rose-600 inline-flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Fallo Activo
              </span>
            ) : device.status === 'BUSY' ? (
              <span className="text-xs font-bold text-[#09843B] inline-flex items-center gap-1 animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                Ocupado
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-500 inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Listo
              </span>
            )}
          </div>
        </div>

        {/* Current Active Request */}
        <div className="mt-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
            <span>Operación en Curso</span>
            {device.currentRequest && (
              <span className="font-mono text-[#09843B] text-[10px] font-bold">
                {device.currentRequest.id}
              </span>
            )}
          </div>

          {device.currentRequest ? (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-900 font-bold truncate">
                  {device.currentRequest.operation}: {device.currentRequest.processName}
                </span>
                <span className="text-slate-500 font-mono text-[11px] shrink-0 font-medium">
                  {device.currentRequest.bytes} B
                </span>
              </div>

              <div className="text-xs text-slate-600 font-mono truncate">
                {device.currentRequest.payload}
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Tiempo de servicio</span>
                  <span>
                    {device.totalRequiredTicks - device.currentProgressTicks}/{device.totalRequiredTicks} ticks
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${
                      hasActiveFault ? 'bg-rose-500' : 'bg-[#09843B]'
                    }`}
                    style={{
                      width: `${Math.round(
                        ((device.totalRequiredTicks - device.currentProgressTicks) /
                          Math.max(1, device.totalRequiredTicks)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50/70 border border-dashed border-slate-200 text-center text-xs text-slate-400">
              Sin operaciones activas. Controlador a la espera.
            </div>
          )}
        </div>

        {/* Device Queue */}
        <div className="mt-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-slate-400" />
              <span>Cola de Espera (Prioridad)</span>
            </span>
            <span className="font-mono text-xs text-slate-600 font-bold">
              {device.queue.length}
            </span>
          </div>

          {device.queue.length > 0 ? (
            <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
              {device.queue.map((req) => (
                <div
                  key={req.id}
                  className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]"
                >
                  <div className="truncate flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        req.priority === 'HIGH'
                          ? 'bg-rose-500'
                          : req.priority === 'NORMAL'
                          ? 'bg-[#09843B]'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span className="text-slate-800 font-mono font-semibold">{req.id}</span>
                    <span className="text-slate-500 truncate">({req.processName})</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[10px] shrink-0">
                    {req.waitTime}t
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">Cola vacía</p>
          )}
        </div>
      </div>

      {/* Latency and Fault Controls */}
      <div className="pt-3 border-t border-slate-100 space-y-2.5">
        {/* Latency Slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-700">
            <span className="flex items-center gap-1 font-medium">
              <Sliders className="w-3 h-3 text-slate-400" />
              <span>Latencia Base:</span>
            </span>
            <span className="font-mono font-bold text-[#09843B]">
              {device.baseLatencyTicks} ticks
            </span>
          </div>
          <input
            type="range"
            min={2}
            max={40}
            step={1}
            value={device.baseLatencyTicks}
            onChange={(e) => onChangeLatency(device.id, parseInt(e.target.value, 10))}
            className="w-full accent-[#09843B] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => onInjectQuickEvent(device.id)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 shadow-2xs cursor-pointer"
          >
            <Send className="w-3 h-3 text-[#09843B]" />
            <span className="truncate">{getQuickActionLabel()}</span>
          </button>

          <button
            onClick={() => onToggleFault(device.id, hasActiveFault ? 'NONE' : specificFault)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border shadow-2xs cursor-pointer ${
              hasActiveFault
                ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="Inyectar o resolver fallo de hardware según el reto de experimentación"
          >
            <AlertTriangle className={`w-3 h-3 ${hasActiveFault ? 'text-rose-600' : 'text-slate-400'}`} />
            <span className="truncate">{hasActiveFault ? 'Resolver' : getFaultButtonLabel()}</span>
          </button>
        </div>

        {/* Device Metrics Footer */}
        <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Atendidas: <strong className="text-slate-700">{device.metrics.totalHandled}</strong></span>
          <span>Fallos: <strong className="text-slate-700">{device.metrics.faultsCount}</strong></span>
          <span>Ticks: <strong className="text-slate-700">{device.metrics.busyTicks}</strong></span>
        </div>
      </div>
    </div>
  );
};
