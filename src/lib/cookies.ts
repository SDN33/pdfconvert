import Cookies from 'js-cookie';

const COOKIE_NAME = 'markdown-pdf-cookies-accepted';

export function areCookiesAccepted(): boolean {
  return Cookies.get(COOKIE_NAME) === 'true';
}

export function acceptCookies(): void {
  Cookies.set(COOKIE_NAME, 'true', { expires: 365 }); // 1 an
}

export function shouldShowCookieBanner(): boolean {
  return !areCookiesAccepted();
}
