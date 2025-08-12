export interface ShippingOption {
  courier: string;
  service: string;
  cost: number;
  estimated_days: number;
}

export interface CalculateShippingInput {
  destination: string;
  weight: number; // in kg
}

// Base shipping rates (cost per kg) and delivery times by courier and service
const SHIPPING_RATES = {
  JNE: {
    Regular: { base_cost: 8000, cost_per_kg: 2000, days: 3 },
    Express: { base_cost: 12000, cost_per_kg: 3000, days: 1 },
    Cargo: { base_cost: 6000, cost_per_kg: 1500, days: 5 }
  },
  TIKI: {
    Regular: { base_cost: 7500, cost_per_kg: 2200, days: 3 },
    Express: { base_cost: 11000, cost_per_kg: 3200, days: 1 },
    Economy: { base_cost: 5500, cost_per_kg: 1800, days: 4 }
  },
  'Pos Indonesia': {
    Regular: { base_cost: 6000, cost_per_kg: 1800, days: 4 },
    Express: { base_cost: 9000, cost_per_kg: 2500, days: 2 }
  }
};

// Destination multipliers based on distance/region
const DESTINATION_MULTIPLIERS: { [key: string]: number } = {
  // Jakarta area (same city)
  'jakarta': 1.0,
  'bekasi': 1.1,
  'tangerang': 1.1,
  'depok': 1.1,
  'bogor': 1.2,
  
  // Java cities
  'bandung': 1.3,
  'semarang': 1.5,
  'yogyakarta': 1.6,
  'surabaya': 1.8,
  'malang': 1.9,
  
  // Other major cities
  'medan': 2.2,
  'palembang': 2.0,
  'makassar': 2.5,
  'balikpapan': 2.8,
  'denpasar': 2.3,
  'manado': 3.0,
  'jayapura': 4.0,
  
  // Default for unknown destinations
  'default': 2.0
};

/**
 * Calculate shipping costs and delivery options
 */
export const calculateShipping = async (destination: string, weight: number): Promise<ShippingOption[]> => {
  try {
    
    // Input validation
    if (!destination || destination.trim().length === 0) {
      throw new Error('Destination is required');
    }
    
    if (weight <= 0) {
      throw new Error('Weight must be greater than 0');
    }
    
    if (weight > 50) {
      throw new Error('Weight exceeds maximum limit of 50kg for regular shipping');
    }

    // Get destination multiplier
    const destinationKey = destination.toLowerCase().trim();
    const multiplier = DESTINATION_MULTIPLIERS[destinationKey] || DESTINATION_MULTIPLIERS['default'];
    
    const options: ShippingOption[] = [];
    
    // Calculate costs for each courier and service
    Object.entries(SHIPPING_RATES).forEach(([courier, services]) => {
      Object.entries(services).forEach(([service, rates]) => {
        // Calculate base cost + weight-based cost
        const baseCost = rates.base_cost + (weight * rates.cost_per_kg);
        
        // Apply destination multiplier
        const finalCost = Math.round(baseCost * multiplier);
        
        // Add weight surcharge for heavy packages
        let weightSurcharge = 0;
        if (weight > 10) {
          weightSurcharge = (weight - 10) * 1000; // Additional 1000 per kg over 10kg
        }
        
        // Calculate estimated delivery days (add extra days for remote destinations)
        let estimatedDays = rates.days;
        if (multiplier > 2.5) {
          estimatedDays += 2; // Add 2 days for very remote destinations
        } else if (multiplier > 2.0) {
          estimatedDays += 1; // Add 1 day for remote destinations
        }
        
        options.push({
          courier,
          service,
          cost: finalCost + weightSurcharge,
          estimated_days: estimatedDays
        });
      });
    });
    
    // Sort by cost (cheapest first)
    return options.sort((a, b) => a.cost - b.cost);
    
  } catch (error) {
    console.error('Shipping calculation failed:', error);
    throw error;
  }
};