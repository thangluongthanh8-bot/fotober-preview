import { FileItem } from '../type';

// ============================================================================
// Dropbox Service - Client-side (calls server API for token management)
// ============================================================================

const API_URL = '/api/dropbox';

export interface DropboxFolderInfo {
  folderName: string;
  fileCount: number;
  videoCount: number;
  imageCount: number;
}

// ============================================================================
// Helpers
// ============================================================================

const VIDEO_EXT = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const isVideo = (n: string) => VIDEO_EXT.some(e => n.toLowerCase().endsWith(e));
const isImage = (n: string) => IMAGE_EXT.some(e => n.toLowerCase().endsWith(e));
const isMedia = (n: string) => isVideo(n) || isImage(n);
const fileType = (n: string): 'Video' | 'Image' | 'File' => isVideo(n) ? 'Video' : isImage(n) ? 'Image' : 'File';
// const directUrlDownload = (url: string) => url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('dl=0', 'dl=1');
const directUrl = (url: string) => url.replace('www.dropbox.com', 'dl.dropboxusercontent.com')

// ============================================================================
// API Client
// ============================================================================

async function callDropboxAPI(action: string, params: object = {}): Promise<any> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Dropbox API error');
  }

  return result.data;
}

// ============================================================================
// Public Functions
// ============================================================================

export async function getApiAccountEmail(): Promise<string> {
  const data = await callDropboxAPI('get_account_email');
  return data.email;
}

export async function getDropboxFolderInfo(url: string): Promise<DropboxFolderInfo> {
  const data = await callDropboxAPI('get_folder_info', { url });
  return {
    folderName: data.folderName,
    fileCount: 0,
    videoCount: 0,
    imageCount: 0,
  };
}

export async function getFilesFromDropboxFolder(sharedUrl: string): Promise<FileItem> {
  console.log('[Dropbox] Getting files from folder...');

  // Step 1: Get folder name
  const folderInfo = await callDropboxAPI('get_folder_info', { url: sharedUrl });
  const folderName = folderInfo.folderName;
  console.log('[Dropbox] Folder name:', folderName);

  // Step 2: Find or mount folder
  const folders = await callDropboxAPI('list_folders');
  let folderPath: string | null = null;

  const existingFolder = folders.find((f: any) => 
    f.name.toLowerCase() === folderName.toLowerCase()
  );

  if (existingFolder) {
    if (existingFolder.path_lower) {
      folderPath = existingFolder.path_lower;
    } else {
      const mounted = await callDropboxAPI('mount_folder', { id: existingFolder.shared_folder_id });
      folderPath = mounted.path;
    }
  }

  if (!folderPath) {
    throw new Error(`Folder "${folderName}" not found. Please invite the API email first.`);
  }

  console.log('[Dropbox] Folder path:', folderPath);

  // Step 3: List files
  const allFiles = await callDropboxAPI('list_files', { path: folderPath });
  const mediaFiles = allFiles.filter((f: any) => isMedia(f.name));
  console.log('[Dropbox] Found', mediaFiles.length, 'media files');

  // Step 4: Create links (in batches)
  const results: Array<{
    type: 'Video' | 'Image' | 'File';
    id: string;
    url: string;
    name: string;
    accepted: boolean;
  }> = [];

  const BATCH_SIZE = 10;
  for (let i = 0; i < mediaFiles.length; i += BATCH_SIZE) {
    const batch = mediaFiles.slice(i, i + BATCH_SIZE);
    console.log(`[Dropbox] Creating links batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(mediaFiles.length / BATCH_SIZE)}`);

    const batchResults = await Promise.allSettled(
      batch.map(async (file: any) => {
        const linkData = await callDropboxAPI('create_link', { path: file.path_display });
        return {
          type: fileType(file.name),
          id: file.id,
          url: directUrl(linkData.url),
          name: file.name,
          accepted: false,
        };
      })
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }
  }

  console.log('[Dropbox] Successfully created', results.length, 'direct links');

  return {
    order_from: 'dropbox',
    job_code: folderName,
    files: results,
  };
}

export async function unmountAllDropboxFolders(): Promise<number> {
  // This would need additional API endpoint
  console.log('[Dropbox] Unmount not implemented via API route yet');
  return 0;
}
