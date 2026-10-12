import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lowkeypedia — Wiki Liên Quân Mobile Việt Nam',
  description:
    'Bách khoa toàn thư mở về Liên Quân Mobile Việt Nam: tiểu sử tuyển thủ, đội tuyển, sự nghiệp và thành tích.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
