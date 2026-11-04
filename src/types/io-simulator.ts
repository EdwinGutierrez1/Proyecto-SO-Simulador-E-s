/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto 10: I/O Simulator - Simulador de Periféricos & Interrupciones
 * Katherine Peñaloza - Edwin Gutierrez | Sistemas Operativos V Semestre
 */

export type DeviceType = 'KEYBOARD' | 'DISK' | 'PRINTER' | 'NETWORK';

export type IOMode = 'INTERRUPTS' | 'POLLING';

export type RequestStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type OperationType = 'READ' | 'WRITE';

export type FaultType = 
  | 'NONE'
  | 'BUFFER_OVERFLOW' // Teclado
  | 'BAD_SECTOR'       // Disco
  | 'PAPER_JAM'        // Impresora
  | 'PACKET_LOSS';     // Red

export interface DeviceRegisters {
  status: {
    ready: boolean;
    busy: boolean;
    done: boolean;
    error: boolean;
    rawHex: string; // e.g. "0x02"
  };
  control: {
    start: boolean;
    interruptEnable: boolean;
    reset: boolean;
    cancel: boolean;
    rawHex: string; // e.g. "0x03"
  };
  data: string; // Hex representation or ASCII snippet
  auxiliary?: string; // e.g. sector number, port, baud
}

export interface IORequest {
  id: string;
  processId: string;
  processName: string;
  deviceType: DeviceType;
  operation: OperationType;
  payload: string;
  bytes: number;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  createdAtTick: number;
  startedAtTick?: number;
  completedAtTick?: number;
  waitTime: number; // Ticks spent waiting in queue
  serviceTime: number; // Ticks spent inside device controller
  status: RequestStatus;
  failedReason?: string;
  willFail?: FaultType;
}

export interface IODevice {
  id: DeviceType;
  name: string;
  displayName: string;
  category: 'Entrada' | 'Almacenamiento' | 'Salida' | 'Comunicaciones';
  irqNumber: number; // IRQ line (e.g., 1 for Kbd, 14 for Disk, 7 for Printer, 11 for NIC)
  baseLatencyTicks: number; // Nominal service time per request
  transferRateDesc: string; // e.g. "100 B/s", "500 MB/s"
  iconName: string;
  status: 'IDLE' | 'BUSY' | 'ERROR' | 'INTERRUPTING';
  registers: DeviceRegisters;
  queue: IORequest[];
  currentRequest: IORequest | null;
  currentProgressTicks: number;
  totalRequiredTicks: number;
  activeFault: FaultType;
  faultMessage?: string;
  metrics: {
    totalHandled: number;
    totalWaitTime: number;
    totalServiceTime: number;
    busyTicks: number;
    faultsCount: number;
  };
}

export type CPUActivity = 
  | 'USER_COMPUTE'    // Running productive user tasks
  | 'POLLING_PROBE'   // Actively probing device registers (wasteful busy-waiting)
  | 'EXECUTING_ISR'   // Servicing interrupt vector routine
  | 'CPU_IDLE';       // Waiting when no user jobs or I/O pending

export interface CPUState {
  activity: CPUActivity;
  currentTaskDescription: string;
  activeIrq: number | null;
  totalCycles: number;
  usefulCycles: number;
  pollingCycles: number;
  isrCycles: number;
  idleCycles: number;
  userProcessesCount: number;
  contextSwitches: number;
}

export type LogSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'IRQ' | 'POLLING';

export interface KernelLogEntry {
  id: string;
  tick: number;
  timestamp: string;
  severity: LogSeverity;
  category: 'KERNEL' | 'CPU' | 'DEVICE' | 'BUS' | 'PIC' | 'METRICS' | 'IRQ';
  title: string;
  description: string;
  device?: DeviceType;
  irq?: number;
}

export interface TestScenario {
  id: string;
  name: string;
  category: 'NORMAL' | 'LIMITE' | 'ERROR' | 'LATENCIA';
  description: string;
  expectedOutcome: string;
  requestsToInject: Array<
    Omit<IORequest, 'id' | 'createdAtTick' | 'waitTime' | 'serviceTime' | 'status' | 'processId'> & {
      processId?: string;
    }
  >;
  faultOverrides?: Partial<Record<DeviceType, FaultType>>;
  latencyOverrides?: Partial<Record<DeviceType, number>>;
}

export interface ComparisonMetrics {
  mode: IOMode;
  totalTicks: number;
  usefulCpuTicks: number;
  pollingWasteTicks: number;
  isrOverheadTicks: number;
  idleCpuTicks: number;
  cpuEfficiencyPct: number; // useful / (useful + polling + isr)
  totalRequestsCompleted: number;
  totalRequestsFailed: number;
  avgWaitTicks: number;
  avgTurnaroundTicks: number;
  throughputPer100Ticks: number;
  deviceUtilization: Record<DeviceType, number>;
}
