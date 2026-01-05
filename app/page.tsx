"use client";

import React from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import VideoReviewCard from "./components/VideoReviewCard";
import { Info } from "lucide-react";

export default function Home() {
  const videos = [
    {
      id: 1,
      src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      feedback: "feeback",
      isAccepted: false,
    },
    {
      id: 2,
      src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      feedback: null,
      isAccepted: true,
    },
    {
      id: 3,
      src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      feedback: null,
      isAccepted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* <Sidebar /> */}
        
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-[#0088cc] mb-6">Ready for review</h1>
            
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start gap-3 text-sm text-blue-800">
              <Info className="flex-shrink-0 mt-0.5" size={20} />
              <p>
                <span className="font-semibold">Note:</span> Please note that your product will be available on the website for only <span className="font-bold">one week</span>. After one week, You may contact our sales team to retrieve your files within one month.
              </p>
            </div>

            {/* Tabs and Action Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 bg-gray-200/50 p-1 rounded-full">
                <button className="px-6 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-white hover:shadow-sm transition-all">
                  Image (0)
                </button>
                <button className="px-6 py-2 rounded-full text-sm font-medium bg-[#0088cc] text-white shadow-sm">
                  Property Video (3)
                </button>
              </div>
              
              <button className="bg-[#0088cc] text-white px-6 py-2.5 rounded hover:bg-[#0077b3] transition-colors font-medium text-sm shadow-sm">
                Pay now and download
              </button>
            </div>

            {/* Video List */}
            <div className="space-y-6">
              {videos.map((video, index) => (
                <VideoReviewCard
                  key={video.id}
                  index={index + 1}
                  total={videos.length}
                  videoSrc={video.src}
                  isAccepted={video.isAccepted}
                  feedback={video.feedback || undefined}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
