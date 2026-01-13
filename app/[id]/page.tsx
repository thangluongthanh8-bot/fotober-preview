/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import VideoReviewCard from "../components/VideoReviewCard";
import ImageReviewCard from "../components/ImageReviewCard";
import { Info } from "lucide-react";
// import { listVideoUrl } from "../constant";
import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
    getOuputOrder,
    postUpdateOutputOrder,
} from "../services/api/orderService";
import { FileItem } from "../services/type";
import { sendRevisionEmail } from "../services/api/emailService";
import { formatTimestamp } from "../services/api/fileReviewService";
import { DropboxFolderInfo, getDropboxFolderInfo, getFilesFromDropboxFolder } from "../services/api/dropboxService";
import { setLocalStorage, getLocalStorage, removeLocalStorage } from "../hooks/localstorage";
// ============================================================================
// Types
// ============================================================================

type TabType = "video" | "image";

// ============================================================================
// Component
// ============================================================================

export default function DropboxPreviewPage() {
    const [listOutput, setListOutput] = useState<FileItem>({ files: [] });
    const order_id = usePathname().slice(1)
    const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
    const imageFiles = listOutput?.files?.filter(f => f.type.toLowerCase() === 'image') || [];
    const videoFiles = listOutput?.files?.filter(f => f.type.toLowerCase() === 'video') || [];
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const localOutput = getLocalStorage("listOutput");
        // Add null check to prevent error

        if (localOutput && localOutput.job_code === order_id && localOutput.files?.length > 0) {
            console.log('[Cache] Using cached data');
            setListOutput(localOutput);
            return;
        } else {

            fetchOutputOrder();
        }
    }, [order_id]);
    // fetch output order detail
    const fetchOutputOrder = async () => {
        try {
            const response: FileItem = await getOuputOrder(order_id);
            console.log(response, "response");

            const mockupdata = {
                order_from: "ops",
                job_code: "STWOJAN01001",
                customer_code: "STWO-DRE",
                note: "",
                sale_email: "sunnyhelen0308@gmail.com",
                output_link: "https://www.dropbox.com/scl/fo/px9hb4rvvbqw8bj2sj9mv/AFamZAt_rACAr4thmfKpQiw?rlkey=2x2nm3lsrumafvpr9b76io72j&st=cn4l4ric&dl=0",
                files: [
                    {
                        url: "",
                        name: "",
                        type: "",
                        accepted: false,
                        comment: "",
                        id: ""
                    }
                ]
            }
            setListOutput(mockupdata);
            console.log(mockupdata, "mockupdata");
            if (mockupdata.files[0].url === "" || null) {
                handleLoadFiles(mockupdata.output_link);
            }
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
    }, [listOutput?.files, order_id]);

    // Handle Request Revision action
    const handleRequestRevision = useCallback(async (fileId: string, comment: string) => {
        const file = listOutput?.files.find(f => f.id === fileId);
        if (!file) return;

        // Update local state
        const updatedFiles = listOutput?.files.map(f => {
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
            salesEmail: "grayna012@gmail.com",
            timestamp: formatTimestamp(),
        };
        // const emailDataSupport = {
        //     jobCode: listOutput.job_code || 'Unknown',
        //     fileName: file.name || `File ${fileId}`,
        //     fileUrl: file.url,
        //     comment: comment,
        //     salesEmail: 'support@fotober.com',
        //     timestamp: formatTimestamp(),
        // };
        const emailResult = await sendRevisionEmail(emailData);
        // const emailResultSupport = await sendRevisionEmail(emailDataSupport);

        // if (emailResult.success && emailResultSupport.success) {
        if (emailResult.success) {
            console.log(`[Review] Revision request sent for file ${fileId}`);
        } else {
            console.error(`[Review] Failed to send revision email: ${emailResult.message} `);
        }
    }, [listOutput]);

    const handleLoadFiles = async (output_link: string) => {
        if (!output_link?.trim()) {
            return;
        }

        setLoading(true);
        setListOutput(listOutput);

        try {
            const info = await getDropboxFolderInfo(output_link);

            const files = await getFilesFromDropboxFolder(output_link);
            setListOutput(files);
            listOutput.files = files.files;
            setLocalStorage("listOutput", listOutput);
            // Update counts
            ;

        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load files";
        } finally {
            setLoading(false);
        }
    };
    const navigateToInvoice = () => {
        window.open(listOutput.invoice_link, "_blank");
        window.location.href = "https://ops.fotober.com"
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
                                    Image ({imageFiles.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('video')}
                                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'video'
                                        ? 'bg-[#0088cc] text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-white hover:shadow-sm'
                                        }`}
                                >
                                    Property Video ({videoFiles.length})
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
                                    onAccept={handleAccept}
                                    onRequestRevision={handleRequestRevision}
                                />
                            ))}

                            {activeTab === 'image' && imageFiles.length === 0 && !loading && (
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

// ============================================================================
// Sub-components
// ============================================================================

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${active ? "bg-[#0088cc] text-white shadow-sm" : "text-gray-600 hover:bg-white hover:shadow-sm"
                }`}
        >
            {label}
        </button>
    );
}
