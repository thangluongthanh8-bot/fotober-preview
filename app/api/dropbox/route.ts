import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// Dropbox API Route - Server-side token refresh
// ============================================================================

const CONFIG = {
  appKey: process.env.NEXT_PUBLIC_DROPBOX_APP_KEY || '',
  appSecret: process.env.DROPBOX_APP_SECRET || '',
  refreshToken: process.env.DROPBOX_REFRESH_TOKEN || '',
  accessToken: process.env.NEXT_PUBLIC_DROPBOX_ACCESS_TOKEN || '',
  apiUrl: 'https://api.dropboxapi.com/2',
  authUrl: 'https://api.dropboxapi.com/oauth2/token',
};

// Token cache (in-memory, will reset on server restart)
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getValidAccessToken(): Promise<string> {
  // If using old-style permanent token
  if (!CONFIG.refreshToken && CONFIG.accessToken) {
    console.log('[Dropbox API] Using legacy access token');
    return CONFIG.accessToken;
  }

  // Check if cached token is still valid (with 5 min buffer)
  const now = Date.now();
  if (cachedAccessToken && tokenExpiresAt > now + 5 * 60 * 1000) {
    console.log('[Dropbox API] Using cached token');
    return cachedAccessToken;
  }

  // Refresh the token
  console.log('[Dropbox API] Refreshing access token...');

  if (!CONFIG.appKey || !CONFIG.appSecret || !CONFIG.refreshToken) {
    throw new Error('Missing Dropbox OAuth credentials');
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
    console.error('[Dropbox API] Token refresh failed:', error);
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();
  cachedAccessToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in * 1000);

  console.log('[Dropbox API] Token refreshed, expires in', data.expires_in, 'seconds');
  return cachedAccessToken!;
}

async function dropboxPost(endpoint: string, body: object) {
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

  // If token expired during request, retry once
  if (!res.ok && text.includes('expired_access_token')) {
    console.log('[Dropbox API] Token expired mid-request, refreshing...');
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

// ============================================================================
// Route Handlers
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json();

    switch (action) {
      case 'get_folder_info': {
        const result = await dropboxPost('/sharing/get_shared_link_metadata', { url: params.url });
        return NextResponse.json({ success: true, data: { folderName: result.name } });
      }

      case 'list_folders': {
        const result = await dropboxPost('/sharing/list_folders', { limit: 100 });
        return NextResponse.json({ success: true, data: result.entries || [] });
      }

      case 'mount_folder': {
        const result = await dropboxPost('/sharing/mount_folder', { shared_folder_id: params.id });
        return NextResponse.json({ success: true, data: { path: result.path_lower } });
      }

      case 'list_files': {
        const files: any[] = [];
        let cursor = '';
        let hasMore = true;

        const first = await dropboxPost('/files/list_folder', { path: params.path, recursive: true });
        files.push(...first.entries.filter((e: any) => e['.tag'] === 'file'));
        hasMore = first.has_more;
        cursor = first.cursor;

        while (hasMore) {
          const more = await dropboxPost('/files/list_folder/continue', { cursor });
          files.push(...more.entries.filter((e: any) => e['.tag'] === 'file'));
          hasMore = more.has_more;
          cursor = more.cursor;
        }

        return NextResponse.json({ success: true, data: files });
      }

      case 'create_link': {
        try {
          const result = await dropboxPost('/sharing/create_shared_link_with_settings', {
            path: params.path,
            settings: { requested_visibility: 'public' },
          });
          return NextResponse.json({ success: true, data: { url: result.url } });
        } catch (e: any) {
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

      case 'get_account_email': {
        const token = await getValidAccessToken();
        const res = await fetch(`${CONFIG.apiUrl}/users/get_current_account`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        return NextResponse.json({ success: true, data: { email: data.email } });
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
