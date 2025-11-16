'use client';

import { useState, useMemo } from 'react';
import alarmsData from '../public/alarms.json';

// Simple UI copy dictionary for EN / ES
const UI_COPY: Record<
  'en' | 'es',
  {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filterAll: string;
    filterCritical: string;
    filterWarning: string;
    filterInfo: string;
    statsTotal: string;
    statsCritical: string;
    statsWarning: string;
    statsInfo: string;
    showingPrefix: string;
    showingOf: string;
    noResultsTitle: string;
    noResultsText: string;
    causeTitle: string;
    causeSubtitle: string;
    actionTitle: string;
    actionSubtitle: string;
    techTitle: string;
    techSubtitle: string;
    errorTypeLabel: string;
    machineStopLabel: string;
    clearLegendLabel: string;
    displayColorLabel: string;
    displayExplainer: string;
  }
> = {
  en: {
    title: 'Alarm Intelligence Hub',
    subtitle: 'Powered by cowie.ai • Quick troubleshooting for production alarms',
    searchPlaceholder: '🔍 Search by alarm code or description...',
    filterAll: 'All Alarms',
    filterCritical: '🔴 Critical',
    filterWarning: '🟡 Warning',
    filterInfo: '🟢 Info',
    statsTotal: 'Total',
    statsCritical: 'Critical',
    statsWarning: 'Warning',
    statsInfo: 'Info',
    showingPrefix: 'Showing',
    showingOf: 'of',
    noResultsTitle: 'No alarms found',
    noResultsText: 'Try adjusting your search or filters',
    causeTitle: "Cause (What's happening?)",
    causeSubtitle: '',
    actionTitle: 'What to do (Operator steps)',
    actionSubtitle: '',
    techTitle: 'Technical Details (for lead / maintenance)',
    techSubtitle: '',
    errorTypeLabel: 'Error Type',
    machineStopLabel: 'Machine Stop Status',
    clearLegendLabel: 'How to Clear Alarm (Legend)',
    displayColorLabel: 'Display Color on Control',
    displayExplainer:
      'Red = serious / machine-stopping alarm. Blue = caution or operator action needed.',
  },
  es: {
    title: 'Centro de Inteligencia de Alarmas',
    subtitle:
      'Impulsado por cowie.ai • Solución rápida de problemas para alarmas de producción',
    searchPlaceholder: '🔍 Buscar por código de alarma o descripción...',
    filterAll: 'Todas las alarmas',
    filterCritical: '🔴 Crítica',
    filterWarning: '🟡 Advertencia',
    filterInfo: '🟢 Información',
    statsTotal: 'Total',
    statsCritical: 'Críticas',
    statsWarning: 'Advertencias',
    statsInfo: 'Información',
    showingPrefix: 'Mostrando',
    showingOf: 'de',
    noResultsTitle: 'No se encontraron alarmas',
    noResultsText: 'Prueba ajustando tu búsqueda o filtros',
    causeTitle: 'Causa (¿Qué está pasando?)',
    causeSubtitle: '',
    actionTitle: 'Qué hacer (Pasos del operador)',
    actionSubtitle: '',
    techTitle: 'Detalles técnicos (para líder / mantenimiento)',
    techSubtitle: '',
    errorTypeLabel: 'Tipo de error',
    machineStopLabel: 'Estado de parada de la máquina',
    clearLegendLabel: 'Cómo borrar la alarma (Leyenda)',
    displayColorLabel: 'Color en la pantalla del control',
    displayExplainer:
      'Rojo = alarma grave que detiene la máquina. Azul = precaución o acción del operador necesaria.',
  },
};

// Legend decoders
const decodeErrorType = (code: string): string => {
  const types: { [key: string]: string } = {
    A: 'Operation – Wrong key pressed or incorrect operation',
    B: 'Registered Data – Program or tool data error',
    C: 'Servo – Servo control mechanism malfunction',
    D: 'Spindle – Spindle control mechanism malfunction',
    E: 'NC Equipment – System hardware/software error',
    F: 'Machine (PLC) – Machine failure',
    G: 'External I/O – External I/O unit malfunction',
  };
  return types[code] || '';
};

const decodeStoppedStatus = (code: string): string => {
  const statuses: { [key: string]: string } = {
    H: 'Emergency stop – machine is fully stopped',
    I: 'Reset stop – waiting for reset',
    J: 'Single-block stop – stopped at a block',
    K: 'Feed hold – feed stopped, machine ready',
    L: 'Operation continued – machine still running',
  };
  return statuses[code] || '';
};

const decodeClearingProcedure = (code: string): string => {
  const procedures: { [key: string]: string } = {
    M: '1) Power OFF  2) Fix the cause  3) Power ON',
    N: '1) Fix the cause  2) Power OFF  3) Power ON',
    O: '1) Fix the cause  2) Press RESET',
    P: 'Press RESET to clear',
    Q: '1) Fix the cause  2) Tap alarm clear button',
    S: 'Tap alarm clear button',
  };
  return procedures[code] || '';
};

export default function Home() {
  const [search, setSearch] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>(
    'all'
  );
  const [expandedAlarm, setExpandedAlarm] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'es'>('en');

  const copy = UI_COPY[language];

  // Convert alarm data to our display format
  const alarms = useMemo(() => {
    return (alarmsData as any[])
      .filter((alarm: any) => alarm['No.'] && String(alarm['No.']).trim() !== '')
      .map((alarm: any) => {
        let severity: 'info' | 'warning' | 'critical' = 'info';

        if (alarm.Display === 'Red' || alarm['Stopped status'] === 'H') {
          severity = 'critical';
        } else if (alarm.Display === 'Blue' && ['I', 'J', 'K'].includes(alarm['Stopped status'])) {
          severity = 'warning';
        }

        return {
          code: String(alarm['No.'] || ''),
          name: alarm.Message || '',
          severity,
          cause: alarm.Cause ?? null,
          action: alarm.Action ?? null,
          display: alarm.Display || '',
          stoppedStatus: alarm['Stopped status'] || '',
          stoppedStatusDecoded: decodeStoppedStatus(alarm['Stopped status'] || ''),
          clearingProcedure: alarm['Clearing procedure'] || '',
          clearingProcedureDecoded: decodeClearingProcedure(alarm['Clearing procedure'] || ''),
          typeOfError: alarm['Type of error'] || '',
          typeOfErrorDecoded: decodeErrorType(alarm['Type of error'] || ''),
        };
      })
      .sort((a, b) => Number(a.code) - Number(b.code));
  }, []);

  // SAFE search + severity filter
  const filteredAlarms = useMemo(() => {
    const searchLower = (search || '').toLowerCase();

    return alarms.filter((alarm) => {
      const code = String(alarm.code ?? '');
      const name = String(alarm.name ?? '');
      const cause = alarm.cause != null ? String(alarm.cause) : '';
      const action = alarm.action != null ? String(alarm.action) : '';

      const matchesSearch =
        !searchLower ||
        code.toLowerCase().includes(searchLower) ||
        name.toLowerCase().includes(searchLower) ||
        cause.toLowerCase().includes(searchLower) ||
        action.toLowerCase().includes(searchLower);

      const matchesSeverity =
        severityFilter === 'all' || alarm.severity === severityFilter;

      return matchesSearch && matchesSeverity;
    });
  }, [search, severityFilter, alarms]);

  const getSeverityBadge = (severity: string, lang: 'en' | 'es') => {
    switch (severity) {
      case 'critical':
        return {
          color: 'bg-red-500',
          text: lang === 'es' ? '🔴 CRÍTICA' : '🔴 CRITICAL',
          border: 'border-red-500',
        };
      case 'warning':
        return {
          color: 'bg-yellow-500',
          text: lang === 'es' ? '🟡 ADVERTENCIA' : '🟡 WARNING',
          border: 'border-yellow-500',
        };
      case 'info':
        return {
          color: 'bg-green-500',
          text: lang === 'es' ? '🟢 INFORMACIÓN' : '🟢 INFO',
          border: 'border-green-500',
        };
      default:
        return {
          color: 'bg-gray-500',
          text: lang === 'es' ? '⚪ DESCONOCIDO' : '⚪ UNKNOWN',
          border: 'border-gray-500',
        };
    }
  };

  const speakAlarm = (alarm: any) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const text = `Alarm ${alarm.code}. ${alarm.name}. ${
      alarm.cause ? 'Cause: ' + alarm.cause + '. ' : ''
    }${alarm.action ? 'Action: ' + alarm.action : 'Contact maintenance.'}`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.lang = language === 'es' ? 'es-MX' : 'en-US';

    window.speechSynthesis.speak(utterance);
  };

  const alarmStats = {
    total: alarms.length,
    critical: alarms.filter((a) => a.severity === 'critical').length,
    warning: alarms.filter((a) => a.severity === 'warning').length,
    info: alarms.filter((a) => a.severity === 'info').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header / Stats */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 md:p-8 mb-6 shadow-2xl border border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {copy.title}
                </h1>
                <div className="flex gap-2 bg-gray-700/50 rounded-lg p-1">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-4 py-2 rounded font-semibold transition ${
                      language === 'en'
                        ? 'bg-white text-gray-900'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setLanguage('es')}
                    className={`px-4 py-2 rounded font-semibold transition ${
                      language === 'es'
                        ? 'bg-white text-gray-900'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    ES
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-300">{copy.subtitle}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">{alarmStats.total}</div>
                <div className="text-xs text-gray-300">{copy.statsTotal}</div>
              </div>
              <div className="bg-red-900/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{alarmStats.critical}</div>
                <div className="text-xs text-gray-300">{copy.statsCritical}</div>
              </div>
              <div className="bg-yellow-900/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-400">{alarmStats.warning}</div>
                <div className="text-xs text-gray-300">{copy.statsWarning}</div>
              </div>
              <div className="bg-green-900/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{alarmStats.info}</div>
                <div className="text-xs text-gray-300">{copy.statsInfo}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-xl">
          <div className="mb-4">
            <input
              type="text"
              placeholder={copy.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value ?? '')}
              className="w-full px-6 py-4 text-lg text-gray-900 placeholder-gray-500 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSeverityFilter('all')}
              className={`px-5 py-2.5 rounded-full font-semibold transition ${
                severityFilter === 'all'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {copy.filterAll}
            </button>
            <button
              onClick={() => setSeverityFilter('critical')}
              className={`px-5 py-2.5 rounded-full font-semibold transition ${
                severityFilter === 'critical'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {copy.filterCritical}
            </button>
            <button
              onClick={() => setSeverityFilter('warning')}
              className={`px-5 py-2.5 rounded-full font-semibold transition ${
                severityFilter === 'warning'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              {copy.filterWarning}
            </button>
            <button
              onClick={() => setSeverityFilter('info')}
              className={`px-5 py-2.5 rounded-full font-semibold transition ${
                severityFilter === 'info'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {copy.filterInfo}
            </button>
          </div>
        </div>

        {/* Count */}
        <div className="text-white mb-4 text-sm">
          {copy.showingPrefix} {filteredAlarms.length} {copy.showingOf} {alarms.length} alarms
        </div>

        {/* Alarm list */}
        <div className="space-y-4">
          {filteredAlarms.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-xl">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {copy.noResultsTitle}
              </h3>
              <p className="text-gray-500">{copy.noResultsText}</p>
            </div>
          ) : (
            filteredAlarms.map((alarm) => {
              const badge = getSeverityBadge(alarm.severity, language);
              const isExpanded = expandedAlarm === alarm.code;

              return (
                <div
                  key={alarm.code}
                  className={`bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 border-l-8 ${badge.border}`}
                >
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => setExpandedAlarm(isExpanded ? null : alarm.code)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-4xl font-black text-gray-800">{alarm.code}</div>
                          <span
                            className={`${badge.color} text-white text-xs font-bold px-3 py-1.5 rounded-full`}
                          >
                            {badge.text}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{alarm.name}</h3>
                        <p className="text-gray-600 line-clamp-2">
                          {alarm.cause || 'No cause information available'}
                        </p>
                      </div>
                      <div className="text-3xl text-gray-400">{isExpanded ? '▼' : '▶'}</div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-200 bg-gray-50">
                      <div className="pt-6 space-y-4">
                        {alarm.cause && (
                          <div>
                            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                              <span className="text-xl">🔍</span> {copy.causeTitle}
                            </h4>
                            <p className="text-gray-700 leading-relaxed">{alarm.cause}</p>
                          </div>
                        )}

                        {alarm.action && (
                          <div>
                            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                              <span className="text-xl">🔧</span> {copy.actionTitle}
                            </h4>
                            <p className="text-gray-700 leading-relaxed">{alarm.action}</p>
                          </div>
                        )}

                        {/* TECHNICAL DETAILS – more readable layout */}
                        <div className="bg-gray-100 rounded-xl p-4 md:p-5 space-y-4">
                          <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                            <span className="text-lg">📘</span>
                            {copy.techTitle}
                          </h4>

                          {/* Error Type */}
                          {(alarm.typeOfErrorDecoded || alarm.typeOfError) && (
                            <div className="flex gap-3">
                              <div className="text-xl mt-0.5">⚙️</div>
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                  {copy.errorTypeLabel}
                                </div>
                                <div className="text-sm text-gray-800">
                                  {alarm.typeOfErrorDecoded || 'Not specified in manual'}
                                </div>
                                {alarm.typeOfError && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Code:{' '}
                                    <span className="font-mono">{alarm.typeOfError}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Stopped Status */}
                          {(alarm.stoppedStatusDecoded || alarm.stoppedStatus) && (
                            <div className="flex gap-3 pt-2 border-t border-gray-200">
                              <div className="text-xl mt-0.5">⏹️</div>
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                  {copy.machineStopLabel}
                                </div>
                                <div className="text-sm text-gray-800">
                                  {alarm.stoppedStatusDecoded ||
                                    'Machine stop status not specified'}
                                </div>
                                {alarm.stoppedStatus && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Code:{' '}
                                    <span className="font-mono">{alarm.stoppedStatus}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Clearing Procedure */}
                          {(alarm.clearingProcedureDecoded || alarm.clearingProcedure) && (
                            <div className="flex gap-3 pt-2 border-t border-gray-200">
                              <div className="text-xl mt-0.5">✅</div>
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                  {copy.clearLegendLabel}
                                </div>
                                <div className="text-sm text-gray-800 whitespace-pre-line">
                                  {alarm.clearingProcedureDecoded ||
                                    'Follow standard recovery procedure for this alarm.'}
                                </div>
                                {alarm.clearingProcedure && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Code:{' '}
                                    <span className="font-mono">
                                      {alarm.clearingProcedure}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Display Color */}
                          {alarm.display && (
                            <div className="flex gap-3 pt-2 border-t border-gray-200">
                              <div className="text-xl mt-0.5">🎨</div>
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                  {copy.displayColorLabel}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-800">
                                  <span
                                    className={`inline-block w-3 h-3 rounded-full ${
                                      alarm.display === 'Red'
                                        ? 'bg-red-500'
                                        : alarm.display === 'Blue'
                                        ? 'bg-blue-500'
                                        : 'bg-gray-400'
                                    }`}
                                  />
                                  <span>{alarm.display}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {copy.displayExplainer}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              speakAlarm(alarm);
                            }}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition flex items-center justify-center gap-2 text-lg shadow-lg"
                          >
                            🔊 {language === 'es' ? 'Leer solución' : 'Speak Solution'}
                          </button>

                          {/* CHANGED BUTTON: now shows "coming soon" popup */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(
                                language === 'es'
                                  ? 'La función de seguimiento de mantenimiento estará disponible próximamente.'
                                  : 'Maintenance tracking feature coming soon.'
                              );
                            }}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-4 px-6 rounded-xl transition flex items-center justify-center gap-2 text-lg"
                          >
                            ✓ {language === 'es' ? 'Marcar resuelta' : 'Mark Solved'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-400 text-sm">
          <p>© 2025 Alarm Intelligence Hub • Powered by cowie.ai</p>
          <p className="mt-1">
            Independent third-party service • Not affiliated with any manufacturer
          </p>
        </div>
      </div>
    </div>
  );
}
