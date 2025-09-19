import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  Copy, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Code,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

interface WebhookTesterProps {
  webhookUrl: string;
  onTestComplete?: (success: boolean, response?: any) => void;
}

export const WebhookTester: React.FC<WebhookTesterProps> = ({
  webhookUrl,
  onTestComplete
}) => {
  const [testPayload, setTestPayload] = useState('');
  const [customHeaders, setCustomHeaders] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);

  // Initialize with sample payload
  React.useEffect(() => {
    setTestPayload(JSON.stringify({
      customer_id: "test_" + Math.random().toString(36).substring(7),
      event: "stage_completed",
      stage: "consideration",
      timestamp: new Date().toISOString(),
      metadata: {
        source: "email_campaign",
        value: 150.00
      },
      customer_name: "Test Customer",
      customer_email: "test@example.com"
    }, null, 2));

    setCustomHeaders(JSON.stringify({
      "Content-Type": "application/json",
      "X-Webhook-Source": "manual-test"
    }, null, 2));
  }, []);

  // Copy webhook URL to clipboard
  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast.success('Webhook URL copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  // Generate sample payloads for different events
  const generateSamplePayload = (eventType: string, stage: string) => {
    const basePayload = {
      customer_id: "sample_" + Math.random().toString(36).substring(7),
      event: eventType,
      stage: stage,
      timestamp: new Date().toISOString(),
      customer_name: "Sample Customer",
      customer_email: "sample@example.com"
    };

    const metadata: any = {
      source: "test_webhook"
    };

    // Add event-specific metadata
    switch (eventType) {
      case 'purchase_made':
        metadata.value = Math.floor(Math.random() * 1000) + 100;
        metadata.product_id = "prod_" + Math.random().toString(36).substring(7);
        break;
      case 'email_opened':
        metadata.campaign_id = "camp_" + Math.random().toString(36).substring(7);
        metadata.subject = "Welcome to our store!";
        break;
      case 'link_clicked':
        metadata.url = "https://example.com/product/123";
        metadata.campaign_id = "camp_" + Math.random().toString(36).substring(7);
        break;
      case 'form_submitted':
        metadata.form_type = "newsletter_signup";
        metadata.source = "landing_page";
        break;
      default:
        metadata.value = Math.floor(Math.random() * 500);
    }

    return {
      ...basePayload,
      metadata
    };
  };

  // Test webhook with current payload
  const testWebhook = async () => {
    setIsTesting(true);
    setLastResponse(null);

    try {
      // Parse headers
      let headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (customHeaders.trim()) {
        try {
          headers = { ...headers, ...JSON.parse(customHeaders) };
        } catch (error) {
          toast.error('Invalid headers JSON format');
          setIsTesting(false);
          return;
        }
      }

      // Parse and validate payload
      let payload;
      try {
        payload = JSON.parse(testPayload);
      } catch (error) {
        toast.error('Invalid payload JSON format');
        setIsTesting(false);
        return;
      }

      // Send webhook request
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      setLastResponse({
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        timestamp: new Date().toISOString()
      });

      if (response.ok) {
        toast.success('Webhook test successful!');
        onTestComplete?.(true, responseData);
      } else {
        toast.error(`Webhook test failed: ${response.status} ${response.statusText}`);
        onTestComplete?.(false, responseData);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Webhook test error: ${errorMessage}`);
      setLastResponse({
        status: 0,
        statusText: 'Network Error',
        data: { error: errorMessage },
        timestamp: new Date().toISOString()
      });
      onTestComplete?.(false, { error: errorMessage });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="mr-2 h-5 w-5" />
          Webhook Tester
        </CardTitle>
        <CardDescription>
          Test your webhook endpoint with sample customer journey events
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="test" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="test">Test Webhook</TabsTrigger>
            <TabsTrigger value="samples">Sample Payloads</TabsTrigger>
            <TabsTrigger value="docs">Documentation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="test" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <div className="flex space-x-2">
                  <Input
                    id="webhook-url"
                    value={webhookUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="custom-headers">Custom Headers (JSON)</Label>
                <Textarea
                  id="custom-headers"
                  value={customHeaders}
                  onChange={(e) => setCustomHeaders(e.target.value)}
                  className="font-mono text-sm h-24"
                  placeholder='{"Authorization": "Bearer token"}'
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="test-payload">Test Payload (JSON)</Label>
                <Textarea
                  id="test-payload"
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  className="font-mono text-sm h-48"
                  placeholder="Enter JSON payload to test..."
                />
              </div>
              
              <Button onClick={testWebhook} disabled={isTesting} className="w-full">
                <Send className="mr-2 h-4 w-4" />
                {isTesting ? 'Testing...' : 'Test Webhook'}
              </Button>
              
              {/* Response Display */}
              {lastResponse && (
                <div className="space-y-2">
                  <Label>Response</Label>
                  <div className={cn(
                    "p-3 rounded-md border",
                    lastResponse.status >= 200 && lastResponse.status < 300 
                      ? "bg-green-50 border-green-200 dark:bg-green-950/20" 
                      : "bg-red-50 border-red-200 dark:bg-red-950/20"
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {lastResponse.status >= 200 && lastResponse.status < 300 ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium">
                          {lastResponse.status} {lastResponse.statusText}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(lastResponse.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded border overflow-auto max-h-32">
                      {JSON.stringify(lastResponse.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="samples" className="space-y-4">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Click any sample below to load it into the test payload
              </div>
              
              {[
                { event: 'stage_entered', stage: 'awareness', description: 'Customer enters awareness stage' },
                { event: 'stage_completed', stage: 'consideration', description: 'Customer completes consideration' },
                { event: 'purchase_made', stage: 'purchase', description: 'Customer makes a purchase' },
                { event: 'email_opened', stage: 'retention', description: 'Customer opens retention email' },
                { event: 'link_clicked', stage: 'advocacy', description: 'Customer clicks referral link' },
                { event: 'form_submitted', stage: 'awareness', description: 'Customer submits contact form' }
              ].map((sample, index) => (
                <Card key={index} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent 
                    className="p-4"
                    onClick={() => {
                      const samplePayload = generateSamplePayload(sample.event, sample.stage);
                      setTestPayload(JSON.stringify(samplePayload, null, 2));
                      toast.success('Sample payload loaded');
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{sample.event}</div>
                        <div className="text-sm text-muted-foreground">{sample.description}</div>
                      </div>
                      <Badge variant="outline">{sample.stage}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="docs" className="space-y-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <Code className="mr-2 h-5 w-5" />
                  Webhook Specification
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Endpoint</h4>
                    <code className="bg-muted p-2 rounded text-sm block">
                      POST {webhookUrl}
                    </code>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Required Headers</h4>
                    <div className="bg-muted p-3 rounded font-mono text-sm">
                      <div>Content-Type: application/json</div>
                      <div>X-Webhook-Signature: sha256=&lt;signature&gt; (optional)</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Payload Schema</h4>
                    <pre className="bg-muted p-3 rounded text-xs overflow-auto">
{`{
  "customer_id": "string (required)",
  "event": "string (required)",
  "stage": "string (required)",
  "timestamp": "string (ISO 8601, required)",
  "metadata": {
    "source": "string (optional)",
    "value": "number (optional)",
    "...": "any additional data"
  },
  "customer_name": "string (optional)",
  "customer_email": "string (optional)"
}`}
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Valid Stages</h4>
                    <div className="flex flex-wrap gap-2">
                      {['awareness', 'consideration', 'purchase', 'retention', 'advocacy'].map(stage => (
                        <Badge key={stage} variant="outline">{stage}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Valid Events</h4>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'stage_entered', 'stage_completed', 'purchase_made',
                        'email_opened', 'link_clicked', 'form_submitted'
                      ].map(event => (
                        <Badge key={event} variant="outline">{event}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <Globe className="mr-2 h-5 w-5" />
                  Integration Examples
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">cURL Example</h4>
                    <pre className="bg-muted p-3 rounded text-xs overflow-auto">
{`curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Signature: sha256=signature" \\
  -d '{
    "customer_id": "12345",
    "event": "purchase_made",
    "stage": "purchase",
    "timestamp": "${new Date().toISOString()}",
    "metadata": {
      "source": "website",
      "value": 299.99
    }
  }'`}
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">JavaScript Example</h4>
                    <pre className="bg-muted p-3 rounded text-xs overflow-auto">
{`fetch('${webhookUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': 'sha256=signature'
  },
  body: JSON.stringify({
    customer_id: '12345',
    event: 'stage_completed',
    stage: 'consideration',
    timestamp: new Date().toISOString(),
    metadata: {
      source: 'email_campaign',
      value: 150.00
    }
  })
});`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};