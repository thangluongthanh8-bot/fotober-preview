import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// Dropbox API Route - Optimized for performance
// ============================================================================

const CONFIG = {
  appKey: process.env.NEXT_PUBLIC_DROPBOX_APP_KEY || '',
  appSecret: process.env.DROPBOX_APP_SECRET || '',
  refreshToken: process.env.DROPBOX_REFRESH_TOKEN || '',
  accessToken: process.env.NEXT_PUBLIC_DROPBOX_ACCESS_TOKEN || '',
  apiUrl: 'https://api.dropboxapi.com/2',
  authUrl: 'https://api.dropboxapi.com/oauth2/token',
};

// Token cache (in-memory)
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

// Response cache for frequently accessed data
const responseCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

// ============================================================================
// Helper Functions
// ============================================================================

async function getValidAccessToken(): Promise<string> {
  // Use legacy token if available
  if (!CONFIG.refreshToken && CONFIG.accessToken) {
    return CONFIG.accessToken;
  }

  // Return cached token if still valid (5 min buffer)
  const now = Date.now();
  if (cachedAccessToken && tokenExpiresAt > now + 5 * 60 * 1000) {
    return cachedAccessToken;
  }

  // Validate credentials before refresh
  if (!CONFIG.appKey || !CONFIG.appSecret || !CONFIG.refreshToken) {
    throw new Error('Missing Dropbox OAuth credentials');
  }

  // Refresh token
  const response = await fetch(CONFIG.authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: CONFIG.refreshToken,
      client_id: CONFIG.appKey,
      client_secret: CONFIG.appSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await response.json();
  cachedAccessToken = data.access_token;
  tokenExpiresAt = now + data.expires_in * 1000;

  return cachedAccessToken!;
}

async function dropboxPost(endpoint: string, body: object): Promise<any> {
  const token = await getValidAccessToken();
  
  const res = await fetch(`${CONFIG.apiUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  // Retry once if token expired mid-request
  if (!res.ok && text.includes('expired_access_token')) {
    cachedAccessToken = null;
    tokenExpiresAt = 0;
    const newToken = await getValidAccessToken();
    
    const retryRes = await fetch(`${CONFIG.apiUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${newToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const retryText = await retryRes.text();
    if (!retryRes.ok) throw new Error(retryText);
    return retryText ? JSON.parse(retryText) : {};
  }

  if (!res.ok) throw new Error(text);
  return text ? JSON.parse(text) : {};
}

// Get from cache or fetch
function getCached<T>(key: string): T | null {
  const cached = responseCache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T;
  }
  responseCache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  responseCache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

// ============================================================================
// Route Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json();

    // Early validation
    if (!action) {
      return NextResponse.json({ success: false, error: 'Missing action' }, { status: 400 });
    }

    switch (action) {
      // Get folder info with caching
      case 'get_folder_info': {
        if (!params.url) {
          return NextResponse.json({ success: false, error: 'Missing URL' }, { status: 400 });
        }
        
        const cacheKey = `folder_info:${params.url}`;
        let result = getCached<any>(cacheKey);
        
        if (!result) {
          result = await dropboxPost('/sharing/get_shared_link_metadata', { url: params.url });
          setCache(cacheKey, result);
        }
        
        return NextResponse.json({ success: true, data: { folderName: result.name } });
      }

      // List folders
      case 'list_folders': {
        const result = await dropboxPost('/sharing/list_folders', { limit: 100 });
        return NextResponse.json({ success: true, data: result.entries || [] });
      }

      // Mount folder
      case 'mount_folder': {
        if (!params.id) {
          return NextResponse.json({ success: false, error: 'Missing folder ID' }, { status: 400 });
        }
        const result = await dropboxPost('/sharing/mount_folder', { shared_folder_id: params.id });
        return NextResponse.json({ success: true, data: { path: result.path_lower } });
      }

      // List files - optimized with higher limit
      case 'list_files': {
        if (!params.path) {
          return NextResponse.json({ success: false, error: 'Missing path' }, { status: 400 });
        }

        const files: any[] = [];
        
        // Request more items per batch for fewer round trips
        const first = await dropboxPost('/files/list_folder', { 
          path: params.path, 
          recursive: true,
          limit: 2000,  // Max allowed by Dropbox
        });
        
        files.push(...first.entries.filter((e: any) => e['.tag'] === 'file'));

        // Continue pagination if needed
        let hasMore = first.has_more;
        let cursor = first.cursor;

        while (hasMore) {
          const more = await dropboxPost('/files/list_folder/continue', { cursor });
          files.push(...more.entries.filter((e: any) => e['.tag'] === 'file'));
          hasMore = more.has_more;
          cursor = more.cursor;
        }

        return NextResponse.json({ success: true, data: files });
      }

      // Create link with fallback
      case 'create_link': {
        if (!params.path) {
          return NextResponse.json({ success: false, error: 'Missing path' }, { status: 400 });
        }

        try {
          const result = await dropboxPost('/sharing/create_shared_link_with_settings', {
            path: params.path,
            settings: { requested_visibility: 'public' },
          });
          return NextResponse.json({ success: true, data: { url: result.url } });
        } catch (e: any) {
          // If link already exists, get existing one
          if (e.message.includes('shared_link_already_exists')) {
            const existing = await dropboxPost('/sharing/list_shared_links', {
              path: params.path,
              direct_only: true,
            });
            if (existing.links?.length > 0) {
              return NextResponse.json({ success: true, data: { url: existing.links[0].url } });
            }
          }
          throw e;
        }
      }

      // Get account email
      case 'get_account_email': {
        const cacheKey = 'account_email';
        let email = getCached<string>(cacheKey);
        
        if (!email) {
          const token = await getValidAccessToken();
          const res = await fetch(`${CONFIG.apiUrl}/users/get_current_account`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          email = data.email;
          setCache(cacheKey, email);
        }
        
        return NextResponse.json({ success: true, data: { email } });
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Dropbox API] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
