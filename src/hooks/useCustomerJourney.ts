import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Types
export interface CustomerEvent {
  id: string;
  customer_id: string;
  event: string;
  stage: string;
  timestamp: string;
  metadata: {
    source?: string;
    value?: number;
    [key: string]: any;
  };
  customer_name?: string;
  customer_email?: string;
}

export interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  currentStage: string;
  totalValue: number;
  firstSeen: string;
  lastActivity: string;
  events: CustomerEvent[];
}

export interface JourneyData {
  customers: CustomerData[];
  events: CustomerEvent[];
}

export function useCustomerJourney() {
  const [data, setData] = useState<JourneyData>({ customers: [], events: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load journey data from API
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/customer-journey/data');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setData({
          customers: result.customers || [],
          events: result.events || []
        });
      } else {
        throw new Error(result.error || 'Failed to load journey data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error loading journey data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Send webhook event
  const sendWebhookEvent = async (payload: Omit<CustomerEvent, 'id'>) => {
    try {
      const response = await fetch('/api/webhook/customer-journey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Event sent successfully');
        // Reload data to reflect changes
        await loadData();
        return result;
      } else {
        throw new Error(result.error || 'Failed to send event');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to send event: ${errorMessage}`);
      throw err;
    }
  };

  // Get customers by stage
  const getCustomersByStage = (stage: string) => {
    return data.customers.filter(customer => customer.currentStage === stage);
  };

  // Get events by stage
  const getEventsByStage = (stage: string) => {
    return data.events.filter(event => event.stage === stage);
  };

  // Get customer by ID
  const getCustomerById = (customerId: string) => {
    return data.customers.find(customer => customer.id === customerId);
  };

  // Calculate stage metrics
  const getStageMetrics = (stage: string) => {
    const stageCustomers = getCustomersByStage(stage);
    const stageEvents = getEventsByStage(stage);
    
    const totalValue = stageCustomers.reduce((sum, customer) => sum + customer.totalValue, 0);
    const avgValue = stageCustomers.length > 0 ? totalValue / stageCustomers.length : 0;
    
    return {
      customerCount: stageCustomers.length,
      eventCount: stageEvents.length,
      totalValue,
      avgValue,
      recentEvents: stageEvents.slice(0, 5)
    };
  };

  // Initialize data on mount
  useEffect(() => {
    loadData();
  }, []);

  return {
    data,
    isLoading,
    error,
    loadData,
    sendWebhookEvent,
    getCustomersByStage,
    getEventsByStage,
    getCustomerById,
    getStageMetrics
  };
}