import VideoPlayerss from "./VideoPlayer";
import { Check, RotateCcw, Eye, X } from "lucide-react";
import { useState } from "react";

export default function VideoReviewCard({ index, total, videoSrc, isAccepted, feedback, updateOutputOrder}:{ index:number; total:number; videoSrc:string; isAccepted?:boolean; feedback?:string , updateOutputOrder: () => Promise<void>}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
      {/* Left: Video Player */}
      <div className="w-full h-full md:w-[700px] md:h-[500px] ">
        <VideoPlayerss src={videoSrc} />
      </div>

      {/* Right: Details */}
      <div className="flex-1 flex flex-col">
        <div className="mb-4">
            <h3 className="text-gray-600 font-medium">Video {index} of {total}</h3>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0088cc] text-white rounded hover:bg-[#0077b3] transition-colors font-medium text-sm"
          >
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
          <div >
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
