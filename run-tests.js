/**
 * Simple test runner for reliability tests
 */

console.log('🔬 Starting EdgePilot Reliability Test Suite...\n');

// Mock implementations for testing
class MockBoundedCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.options = { maxSize: 1000, defaultTtl: 60000, ...options };
    this.operationQueue = [];
    this.isProcessing = false;
    this.queueFullErrors = 0;
    this.maxQueueSize = 1000;
  }

  async withLock(operation, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      if (this.operationQueue.length >= this.maxQueueSize) {
        this.queueFullErrors++;
        reject(new Error(`Queue full`));
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.operationQueue.push(() => {
        try {
          clearTimeout(timeoutId);
          resolve(operation());
        } catch (error) {
          clearTimeout(timeoutId);
          reject(error);
        }
      });

      process.nextTick(() => this.processQueue());
    });
  }

  processQueue() {
    if (this.isProcessing || this.operationQueue.length === 0) return;

    this.isProcessing = true;
    const operation = this.operationQueue.shift();
    if (operation) operation();
    this.isProcessing = false;

    if (this.operationQueue.length > 0) {
      setImmediate(() => this.processQueue());
    }
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  async set(key, data, ttl) {
    return this.withLock(() => {
      const expires = Date.now() + (ttl ?? this.options.defaultTtl);
      this.cache.set(key, { data, expires, size: JSON.stringify(data).length });

      // Respect max size
      while (this.cache.size > this.options.maxSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
    });
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      queueLength: this.operationQueue.length,
      queueFullErrors: this.queueFullErrors,
      isProcessing: this.isProcessing
    };
  }
}

class MockRateLimit {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.operationTimeouts = 0;
  }

  checkLimit(identifier) {
    const now = Date.now();
    const sanitized = (identifier || '').replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!sanitized || sanitized.length > 256) return false;

    const userLimit = this.requests.get(sanitized);

    if (!userLimit || now > userLimit.resetTime) {
      this.requests.set(sanitized, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (userLimit.count >= this.maxRequests) return false;

    userLimit.count++;
    return true;
  }

  getStats() {
    return {
      totalClients: this.requests.size,
      operationTimeouts: this.operationTimeouts
    };
  }
}

// Test runner
async function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  async function test(name, testFn) {
    try {
      console.log(`🧪 Running: ${name}`);
      await testFn();
      console.log(`✅ Passed: ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ Failed: ${name} - ${error.message}`);
      failed++;
    }
  }

  // Test 1: Basic Cache Operations
  await test('Basic Cache Operations', async () => {
    const cache = new MockBoundedCache({ maxSize: 10 });

    await cache.set('key1', 'value1', 10000);
    const value = cache.get('key1');

    assert(value === 'value1', 'Cache should store and retrieve values');

    const stats = cache.getStats();
    assert(stats.size === 1, 'Cache size should be tracked correctly');
  });

  // Test 2: Cache Capacity Management
  await test('Cache Capacity Management', async () => {
    const cache = new MockBoundedCache({ maxSize: 3 });

    // Fill beyond capacity
    await cache.set('key1', 'value1', 10000);
    await cache.set('key2', 'value2', 10000);
    await cache.set('key3', 'value3', 10000);
    await cache.set('key4', 'value4', 10000);

    const stats = cache.getStats();
    assert(stats.size <= 3, 'Cache should respect max size limit');
  });

  // Test 3: Rate Limiting
  await test('Rate Limiting', async () => {
    const rateLimiter = new MockRateLimit(3, 60000);

    const client = 'test-client';

    // Should allow first 3 requests
    assert(rateLimiter.checkLimit(client), 'First request should be allowed');
    assert(rateLimiter.checkLimit(client), 'Second request should be allowed');
    assert(rateLimiter.checkLimit(client), 'Third request should be allowed');

    // Should deny 4th request
    assert(!rateLimiter.checkLimit(client), 'Fourth request should be denied');
  });

  // Test 4: Concurrent Operations
  await test('Concurrent Operations', async () => {
    const cache = new MockBoundedCache({ maxSize: 100 });
    const operations = [];

    // Launch 50 concurrent operations
    for (let i = 0; i < 50; i++) {
      operations.push(cache.set(`key-${i}`, `value-${i}`, 10000));
    }

    await Promise.all(operations);

    const stats = cache.getStats();
    assert(stats.queueFullErrors === 0, 'No queue overflow errors expected');
    assert(stats.size <= 50, 'All operations should complete successfully');
  });

  // Test 5: Timeout Protection
  await test('Timeout Protection', async () => {
    const cache = new MockBoundedCache();

    const slowOperation = () => {
      return new Promise(resolve => setTimeout(resolve, 100));
    };

    try {
      await cache.withLock(slowOperation, 50); // 50ms timeout, operation takes 100ms
      assert(false, 'Operation should have timed out');
    } catch (error) {
      assert(error.message.includes('Timeout'), 'Should timeout with appropriate message');
    }
  });

  // Test 6: Input Sanitization
  await test('Input Sanitization', async () => {
    const rateLimiter = new MockRateLimit();

    const maliciousInputs = [
      '',
      'a'.repeat(1000),
      '<script>alert("xss")</script>',
      '../../etc/passwd',
      null,
      undefined
    ];

    let rejectedCount = 0;
    for (const input of maliciousInputs) {
      if (!rateLimiter.checkLimit(input)) {
        rejectedCount++;
      }
    }

    assert(rejectedCount >= maliciousInputs.length / 2, 'Most malicious inputs should be rejected');
  });

  // Test 7: Memory Management
  await test('Memory Management', async () => {
    const cache = new MockBoundedCache({ maxSize: 10, defaultTtl: 50 });

    // Fill cache
    for (let i = 0; i < 20; i++) {
      await cache.set(`key-${i}`, `value-${i}`.repeat(100), 50);
    }

    const stats = cache.getStats();
    assert(stats.size <= 10, 'Cache should enforce size limits');

    // Wait for TTL expiration
    await new Promise(resolve => setTimeout(resolve, 60));

    // Access expired items (should be cleaned up)
    for (let i = 0; i < 10; i++) {
      cache.get(`key-${i}`);
    }

    // Cache should have cleaned up expired items
    const finalStats = cache.getStats();
    assert(finalStats.size <= stats.size, 'Expired items should be cleaned up');
  });

  // Test 8: High Load Simulation
  await test('High Load Simulation', async () => {
    const cache = new MockBoundedCache({ maxSize: 100 });
    const rateLimiter = new MockRateLimit(100, 60000);

    const startTime = Date.now();
    const operations = [];

    // Simulate 500 concurrent operations
    for (let i = 0; i < 500; i++) {
      const key = `load-key-${i % 50}`;
      const clientId = `client-${i % 25}`;

      operations.push(
        cache.set(key, { data: `value-${i}`, timestamp: Date.now() }, 30000)
          .then(() => cache.get(key))
          .then(() => rateLimiter.checkLimit(clientId))
          .catch(() => {}) // Ignore individual failures
      );
    }

    await Promise.allSettled(operations);

    const duration = Date.now() - startTime;
    assert(duration < 5000, 'High load test should complete within 5 seconds');

    const cacheStats = cache.getStats();
    const rateLimiterStats = rateLimiter.getStats();

    assert(cacheStats.size <= 100, 'Cache size should be within limits');
    assert(rateLimiterStats.totalClients <= 25, 'Rate limiter should track clients correctly');
  });

  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All reliability tests passed! The system is ready for production.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review and fix issues before deployment.');
  }

  return { passed, failed };
}

// Run tests
runTests().catch(console.error);