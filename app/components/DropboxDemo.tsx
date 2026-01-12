'use client';

import { useState } from 'react';
import { createDropboxApi, DropboxEntry } from '../utils/dropbox';

interface DropboxDemoProps {
    accessToken: string;
}

export default function DropboxDemo({ accessToken }: DropboxDemoProps) {
    const [sharedUrl, setSharedUrl] = useState(
        'https://www.dropbox.com/scl/fo/2pglzxzasm99247pbtcus/AJrVl3WD8qzsHWomQNeo-Cw?rlkey=vxylkqvkbuuhvlu0oe2rpbjib&st=otpqma6d&dl=0'
    );
    const [files, setFiles] = useState<DropboxEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFetchFiles = async () => {
        if (!accessToken) {
            setError('Access token is required');
            return;
        }

        setLoading(true);
        setError(null);
        setFiles([]);

        try {
            const dropbox = createDropboxApi(accessToken);

            // First, get metadata to verify the link
            console.log('Fetching metadata...');
            const metadata = await dropbox.getSharedLinkMetadata(sharedUrl);
            console.log('Metadata:', metadata);

            // Then, list all files
            console.log('Fetching files...');
            const allFiles = await dropbox.getAllFilesInSharedFolder(sharedUrl);
            console.log('Files:', allFiles);

            setFiles(allFiles);
        } catch (err) {
            console.error('Error:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
            <h2 style={{ marginBottom: '20px' }}>Dropbox Shared Folder Demo</h2>

            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Shared Folder URL:
                </label>
                <input
                    type="text"
                    value={sharedUrl}
                    onChange={(e) => setSharedUrl(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        marginBottom: '10px',
                    }}
                    placeholder="Enter Dropbox shared folder URL..."
                />
                <button
                    onClick={handleFetchFiles}
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        backgroundColor: loading ? '#ccc' : '#0061fe',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                >
                    {loading ? 'Loading...' : 'Fetch Files'}
                </button>
            </div>

            {error && (
                <div style={{
                    padding: '15px',
                    backgroundColor: '#fee',
                    border: '1px solid #f00',
                    borderRadius: '4px',
                    color: '#c00',
                    marginBottom: '20px',
                }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {files.length > 0 && (
                <div>
                    <h3 style={{ marginBottom: '10px' }}>
                        Found {files.length} items:
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f5f5f5' }}>
                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                                    Type
                                </th>
                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                                    Name
                                </th>
                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                                    Size
                                </th>
                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                                    Path
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {files.map((file) => (
                                <tr key={file.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '10px' }}>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            backgroundColor: file['.tag'] === 'folder' ? '#e3f2fd' : '#e8f5e9',
                                            color: file['.tag'] === 'folder' ? '#1976d2' : '#388e3c',
                                        }}>
                                            {file['.tag'] === 'folder' ? '📁 Folder' : '📄 File'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px', fontWeight: '500' }}>
                                        {file.name}
                                    </td>
                                    <td style={{ padding: '10px', color: '#666' }}>
                                        {file['.tag'] === 'file' ? formatFileSize(file.size) : '-'}
                                    </td>
                                    <td style={{ padding: '10px', color: '#888', fontSize: '12px' }}>
                                        {file.path_display}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && files.length === 0 && !error && (
                <p style={{ color: '#666' }}>
                    Click "Fetch Files" to load files from the shared folder.
                </p>
            )}
        </div>
    );
}
