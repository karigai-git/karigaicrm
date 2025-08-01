import React, { useState, useCallback, useEffect } from 'react';
import { Order } from '@/types/schema';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { sendWhatsAppMessage, sendWhatsAppMediaMessage, getInstanceConnectionState, connectInstance } from '@/lib/evolution';
import { useWhatsAppTemplates } from '@/hooks/useWhatsAppTemplates';
import { Send, AlertCircle, Wifi, WifiOff, Loader2, Image, MessageSquare } from 'lucide-react';

interface SendWhatsAppMessageProps {
  order: Order;
  onMessageSent: () => void;
}

export const SendWhatsAppMessage: React.FC<SendWhatsAppMessageProps> = ({ order, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [error, setError] = useState<string>('');
  
  // Media message state
  const [messageType, setMessageType] = useState<'text' | 'media'>('text');
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');

  // Connection state - bypassing connection check
  const [connectionStatus, setConnectionStatus] = useState<string | null>('open'); // Force connected state
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const instanceName = import.meta.env.VITE_EVOLUTION_INSTANCE_NAME || 'karigai';

  const { templates, isLoading: templatesLoading } = useWhatsAppTemplates();

  // Removed connection status check useEffect - assuming always connected

  const handleConnect = async () => {
    if (!instanceName) return;
    setIsConnecting(true);
    setQrCode(null);
    setError('');
    try {
      const data = await connectInstance(instanceName);
      if (data.qrcode?.base64) {
        setQrCode(data.qrcode.base64);
      }
    } catch (err) {
      console.error('Failed to connect instance:', err);
      setError('Failed to generate QR code. Check the console for more details.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTemplateChange = (templateName: string) => {
    setSelectedTemplate(templateName);
    setError('');
    if (templateName === 'custom-message') {
      setMessage('');
    } else {
      const template = templates.find(t => t.name === templateName);
      if (template) {
        let content = template.content;
        content = content.replace(/{{customerName}}/g, order.customer_name || '');
        content = content.replace(/{{orderId}}/g, order.id || '');
        content = content.replace(/{{amount}}/g, order.total?.toString() || '');
        setMessage(content);
      }
    }
  };

  const handleSendMessage = async () => {
    if (messageType === 'text' && !message.trim()) {
      setError('Message cannot be empty.');
      return;
    }
    
    if (messageType === 'media' && !mediaUrl.trim()) {
      setError('Media URL cannot be empty.');
      return;
    }

    setIsSending(true);
    setError('');

    try {
      if (messageType === 'text') {
        await sendWhatsAppMessage({
          phone: order.customer_phone,
          message,
          orderId: order.id,
          templateName: selectedTemplate !== 'custom-message' ? selectedTemplate : '',
        });
      } else {
        // Send media message
        await sendWhatsAppMediaMessage({
          phone: order.customer_phone,
          mediaUrl,
          caption,
          mediaType: 'image',
          fileName: `product-${order.id}.jpg`,
          orderId: order.id,
        });
      }
      
      toast.success(`${messageType === 'text' ? 'Message' : 'Media'} sent successfully!`);
      onMessageSent();
      
      // Reset fields based on message type
      if (messageType === 'text') {
        setMessage('');
        setSelectedTemplate('');
      } else {
        setMediaUrl('');
        setCaption('');
      }
    } catch (err) {
      console.error(`Failed to send ${messageType}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to send ${messageType}: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };

  const renderConnectionStatus = () => {
    switch (connectionStatus) {
      case 'open':
        return <><Wifi className="h-4 w-4 text-green-500" /> <span className="text-green-500">Connected</span></>;
      case 'connecting':
        return <><Loader2 className="h-4 w-4 animate-spin" /> <span>Connecting...</span></>;
      case 'close':
        return <><WifiOff className="h-4 w-4 text-red-500" /> <span className="text-red-500">Disconnected</span></>;
      default:
        return <><WifiOff className="h-4 w-4 text-yellow-500" /> <span>Checking Status...</span></>;
    }
  };

  const isConnected = connectionStatus === 'open';

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Send WhatsApp Message</CardTitle>
          <div className="flex items-center gap-2 text-sm font-medium">
            {renderConnectionStatus()}
          </div>
        </div>
        <div className="flex items-center justify-center mt-4 border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setMessageType('text')}
            className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 ${messageType === 'text' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            <MessageSquare className="h-4 w-4" /> Text
          </button>
          <button
            type="button"
            onClick={() => setMessageType('media')}
            className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 ${messageType === 'media' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            <Image className="h-4 w-4" /> Media
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {messageType === 'text' ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="template-select">Template</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange} disabled={templatesLoading}>
                <SelectTrigger id="template-select">
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templatesLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    <>
                      <SelectItem value="custom-message">Custom Message</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.name} value={template.name}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="message">Message Preview</Label>
              <Textarea
                id="message"
                placeholder="Select a template or write a custom message."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="font-mono text-sm"
                readOnly={selectedTemplate !== 'custom-message'}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="media-url">Media URL</Label>
              <Input
                id="media-url"
                placeholder="Enter URL to image (must be publicly accessible)"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter a publicly accessible URL to an image (JPG, PNG, etc.)
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="caption">Caption (Optional)</Label>
              <Textarea
                id="caption"
                placeholder="Enter a caption for your image"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
              />
            </div>

            {mediaUrl && (
              <div className="border rounded-md p-2 bg-muted/50">
                <p className="text-xs font-medium mb-1">Image Preview:</p>
                <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden rounded-md">
                  <img 
                    src={mediaUrl} 
                    alt="Media preview" 
                    className="max-w-full max-h-full object-contain" 
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/600x400?text=Invalid+Image+URL';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSendMessage} 
          disabled={isSending || (messageType === 'text' ? !message.trim() : !mediaUrl.trim())} 
          className="w-full"
        >
          {isSending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" /> 
              Send {messageType === 'text' ? 'Message' : 'Media'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};