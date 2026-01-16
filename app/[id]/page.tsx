"use client";

import VideoReviewCard from "../components/VideoReviewCard";
import ImageReviewCard from "../components/ImageReviewCard";
import { Download, Info } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { getOuputOrder, postUpdateOutputOrder } from "../services/api/orderService";
import { FileItem } from "../services/type";
import { sendRevisionEmail } from "../services/api/emailService";
import { formatTimestamp } from "../services/api/fileReviewService";
import { getFilesFromDropboxFolder } from "../services/api/dropboxService";
import { setLocalStorage, getLocalStorage } from "../hooks/localstorage";
import { useDevToolsBlocker } from "../hooks/useDevToolsBlocker";
import { usePageVisibility } from "../hooks/usePageVisibility";

export default function DropboxPreviewPage() {
    const order_id = usePathname().slice(1);
    const [listOutput, setListOutput] = useState<FileItem>({ files: [] });
    const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
    const [loading, setLoading] = useState(false);

    const imageFiles = listOutput?.files?.filter(f => f.type.toLowerCase() === 'image') || [];
    const videoFiles = listOutput?.files?.filter(f => f.type.toLowerCase() === 'video') || [];

    // DevTools blocker
    const { isDevToolOpen } = useDevToolsBlocker();

    // Page visibility - chỉ enable khi đang ở tab video
    usePageVisibility(activeTab === 'video');

    useEffect(() => {
        const localOutput = getLocalStorage("listOutput");
        if (localOutput?.job_code === order_id && localOutput.files?.length > 0) {
            setListOutput(localOutput);
        } else {
            fetchOutputOrder();
        }
    }, [order_id]);

    // fetch output order
    const fetchOutputOrder = async () => {
        try {
            const response: FileItem = await getOuputOrder(order_id);
            if (response.files[0].url === "" || response.files[0].url === null) {
                if (response.output_link) {
                    await handleLoadFiles(response.output_link);
                }
            } else {
                setListOutput(response);
                setLocalStorage("listOutput", response);
            }
        }
        catch (error) {
            console.error("Failed to fetch output order:", error);
        }
    };

    // handle load files from dropbox folder
    const handleLoadFiles = async (output_link: string) => {
        if (!output_link?.trim()) return;

        setLoading(true);
        try {
            const files = await getFilesFromDropboxFolder(output_link);
            setListOutput(prev => ({ ...prev, files: files.files }));
            setLocalStorage("listOutput", { ...listOutput, files: files.files });
        } catch (err) {
            console.error("Failed to load files:", err);
        } finally {
            setLoading(false);
        }
    };

    // update output order
    const updateOutputOrder = async (updatedFiles: FileItem['files']) => {
        try {
            const response = await postUpdateOutputOrder(order_id, updatedFiles);
            return response;
        } catch (error) {
            console.error("Failed to update output order:", error);
            throw error;
        }
    };

    // handle accept file
    const handleAccept = useCallback(async (fileIndex: number) => {
        const updatedFiles = listOutput.files.map((file, index) =>
            index === fileIndex ? { ...file, accepted: true } : file
        );
        setListOutput(prev => ({ ...prev, files: updatedFiles }));
        // Save to localStorage
        setLocalStorage("listOutput", { ...listOutput, files: updatedFiles });
        await updateOutputOrder(updatedFiles);
    }, [listOutput, order_id]);

    const handleRequestRevision = useCallback(async (fileIndex: number, comment: string) => {
        const file = listOutput.files[fileIndex];
        if (!file) return;

        const updatedFiles = listOutput.files.map((f, index) =>
            index === fileIndex ? { ...f, accepted: false, comment } : f
        );
        setListOutput(prev => ({ ...prev, files: updatedFiles }));

        await updateOutputOrder(updatedFiles);
        setLocalStorage("listOutput", { ...listOutput, files: updatedFiles });

        // Send email notification (parallel for speed)
        const emailData = {
            jobCode: listOutput.job_code || 'Unknown',
            fileName: file.name || `File ${fileIndex}`,
            fileUrl: file.url,
            comment,
            timestamp: formatTimestamp(),
        };

        // const [emailToSale, emailToSupport] = await Promise.all([
        //     sendRevisionEmail({ ...emailData, salesEmail: listOutput.sale_email || "support@fotober.com" }),
        //     sendRevisionEmail({ ...emailData, supportEmail: "support@fotober.com" }),
        // ]);

        // if (!emailToSale.success) console.error(`Failed to send email to sale: ${emailToSale.message}`);
        // if (!emailToSupport.success) console.error(`Failed to send email to support: ${emailToSupport.message}`);
        const [emailToSale] = await Promise.all([
            sendRevisionEmail({ ...emailData, salesEmail: "grayna012@gmail.com" }),

        ]);

        if (!emailToSale.success) console.error(`Failed to send email to sale: ${emailToSale.message}`);
    }, [listOutput]);

    const navigateToInvoice = () => {

        if (!listOutput.invoice_link || listOutput.invoice_link === null) {
            alert("Invoice link not available ,please contact Sales");
            window.location.href = "https://ops.fotober.com";

        } else {
            window.open(listOutput.invoice_link, "_blank");
        }
    };

    // Download all files as ZIP from Dropbox
    const downloadAllFiles = () => {
        if (!listOutput.output_link) {
            alert('No download link available');
            return;
        }
        // Convert to download link by adding dl=1 - Dropbox will auto-zip the folder
        const downloadLink = listOutput.output_link.replace('dl=0', 'dl=1');
        window.location.href = downloadLink;
    };
    // Block access if DevTools is open
    // if (isDevToolOpen) {
    //     return (
    //         <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
    //             <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md text-center border-2 border-red-500">
    //                 <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
    //                     <span className="text-4xl">🚫</span>
    //                 </div>
    //                 <h1 className="text-2xl font-bold text-red-600 mb-3">Access Blocked</h1>
    //                 <p className="text-gray-600 mb-4">
    //                     Developer Tools has been detected. For security reasons, access to this content is blocked.
    //                 </p>
    //                 <p className="text-sm text-gray-500">
    //                     Please close DevTools and refresh the page to continue.
    //                 </p>
    //                 <button
    //                     onClick={() => window.location.reload()}
    //                     className="mt-6 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
    //                 >
    //                     Refresh Page
    //                 </button>
    //             </div>
    //         </div>
    //     );
    // }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans relative">
            {/* Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-[#0088cc] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-700 font-medium">Good things take time. Your files are on the way!</p>
                    </div>
                </div>
            )}

            {/* Page Visibility Warning Overlay */}
            {/* {showWarning && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 shadow-2xl max-w-md text-center">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">⚠️</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-3">Stay on this page</h2>
                        <p className="text-gray-600 mb-4">
                            Please do not leave this tab while reviewing videos.
                            Leaving may cause you to lose your progress.
                        </p>
                        {remainingWarnings > 0 && (
                            <p className="text-sm text-orange-600 mb-4">
                                Warning: {remainingWarnings} attempts remaining before page refreshes.
                            </p>
                        )}
                        <button
                            onClick={dismissWarning}
                            className="px-6 py-2.5 bg-[#0088cc] text-white rounded-lg hover:bg-[#0077b3] transition-colors font-medium"
                        >
                            I understand, continue
                        </button>
                    </div>
                </div>
            )} */}

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
                                <TabButton
                                    active={activeTab === 'image'}
                                    onClick={() => setActiveTab('image')}
                                    label={`Image (${imageFiles.length})`}
                                />
                                <TabButton
                                    active={activeTab === 'video'}
                                    onClick={() => setActiveTab('video')}
                                    label={`Property Video (${videoFiles.length})`}
                                />
                            </div>
                            <div className="flex gap-4">

                                <button
                                    onClick={navigateToInvoice}
                                    className="bg-[#0088cc] text-white px-6 py-2.5 rounded hover:bg-[#0077b3] transition-colors font-medium text-sm shadow-sm"
                                >
                                    Pay now and download
                                </button>
                                {listOutput.output_link && (
                                    <button
                                        onClick={downloadAllFiles}
                                        className="bg-[#0088cc] text-white px-6 py-2.5 rounded hover:bg-[#0077b3] transition-colors font-medium text-sm shadow-sm flex items-center"
                                    >
                                        Download All
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content based on active tab */}
                        <div className="space-y-6">
                            {activeTab === 'image' && imageFiles.map((file, index) => (
                                <ImageReviewCard
                                    key={index}
                                    index={index + 1}
                                    total={imageFiles.length}
                                    imageSrc={file.url}
                                    isAccepted={file.accepted}
                                    hasRevision={!!file.comment}
                                    feedback={file.comment}
                                    onAccept={handleAccept}
                                    onRequestRevision={handleRequestRevision}
                                />
                            ))}

                            {activeTab === 'video' && videoFiles.map((file, index) => (
                                <VideoReviewCard
                                    key={index}
                                    index={index + 1}
                                    total={videoFiles.length}
                                    videoSrc={file.url}
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

                            {activeTab === 'video' && videoFiles.length === 0 && !loading && (
                                <div className="text-center py-12 text-gray-500">
                                    No videos available for review
                                </div>
                            )}

                            {loading && (
                                <div className="text-center py-12 text-gray-500">
                                    Loading files...
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

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
