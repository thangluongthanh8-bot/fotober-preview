"use client";

import { useState } from "react";
import { Info, Loader2, FolderOpen, RefreshCw } from "lucide-react";

import VideoReviewCard from "../components/VideoReviewCard";
import ImageReviewCard from "../components/ImageReviewCard";
import { FileItem } from "../services/type";
import {
    getFilesFromDropboxFolder,
    getDropboxFolderInfo,
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
    const [sharedUrl, setSharedUrl] = useState("");
    const [listOutput, setListOutput] = useState<FileItem | null>(null);
    const [folderInfo, setFolderInfo] = useState<DropboxFolderInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>("image");

    // Computed values
    const videoCount = listOutput?.files.filter((f) => f.type === "Video").length || 0;
    const imageCount = listOutput?.files.filter((f) => f.type === "Image").length || 0;

    const filteredFiles = listOutput?.files.filter((file) => {
        return activeTab === "video"
            ? file.type === "Video"
            : file.type === "Image";
    }) || [];

    // Handlers
    const handleLoadFiles = async () => {
        if (!sharedUrl.trim()) {
            setError("Please enter a Dropbox shared folder URL");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [info, files] = await Promise.all([
                getDropboxFolderInfo(sharedUrl),
                getFilesFromDropboxFolder(sharedUrl),
            ]);

            setFolderInfo(info);
            setListOutput(files);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load files";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateOutputOrder = async () => {
        // Placeholder for future implementation
    };

    // Render helpers
    const renderUrlInput = () => (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Dropbox Shared Folder URL
            </label>
            <div className="flex gap-3">
                <input
                    type="text"
                    value={sharedUrl}
                    onChange={(e) => setSharedUrl(e.target.value)}
                    placeholder="Paste Dropbox shared folder URL here..."
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0088cc] focus:border-[#0088cc] outline-none transition-all"
                />
                <button
                    onClick={handleLoadFiles}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#0088cc] text-white rounded-lg hover:bg-[#0077b3] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Loading...
                        </>
                    ) : (
                        <>
                            <RefreshCw size={18} />
                            Load Files
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    const renderTabs = () => (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 bg-gray-200/50 p-1 rounded-full">
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
        </div>
    );

    const renderFileList = () => {
        if (filteredFiles.length === 0) {
            return (
                <div className="text-center py-10 text-gray-500">
                    No {activeTab}s found in this folder.
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {filteredFiles.map((file, index) =>
                    file.type === "Video" ? (
                        <VideoReviewCard
                            key={file.id}
                            updateOutputOrder={handleUpdateOutputOrder}
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
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
            <main className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <h1 className="text-2xl font-bold text-[#0088cc] mb-6 flex items-center gap-3">
                        <FolderOpen size={28} />
                        Dropbox Preview
                    </h1>

                    {/* URL Input */}
                    {renderUrlInput()}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {/* Folder Info */}
                    {folderInfo && !loading && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-green-800">
                            <strong>Folder:</strong> {folderInfo.folderName} •
                            <span className="ml-2">{folderInfo.fileCount} files</span> •
                            <span className="ml-2">{folderInfo.videoCount} videos</span> •
                            <span className="ml-2">{folderInfo.imageCount} images</span>
                        </div>
                    )}

                    {/* Info Banner */}
                    {listOutput && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start gap-3 text-sm text-blue-800">
                            <Info className="flex-shrink-0 mt-0.5" size={20} />
                            <p>
                                <span className="font-semibold">Note:</span> Files are loaded
                                directly from Dropbox. Video playback may require buffering.
                            </p>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 size={48} className="animate-spin text-[#0088cc] mb-4" />
                            <p className="text-gray-600">Loading files from Dropbox...</p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !listOutput && !error && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                            <FolderOpen size={64} className="mb-4 opacity-50" />
                            <p className="text-lg">
                                Paste a Dropbox shared folder URL and click "Load Files"
                            </p>
                        </div>
                    )}

                    {/* Tabs & File List */}
                    {listOutput && !loading && (
                        <>
                            {renderTabs()}
                            {renderFileList()}
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

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    label: string;
}

function TabButton({ active, onClick, label }: TabButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${active
                    ? "bg-[#0088cc] text-white shadow-sm"
                    : "text-gray-600 hover:bg-white hover:shadow-sm"
                }`}
        >
            {label}
        </button>
    );
}
