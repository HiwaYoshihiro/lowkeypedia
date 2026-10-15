import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/** Chặn crawler vào khu vực quản trị và API; trỏ tới sitemap. */
export default function robots(): MetadataRoute.Robots {
  const base = SITE_URL.replace(/\/$/, '');
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin/', '/api/'],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
