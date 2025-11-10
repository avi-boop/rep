// services/smartPricingService.js
// Smart Pricing Algorithm Implementation

const { Device, Pricing, RepairType } = require('../models');
const { Op } = require('sequelize');

class SmartPricingService {
  /**
   * Estimate price for a device repair when no fixed price exists
   * @param {number} deviceId - Device ID
   * @param {number} repairTypeId - Repair Type ID
   * @param {string} partQuality - 'original' or 'aftermarket'
   * @returns {Object} { price, confidence, basedOn, reasoning }
   */
  async estimatePrice(deviceId, repairTypeId, partQuality = 'original') {
    try {
      // Get device details
      const device = await Device.findByPk(deviceId);
      
      if (!device) {
        throw new Error('Device not found');
      }

      // Check if price already exists
      const existingPrice = await Pricing.findOne({
        where: {
          deviceId,
          repairTypeId,
          partQuality,
          isActive: true
        }
      });

      if (existingPrice && !existingPrice.isEstimated) {
        // Price already exists and is confirmed
        return {
          price: parseFloat(existingPrice.sellingPrice),
          confidence: 100,
          basedOn: [],
          reasoning: 'Fixed price exists',
          isEstimate: false
        };
      }

      // Get all prices for same brand, repair type, and part quality
      const similarPrices = await this.getSimilarPrices(
        device.brand,
        repairTypeId,
        partQuality
      );

      if (similarPrices.length === 0) {
        // No similar prices found, try same repair type across all brands
        const allPrices = await this.getRepairTypePrices(repairTypeId, partQuality);
        
        if (allPrices.length === 0) {
          return {
            price: null,
            confidence: 0,
            basedOn: [],
            reasoning: 'No reference prices found',
            isEstimate: true
          };
        }

        // Use average price with low confidence
        const avgPrice = this.calculateAverage(allPrices);
        return {
          price: Math.round(avgPrice * 100) / 100,
          confidence: 35,
          basedOn: [{
            source: 'Industry average',
            price: avgPrice,
            count: allPrices.length
          }],
          reasoning: 'Based on average price across all brands',
          isEstimate: true
        };
      }

      // Find nearest models (before and after)
      const beforeModel = this.findNearestBefore(device, similarPrices);
      const afterModel = this.findNearestAfter(device, similarPrices);

      let estimatedPrice;
      let confidence;
      let basedOn = [];
      let reasoning;

      if (beforeModel && afterModel) {
        // BEST CASE: Linear interpolation between two models
        estimatedPrice = this.interpolatePrice(beforeModel, afterModel, device);
        confidence = this.calculateConfidence(beforeModel, afterModel, device, 'interpolation');
        basedOn = [
          {
            device: `${beforeModel.brand} ${beforeModel.model}`,
            price: parseFloat(beforeModel.sellingPrice),
            releaseDate: beforeModel.releaseDate
          },
          {
            device: `${afterModel.brand} ${afterModel.model}`,
            price: parseFloat(afterModel.sellingPrice),
            releaseDate: afterModel.releaseDate
          }
        ];
        reasoning = `Interpolated between ${beforeModel.model} and ${afterModel.model}`;
        
      } else if (beforeModel || afterModel) {
        // GOOD CASE: Extrapolation from one model
        const referenceModel = beforeModel || afterModel;
        const isBefore = !!beforeModel;
        
        estimatedPrice = this.extrapolatePrice(referenceModel, device, isBefore);
        confidence = this.calculateConfidence(referenceModel, null, device, 'extrapolation');
        basedOn = [{
          device: `${referenceModel.brand} ${referenceModel.model}`,
          price: parseFloat(referenceModel.sellingPrice),
          releaseDate: referenceModel.releaseDate
        }];
        reasoning = `Extrapolated from ${referenceModel.model} (${isBefore ? 'older' : 'newer'} model)`;
        
      } else {
        // FALLBACK: Use average of similar devices
        const avgPrice = this.calculateAverage(similarPrices);
        estimatedPrice = avgPrice;
        confidence = 45;
        basedOn = [{
          source: `${device.brand} average`,
          price: avgPrice,
          count: similarPrices.length
        }];
        reasoning = `Based on average of ${similarPrices.length} ${device.brand} models`;
      }

      // Apply quality and market adjustments
      const adjustedPrice = this.applyMarketAdjustments(
        estimatedPrice,
        device,
        partQuality
      );

      return {
        price: Math.round(adjustedPrice * 100) / 100,
        confidence,
        basedOn,
        reasoning,
        isEstimate: true
      };

    } catch (error) {
      console.error('Smart Pricing Error:', error);
      throw error;
    }
  }

  /**
   * Get similar prices from same brand
   */
  async getSimilarPrices(brand, repairTypeId, partQuality) {
    const prices = await Pricing.findAll({
      where: {
        repairTypeId,
        partQuality,
        isActive: true,
        isEstimated: false
      },
      include: [{
        model: Device,
        as: 'device',
        where: {
          brand,
          isActive: true
        },
        attributes: ['id', 'brand', 'model', 'modelYear', 'releaseDate']
      }],
      order: [[{ model: Device, as: 'device' }, 'releaseDate', 'ASC']]
    });

    return prices.map(p => ({
      ...p.device.toJSON(),
      sellingPrice: p.sellingPrice,
      costPrice: p.costPrice
    }));
  }

  /**
   * Get all prices for a repair type (across brands)
   */
  async getRepairTypePrices(repairTypeId, partQuality) {
    const prices = await Pricing.findAll({
      where: {
        repairTypeId,
        partQuality,
        isActive: true,
        isEstimated: false
      },
      attributes: ['sellingPrice']
    });

    return prices.map(p => parseFloat(p.sellingPrice));
  }

  /**
   * Find nearest model released before target device
   */
  findNearestBefore(targetDevice, priceList) {
    if (!targetDevice.releaseDate) return null;

    const targetDate = new Date(targetDevice.releaseDate);
    
    return priceList
      .filter(p => p.releaseDate && new Date(p.releaseDate) < targetDate)
      .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))[0] || null;
  }

  /**
   * Find nearest model released after target device
   */
  findNearestAfter(targetDevice, priceList) {
    if (!targetDevice.releaseDate) return null;

    const targetDate = new Date(targetDevice.releaseDate);
    
    return priceList
      .filter(p => p.releaseDate && new Date(p.releaseDate) > targetDate)
      .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate))[0] || null;
  }

  /**
   * Interpolate price between two models
   */
  interpolatePrice(beforeModel, afterModel, targetDevice) {
    const beforeDate = new Date(beforeModel.releaseDate).getTime();
    const afterDate = new Date(afterModel.releaseDate).getTime();
    const targetDate = new Date(targetDevice.releaseDate).getTime();

    // Calculate position ratio (0 to 1)
    const ratio = (targetDate - beforeDate) / (afterDate - beforeDate);

    const beforePrice = parseFloat(beforeModel.sellingPrice);
    const afterPrice = parseFloat(afterModel.sellingPrice);

    // Linear interpolation
    return beforePrice + (afterPrice - beforePrice) * ratio;
  }

  /**
   * Extrapolate price from single reference model
   */
  extrapolatePrice(referenceModel, targetDevice, isBefore) {
    const referencePrice = parseFloat(referenceModel.sellingPrice);
    
    // Calculate year difference
    const refYear = referenceModel.modelYear || 
                    new Date(referenceModel.releaseDate).getFullYear();
    const targetYear = targetDevice.modelYear || 
                       new Date(targetDevice.releaseDate).getFullYear();
    
    const yearDiff = Math.abs(targetYear - refYear);

    // Apply 8% price change per year (industry standard)
    const yearlyFactor = 0.08;
    let adjustmentFactor;

    if (isBefore) {
      // Target is newer than reference
      adjustmentFactor = 1 + (yearDiff * yearlyFactor);
    } else {
      // Target is older than reference
      adjustmentFactor = 1 - (yearDiff * yearlyFactor);
    }

    return referencePrice * adjustmentFactor;
  }

  /**
   * Calculate confidence score (0-100)
   */
  calculateConfidence(model1, model2, targetDevice, method) {
    let baseConfidence;

    if (method === 'interpolation') {
      // High confidence for interpolation
      baseConfidence = 85;

      // Reduce confidence if time gap is large
      const beforeDate = new Date(model1.releaseDate);
      const afterDate = new Date(model2.releaseDate);
      const monthsGap = (afterDate - beforeDate) / (1000 * 60 * 60 * 24 * 30);

      if (monthsGap > 24) {
        baseConfidence -= 10; // 2+ years gap
      } else if (monthsGap > 12) {
        baseConfidence -= 5; // 1-2 years gap
      }

    } else if (method === 'extrapolation') {
      // Medium confidence for extrapolation
      baseConfidence = 65;

      const refYear = model1.modelYear || new Date(model1.releaseDate).getFullYear();
      const targetYear = targetDevice.modelYear || 
                        new Date(targetDevice.releaseDate).getFullYear();
      const yearDiff = Math.abs(targetYear - refYear);

      // Reduce confidence for larger time differences
      baseConfidence -= (yearDiff * 5);

    } else {
      baseConfidence = 45;
    }

    return Math.max(35, Math.min(95, baseConfidence));
  }

  /**
   * Apply market adjustments based on device characteristics
   */
  applyMarketAdjustments(basePrice, device, partQuality) {
    let adjustedPrice = basePrice;

    // Premium brand adjustment
    if (device.brand === 'Apple') {
      adjustedPrice *= 1.05; // 5% premium for Apple
    }

    // Aftermarket typically 25-35% cheaper
    if (partQuality === 'aftermarket') {
      // Already factored in if using similar part quality
      // This is a safety check
    }

    return adjustedPrice;
  }

  /**
   * Calculate average price
   */
  calculateAverage(priceList) {
    if (priceList.length === 0) return 0;
    
    const prices = priceList.map(p => 
      typeof p === 'number' ? p : parseFloat(p.sellingPrice)
    );
    
    const sum = prices.reduce((acc, price) => acc + price, 0);
    return sum / prices.length;
  }

  /**
   * Generate prices for all missing combinations
   */
  async generateMissingPrices() {
    const devices = await Device.findAll({ where: { isActive: true } });
    const repairTypes = await RepairType.findAll({ where: { isActive: true } });
    const qualities = ['original', 'aftermarket'];

    const results = {
      generated: 0,
      failed: 0,
      details: []
    };

    for (const device of devices) {
      for (const repairType of repairTypes) {
        for (const quality of qualities) {
          try {
            // Check if price exists
            const existing = await Pricing.findOne({
              where: {
                deviceId: device.id,
                repairTypeId: repairType.id,
                partQuality: quality
              }
            });

            if (!existing) {
              // Generate estimate
              const estimate = await this.estimatePrice(
                device.id,
                repairType.id,
                quality
              );

              if (estimate.price && estimate.confidence >= 40) {
                // Create estimated price entry
                await Pricing.create({
                  deviceId: device.id,
                  repairTypeId: repairType.id,
                  partQuality: quality,
                  costPrice: estimate.price * 0.6, // Assume 40% margin
                  sellingPrice: estimate.price,
                  isEstimated: true,
                  confidenceScore: estimate.confidence,
                  notes: estimate.reasoning
                });

                results.generated++;
                results.details.push({
                  device: `${device.brand} ${device.model}`,
                  repair: repairType.name,
                  quality,
                  price: estimate.price,
                  confidence: estimate.confidence
                });
              }
            }
          } catch (error) {
            console.error(`Failed to generate price for ${device.model}:`, error);
            results.failed++;
          }
        }
      }
    }

    return results;
  }

  /**
   * Convert estimated price to fixed price
   */
  async confirmEstimate(pricingId, newPrice = null) {
    const pricing = await Pricing.findByPk(pricingId);
    
    if (!pricing) {
      throw new Error('Pricing not found');
    }

    pricing.isEstimated = false;
    pricing.confidenceScore = 100;
    
    if (newPrice) {
      pricing.sellingPrice = newPrice;
    }

    await pricing.save();

    return pricing;
  }
}

module.exports = new SmartPricingService();
