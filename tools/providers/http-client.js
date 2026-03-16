'use strict';

const https = require('https');
const http = require('http');

const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Select the correct Node.js http/https module based on the URL scheme.
 * @param {string} url
 * @returns {typeof https | typeof http}
 */
function _moduleFor(url) {
  if (url.startsWith('https://')) return https;
  if (url.startsWith('http://')) return http;
  throw new Error(`Unsupported URL scheme: ${url}`);
}

/**
 * Parse a URL string into { hostname, port, path, protocol }.
 * @param {string} url
 * @returns {{ hostname: string, port: number, path: string, protocol: string }}
 */
function _parseUrl(url) {
  const parsed = new URL(url);
  return {
    hostname: parsed.hostname,
    port: parsed.port
      ? parseInt(parsed.port, 10)
      : parsed.protocol === 'https:' ? 443 : 80,
    path: parsed.pathname + (parsed.search || ''),
    protocol: parsed.protocol,
  };
}

/**
 * Core request executor.
 * @param {string} method - 'GET' | 'POST'
 * @param {string} url
 * @param {string|null} body - Serialised request body (POST only)
 * @param {Record<string, string>} headers
 * @param {number} timeoutMs
 * @returns {Promise<{ statusCode: number, body: string }>}
 */
function _request(method, url, body, headers, timeoutMs) {
  return new Promise((resolve, reject) => {
    const mod = _moduleFor(url);
    const { hostname, port, path } = _parseUrl(url);

    const requestHeaders = Object.assign({}, headers);
    if (body != null) {
      requestHeaders['Content-Length'] = Buffer.byteLength(body).toString();
    }

    const options = {
      hostname,
      port,
      path,
      method,
      headers: requestHeaders,
    };

    const req = mod.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const responseBody = Buffer.concat(chunks).toString('utf8');
        const { statusCode } = res;
        if (statusCode >= 200 && statusCode < 300) {
          resolve({ statusCode, body: responseBody });
        } else {
          const err = new Error(
            `HTTP ${statusCode}: ${responseBody.slice(0, 200)}`
          );
          err.statusCode = statusCode;
          err.body = responseBody;
          reject(err);
        }
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body != null) {
      req.write(body);
    }
    req.end();
  });
}

/**
 * Send a POST request.
 * @param {string} url
 * @param {Record<string, unknown>} body - Will be JSON-serialised
 * @param {Record<string, string>} [headers]
 * @param {number} [timeoutMs]
 * @returns {Promise<{ statusCode: number, body: string }>}
 */
function post(url, body, headers = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const serialised = JSON.stringify(body);
  const mergedHeaders = Object.assign(
    { 'Content-Type': 'application/json' },
    headers
  );
  return _request('POST', url, serialised, mergedHeaders, timeoutMs);
}

/**
 * Send a GET request.
 * @param {string} url
 * @param {Record<string, string>} [headers]
 * @param {number} [timeoutMs]
 * @returns {Promise<{ statusCode: number, body: string }>}
 */
function get(url, headers = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return _request('GET', url, null, headers, timeoutMs);
}

module.exports = { post, get };
