/**
 * Cache lifetime of uploaded photos and videos, in seconds.
 *
 * Supabase's CDN on the free plan is not purged when a file is deleted: it keeps
 * serving its cached copy until max-age runs out. One day bounds how long a removed
 * photo (for example, one a person asked to take down under Ley 25.326) stays
 * reachable by its URL. Paths are never reused, so after a day the CDN only
 * revalidates against Storage; it does not download the file again.
 */
export const UPLOAD_CACHE_CONTROL = String(24 * 60 * 60)
