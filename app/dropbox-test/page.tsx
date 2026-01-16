"use client";

import { useState } from "react";
import { Loader2, Link, Image, Video, FileText, Download } from "lucide-react";

interface DropboxFile {
    name: string;
    path: string;
    type: 'image' | 'video' | 'document' | 'other';
    size: number;
    previewUrl?: string;
    downloadUrl?: string;
}

export default function DropboxTestPage() {
    const [sharedLink, setSharedLink] = useState("");
    const [files, setFiles] = useState<DropboxFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [previewLoading, setPreviewLoading] = useState<string | null>(null);

    // Get file type from extension
    const getFileType = (name: string): DropboxFile['type'] => {
        const ext = name.split('.').pop()?.toLowerCase() || '';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
        if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video';
        if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'document';
        return 'other';
    };

    // Format file size
    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // List files from shared folder
    const handleListFiles = async () => {
        if (!sharedLink.trim()) {
            setError("Please enter a Dropbox shared link");
            return;
        }

        setLoading(true);
        setError("");
        setFiles([]);

        try {
            const response = await fetch('/api/dropbox', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'list_files',
                    params: { url: sharedLink }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to list files');
            }

            const mappedFiles: DropboxFile[] = data.entries
                .filter((entry: any) => entry['.tag'] === 'file')
                .map((entry: any) => ({
                    name: entry.name,
                    path: entry.path_lower,
                    type: getFileType(entry.name),
                    size: entry.size,
                    downloadUrl: entry.url || null
                }));

            setFiles(mappedFiles);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    // Get preview for a file using /files/get_preview
    const handleGetPreview = async (file: DropboxFile) => {
        setPreviewLoading(file.path);

        try {
            const response = await fetch('/api/dropbox', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_preview',
                    params: {
                        url: sharedLink,
                        path: file.path
                    }
                })
            });

            const data = await response.json();

            if (data.previewUrl) {
                // Update file with preview URL
                setFiles(prev => prev.map(f =>
                    f.path === file.path
                        ? { ...f, previewUrl: data.previewUrl }
                        : f
                ));
            }
        } catch (err) {
            console.error('Preview error:', err);
        } finally {
            setPreviewLoading(null);
        }
    };

    // Get file icon
    const FileIcon = ({ type }: { type: DropboxFile['type'] }) => {
        switch (type) {
            case 'image': return <Image className="text-green-500" size={24} />;
            case 'video': return <Video className="text-purple-500" size={24} />;
            case 'document': return <FileText className="text-blue-500" size={24} />;
            default: return <FileText className="text-gray-500" size={24} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">
                    Dropbox Shared Link Tester
                </h1>

                {/* Input Section */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dropbox Shared Link
                    </label>
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={sharedLink}
                                onChange={(e) => setSharedLink(e.target.value)}
                                placeholder="https://www.dropbox.com/scl/fo/..."
                                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <button
                            onClick={handleListFiles}
                            disabled={loading}
                            className="px-6 py-3 bg-[#0088cc] text-white rounded-lg hover:bg-[#0077b3] transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : null}
                            List Files
                        </button>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Files List */}
                {files.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="p-4 border-b bg-gray-50">
                            <h2 className="font-semibold text-gray-700">
                                Found {files.length} files
                            </h2>
                        </div>

                        <div className="divide-y">
                            {files.map((file, index) => (
                                <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <FileIcon type={file.type} />

                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-800 truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatSize(file.size)} • {file.type}
                                            </p>
                                        </div>

                                        <div className="flex gap-2">
                                            {(file.type === 'image' || file.type === 'document') && !file.previewUrl && (
                                                <button
                                                    onClick={() => handleGetPreview(file)}
                                                    disabled={previewLoading === file.path}
                                                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                                                >
                                                    {previewLoading === file.path ? (
                                                        <Loader2 className="animate-spin" size={16} />
                                                    ) : 'Preview'}
                                                </button>
                                            )}

                                            {file.downloadUrl && (
                                                <a
                                                    href={file.downloadUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors flex items-center gap-1"
                                                >
                                                    <Download size={14} />
                                                    Download
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Preview Image */}
                                    {file.previewUrl && (
                                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                            <img
                                                src={file.previewUrl}
                                                alt={file.name}
                                                className="max-w-md max-h-64 object-contain rounded"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && files.length === 0 && !error && (
                    <div className="bg-white rounded-lg shadow-sm border p-12 text-center text-gray-500">
                        <Link className="mx-auto mb-4 text-gray-300" size={48} />
                        <p>Enter a Dropbox shared folder link and click "List Files"</p>
                    </div>
                )}
            </div>
        </div>
    );
}
