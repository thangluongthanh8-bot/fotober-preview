"use client";

import { useState, useEffect } from "react";
import { Loader2, FolderOpen, RefreshCw, CheckCircle, Mail, AlertTriangle, Copy } from "lucide-react";

import VideoReviewCard from "../components/VideoReviewCard";
import ImageReviewCard from "../components/ImageReviewCard";
import { FileItem } from "../services/type";
import {
    getFilesFromDropboxFolder,
    getDropboxFolderInfo,
    getApiAccountEmail,
    unmountAllDropboxFolders,
    DropboxFolderInfo,
} from "../services/api/dropboxService";

// ============================================================================
// Types
// ============================================================================

type TabType = "video" | "image";

// ============================================================================
// Component
// ============================================================================

export default function DropboxPreviewPage() {
    // State
    const [apiEmail, setApiEmail] = useState<string>("");
    const [emailError, setEmailError] = useState<string>("");
    const [sharedUrl, setSharedUrl] = useState("");
    const [listOutput, setListOutput] = useState<FileItem | null>(null);
    const [folderInfo, setFolderInfo] = useState<DropboxFolderInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>("image");
    const [copied, setCopied] = useState(false);

    // Load API account email on mount
    useEffect(() => {
        getApiAccountEmail()
            .then(email => {
                setApiEmail(email);
                console.log("📧 API Account Email:", email);
            })
            .catch(err => {
                console.error("Failed to get API email:", err);
                setEmailError("Không thể lấy email API. Kiểm tra DROPBOX_ACCESS_TOKEN.");
            });
    }, []);

    // Computed values
    const videoCount = listOutput?.files.filter((f) => f.type === "Video").length || 0;
    const imageCount = listOutput?.files.filter((f) => f.type === "Image").length || 0;

    const filteredFiles = listOutput?.files.filter((file) => {
        return activeTab === "video" ? file.type === "Video" : file.type === "Image";
    }) || [];

    // Check if URLs are direct links (not blob)
    const hasDirectLinks = listOutput?.files.some(f =>
        f.url.includes('dl.dropboxusercontent.com') || f.url.includes('dropbox.com/s/')
    );

    // Handlers
    const handleCopyEmail = async () => {
        await navigator.clipboard.writeText(apiEmail);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const [unmounting, setUnmounting] = useState(false);
    const [unmountResult, setUnmountResult] = useState<string>("");

    const handleUnmountAll = async () => {
        setUnmounting(true);
        setUnmountResult("");
        try {
            const count = await unmountAllDropboxFolders();
            setUnmountResult(`Unmounted ${count} folders successfully!`);
            setTimeout(() => setUnmountResult(""), 5000);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to unmount";
            setUnmountResult(`Error: ${message}`);
        } finally {
            setUnmounting(false);
        }
    };

    const handleLoadFiles = async () => {
        if (!sharedUrl.trim()) {
            setError("Please enter a Dropbox shared folder URL");
            return;
        }

        setLoading(true);
        setError(null);
        setListOutput(null);

        try {
            setLoadingStep("Getting folder info...");
            const info = await getDropboxFolderInfo(sharedUrl);
            setFolderInfo(info);

            setLoadingStep("Mounting folder & creating direct links...");
            const files = await getFilesFromDropboxFolder(sharedUrl);
            setListOutput(files);

            // Update counts
            setFolderInfo({
                ...info,
                fileCount: files.files.length,
                videoCount: files.files.filter(f => f.type === "Video").length,
                imageCount: files.files.filter(f => f.type === "Image").length,
            });

        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load files";
            setError(message);
        } finally {
            setLoading(false);
            setLoadingStep("");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
            <main className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <h1 className="text-2xl font-bold text-[#0088cc] mb-6 flex items-center gap-3">
                        <FolderOpen size={28} />
                        Dropbox Direct Links Generator
                    </h1>

                    {/* API Account Info */}
                    {apiEmail ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <Mail className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                                <div className="flex-1">
                                    <p className="font-semibold text-yellow-800">Quan trọng: Invite email này vào folder trước khi load!</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <code className="bg-yellow-100 px-3 py-1 rounded text-yellow-900 font-mono">
                                            {apiEmail}
                                        </code>
                                        <button
                                            onClick={handleCopyEmail}
                                            className="flex items-center gap-1 px-3 py-1 bg-yellow-200 hover:bg-yellow-300 rounded text-yellow-800 text-sm transition-colors"
                                        >
                                            <Copy size={14} />
                                            {copied ? "Copied!" : "Copy"}
                                        </button>
                                    </div>
                                    <p className="text-sm text-yellow-700 mt-2">
                                        👉 Mở Dropbox folder → Share → Nhập email ở trên → Chọn "Can edit" → Send
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : emailError ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="font-semibold text-red-800">{emailError}</p>
                                    <p className="text-sm text-red-700 mt-1">
                                        Kiểm tra biến NEXT_PUBLIC_DROPBOX_ACCESS_TOKEN trong file .env
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 mb-6 animate-pulse">
                            <p className="text-gray-500">Đang lấy thông tin API account...</p>
                        </div>
                    )}

                    {/* Input Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dropbox Shared Folder URL
                        </label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={sharedUrl}
                                onChange={(e) => setSharedUrl(e.target.value)}
                                placeholder="https://www.dropbox.com/scl/fo/..."
                                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0088cc] focus:border-[#0088cc] outline-none transition-all font-mono text-sm"
                            />
                            <button
                                onClick={handleLoadFiles}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#0088cc] text-white rounded-lg hover:bg-[#0077b3] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw size={18} />
                                        Create Direct Links
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Unmount All Section */}
                        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                💡 Quota đầy? Unmount các folders cũ để giải phóng dung lượng.
                            </div>
                            <button
                                onClick={handleUnmountAll}
                                disabled={unmounting}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                                {unmounting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Unmounting...
                                    </>
                                ) : (
                                    "Unmount All Folders"
                                )}
                            </button>
                        </div>
                        {unmountResult && (
                            <div className={`mt-3 p-3 rounded-lg text-sm ${unmountResult.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                {unmountResult}
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <strong>Error:</strong> {error}
                                    {error.includes('ACCESS DENIED') && (
                                        <p className="mt-2 text-sm">
                                            Hãy invite email <code className="bg-red-100 px-1 rounded">{apiEmail}</code> vào folder và thử lại.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Folder Info */}
                    {folderInfo && !loading && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-green-800 flex items-center justify-between">
                            <div>
                                <strong>Folder:</strong> {folderInfo.folderName}
                                {folderInfo.fileCount > 0 && (
                                    <>
                                        <span className="ml-3">{folderInfo.fileCount} files</span>
                                        <span className="ml-2">•</span>
                                        <span className="ml-2">{folderInfo.videoCount} videos</span>
                                        <span className="ml-2">•</span>
                                        <span className="ml-2">{folderInfo.imageCount} images</span>
                                    </>
                                )}
                            </div>
                            {hasDirectLinks && (
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-green-200 rounded-full text-xs font-semibold">
                                    <CheckCircle size={14} />
                                    Direct Links ✓
                                </span>
                            )}
                        </div>
                    )}

                    {/* Success Banner */}
                    {listOutput && hasDirectLinks && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3 text-sm text-green-800">
                            <CheckCircle className="flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="font-semibold">✅ Direct Links Created Successfully!</p>
                                <p className="mt-1 text-green-700">
                                    Các URLs này là permanent, hoạt động sau khi refresh trang.
                                    Xem console để copy các direct links.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 size={48} className="animate-spin text-[#0088cc] mb-4" />
                            <p className="text-gray-600 font-medium">{loadingStep}</p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !listOutput && !error && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                            <FolderOpen size={64} className="mb-4 opacity-50" />
                            <p className="text-lg">Paste Dropbox folder URL to create direct links</p>
                            <p className="text-sm mt-2">Remember to invite the API email first!</p>
                        </div>
                    )}

                    {/* Tabs & File List */}
                    {listOutput && !loading && (
                        <>
                            <div className="flex items-center gap-2 bg-gray-200/50 p-1 rounded-full w-fit mb-6">
                                <TabButton
                                    active={activeTab === "image"}
                                    onClick={() => setActiveTab("image")}
                                    label={`Image (${imageCount})`}
                                />
                                <TabButton
                                    active={activeTab === "video"}
                                    onClick={() => setActiveTab("video")}
                                    label={`Video (${videoCount})`}
                                />
                            </div>

                            {filteredFiles.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">
                                    No {activeTab}s found.
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {filteredFiles.map((file, index) =>
                                        file.type === "Video" ? (
                                            <VideoReviewCard
                                                key={file.id}
                                                updateOutputOrder={async () => { }}
                                                index={index + 1}
                                                total={filteredFiles.length}
                                                videoSrc={file.url}
                                                isAccepted={file.accepted}
                                                feedback={file.comment}
                                            />
                                        ) : (
                                            <ImageReviewCard
                                                key={file.id}
                                                index={index + 1}
                                                total={filteredFiles.length}
                                                imageSrc={file.url}
                                                imageName={file.name}
                                                isAccepted={file.accepted}
                                                feedback={file.comment}
                                            />
                                        )
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
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
