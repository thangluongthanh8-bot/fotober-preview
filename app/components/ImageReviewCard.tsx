'use client';

import { useState } from 'react';
import { Check, RotateCcw, Eye, X, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface ImageReviewCardProps {
    index: number;
    total: number;
    imageSrc: string;
    imageName?: string;
    isAccepted?: boolean;
    feedback?: string;
    updateOutputOrder?: () => Promise<void>;
}

export default function ImageReviewCard({
    index,
    total,
    imageSrc,
    imageName,
    isAccepted,
    feedback,
    updateOutputOrder,
}: ImageReviewCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [imageError, setImageError] = useState(false);

    const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
    const resetZoom = () => setZoom(1);

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
                {/* Left: Image Preview */}
                <div className="w-full md:w-[700px] md:h-[500px] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {imageError ? (
                        <div className="text-gray-400 text-center p-8">
                            <p>Unable to load image</p>
                            <p className="text-sm mt-2">{imageName}</p>
                        </div>
                    ) : (
                        <img
                            src={imageSrc}
                            alt={imageName || `Image ${index}`}
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
                        {imageName && (
                            <p className="text-sm text-gray-400 mt-1 truncate" title={imageName}>
                                {imageName}
                            </p>
                        )}
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

                        {isAccepted ? (
                            <button className="flex items-center gap-2 px-4 py-2 bg-[#6caddf] text-white rounded cursor-default font-medium text-sm">
                                <Check size={16} />
                                Accepted
                            </button>
                        ) : (
                            <button className="flex items-center gap-2 px-4 py-2 bg-[#6caddf] text-white rounded hover:bg-[#5a9bc9] transition-colors font-medium text-sm">
                                <Check size={16} />
                                Accept Image
                            </button>
                        )}

                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#0088cc] text-[#0088cc] rounded hover:bg-blue-50 transition-colors font-medium text-sm">
                            <RotateCcw size={16} />
                            Request revision
                        </button>
                    </div>

                    {feedback && (
                        <div>
                            <div className="relative bg-white border border-gray-200 rounded-lg p-4 shadow-sm max-w-md">
                                <div className="text-sm text-gray-800">
                                    <span className="font-semibold">Latest Revision request:</span> {feedback}
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
                                <a
                                    href={imageSrc}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-white hover:bg-white/20 rounded transition-all"
                                    title="Download"
                                >
                                    <Download size={20} />
                                </a>
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
                                alt={imageName || `Image ${index}`}
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
