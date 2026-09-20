import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',

    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(pl|en|de)/:path*',

    // Enable redirects that add the locale prefix
    // (e.g. `/g/slug` -> `/pl/g/slug`)
    // Wykluczamy api, _next, _vercel, favicon, pliki sw itp.
    '/((?!api|_next|_vercel|sw\\.js|sw\\.ts|.*\\..*).*)'
  ]
};
