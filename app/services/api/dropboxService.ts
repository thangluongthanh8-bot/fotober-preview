/**
 * Dropbox Service - Direct Links via Invited Folders
 * 
 * Flow:
 * 1. Sales invite API account vào folder
 * 2. Tìm folder từ danh sách shared folders
 * 3. Tạo Direct Links cho từng file
 */

import { FileItem } from '../type';

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  accessToken: process.env.NEXT_PUBLIC_DROPBOX_ACCESS_TOKEN || '',
  apiBase: 'https://api.dropboxapi.com/2',
  batchSize: 3,
  videoExtensions: ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.wmv'],
  imageExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg'],
};

// ============================================================================
// Types
// ============================================================================

export interface DropboxFolderInfo {
  folderName: string;
  fileCount: number;
  videoCount: number;
  imageCount: number;
}

interface DropboxFile {
  '.tag': 'file';
  id: string;
  name: string;
  path_display: string;
  path_lower: string;
}

interface SharedFolder {
  name: string;
  path_lower?: string;
  path_display?: string;
  shared_folder_id: string;
}

interface ProcessedFile {
  type: 'Video' | 'Image' | 'File';
  id: string;
  url: string;
  name: string;
  accepted: boolean;
  comment?: string;
}

// ============================================================================
// Utilities
// ============================================================================

const isVideo = (name: string) => 
  CONFIG.videoExtensions.some(ext => name.toLowerCase().endsWith(ext));

const isImage = (name: string) => 
  CONFIG.imageExtensions.some(ext => name.toLowerCase().endsWith(ext));

const isMedia = (name: string) => isVideo(name) || isImage(name);

const getFileType = (name: string): 'Video' | 'Image' | 'File' => {
  if (isVideo(name)) return 'Video';
  if (isImage(name)) return 'Image';
  return 'File';
};

const toDirectUrl = (url: string): string => {
  return url
    .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
    .replace('?dl=0', '?dl=1')
    .replace('&dl=0', '&dl=1');
};

// ============================================================================
// API Client
// ============================================================================

class DropboxAPI {
  private token: string;

  constructor(token: string) {
    if (!token) throw new Error('NEXT_PUBLIC_DROPBOX_ACCESS_TOKEN is required');
    this.token = token;
  }

  private async post<T>(endpoint: string, body: object): Promise<T> {
    const response = await fetch(`${CONFIG.apiBase}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`API Error: ${text}`);
    }
    return text ? JSON.parse(text) : ({} as T);
  }

  // Get account email
  async getAccountInfo(): Promise<{ email: string; name: string }> {
    console.log('[1] Getting account info...');
    
    const response = await fetch(`${CONFIG.apiBase}/users/get_current_account`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
    });

    const text = await response.text();
    if (!response.ok) throw new Error(`API Error: ${text}`);

    const result = JSON.parse(text);
    console.log('[1] Account email:', result.email);
    
    return {
      email: result.email,
      name: result.name?.display_name || 'Unknown',
    };
  }

  // Get folder name from shared URL
  async getFolderNameFromUrl(sharedUrl: string): Promise<string> {
    const result = await this.post<{ name: string }>(
      '/sharing/get_shared_link_metadata', 
      { url: sharedUrl }
    );
    return result.name;
  }

  // List mounted shared folders
  async listSharedFolders(): Promise<SharedFolder[]> {
    console.log('[2a] Listing shared folders...');
    
    const result = await this.post<{ entries: SharedFolder[] }>(
      '/sharing/list_folders', 
      { limit: 100 }
    );

    console.log('[2a] Found:', result.entries.map(e => e.name));
    return result.entries || [];
  }

  // List mountable folders (pending invitations)
  async listMountableFolders(): Promise<SharedFolder[]> {
    console.log('[2b] Listing mountable folders...');
    
    const result = await this.post<{ entries: SharedFolder[] }>(
      '/sharing/list_mountable_folders', 
      { limit: 100 }
    );

    console.log('[2b] Mountable:', result.entries.map(e => e.name));
    return result.entries || [];
  }

  // Mount a folder
  async mountFolder(sharedFolderId: string): Promise<string> {
    console.log('[Mount] Mounting folder:', sharedFolderId);
    
    const result = await this.post<{ path_lower: string }>(
      '/sharing/mount_folder',
      { shared_folder_id: sharedFolderId }
    );
    
    console.log('[Mount] Mounted at:', result.path_lower);
    return result.path_lower;
  }

  // Unmount a folder (free up quota)
  async unmountFolder(sharedFolderId: string): Promise<void> {
    console.log('[Unmount] Unmounting folder:', sharedFolderId);
    
    await this.post(
      '/sharing/unmount_folder',
      { shared_folder_id: sharedFolderId }
    );
    
    console.log('[Unmount] Done!');
  }

  // Unmount all mounted folders
  async unmountAllFolders(): Promise<number> {
    console.log('\n[Unmount All] Getting list of mounted folders...');
    
    const mounted = await this.listSharedFolders();
    const mountedWithPath = mounted.filter(f => f.path_lower);
    
    console.log(`[Unmount All] Found ${mountedWithPath.length} mounted folders`);
    
    let count = 0;
    for (const folder of mountedWithPath) {
      try {
        await this.unmountFolder(folder.shared_folder_id);
        console.log(`[Unmount All] Unmounted: ${folder.name}`);
        count++;
      } catch (error) {
        console.error(`[Unmount All] Failed to unmount ${folder.name}:`, error);
      }
    }
    
    console.log(`[Unmount All] Unmounted ${count} folders`);
    return count;
  }

  // Find folder by name - returns path
  async findFolderByName(folderName: string): Promise<string | null> {
    console.log(`\n[2] Finding folder: "${folderName}"...`);
    
    // Check mounted folders
    const mounted = await this.listSharedFolders();
    
    // Log details
    console.log('[2a] Mounted folders detail:');
    mounted.forEach((f, i) => {
      console.log(`  ${i + 1}. "${f.name}" path="${f.path_lower || f.path_display || 'N/A'}"`);
    });
    
    // Find by name (case-insensitive)
    const found = mounted.find(
      f => f.name.toLowerCase().trim() === folderName.toLowerCase().trim()
    );
    
    if (found) {
      // If path_lower exists, folder is already mounted
      if (found.path_lower) {
        console.log(`[2] FOUND & MOUNTED! Path: ${found.path_lower}`);
        return found.path_lower;
      }
      
      // If no path, folder is not mounted - need to mount it (auto-accept)
      console.log(`[2] Found "${found.name}" but not mounted. Auto-mounting...`);
      try {
        const mountedPath = await this.mountFolder(found.shared_folder_id);
        console.log(`[2] Auto-mounted at: ${mountedPath}`);
        return mountedPath;
      } catch (mountError) {
        console.error('[2] Mount failed:', mountError);
        throw mountError;
      }
    }

    // Check mountable folders
    const mountable = await this.listMountableFolders();
    
    console.log('[2b] Mountable folders detail:');
    mountable.forEach((f, i) => {
      console.log(`  ${i + 1}. "${f.name}" id="${f.shared_folder_id}"`);
    });

    const toMount = mountable.find(
      f => f.name.toLowerCase().trim() === folderName.toLowerCase().trim()
    );

    if (toMount) {
      console.log(`[2] Found pending invitation, mounting...`);
      return await this.mountFolder(toMount.shared_folder_id);
    }

    console.log(`[2] NOT FOUND: "${folderName}"`);
    return null;
  }

  // List files in folder
  async listFiles(folderPath: string): Promise<DropboxFile[]> {
    console.log('[3] Listing files in:', folderPath);
    
    const allFiles: DropboxFile[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    const initial = await this.post<{
      entries: DropboxFile[];
      has_more: boolean;
      cursor: string;
    }>('/files/list_folder', { path: folderPath, recursive: false });

    allFiles.push(...initial.entries.filter((e: DropboxFile) => e['.tag'] === 'file'));
    hasMore = initial.has_more;
    cursor = initial.cursor;

    while (hasMore && cursor) {
      const more: { entries: DropboxFile[]; has_more: boolean; cursor: string } = 
        await this.post('/files/list_folder/continue', { cursor });

      allFiles.push(...more.entries.filter((e: DropboxFile) => e['.tag'] === 'file'));
      hasMore = more.has_more;
      cursor = more.cursor;
    }

    console.log(`[3] Found ${allFiles.length} files`);
    return allFiles;
  }

  // Create direct link for file
  async createDirectLink(filePath: string): Promise<string> {
    try {
      const result = await this.post<{ url: string }>(
        '/sharing/create_shared_link_with_settings',
        { path: filePath, settings: { requested_visibility: 'public' } }
      );
      return toDirectUrl(result.url);
    } catch (error) {
      if (error instanceof Error && error.message.includes('shared_link_already_exists')) {
        const list = await this.post<{ links: { url: string }[] }>(
          '/sharing/list_shared_links',
          { path: filePath, direct_only: true }
        );
        if (list.links.length > 0) {
          return toDirectUrl(list.links[0].url);
        }
      }
      throw error;
    }
  }
}

// ============================================================================
// Main Service
// ============================================================================

class DropboxService {
  private api: DropboxAPI;

  constructor() {
    this.api = new DropboxAPI(CONFIG.accessToken);
  }

  async getApiAccountEmail(): Promise<string> {
    const account = await this.api.getAccountInfo();
    return account.email;
  }

  async createDirectLinks(sharedUrl: string): Promise<FileItem> {
    console.log('\n========================================');
    console.log('Creating Direct Links');
    console.log('========================================');

    // Step 1: Get folder name
    console.log('\n[1] Getting folder name from URL...');
    const folderName = await this.api.getFolderNameFromUrl(sharedUrl);
    console.log(`[1] Folder name: "${folderName}"`);

    // Step 2: Find folder in shared folders
    const folderPath = await this.api.findFolderByName(folderName);
    
    if (!folderPath) {
      throw new Error(
        `Folder "${folderName}" not found. ` +
        `Make sure the API email has been invited to this folder.`
      );
    }

    // Step 3: List files
    const allFiles = await this.api.listFiles(folderPath);
    const mediaFiles = allFiles.filter((f: DropboxFile) => isMedia(f.name));
    console.log(`[3] Media files: ${mediaFiles.length}`);

    // Step 4: Create direct links
    console.log('\n[4] Creating direct links...');
    const processedFiles = await this.createLinksInBatches(mediaFiles);
    const validFiles = processedFiles.filter(f => f.url !== '');

    // Log results
    console.log('\n========================================');
    console.log('DIRECT LINKS CREATED:');
    console.log('========================================');
    validFiles.forEach((file, i) => {
      console.log(`${i + 1}. ${file.name}`);
      console.log(`   ${file.url}`);
    });
    console.log(`\nTotal: ${validFiles.length} direct links`);

    return {
      order_from: 'dropbox',
      job_code: folderName,
      files: validFiles,
    };
  }

  private async createLinksInBatches(files: DropboxFile[]): Promise<ProcessedFile[]> {
    const results: ProcessedFile[] = [];
    const totalBatches = Math.ceil(files.length / CONFIG.batchSize);

    for (let i = 0; i < files.length; i += CONFIG.batchSize) {
      const batch = files.slice(i, i + CONFIG.batchSize);
      const batchNum = Math.floor(i / CONFIG.batchSize) + 1;
      console.log(`[4] Batch ${batchNum}/${totalBatches}`);

      const batchResults = await Promise.all(
        batch.map((file: DropboxFile) => this.createLinkForFile(file))
      );

      results.push(...batchResults);
    }

    return results;
  }

  private async createLinkForFile(file: DropboxFile): Promise<ProcessedFile> {
    try {
      const url = await this.api.createDirectLink(file.path_display);
      console.log(`  OK: ${file.name}`);

      return {
        type: getFileType(file.name),
        id: file.id,
        url,
        name: file.name,
        accepted: false,
      };
    } catch (error) {
      console.error(`  FAIL: ${file.name}`, error);
      return {
        type: getFileType(file.name),
        id: file.id,
        url: '',
        name: file.name,
        accepted: false,
      };
    }
  }

  async getFolderInfo(sharedUrl: string): Promise<DropboxFolderInfo> {
    const folderName = await this.api.getFolderNameFromUrl(sharedUrl);
    return {
      folderName,
      fileCount: 0,
      videoCount: 0,
      imageCount: 0,
    };
  }

  // Unmount all mounted folders
  async unmountAllFolders(): Promise<number> {
    return this.api.unmountAllFolders();
  }
}

// ============================================================================
// Public API
// ============================================================================

let service: DropboxService | null = null;
const getService = () => {
  if (!service) service = new DropboxService();
  return service;
};

export async function getApiAccountEmail(): Promise<string> {
  return getService().getApiAccountEmail();
}

export async function getFilesFromDropboxFolder(sharedUrl: string): Promise<FileItem> {
  return getService().createDirectLinks(sharedUrl);
}

export async function getDropboxFolderInfo(sharedUrl: string): Promise<DropboxFolderInfo> {
  return getService().getFolderInfo(sharedUrl);
}

/**
 * Unmount all mounted folders (free up quota)
 * @returns Number of folders unmounted
 */
export async function unmountAllDropboxFolders(): Promise<number> {
  return getService().unmountAllFolders();
}
