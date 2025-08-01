import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useWhatsAppTemplates } from '@/hooks/useWhatsAppTemplates';
import { sendWhatsAppMessage } from '@/lib/evolution';
import { Order } from '@/types/schema';

interface SendEvolutionMessageProps {
  order: Order;
  onMessageSent: () => void;
}

const SendEvolutionMessage: React.FC<SendEvolutionMessageProps> = ({ order, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { templates, isLoading: templatesLoading } = useWhatsAppTemplates();

  const handleTemplateChange = (templateName: string) => {
    const template = templates.find(t => t.name === templateName);
    if (template) {
      let content = template.content;
      // Replace placeholders
      content = content.replace(/{{customerName}}/g, order.customer_name || '');
      content = content.replace(/{{orderId}}/g, order.id || '');
      content = content.replace(/{{amount}}/g, order.total.toString() || '');
      // Add more placeholder replacements as needed
      setMessage(content);
    }
  };

  const handleSendMessage = async () => {
    if (!message) return;

    setIsSending(true);
    try {
      await sendWhatsAppMessage({
        phone: order.customer_phone,
        message,
        orderId: order.id,
      });
      onMessageSent();
    } catch (error) {
      console.error('Failed to send message:', error);
      // Optionally, show an error message to the user
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="border rounded-md p-4 space-y-4">
      <h3 className="text-lg font-medium">Send WhatsApp Message</h3>
      
      <Select onValueChange={handleTemplateChange} disabled={templatesLoading}>
        <SelectTrigger>
          <SelectValue placeholder="Select a message template" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Templates</SelectLabel>
            {templatesLoading ? (
              <SelectItem value="loading" disabled>
                Loading templates...
              </SelectItem>
            ) : (
              templates.map(template => (
                <SelectItem key={template.id} value={template.name}>
                  {template.name}
                </SelectItem>
              ))
            )}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Textarea
        placeholder="Or write a custom message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
      />

      <div className="flex justify-end">
        <Button onClick={handleSendMessage} disabled={isSending || !message}>
          {isSending ? 'Sending...' : 'Send Message'}
        </Button>
      </div>
    </div>
  );
};

export default SendEvolutionMessage;
