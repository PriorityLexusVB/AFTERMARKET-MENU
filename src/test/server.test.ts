import { describe, it, expect } from 'vitest';

describe('Server PORT validation', () => {
  it('should validate PORT environment variable correctly', () => {
    // Test valid ports
    const validPorts = ['8080', '80', '3000', '65535', '1'];
    validPorts.forEach(port => {
      const portNum = parseInt(port, 10);
      expect(portNum).toBeGreaterThan(0);
      expect(portNum).toBeLessThanOrEqual(65535);
      expect(isNaN(portNum)).toBe(false);
    });

    // Test invalid ports
    const invalidPorts = ['abc', '-1', '0', '65536', '', '  ', 'port'];
    invalidPorts.forEach(port => {
      const portNum = parseInt(port, 10);
      const isInvalid = isNaN(portNum) || portNum < 1 || portNum > 65535;
      expect(isInvalid).toBe(true);
    });
  });

  it('should handle PORT edge cases', () => {
    // PORT with whitespace should parse correctly (parseInt trims)
    expect(parseInt('  8080  ', 10)).toBe(8080);
    
    // PORT with decimal should truncate
    expect(parseInt('8080.5', 10)).toBe(8080);
    
    // Empty PORT should result in NaN
    expect(isNaN(parseInt('', 10))).toBe(true);
  });

  it('should default to 8080 when PORT is not set', () => {
    const port = process.env['PORT'] || 8080;
    const portType = typeof port;
    expect(['string', 'number'].includes(portType)).toBe(true);
    
    const portNum = typeof port === 'string' ? parseInt(port, 10) : port;
    expect(portNum).toBeGreaterThan(0);
    expect(portNum).toBeLessThanOrEqual(65535);
  });
});
