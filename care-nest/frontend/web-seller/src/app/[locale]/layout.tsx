import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | CareNest Seller',
    default: 'CareNest Seller',
  },
};

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
