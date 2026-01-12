/**
 * Dropbox API Utilities
 * 
 * Utility class for interacting with Dropbox API
 * to access files from shared folder links.
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface DropboxFileMetadata {
  '.tag': 'file';
  name: string;
  path_lower: string;
  path_display: string;
  id: string;
  client_modified: string;
  server_modified: string;
  rev: string;
  size: number;
  is_downloadable: boolean;
  content_hash?: string;
}

export interface DropboxFolderMetadata {
  '.tag': 'folder';
  name: string;
  path_lower: string;
  path_display: string;
  id: string;
}

export type DropboxEntry = DropboxFileMetadata | DropboxFolderMetadata;

export interface DropboxListFolderResponse {
  entries: DropboxEntry[];
  cursor: string;
  has_more: boolean;
}

export interface DropboxSharedLinkMetadata {
  '.tag': 'folder' | 'file';
  name: string;
  url: string;
  path_lower?: string;
  id: string;
}

export interface DropboxApiConfig {
  accessToken: string;
}

// ============================================================================
// Constants
// ============================================================================

const DROPBOX_API_BASE_URL = 'https://api.dropboxapi.com/2';
const DROPBOX_CONTENT_URL = 'https://content.dropboxapi.com/2';

// ============================================================================
// DropboxApi Class
// ============================================================================

/**
 * Dropbox API class to handle all Dropbox operations
 * 
 * @example
 * ```typescript
 * const dropbox = new DropboxApi({ accessToken: 'your_token' });
 * const files = await dropbox.getAllFilesInSharedFolder('https://...');
 * ```
 */
export class DropboxApi {
  private accessToken: string;

  constructor(config: DropboxApiConfig) {
    this.accessToken = config.accessToken;
  }

  // --------------------------------------------------------------------------
  // Private Methods
  // --------------------------------------------------------------------------

  /**
   * Make API request to Dropbox
   */
  private async makeRequest<T>(
    endpoint: string,
    body: object
  ): Promise<T> {
    const response = await fetch(`${DROPBOX_API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dropbox API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Get metadata of a shared link (check if it's a file or folder)
   * 
   * @param sharedUrl - The shared Dropbox URL
   */
  async getSharedLinkMetadata(sharedUrl: string): Promise<DropboxSharedLinkMetadata> {
    return this.makeRequest<DropboxSharedLinkMetadata>(
      '/sharing/get_shared_link_metadata',
      { url: sharedUrl }
    );
  }

  /**
   * List files in a shared folder (single page)
   * 
   * @param sharedUrl - The shared folder URL
   * @param path - Relative path within the shared folder (empty for root)
   */
  async listFilesInSharedFolder(
    sharedUrl: string,
    path: string = ''
  ): Promise<DropboxListFolderResponse> {
    return this.makeRequest<DropboxListFolderResponse>(
      '/files/list_folder',
      {
        path,
        shared_link: { url: sharedUrl },
        recursive: false,
        include_media_info: true,
        include_deleted: false,
      }
    );
  }

  /**
   * Continue listing files (for pagination)
   * 
   * @param cursor - The cursor from previous response
   */
  async listFilesInSharedFolderContinue(
    cursor: string
  ): Promise<DropboxListFolderResponse> {
    return this.makeRequest<DropboxListFolderResponse>(
      '/files/list_folder/continue',
      { cursor }
    );
  }

  /**
   * Get all files from a shared folder (handles pagination automatically)
   * 
   * @param sharedUrl - The shared folder URL
   * @param path - Relative path within the shared folder
   */
  async getAllFilesInSharedFolder(
    sharedUrl: string,
    path: string = ''
  ): Promise<DropboxEntry[]> {
    const allEntries: DropboxEntry[] = [];
    
    // Get initial results
    let response = await this.listFilesInSharedFolder(sharedUrl, path);
    allEntries.push(...response.entries);

    // Continue fetching if there are more results
    while (response.has_more) {
      response = await this.listFilesInSharedFolderContinue(response.cursor);
      allEntries.push(...response.entries);
    }

    return allEntries;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a DropboxApi instance
 * 
 * @param accessToken - Dropbox API access token
 * 
 * @example
 * ```typescript
 * const dropbox = createDropboxApi(process.env.DROPBOX_ACCESS_TOKEN);
 * const metadata = await dropbox.getSharedLinkMetadata('https://...');
 * ```
 */
export function createDropboxApi(accessToken: string): DropboxApi {
  return new DropboxApi({ accessToken });
}
