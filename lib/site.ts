/** Thông tin thương hiệu, đọc từ biến môi trường với giá trị mặc định. */
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'LOWKEYPEDIA';
/** Phần đuôi tô vàng trong logo (Lowkey + pedia). */
export const SITE_NAME_TAIL = 'PEDIA';
export const SITE_NAME_HEAD = SITE_NAME.replace(/PEDIA$/i, '');
export const SITE_TAGLINE =
  process.env.NEXT_PUBLIC_SITE_TAGLINE || 'Wiki Liên Quân Mobile Việt Nam';
