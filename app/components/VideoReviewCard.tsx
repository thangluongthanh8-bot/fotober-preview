import React from "react";
import VideoPlayer from "./VideoPlayer";
import { Check, RotateCcw, Eye } from "lucide-react";

interface VideoReviewCardProps {
  index: number;
  total: number;
  videoSrc: string;
  isAccepted?: boolean;
  feedback?: string;
}

export default function VideoReviewCard({ index, total, videoSrc, isAccepted, feedback }: VideoReviewCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
      {/* Left: Video Player */}
      <div className="w-full md:w-[300px] flex-shrink-0">
        <VideoPlayer src={videoSrc} />
      </div>

      {/* Right: Details */}
      <div className="flex-1 flex flex-col">
        <div className="mb-4">
            <h3 className="text-gray-600 font-medium">Video {index} of {total}</h3>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#0088cc] text-white rounded hover:bg-[#0077b3] transition-colors font-medium text-sm">
            <Eye size={16} />
            View Video
          </button>
          
          {isAccepted ? (
             <button className="flex items-center gap-2 px-4 py-2 bg-[#6caddf] text-white rounded cursor-default font-medium text-sm">
                <Check size={16} />
                Accepted Video
             </button>
          ) : (
            <button className="flex items-center gap-2 px-4 py-2 bg-[#6caddf] text-white rounded hover:bg-[#5a9bc9] transition-colors font-medium text-sm">
                <Check size={16} />
                Accept Video
            </button>
          )}

          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#0088cc] text-[#0088cc] rounded hover:bg-blue-50 transition-colors font-medium text-sm">
            <RotateCcw size={16} />
            Request revision
          </button>
        </div>

        {feedback && (
          <div className="mt-auto">
            <div className="relative bg-white border border-gray-200 rounded-lg p-4 shadow-sm max-w-md">
                <div className="text-sm text-gray-800">
                    <span className="font-semibold">Latest Revision request:</span> {feedback}
                </div>
                {/* Speech bubble arrow */}
                <div className="absolute -top-2 left-8 w-4 h-4 bg-white border-t border-l border-gray-200 transform rotate-45"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
