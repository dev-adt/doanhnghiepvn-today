import React, { useEffect } from 'react';

/**
 * SEOHead Component
 * Dynamically manages document title, meta tags, Open Graph (FB/Zalo), Twitter Cards, and JSON-LD Structured Data
 */
const SEOHead = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  publishedAt,
  updatedAt,
  author,
  schemaData
}) => {
  useEffect(() => {
    const defaultSiteName = 'DoanhNghiepVN.today — Tạp chí Doanh Nghiệp Việt Nam | Hệ sinh thái số Kết nối Giao thương & Trợ lý AI';
    const siteUrl = 'https://doanhnghiepvn.today';

    // 1. Set Document Title
    const fullTitle = title ? `${title} | DoanhNghiepVN.today` : defaultSiteName;
    document.title = fullTitle;

    // Helper function to create or update meta tags
    const setMetaTag = (attrName, attrValue, content) => {
      if (!content) return;
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to set link canonical
    const setCanonical = (href) => {
      let element = document.querySelector('link[rel="canonical"]');
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', 'canonical');
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 2. Standard Meta Tags
    const pageDesc = description || 'Hệ sinh thái số Tạp chí Doanh Nghiệp Việt Nam DoanhNghiepVN.today kết nối giao thương, cơ hội đầu tư, tư vấn vay vốn và trợ lý AI cho doanh nghiệp.';
    const pageKeywords = keywords || 'DoanhNghiepVN, doanhnghiepvn today, tạp chí doanh nghiệp việt nam, kết nối giao thương, hội viên doanh nghiệp, trợ lý AI doanh nghiệp';
    const canonicalUrl = url ? (url.startsWith('http') ? url : `${siteUrl}${url}`) : window.location.href;
    const ogImage = image || `${siteUrl}/assets/og-image.jpg`;

    setMetaTag('name', 'description', pageDesc);
    setMetaTag('name', 'keywords', pageKeywords);
    setCanonical(canonicalUrl);

    // 3. Open Graph Tags (Facebook, Zalo, LinkedIn)
    setMetaTag('property', 'og:site_name', 'DoanhNghiepVN.today');
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', pageDesc);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:locale', 'vi_VN');

    // 4. Twitter Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', pageDesc);
    setMetaTag('name', 'twitter:image', ogImage);

    // 5. JSON-LD Schema.org Structured Data
    let schemaElement = document.querySelector('#seo-json-ld');
    if (schemaData) {
      if (!schemaElement) {
        schemaElement = document.createElement('script');
        schemaElement.setAttribute('type', 'application/ld+json');
        schemaElement.setAttribute('id', 'seo-json-ld');
        document.head.appendChild(schemaElement);
      }
      schemaElement.textContent = JSON.stringify(schemaData);
    } else if (schemaElement) {
      schemaElement.remove();
    }

  }, [title, description, keywords, image, url, type, publishedAt, updatedAt, author, schemaData]);

  return null;
};

export default SEOHead;
