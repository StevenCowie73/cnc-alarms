'use client';

import { useState, useMemo } from 'react';
import alarmData from '../public/alarms.json';

type Alarm = {
  code: string;
  name: string;
  severity?: string;
  cause?: string | null;
  action?: string | null;
  operator_action?: string;
  when_to_escalate?: string;
  safety_concerns?: string;
  estimated_fix_time?: string;
  display_color?: string;
  search_keywords?: string;
};

export default function Home() {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const alarms: Alarm[] = alarmData.alarms;

  const filteredAlarms = useMemo(() => {
    return alarms.filter((alarm) => {
      const matchesSearch =
        alarm.code.toLowerCase().includes(search.toLowerCase()) ||
        alarm.name.toLowerCase().includes(search.toLowerCase()) ||
        (alarm.cause && alarm.cause.toLowerCase().includes(search.toLowerCase())) ||
        (alarm.operator_action && alarm.operator_action.toLowerCase().includes(search.toLowerCase())) ||
        (alarm.search_keywords && alarm.search_keywords.includes(search.toLowerCase()));

      const matchesSeverity =
        severityFilter === 'all' || alarm.severity === severityFilter;

      return matchesSearch && matchesSeverity;
    });
  }, [search, severityFilter, alarms]);

  const getSeverityConfig = (severity?: string) => {
    const configs = {
      green: {
        border: 'border-l-4 border-green-500',
        bg: 'bg-green-50',
        badge: 'bg-green-500',
        textColor: 'text-green-800',
        label: 'OPERATOR',
        emoji: '🟢'
      },
      yellow: {
        border: 'border-l-4 border-yellow-500',
        bg: 'bg-yellow-50',
        badge: 'bg-yellow-500',
        textColor: 'text-yellow-800',
        label: 'SUPERVISOR',
        emoji: '🟡'
      },
      red: {
        border: 'border-l-4 border-red-500',
        bg: 'bg-red-50',
        badge: 'bg-red-500',
        textColor: 'text-red-800',
        label: 'MAINTENANCE',
        emoji: '🔴'
      },
      blue: {
        border: 'border-l-4 border-blue-500',
        bg: 'bg-blue-50',
        badge: 'bg-blue-500',
        textColor: 'text-blue-800',
        label: 'INFO',
        emoji: '🔵'
      }
    };
    return configs[severity as keyof typeof configs] || configs.yellow;
  };

  const getSeverityCount = (severity: string) => {
    if (severity === 'all') return alarms.length;
    return alarms.filter(a => a.severity === severity).length;
  };

  const AlarmCard = ({ alarm }: { alarm: Alarm }) => {
    const config = getSeverityConfig(alarm.severity);
    const isExpanded = expandedCard === alarm.code;

    return (
      <div className={`${config.border} bg-white rounded-lg shadow-md mb-4 overflow-hidden transition-all duration-200 hover:shadow-lg`}>
        {/* Compact Header */}
        <div 
          className="p-5 cursor-pointer hover:bg-gray-50"
          onClick={() => setExpandedCard(isExpanded ? null : alarm.code)}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-3xl font-bold text-gray-900">
                  {alarm.code}
                </span>
                <span className={`px-3 py-1 ${config.badge} text-white text-xs font-bold rounded-full uppercase`}>
                  {config.label}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                {alarm.name}
              </h3>
            </div>
            <div className="text-2xl ml-4">
              {isExpanded ? '▲' : '▼'}
            </div>
          </div>

          {/* Quick Preview */}
          {alarm.operator_action && !isExpanded && (
            <div className={`${config.bg} rounded-md px-4 py-2 mt-3`}>
              <p className={`text-sm font-medium ${config.textColor}`}>
                ⚡ {alarm.operator_action.substring(0, 120)}{alarm.operator_action.length > 120 ? '...' : ''}
              </p>
            </div>
          )}

          {/* Fix Time */}
          {alarm.estimated_fix_time && !isExpanded && (
            <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
              <span>⏱️</span>
              <span className="font-medium">Est. fix: {alarm.estimated_fix_time}</span>
            </div>
          )}
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="px-5 pb-5 border-t border-gray-200 pt-4 space-y-4">
            {/* Cause */}
            {alarm.cause && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 uppercase mb-2">
                  ⚠️ What Caused This:
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  {alarm.cause}
                </p>
              </div>
            )}

            {/* Operator Action */}
            {alarm.operator_action && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 uppercase mb-2">
                  🔧 How To Fix:
                </h4>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {alarm.operator_action}
                </p>
              </div>
            )}

            {/* When to Escalate */}
            {alarm.when_to_escalate && (
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                <h4 className="text-sm font-bold text-yellow-900 uppercase mb-2">
                  📞 When to Escalate:
                </h4>
                <p className="text-yellow-900 text-sm leading-relaxed">
                  {alarm.when_to_escalate}
                </p>
              </div>
            )}

            {/* Safety */}
            {alarm.safety_concerns && (
              <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                <h4 className="text-sm font-bold text-red-900 uppercase mb-2">
                  🛡️ Safety Concerns:
                </h4>
                <p className="text-red-900 text-sm leading-relaxed">
                  {alarm.safety_concerns}
                </p>
              </div>
            )}

            {/* Call Button */}
            <div className="pt-4 border-t border-gray-200">
              <a 
                href="tel:+13184089163"
                className={`block w-full ${config.badge} text-white text-center py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity`}
              >
                📞 Call AI Assistant: +1 (318) 408-9163
              </a>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Mazak CNC Alarm Database
              </h1>
              <p className="text-gray-600 text-lg">
                {alarms.length} detailed alarm codes • Click any card to expand
              </p>
            </div>
            <a 
              href="tel:+13184089163"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg text-center"
            >
              <div className="text-2xl mb-1">📞</div>
              <div className="text-sm">24/7 AI Support</div>
              <div className="text-lg">+1 (318) 408-9163</div>
            </a>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search alarm code or keyword..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
            />

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSeverityFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  severityFilter === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                All ({getSeverityCount('all')})
              </button>
              <button
                onClick={() => setSeverityFilter('green')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  severityFilter === 'green' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                🟢 Operator ({getSeverityCount('green')})
              </button>
              <button
                onClick={() => setSeverityFilter('yellow')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  severityFilter === 'yellow' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                🟡 Supervisor ({getSeverityCount('yellow')})
              </button>
              <button
                onClick={() => setSeverityFilter('red')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  severityFilter === 'red' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                🔴 Maintenance ({getSeverityCount('red')})
              </button>
              <button
                onClick={() => setSeverityFilter('blue')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  severityFilter === 'blue' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                🔵 Info ({getSeverityCount('blue')})
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4 text-sm font-medium text-gray-600">
          Found {filteredAlarms.length} alarm{filteredAlarms.length !== 1 ? 's' : ''}
        </div>

        {/* Cards */}
        <div>
          {filteredAlarms.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">No alarms found</p>
            </div>
          ) : (
            filteredAlarms.map((alarm) => (
              <AlarmCard key={alarm.code} alarm={alarm} />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 space-y-2">
          <p>Independent third-party service • Not affiliated with Yamazaki Mazak Corporation</p>
          <p>For official support: Mazak Technical Center 859-342-1700</p>
        </div>
      </div>
    </div>
  );
}