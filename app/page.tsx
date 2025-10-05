'use client';

import { useState, useMemo } from 'react';
import alarmData from './full-alarms.json';

type Alarm = {
  code: string;
  name: string;
  severity?: string;
  cause?: string;
  operator_action?: string;
  machine_types?: string[];
  category?: string;
  symptoms?: string;
  when_to_escalate?: string;
  safety_concerns?: string;
  estimated_fix_time?: string;
  tools_required?: string[];
  related_alarms?: string[];
  common_mistakes?: string;
  prevention?: string;
};

export default function Home() {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  const alarms: Alarm[] = alarmData.alarms || [];

  const filteredAlarms = useMemo(() => {
    return alarms.filter((alarm) => {
      const matchesSearch =
        alarm.code.toLowerCase().includes(search.toLowerCase()) ||
        alarm.name.toLowerCase().includes(search.toLowerCase()) ||
        (alarm.cause && alarm.cause.toLowerCase().includes(search.toLowerCase()));

      const matchesSeverity =
        severityFilter === 'all' || alarm.severity === severityFilter;

      return matchesSearch && matchesSeverity;
    });
  }, [search, severityFilter, alarms]);

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'green':
        return 'bg-green-100 border-green-500 text-green-800';
      case 'yellow':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'red':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'blue':
        return 'bg-blue-100 border-blue-500 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Mazak CNC Alarm Database
              </h1>
              <p className="text-gray-600">
                Search {alarms.length} alarm codes for instant troubleshooting
              </p>
            </div>
            <a 
              href="tel:+13184089163"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
            >
              <span className="text-2xl">📞</span>
              <div className="text-left">
                <div className="text-sm">24/7 Support</div>
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
                Search by code or keyword
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Enter alarm code (e.g. 101) or keyword..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSeverityFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  severityFilter === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                All ({alarms.length})
              </button>
              <button
                onClick={() => setSeverityFilter('green')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  severityFilter === 'green'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                🟢 Green
              </button>
              <button
                onClick={() => setSeverityFilter('yellow')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  severityFilter === 'yellow'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                🟡 Yellow
              </button>
              <button
                onClick={() => setSeverityFilter('red')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  severityFilter === 'red'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                🔴 Red
              </button>
              <button
                onClick={() => setSeverityFilter('blue')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  severityFilter === 'blue'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                🔵 Blue
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Found {filteredAlarms.length} alarm{filteredAlarms.length !== 1 ? 's' : ''}
        </div>

        {/* Results */}
        <div className="space-y-4">
          {filteredAlarms.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-500">No alarms found matching your search</p>
            </div>
          ) : (
            filteredAlarms.map((alarm) => (
              <div
                key={alarm.code}
                className={`border-l-4 rounded-lg shadow-sm p-6 ${getSeverityColor(
                  alarm.severity
                )}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-2xl font-bold">Code {alarm.code}</h3>
                    <h4 className="text-lg font-semibold mt-1">{alarm.name}</h4>
                  </div>
                  {alarm.severity && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        alarm.severity === 'red'
                          ? 'bg-red-500 text-white'
                          : alarm.severity === 'yellow'
                          ? 'bg-yellow-500 text-white'
                          : alarm.severity === 'green'
                          ? 'bg-green-500 text-white'
                          : alarm.severity === 'blue'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-500 text-white'
                      }`}
                    >
                      {alarm.severity}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {alarm.cause && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Cause:</p>
                      <p className="text-sm">{alarm.cause}</p>
                    </div>
                  )}
                  {alarm.operator_action && (
                    <div>
                      <p className="text-sm font-semibold mb-1">What to do:</p>
                      <p className="text-sm">{alarm.operator_action}</p>
                    </div>
                  )}
                  {alarm.when_to_escalate && (
                    <div>
                      <p className="text-sm font-semibold mb-1">When to escalate:</p>
                      <p className="text-sm">{alarm.when_to_escalate}</p>
                    </div>
                  )}
                  {alarm.safety_concerns && (
                    <div>
                      <p className="text-sm font-semibold mb-1 text-red-600">⚠️ Safety:</p>
                      <p className="text-sm">{alarm.safety_concerns}</p>
                    </div>
                  )}
                  {alarm.estimated_fix_time && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Estimated fix time:</p>
                      <p className="text-sm">{alarm.estimated_fix_time}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Independent third-party service • Not affiliated with Yamazaki Mazak Corporation</p>
        </div>
      </div>
    </div>
  );
}