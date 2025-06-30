import React from 'react'
import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
  canonical?: string
  robots?: string
  openGraph?: {
    title?: string
    description?: string
    image?: string
    type?: string
  }
}

const SEOComponent: React.FC<SEOProps> = ({
  title = 'Thionl - Hệ thống kiểm tra trực tuyến thông minh với AI',
  description = 'Nền tảng thi trực tuyến thông minh với AI, tạo đề thi tự động, chống gian lận và phân tích học tập cá nhân hóa',
  canonical,
  robots = 'index, follow',
  openGraph
}) => {
  const baseUrl = 'https://thionl.site'

  // Chuẩn hóa URL để tránh duplicate content
  const normalizeUrl = (url: string): string => {
    try {
      const urlObj = new URL(url)
      // Loại bỏ trailing slash (trừ root path)
      if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
        urlObj.pathname = urlObj.pathname.slice(0, -1)
      }
      // Đảm bảo protocol là HTTPS
      urlObj.protocol = 'https:'
      return urlObj.toString()
    } catch {
      return url
    }
  }

  // Tạo canonical URL chính xác
  const getCanonicalUrl = (): string => {
    if (canonical) {
      return normalizeUrl(canonical)
    }

    // Lấy full URL hiện tại (bao gồm cả query params nếu cần)
    const currentPath = window.location.pathname
    const currentUrl = `${baseUrl}${currentPath}`

    return normalizeUrl(currentUrl)
  }

  const canonicalUrl = getCanonicalUrl()
  const finalTitle = title.length > 60 ? title.substring(0, 57) + '...' : title
  const finalDescription = description.length > 160 ? description.substring(0, 157) + '...' : description

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name='description' content={finalDescription} />
      <meta name='robots' content={robots} />

      {/* Viewport for mobile */}
      <meta name='viewport' content='width=device-width, initial-scale=1.0' />

      {/* Language */}
      <html lang='vi' />

      {/* Canonical URL - CHỈ dùng Helmet, không dùng useEffect */}
      <link rel='canonical' href={canonicalUrl} />

      {/* Preconnect for performance */}
      <link rel='preconnect' href='https://fonts.googleapis.com' />
      <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />

      {/* Open Graph / Facebook */}
      <meta property='og:type' content={openGraph?.type || 'website'} />
      <meta property='og:url' content={canonicalUrl} />
      <meta property='og:title' content={openGraph?.title || finalTitle} />
      <meta property='og:description' content={openGraph?.description || finalDescription} />
      <meta property='og:image' content={openGraph?.image || `${baseUrl}/og-image.png`} />
      <meta property='og:site_name' content='Thionl' />
      <meta property='og:locale' content='vi_VN' />

      {/* Twitter */}
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:url' content={canonicalUrl} />
      <meta name='twitter:title' content={openGraph?.title || finalTitle} />
      <meta name='twitter:description' content={openGraph?.description || finalDescription} />
      <meta name='twitter:image' content={openGraph?.image || `${baseUrl}/og-image.png`} />
      <meta name='twitter:site' content='@thionl' />

      {/* Additional SEO Meta Tags */}
      <meta name='author' content='Thionl Team' />
      <meta name='keywords' content='thi trực tuyến, AI giáo dục, kiểm tra online, hệ thống thi, chống gian lận' />

      {/* Favicon */}
      <link rel='icon' type='image/x-icon' href='/favicon.ico' />
      <link rel='apple-touch-icon' sizes='180x180' href='/apple-touch-icon.png' />
      <link rel='icon' type='image/png' sizes='32x32' href='/favicon-32x32.png' />
      <link rel='icon' type='image/png' sizes='16x16' href='/favicon-16x16.png' />

      {/* Structured Data */}
      <script type='application/ld+json'>
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Thionl',
          description: finalDescription,
          url: baseUrl,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${baseUrl}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        })}
      </script>
    </Helmet>
  )
}

export default SEOComponent
