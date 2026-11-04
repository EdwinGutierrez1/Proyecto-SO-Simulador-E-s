/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto 10: I/O Simulator - Motor de Simulación de Periféricos & Interrupciones
 * Katherine Peñaloza - Edwin Gutierrez | Sistemas Operativos V Semestre
 */

import {
  DeviceType,
  IOMode,
  IODevice,
  IORequest,
  CPUState,
  KernelLogEntry,
  FaultType,
  TestScenario,
  ComparisonMetrics,
} from '../types/io-simulator';

export const INITIAL_DEVICES: Record<DeviceType, IODevice> = {
  KEYBOARD: {
    id: 'KEYBOARD',
    name: 'Teclado Estándar PS/2',
    displayName: 'Teclado',
    category: 'Entrada',
    irqNumber: 1,
    baseLatencyTicks: 6,
    transferRateDesc: '10-20 B/s (Interactivo)',
    iconName: 'Keyboard',
    status: 'IDLE',
    registers: {
      status: { ready: true, busy: false, done: false, error: false, rawHex: '0x01' },
      control: { start: false, interruptEnable: true, reset: false, cancel: false, rawHex: '0x02' },
      data: '0x00 [BUFFER EMPTY]',
      auxiliary: 'ScanCode: 0x00, Port: 0x60',
    },
    queue: [],
    currentRequest: null,
    currentProgressTicks: 0,
    totalRequiredTicks: 6,
    activeFault: 'NONE',
    metrics: {
      totalHandled: 0,
      totalWaitTime: 0,
      totalServiceTime: 0,
      busyTicks: 0,
      faultsCount: 0,
    },
  },
  DISK: {
    id: 'DISK',
    name: 'Controlador Disco SATA / NVMe',
    displayName: 'Disco Duro',
    category: 'Almacenamiento',
    irqNumber: 14,
    baseLatencyTicks: 12,
    transferRateDesc: '550 MB/s (Bloques 4KB)',
    iconName: 'HardDrive',
    status: 'IDLE',
    registers: {
      status: { ready: true, busy: false, done: false, error: false, rawHex: '0x01' },
      control: { start: false, interruptEnable: true, reset: false, cancel: false, rawHex: '0x02' },
      data: '0x0000 [LBA SECTOR 0]',
      auxiliary: 'Cyl: 12, Head: 2, Sect: 34',
    },
    queue: [],
    currentRequest: null,
    currentProgressTicks: 0,
    totalRequiredTicks: 12,
    activeFault: 'NONE',
    metrics: {
      totalHandled: 0,
      totalWaitTime: 0,
      totalServiceTime: 0,
      busyTicks: 0,
      faultsCount: 0,
    },
  },
  PRINTER: {
    id: 'PRINTER',
    name: 'Impresora Láser USB / Spooler',
    displayName: 'Impresora',
    category: 'Salida',
    irqNumber: 7,
    baseLatencyTicks: 22,
    transferRateDesc: '35 ppm (Mecánica lenta)',
    iconName: 'Printer',
    status: 'IDLE',
    registers: {
      status: { ready: true, busy: false, done: false, error: false, rawHex: '0x01' },
      control: { start: false, interruptEnable: true, reset: false, cancel: false, rawHex: '0x02' },
      data: '0x00 [SPOOLER READY]',
      auxiliary: 'Tray: Ready, Ink: 98%',
    },
    queue: [],
    currentRequest: null,
    currentProgressTicks: 0,
    totalRequiredTicks: 22,
    activeFault: 'NONE',
    metrics: {
      totalHandled: 0,
      totalWaitTime: 0,
      totalServiceTime: 0,
      busyTicks: 0,
      faultsCount: 0,
    },
  },
  NETWORK: {
    id: 'NETWORK',
    name: 'Adaptador de Red Gigabit Ethernet',
    displayName: 'Tarjeta de Red',
    category: 'Comunicaciones',
    irqNumber: 11,
    baseLatencyTicks: 9,
    transferRateDesc: '1000 Mbps (Full Duplex)',
    iconName: 'Network',
    status: 'IDLE',
    registers: {
      status: { ready: true, busy: false, done: false, error: false, rawHex: '0x01' },
      control: { start: false, interruptEnable: true, reset: false, cancel: false, rawHex: '0x02' },
      data: '0x00 [RX/TX RING READY]',
      auxiliary: 'MAC: 52:54:00:12:34:56',
    },
    queue: [],
    currentRequest: null,
    currentProgressTicks: 0,
    totalRequiredTicks: 9,
    activeFault: 'NONE',
    metrics: {
      totalHandled: 0,
      totalWaitTime: 0,
      totalServiceTime: 0,
      busyTicks: 0,
      faultsCount: 0,
    },
  },
};

export const INITIAL_CPU_STATE: CPUState = {
  activity: 'USER_COMPUTE',
  currentTaskDescription: 'Ejecutando proceso de usuario PID 1024 (Cálculo matricial)',
  activeIrq: null,
  totalCycles: 0,
  usefulCycles: 0,
  pollingCycles: 0,
  isrCycles: 0,
  idleCycles: 0,
  userProcessesCount: 4,
  contextSwitches: 0,
};

export class SimulatorEngine {
  public mode: IOMode = 'INTERRUPTS';
  public tickCount: number = 0;
  public devices: Record<DeviceType, IODevice>;
  public cpu: CPUState;
  public logs: KernelLogEntry[] = [];
  public completedRequests: IORequest[] = [];
  public failedRequests: IORequest[] = [];
  public pollingDeviceIndex: number = 0; // For round-robin device polling
  public pollingInterval: number = 1; // Polling checks per tick
  public pollingTimeoutLimit: number = 40; // Max cycles spent in polling wait before timeout
  public currentPollingWaitCount: number = 0;

  constructor(initialMode: IOMode = 'INTERRUPTS') {
    this.mode = initialMode;
    this.devices = JSON.parse(JSON.stringify(INITIAL_DEVICES));
    this.cpu = JSON.parse(JSON.stringify(INITIAL_CPU_STATE));
    this.addLog(
      'INFO',
      'KERNEL',
      'Subsistema de E/S Inicializado',
      `Simulador listo en modo ${initialMode === 'INTERRUPTS' ? 'INTERRUPCIONES (IRQ + ISR)' : 'SONDEO (Busy-Waiting Polling)'}. Dispositivos: Teclado (IRQ 1), Disco (IRQ 14), Impresora (IRQ 7), Red (IRQ 11).`
    );
  }

  public reset(mode?: IOMode) {
    if (mode) this.mode = mode;
    this.tickCount = 0;
    this.devices = JSON.parse(JSON.stringify(INITIAL_DEVICES));
    this.cpu = JSON.parse(JSON.stringify(INITIAL_CPU_STATE));
    this.completedRequests = [];
    this.failedRequests = [];
    this.logs = [];
    this.currentPollingWaitCount = 0;
    this.addLog(
      'INFO',
      'KERNEL',
      'Simulador Reiniciado',
      `Registros limpios. Modo activo: ${this.mode}. Listo para procesar solicitudes.`
    );
  }

  public setMode(newMode: IOMode) {
    if (this.mode === newMode) return;
    this.mode = newMode;
    // Update control register InterruptEnable on all devices
    Object.values(this.devices).forEach((dev) => {
      dev.registers.control.interruptEnable = newMode === 'INTERRUPTS';
      this.syncRegistersHex(dev);
    });
    this.addLog(
      'INFO',
      'KERNEL',
      'Cambio de Mecanismo de E/S',
      `Modo cambiado a ${newMode === 'INTERRUPTS' ? 'INTERRUPCIONES (Asíncrono)' : 'SONDEO (Síncrono / Sondeo Activo)'}.`
    );
  }

  public addRequest(requestParams: {
    deviceType: DeviceType;
    operation: 'READ' | 'WRITE';
    payload: string;
    bytes: number;
    priority?: 'LOW' | 'NORMAL' | 'HIGH';
    processId?: string;
    processName?: string;
    willFail?: FaultType;
  }): IORequest {
    const id = `REQ-${Date.now().toString(36).slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;
    const newReq: IORequest = {
      id,
      processId: requestParams.processId || `PID-${Math.floor(Math.random() * 8000 + 1000)}`,
      processName: requestParams.processName || `Proceso-${requestParams.deviceType.toLowerCase()}`,
      deviceType: requestParams.deviceType,
      operation: requestParams.operation,
      payload: requestParams.payload,
      bytes: requestParams.bytes,
      priority: requestParams.priority || 'NORMAL',
      createdAtTick: this.tickCount,
      waitTime: 0,
      serviceTime: 0,
      status: 'QUEUED',
      willFail: requestParams.willFail || 'NONE',
    };

    const targetDev = this.devices[requestParams.deviceType];
    targetDev.queue.push(newReq);

    this.addLog(
      'INFO',
      'DEVICE',
      `Solicitud encolada en ${targetDev.displayName}`,
      `ID: ${newReq.id} | Proceso: ${newReq.processName} | Operación: ${newReq.operation} (${newReq.bytes} B) | Prioridad: ${newReq.priority}`,
      targetDev.id
    );

    return newReq;
  }

  public setFault(deviceType: DeviceType, fault: FaultType) {
    const dev = this.devices[deviceType];
    dev.activeFault = fault;
    if (fault !== 'NONE') {
      dev.faultMessage = this.getFaultDescription(deviceType, fault);
      dev.metrics.faultsCount++;
      this.addLog(
        'WARNING',
        'DEVICE',
        `Fallo inyectado en ${dev.displayName}`,
        `Condición de error activa: ${dev.faultMessage}`,
        deviceType
      );
    } else {
      dev.faultMessage = undefined;
      dev.status = dev.currentRequest ? 'BUSY' : 'IDLE';
      dev.registers.status.error = false;
      this.syncRegistersHex(dev);
      this.addLog(
        'SUCCESS',
        'DEVICE',
        `Fallo resuelto en ${dev.displayName}`,
        'El controlador vuelve al estado operativo normal.',
        deviceType
      );
    }
  }

  public setDeviceLatency(deviceType: DeviceType, latencyTicks: number) {
    const dev = this.devices[deviceType];
    dev.baseLatencyTicks = Math.max(1, Math.min(100, latencyTicks));
    this.addLog(
      'INFO',
      'DEVICE',
      `Latencia ajustada en ${dev.displayName}`,
      `Nueva latencia base de servicio: ${dev.baseLatencyTicks} ticks de reloj.`,
      deviceType
    );
  }

  /**
   * Main simulation step (1 clock tick)
   */
  public step(): void {
    this.tickCount++;
    this.cpu.totalCycles++;

    let isrHandledThisTick = false;
    let handledDevice: IODevice | null = null;

    // 1. Update queue waiting times for all queued requests
    Object.values(this.devices).forEach((dev) => {
      dev.queue.forEach((req) => {
        req.waitTime++;
        dev.metrics.totalWaitTime++;
      });
    });

    // 2. Hardware Controller Dispatch & Processing on all 4 Peripherals
    for (const dev of Object.values(this.devices)) {
      // If idle and has queued requests, dispatch next request to controller
      if (!dev.currentRequest && dev.queue.length > 0) {
        // Priority sort (HIGH > NORMAL > LOW)
        dev.queue.sort((a, b) => {
          const pOrder = { HIGH: 3, NORMAL: 2, LOW: 1 };
          return pOrder[b.priority] - pOrder[a.priority];
        });

        const nextReq = dev.queue.shift()!;
        nextReq.status = 'PROCESSING';
        nextReq.startedAtTick = this.tickCount;
        dev.currentRequest = nextReq;
        dev.totalRequiredTicks = dev.baseLatencyTicks;
        dev.currentProgressTicks = dev.baseLatencyTicks;
        dev.status = 'BUSY';

        // Update hardware registers
        dev.registers.status.ready = false;
        dev.registers.status.busy = true;
        dev.registers.status.done = false;
        dev.registers.status.error = false;
        dev.registers.control.start = true;
        dev.registers.data = `0x${nextReq.bytes.toString(16).toUpperCase()} [${nextReq.payload.slice(0, 16)}]`;
        this.syncRegistersHex(dev);

        this.addLog(
          'INFO',
          'DEVICE',
          `Dispositivo ${dev.displayName} inició procesamiento`,
          `Atendiendo ${nextReq.id} (${nextReq.operation}) | Duración estimada: ${dev.totalRequiredTicks} ticks`,
          dev.id
        );
      }

      // If actively processing a request
      if (dev.currentRequest && dev.status === 'BUSY') {
        dev.metrics.busyTicks++;
        dev.currentRequest.serviceTime++;
        dev.metrics.totalServiceTime++;
        dev.currentProgressTicks--;

        // Check if device finished its internal transfer
        if (dev.currentProgressTicks <= 0) {
          // Check for active fault injection
          const willFail = dev.activeFault !== 'NONE' || dev.currentRequest.willFail !== 'NONE';
          const activeFaultType = dev.activeFault !== 'NONE' ? dev.activeFault : dev.currentRequest.willFail!;

          if (willFail) {
            dev.status = 'ERROR';
            dev.registers.status.busy = false;
            dev.registers.status.error = true;
            dev.registers.status.done = false;
            this.syncRegistersHex(dev);

            const failMsg = this.getFaultDescription(dev.id, activeFaultType);
            dev.currentRequest.status = 'FAILED';
            dev.currentRequest.failedReason = failMsg;
            dev.currentRequest.completedAtTick = this.tickCount;
            this.failedRequests.push(dev.currentRequest);

            if (this.mode === 'INTERRUPTS') {
              // Hardware generates Exception/Fault Interrupt
              isrHandledThisTick = true;
              handledDevice = dev;
              this.cpu.activeIrq = dev.irqNumber;
              this.addLog(
                'ERROR',
                'IRQ',
                `Línea IRQ ${dev.irqNumber} (Excepción de Hardware en ${dev.displayName})`,
                `Fallo detectado: ${failMsg}. El PIC envía vector al CPU para ejecutar ISR de error de E/S.`,
                dev.id,
                dev.irqNumber
              );
            } else {
              // Polling will detect the ERROR status bit in registers
              this.addLog(
                'ERROR',
                'DEVICE',
                `Bit ERROR fijado en STATUS_REG de ${dev.displayName}`,
                `Fallo: ${failMsg}. En espera de que el bucle de sondeo del CPU lea el registro de estado.`,
                dev.id
              );
            }

            // Clear current request after reporting
            dev.currentRequest = null;
            // Clear auto fault if it was request-specific
            if (dev.activeFault === 'NONE') dev.status = 'IDLE';
          } else {
            // Normal Successful Completion
            dev.status = 'INTERRUPTING';
            dev.registers.status.busy = false;
            dev.registers.status.done = true;
            dev.registers.status.ready = true;
            this.syncRegistersHex(dev);

            if (this.mode === 'INTERRUPTS') {
              // Signal hardware interrupt IRQ
              isrHandledThisTick = true;
              handledDevice = dev;
              this.cpu.activeIrq = dev.irqNumber;

              const finishedReq = dev.currentRequest;
              finishedReq.status = 'COMPLETED';
              finishedReq.completedAtTick = this.tickCount;
              dev.metrics.totalHandled++;
              this.completedRequests.push(finishedReq);

              this.addLog(
                'IRQ',
                'PIC',
                `Disparo de Interrupción IRQ ${dev.irqNumber} (${dev.displayName})`,
                `Solicitud ${finishedReq.id} completada en periférico. PIC interrumpe la CPU para guardar contexto y ejecutar ISR.`,
                dev.id,
                dev.irqNumber
              );

              dev.currentRequest = null;
              dev.status = 'IDLE';
              dev.registers.status.done = false;
              this.syncRegistersHex(dev);
            } else {
              // Polling Mode: Device sits with DONE=true waiting for CPU probe
              this.addLog(
                'POLLING',
                'DEVICE',
                `Transferencia lista en ${dev.displayName} (DONE=1)`,
                `Datos preparados en DATA_REG (${dev.registers.data}). En espera de detección por Sondeo de CPU.`,
                dev.id
              );
            }
          }
        }
      }
    }

    // 3. CPU Clock Allocation & Mode Handling
    if (this.mode === 'INTERRUPTS') {
      if (isrHandledThisTick && handledDevice) {
        // CPU was interrupted by hardware IRQ! Executes ISR
        this.cpu.activity = 'EXECUTING_ISR';
        this.cpu.isrCycles++;
        this.cpu.contextSwitches++;
        this.cpu.currentTaskDescription = `Atendiendo ISR de IRQ ${handledDevice.irqNumber} (${handledDevice.displayName}): Copiando buffer a memoria RAM y despertando proceso.`;

        this.addLog(
          'INFO',
          'CPU',
          `CPU: Cambio de Contexto a ISR de IRQ ${handledDevice.irqNumber}`,
          `Push registros a pila -> Lectura de tabla IVT -> Despacho de rutina de interrupción de ${handledDevice.displayName} -> Despertar proceso solicitante -> IRET.`
        );
      } else {
        // CPU executes useful user computations or idles if no work
        const anyDeviceBusyOrQueued = Object.values(this.devices).some(
          (d) => d.status === 'BUSY' || d.queue.length > 0 || d.currentRequest !== null
        );

        this.cpu.activity = 'USER_COMPUTE';
        this.cpu.usefulCycles++;
        this.cpu.activeIrq = null;
        this.cpu.currentTaskDescription = anyDeviceBusyOrQueued
          ? 'Ejecutando cálculos de usuario en paralelo (mientras los periféricos transfieren autónomamente vía controlador)'
          : 'Ejecutando procesos de usuario en CPU (cálculo científico, renderizado, lógica de aplicación)';
      }
    } else {
      // ----------------- POLLING (SONDEO ACTIVO / BUSY WAITING) -----------------
      this.cpu.activeIrq = null;

      // In Polling mode, the CPU actively queries device controllers
      const devKeys: DeviceType[] = ['KEYBOARD', 'DISK', 'PRINTER', 'NETWORK'];
      const probedDevKey = devKeys[this.pollingDeviceIndex % devKeys.length];
      this.pollingDeviceIndex++;
      const probedDev = this.devices[probedDevKey];

      // Check if any device has finished (DONE = true) or has ERROR = true
      let acknowledgedDev: IODevice | null = null;
      for (const d of Object.values(this.devices)) {
        if (d.registers.status.done || (d.status === 'INTERRUPTING' && d.currentRequest)) {
          acknowledgedDev = d;
          break;
        }
      }

      if (acknowledgedDev && acknowledgedDev.currentRequest) {
        // CPU polling loop found a device with DONE bit set!
        this.cpu.activity = 'POLLING_PROBE';
        this.cpu.usefulCycles++; // Counting retrieval as useful data transfer
        const finishedReq = acknowledgedDev.currentRequest;
        finishedReq.status = 'COMPLETED';
        finishedReq.completedAtTick = this.tickCount;
        acknowledgedDev.metrics.totalHandled++;
        this.completedRequests.push(finishedReq);

        acknowledgedDev.currentRequest = null;
        acknowledgedDev.status = 'IDLE';
        acknowledgedDev.registers.status.done = false;
        acknowledgedDev.registers.status.ready = true;
        this.syncRegistersHex(acknowledgedDev);

        this.cpu.currentTaskDescription = `Sondeo exitoso: CPU detectó bit DONE en ${acknowledgedDev.displayName}. Transfiriendo datos de ${finishedReq.id} a RAM.`;
        this.addLog(
          'SUCCESS',
          'CPU',
          `Sondeo: Dispositivo ${acknowledgedDev.displayName} atendido`,
          `El bucle de sondeo detectó STATUS_REG.DONE=1. Solicitud ${finishedReq.id} finalizada exitosamente.`
        );
        this.currentPollingWaitCount = 0;
      } else {
        // No device is done yet. Is any device busy or working?
        const anyBusy = Object.values(this.devices).some(
          (d) => d.status === 'BUSY' || d.currentRequest !== null || d.queue.length > 0
        );

        if (anyBusy) {
          // CPU is trapped in BUSY-WAITING POLLING LOOP! Cycles are wasted!
          this.cpu.activity = 'POLLING_PROBE';
          this.cpu.pollingCycles++;
          this.currentPollingWaitCount++;

          this.cpu.currentTaskDescription = `Bucle de Sondeo Activo (Busy-Waiting): Verificando STATUS_REG de ${probedDev.displayName} (Valor: ${probedDev.registers.status.rawHex}). CPU ocupada al 100% sin hacer cómputo útil.`;

          if (this.currentPollingWaitCount % 5 === 0) {
            this.addLog(
              'POLLING',
              'CPU',
              `CPU en bucle de espera activa (Sondeando ${probedDev.displayName})`,
              `Ciclo desperdiciado sondeando puertos de E/S. El proceso de usuario permanece detenido esperando al periférico lento.`
            );
          }
        } else {
          // No I/O pending, CPU can run user processes
          this.cpu.activity = 'USER_COMPUTE';
          this.cpu.usefulCycles++;
          this.cpu.currentTaskDescription = 'Sin operaciones de E/S pendientes. CPU ejecutando tareas de usuario.';
          this.currentPollingWaitCount = 0;
        }
      }
    }
  }

  private syncRegistersHex(dev: IODevice) {
    let statusByte = 0;
    if (dev.registers.status.ready) statusByte |= 0x01;
    if (dev.registers.status.busy) statusByte |= 0x02;
    if (dev.registers.status.done) statusByte |= 0x04;
    if (dev.registers.status.error) statusByte |= 0x08;
    dev.registers.status.rawHex = `0x${statusByte.toString(16).padStart(2, '0').toUpperCase()}`;

    let controlByte = 0;
    if (dev.registers.control.start) controlByte |= 0x01;
    if (dev.registers.control.interruptEnable) controlByte |= 0x02;
    if (dev.registers.control.reset) controlByte |= 0x04;
    if (dev.registers.control.cancel) controlByte |= 0x08;
    dev.registers.control.rawHex = `0x${controlByte.toString(16).padStart(2, '0').toUpperCase()}`;
  }

  private getFaultDescription(devType: DeviceType, fault: FaultType): string {
    switch (fault) {
      case 'BUFFER_OVERFLOW':
        return 'Desbordamiento de búfer FIFO en Teclado (Ráfaga de teclas supera capacidad de 64 bytes).';
      case 'BAD_SECTOR':
        return 'Error de lectura CRC en Disco (Sector LBA 0x3F8 defectuoso / fallo de cabezal).';
      case 'PAPER_JAM':
        return 'Atasco de papel en rodillo mecánico de Impresora (Sensor óptico bloqueado).';
      case 'PACKET_LOSS':
        return 'Pérdida de tramas Ethernet en Tarjeta de Red (Timeout de conexión / enlace caído).';
      default:
        return 'Fallo genérico de hardware de E/S.';
    }
  }

  private addLog(
    severity: KernelLogEntry['severity'],
    category: KernelLogEntry['category'],
    title: string,
    description: string,
    device?: DeviceType,
    irq?: number
  ) {
    const entry: KernelLogEntry = {
      id: `LOG-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
      tick: this.tickCount,
      timestamp: new Date().toLocaleTimeString('es-CO', { hour12: false, fractionalSecondDigits: 2 }),
      severity,
      category,
      title,
      description,
      device,
      irq,
    };
    this.logs.unshift(entry);
    if (this.logs.length > 150) {
      this.logs.pop();
    }
  }

  /**
   * Run an automated benchmark scenario comparing Polling vs Interrupts with identical seed
   */
  public static runComparativeBenchmark(scenario: TestScenario, ticksToRun: number = 80): {
    pollingMetrics: ComparisonMetrics;
    interruptMetrics: ComparisonMetrics;
  } {
    const runForMode = (mode: IOMode): ComparisonMetrics => {
      const sim = new SimulatorEngine(mode);

      // Apply latency overrides if any
      if (scenario.latencyOverrides) {
        Object.entries(scenario.latencyOverrides).forEach(([devKey, lat]) => {
          sim.setDeviceLatency(devKey as DeviceType, lat);
        });
      }

      // Apply fault overrides
      if (scenario.faultOverrides) {
        Object.entries(scenario.faultOverrides).forEach(([devKey, fault]) => {
          sim.setFault(devKey as DeviceType, fault);
        });
      }

      // Inject requests
      scenario.requestsToInject.forEach((req) => {
        sim.addRequest({
          deviceType: req.deviceType,
          operation: req.operation,
          payload: req.payload,
          bytes: req.bytes,
          priority: req.priority,
          processName: req.processName,
          willFail: req.willFail,
        });
      });

      // Run simulation ticks
      for (let t = 0; t < ticksToRun; t++) {
        sim.step();
      }

      const totalReqs = sim.completedRequests.length + sim.failedRequests.length;
      const allDone = [...sim.completedRequests, ...sim.failedRequests];
      const avgWait = allDone.length > 0 ? allDone.reduce((acc, r) => acc + r.waitTime, 0) / allDone.length : 0;
      const avgTurnaround = allDone.length > 0 ? allDone.reduce((acc, r) => acc + (r.waitTime + r.serviceTime), 0) / allDone.length : 0;

      const deviceUtil: Record<DeviceType, number> = {
        KEYBOARD: Math.min(100, (sim.devices.KEYBOARD.metrics.busyTicks / ticksToRun) * 100),
        DISK: Math.min(100, (sim.devices.DISK.metrics.busyTicks / ticksToRun) * 100),
        PRINTER: Math.min(100, (sim.devices.PRINTER.metrics.busyTicks / ticksToRun) * 100),
        NETWORK: Math.min(100, (sim.devices.NETWORK.metrics.busyTicks / ticksToRun) * 100),
      };

      const totalActiveCpu = sim.cpu.usefulCycles + sim.cpu.pollingCycles + sim.cpu.isrCycles;
      const efficiency = totalActiveCpu > 0 ? (sim.cpu.usefulCycles / totalActiveCpu) * 100 : 0;

      return {
        mode,
        totalTicks: ticksToRun,
        usefulCpuTicks: sim.cpu.usefulCycles,
        pollingWasteTicks: sim.cpu.pollingCycles,
        isrOverheadTicks: sim.cpu.isrCycles,
        idleCpuTicks: sim.cpu.idleCycles,
        cpuEfficiencyPct: Math.round(efficiency * 10) / 10,
        totalRequestsCompleted: sim.completedRequests.length,
        totalRequestsFailed: sim.failedRequests.length,
        avgWaitTicks: Math.round(avgWait * 10) / 10,
        avgTurnaroundTicks: Math.round(avgTurnaround * 10) / 10,
        throughputPer100Ticks: Math.round(((totalReqs / ticksToRun) * 100) * 10) / 10,
        deviceUtilization: deviceUtil,
      };
    };

    return {
      pollingMetrics: runForMode('POLLING'),
      interruptMetrics: runForMode('INTERRUPTS'),
    };
  }
}

/**
 * Built-in Test Scenarios for Evaluation and Defense (Matriz de Pruebas - Rúbrica SO)
 */
export const PREDEFINED_TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'SCENARIO_NORMAL',
    name: 'Escenario 1: Carga Normal Balanceada',
    category: 'NORMAL',
    description: 'Flujo habitual de operaciones de usuario: entrada de texto por teclado, lectura de archivo de disco, descarga de paquete web y envío de reporte a impresora.',
    expectedOutcome: 'Ambos mecanismos completan las 4 solicitudes. Sin embargo, en Interrupciones la CPU dedica el 95%+ de su tiempo a cómputo útil, mientras que en Sondeo gasta ~40-60% de ciclos esperando en busy-waiting.',
    requestsToInject: [
      { deviceType: 'KEYBOARD', operation: 'READ', payload: 'Tecla [Enter] presionada', bytes: 2, priority: 'NORMAL', processName: 'Editor de Código' },
      { deviceType: 'DISK', operation: 'READ', payload: 'Sector /home/user/documento.pdf', bytes: 4096, priority: 'NORMAL', processName: 'Lector PDF' },
      { deviceType: 'NETWORK', operation: 'READ', payload: 'GET /api/metricas HTTP/1.1', bytes: 1420, priority: 'HIGH', processName: 'Navegador Web' },
      { deviceType: 'PRINTER', operation: 'WRITE', payload: 'Página 1 de informe de sistemas', bytes: 8192, priority: 'LOW', processName: 'Spooler Impresión' },
    ],
  },
  {
    id: 'SCENARIO_BURST_LIMIT',
    name: 'Escenario 2: Ráfaga Límite (Overload & Prioridades)',
    category: 'LIMITE',
    description: 'Ráfaga simultánea masiva de 8 solicitudes con diferentes prioridades. Pone a prueba la saturación de colas y la capacidad del planificador de E/S.',
    expectedOutcome: 'Se evidencia la saturación del bus. En Interrupciones, el PIC prioriza las IRQs críticas (Red IRQ 11 sobre Impresora IRQ 7) y la CPU sigue respondiendo. En Sondeo, la CPU se bloquea totalmente alternando entre periféricos lentos.',
    requestsToInject: [
      { deviceType: 'NETWORK', operation: 'READ', payload: 'Paquete VoIP streaming', bytes: 512, priority: 'HIGH', processName: 'App Teleconferencia' },
      { deviceType: 'NETWORK', operation: 'WRITE', payload: 'ACK Frame TCP', bytes: 64, priority: 'HIGH', processName: 'Stack TCP/IP' },
      { deviceType: 'DISK', operation: 'WRITE', payload: 'Commit Base de Datos SQLite', bytes: 8192, priority: 'HIGH', processName: 'Motor DBMS' },
      { deviceType: 'DISK', operation: 'READ', payload: 'Carga de DLL kernel32', bytes: 16384, priority: 'NORMAL', processName: 'Cargador Binario' },
      { deviceType: 'KEYBOARD', operation: 'READ', payload: 'Atajo Ctrl+C', bytes: 2, priority: 'HIGH', processName: 'Terminal Bash' },
      { deviceType: 'KEYBOARD', operation: 'READ', payload: 'Texto de entrada de usuario', bytes: 12, priority: 'NORMAL', processName: 'Formulario Web' },
      { deviceType: 'PRINTER', operation: 'WRITE', payload: 'Impresión de contrato 12 págs', bytes: 24576, priority: 'LOW', processName: 'Ofimática' },
      { deviceType: 'PRINTER', operation: 'WRITE', payload: 'Gráfico vectorial alta resolución', bytes: 32768, priority: 'LOW', processName: 'Diseño CAD' },
    ],
  },
  {
    id: 'SCENARIO_HIGH_LATENCY',
    name: 'Escenario 3: Retrasos Extremos (I/O Bound Systems)',
    category: 'LATENCIA',
    description: 'Dispositivos con alta latencia mecánica y de red (Impresora 40 ticks, Disco 25 ticks). Simula un entorno altamente orientado a E/S (I/O Bound).',
    expectedOutcome: 'Demuestra el caso extremo donde el Sondeo es inaceptable: la CPU desperdicia más del 80% de su capacidad en busy-waiting estéril. En Interrupciones la eficiencia de cómputo útil se mantiene superior al 90%.',
    latencyOverrides: {
      PRINTER: 38,
      DISK: 26,
      NETWORK: 16,
    },
    requestsToInject: [
      { deviceType: 'DISK', operation: 'READ', payload: 'Lectura de imagen ISO completa', bytes: 65536, priority: 'NORMAL', processName: 'Extractor ISO' },
      { deviceType: 'PRINTER', operation: 'WRITE', payload: 'Plano arquitectónico tamaño póster', bytes: 49152, priority: 'LOW', processName: 'Plotter CAD' },
      { deviceType: 'NETWORK', operation: 'READ', payload: 'Descarga con alta latencia transatlántica', bytes: 10240, priority: 'NORMAL', processName: 'Cliente FTP' },
    ],
  },
  {
    id: 'SCENARIO_FAULT_ERROR',
    name: 'Escenario 4: Inyección de Fallos de Hardware',
    category: 'ERROR',
    description: 'Se introducen fallos críticos: Atasco de papel en Impresora y Sector defectuoso en Disco. Evalúa el comportamiento de recuperación ante errores.',
    expectedOutcome: 'En Interrupciones, el controlador genera un Error IRQ de inmediato, la CPU ejecuta la rutina de manejo de fallos y notifica al proceso sin colapsar. En Sondeo sin timeout, la CPU se quedaría atrapada indefinidamente sondeando un hardware colgado.',
    faultOverrides: {
      PRINTER: 'PAPER_JAM',
      DISK: 'BAD_SECTOR',
    },
    requestsToInject: [
      { deviceType: 'PRINTER', operation: 'WRITE', payload: 'Documento confidencial atascado', bytes: 4096, priority: 'NORMAL', processName: 'Spooler', willFail: 'PAPER_JAM' },
      { deviceType: 'DISK', operation: 'READ', payload: 'Bloque dañado en sector 0x3F8', bytes: 2048, priority: 'HIGH', processName: 'Sistema de Archivos', willFail: 'BAD_SECTOR' },
      { deviceType: 'KEYBOARD', operation: 'READ', payload: 'Comando de cancelación kill -9', bytes: 8, priority: 'HIGH', processName: 'Terminal Admin' },
    ],
  },
];
