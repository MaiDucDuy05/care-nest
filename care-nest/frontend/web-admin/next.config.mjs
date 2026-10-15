import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@carenest/shared-types'],
};

export default withNextIntl(nextConfig);
