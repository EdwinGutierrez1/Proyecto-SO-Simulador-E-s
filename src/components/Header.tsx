/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto 10: I/O Simulator - Simulador de Periféricos & Interrupciones
 * Katherine Peñaloza - Edwin Gutierrez | Sistemas Operativos V Semestre
 * Universidad Simón Bolívar
 */

import React from 'react';
import { Cpu, FileText, Plus, HelpCircle, Layers, Activity, GitCompare } from 'lucide-react';

interface HeaderProps {
  currentTab: 'simulator' | 'comparison' | 'experiments' | 'testmatrix' | 'report';
  onSelectTab: (tab: 'simulator' | 'comparison' | 'experiments' | 'testmatrix' | 'report') => void;
  onOpenNewRequest: () => void;
  onOpenReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewRequest,
  onOpenReport,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-20">
          {/* Zone 1: Universidad Simón Bolívar Logo & Project Title */}
          <div className="flex items-center gap-4 shrink-0">
            <a
              href="#simulator"
              onClick={(e) => {
                e.preventDefault();
                onSelectTab('simulator');
              }}
              className="flex items-center gap-3 group"
            >
              <img
                src="/assets/aistudio/image_dddfa0f9.png"
                alt="Universidad Simón Bolívar"
                className="h-10 sm:h-11 w-auto object-contain transition-transform group-hover:scale-102"
              />
              <div className="h-8 w-px bg-slate-200 hidden sm:block" />
              <div className="hidden sm:block">
                <div className="text-sm font-bold tracking-tight text-slate-900 group-hover:text-[#09843B] transition-colors">
                  I/O Simulator
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Sistemas Operativos · Proyecto #10
                </div>
              </div>
            </a>
          </div>

          {/* Zone 2: Navigation Links with USB Green Active Indicators */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onSelectTab('simulator')}
              className={`flex items-center gap-2 transition-all whitespace-nowrap shrink-0 py-2 border-b-2 font-medium ${
                currentTab === 'simulator'
                  ? 'border-[#09843B] text-[#09843B] font-bold'
                  : 'border-transparent text-slate-600 hover:text-[#09843B]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Simulador</span>
            </button>

            <button
              onClick={() => onSelectTab('comparison')}
              className={`flex items-center gap-2 transition-all whitespace-nowrap shrink-0 py-2 border-b-2 font-medium ${
                currentTab === 'comparison'
                  ? 'border-[#09843B] text-[#09843B] font-bold'
                  : 'border-transparent text-slate-600 hover:text-[#09843B]'
              }`}
            >
              <GitCompare className="w-4 h-4" />
              <span>Sondeo vs IRQ</span>
            </button>

            <button
              onClick={() => onSelectTab('experiments')}
              className={`flex items-center gap-2 transition-all whitespace-nowrap shrink-0 py-2 border-b-2 font-medium ${
                currentTab === 'experiments'
                  ? 'border-[#09843B] text-[#09843B] font-bold'
                  : 'border-transparent text-slate-600 hover:text-[#09843B]'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Reto de Fallos</span>
            </button>

            <button
              onClick={() => onSelectTab('testmatrix')}
              className={`flex items-center gap-2 transition-all whitespace-nowrap shrink-0 py-2 border-b-2 font-medium ${
                currentTab === 'testmatrix'
                  ? 'border-[#09843B] text-[#09843B] font-bold'
                  : 'border-transparent text-slate-600 hover:text-[#09843B]'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Matriz de Pruebas</span>
            </button>

            <button
              onClick={() => {
                onSelectTab('report');
                onOpenReport();
              }}
              className={`flex items-center gap-2 transition-all whitespace-nowrap shrink-0 py-2 border-b-2 font-medium ${
                currentTab === 'report'
                  ? 'border-[#09843B] text-[#09843B] font-bold'
                  : 'border-transparent text-slate-600 hover:text-[#09843B]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Informe Técnico</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action & Academic Info */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenReport}
              className="px-3.5 py-2 text-xs font-semibold text-[#09843B] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-colors whitespace-nowrap hidden md:inline-flex items-center gap-1.5 shadow-xs"
              title="Ver sustentación técnica, conceptos de SO y simplificaciones"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Sustentación</span>
            </button>

            <button
              onClick={onOpenNewRequest}
              className="px-4 py-2 text-xs font-bold text-white bg-[#09843B] hover:bg-[#076b30] rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nueva Solicitud E/S</span>
            </button>
          </div>
        </div>

        {/* Mobile nav bar */}
        <div className="flex lg:hidden overflow-x-auto gap-4 py-2 text-xs font-medium border-t border-slate-100">
          <button
            onClick={() => onSelectTab('simulator')}
            className={`whitespace-nowrap ${currentTab === 'simulator' ? 'text-[#09843B] font-bold' : 'text-slate-600'}`}
          >
            Simulador
          </button>
          <button
            onClick={() => onSelectTab('comparison')}
            className={`whitespace-nowrap ${currentTab === 'comparison' ? 'text-[#09843B] font-bold' : 'text-slate-600'}`}
          >
            Sondeo vs IRQ
          </button>
          <button
            onClick={() => onSelectTab('experiments')}
            className={`whitespace-nowrap ${currentTab === 'experiments' ? 'text-[#09843B] font-bold' : 'text-slate-600'}`}
          >
            Reto de Fallos
          </button>
          <button
            onClick={() => onSelectTab('testmatrix')}
            className={`whitespace-nowrap ${currentTab === 'testmatrix' ? 'text-[#09843B] font-bold' : 'text-slate-600'}`}
          >
            Matriz de Pruebas
          </button>
          <button
            onClick={() => {
              onSelectTab('report');
              onOpenReport();
            }}
            className={`whitespace-nowrap ${currentTab === 'report' ? 'text-[#09843B] font-bold' : 'text-slate-600'}`}
          >
            Informe Técnico
          </button>
        </div>
      </div>
    </header>
  );
};
