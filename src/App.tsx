/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto 10: I/O Simulator - Simulador de Periféricos & Interrupciones
 * Katherine Peñaloza - Edwin Gutierrez | Sistemas Operativos V Semestre
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimulatorEngine, INITIAL_DEVICES, INITIAL_CPU_STATE } from './services/simulatorEngine';
import { IOMode, DeviceType, FaultType, IORequest } from './types/io-simulator';
import { Header } from './components/Header';
import { SimulationControls } from './components/SimulationControls';
import { ArchitectureView } from './components/ArchitectureView';
import { DeviceCard } from './components/DeviceCard';
import { MetricsDashboard } from './components/MetricsDashboard';
import { ComparisonBench } from './components/ComparisonBench';
import { ExperimentationLab } from './components/ExperimentationLab';
import { TestMatrixView } from './components/TestMatrixView';
import { TechnicalReportModal } from './components/TechnicalReportModal';
import { NewRequestModal } from './components/NewRequestModal';
import { KernelLogView } from './components/KernelLogView';

export default function App() {
  // Navigation Tab State
  const [currentTab, setCurrentTab] = useState<
    'simulator' | 'comparison' | 'experiments' | 'testmatrix' | 'report'
  >('simulator');

  // Simulator Instance Reference
  const engineRef = useRef<SimulatorEngine>(new SimulatorEngine('INTERRUPTS'));

  // Reactive State Synced from Engine
  const [mode, setMode] = useState<IOMode>('INTERRUPTS');
  const [tickCount, setTickCount] = useState<number>(0);
  const [devices, setDevices] = useState(engineRef.current.devices);
  const [cpu, setCpu] = useState(engineRef.current.cpu);
  const [logs, setLogs] = useState(engineRef.current.logs);
  const [completedRequests, setCompletedRequests] = useState<IORequest[]>([]);
  const [failedRequests, setFailedRequests] = useState<IORequest[]>([]);

  // Simulation Loop Controls
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(800);
  const [autoGenerate, setAutoGenerate] = useState<boolean>(false);

  // Modals
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isNewRequestOpen, setIsNewRequestOpen] = useState<boolean>(false);

  // Sync state helper
  const syncStateFromEngine = useCallback(() => {
    const engine = engineRef.current;
    setTickCount(engine.tickCount);
    setDevices({ ...engine.devices });
    setCpu({ ...engine.cpu });
    setLogs([...engine.logs]);
    setCompletedRequests([...engine.completedRequests]);
    setFailedRequests([...engine.failedRequests]);
  }, []);

  // Step function
  const handleStep = useCallback(() => {
    const engine = engineRef.current;

    // If auto-generator is enabled, occasionally inject random request
    if (autoGenerate && Math.random() < 0.35) {
      const devTypes: DeviceType[] = ['KEYBOARD', 'DISK', 'PRINTER', 'NETWORK'];
      const chosenDev = devTypes[Math.floor(Math.random() * devTypes.length)];
      const samplePayloads: Record<DeviceType, string> = {
        KEYBOARD: 'Entrada interactiva de usuario',
        DISK: 'Lectura /etc/hosts (4KB)',
        PRINTER: 'Página de documento PDF',
        NETWORK: 'GET /api/v1/status HTTP/1.1',
      };
      const sampleBytes: Record<DeviceType, number> = {
        KEYBOARD: 4,
        DISK: 4096,
        PRINTER: 8192,
        NETWORK: 1420,
      };

      engine.addRequest({
        deviceType: chosenDev,
        operation: chosenDev === 'PRINTER' ? 'WRITE' : 'READ',
        payload: samplePayloads[chosenDev],
        bytes: sampleBytes[chosenDev],
        priority: Math.random() > 0.7 ? 'HIGH' : 'NORMAL',
        processName: `Proceso-Worker-${Math.floor(Math.random() * 90 + 10)}`,
      });
    }

    engine.step();
    syncStateFromEngine();
  }, [autoGenerate, syncStateFromEngine]);

  // Clock Timer Effect
  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      handleStep();
    }, speedMs);

    return () => clearInterval(intervalId);
  }, [isRunning, speedMs, handleStep]);

  // Mode Change
  const handleChangeMode = (newMode: IOMode) => {
    setMode(newMode);
    engineRef.current.setMode(newMode);
    syncStateFromEngine();
  };

  // Reset
  const handleReset = () => {
    setIsRunning(false);
    engineRef.current.reset(mode);
    syncStateFromEngine();
  };

  // Quick Event Injection
  const handleInjectQuickEvent = (deviceId: DeviceType) => {
    const engine = engineRef.current;
    if (deviceId === 'KEYBOARD') {
      engine.addRequest({
        deviceType: 'KEYBOARD',
        operation: 'READ',
        payload: 'Pulsación de tecla [Espacio]',
        bytes: 1,
        priority: 'HIGH',
        processName: 'Editor de Texto',
      });
    } else if (deviceId === 'DISK') {
      engine.addRequest({
        deviceType: 'DISK',
        operation: 'READ',
        payload: 'Sector LBA 0x0F4B (data.bin)',
        bytes: 4096,
        priority: 'NORMAL',
        processName: 'Gestor de BD',
      });
    } else if (deviceId === 'PRINTER') {
      engine.addRequest({
        deviceType: 'PRINTER',
        operation: 'WRITE',
        payload: 'Documento informe_final.ps',
        bytes: 12288,
        priority: 'LOW',
        processName: 'Daemon de Impresión',
      });
    } else if (deviceId === 'NETWORK') {
      engine.addRequest({
        deviceType: 'NETWORK',
        operation: 'READ',
        payload: 'Paquete entrante UDP (Streaming)',
        bytes: 1420,
        priority: 'HIGH',
        processName: 'Socket de Red',
      });
    }
    syncStateFromEngine();
  };

  // Fault toggle
  const handleToggleFault = (deviceId: DeviceType, fault: FaultType) => {
    engineRef.current.setFault(deviceId, fault);
    syncStateFromEngine();
  };

  // Latency Change
  const handleChangeLatency = (deviceId: DeviceType, latency: number) => {
    engineRef.current.setDeviceLatency(deviceId, latency);
    syncStateFromEngine();
  };

  // Custom Request from Modal
  const handleCreateCustomRequest = (params: {
    deviceType: DeviceType;
    operation: 'READ' | 'WRITE';
    payload: string;
    bytes: number;
    priority: 'LOW' | 'NORMAL' | 'HIGH';
    processName: string;
    willFail?: FaultType;
  }) => {
    engineRef.current.addRequest(params);
    syncStateFromEngine();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Universal Top Bar */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'report') {
            setIsReportOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        onOpenNewRequest={() => setIsNewRequestOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Tab 1: Interactive Simulator (Hardware, Peripherals, Architecture & Metrics) */}
        {currentTab === 'simulator' && (
          <div className="space-y-6">
            {/* Simulation Controls Toolbar */}
            <SimulationControls
              isRunning={isRunning}
              onTogglePlay={() => setIsRunning(!isRunning)}
              onStep={handleStep}
              onReset={handleReset}
              mode={mode}
              onChangeMode={handleChangeMode}
              speedMs={speedMs}
              onChangeSpeed={setSpeedMs}
              autoGenerate={autoGenerate}
              onToggleAutoGenerate={() => setAutoGenerate(!autoGenerate)}
              tickCount={tickCount}
            />

            {/* Visual Hardware Architecture Model */}
            <ArchitectureView
              cpu={cpu}
              devices={devices}
              mode={mode}
              tickCount={tickCount}
            />

            {/* 4 Peripheral Devices Cards Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#09843B]" />
                  <span>Dispositivos de Entrada/Salida Simulados (Página 12)</span>
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Teclado (IRQ 1) · Disco (IRQ 14) · Impresora (IRQ 7) · Red (IRQ 11)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(['KEYBOARD', 'DISK', 'PRINTER', 'NETWORK'] as DeviceType[]).map((devId) => (
                  <DeviceCard
                    key={devId}
                    device={devices[devId]}
                    onInjectQuickEvent={handleInjectQuickEvent}
                    onToggleFault={handleToggleFault}
                    onChangeLatency={handleChangeLatency}
                  />
                ))}
              </div>
            </div>

            {/* Metrics Dashboard */}
            <MetricsDashboard
              devices={devices}
              cpu={cpu}
              completedRequests={completedRequests}
              failedRequests={failedRequests}
              totalTicks={tickCount}
              mode={mode}
            />

            {/* Kernel Event Log Console */}
            <KernelLogView logs={logs} />
          </div>
        )}

        {/* Tab 2: Side-by-Side Comparison (Polling vs Interrupts) */}
        {currentTab === 'comparison' && <ComparisonBench />}

        {/* Tab 3: Experimentation Lab (Delays and Fault Injection) */}
        {currentTab === 'experiments' && <ExperimentationLab />}

        {/* Tab 4: Test Matrix View (Rúbrica Escenarios) */}
        {currentTab === 'testmatrix' && <TestMatrixView />}
      </main>

      {/* Comprehensive Professional Academic University Footer */}
      <footer className="border-t border-slate-200 bg-white text-slate-600 shadow-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Column 1: Institutional Branding */}
            <div className="space-y-3">
              <img
                src="/assets/aistudio/image_dddfa0f9.png"
                alt="Universidad Simón Bolívar"
                className="h-10 w-auto object-contain"
              />
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Institución de Educación Superior comprometida con la excelencia académica, la formación integral y el rigor científico en ingeniería.
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#09843B]/10 text-[#09843B] text-[11px] font-bold border border-[#09843B]/20">
                  Carrera: Ingeniería de Sistemas
                </span>
              </div>
            </div>

            {/* Column 2: Academic Unit & Faculty */}
            <div className="space-y-2.5 text-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1.5">
                Cátedra y Docencia
              </h4>
              <ul className="space-y-2 text-slate-600">
                <li>
                  <span className="text-slate-400 block text-[11px]">Asignatura:</span>
                  <strong className="text-slate-900">Sistemas Operativos</strong> (V Semestre)
                </li>
                <li>
                  <span className="text-slate-400 block text-[11px]">Docente Titular:</span>
                  <strong className="text-[#09843B] font-bold">MSc. Alvaro Salamanca</strong>
                </li>
                <li>
                  <span className="text-slate-400 block text-[11px]">Facultad:</span>
                  <span>Facultad de Ingenierías</span>
                </li>
              </ul>
            </div>

            {/* Column 3: Authors & Project Metadata */}
            <div className="space-y-2.5 text-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1.5">
                Equipo de Desarrollo
              </h4>
              <ul className="space-y-2 text-slate-600">
                <li>
                  <span className="text-slate-400 block text-[11px]">Estudiantes Asignados:</span>
                  <div className="font-semibold text-slate-900 space-y-0.5 mt-0.5">
                    <p className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#09843B]" />
                      <span>Katherine Peñaloza</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#09843B]" />
                      <span>Edwin Gutierrez</span>
                    </p>
                  </div>
                </li>
                <li>
                  <span className="text-slate-400 block text-[11px]">Propuesta:</span>
                  <span>Proyecto Final #10 · I/O Simulator</span>
                </li>
              </ul>
            </div>

            {/* Column 4: Quick Navigation & Defense */}
            <div className="space-y-2.5 text-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1.5">
                Acciones de Sustentación
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => setIsReportOpen(true)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-[#09843B]/10 hover:text-[#09843B] text-slate-700 text-xs font-semibold border border-slate-200 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>Informe Técnico y Rúbrica</span>
                  <span className="text-[10px] text-slate-400">PDF</span>
                </button>
                <button
                  onClick={() => setCurrentTab('testmatrix')}
                  className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-[#09843B]/10 hover:text-[#09843B] text-slate-700 text-xs font-semibold border border-slate-200 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>Matriz de Pruebas Controladas</span>
                  <span className="text-[10px] text-slate-400">4 Casos</span>
                </button>
                <button
                  onClick={() => setIsNewRequestOpen(true)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-[#09843B] hover:bg-[#076b30] text-white text-xs font-bold transition-colors flex items-center justify-between shadow-2xs cursor-pointer"
                >
                  <span>Generar Solicitud E/S</span>
                  <span className="text-[10px] text-emerald-100">+ Inyectar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Accreditation Line */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>
              © 2026 Universidad Simón Bolívar · Ingeniería de Sistemas · Sistemas Operativos V Semestre
            </p>
            <p className="text-slate-400">
              Evaluación Final con Rúbrica de Excelencia · Docente: <span className="text-slate-600 font-medium">MSc. Alvaro Salamanca</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Technical Report & Academic Defense Modal */}
      <TechnicalReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      {/* New Request Modal */}
      <NewRequestModal
        isOpen={isNewRequestOpen}
        onClose={() => setIsNewRequestOpen(false)}
        onSubmit={handleCreateCustomRequest}
      />
    </div>
  );
}
