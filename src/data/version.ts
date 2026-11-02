/**
 * Asks the MBR API for the version of this website's project list: a few bytes, checked before the list held in memory
 * is used. Sent with Node's own http client on purpose: Next.js neither caches it nor counts it, so the answer is always
 * the current one and pages stay static. Null when the API cannot say (not reachable, or an API without this address).
 */
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

export function askVersion(base: string, key: string, timeoutMs = 4000): Promise<string | null> {
  return new Promise((resolve) => {
    let url: URL;
    try {
      url = new URL(`${base}/v1/public/catalogue/version`);
    } catch {
      resolve(null);
      return;
    }
    const send = url.protocol === 'http:' ? httpRequest : httpsRequest;
    const req = send(url, { method: 'GET', headers: { 'X-Site-Key': key, Accept: 'application/json' }, timeout: timeoutMs }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        resolve(null);
        return;
      }
      let text = '';
      res.setEncoding('utf8');
      res.on('data', (chunk: string) => {
        text += chunk;
        if (text.length > 4096) req.destroy();
      });
      res.on('end', () => {
        try {
          const version = (JSON.parse(text) as { version?: unknown }).version;
          resolve(typeof version === 'string' && /^[0-9a-f]{8,64}$/.test(version) ? version : null);
        } catch {
          resolve(null);
        }
      });
      res.on('error', () => resolve(null));
    });
    req.on('timeout', () => req.destroy());
    req.on('error', () => resolve(null));
    req.end();
  });
}
