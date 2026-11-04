# Proyecto 10: I/O Simulator — Simulador de Periféricos & Interrupciones

**Asignatura:** Sistemas Operativos — Nivel: V Semestre  
**Programa:** Ingeniería de Sistemas  
**Integrantes asignados:** Katherine Peñaloza – Edwin Gutierrez  

---

## 1. Descripción del Proyecto

**I/O Simulator** es una aplicación interactiva de simulación y análisis cuantitativo del subsistema de Entrada/Salida (E/S) para Sistemas Operativos. El sistema modela la interacción entre la Unidad Central de Procesamiento (CPU), los buses del sistema, el Controlador Programable de Interrupciones (PIC 8259A / APIC) y cuatro controladores de dispositivos periféricos de distinta naturaleza:

1. **Teclado (Keyboard - IRQ 1):** Dispositivo de entrada orientado a caracteres y eventos humanos con búfer FIFO.
2. **Disco Duro (Hard Disk - IRQ 14):** Almacenamiento masivo por bloques LBA con tiempos de búsqueda y latencia rotacional.
3. **Impresora (Printer - IRQ 7):** Dispositivo de salida electromecánico de alta latencia con cola spooler.
4. **Tarjeta de Red (NIC - IRQ 11):** Comunicación asíncrona de tramas y paquetes de datos full-duplex.

La aplicación permite comparar de manera empírica y rigurosa los dos mecanismos fundamentales de atención de periféricos: **Sondeo (Polling / Busy-Waiting)** e **Interrupciones de Hardware (Interrupt-Driven I/O con rutinas ISR)**.

---

## 2. Requisitos Técnicos e Instrucciones de Ejecución

### Requisitos del Sistema
- **Node.js:** Versión 18.x o superior
- **NPM:** Versión 9.x o superior
- **Navegador Web Moderno:** Chrome, Firefox, Edge o Safari con soporte para ECMAScript 2022

### Dependencias Principales
- `react` (^19.0.1) & `react-dom` (^19.0.1)
- `tailwindcss` (^4.3.3)
- `lucide-react` (^0.546.0)
- `typescript` (^7.0.2)
- `vite` (^8.3.0)

### Instrucciones de Instalación y Ejecución
1. Clonar o descargar el repositorio.
2. Instalar las dependencias del proyecto:
   ```bash
   npm install
   ```
3. Iniciar el servidor de desarrollo en el puerto 3000:
   ```bash
   npm run dev
   ```
4. Abrir en el navegador:
   ```
   http://localhost:3000
   ```
5. Para compilar la versión optimizada para producción:
   ```bash
   npm run build
   ```

---

## 3. Especificaciones Funcionales Implementadas

### A. Modelado de Controladores y Registros de Hardware
Cada uno de los 4 periféricos implementa la arquitectura clásica de controladores de E/S con registros accesibles en el bus:
- **`STATUS_REG` (Registro de Estado):**
  - Bit 0 (`0x01`): `READY` (Controlador listo para nueva orden)
  - Bit 1 (`0x02`): `BUSY` (Dispositivo transfiriendo internamente)
  - Bit 2 (`0x04`): `DONE` (Operación finalizada; datos listos)
  - Bit 3 (`0x08`): `ERROR` (Fallo de hardware / excepción detectada)
- **`CONTROL_REG` (Registro de Control):**
  - Bit 0 (`0x01`): `START` (Iniciar comando de E/S)
  - Bit 1 (`0x02`): `INTERRUPT_ENABLE` (Habilitar línea IRQ)
  - Bit 2 (`0x04`): `RESET` (Reiniciar controlador)
  - Bit 3 (`0x08`): `CANCEL` (Abortar transferencia)
- **`DATA_REG` (Búfer de Datos):** Representación del registro de intercambio de bytes o sectores.

### B. Comparación Cuantitativa: Sondeo vs Interrupciones
- **Modo Sondeo (Programmed I/O - Busy-Waiting):** La CPU ejecuta un bucle activo comprobando periódicamente el registro `STATUS_REG` de cada periférico. La CPU se mantiene al 100% de uso aparente, pero desperdicia ciclos de cómputo que impiden el avance de los procesos de usuario.
- **Modo Interrupciones (Interrupt-Driven I/O):** El proceso que solicita E/S pasa a estado Bloqueado (`Blocked`). La CPU continúa ejecutando otros procesos útiles de usuario. Cuando el hardware finaliza, el controlador activa la línea IRQ correspondiente; el PIC serializa la solicitud, interrumpe a la CPU, se realiza el cambio de contexto, se ejecuta la Rutina de Servicio de Interrupción (ISR) y se despierta al proceso.
- **Banco de Comparación A/B (Lado a Lado):** Permite ejecutar exactamente la misma carga de solicitudes en ambos esquemas para comparar:
  - % de Eficiencia de CPU (Cómputo útil vs Ciclos desperdiciados en sondeo vs Overhead ISR).
  - Tiempos de espera promedio en cola (Waiting Time).
  - Tiempo de retorno (Turnaround Time).
  - Throughput (Solicitudes atendidas por 100 ticks).

### C. Reto de Experimentación: Retrasos y Fallos de Hardware
La aplicación integra un laboratorio de inyección de contingencias según lo solicitado en el documento base:
- **Inyección de Latencias Variables:** Control de retardos de 2 a 50 ticks para modelar periféricos lentos (I/O Bound).
- **Inyección de Fallos Reales:**
  - *Atasco de Papel (Paper Jam)* en Impresora (IRQ 7).
  - *Sector Defectuoso / Error CRC (Bad Sector)* en Disco (IRQ 14).
  - *Desconexión de Enlace / Pérdida de Tramas (Packet Loss)* en Red (IRQ 11).
  - *Desbordamiento de Búfer (Buffer Overflow)* en Teclado (IRQ 1).
- **Respuesta Diferencial:** Se evidencia cómo el Sondeo queda atrapado en bucles de sondeo ciego consumiendo cientos de ciclos, mientras que en Interrupciones el controlador dispara un pulso de excepción de hardware y el kernel ejecuta la rutina de manejo de fallos sin degradar la CPU.

---

## 4. Conceptos de Sistemas Operativos y Simplificaciones del Modelo

### Conceptos del SO Representados
- **Gestión de Interrupciones de Hardware:** PIC 8259A/APIC, líneas IRQ, Tabla de Vectores de Interrupción (IVT), rutinas ISR y retorno mediante `IRET`.
- **Estructuras de Datos del Kernel:** Colas de solicitudes de E/S con políticas de prioridad (HIGH, NORMAL, LOW) y FIFO, registro de contexto y bloque de control de proceso (PCB).
- **Métricas del Subsistema de E/S:** Tiempos de espera, tiempos de servicio, utilización del dispositivo (% busy time) y desperdicio de CPU en bucles de sondeo.

### Simplificaciones del Modelo
1. **Base Temporal Discreta:** La simulación opera en unidades discretas de *ticks* lógicos de reloj, en vez de frecuencias físicas continuas de GHz.
2. **Transferencias DMA Emuladas:** Las transferencias de datos entre controladores y RAM se modelan dentro del servicio de la ISR de manera instantánea, sin recrear canales físicos DMA 8237.
3. **Entorno Sandbox Web:** El simulador se ejecuta de forma determinista y segura en el navegador sin alterar ni acceder a los periféricos físicos del equipo host.
4. **Firmware de Controladores de Alto Nivel:** Se abstraen los microcódigos internos de cada fabricante mediante máquinas de estados finitos (`IDLE`, `BUSY`, `DONE`, `ERROR`).

---

## 5. Matriz de Pruebas Controladas

La aplicación incluye cuatro escenarios de prueba predefinidos ejecutables con un solo clic:

| ID Escenario | Categoría | Carga de Entrada | Comportamiento Observado en Interrupciones | Comportamiento Observado en Sondeo | Conclusión Técnica |
|---|---|---|---|---|---|
| **Escenario 1** | Normal | 4 solicitudes balanceadas (Teclado, Disco, Impresora, Red) | Eficiencia CPU > 95%. Overhead ISR < 3%. | Eficiencia CPU ~45%. Desperdicio en espera activa ~55%. | Las interrupciones liberan la CPU para trabajo productivo. |
| **Escenario 2** | Límite | Ráfaga de 8 solicitudes con prioridades dispares | Las IRQ se priorizan correctamente (Red/Disco antes que Impresora). | La CPU se satura alternando sondeo entre dispositivos lentos. | Las colas por interrupciones gestionan prioridades con mayor equidad. |
| **Escenario 3** | Latencia | Impresora (38t) y Disco (26t) de alta latencia | Eficiencia CPU ~92%. Cero ciclos de espera activa. | Eficiencia CPU cae a < 20%. CPU 80%+ atrapada en sondeo. | En periféricos con alta latencia mecánica, el sondeo es inviable. |
| **Escenario 4** | Fallos | Atasco en Impresora + Sector malo en Disco | El controlador genera IRQ de error; la ISR aborta y notifica de inmediato. | La CPU pierde ciclos esperando que el hardware responda hasta el timeout. | Las interrupciones proporcionan alta resiliencia y aislamiento de fallos. |

---

## 6. Integrantes y Sustentación Técnica

- **Katherine Peñaloza** — Diseño del subsistema de interrupciones, simulación de controladores de E/S, gestión de registros de hardware y matriz de pruebas.
- **Edwin Gutierrez** — Motor de sondeo activo (polling loop), banco de comparativa A/B, cálculo de métricas de CPU/dispositivos y reto de fallos.

El informe técnico completo y la guía de preguntas de sustentación oral están integrados en la aplicación a través de la pestaña **Informe Técnico**.
