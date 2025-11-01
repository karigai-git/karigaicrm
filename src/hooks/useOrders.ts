import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pb, ensureAdminAuth } from '@/lib/pocketbase';
import { Order, Product, UpdateOrderData as SchemaUpdateOrderData } from '@/types/schema';
import { toast } from 'sonner';
import { sendWhatsAppMessage } from '@/lib/evolution';

export interface CreateOrderData {
  user_id: string;
  status: string;
  total_amount: number;
  shipping_address?: string;
  items?: string[];
}

// Extend the UpdateOrderData interface to include all properties used in this file
interface UpdateOrderData extends SchemaUpdateOrderData {
  refund_amount?: number;
  payment_status?: 'pending' | 'paid' | 'failed';
}

export function useOrders() {
  const queryClient = useQueryClient();

  // Fetch all orders
  const { data, isLoading, error } = useQuery<{ items: Order[], totalItems: number }>({    
    queryKey: ['orders'],
    queryFn: async () => {
      try {
        await ensureAdminAuth();
        console.log('Fetching orders...');
        // Load all orders so old/backdated records also appear in client search
        const fullList = await pb.collection('orders').getFullList({
          sort: '-created',
          expand: 'user_id,shipping_address,items',
        });
        console.log('Fetched orders count:', fullList.length);

        return {
          items: fullList as unknown as Order[],
          totalItems: fullList.length,
        };
      } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create order
  const createOrder = useMutation({
    mutationFn: async (data: CreateOrderData) => {
      try {
        await ensureAdminAuth();
        const record = await pb.collection('orders').create(data);
        return record;
      } catch (error) {
        console.error('Error creating order:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order created successfully');
      
      // Send WhatsApp order confirmation if customer phone is available (no item fetch to avoid 400 logs)
      try {
        const order = data as unknown as Order;
        if (order && order.customer_phone) {
          const confirmationMessage = `🎉 *Order Confirmed* 🎉\n\nHi ${order.customer_name},\n\nYour order #${order.id.slice(0, 8)} has been confirmed!\n\nThank you for shopping with us.\n\nWe'll update you when your order ships.`;
          sendWhatsAppMessage({
            phone: order.customer_phone,
            message: confirmationMessage,
            orderId: order.id,
          }).catch(err => console.error('Failed to send WhatsApp confirmation:', err));
        }
      } catch (whatsappError) {
        console.error('Error sending WhatsApp notification:', whatsappError);
        // Don't throw error to prevent disrupting the main flow
      }
    },
    onError: (error: Error) => {
      toast.error('Failed to create order: ' + error.message);
    },
  });

  // Update order
  const updateOrder = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateOrderData }) => {
      try {
        await ensureAdminAuth();
        
        // Get the current order to compare status changes
        const currentOrder = await pb.collection('orders').getOne(id);
        const newStatus = data.status;
        const currentStatus = currentOrder.status;
        const paymentStatus = currentOrder.payment_status;
        
        // Update the order
        const record = await pb.collection('orders').update(id, data);
        
        // Handle WhatsApp notifications based on status changes
        if (newStatus && newStatus !== currentStatus && record.customer_phone) {
          const orderRecord = record as unknown as Order;
          
          // Different notifications based on new status
          switch(newStatus) {
            case 'processing':
              // If payment is successful, send payment success notification
              if (paymentStatus === 'paid') {
                // Send payment success notification
                const paymentMessage = `✅ *Payment Successful* ✅\n\nHi ${orderRecord.customer_name},\n\nYour payment of ₹${orderRecord.total} for order #${orderRecord.id.slice(0, 8)} has been successfully received.\n\nThank you for your purchase!`;
                sendWhatsAppMessage({
                  phone: orderRecord.customer_phone,
                  message: paymentMessage,
                  orderId: orderRecord.id
                }).catch(err => console.error('Failed to send payment success notification:', err));
              }
              break;
              
            case 'shipped': {
              // Get tracking info from order or use placeholder
              const trackingLink = orderRecord.tracking_link || `${window.location.origin}/track/${orderRecord.id}`;
              const carrier = orderRecord.shipping_carrier || 'Our Delivery Partner';
              
              // Send order shipped notification
              const shippedMessage = `🚚 *Order Shipped* 🚚\n\nHi ${orderRecord.customer_name},\n\nGreat news! Your order #${orderRecord.id.slice(0, 8)} has been shipped.\n\nCarrier: ${carrier}\nTracking: ${trackingLink}\n\nThank you for your patience!`;
              sendWhatsAppMessage({
                phone: orderRecord.customer_phone,
                message: shippedMessage,
                orderId: orderRecord.id
              }).catch(err => console.error('Failed to send order shipped notification:', err));
              break;
            }
              
            case 'out_for_delivery':
              // Send out for delivery notification
              const deliveryMessage = `🚚 *Out for Delivery* 🚚\n\nHi ${orderRecord.customer_name},\n\nYour order #${orderRecord.id.slice(0, 8)} is out for delivery today!\n\nPlease ensure someone is available to receive it.\n\nExcited for you to receive your items!`;
              sendWhatsAppMessage({
                phone: orderRecord.customer_phone,
                message: deliveryMessage,
                orderId: orderRecord.id
              }).catch(err => console.error('Failed to send out for delivery notification:', err));
              break;
              
            case 'delivered': {
              const feedbackLink = `${window.location.origin}/feedback/${orderRecord.id}`;
              
              // Send order delivered notification
              const deliveredMessage = `📦 *Order Delivered* 📦\n\nHi ${orderRecord.customer_name},\n\nYour order #${orderRecord.id.slice(0, 8)} has been delivered!\n\nWe hope you love your purchase. Please share your feedback here: ${feedbackLink}\n\nThank you for shopping with us!`;
              sendWhatsAppMessage({
                phone: orderRecord.customer_phone,
                message: deliveredMessage,
                orderId: orderRecord.id
              }).catch(err => console.error('Failed to send order delivered notification:', err));
              break;
            }
              
            case 'cancelled':
              // If refunded, send refund confirmation
              if (data.refund_amount || orderRecord.refund_amount) {
                const refundAmount = data.refund_amount || orderRecord.refund_amount || orderRecord.totalAmount;
                
                // Send refund confirmation
                const refundMessage = `💰 *Refund Processed* 💰\n\nHi ${orderRecord.customer_name},\n\nWe've processed your refund of ₹${refundAmount} for order #${orderRecord.id.slice(0, 8)}.\n\nThe amount should appear in your account within 5-7 business days.\n\nThank you for your patience.`;
                sendWhatsAppMessage({
                  phone: orderRecord.customer_phone,
                  message: refundMessage,
                  orderId: orderRecord.id
                }).catch(err => console.error('Failed to send refund confirmation:', err));
              }
              break;
          }
        }
        
        // Handle payment status changes
        if (data.payment_status && data.payment_status !== paymentStatus && record.customer_phone) {
          const orderRecord = record as unknown as Order;
          
          if (data.payment_status === 'paid') {
            // Send payment success notification
            const paymentMessage = `✅ *Payment Successful* ✅\n\nHi ${orderRecord.customer_name},\n\nYour payment of ₹${orderRecord.total} for order #${orderRecord.id.slice(0, 8)} has been successfully received.\n\nThank you for your purchase!`;
            sendWhatsAppMessage({
              phone: orderRecord.customer_phone,
              message: paymentMessage,
              orderId: orderRecord.id
            }).catch(err => console.error('Failed to send payment success notification:', err));
          } else if (data.payment_status === 'failed') {
            const retryUrl = `${window.location.origin}/checkout/retry/${orderRecord.id}`;
            
            // Send payment failed notification
            const failedMessage = `❌ *Payment Failed* ❌\n\nHi ${orderRecord.customer_name},\n\nWe couldn't process your payment of ₹${orderRecord.total} for order #${orderRecord.id.slice(0, 8)}.\n\nPlease try again using this link: ${retryUrl}\n\nIf you need assistance, reply to this message.`;
            sendWhatsAppMessage({
              phone: orderRecord.customer_phone,
              message: failedMessage,
              orderId: orderRecord.id
            }).catch(err => console.error('Failed to send payment failed notification:', err));
          }
        }
        
        return record;
      } catch (error) {
        console.error('Error updating order:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update order: ' + error.message);
    },
  });

  // Delete order
  const deleteOrder = useMutation({
    mutationFn: async (id: string) => {
      try {
        await ensureAdminAuth();
        await pb.collection('orders').delete(id);
      } catch (error) {
        console.error('Error deleting order:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete order: ' + error.message);
    },
  });

  return {
    orders: data?.items || [],
    totalItems: data?.totalItems || 0,
    isLoading,
    error,
    createOrder,
    updateOrder,
    deleteOrder,
  };
}
