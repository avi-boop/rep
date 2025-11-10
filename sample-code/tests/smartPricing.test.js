// tests/smartPricing.test.js
// Unit tests for Smart Pricing Service

const SmartPricingService = require('../services/smartPricingService');
const { Device, Pricing, RepairType } = require('../models');

// Mock database
jest.mock('../models');

describe('Smart Pricing Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('estimatePrice', () => {
    test('should return existing confirmed price', async () => {
      // Mock device
      Device.findByPk.mockResolvedValue({
        id: 1,
        brand: 'Apple',
        model: 'iPhone 13',
        releaseDate: '2021-09-24'
      });

      // Mock existing price
      Pricing.findOne.mockResolvedValue({
        sellingPrice: 249.99,
        isEstimated: false
      });

      const result = await SmartPricingService.estimatePrice(1, 1, 'original');

      expect(result.price).toBe(249.99);
      expect(result.confidence).toBe(100);
      expect(result.isEstimate).toBe(false);
    });

    test('should interpolate between two known prices', async () => {
      // Mock device (iPhone 12)
      Device.findByPk.mockResolvedValue({
        id: 2,
        brand: 'Apple',
        model: 'iPhone 12',
        modelYear: 2020,
        releaseDate: '2020-10-23'
      });

      // Mock no existing price
      Pricing.findOne.mockResolvedValue(null);

      // Mock similar prices (iPhone 11 and iPhone 13)
      const mockPrices = [
        {
          device: {
            toJSON: () => ({
              id: 3,
              brand: 'Apple',
              model: 'iPhone 11',
              modelYear: 2019,
              releaseDate: '2019-09-20'
            })
          },
          sellingPrice: 199.99,
          costPrice: 120.00
        },
        {
          device: {
            toJSON: () => ({
              id: 1,
              brand: 'Apple',
              model: 'iPhone 13',
              modelYear: 2021,
              releaseDate: '2021-09-24'
            })
          },
          sellingPrice: 249.99,
          costPrice: 150.00
        }
      ];

      Pricing.findAll.mockResolvedValue(mockPrices);

      const result = await SmartPricingService.estimatePrice(2, 1, 'original');

      // Price should be between 199.99 and 249.99
      expect(result.price).toBeGreaterThan(199.99);
      expect(result.price).toBeLessThan(249.99);
      expect(result.confidence).toBeGreaterThanOrEqual(75);
      expect(result.confidence).toBeLessThanOrEqual(95);
      expect(result.isEstimate).toBe(true);
      expect(result.basedOn).toHaveLength(2);
    });

    test('should extrapolate from one known price', async () => {
      // Mock device (iPhone 14)
      Device.findByPk.mockResolvedValue({
        id: 4,
        brand: 'Apple',
        model: 'iPhone 14',
        modelYear: 2022,
        releaseDate: '2022-09-16'
      });

      Pricing.findOne.mockResolvedValue(null);

      // Mock one similar price (iPhone 13)
      const mockPrices = [
        {
          device: {
            toJSON: () => ({
              id: 1,
              brand: 'Apple',
              model: 'iPhone 13',
              modelYear: 2021,
              releaseDate: '2021-09-24'
            })
          },
          sellingPrice: 249.99,
          costPrice: 150.00
        }
      ];

      Pricing.findAll.mockResolvedValue(mockPrices);

      const result = await SmartPricingService.estimatePrice(4, 1, 'original');

      // Price should be higher than iPhone 13 (newer model)
      expect(result.price).toBeGreaterThan(249.99);
      expect(result.confidence).toBeGreaterThanOrEqual(55);
      expect(result.confidence).toBeLessThanOrEqual(75);
      expect(result.isEstimate).toBe(true);
      expect(result.basedOn).toHaveLength(1);
    });

    test('should return null for no reference prices', async () => {
      Device.findByPk.mockResolvedValue({
        id: 5,
        brand: 'Google',
        model: 'Pixel 8',
        modelYear: 2023,
        releaseDate: '2023-10-04'
      });

      Pricing.findOne.mockResolvedValue(null);
      Pricing.findAll.mockResolvedValue([]);

      const result = await SmartPricingService.estimatePrice(5, 1, 'original');

      expect(result.price).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.isEstimate).toBe(true);
    });

    test('should use brand average as fallback', async () => {
      Device.findByPk.mockResolvedValue({
        id: 6,
        brand: 'Samsung',
        model: 'Galaxy S20',
        modelYear: 2020,
        releaseDate: '2020-03-06'
      });

      Pricing.findOne.mockResolvedValue(null);

      // Mock multiple prices but none match date criteria for interpolation
      const mockPrices = [
        {
          device: {
            toJSON: () => ({
              id: 7,
              brand: 'Samsung',
              model: 'Galaxy S21',
              modelYear: 2021,
              releaseDate: '2021-01-29'
            })
          },
          sellingPrice: 229.99
        },
        {
          device: {
            toJSON: () => ({
              id: 8,
              brand: 'Samsung',
              model: 'Galaxy S22',
              modelYear: 2022,
              releaseDate: '2022-02-25'
            })
          },
          sellingPrice: 259.99
        }
      ];

      Pricing.findAll.mockResolvedValue(mockPrices);

      const result = await SmartPricingService.estimatePrice(6, 1, 'original');

      // Should extrapolate from S21 (next model after S20)
      expect(result.price).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(35);
      expect(result.isEstimate).toBe(true);
    });
  });

  describe('interpolatePrice', () => {
    test('should correctly interpolate price', () => {
      const beforeModel = {
        releaseDate: '2020-01-01',
        sellingPrice: 200
      };

      const afterModel = {
        releaseDate: '2022-01-01',
        sellingPrice: 300
      };

      const targetDevice = {
        releaseDate: '2021-01-01' // Exactly in middle
      };

      const result = SmartPricingService.interpolatePrice(
        beforeModel,
        afterModel,
        targetDevice
      );

      // Should be approximately 250 (middle point)
      expect(result).toBeCloseTo(250, 0);
    });

    test('should handle closer to start date', () => {
      const beforeModel = {
        releaseDate: '2020-01-01',
        sellingPrice: 200
      };

      const afterModel = {
        releaseDate: '2022-01-01',
        sellingPrice: 300
      };

      const targetDevice = {
        releaseDate: '2020-06-01' // Closer to start
      };

      const result = SmartPricingService.interpolatePrice(
        beforeModel,
        afterModel,
        targetDevice
      );

      // Should be closer to 200 than 300
      expect(result).toBeLessThan(250);
      expect(result).toBeGreaterThan(200);
    });
  });

  describe('extrapolatePrice', () => {
    test('should increase price for newer models', () => {
      const referenceModel = {
        modelYear: 2020,
        releaseDate: '2020-09-01',
        sellingPrice: 200
      };

      const targetDevice = {
        modelYear: 2022,
        releaseDate: '2022-09-01'
      };

      const result = SmartPricingService.extrapolatePrice(
        referenceModel,
        targetDevice,
        true // isBefore
      );

      // Should be higher than reference (2 years newer)
      expect(result).toBeGreaterThan(200);
    });

    test('should decrease price for older models', () => {
      const referenceModel = {
        modelYear: 2022,
        releaseDate: '2022-09-01',
        sellingPrice: 250
      };

      const targetDevice = {
        modelYear: 2020,
        releaseDate: '2020-09-01'
      };

      const result = SmartPricingService.extrapolatePrice(
        referenceModel,
        targetDevice,
        false // isAfter
      );

      // Should be lower than reference (2 years older)
      expect(result).toBeLessThan(250);
    });
  });

  describe('calculateConfidence', () => {
    test('should return high confidence for interpolation', () => {
      const model1 = {
        releaseDate: '2020-01-01'
      };

      const model2 = {
        releaseDate: '2021-01-01'
      };

      const target = {
        releaseDate: '2020-06-01'
      };

      const confidence = SmartPricingService.calculateConfidence(
        model1,
        model2,
        target,
        'interpolation'
      );

      expect(confidence).toBeGreaterThanOrEqual(75);
      expect(confidence).toBeLessThanOrEqual(95);
    });

    test('should return lower confidence for extrapolation', () => {
      const model1 = {
        modelYear: 2020,
        releaseDate: '2020-01-01'
      };

      const target = {
        modelYear: 2021,
        releaseDate: '2021-01-01'
      };

      const confidence = SmartPricingService.calculateConfidence(
        model1,
        null,
        target,
        'extrapolation'
      );

      expect(confidence).toBeLessThan(75);
      expect(confidence).toBeGreaterThanOrEqual(35);
    });
  });

  describe('calculateAverage', () => {
    test('should calculate correct average', () => {
      const prices = [
        { sellingPrice: 100 },
        { sellingPrice: 200 },
        { sellingPrice: 300 }
      ];

      const avg = SmartPricingService.calculateAverage(prices);

      expect(avg).toBe(200);
    });

    test('should handle empty array', () => {
      const avg = SmartPricingService.calculateAverage([]);
      expect(avg).toBe(0);
    });

    test('should handle numeric array', () => {
      const prices = [100, 200, 300];
      const avg = SmartPricingService.calculateAverage(prices);
      expect(avg).toBe(200);
    });
  });

  describe('applyMarketAdjustments', () => {
    test('should apply Apple premium', () => {
      const device = {
        brand: 'Apple'
      };

      const adjusted = SmartPricingService.applyMarketAdjustments(
        200,
        device,
        'original'
      );

      expect(adjusted).toBeGreaterThan(200);
    });

    test('should not adjust for non-premium brands', () => {
      const device = {
        brand: 'Samsung'
      };

      const adjusted = SmartPricingService.applyMarketAdjustments(
        200,
        device,
        'original'
      );

      expect(adjusted).toBe(200);
    });
  });
});

// Integration test
describe('Smart Pricing Integration', () => {
  test('full pricing workflow', async () => {
    // This would test the full workflow with a real database
    // Mock setup would go here for integration testing
  });
});
