// Customer Journey utility functions and types

export interface JourneyStage {
  id: string;
  name: string;
  description: string;
  color: string;
  order: number;
}

export interface CustomerJourneyEvent {
  id: string;
  customer_id: string;
  event: string;
  stage: string;
  timestamp: string;
  metadata: Record<string, any>;
  customer_name?: string;
  customer_email?: string;
}

export interface CustomerJourneyMetrics {
  totalCustomers: number;
  stageDistribution: Record<string, number>;
  conversionRates: Record<string, number>;
  averageTimeInStage: Record<string, string>;
  totalValue: number;
  stageValues: Record<string, number>;
}

// Default journey stages
export const DEFAULT_JOURNEY_STAGES: JourneyStage[] = [
  {
    id: 'awareness',
    name: 'Awareness',
    description: 'Customer discovers your brand through various channels',
    color: 'bg-blue-500',
    order: 1
  },
  {
    id: 'consideration',
    name: 'Consideration',
    description: 'Customer evaluates your products and compares options',
    color: 'bg-purple-500',
    order: 2
  },
  {
    id: 'purchase',
    name: 'Purchase',
    description: 'Customer makes their first purchase decision',
    color: 'bg-green-500',
    order: 3
  },
  {
    id: 'retention',
    name: 'Retention',
    description: 'Customer returns for additional purchases',
    color: 'bg-orange-500',
    order: 4
  },
  {
    id: 'advocacy',
    name: 'Advocacy',
    description: 'Customer becomes a brand advocate and refers others',
    color: 'bg-pink-500',
    order: 5
  }
];

// Valid event types
export const VALID_EVENTS = [
  'stage_entered',
  'stage_completed',
  'purchase_made',
  'email_opened',
  'link_clicked',
  'form_submitted',
  'page_viewed',
  'cart_abandoned',
  'review_left',
  'referral_made'
] as const;

export type ValidEvent = typeof VALID_EVENTS[number];

// Valid stage IDs
export const VALID_STAGES = DEFAULT_JOURNEY_STAGES.map(stage => stage.id);

// Utility functions
export class CustomerJourneyUtils {
  /**
   * Validate a customer journey event payload
   */
  static validateEvent(payload: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Required fields
    if (!payload.customer_id) errors.push('customer_id is required');
    if (!payload.event) errors.push('event is required');
    if (!payload.stage) errors.push('stage is required');
    if (!payload.timestamp) errors.push('timestamp is required');
    
    // Validate event type
    if (payload.event && !VALID_EVENTS.includes(payload.event)) {
      errors.push(`event must be one of: ${VALID_EVENTS.join(', ')}`);
    }
    
    // Validate stage
    if (payload.stage && !VALID_STAGES.includes(payload.stage)) {
      errors.push(`stage must be one of: ${VALID_STAGES.join(', ')}`);
    }
    
    // Validate timestamp
    if (payload.timestamp) {
      const timestamp = new Date(payload.timestamp);
      if (isNaN(timestamp.getTime())) {
        errors.push('timestamp must be a valid ISO 8601 date');
      }
    }
    
    // Validate email format if provided
    if (payload.customer_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(payload.customer_email)) {
        errors.push('customer_email must be a valid email address');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Calculate conversion rate between two stages
   */
  static calculateConversionRate(fromStageCount: number, toStageCount: number): number {
    if (fromStageCount === 0) return 0;
    return Math.round((toStageCount / fromStageCount) * 100 * 10) / 10;
  }
  
  /**
   * Format time duration for display
   */
  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  }
  
  /**
   * Generate a sample webhook payload
   */
  static generateSamplePayload(
    event: ValidEvent, 
    stage: string, 
    customerId?: string
  ): CustomerJourneyEvent {
    const id = customerId || `sample_${Math.random().toString(36).substring(7)}`;
    
    const basePayload: CustomerJourneyEvent = {
      id: crypto.randomUUID(),
      customer_id: id,
      event,
      stage,
      timestamp: new Date().toISOString(),
      metadata: {
        source: 'sample_generator'
      },
      customer_name: `Sample Customer ${id.slice(-4)}`,
      customer_email: `customer${id.slice(-4)}@example.com`
    };
    
    // Add event-specific metadata
    switch (event) {
      case 'purchase_made':
        basePayload.metadata.value = Math.floor(Math.random() * 1000) + 100;
        basePayload.metadata.product_id = `prod_${Math.random().toString(36).substring(7)}`;
        break;
      case 'email_opened':
        basePayload.metadata.campaign_id = `camp_${Math.random().toString(36).substring(7)}`;
        basePayload.metadata.subject = 'Welcome to our store!';
        break;
      case 'link_clicked':
        basePayload.metadata.url = 'https://example.com/product/123';
        basePayload.metadata.campaign_id = `camp_${Math.random().toString(36).substring(7)}`;
        break;
      case 'form_submitted':
        basePayload.metadata.form_type = 'newsletter_signup';
        basePayload.metadata.source = 'landing_page';
        break;
      default:
        basePayload.metadata.value = Math.floor(Math.random() * 500);
    }
    
    return basePayload;
  }
  
  /**
   * Calculate journey metrics from events
   */
  static calculateMetrics(events: CustomerJourneyEvent[]): CustomerJourneyMetrics {
    const stageDistribution: Record<string, number> = {};
    const stageValues: Record<string, number> = {};
    const customerStages: Record<string, string> = {};
    
    // Process events to get current customer states
    events.forEach(event => {
      customerStages[event.customer_id] = event.stage;
      
      if (event.metadata.value) {
        stageValues[event.stage] = (stageValues[event.stage] || 0) + event.metadata.value;
      }
    });
    
    // Count customers in each stage
    Object.values(customerStages).forEach(stage => {
      stageDistribution[stage] = (stageDistribution[stage] || 0) + 1;
    });
    
    // Calculate conversion rates
    const conversionRates: Record<string, number> = {};
    const stages = DEFAULT_JOURNEY_STAGES.map(s => s.id);
    
    for (let i = 0; i < stages.length - 1; i++) {
      const currentStage = stages[i];
      const nextStage = stages[i + 1];
      const currentCount = stageDistribution[currentStage] || 0;
      const nextCount = stageDistribution[nextStage] || 0;
      
      conversionRates[`${currentStage}_to_${nextStage}`] = 
        this.calculateConversionRate(currentCount, nextCount);
    }
    
    return {
      totalCustomers: Object.keys(customerStages).length,
      stageDistribution,
      conversionRates,
      averageTimeInStage: {}, // Would need more complex calculation with timestamps
      totalValue: Object.values(stageValues).reduce((sum, value) => sum + value, 0),
      stageValues
    };
  }
}