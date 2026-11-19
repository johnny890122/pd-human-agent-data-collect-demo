// REQ-418: device type of the browser that started a submission, from its request headers.
// `mobileHint` is Chrome's Sec-CH-UA-Mobile header ('?1' on phones); the user agent covers the rest.
export function deviceTypeOf(userAgent = '', mobileHint = '') {
  return mobileHint === '?1' || /Mobi|Android|iPhone|iPad/i.test(userAgent) ? 'mobile' : 'desktop';
}
