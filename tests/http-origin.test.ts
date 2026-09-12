import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appOrigin, sameOrigin } from '../lib/http';

test('configured public origin works behind Railway without trusting arbitrary origins', () => {
  const previous = process.env.AUTH_ORIGIN;
  try {
    process.env.AUTH_ORIGIN = 'https://gratitude.example.com';
    const request = new Request('http://0.0.0.0:3005/api/auth', {
      headers: { origin: 'https://gratitude.example.com' },
    });
    assert.doesNotThrow(() => sameOrigin(request));
    assert.equal(appOrigin(request), 'https://gratitude.example.com');
    assert.throws(() => sameOrigin(new Request(request.url, {
      headers: { origin: 'https://attacker.example', 'x-forwarded-host': 'attacker.example' },
    })), /origin is not allowed/);
    delete process.env.AUTH_ORIGIN;
    assert.doesNotThrow(() => sameOrigin(new Request('http://localhost:3005/api/auth', {
      headers: { origin: 'http://localhost:3005' },
    })));
  } finally {
    if (previous === undefined) delete process.env.AUTH_ORIGIN;
    else process.env.AUTH_ORIGIN = previous;
  }
});
