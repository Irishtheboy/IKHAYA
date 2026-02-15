import { Property } from '../types/firebase';
import { generatePropertyUrl } from './seo';

/**
 * Generate XML sitemap content
 */
export const generateSitemap = (properties: Property[]): string => {
  const baseUrl = window.location.origin;
  const now = new Date().toISOString();

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily', lastmod: now },
    { url: '/search', priority: '0.9', changefreq: 'daily', lastmod: now },
    { url: '/login', priority: '0.5', changefreq: 'monthly', lastmod: now },
    { url: '/register', priority: '0.5', changefreq: 'monthly', lastmod: now },
  ];

  const propertyUrls = properties
    .filter((p) => p.status === 'available')
    .map((property) => ({
      url: generatePropertyUrl(property.id, property),
      priority: property.isPremium ? '0.9' : '0.8',
      changefreq: 'weekly',
      lastmod: property.updatedAt || property.createdAt,
    }));

  const allUrls = [...staticPages, ...propertyUrls];

  const urlEntries = allUrls
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod || now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
};

/**
 * Download sitemap as XML file
 */
export const downloadSitemap = (properties: Property[]): void => {
  const sitemapContent = generateSitemap(properties);
  const blob = new Blob([sitemapContent], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sitemap.xml';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
