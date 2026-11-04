/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto 10: I/O Simulator - Modal de Nueva Solicitud de E/S
 * Katherine Peñaloza - Edwin Gutierrez | Sistemas Operativos V Semestre
 */

import React, { useState } from 'react';
import { DeviceType, FaultType } from '../types/io-simulator';
import { X, Plus, Send, AlertTriangle } from 'lucide-react';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: {
    deviceType: DeviceType;
    operation: 'READ' | 'WRITE';
    payload: string;
    bytes: number;
    priority: 'LOW' | 'NORMAL' | 'HIGH';
    processName: string;
    willFail?: FaultType;
  }) => void;
}

export const NewRequestModal: React.FC<NewRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [deviceType, setDeviceType] = useState<DeviceType>('DISK');
  const [operation, setOperation] = useState<'READ' | 'WRITE'>('READ');
  const [processName, setProcessName] = useState<string>('App de Usuario PID 2048');
  const [payload, setPayload] = useState<string>('Lectura de bloque LBA 0x4A20 (/var/log/syslog)');
  const [bytes, setBytes] = useState<number>(4096);
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH'>('NORMAL');
  const [willFail, setWillFail] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let fault: FaultType = 'NONE';
    if (willFail) {
      if (deviceType === 'PRINTER') fault = 'PAPER_JAM';
      else if (deviceType === 'DISK') fault = 'BAD_SECTOR';
      else if (deviceType === 'NETWORK') fault = 'PACKET_LOSS';
      else fault = 'BUFFER_OVERFLOW';
    }

    onSubmit({
      deviceType,
      operation,
      payload,
      bytes: Number(bytes),
      priority,
      processName,
      willFail: fault,
    });
    onClose();
  };

  const handleDeviceChange = (dev: DeviceType) => {
    setDeviceType(dev);
    if (dev === 'KEYBOARD') {
      setOperation('READ');
      setPayload('Entrada de caracteres [Cadena de prueba]');
      setBytes(16);
    } else if (dev === 'DISK') {
      setOperation('READ');
      setPayload('Lectura de bloque LBA 0x4A20');
      setBytes(4096);
    } else if (dev === 'PRINTER') {
      setOperation('WRITE');
      setPayload('Impresión de reporte de auditoría');
      setBytes(16384);
    } else if (dev === 'NETWORK') {
      setOperation('READ');
      setPayload('GET /index.html (Paquete TCP/IP)');
      setBytes(1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#09843B]/10 text-[#09843B]">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Generar Solicitud de E/S</h3>
              <p className="text-[11px] text-slate-500">Inyectar carga de trabajo al bus del sistema</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
              Dispositivo Destino
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['KEYBOARD', 'DISK', 'PRINTER', 'NETWORK'] as DeviceType[]).map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => handleDeviceChange(d)}
                  className={`p-2.5 rounded-lg border text-left font-medium transition-colors cursor-pointer ${
                    deviceType === d
                      ? 'bg-[#09843B]/10 border-[#09843B] text-[#09843B] font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {d === 'KEYBOARD' && 'Teclado (IRQ 1)'}
                  {d === 'DISK' && 'Disco Duro (IRQ 14)'}
                  {d === 'PRINTER' && 'Impresora (IRQ 7)'}
                  {d === 'NETWORK' && 'Tarjeta de Red (IRQ 11)'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Tipo de Operación
              </label>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value as 'READ' | 'WRITE')}
                className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#09843B] focus:ring-1 focus:ring-[#09843B]"
              >
                <option value="READ">Lectura (READ)</option>
                <option value="WRITE">Escritura (WRITE)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Prioridad en Cola
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'LOW' | 'NORMAL' | 'HIGH')}
                className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#09843B] focus:ring-1 focus:ring-[#09843B]"
              >
                <option value="LOW">Baja (LOW)</option>
                <option value="NORMAL">Normal (NORMAL)</option>
                <option value="HIGH">Alta / Tiempo Real (HIGH)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-1">
              Nombre del Proceso Solicitante
            </label>
            <input
              type="text"
              value={processName}
              onChange={(e) => setProcessName(e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#09843B] focus:ring-1 focus:ring-[#09843B]"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Descripción / Payload
              </label>
              <input
                type="text"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#09843B] focus:ring-1 focus:ring-[#09843B]"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Tamaño (Bytes)
              </label>
              <input
                type="number"
                min={1}
                max={1048576}
                value={bytes}
                onChange={(e) => setBytes(parseInt(e.target.value, 10))}
                className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#09843B] focus:ring-1 focus:ring-[#09843B]"
                required
              />
            </div>
          </div>

          {/* Fault injection checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-50/50 border border-amber-200 cursor-pointer hover:bg-amber-50 transition-colors">
              <input
                type="checkbox"
                checked={willFail}
                onChange={(e) => setWillFail(e.target.checked)}
                className="rounded accent-amber-600 w-4 h-4"
              />
              <span className="text-slate-700 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Forzar fallo de hardware en esta solicitud (Para pruebas de resiliencia)</span>
              </span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#09843B] hover:bg-[#07692e] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Encolar Solicitud</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
