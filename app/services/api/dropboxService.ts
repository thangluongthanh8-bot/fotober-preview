
import { FileItem } from '../type';

const CONFIG = {
  token: process.env.NEXT_PUBLIC_DROPBOX_ACCESS_TOKEN || '',
  apiUrl: 'https://api.dropboxapi.com/2',
  batchSize: 3,
  videoExt: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
  imageExt: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
};

export interface DropboxFolderInfo {
  folderName: string;
  fileCount: number;
  videoCount: number;
  imageCount: number;
}

interface File { '.tag': 'file'; id: string; name: string; path_display: string; path_lower: string; }
interface Folder { name: string; path_lower?: string; shared_folder_id: string; }
interface Result { type: 'Video' | 'Image' | 'File'; id: string; url: string; name: string; accepted: boolean; }

// ============================================================================
// Helpers
// ============================================================================

const isVideo = (n: string) => CONFIG.videoExt.some(e => n.toLowerCase().endsWith(e));
const isImage = (n: string) => CONFIG.imageExt.some(e => n.toLowerCase().endsWith(e));
const isMedia = (n: string) => isVideo(n) || isImage(n);
const fileType = (n: string): 'Video' | 'Image' | 'File' => isVideo(n) ? 'Video' : isImage(n) ? 'Image' : 'File';
const directUrl = (url: string) => url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('dl=0', 'dl=1');

// ============================================================================
// API
// ============================================================================

class API {
  constructor(private token: string) {
    if (!token) throw new Error('DROPBOX_ACCESS_TOKEN required');
  }

  private async post<T>(endpoint: string, body: object): Promise<T> {
    const res = await fetch(`${CONFIG.apiUrl}${endpoint}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text);
    return text ? JSON.parse(text) : ({} as T);
  }

  async getEmail(): Promise<string> {
    const res = await fetch(`${CONFIG.apiUrl}/users/get_current_account`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}` },
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
      '/files/list_folder', { path, recursive: false }
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

  async createLink(path: string): Promise<string> {
    try {
      const r = await this.post<{ url: string }>('/sharing/create_shared_link_with_settings', {
        path, settings: { requested_visibility: 'public' }
      });
      return directUrl(r.url);
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
  private api = new API(CONFIG.token);

  async getEmail() { return this.api.getEmail(); }

  async createLinks(sharedUrl: string): Promise<FileItem> {
    // Get folder name and find it
    const name = await this.api.getFolderName(sharedUrl);
    const path = await this.api.findFolder(name);
    if (!path) throw new Error(`Folder "${name}" not found. Invite API email first.`);

    // List and filter media files
    const allFiles = await this.api.listFiles(path);
    const mediaFiles = allFiles.filter(f => isMedia(f.name));

    // Create links in batches
    const results: Result[] = [];
    for (let i = 0; i < mediaFiles.length; i += CONFIG.batchSize) {
      const batch = mediaFiles.slice(i, i + CONFIG.batchSize);
      const urls = await Promise.all(batch.map(async f => {
        try {
          const url = await this.api.createLink(f.path_display);
          return { type: fileType(f.name), id: f.id, url, name: f.name, accepted: false } as Result;
        } catch {
          return { type: fileType(f.name), id: f.id, url: '', name: f.name, accepted: false } as Result;
        }
      }));
      results.push(...urls);
    }

    // Log created links
    console.log('Direct Links:', results.filter(r => r.url).map(r => `${r.name}: ${r.url}`));

    return { order_from: 'dropbox', job_code: name, files: results.filter(r => r.url) };
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
