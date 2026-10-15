import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | CareNest',
    default: 'CareNest — TMĐT Y Tế & Giám Sát Sức Khỏe IoT',
  },
};

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
