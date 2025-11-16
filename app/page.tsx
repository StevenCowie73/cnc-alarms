'use client';

import { useState, useMemo } from 'react';
import alarmData from '../public/alarms.json';

type Alarm = {
  code: string;
  name: string;
  severity?: string;
  cause?: string | null;
  action?: string | null;
  display_color?: string;
  search_keywords?: string;
};

export default function Home() {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [expandedAlarm, setExpandedAlarm] = useState<string | null>(null);

  const alarms: Alarm[] = alarmData;

  const filteredAlarms = useMemo(() => {
    return alarms.filter((alarm) => {
      const matchesSearch =
        alarm.code.toLowerCase().includes(search.toLowerCase()) ||
        alarm.name.toLowerCase().includes(search.toLowerCase()) ||
        (alarm.cause && alarm.cause.toLowerCase().includes(search.toLowerCase())) ||
        (alarm.search_keywords && alarm.search_keywords.includes(search.toLowerCase()));

      const matchesSeverity =
        severityFilter === 'all' || alarm.severity === severityFilter;

      return matchesSearch && matchesSeverity;
    });
  }, [search, severityFilter, alarms]);

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'red':
        return { bg: 'bg-red-50', text: 'text-red-700', label: '🔴 CRITICAL', border: 'border-red-500' };
      case 'yellow':
        return { bg: 'bg-yellow-50', text: 'text-yellow-700', label: '🟡 WARNING', border: 'border-yellow-500' };
      case 'green':
        return { bg: 'bg-green-50', text: 'text-green-700', label: '🟢 INFO', border: 'border-green-500' };
      case 'blue':
        return { bg: 'bg-blue-50', text: 'text-blue-700', label: '🔵 INFO', border: 'border-blue-500' };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-700', label: 'INFO', border: 'border-gray-500' };
    }
  };

  const getSeverityCount = (severity: string) => {
    if (severity === 'all') return alarms.length;
    return alarms.filter(a => a.severity === severity).length;
  };

  const speakAlarm = (alarm: Alarm) => {
    const text = `Alarm ${alarm.code}: ${alarm.name}. ${alarm.cause ? 'Cause: ' + alarm.cause + '. ' : ''}Action: ${alarm.action || 'See manual'}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="bg-black/90 text-white rounded-2xl shadow-2xl p-6 md:p-8 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                🔧 CNC Alarm Database
              </h1>
              <p className="text-sm text-gray-300">
                Professional Alarm Reference Tool
              </p>
            </div>
            <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm font-semibold transition">
              EN | ES
            </button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{alarms.length}</div>
              <div className="text-xs text-gray-300 mt-1">Total Alarms</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-red-400">{getSeverityCount('red')}</div>
              <div className="text-xs text-gray-300 mt-1">Critical</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400">{getSeverityCount('yellow')}</div>
              <div className="text-xs text-gray-300 mt-1">Warning</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{getSeverityCount('blue') + getSeverityCount('green')}</div>
              <div className="text-xs text-gray-300 mt-1">Info</div>
            </div>
          </div>
        </div>

        {/* Search Container */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search alarms by number, message, or keyword..."
            className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none transition"
          />
          
          {/* Filter Chips */}
          <div className="flex gap-2 flex-wrap mt-4">
            <button
              onClick={() => setSeverityFilter('all')}
              className={`px-5 py-2 rounded-full font-semibold text-sm transition ${
                severityFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Alarms
            </button>
            <button
              onClick={() => setSeverityFilter('red')}
              className={`px-5 py-2 rounded-full font-semibold text-sm transition ${
                severityFilter === 'red'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔴 Critical
            </button>
            <button
              onClick={() => setSeverityFilter('yellow')}
              className={`px-5 py-2 rounded-full font-semibold text-sm transition ${
                severityFilter === 'yellow'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🟡 Warning
            </button>
            <button
              onClick={() => setSeverityFilter('blue')}
              className={`px-5 py-2 rounded-full font-semibold text-sm transition ${
                severityFilter === 'blue'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🟢 Info
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {filteredAlarms.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <h3 className="text-2xl font-semibold text-gray-600 mb-2">No Alarms Found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredAlarms.map((alarm) => {
              const badge = getSeverityBadge(alarm.severity);
              const isExpanded = expandedAlarm === alarm.code;
              
              return (
                <div
                  key={alarm.code}
                  onClick={() => setExpandedAlarm(isExpanded ? null : alarm.code)}
                  className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer overflow-hidden border-l-4 ${badge.border}`}
                >
                  <div className="p-6">
                    {/* Alarm Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-4xl md:text-5xl font-bold text-gray-900">
                        {alarm.code}
                      </div>
                      <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </div>
                    
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-3">
                      {alarm.name}
                    </h3>
                    
                    <div className="flex gap-4 flex-wrap text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        🔧 {alarm.severity?.toUpperCase() || 'INFO'}
                      </span>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-6 pt-6 border-t space-y-4">
                        {alarm.cause && (
                          <div>
                            <div className="text-xs font-bold uppercase text-gray-500 mb-2">
                              🔍 Cause
                            </div>
                            <div className="text-sm leading-relaxed text-gray-700">
                              {alarm.cause}
                            </div>
                          </div>
                        )}
                        
                        {alarm.action && (
                          <div>
                            <div className="text-xs font-bold uppercase text-gray-500 mb-2">
                              🔧 What To Do
                            </div>
                            <div className="text-sm leading-relaxed text-gray-700">
                              {alarm.action}
                            </div>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              speakAlarm(alarm);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
                          >
                            🔊 Speak Solution
                          </button>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
                          >
                            ✓ Mark Solved
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-white text-sm opacity-80">
          <p>© 2024 CNC Alarm Reference Tool</p>
          <p className="mt-1">Professional troubleshooting database</p>
        </div>
      </div>
    </div>
  );
}