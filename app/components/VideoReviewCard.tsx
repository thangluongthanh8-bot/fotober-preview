'use client';

import { useState } from 'react';
import VideoPlayerss from "./VideoPlayer";
import { Check, RotateCcw, Eye, X, Send, Loader2 } from "lucide-react";

interface VideoReviewCardProps {
  index: number;
  total: number;
  videoSrc: string;
  videoName?: string;
  fileId: string;
  isAccepted?: boolean;
  hasRevision?: boolean;
  feedback?: string;
  jobCode?: string;
  salesEmail?: string;
  onAccept?: (fileId: string) => Promise<void>;
  onRequestRevision?: (fileId: string, comment: string) => Promise<void>;
}

export default function VideoReviewCard({
  index,
  total,
  videoSrc,
  videoName,
  fileId,
  isAccepted = false,
  hasRevision = false,
  feedback,
  jobCode = '',
  salesEmail = '',
  onAccept,
  onRequestRevision,
}: VideoReviewCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Revision form state
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [revisionComment, setRevisionComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionStatus, setActionStatus] = useState<'idle' | 'accepted' | 'revision'>('idle');

  // Initialize status based on props
  useState(() => {
    if (isAccepted) setActionStatus('accepted');
    else if (hasRevision || feedback) setActionStatus('revision');
  });

  const handleAccept = async () => {
    if (actionStatus !== 'idle' || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (onAccept) {
        await onAccept(fileId);
      }
      setActionStatus('accepted');
      setShowRevisionInput(false);
    } catch (error) {
      console.error('Failed to accept:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevisionClick = () => {
    if (actionStatus === 'accepted') return;
    setShowRevisionInput(true);
  };

  const handleSubmitRevision = async () => {
    if (!revisionComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (onRequestRevision) {
        await onRequestRevision(fileId, revisionComment.trim());
      }
      setActionStatus('revision');
      setShowRevisionInput(false);
    } catch (error) {
      console.error('Failed to submit revision:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRevision = () => {
    setShowRevisionInput(false);
    setRevisionComment('');
  };

  // Determine button states
  const isAcceptDisabled = actionStatus === 'accepted' || actionStatus === 'revision' || isSubmitting;
  const isRevisionDisabled = actionStatus === 'accepted' || isSubmitting;

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
        {/* Left: Video Player */}
        <div className="w-full h-full md:w-[700px] md:h-[500px]">
          <VideoPlayerss src={videoSrc} />
        </div>

        {/* Right: Details */}
        <div className="flex-1 flex flex-col">
          <div className="mb-4">
            <h3 className="text-gray-600 font-medium">Video {index} of {total}</h3>
            {videoName && (
              <p className="text-sm text-gray-400 mt-1 truncate" title={videoName}>
                {videoName}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#0088cc] text-white rounded hover:bg-[#0077b3] transition-colors font-medium text-sm"
            >
              <Eye size={16} />
              View Video
            </button>

            {/* Accept Button */}
            {actionStatus === 'accepted' ? (
              <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded cursor-default font-medium text-sm">
                <Check size={16} />
                Accepted
              </button>
            ) : (
              <button
                onClick={handleAccept}
                disabled={isAcceptDisabled}
                className={`flex items-center gap-2 px-4 py-2 rounded font-medium text-sm transition-colors ${isAcceptDisabled
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#6caddf] text-white hover:bg-[#5a9bc9]'
                  }`}
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Accept Video
              </button>
            )}

            {/* Request Revision Button */}
            {actionStatus === 'revision' ? (
              <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded cursor-default font-medium text-sm">
                <RotateCcw size={16} />
                Revision Requested
              </button>
            ) : (
              <button
                onClick={handleRevisionClick}
                disabled={isRevisionDisabled}
                className={`flex items-center gap-2 px-4 py-2 rounded font-medium text-sm transition-colors ${isRevisionDisabled
                    ? 'bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-[#0088cc] text-[#0088cc] hover:bg-blue-50'
                  }`}
              >
                <RotateCcw size={16} />
                Request revision
              </button>
            )}
          </div>

          {/* Revision Input Form */}
          {showRevisionInput && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please describe what needs to be revised:
              </label>
              <textarea
                value={revisionComment}
                onChange={(e) => setRevisionComment(e.target.value)}
                placeholder="Enter your revision request..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-gray-500">{revisionComment.length}/500</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelRevision}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitRevision}
                    disabled={!revisionComment.trim() || isSubmitting}
                    className={`flex items-center gap-2 px-4 py-2 text-sm rounded font-medium transition-colors ${!revisionComment.trim() || isSubmitting
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-[#0088cc] text-white hover:bg-[#0077b3]'
                      }`}
                  >
                    {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Submit Request
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Previous Feedback Display */}
          {(feedback || actionStatus === 'revision') && (
            <div>
              <div className="relative bg-white border border-gray-200 rounded-lg p-4 shadow-sm max-w-md">
                <div className="text-sm text-gray-800">
                  <span className="font-semibold">Latest Revision request:</span> {feedback || revisionComment}
                </div>
                {/* Speech bubble arrow */}
                <div className="absolute -top-2 left-8 w-4 h-4 bg-white border-t border-l border-gray-200 transform rotate-45"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-7xl max-h-[90vh] flex flex-col justify-center bg-black rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-all border border-white/10"
            >
              <X size={24} />
            </button>
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-full h-full" style={{ maxHeight: '85vh' }}>
                <VideoPlayerss src={videoSrc} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
