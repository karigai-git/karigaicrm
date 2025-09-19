import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  Eye, 
  ShoppingCart, 
  Heart, 
  MessageSquare, 
  TrendingUp,
  Clock,
  MapPin,
  Activity,
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Types for customer journey data
interface JourneyStage {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  metrics: {
    customers: number;
    conversionRate: number;
    avgTimeSpent: string;
    value: number;
  };
}

interface CustomerEvent {
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

interface CustomerData {
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

const CustomerJourneyPage: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<string>('awareness');
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [events, setEvents] = useState<CustomerEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testPayload, setTestPayload] = useState('');

  // Journey stages configuration
  const journeyStages: JourneyStage[] = [
    {
      id: 'awareness',
      name: 'Awareness',
      description: 'Customer discovers your brand',
      icon: <Eye className="h-5 w-5" />,
      color: 'bg-blue-500',
      metrics: {
        customers: 1250,
        conversionRate: 45.2,
        avgTimeSpent: '2.5 days',
        value: 0
      }
    },
    {
      id: 'consideration',
      name: 'Consideration',
      description: 'Customer evaluates your products',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-purple-500',
      metrics: {
        customers: 565,
        conversionRate: 32.8,
        avgTimeSpent: '5.2 days',
        value: 0
      }
    },
    {
      id: 'purchase',
      name: 'Purchase',
      description: 'Customer makes a purchase',
      icon: <ShoppingCart className="h-5 w-5" />,
      color: 'bg-green-500',
      metrics: {
        customers: 185,
        conversionRate: 78.4,
        avgTimeSpent: '1.2 days',
        value: 45250
      }
    },
    {
      id: 'retention',
      name: 'Retention',
      description: 'Customer returns for more purchases',
      icon: <Heart className="h-5 w-5" />,
      color: 'bg-orange-500',
      metrics: {
        customers: 145,
        conversionRate: 65.1,
        avgTimeSpent: '30 days',
        value: 78900
      }
    },
    {
      id: 'advocacy',
      name: 'Advocacy',
      description: 'Customer becomes a brand advocate',
      icon: <MessageSquare className="h-5 w-5" />,
      color: 'bg-pink-500',
      metrics: {
        customers: 94,
        conversionRate: 85.7,
        avgTimeSpent: '90+ days',
        value: 125600
      }
    }
  ];

  // Initialize webhook URL
  useEffect(() => {
    const baseUrl = window.location.origin;
    setWebhookUrl(`${baseUrl}/api/webhook/customer-journey`);
    
    // Initialize test payload
    setTestPayload(JSON.stringify({
      customer_id: "12345",
      event: "stage_completed",
      stage: "consideration",
      timestamp: new Date().toISOString(),
      metadata: {
        source: "email_campaign",
        value: 150.00
      },
      customer_name: "John Doe",
      customer_email: "john@example.com"
    }, null, 2));

    // Load initial data
    loadJourneyData();
  }, []);

  // Load journey data from backend
  const loadJourneyData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/customer-journey/data');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error loading journey data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Test webhook functionality
  const testWebhook = async () => {
    try {
      const payload = JSON.parse(testPayload);
      const response = await fetch('/api/webhook/customer-journey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Webhook test successful!');
        // Reload data to show the new event
        loadJourneyData();
      } else {
        const error = await response.text();
        toast.error(`Webhook test failed: ${error}`);
      }
    } catch (error) {
      toast.error('Invalid JSON payload');
    }
  };

  // Get customers for selected stage
  const getStageCustomers = (stageId: string) => {
    return customers.filter(customer => customer.currentStage === stageId);
  };

  // Get recent events for selected stage
  const getStageEvents = (stageId: string) => {
    return events
      .filter(event => event.stage === stageId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  };

  const selectedStageData = journeyStages.find(stage => stage.id === selectedStage);
  const stageCustomers = getStageCustomers(selectedStage);
  const stageEvents = getStageEvents(selectedStage);

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customer Journey</h1>
            <p className="text-muted-foreground">Track and analyze customer interactions across all touchpoints</p>
          </div>
          <Button onClick={loadJourneyData} disabled={isLoading}>
            <Activity className="mr-2 h-4 w-4" />
            {isLoading ? 'Loading...' : 'Refresh Data'}
          </Button>
        </div>

        {/* Journey Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              Customer Journey Stages
            </CardTitle>
            <CardDescription>
              Click on any stage to view detailed analytics and customer data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Journey Flow */}
              <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
                {journeyStages.map((stage, index) => (
                  <div key={stage.id} className="flex items-center">
                    <div
                      className={cn(
                        "relative cursor-pointer transition-all duration-300 hover:scale-105",
                        selectedStage === stage.id ? "scale-110" : ""
                      )}
                      onClick={() => setSelectedStage(stage.id)}
                    >
                      <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg",
                        stage.color,
                        selectedStage === stage.id ? "ring-4 ring-blue-200" : ""
                      )}>
                        {stage.icon}
                      </div>
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
                        <div className="text-sm font-medium whitespace-nowrap">{stage.name}</div>
                        <div className="text-xs text-muted-foreground">{stage.metrics.customers} customers</div>
                      </div>
                    </div>
                    
                    {/* Arrow between stages */}
                    {index < journeyStages.length - 1 && (
                      <div className="flex-1 mx-4 h-0.5 bg-gray-300 relative">
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-300 border-t-2 border-b-2 border-t-transparent border-b-transparent"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Stage Details */}
              {selectedStageData && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-12">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Customers</p>
                          <p className="text-2xl font-bold">{selectedStageData.metrics.customers}</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Conversion Rate</p>
                          <p className="text-2xl font-bold">{selectedStageData.metrics.conversionRate}%</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Avg. Time</p>
                          <p className="text-2xl font-bold">{selectedStageData.metrics.avgTimeSpent}</p>
                        </div>
                        <Clock className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Value</p>
                          <p className="text-2xl font-bold">₹{selectedStageData.metrics.value.toLocaleString()}</p>
                        </div>
                        <Zap className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stage Customers */}
          <Card>
            <CardHeader>
              <CardTitle>Customers in {selectedStageData?.name} Stage</CardTitle>
              <CardDescription>
                {stageCustomers.length} customers currently in this stage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {stageCustomers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="mx-auto h-12 w-12 opacity-20" />
                      <p className="mt-2">No customers in this stage</p>
                    </div>
                  ) : (
                    stageCustomers.map((customer) => (
                      <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">{customer.email}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Last activity: {new Date(customer.lastActivity).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₹{customer.totalValue.toLocaleString()}</div>
                          <Badge variant="outline" className="text-xs">
                            {customer.events.length} events
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent Events */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>
                Latest customer interactions in {selectedStageData?.name} stage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {stageEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="mx-auto h-12 w-12 opacity-20" />
                      <p className="mt-2">No recent events</p>
                    </div>
                  ) : (
                    stageEvents.map((event) => (
                      <div key={event.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-2",
                          event.event === 'stage_completed' ? 'bg-green-500' : 
                          event.event === 'stage_entered' ? 'bg-blue-500' : 'bg-gray-500'
                        )} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{event.event.replace('_', ' ')}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Customer: {event.customer_name || event.customer_id}
                          </div>
                          {event.metadata.source && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {event.metadata.source}
                            </Badge>
                          )}
                          {event.metadata.value && (
                            <span className="text-xs text-green-600 ml-2">
                              +₹{event.metadata.value}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Webhook Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5" />
              Webhook Configuration
            </CardTitle>
            <CardDescription>
              Configure and test webhook endpoints for real-time journey updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="config" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="config">Configuration</TabsTrigger>
                <TabsTrigger value="test">Test Webhook</TabsTrigger>
              </TabsList>
              
              <TabsContent value="config" className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      value={webhookUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use this URL to send customer journey events to your system
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Supported Events</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        'stage_entered',
                        'stage_completed', 
                        'purchase_made',
                        'email_opened',
                        'link_clicked',
                        'form_submitted'
                      ].map(event => (
                        <Badge key={event} variant="outline" className="justify-center">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Required Headers</Label>
                    <div className="bg-muted p-3 rounded-md font-mono text-sm">
                      <div>Content-Type: application/json</div>
                      <div>X-Webhook-Signature: sha256=...</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="test" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-payload">Test Payload</Label>
                    <textarea
                      id="test-payload"
                      value={testPayload}
                      onChange={(e) => setTestPayload(e.target.value)}
                      className="w-full h-48 p-3 border rounded-md font-mono text-sm"
                      placeholder="Enter JSON payload to test..."
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTestPayload(JSON.stringify({
                          customer_id: Math.random().toString(36).substring(7),
                          event: "stage_completed",
                          stage: selectedStage,
                          timestamp: new Date().toISOString(),
                          metadata: {
                            source: "test_webhook",
                            value: Math.floor(Math.random() * 1000)
                          },
                          customer_name: "Test Customer",
                          customer_email: "test@example.com"
                        }, null, 2));
                      }}
                    >
                      Generate Sample
                    </Button>
                    
                    <Button onClick={testWebhook}>
                      <Zap className="mr-2 h-4 w-4" />
                      Test Webhook
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Real-time Events Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Live Events Feed
            </CardTitle>
            <CardDescription>
              Real-time customer journey events as they happen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {events.slice(0, 20).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        event.event === 'stage_completed' ? 'bg-green-500' :
                        event.event === 'stage_entered' ? 'bg-blue-500' :
                        event.event === 'purchase_made' ? 'bg-purple-500' : 'bg-gray-500'
                      )} />
                      <div>
                        <div className="font-medium">{event.customer_name || event.customer_id}</div>
                        <div className="text-sm text-muted-foreground">
                          {event.event.replace('_', ' ')} in {event.stage}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                      {event.metadata.value && (
                        <div className="text-xs text-green-600">
                          +₹{event.metadata.value}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default CustomerJourneyPage;