import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { calculateShipping, type ShippingOption } from '../handlers/calculate_shipping';

describe('calculateShipping', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should calculate shipping options for Jakarta (local)', async () => {
    const result = await calculateShipping('jakarta', 1);

    // Should return multiple shipping options
    expect(result.length).toBeGreaterThan(0);
    
    // Verify structure of shipping options
    result.forEach(option => {
      expect(option).toHaveProperty('courier');
      expect(option).toHaveProperty('service');
      expect(option).toHaveProperty('cost');
      expect(option).toHaveProperty('estimated_days');
      expect(typeof option.courier).toBe('string');
      expect(typeof option.service).toBe('string');
      expect(typeof option.cost).toBe('number');
      expect(typeof option.estimated_days).toBe('number');
      expect(option.cost).toBeGreaterThan(0);
      expect(option.estimated_days).toBeGreaterThan(0);
    });

    // Should be sorted by cost (cheapest first)
    for (let i = 1; i < result.length; i++) {
      expect(result[i].cost).toBeGreaterThanOrEqual(result[i-1].cost);
    }

    // Local destination should have reasonable costs
    const cheapestOption = result[0];
    expect(cheapestOption.cost).toBeLessThan(15000); // Should be under 15k for 1kg local
  });

  it('should calculate shipping options for remote destination (Jayapura)', async () => {
    const result = await calculateShipping('jayapura', 2);

    expect(result.length).toBeGreaterThan(0);
    
    // Remote destination should be more expensive
    const cheapestOption = result[0];
    expect(cheapestOption.cost).toBeGreaterThan(30000); // Should be more expensive for remote
    
    // Should have longer delivery times for remote destinations
    const expressOptions = result.filter(option => option.service.toLowerCase().includes('express'));
    if (expressOptions.length > 0) {
      expect(expressOptions[0].estimated_days).toBeGreaterThanOrEqual(2); // Express to remote areas takes longer
    }
  });

  it('should handle weight-based pricing correctly', async () => {
    const lightResult = await calculateShipping('bandung', 1);
    const heavyResult = await calculateShipping('bandung', 5);

    // Find same courier/service combinations
    const lightJNE = lightResult.find(option => option.courier === 'JNE' && option.service === 'Regular');
    const heavyJNE = heavyResult.find(option => option.courier === 'JNE' && option.service === 'Regular');

    expect(lightJNE).toBeDefined();
    expect(heavyJNE).toBeDefined();
    
    if (lightJNE && heavyJNE) {
      expect(heavyJNE.cost).toBeGreaterThan(lightJNE.cost);
    }
  });

  it('should apply weight surcharge for heavy packages', async () => {
    const normalResult = await calculateShipping('surabaya', 8);
    const heavyResult = await calculateShipping('surabaya', 15); // Over 10kg threshold

    // Find same courier/service combinations
    const normalOption = normalResult.find(option => option.courier === 'JNE' && option.service === 'Regular');
    const heavyOption = heavyResult.find(option => option.courier === 'JNE' && option.service === 'Regular');

    if (normalOption && heavyOption) {
      // Heavy package should have significant price difference due to surcharge
      const priceDifference = heavyOption.cost - normalOption.cost;
      expect(priceDifference).toBeGreaterThan(5000); // Should include weight surcharge
    }
  });

  it('should handle case-insensitive destination matching', async () => {
    const result1 = await calculateShipping('JAKARTA', 2);
    const result2 = await calculateShipping('jakarta', 2);
    const result3 = await calculateShipping('Jakarta', 2);

    // All should return same results
    expect(result1).toHaveLength(result2.length);
    expect(result2).toHaveLength(result3.length);
    
    // Compare first option costs (should be identical)
    expect(result1[0].cost).toBe(result2[0].cost);
    expect(result2[0].cost).toBe(result3[0].cost);
  });

  it('should use default multiplier for unknown destinations', async () => {
    const result = await calculateShipping('unknown_city_12345', 1);

    expect(result.length).toBeGreaterThan(0);
    
    // Should still return valid options
    result.forEach(option => {
      expect(option.cost).toBeGreaterThan(0);
      expect(option.estimated_days).toBeGreaterThan(0);
    });
  });

  it('should include all major courier services', async () => {
    const result = await calculateShipping('bandung', 2);

    // Extract unique couriers
    const couriers = [...new Set(result.map(option => option.courier))];
    
    // Should include major Indonesian couriers
    expect(couriers).toContain('JNE');
    expect(couriers).toContain('TIKI');
    expect(couriers).toContain('Pos Indonesia');
    
    // Should have multiple services per courier
    const jneServices = result.filter(option => option.courier === 'JNE').length;
    expect(jneServices).toBeGreaterThan(1);
  });

  it('should handle trimmed destination input', async () => {
    const result = await calculateShipping('  jakarta  ', 1); // With spaces

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].cost).toBeGreaterThan(0);
  });

  it('should throw error for invalid weight (zero)', async () => {
    expect(calculateShipping('jakarta', 0)).rejects.toThrow(/weight must be greater than 0/i);
  });

  it('should throw error for negative weight', async () => {
    expect(calculateShipping('jakarta', -5)).rejects.toThrow(/weight must be greater than 0/i);
  });

  it('should throw error for weight exceeding limit', async () => {
    expect(calculateShipping('jakarta', 55)).rejects.toThrow(/weight exceeds maximum limit/i);
  });

  it('should throw error for empty destination', async () => {
    expect(calculateShipping('', 2)).rejects.toThrow(/destination is required/i);
  });

  it('should throw error for whitespace-only destination', async () => {
    expect(calculateShipping('   ', 2)).rejects.toThrow(/destination is required/i);
  });

  it('should have different pricing tiers by destination distance', async () => {
    const localResult = await calculateShipping('jakarta', 2);
    const javaResult = await calculateShipping('bandung', 2);
    const remoteResult = await calculateShipping('makassar', 2);

    // Find same service for comparison
    const localJNE = localResult.find(option => option.courier === 'JNE' && option.service === 'Regular');
    const javaJNE = javaResult.find(option => option.courier === 'JNE' && option.service === 'Regular');
    const remoteJNE = remoteResult.find(option => option.courier === 'JNE' && option.service === 'Regular');

    if (localJNE && javaJNE && remoteJNE) {
      // Prices should increase with distance
      expect(javaJNE.cost).toBeGreaterThan(localJNE.cost);
      expect(remoteJNE.cost).toBeGreaterThan(javaJNE.cost);
      
      // Delivery times should also increase for remote locations
      expect(remoteJNE.estimated_days).toBeGreaterThanOrEqual(javaJNE.estimated_days);
    }
  });
});