import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | CareNest Admin',
    default: 'CareNest Admin Portal',
  },
  description: 'CareNest operations and medical reviewer portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
