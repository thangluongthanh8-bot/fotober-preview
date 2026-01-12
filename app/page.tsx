/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import VideoReviewCard from "./components/VideoReviewCard";
import { Info, Link } from "lucide-react";
import { listVideoUrl } from "./constant";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getOuputOrder,
  postUpdateOutputOrder,
} from "./services/api/orderService";
import { FileItem } from "./services/type";

export default function Home() {
  const [urlOutput, setUrlOutput] = useState<string>("");
  const [listOutput, setListOutput] = useState<FileItem>(listVideoUrl);
  const order_id = usePathname().split("/")[2];
  const [listChecked, setListChecked] = useState<number[]>([]);
  const videoCount = listOutput.files
    ? listOutput.files.filter((file) => file.type.toLowerCase() === "video")
      .length
    : 0;
  const imgCount = listOutput.files
    ? listOutput.files.filter((file) => file.type.toLowerCase() === "image")
      .length
    : 0;

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

  const updateOutputOrder = async () => {
    try {
      await postUpdateOutputOrder(order_id, listOutput.files);
    } catch (error) {
      console.error("Failed to fetch output order:", error);
    }
  };

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
      {/* <Header /> */}

      <div className="flex flex-1 overflow-hidden">
        {/* <Sidebar /> */}

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
                <button className="px-6 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-white hover:shadow-sm transition-all">
                  Image ({imgCount})
                </button>
                <button className="px-6 py-2 rounded-full text-sm font-medium bg-[#0088cc] text-white shadow-sm">
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

            {/* Video List */}
            <div className="space-y-6">
              {listOutput.files.map((video, index) => (
                <>
                  {/* <input type="checkbox" onChange={(e) => handleBoxChecked(index + 1, e.target.checked)}></input> */}
                  <VideoReviewCard
                    updateOutputOrder={updateOutputOrder}
                    key={index}
                    index={index + 1}
                    total={listOutput.files.length}
                    videoSrc={video.url}
                    isAccepted={video.accepted}
                    feedback={video.comment || undefined}
                  />
                </>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
