import React, { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { api } from '@/api/client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import {
  CheckSquare,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HelpCircle,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { ReviewItem } from '@/types';

export const ReviewPage: React.FC = () => {
  const { activeProject } = useProjectStore();

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadReviews = async () => {
    if (!activeProject) return;
    setIsLoading(true);
    try {
      const data = await api.listReviews(activeProject.id);
      setReviews(data);
    } catch (err) {
      console.error(err);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [activeProject]);

  const handleUpdateStatus = async (reviewId: string, status: 'approved' | 'needs_review') => {
    if (!activeProject) return;
    setUpdatingId(reviewId);
    try {
      await api.updateReviewStatus(activeProject.id, reviewId, status);
      // Update local state
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, review_status: status } : r))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.review_status === filterStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="emerald" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>Approved</Badge>;
      case 'needs_review':
        return <Badge variant="amber" size="sm" icon={<AlertTriangle className="w-3 h-3" />}>Needs Review</Badge>;
      case 'pending':
      default:
        return <Badge variant="slate" size="sm" icon={<Clock className="w-3 h-3" />}>Pending</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-blue-400" />
            Architectural QA Review Queue
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Audit, verify, and validate AI-generated answers against official specifications before team distribution.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadReviews}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          Refresh Queue
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {['all', 'pending', 'needs_review', 'approved'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`text-xs px-3.5 py-1.5 rounded-xl capitalize font-medium transition-colors ${
              filterStatus === status
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            {status.replace('_', ' ')} (
            {status === 'all'
              ? reviews.length
              : reviews.filter((r) => r.review_status === status).length}
            )
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading QA review queue...</p>
        </div>
      ) : filteredReviews.length > 0 ? (
        <div className="space-y-4">
          {filteredReviews.map((item) => (
            <Card key={item.id} variant="default" className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-mono text-blue-300">ID: {item.id}</span>
                  {item.created_at && (
                    <>
                      <span>&bull;</span>
                      <span>{new Date(item.created_at).toLocaleString()}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(item.review_status)}
                </div>
              </div>

              {/* Question & Answer */}
              <div className="space-y-3">
                <div className="text-sm font-semibold text-white flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <span>{item.question}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {item.answer}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateStatus(item.id, 'needs_review')}
                  disabled={updatingId === item.id || item.review_status === 'needs_review'}
                  leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                >
                  Flag for Review
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleUpdateStatus(item.id, 'approved')}
                  disabled={updatingId === item.id || item.review_status === 'approved'}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
                >
                  Approve Answer
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CheckSquare}
          title="Review Queue is Empty"
          description={`No questions currently marked as '${filterStatus.replace('_', ' ')}'.`}
        />
      )}
    </div>
  );
};
