/**
 * Dropbox Service
 * 
 * Service để lấy files từ Dropbox shared folder.
 * Sử dụng phương pháp tải file và tạo Blob URLs.
 */

import { createDropboxApi, DropboxFileMetadata } from '../../utils/dropbox';
import { FileItem } from '../type';

// ============================================================================
// Constants
// ============================================================================

const DROPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_DROPBOX_ACCESS_TOKEN || '';
const DROPBOX_CONTENT_API = 'https://content.dropboxapi.com/2/sharing/get_shared_link_file';
const BATCH_SIZE = 3;

// File extensions
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.wmv'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg'];

// ============================================================================
// Types
// ============================================================================

export interface DropboxFolderInfo {
  folderName: string;
  fileCount: number;
  videoCount: number;
  imageCount: number;
}

interface ProcessedFile {
  type: string;
  id: string;
  url: string;
  name: string;
  accepted: boolean;
  comment?: string;
}

// ============================================================================
// Helpers
// ============================================================================

const isVideoFile = (name: string) => VIDEO_EXTENSIONS.some(ext => name.toLowerCase().endsWith(ext));
const isImageFile = (name: string) => IMAGE_EXTENSIONS.some(ext => name.toLowerCase().endsWith(ext));
const isMediaFile = (name: string) => isVideoFile(name) || isImageFile(name);
const getFileType = (name: string) => isVideoFile(name) ? 'Video' : isImageFile(name) ? 'Image' : 'File';

const validateToken = () => {
  if (!DROPBOX_ACCESS_TOKEN) {
    throw new Error('Dropbox access token not configured. Set NEXT_PUBLIC_DROPBOX_ACCESS_TOKEN in .env');
  }
};

// ============================================================================
// Core
// ============================================================================

async function downloadFile(sharedUrl: string, fileName: string): Promise<string> {
  const response = await fetch(DROPBOX_CONTENT_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DROPBOX_ACCESS_TOKEN}`,
      'Dropbox-API-Arg': JSON.stringify({ url: sharedUrl, path: `/${fileName}` }),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${fileName}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

async function processFilesInBatches(
  files: DropboxFileMetadata[],
  sharedUrl: string
): Promise<ProcessedFile[]> {
  const results: ProcessedFile[] = [];

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    
    const batchResults = await Promise.all(
      batch.map(async (file, idx) => {
        try {
          const url = await downloadFile(sharedUrl, file.name);
          return {
            type: getFileType(file.name),
            id: file.id || `file_${i + idx}`,
            url,
            name: file.name,
            accepted: false,
            comment: undefined,
          };
        } catch {
          return {
            type: getFileType(file.name),
            id: file.id || `file_${i + idx}`,
            url: '',
            name: file.name,
            accepted: false,
            comment: undefined,
          };
        }
      })
    );

    results.push(...batchResults);
  }

  return results;
}

// ============================================================================
// Public API
// ============================================================================

export async function getFilesFromDropboxFolder(
  sharedUrl: string,
  options?: {
    jobCode?: string;
    customerCode?: string;
    note?: string;
    saleEmail?: string;
    invoiceLink?: string;
  }
): Promise<FileItem> {
  validateToken();

  const dropbox = createDropboxApi(DROPBOX_ACCESS_TOKEN);

  const [metadata, entries] = await Promise.all([
    dropbox.getSharedLinkMetadata(sharedUrl),
    dropbox.getAllFilesInSharedFolder(sharedUrl),
  ]);

  const mediaFiles = entries
    .filter((e): e is DropboxFileMetadata => e['.tag'] === 'file')
    .filter(f => isMediaFile(f.name));

  const processedFiles = await processFilesInBatches(mediaFiles, sharedUrl);
  const validFiles = processedFiles.filter(f => f.url !== '');

  return {
    order_from: 'dropbox',
    job_code: options?.jobCode || metadata.name,
    customer_code: options?.customerCode,
    note: options?.note,
    sale_email: options?.saleEmail,
    invoice_link: options?.invoiceLink,
    files: validFiles,
  };
}

export async function getDropboxFolderInfo(sharedUrl: string): Promise<DropboxFolderInfo> {
  validateToken();

  const dropbox = createDropboxApi(DROPBOX_ACCESS_TOKEN);
  
  const [metadata, entries] = await Promise.all([
    dropbox.getSharedLinkMetadata(sharedUrl),
    dropbox.getAllFilesInSharedFolder(sharedUrl),
  ]);

  const files = entries.filter((e): e is DropboxFileMetadata => e['.tag'] === 'file');

  return {
    folderName: metadata.name,
    fileCount: files.length,
    videoCount: files.filter(f => isVideoFile(f.name)).length,
    imageCount: files.filter(f => isImageFile(f.name)).length,
  };
}
