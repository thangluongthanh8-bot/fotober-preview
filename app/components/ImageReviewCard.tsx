'use client';

import { useState } from 'react';
import { Check, RotateCcw, Eye, X, ZoomIn, ZoomOut, Send, Loader2 } from 'lucide-react';

interface ImageReviewCardProps {
    index: number;
    total: number;
    imageSrc: string;
    isAccepted?: boolean;
    hasRevision?: boolean;
    feedback?: string;
    jobCode?: string;
    salesEmail?: string;
    onAccept?: (index: number) => Promise<void>;
    onRequestRevision?: (index: number, comment: string) => Promise<void>;
}

export default function ImageReviewCard({
    index,
    total,
    imageSrc,
    isAccepted = false,
    hasRevision = false,
    feedback,
    onAccept,
    onRequestRevision,
}: ImageReviewCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [imageError, setImageError] = useState(false);

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

    const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
    const resetZoom = () => setZoom(1);

    const handleAccept = async () => {
        if (actionStatus !== 'idle' || isSubmitting) return;

        setIsSubmitting(true);
        try {
            if (onAccept) {
                await onAccept(index - 1);
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
                await onRequestRevision(index - 1, revisionComment.trim());
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
                {/* Left: Image Preview */}
                <div className="w-full md:w-[700px] md:h-[500px] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {imageError ? (
                        <div className="text-gray-400 text-center p-8">
                            <p>Unable to load image</p>
                        </div>
                    ) : (
                        <img
                            src={imageSrc}
                            alt={`Image ${index}`}
                            className="max-w-full max-h-full object-contain"
                            onError={() => setImageError(true)}
                        />
                    )}
                </div>

                {/* Right: Details */}
                <div className="flex-1 flex flex-col">
                    <div className="mb-4">
                        <h3 className="text-gray-600 font-medium">
                            Image {index} of {total}
                        </h3>
                    </div>

                    <div className="flex flex-wrap gap-3 mb-6">
                        <button
                            onClick={() => {
                                setIsModalOpen(true);
                                resetZoom();
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#0088cc] text-white rounded hover:bg-[#0077b3] transition-colors font-medium text-sm"
                        >
                            <Eye size={16} />
                            View Image
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
                                Accept Image
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
                        className="relative w-full max-w-7xl max-h-[90vh] flex flex-col bg-black rounded-lg overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Control Bar */}
                        <div className="flex items-center justify-between p-4 bg-black/50 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleZoomOut}
                                    className="p-2 text-white hover:bg-white/20 rounded transition-all"
                                    title="Zoom Out"
                                >
                                    <ZoomOut size={20} />
                                </button>
                                <span className="text-white text-sm min-w-[60px] text-center">
                                    {Math.round(zoom * 100)}%
                                </span>
                                <button
                                    onClick={handleZoomIn}
                                    className="p-2 text-white hover:bg-white/20 rounded transition-all"
                                    title="Zoom In"
                                >
                                    <ZoomIn size={20} />
                                </button>
                                <button
                                    onClick={resetZoom}
                                    className="px-3 py-1 text-white text-sm hover:bg-white/20 rounded transition-all ml-2"
                                >
                                    Reset
                                </button>
                            </div>

                            <div className="flex items-center gap-2">

                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 text-white rounded hover:bg-white/20 transition-all"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Image Container */}
                        <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                            <img
                                src={imageSrc}
                                alt={`Image ${index}`}
                                className="transition-transform duration-200"
                                style={{
                                    transform: `scale(${zoom})`,
                                    maxWidth: zoom <= 1 ? '100%' : 'none',
                                    maxHeight: zoom <= 1 ? '100%' : 'none',
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
