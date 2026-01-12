
import { FileItem } from '../type';

// ============================================================================
// Configuration với Refresh Token Support
// ============================================================================

const CONFIG = {
  appKey: process.env.NEXT_PUBLIC_DROPBOX_APP_KEY || '',
  appSecret: process.env.DROPBOX_APP_SECRET || '',
  refreshToken: process.env.DROPBOX_REFRESH_TOKEN || '',
  // Fallback to old access token if refresh token not configured
  accessToken: process.env.NEXT_PUBLIC_DROPBOX_ACCESS_TOKEN || '',
  apiUrl: 'https://api.dropboxapi.com/2',
  authUrl: 'https://api.dropboxapi.com/oauth2/token',
  batchSize: 15,
  videoExt: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
  imageExt: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
};

// Token cache
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

export interface DropboxFolderInfo {
  folderName: string;
  fileCount: number;
  videoCount: number;
  imageCount: number;
}

interface File { '.tag': 'file'; id: string; name: string; path_display: string; path_lower: string; }
interface Folder { name: string; path_lower?: string; shared_folder_id: string; }
interface Result { type: 'Video' | 'Image' | 'File'; id: string; url: string; name: string; accepted: boolean; }
interface SharedLink { url: string; path_lower: string; }

// ============================================================================
// Helpers
// ============================================================================

const isVideo = (n: string) => CONFIG.videoExt.some(e => n.toLowerCase().endsWith(e));
const isImage = (n: string) => CONFIG.imageExt.some(e => n.toLowerCase().endsWith(e));
const isMedia = (n: string) => isVideo(n) || isImage(n);
const fileType = (n: string): 'Video' | 'Image' | 'File' => isVideo(n) ? 'Video' : isImage(n) ? 'Image' : 'File';
const directUrl = (url: string) => url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('dl=0', 'dl=1');

// ============================================================================
// Token Management - Auto Refresh
// ============================================================================

async function getValidAccessToken(): Promise<string> {
  // If using old-style permanent token (no refresh token configured)
  if (!CONFIG.refreshToken && CONFIG.accessToken) {
    console.log('[Dropbox] Using legacy access token (no refresh token configured)');
    return CONFIG.accessToken;
  }

  // Check if cached token is still valid (with 5 min buffer)
  const now = Date.now();
  if (cachedAccessToken && tokenExpiresAt > now + 5 * 60 * 1000) {
    return cachedAccessToken;
  }

  // Refresh the token
  console.log('[Dropbox] Refreshing access token...');
  
  if (!CONFIG.appKey || !CONFIG.appSecret || !CONFIG.refreshToken) {
    throw new Error('Missing Dropbox OAuth credentials. Set NEXT_PUBLIC_DROPBOX_APP_KEY, DROPBOX_APP_SECRET, and DROPBOX_REFRESH_TOKEN');
  }

  const response = await fetch(CONFIG.authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: CONFIG.refreshToken,
      client_id: CONFIG.appKey,
      client_secret: CONFIG.appSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Dropbox] Token refresh failed:', error);
    throw new Error(`Failed to refresh Dropbox token: ${error}`);
  }

  const data = await response.json();
  cachedAccessToken = data.access_token;
  // Token expires in seconds, convert to ms and set expiry time
  tokenExpiresAt = now + (data.expires_in * 1000);
  
  console.log('[Dropbox] Token refreshed successfully, expires in', data.expires_in, 'seconds');
  return cachedAccessToken;
}

// ============================================================================
// API Class with Auto-Refresh
// ============================================================================

class API {
  private async getToken(): Promise<string> {
    return await getValidAccessToken();
  }

  private async post<T>(endpoint: string, body: object): Promise<T> {
    const token = await this.getToken();
    const res = await fetch(`${CONFIG.apiUrl}${endpoint}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    
    // If token expired, try refresh and retry once
    if (!res.ok && text.includes('expired_access_token')) {
      console.log('[Dropbox] Token expired, forcing refresh...');
      cachedAccessToken = null;
      tokenExpiresAt = 0;
      const newToken = await this.getToken();
      const retryRes = await fetch(`${CONFIG.apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${newToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const retryText = await retryRes.text();
      if (!retryRes.ok) throw new Error(retryText);
      return retryText ? JSON.parse(retryText) : ({} as T);
    }
    
    if (!res.ok) throw new Error(text);
    return text ? JSON.parse(text) : ({} as T);
  }

  async getEmail(): Promise<string> {
    const token = await this.getToken();
    const res = await fetch(`${CONFIG.apiUrl}/users/get_current_account`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.email;
  }

  async getFolderName(url: string): Promise<string> {
    const r = await this.post<{ name: string }>('/sharing/get_shared_link_metadata', { url });
    return r.name;
  }

  async listFolders(): Promise<Folder[]> {
    const r = await this.post<{ entries: Folder[] }>('/sharing/list_folders', { limit: 100 });
    return r.entries || [];
  }

  async mount(id: string): Promise<string> {
    const r = await this.post<{ path_lower: string }>('/sharing/mount_folder', { shared_folder_id: id });
    return r.path_lower;
  }

  async unmount(id: string): Promise<void> {
    await this.post('/sharing/unmount_folder', { shared_folder_id: id });
  }

  async unmountAll(): Promise<number> {
    const folders = await this.listFolders();
    const mounted = folders.filter(f => f.path_lower);
    let count = 0;
    for (const f of mounted) {
      try { await this.unmount(f.shared_folder_id); count++; } catch {}
    }
    return count;
  }

  async findFolder(name: string): Promise<string | null> {
    const folders = await this.listFolders();
    const found = folders.find(f => f.name.toLowerCase() === name.toLowerCase());
    if (!found) return null;
    if (found.path_lower) return found.path_lower;
    return await this.mount(found.shared_folder_id);
  }

  async listFiles(path: string): Promise<File[]> {
    const files: File[] = [];
    let cursor = '';
    let hasMore = true;

    const first = await this.post<{ entries: File[]; has_more: boolean; cursor: string }>(
      '/files/list_folder', { path, recursive: true }
    );
    files.push(...first.entries.filter((e: File) => e['.tag'] === 'file'));
    hasMore = first.has_more;
    cursor = first.cursor;

    while (hasMore) {
      const more = await this.post<{ entries: File[]; has_more: boolean; cursor: string }>(
        '/files/list_folder/continue', { cursor }
      );
      files.push(...more.entries.filter((e: File) => e['.tag'] === 'file'));
      hasMore = more.has_more;
      cursor = more.cursor;
    }

    return files;
  }

  async listAllSharedLinks(): Promise<Map<string, string>> {
    const linkMap = new Map<string, string>();
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const body: { cursor?: string } = cursor ? { cursor } : {};
      const r = await this.post<{ links: SharedLink[]; has_more: boolean; cursor?: string }>(
        '/sharing/list_shared_links', body
      );
      
      for (const link of r.links) {
        linkMap.set(link.path_lower, directUrl(link.url));
      }
      
      hasMore = r.has_more;
      cursor = r.cursor;
    }

    console.log(`[Dropbox] Found ${linkMap.size} existing shared links`);
    return linkMap;
  }

  async createLinkDirect(path: string): Promise<string> {
    const r = await this.post<{ url: string }>('/sharing/create_shared_link_with_settings', {
      path, settings: { requested_visibility: 'public' }
    });
    return directUrl(r.url);
  }

  async createLink(path: string): Promise<string> {
    try {
      return await this.createLinkDirect(path);
    } catch (e) {
      if (e instanceof Error && e.message.includes('shared_link_already_exists')) {
        const r = await this.post<{ links: { url: string }[] }>('/sharing/list_shared_links', { path, direct_only: true });
        if (r.links.length > 0) return directUrl(r.links[0].url);
      }
      throw e;
    }
  }
}

// ============================================================================
// Service
// ============================================================================

class Service {
  private api = new API();

  async getEmail() { return this.api.getEmail(); }

  async createLinks(sharedUrl: string): Promise<FileItem> {
    const name = await this.api.getFolderName(sharedUrl);
    const path = await this.api.findFolder(name);
    if (!path) throw new Error(`Folder "${name}" not found. Invite API email first.`);

    const allFiles = await this.api.listFiles(path);
    const mediaFiles = allFiles.filter(f => isMedia(f.name));
    console.log(`[Dropbox] Found ${mediaFiles.length} media files in folder "${name}"`);

    const existingLinks = await this.api.listAllSharedLinks();
    
    const filesWithLinks: { file: typeof mediaFiles[0]; url: string }[] = [];
    const filesNeedingLinks: typeof mediaFiles = [];
    
    for (const f of mediaFiles) {
      const existingUrl = existingLinks.get(f.path_lower);
      if (existingUrl) {
        filesWithLinks.push({ file: f, url: existingUrl });
      } else {
        filesNeedingLinks.push(f);
      }
    }
    
    console.log(`[Dropbox] ${filesWithLinks.length} files already have links, ${filesNeedingLinks.length} need new links`);

    const results: Result[] = filesWithLinks.map(({ file, url }) => ({
      type: fileType(file.name),
      id: file.id,
      url,
      name: file.name,
      accepted: false
    }));

    for (let i = 0; i < filesNeedingLinks.length; i += CONFIG.batchSize) {
      const batch = filesNeedingLinks.slice(i, i + CONFIG.batchSize);
      console.log(`[Dropbox] Creating links for batch ${Math.floor(i / CONFIG.batchSize) + 1}/${Math.ceil(filesNeedingLinks.length / CONFIG.batchSize)}`);
      
      const batchResults = await Promise.allSettled(
        batch.map(async f => {
          const url = await this.api.createLinkDirect(f.path_display);
          return { type: fileType(f.name), id: f.id, url, name: f.name, accepted: false } as Result;
        })
      );

      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const file = batch[j];
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          try {
            const url = await this.api.createLink(file.path_display);
            results.push({ type: fileType(file.name), id: file.id, url, name: file.name, accepted: false });
          } catch {
            console.error(`[Dropbox] Failed to create link for: ${file.name}`);
            results.push({ type: fileType(file.name), id: file.id, url: '', name: file.name, accepted: false });
          }
        }
      }
    }

    const successLinks = results.filter(r => r.url);
    console.log(`[Dropbox] Successfully created ${successLinks.length}/${mediaFiles.length} direct links`);

    return { order_from: 'dropbox', job_code: name, files: successLinks };
  }

  async getFolderInfo(url: string): Promise<DropboxFolderInfo> {
    const name = await this.api.getFolderName(url);
    return { folderName: name, fileCount: 0, videoCount: 0, imageCount: 0 };
  }

  async unmountAll() { return this.api.unmountAll(); }
}

// ============================================================================
// Exports
// ============================================================================

let svc: Service | null = null;
const get = () => svc || (svc = new Service());

export const getApiAccountEmail = () => get().getEmail();
export const getFilesFromDropboxFolder = (url: string) => get().createLinks(url);
export const getDropboxFolderInfo = (url: string) => get().getFolderInfo(url);
export const unmountAllDropboxFolders = () => get().unmountAll();
