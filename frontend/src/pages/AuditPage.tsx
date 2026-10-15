import React, { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { api } from '@/api/client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';
import {
  ShieldCheck,
  Search,
  RotateCcw,
  User,
  Code,
  Loader2,
} from 'lucide-react';
import { AuditLogEntry } from '@/types';

export const AuditPage: React.FC = () => {
  const { activeProject } = useProjectStore();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const loadLogs = async () => {
    if (!activeProject) return;
    setIsLoading(true);
    try {
      const data = await api.listAuditLogs(activeProject.id);
      setLogs(data);
    } catch (err) {
      console.error(err);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [activeProject]);

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.event_type.toLowerCase().includes(term) ||
      log.username.toLowerCase().includes(term) ||
      (log.document_name && log.document_name.toLowerCase().includes(term))
    );
  });

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'login':
        return <Badge variant="blue" size="sm">Login</Badge>;
      case 'document_upload':
        return <Badge variant="emerald" size="sm">Upload</Badge>;
      case 'query':
        return <Badge variant="purple" size="sm">Query</Badge>;
      case 'review_status_update':
        return <Badge variant="amber" size="sm">Review Update</Badge>;
      default:
        return <Badge variant="slate" size="sm">{eventType}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
            Security &amp; Operations Audit Trail
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Immutable log of all user activities, document ingestion events, and query verifications.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadLogs}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          Refresh Logs
        </Button>
      </div>

      {/* Search Bar */}
      <Card variant="glass" className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by event type, username, or document..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Audit Events ({filteredLogs.length})
          </span>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
        </div>

        {filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Document / Target</th>
                  <th className="py-3 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">{getEventBadge(log.event_type)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-200 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{log.username}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {log.document_name || log.document_id || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-400 hover:text-blue-300 text-xs font-mono p-1 rounded hover:bg-slate-800"
                        title="View details"
                      >
                        <Code className="w-3.5 h-3.5 inline mr-1" />
                        JSON
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !isLoading && (
            <EmptyState
              icon={ShieldCheck}
              title="No Audit Logs Found"
              description="No audit logs matched your search filter."
            />
          )
        )}
      </Card>

      {/* JSON Payload Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Audit Event Details (#${selectedLog?.id})`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-slate-400">Timestamp:</div>
            <div className="text-slate-200 font-mono">{selectedLog?.timestamp}</div>
            <div className="text-slate-400">Event Type:</div>
            <div>{selectedLog && getEventBadge(selectedLog.event_type)}</div>
            <div className="text-slate-400">Operator:</div>
            <div className="text-slate-200 font-semibold">{selectedLog?.username}</div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2">Payload Data:</div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto max-h-60">
              {JSON.stringify(selectedLog?.details || selectedLog, null, 2)}
            </pre>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
