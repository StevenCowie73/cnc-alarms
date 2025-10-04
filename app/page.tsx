'use client';

import { useState, useMemo } from 'react';
import alarmData from '../alarms.json';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  const filteredAlarms = useMemo(() => {
    return alarmData.alarms.filter(alarm => {
      const matchesSearch = 
        alarm.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alarm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alarm.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSeverity = 
        severityFilter === 'all' || alarm.severity === severityFilter;
      
      return matchesSearch && matchesSeverity;
    });
  }, [searchTerm, severityFilter]);

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'green': return 'bg-green-100 border-green-500 text-green-800';
      case 'yellow': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'red': return 'bg-red-100 border-red-500 text-red-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch(severity) {
      case 'green': return 'bg-green-500 text-white';
      case 'yellow': return 'bg-yellow-500 text-white';
      case 'red': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Mazak Matrix Alarm Database</h1>
          <p className="text-blue-100">24/7 CNC Alarm Support</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by alarm code, name, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* Severity Filter */}
            <div className="md:w-48">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg text-gray-900"
              >
                <option value="all">All Severity</option>
                <option value="green">🟢 Green (Operator)</option>
                <option value="yellow">🟡 Yellow (Lead/Tech)</option>
                <option value="red">🔴 Red (Critical)</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-gray-600">
            Found <span className="font-semibold">{filteredAlarms.length}</span> alarms
          </div>
        </div>

        {/* Alarm Cards */}
        <div className="space-y-4">
          {filteredAlarms.map((alarm) => (
            <div
              key={alarm.code}
              className={`border-l-4 rounded-lg shadow-md p-6 ${getSeverityColor(alarm.severity)} hover:shadow-lg transition-shadow cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {alarm.code}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getSeverityBadge(alarm.severity)}`}>
                      {alarm.severity}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {alarm.name}
                  </h3>
                  <p className="text-sm text-gray-600">{alarm.category}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Cause:</p>
                  <p className="text-gray-800">{alarm.cause}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">What to Do:</p>
                  <p className="text-gray-800 whitespace-pre-line">{alarm.operator_action}</p>
                </div>

                {alarm.when_to_escalate && (
                  <div className="bg-orange-50 border border-orange-200 rounded p-3 mt-3">
                    <p className="text-sm font-semibold text-orange-800 mb-1">⚠️ When to Escalate:</p>
                    <p className="text-orange-900">{alarm.when_to_escalate}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-4">
                  <span>⏱️ Est. Fix: {alarm.estimated_fix_time}</span>
                  {alarm.related_alarms && alarm.related_alarms.length > 0 && (
                    <span>🔗 Related: {alarm.related_alarms.join(', ')}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAlarms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No alarms found matching your search.</p>
            <p className="text-gray-400 mt-2">Try a different search term or filter.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white p-6 mt-12">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-300">
            Need immediate help? Call our 24/7 AI support: <span className="font-bold text-blue-400">1-855-CNC-HELP</span>
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Independent third-party service • Not affiliated with Yamazaki Mazak Corporation
          </p>
        </div>
      </div>
    </div>
  );
}