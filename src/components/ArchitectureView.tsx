/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto 10: I/O Simulator - Simulador de Periféricos & Interrupciones
 * Katherine Peñaloza - Edwin Gutierrez | Sistemas Operativos V Semestre
 */

import React from 'react';
import { CPUState, IODevice, IOMode, DeviceType } from '../types/io-simulator';
import { Cpu, Zap, Activity, HardDrive, Keyboard, Printer, Network, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ArchitectureViewProps {
  cpu: CPUState;
  devices: Record<DeviceType, IODevice>;
  mode: IOMode;
  tickCount: number;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({
  cpu,
  devices,
  mode,
  tickCount,
}) => {
  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case 'KEYBOARD':
        return <Keyboard className="w-4 h-4" />;
      case 'DISK':
        return <HardDrive className="w-4 h-4" />;
      case 'PRINTER':
        return <Printer className="w-4 h-4" />;
      case 'NETWORK':
        return <Network className="w-4 h-4" />;
    }
  };

  const totalCycles = Math.max(1, cpu.totalCycles);
  const usefulPct = Math.round((cpu.usefulCycles / totalCycles) * 100);
  const pollingWastePct = Math.round((cpu.pollingCycles / totalCycles) * 100);
  const isrPct = Math.round((cpu.isrCycles / totalCycles) * 100);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xs">
      {/* Top Banner: Architecture Title & Mode Indicators */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Arquitectura del Subsistema de Entrada/Salida
            </h2>
            <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
              Tick: {tickCount}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Modelo de procesador central, buses de control/datos, PIC 8259A y controladores de hardware.
          </p>
        </div>

        {/* Mechanism state display */}
        <div className="flex items-center gap-3 text-xs">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 shadow-xs">
            <span className="text-slate-500 font-medium">Mecanismo Activo:</span>
            <span className={`font-bold ${mode === 'INTERRUPTS' ? 'text-[#09843B]' : 'text-amber-600'}`}>
              {mode === 'INTERRUPTS' ? 'E/S por Interrupciones (IRQ + ISR)' : 'E/S por Sondeo (Busy-Waiting Polling)'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Diagram Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* CPU Block (Left 4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-2xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#09843B]/10 text-[#09843B] border border-[#09843B]/20">
                  <Cpu className="w-4 h-4 text-[#09843B]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Unidad Central (CPU)</h3>
                  <span className="text-[11px] text-slate-500 font-medium">Núcleo x86-64</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="text-right">
                {cpu.activity === 'USER_COMPUTE' && (
                  <span className="text-xs font-semibold text-[#09843B] inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Cómputo Útil
                  </span>
                )}
                {cpu.activity === 'POLLING_PROBE' && (
                  <span className="text-xs font-semibold text-amber-600 inline-flex items-center gap-1 animate-pulse">
                    <Activity className="w-3.5 h-3.5" />
                    Sondeo Activo (Busy)
                  </span>
                )}
                {cpu.activity === 'EXECUTING_ISR' && (
                  <span className="text-xs font-semibold text-purple-700 inline-flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    ISR (IRQ {cpu.activeIrq})
                  </span>
                )}
                {cpu.activity === 'CPU_IDLE' && (
                  <span className="text-xs font-semibold text-slate-400">
                    Ociosa (HALT)
                  </span>
                )}
              </div>
            </div>

            {/* Current CPU Task */}
            <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                Instrucción / Tarea en Ejecución
              </div>
              <p className="text-xs text-slate-800 font-mono leading-relaxed break-words font-medium">
                {cpu.currentTaskDescription}
              </p>
            </div>

            {/* CPU Registers summary */}
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-sans">Registro EFLAGS</span>
                <span className="text-slate-800 font-bold">
                  IF={mode === 'INTERRUPTS' ? '1 (INT ON)' : '0 (INT OFF)'}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-sans">Vector IVT</span>
                <span className={cpu.activeIrq !== null ? 'text-purple-700 font-bold' : 'text-slate-500 font-bold'}>
                  {cpu.activeIrq !== null ? `0x2${cpu.activeIrq.toString(16).toUpperCase()}` : '0x00'}
                </span>
              </div>
            </div>
          </div>

          {/* CPU Cycle Breakdown Bar */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Distribución de Ciclos de Reloj</span>
              <span className="text-slate-800 font-mono font-bold">{cpu.totalCycles} ciclos</span>
            </div>

            {/* Visual stacked bar */}
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
              <div
                className="bg-[#09843B] transition-all duration-300"
                style={{ width: `${usefulPct}%` }}
                title={`Cómputo Útil: ${usefulPct}%`}
              />
              <div
                className="bg-amber-500 transition-all duration-300"
                style={{ width: `${pollingWastePct}%` }}
                title={`Desperdicio en Sondeo: ${pollingWastePct}%`}
              />
              <div
                className="bg-purple-600 transition-all duration-300"
                style={{ width: `${isrPct}%` }}
                title={`Overhead ISR: ${isrPct}%`}
              />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#09843B]" />
                <span className="text-slate-700">Útil ({usefulPct}%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-slate-700">Sondeo ({pollingWastePct}%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                <span className="text-slate-700">ISR ({isrPct}%)</span>
              </span>
            </div>
          </div>
        </div>

        {/* System Bus & PIC (Middle 3 cols) */}
        <div className="lg:col-span-3 flex flex-col justify-between space-y-3">
          {/* Programmable Interrupt Controller (PIC) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#09843B]" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  PIC 8259A / APIC
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono font-medium">
                {mode === 'INTERRUPTS' ? 'HABILITADO' : 'ENMASCARADO'}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-tight">
              Árbitro de prioridades de hardware. Serializa líneas IRQ y genera vectores de interrupción hacia la CPU.
            </p>

            {/* IRQ Lines status */}
            <div className="space-y-1.5 pt-1 text-xs font-mono">
              {Object.values(devices).map((dev) => {
                const isAsserted = cpu.activeIrq === dev.irqNumber;
                return (
                  <div
                    key={dev.id}
                    className={`flex items-center justify-between px-2.5 py-1 rounded-lg transition-colors ${
                      isAsserted
                        ? 'bg-purple-100 border border-purple-300 text-purple-900 font-semibold'
                        : 'bg-white border border-slate-200/80 text-slate-600'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">IRQ {dev.irqNumber}</span>
                      <span className="text-[10px] text-slate-500">({dev.displayName})</span>
                    </span>
                    <span className={isAsserted ? 'text-purple-700 font-bold animate-pulse' : 'text-slate-400'}>
                      {isAsserted ? 'ACTIVO' : 'EN ESPERA'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Bus Diagram */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Bus del Sistema
              </span>
              <span className="text-[10px] text-[#09843B] font-mono font-semibold">64-bit FSB / PCIe</span>
            </div>

            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="text-[#09843B] font-semibold">Bus de Control</span>
                <span className="text-emerald-700">IOR / IOW / INTA</span>
              </div>
              <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between">
                <span className="text-amber-800 font-semibold">Bus de Direcciones</span>
                <span className="text-amber-700">I/O Ports: 0x60 - 0x3F8</span>
              </div>
              <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between">
                <span className="text-blue-800 font-semibold">Bus de Datos</span>
                <span className="text-blue-700">Data Stream (FIFO/DMA)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Device Controllers (Right 5 cols) */}
        <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Controladores de Periféricos</h3>
              <span className="text-xs text-slate-500">Registros de Estado, Control y Búfer de Datos</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Object.values(devices).map((dev) => {
              const isBusy = dev.status === 'BUSY';
              const isError = dev.status === 'ERROR';
              const isDone = dev.registers.status.done;

              return (
                <div
                  key={dev.id}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isError
                      ? 'bg-rose-50 border-rose-300'
                      : isBusy
                      ? 'bg-emerald-50/60 border-emerald-300'
                      : isDone
                      ? 'bg-emerald-100 border-[#09843B]'
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  {/* Header of Device Controller */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#09843B]">{getDeviceIcon(dev.id)}</span>
                      <span className="text-xs font-bold text-slate-900">{dev.displayName}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 font-semibold">IRQ {dev.irqNumber}</span>
                  </div>

                  {/* Registers Display */}
                  <div className="space-y-1 font-mono text-[10px]">
                    <div className="flex items-center justify-between bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      <span className="text-slate-500">STATUS_REG:</span>
                      <span
                        className={`font-bold ${
                          isError
                            ? 'text-rose-600'
                            : isDone
                            ? 'text-[#09843B]'
                            : isBusy
                            ? 'text-amber-600'
                            : 'text-slate-700'
                        }`}
                      >
                        {dev.registers.status.rawHex} (
                        {isError ? 'ERR' : isDone ? 'DONE' : isBusy ? 'BUSY' : 'READY'})
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      <span className="text-slate-500">CONTROL_REG:</span>
                      <span className="text-slate-700 font-medium">
                        {dev.registers.control.rawHex} (IE={dev.registers.control.interruptEnable ? '1' : '0'})
                      </span>
                    </div>

                    <div className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-600 truncate">
                      <span className="text-slate-500">DATA: </span>
                      <span className="text-slate-900 font-medium">{dev.registers.data}</span>
                    </div>
                  </div>

                  {/* Progress bar if busy */}
                  {isBusy && dev.totalRequiredTicks > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>Progreso E/S</span>
                        <span>
                          {dev.totalRequiredTicks - dev.currentProgressTicks}/{dev.totalRequiredTicks} ticks
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#09843B] transition-all duration-200"
                          style={{
                            width: `${Math.round(
                              ((dev.totalRequiredTicks - dev.currentProgressTicks) / dev.totalRequiredTicks) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Fault message */}
                  {isError && (
                    <div className="mt-1.5 text-[10px] text-rose-700 bg-rose-100 p-1.5 rounded border border-rose-300 font-medium">
                      {dev.faultMessage || 'Fallo de hardware detectado'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
