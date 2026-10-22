import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JsonLd, breadcrumbJsonLd } from '@/components/JsonLd';

function jsonLdScripts(): HTMLScriptElement[] {
  return Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
}

describe('JsonLd', () => {
  it('render thẻ JSON-LD với @type đúng', () => {
    render(
      <JsonLd
        data={{ '@context': 'https://schema.org', '@type': 'Person', name: 'Lai Bâng' }}
      />
    );

    const scripts = jsonLdScripts();
    expect(scripts).toHaveLength(1);
    expect(JSON.parse(scripts[0].textContent ?? '')).toMatchObject({
      '@type': 'Person',
      name: 'Lai Bâng',
    });
  });

  it('escape </script> để không thoát khỏi thẻ', () => {
    const payload = '</script><script>alert(1)</script>';

    render(<JsonLd data={{ '@type': 'Person', name: payload }} />);

    const scripts = jsonLdScripts();
    expect(scripts).toHaveLength(1);
    expect(scripts[0].textContent).not.toContain('</script>');
    expect(JSON.parse(scripts[0].textContent ?? '').name).toBe(payload);
  });

  it('breadcrumbJsonLd dựng BreadcrumbList đúng thứ tự và URL', () => {
    const data = breadcrumbJsonLd('https://lwkypedia.vercel.app', [
      { name: 'Trang chủ', path: '/' },
      { name: 'Tuyển thủ', path: '/tuyen-thu' },
    ]);

    expect(data).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Trang chủ',
          item: 'https://lwkypedia.vercel.app/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Tuyển thủ',
          item: 'https://lwkypedia.vercel.app/tuyen-thu',
        },
      ],
    });
  });
});
