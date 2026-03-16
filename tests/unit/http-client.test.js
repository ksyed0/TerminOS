'use strict';

const EventEmitter = require('events');

// Must be hoisted before any require of the modules under test
jest.mock('https');
jest.mock('http');

const https = require('https');
const http = require('http');
const { post, get } = require('../../tools/providers/http-client');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockReq() {
  const req = {
    write: jest.fn(),
    end: jest.fn(),
    destroy: jest.fn(),
    setTimeout: jest.fn(),
    on: jest.fn().mockReturnThis(),
  };
  return req;
}

/**
 * Configure mod.request so that calling req.end() triggers an async response
 * (success) or an async network error.
 */
function setupMockRequest(mod, { statusCode, responseBody = '', networkError = null } = {}) {
  const req = makeMockReq();

  // When req.destroy(err) is called (e.g. on timeout), emit the error event.
  req.destroy = jest.fn((err) => {
    const errorEntry = req.on.mock.calls.find((c) => c[0] === 'error');
    if (errorEntry && err) errorEntry[1](err);
  });

  let resCallback;
  mod.request = jest.fn((options, callback) => {
    resCallback = callback;
    return req;
  });

  // Trigger response/error after req.end() is called (all handlers are registered by then)
  req.end = jest.fn(() => {
    setImmediate(() => {
      if (networkError) {
        const errorEntry = req.on.mock.calls.find((c) => c[0] === 'error');
        if (errorEntry) errorEntry[1](networkError);
      } else {
        const res = new EventEmitter();
        res.statusCode = statusCode;
        resCallback(res);
        setImmediate(() => {
          res.emit('data', Buffer.from(responseBody));
          res.emit('end');
        });
      }
    });
  });

  return req;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('http-client', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---- post() ----

  describe('post()', () => {
    it('resolves with statusCode and body on 2xx', async () => {
      setupMockRequest(https, { statusCode: 200, responseBody: '{"ok":true}' });
      const result = await post('https://example.com/api', { foo: 'bar' });
      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('{"ok":true}');
    });

    it('rejects with error.statusCode on non-2xx', async () => {
      setupMockRequest(https, { statusCode: 401, responseBody: '{"error":"unauthorized"}' });
      const err = await post('https://example.com/api', {}).catch((e) => e);
      expect(err.statusCode).toBe(401);
    });

    it('rejects on connection refused (network error)', async () => {
      const connErr = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:443'), {
        code: 'ECONNREFUSED',
      });
      setupMockRequest(https, { networkError: connErr });
      await expect(post('https://example.com/api', {})).rejects.toThrow('ECONNREFUSED');
    });

    it('adds Content-Type: application/json header', async () => {
      setupMockRequest(https, { statusCode: 200, responseBody: '{}' });
      await post('https://example.com/api', { data: 1 });
      const [options] = https.request.mock.calls[0];
      expect(options.headers['Content-Type']).toBe('application/json');
    });

    it('routes https:// to https module', async () => {
      setupMockRequest(https, { statusCode: 200, responseBody: '{}' });
      await post('https://example.com/api', {});
      expect(https.request).toHaveBeenCalledTimes(1);
      expect(http.request).not.toHaveBeenCalled();
    });
  });

  // ---- get() ----

  describe('get()', () => {
    it('resolves with statusCode and body on 2xx', async () => {
      setupMockRequest(https, { statusCode: 200, responseBody: '{"items":[]}' });
      const result = await get('https://example.com/items');
      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('{"items":[]}');
    });

    it('routes http:// to http module', async () => {
      setupMockRequest(http, { statusCode: 200, responseBody: '{}' });
      await get('http://localhost:11434/api/tags');
      expect(http.request).toHaveBeenCalledTimes(1);
      expect(https.request).not.toHaveBeenCalled();
    });

    it('rejects on non-2xx', async () => {
      setupMockRequest(https, { statusCode: 404, responseBody: 'not found' });
      const err = await get('https://example.com/missing').catch((e) => e);
      expect(err.statusCode).toBe(404);
    });

    it('rejects on timeout', async () => {
      // Use a bare mock req so the response never naturally resolves
      const req = makeMockReq();
      req.destroy = jest.fn((err) => {
        const errorEntry = req.on.mock.calls.find((c) => c[0] === 'error');
        if (errorEntry && err) errorEntry[1](err);
      });
      https.request = jest.fn(() => req);

      // Promise executor runs synchronously → req.setTimeout is called synchronously
      const promise = get('https://example.com/slow', {}, 100);

      expect(req.setTimeout).toHaveBeenCalled();
      const [, timeoutCb] = req.setTimeout.mock.calls[0];
      timeoutCb(); // → req.destroy(new Error('timed out…')) → error handler → reject

      await expect(promise).rejects.toThrow('timed out');
    });
  });
});
