"""
Smart Pricing Algorithm - Implementation Example
This module demonstrates how to implement the smart pricing feature
for estimating repair costs for devices without explicit pricing.
"""

from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta


@dataclass
class DeviceModel:
    """Represents a device model"""
    id: int
    name: str
    brand_id: int
    brand_name: str
    release_year: int
    device_type: str  # 'phone' or 'tablet'
    screen_size: float


@dataclass
class PricingEntry:
    """Represents a pricing entry"""
    id: int
    device_model_id: int
    repair_type_id: int
    part_type_id: int
    price: float
    cost: float
    is_estimated: bool
    confidence_score: float
    created_at: datetime


class SmartPricingEngine:
    """
    Smart pricing engine that estimates repair prices for devices
    without explicit pricing using various interpolation strategies.
    """

    def __init__(self, db_connection):
        self.db = db_connection

    def estimate_price(
        self,
        device_model_id: int,
        repair_type_id: int,
        part_type_id: int
    ) -> Tuple[float, float, str]:
        """
        Estimate price for a device/repair/part combination.
        
        Returns:
            Tuple of (price, confidence_score, method_used)
        """
        # 1. Check for exact match first
        exact_price = self._get_exact_price(
            device_model_id, repair_type_id, part_type_id
        )
        if exact_price:
            return (exact_price.price, 1.0, "exact_match")

        # 2. Get device information
        target_device = self._get_device_model(device_model_id)
        if not target_device:
            raise ValueError(f"Device model {device_model_id} not found")

        # 3. Find similar devices with pricing
        similar_devices = self._find_similar_devices(target_device)
        
        if not similar_devices:
            # Fallback to category average
            avg_price = self._get_category_average(
                target_device.brand_id,
                repair_type_id,
                part_type_id
            )
            return (avg_price, 0.5, "category_average")

        # 4. Apply interpolation strategies
        strategies = [
            self._linear_interpolation_by_year,
            self._weighted_average_by_similarity,
            self._nearest_neighbor
        ]

        for strategy in strategies:
            result = strategy(
                target_device,
                similar_devices,
                repair_type_id,
                part_type_id
            )
            if result:
                price, confidence, method = result
                return (price, confidence, method)

        # Ultimate fallback
        avg_price = self._get_category_average(
            target_device.brand_id,
            repair_type_id,
            part_type_id
        )
        return (avg_price, 0.3, "fallback_average")

    def _get_exact_price(
        self, device_model_id: int, repair_type_id: int, part_type_id: int
    ) -> Optional[PricingEntry]:
        """Get exact pricing if it exists"""
        query = """
            SELECT * FROM pricing
            WHERE device_model_id = %s
              AND repair_type_id = %s
              AND part_type_id = %s
              AND is_active = true
              AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
            ORDER BY valid_from DESC
            LIMIT 1
        """
        result = self.db.execute(query, (device_model_id, repair_type_id, part_type_id))
        if result:
            return PricingEntry(**result[0])
        return None

    def _get_device_model(self, device_model_id: int) -> Optional[DeviceModel]:
        """Get device model information"""
        query = """
            SELECT dm.*, b.name as brand_name
            FROM device_models dm
            JOIN brands b ON dm.brand_id = b.id
            WHERE dm.id = %s
        """
        result = self.db.execute(query, (device_model_id,))
        if result:
            return DeviceModel(**result[0])
        return None

    def _find_similar_devices(
        self, target_device: DeviceModel
    ) -> List[Dict]:
        """
        Find similar devices with pricing information.
        Prioritize same brand and device type.
        """
        query = """
            SELECT 
                dm.*,
                b.name as brand_name,
                p.id as pricing_id,
                p.repair_type_id,
                p.part_type_id,
                p.price,
                p.cost
            FROM device_models dm
            JOIN brands b ON dm.brand_id = b.id
            JOIN pricing p ON dm.id = p.device_model_id
            WHERE dm.brand_id = %s
              AND dm.device_type = %s
              AND dm.id != %s
              AND p.is_active = true
              AND dm.release_year BETWEEN %s AND %s
            ORDER BY ABS(dm.release_year - %s)
        """
        
        year_range = 3  # Look 3 years before and after
        results = self.db.execute(
            query,
            (
                target_device.brand_id,
                target_device.device_type,
                target_device.id,
                target_device.release_year - year_range,
                target_device.release_year + year_range,
                target_device.release_year
            )
        )
        return results

    def _linear_interpolation_by_year(
        self,
        target_device: DeviceModel,
        similar_devices: List[Dict],
        repair_type_id: int,
        part_type_id: int
    ) -> Optional[Tuple[float, float, str]]:
        """
        Linear interpolation based on release year.
        Works best when we have devices before and after the target.
        """
        # Group by device and get prices
        device_prices = {}
        for device in similar_devices:
            if (device['repair_type_id'] == repair_type_id and
                device['part_type_id'] == part_type_id):
                
                key = device['id']
                if key not in device_prices:
                    device_prices[key] = {
                        'year': device['release_year'],
                        'price': device['price'],
                        'name': device['name']
                    }

        if len(device_prices) < 2:
            return None

        # Sort by year
        sorted_devices = sorted(
            device_prices.items(),
            key=lambda x: x[1]['year']
        )

        # Find devices before and after target
        lower_devices = [
            d for d in sorted_devices
            if d[1]['year'] < target_device.release_year
        ]
        upper_devices = [
            d for d in sorted_devices
            if d[1]['year'] > target_device.release_year
        ]

        if not lower_devices or not upper_devices:
            return None

        # Get closest devices on each side
        lower_device = lower_devices[-1][1]
        upper_device = upper_devices[0][1]

        # Linear interpolation
        year_diff = upper_device['year'] - lower_device['year']
        if year_diff == 0:
            return None

        year_ratio = (
            (target_device.release_year - lower_device['year']) / year_diff
        )
        
        price_diff = upper_device['price'] - lower_device['price']
        estimated_price = lower_device['price'] + (year_ratio * price_diff)

        # Calculate confidence based on:
        # - Proximity of surrounding devices (closer = higher confidence)
        # - Price stability (similar prices = higher confidence)
        year_proximity = 1.0 - (abs(year_ratio - 0.5) * 0.4)  # Max at midpoint
        price_stability = 1.0 - min(
            abs(price_diff) / max(lower_device['price'], upper_device['price']),
            0.5
        )
        
        confidence = (year_proximity * 0.6) + (price_stability * 0.4)
        confidence = max(0.6, min(0.95, confidence))  # Clamp between 0.6-0.95

        return (round(estimated_price, 2), round(confidence, 2), "linear_interpolation")

    def _weighted_average_by_similarity(
        self,
        target_device: DeviceModel,
        similar_devices: List[Dict],
        repair_type_id: int,
        part_type_id: int
    ) -> Optional[Tuple[float, float, str]]:
        """
        Weighted average based on device similarity.
        Weight factors: year proximity, screen size similarity.
        """
        relevant_prices = []
        
        for device in similar_devices:
            if (device['repair_type_id'] == repair_type_id and
                device['part_type_id'] == part_type_id):
                
                # Calculate similarity score
                year_diff = abs(device['release_year'] - target_device.release_year)
                year_weight = 1.0 / (1 + year_diff)  # Closer years = higher weight
                
                screen_diff = abs(device.get('screen_size', 0) - target_device.screen_size)
                screen_weight = 1.0 / (1 + screen_diff)
                
                # Combined weight
                weight = (year_weight * 0.7) + (screen_weight * 0.3)
                
                relevant_prices.append({
                    'price': device['price'],
                    'weight': weight,
                    'year': device['release_year']
                })

        if not relevant_prices:
            return None

        # Calculate weighted average
        total_weight = sum(p['weight'] for p in relevant_prices)
        weighted_price = sum(
            p['price'] * p['weight'] for p in relevant_prices
        ) / total_weight

        # Confidence based on number of samples and weight distribution
        sample_confidence = min(len(relevant_prices) / 5.0, 1.0)  # Max at 5 samples
        weight_confidence = max(p['weight'] for p in relevant_prices)
        
        confidence = (sample_confidence * 0.5) + (weight_confidence * 0.5)
        confidence = max(0.65, min(0.90, confidence))

        return (round(weighted_price, 2), round(confidence, 2), "weighted_average")

    def _nearest_neighbor(
        self,
        target_device: DeviceModel,
        similar_devices: List[Dict],
        repair_type_id: int,
        part_type_id: int
    ) -> Optional[Tuple[float, float, str]]:
        """
        Use the nearest neighbor's price with a small adjustment.
        """
        closest_device = None
        min_year_diff = float('inf')

        for device in similar_devices:
            if (device['repair_type_id'] == repair_type_id and
                device['part_type_id'] == part_type_id):
                
                year_diff = abs(device['release_year'] - target_device.release_year)
                if year_diff < min_year_diff:
                    min_year_diff = year_diff
                    closest_device = device

        if not closest_device:
            return None

        base_price = closest_device['price']
        
        # Adjust price based on year difference
        # Newer devices typically cost more
        year_adjustment = (
            target_device.release_year - closest_device['release_year']
        ) * 0.05  # 5% per year
        
        estimated_price = base_price * (1 + year_adjustment)

        # Confidence decreases with year distance
        confidence = max(0.60, 0.85 - (min_year_diff * 0.1))

        return (round(estimated_price, 2), round(confidence, 2), "nearest_neighbor")

    def _get_category_average(
        self,
        brand_id: int,
        repair_type_id: int,
        part_type_id: int
    ) -> float:
        """Get average price for a brand/repair/part combination"""
        query = """
            SELECT AVG(p.price) as avg_price
            FROM pricing p
            JOIN device_models dm ON p.device_model_id = dm.id
            WHERE dm.brand_id = %s
              AND p.repair_type_id = %s
              AND p.part_type_id = %s
              AND p.is_active = true
        """
        result = self.db.execute(query, (brand_id, repair_type_id, part_type_id))
        if result and result[0]['avg_price']:
            return round(result[0]['avg_price'], 2)
        
        # Ultra fallback - get repair type average
        query = """
            SELECT AVG(price) as avg_price
            FROM pricing
            WHERE repair_type_id = %s
              AND part_type_id = %s
              AND is_active = true
        """
        result = self.db.execute(query, (repair_type_id, part_type_id))
        return round(result[0]['avg_price'], 2) if result else 100.0

    def batch_estimate_missing_prices(self, auto_approve_threshold: float = 0.85):
        """
        Batch process to estimate prices for all device/repair/part combinations
        that don't have explicit pricing.
        
        Args:
            auto_approve_threshold: Automatically create pricing entries for
                                   estimates with confidence >= this threshold
        """
        # Get all combinations that should have pricing
        query = """
            SELECT DISTINCT
                dm.id as device_model_id,
                rt.id as repair_type_id,
                pt.id as part_type_id
            FROM device_models dm
            CROSS JOIN repair_types rt
            CROSS JOIN part_types pt
            WHERE dm.is_active = true
              AND rt.is_active = true
              AND pt.is_active = true
              AND NOT EXISTS (
                  SELECT 1 FROM pricing p
                  WHERE p.device_model_id = dm.id
                    AND p.repair_type_id = rt.id
                    AND p.part_type_id = pt.id
                    AND p.is_active = true
              )
        """
        
        missing_prices = self.db.execute(query)
        results = {
            'estimated': 0,
            'auto_approved': 0,
            'needs_review': 0,
            'failed': 0,
            'details': []
        }

        for combo in missing_prices:
            try:
                price, confidence, method = self.estimate_price(
                    combo['device_model_id'],
                    combo['repair_type_id'],
                    combo['part_type_id']
                )

                result = {
                    'device_model_id': combo['device_model_id'],
                    'repair_type_id': combo['repair_type_id'],
                    'part_type_id': combo['part_type_id'],
                    'estimated_price': price,
                    'confidence': confidence,
                    'method': method
                }

                if confidence >= auto_approve_threshold:
                    # Auto-create pricing entry
                    self._create_estimated_pricing(
                        combo['device_model_id'],
                        combo['repair_type_id'],
                        combo['part_type_id'],
                        price,
                        confidence,
                        method
                    )
                    results['auto_approved'] += 1
                    result['status'] = 'auto_approved'
                else:
                    results['needs_review'] += 1
                    result['status'] = 'needs_review'

                results['estimated'] += 1
                results['details'].append(result)

            except Exception as e:
                results['failed'] += 1
                results['details'].append({
                    'device_model_id': combo['device_model_id'],
                    'repair_type_id': combo['repair_type_id'],
                    'part_type_id': combo['part_type_id'],
                    'error': str(e),
                    'status': 'failed'
                })

        return results

    def _create_estimated_pricing(
        self,
        device_model_id: int,
        repair_type_id: int,
        part_type_id: int,
        price: float,
        confidence: float,
        method: str
    ):
        """Create a pricing entry for an estimated price"""
        query = """
            INSERT INTO pricing (
                device_model_id,
                repair_type_id,
                part_type_id,
                price,
                is_estimated,
                confidence_score,
                notes
            ) VALUES (%s, %s, %s, %s, true, %s, %s)
        """
        self.db.execute(
            query,
            (
                device_model_id,
                repair_type_id,
                part_type_id,
                price,
                confidence,
                f"Auto-estimated using {method}"
            )
        )


# Example usage
if __name__ == "__main__":
    # Mock database connection (replace with actual DB connection)
    class MockDB:
        def execute(self, query, params=None):
            # This would be your actual database query
            pass
    
    db = MockDB()
    pricing_engine = SmartPricingEngine(db)
    
    # Estimate price for iPhone 12 screen repair
    device_model_id = 10  # iPhone 12
    repair_type_id = 1    # Front Screen
    part_type_id = 1      # Original OEM
    
    try:
        price, confidence, method = pricing_engine.estimate_price(
            device_model_id,
            repair_type_id,
            part_type_id
        )
        
        print(f"Estimated Price: ${price}")
        print(f"Confidence: {confidence * 100}%")
        print(f"Method: {method}")
        
        if confidence >= 0.85:
            print("✓ High confidence - can use as regular price")
        elif confidence >= 0.70:
            print("⚠ Medium confidence - show as estimated")
        else:
            print("⚠ Low confidence - contact for quote")
            
    except Exception as e:
        print(f"Error: {e}")
    
    # Batch estimate all missing prices
    print("\nRunning batch estimation...")
    results = pricing_engine.batch_estimate_missing_prices(
        auto_approve_threshold=0.85
    )
    
    print(f"Total estimated: {results['estimated']}")
    print(f"Auto-approved: {results['auto_approved']}")
    print(f"Needs review: {results['needs_review']}")
    print(f"Failed: {results['failed']}")
