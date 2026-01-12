/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import VideoReviewCard from "./components/VideoReviewCard";
import ImageReviewCard from "./components/ImageReviewCard";
import { Info, Link } from "lucide-react";
import { listVideoUrl } from "./constant";
import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  getOuputOrder,
  postUpdateOutputOrder,
} from "./services/api/orderService";
import { FileItem } from "./services/type";
import { sendRevisionEmail } from "./services/api/emailService";
import { formatTimestamp } from "./services/api/fileReviewService";

export default function Home() {
  const [urlOutput, setUrlOutput] = useState<string>("");
  const [listOutput, setListOutput] = useState<FileItem>(listVideoUrl);
  const order_id = usePathname().split("/")[2];
  const [listChecked, setListChecked] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');

  const videoCount = listOutput.files
    ? listOutput.files.filter((file) => file.type.toLowerCase() === "video").length
    : 0;
  const imgCount = listOutput.files
    ? listOutput.files.filter((file) => file.type.toLowerCase() === "image").length
    : 0;

  const imageFiles = listOutput.files?.filter(f => f.type.toLowerCase() === 'image') || [];
  const videoFiles = listOutput.files?.filter(f => f.type.toLowerCase() === 'video') || [];

  useEffect(() => {
    fetchOutputOrder();
  }, [order_id]);

  // fetch output order detail
  const fetchOutputOrder = async () => {
    try {
      const response: FileItem = await getOuputOrder("STWOJAN01001");
      console.log(response, "response");
      setListOutput(response);
    } catch (error) {
      console.error("Failed to fetch output order:", error);
    }
  };

  const updateOutputOrder = async (updatedFiles?: FileItem['files']) => {
    try {
      const filesToUpdate = updatedFiles || listOutput.files;
      await postUpdateOutputOrder(order_id, filesToUpdate);
    } catch (error) {
      console.error("Failed to update output order:", error);
    }
  };

  // Handle Accept action
  const handleAccept = useCallback(async (fileId: string) => {
    const updatedFiles = listOutput.files.map(file => {
      if (file.id === fileId) {
        return { ...file, accepted: true };
      }
      return file;
    });

    setListOutput(prev => ({ ...prev, files: updatedFiles }));
    await updateOutputOrder(updatedFiles);
    console.log(`[Review] File ${fileId} accepted`);
  }, [listOutput.files, order_id]);

  // Handle Request Revision action
  const handleRequestRevision = useCallback(async (fileId: string, comment: string) => {
    const file = listOutput.files.find(f => f.id === fileId);
    if (!file) return;

    // Update local state
    const updatedFiles = listOutput.files.map(f => {
      if (f.id === fileId) {
        return { ...f, accepted: false, comment };
      }
      return f;
    });

    setListOutput(prev => ({ ...prev, files: updatedFiles }));

    // Update API
    await updateOutputOrder(updatedFiles);

    // Send email notification
    const emailData = {
      jobCode: listOutput.job_code || 'Unknown',
      fileName: file.name || `File ${fileId}`,
      fileUrl: file.url,
      comment: comment,
      // salesEmail: listOutput.sale_email || 'grayna012@gmail.com',
      salesEmail: 'grayna012@gmail.com',
      timestamp: formatTimestamp(),
    };

    const emailResult = await sendRevisionEmail(emailData);

    if (emailResult.success) {
      console.log(`[Review] Revision request sent for file ${fileId}`);
    } else {
      console.error(`[Review] Failed to send revision email: ${emailResult.message}`);
    }
  }, [listOutput]);

  const handleBoxChecked = (index: number, checked: boolean) => {
    if (checked) {
      setListChecked(Array.from(new Set([...listChecked, index])));
    } else {
      setListChecked(listChecked.filter((i) => i !== index));
    }
  };

  const navigateToInvoice = () => {
    window.open(listOutput.invoice_link, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-[#0088cc] mb-6">
              Ready for review
            </h1>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start gap-3 text-sm text-blue-800">
              <Info className="flex-shrink-0 mt-0.5" size={20} />
              <p>
                <span className="font-semibold">Note:</span> Please note that
                your product will be available on the website for only{" "}
                <span className="font-bold">one week</span>. After one week, You
                may contact our sales team to retrieve your files within one
                month.
              </p>
            </div>

            {/* Tabs and Action Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 bg-gray-200/50 p-1 rounded-full">
                <button
                  onClick={() => setActiveTab('image')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'image'
                    ? 'bg-[#0088cc] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-white hover:shadow-sm'
                    }`}
                >
                  Image ({imgCount})
                </button>
                <button
                  onClick={() => setActiveTab('video')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'video'
                    ? 'bg-[#0088cc] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-white hover:shadow-sm'
                    }`}
                >
                  Property Video ({videoCount})
                </button>
              </div>

              <button
                onClick={navigateToInvoice}
                className="bg-[#0088cc] text-white px-6 py-2.5 rounded hover:bg-[#0077b3] transition-colors font-medium text-sm shadow-sm"
              >
                Pay now and download
              </button>
            </div>

            {/* Content based on active tab */}
            <div className="space-y-6">
              {activeTab === 'image' && imageFiles.map((file, index) => (
                <ImageReviewCard
                  key={file.id}
                  index={index + 1}
                  total={imageFiles.length}
                  imageSrc={file.url}
                  imageName={file.name}
                  fileId={file.id}
                  isAccepted={file.accepted}
                  hasRevision={!!file.comment}
                  feedback={file.comment}
                  jobCode={listOutput.job_code}
                  salesEmail={listOutput.sale_email}
                  onAccept={handleAccept}
                  onRequestRevision={handleRequestRevision}
                />
              ))}

              {activeTab === 'video' && videoFiles.map((file, index) => (
                <VideoReviewCard
                  key={file.id}
                  index={index + 1}
                  total={videoFiles.length}
                  videoSrc={file.url}
                  videoName={file.name}
                  fileId={file.id}
                  isAccepted={file.accepted}
                  hasRevision={!!file.comment}
                  feedback={file.comment}
                  jobCode={listOutput.job_code}
                  salesEmail={listOutput.sale_email}
                  onAccept={handleAccept}
                  onRequestRevision={handleRequestRevision}
                />
              ))}

              {activeTab === 'image' && imageFiles.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No images available for review
                </div>
              )}

              {activeTab === 'video' && videoFiles.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No videos available for review
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
