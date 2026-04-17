import { API_ORIGIN } from './constants';

export function resolveAssetUri(path?: string | null, version?: string | number | null) {
  if (!path) return null;

  const base = path.startsWith('http://') || path.startsWith('https://') || path.startsWith('file://') || path.startsWith('content://')
    ? path
    : `${API_ORIGIN}/${String(path).replace(/^\/+/, '')}`;

  if (version === undefined || version === null || version === '') {
    return base;
  }

  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}v=${encodeURIComponent(String(version))}`;
}
