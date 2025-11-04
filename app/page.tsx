'use client';

import { useState, useMemo } from 'react';
import { AlertCircle, Wrench, Phone, UserCheck, ChevronDown, ChevronUp, Clock, Shield } from 'lucide-react';
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
        border: 'border-green-500',
        bg: 'bg-green-50',
        badge: 'bg-green-500',
        icon: UserCheck,
        iconColor: 'text-green-600',
        label: 'OPERATOR',
        description: 'You can fix this'
      },
      yellow: {
        border: 'border-yellow-500',
        bg: 'bg-yellow-50',
        badge: 'bg-yellow-500',
        icon: Wrench,
        iconColor: 'text-yellow-600',
        label: 'SUPERVISOR',
        description: 'Get your supervisor'
      },
      red: {
        border: 'border-red-500',
        bg: 'bg-red-50',
        badge: 'bg-red-500',
        icon: AlertCircle,
        iconColor: 'text-red-600',
        label: 'MAINTENANCE',
        description: 'Call maintenance now'
      },
      blue: {
        border: 'border-blue-500',
        bg: 'bg-blue-50',
        badge: 'bg-blue-500',
        icon: AlertCircle,
        iconColor: 'text-blue-600',
        label: 'INFORMATION',
        description: 'Review and continue'
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
    const Icon = config.icon;
    const isExpanded = expandedCard === alarm.code;

    return (
      <div className={`border-l-4 ${config.border} bg-white rounded-lg shadow-md mb-4 overflow-hidden transition-all duration-200 hover:shadow-lg`}>
        {/* Compact Header - Always Visible */}
        <div 
          className="p-5 cursor-pointer active:bg-gray-50"
          onClick={() => setExpandedCard(isExpanded ? null : alarm.code)}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1">
              <div className={`p-2 rounded-full ${config.bg}`}>
                <Icon className={`w-6 h-6 ${config.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-3xl font-bold text-gray-900">
                    {alarm.code}
                  </span>
                  <span className={`px-3 py-1 ${config.badge} text-white text-xs font-bold rounded-full uppercase`}>
                    {config.label}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mt-1">
                  {alarm.name}
                </h3>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
            )}
          </div>

          {/* Quick Action Banner */}
          {alarm.operator_action && (
            <div className={`${config.bg} border ${config.border} rounded-md px-4 py-2`}>
              <p className={`text-sm font-medium ${config.iconColor}`}>
                ⚡ {alarm.operator_action.substring(0, 150)}{alarm.operator_action.length > 150 ? '...' : ''}
              </p>
            </div>
          )}

          {/* Fix Time Badge */}
          {alarm.estimated_fix_time && (
            <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Est. fix time: {alarm.estimated_fix_time}</span>
            </div>
          )}
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
            {/* Cause */}
            {alarm.cause && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <span>⚠️</span> What Caused This:
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  {alarm.cause}
                </p>
              </div>
            )}

            {/* Full Operator Action */}
            {alarm.operator_action && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <span>🔧</span> How To Fix:
                </h4>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {alarm.operator_action}
                </p>
              </div>
            )}

            {/* When to Escalate */}
            {alarm.when_to_escalate && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h4 className="text-sm font-bold text-yellow-800 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <span>📞</span> When to Escalate:
                </h4>
                <p className="text-yellow-900 text-sm leading-relaxed">
                  {alarm.when_to_escalate}
                </p>
              </div>
            )}

            {/* Safety Concerns */}
            {alarm.safety_concerns && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h4 className="text-sm font-bold text-red-800 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Safety Concerns:
                </h4>
                <p className="text-red-900 text-sm leading-relaxed">
                  {alarm.safety_concerns}
                </p>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-4 border-t border-gray-200">
              <a 
                href="tel:+13184089163"
                className={`w-full ${config.badge} text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}
              >
                <Phone className="w-4 h-4" />
                Call AI Assistant: +1 (318) 408-9163
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
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Mazak CNC Alarm Database
              </h1>
              <p className="text-gray-600 text-lg">
                {alarms.length} detailed alarm codes with expert troubleshooting
              </p>
            </div>
            <a 
              href="tel:+13184089163"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg flex items-center gap-3 w-full md:w-auto justify-center"
            >
              <Phone className="w-5 h-5" />
              <div className="text-left">
                <div className="text-sm">24/7 AI Support</div>
                <div className="text-lg">+1 (318) 408-9163</div>
              </div>
            </a>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by code, name, or keyword
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Enter alarm code (e.g. 101) or keyword..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-gray-900 placeholder-gray-400"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSeverityFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  severityFilter === 'all'
                    ? 'bg-gray-700 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({getSeverityCount('all')})
              </button>
              <button
                onClick={() => setSeverityFilter('green')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  severityFilter === 'green'
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🟢 Operator ({getSeverityCount('green')})
              </button>
              <button
                onClick={() => setSeverityFilter('yellow')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  severityFilter === 'yellow'
                    ? 'bg-yellow-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🟡 Supervisor ({getSeverityCount('yellow')})
              </button>
              <button
                onClick={() => setSeverityFilter('red')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  severityFilter === 'red'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🔴 Maintenance ({getSeverityCount('red')})
              </button>
              <button
                onClick={() => setSeverityFilter('blue')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  severityFilter === 'blue'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🔵 Info ({getSeverityCount('blue')})
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm font-medium text-gray-600">
          Found {filteredAlarms.length} alarm{filteredAlarms.length !== 1 ? 's' : ''}
        </div>

        {/* Alarm Cards */}
        <div>
          {filteredAlarms.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500 text-lg">No alarms found matching your search</p>
              <p className="text-gray-400 text-sm mt-2">Try a different search term or filter</p>
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
