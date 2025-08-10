import React, { forwardRef } from 'react';
import Barcode from 'react-barcode';
import { Order } from '@/types/schema';

// Layout options for printing
export type LayoutOption = 1 | 2 | 4 | 6;

// This component is what will actually be printed.
// It's designed to be roughly 4x4 inches.
export const PrintableSlip = forwardRef<HTMLDivElement, { orders: Order[], layout: LayoutOption }>(({ orders, layout }, ref) => {
  if (!orders || orders.length === 0) {
    return null;
  }

  // Define grid layout based on number of slips per page
  const getGridStyles = () => {
    switch (layout) {
      case 2: return 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8';
      case 4: return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 sm:gap-6';
      case 6: return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4';
      default: return '';
    }
  };

  // Calculate slip size based on layout
  const getSlipStyles = () => {
    switch (layout) {
      case 1: return 'w-full sm:w-[4in] min-h-[6in] p-2 sm:p-4 break-after-page';
      case 2: return 'w-full sm:w-[3.5in] min-h-[4in] p-2 sm:p-3';
      case 4: return 'w-full sm:w-[3.3in] min-h-[3.8in] p-1 sm:p-2';
      case 6: return 'w-full sm:w-[2.3in] min-h-[3.5in] p-1';
      default: return 'w-full sm:w-[4in] min-h-[6in] p-2 sm:p-4';
    }
  };

  // Group orders by page based on layout
  const groupOrdersByPage = () => {
    const groupedOrders = [];
    for (let i = 0; i < orders.length; i += layout) {
      groupedOrders.push(orders.slice(i, i + layout));
    }
    return groupedOrders;
  };

  const groupedOrders = layout === 1 ? [[...orders]] : groupOrdersByPage();
  
  // Resolve order items with multiple fallbacks
  const resolveItems = (order: any) => {
    const rows: Array<{ name: string; quantity: number; price: number; total: number }> = [];
    const pushRow = (name: any, quantity: any, price: any, total?: any) => {
      const q = Number(quantity) || 1;
      const p = Number(price) || 0;
      const t = total != null ? Number(total) : q * p;
      rows.push({ name: String(name || 'Item'), quantity: q, price: p, total: t });
    };
    
    // 1) Expanded items from PocketBase
    if (Array.isArray(order?.expand?.items) && order.expand.items.length > 0) {
      order.expand.items.forEach((it: any) => {
        const name = it?.name || it?.expand?.product_id?.name || it?.product_name || 'Item';
        pushRow(name, it?.quantity, it?.price, it?.total);
      });
      return rows;
    }

    // 2) Direct items array on the record, if any
    if (Array.isArray(order?.items) && order.items.length > 0) {
      order.items.forEach((it: any) => {
        const name = it?.name || it?.expand?.product_id?.name || it?.product_name || 'Item';
        pushRow(name, it?.quantity, it?.price, it?.total);
      });
      return rows;
    }

    // 3) Handle 'products' when it's already an array
    if (Array.isArray(order?.products) && order.products.length > 0) {
      order.products.forEach((it: any) => {
        const name = it?.name || it?.product?.name || it?.title || 'Item';
        const qty = it?.quantity ?? it?.qty ?? 1;
        // Prefer explicit item.price, else fall back to product.price/original_price
        const price = it?.price ?? it?.unitPrice ?? it?.product?.price ?? it?.product?.original_price ?? 0;
        pushRow(name, qty, price, it?.total);
      });
      return rows;
    }

    // 4) Try to parse 'products' field which might be JSON or summary string
    const prod = order?.products;
    if (typeof prod === 'string' && prod.trim()) {
      const t = prod.trim();
      // JSON array case
      if ((t.startsWith('[') && t.endsWith(']')) || (t.startsWith('{') && t.endsWith('}'))) {
        try {
          const parsed = JSON.parse(t);
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          arr.forEach((it: any) => {
            const name = it?.name || it?.title || it?.product || 'Item';
            const qty = it?.quantity ?? it?.qty ?? 1;
            const price = it?.price ?? it?.unitPrice ?? 0;
            pushRow(name, qty, price, it?.total);
          });
          if (rows.length > 0) return rows;
        } catch {
          // ignore and fall through
        }
      }
      // Fallback: comma-separated summary string -> single line
      pushRow(t, 1, order?.subtotal || 0, order?.subtotal || 0);
      return rows;
    }

    return rows; // possibly empty
  };
  
  return (
    <div ref={ref} className="printable-area">
      {groupedOrders.map((pageOrders, pageIndex) => (
        <div key={pageIndex} className={`${getGridStyles()} page break-after-page mb-0 p-0 print:p-0`}>
          {pageOrders.map((order) => {
            // Extract shipping address from order
            const address = order.expand?.shipping_address;
            const customerName = address ? address.name : order.customer_name || '';
            const customerPhone = address ? address.phone : order.customer_phone || '';
            const rawAddress = address
              ? `${address.street || ''}${address.street ? ', ' : ''}${address.city || ''}${address.city ? ', ' : ''}${address.state || ''} ${address.postal_code || ''}`.trim()
              : (order.shipping_address_text || order.shipping_address || '').toString();

            // Parse JSON address text if applicable
            const formatAddressLines = (txt: string): string[] => {
              const safe = (s: any) => (typeof s === 'string' ? s : s?.toString?.() || '');
              if (!txt) return [];
              const t = txt.trim();
              if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
                try {
                  const obj = JSON.parse(t);
                  if (Array.isArray(obj)) return obj.map((x) => safe(x)).filter(Boolean);
                  const line1 = [safe(obj.street), safe(obj.area), safe(obj.landmark)].filter(Boolean).join(', ');
                  const line2 = [safe(obj.city), safe(obj.state)].filter(Boolean).join(', ');
                  const line3 = [safe(obj.postalCode) || safe(obj.pincode), safe(obj.country)].filter(Boolean).join(' ');
                  return [line1, line2, line3].filter(Boolean);
                } catch {
                  // fallback to as-is string
                  return [txt];
                }
              }
              return [txt];
            };
            const addressLines = formatAddressLines(rawAddress);
            
            // Generate tracking number
            const trackingNumber = order.tracking_number || order.id.slice(0, 8);
            
            // Derive shipping fee from various possible fields and formats (type-safe, no any)
            const shippingFee = (() => {
              const rec = order as unknown as Record<string, unknown>;
              const raw = (rec['shipping_fee'] ?? rec['shipping_cost'] ?? rec['shippingCost'] ?? 0) as unknown;
              const num = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
              return Number.isFinite(num) ? num : 0;
            })();
            
            return (
              <div key={order.id} className={`${getSlipStyles()} border-2 border-black flex flex-col font-sans text-xs overflow-hidden mb-6 sm:mb-0 mx-auto`}>
                {/* Top Section: Tracking Info */}
                <div className="flex justify-between items-center border-b border-black pb-1 mb-1">
                  <div className="text-left">
                    <p className="font-bold text-xs">KARIGAI TRACKING #:</p>
                    <p className="text-sm font-bold">{trackingNumber}</p>
                  </div>
                  <div className="text-right">
                    {trackingNumber ? (
                      <Barcode value={String(trackingNumber)} height={35} width={1.2} fontSize={9} />
                    ) : (
                      <div className="w-[100px] h-[35px] border border-dashed flex items-center justify-center text-gray-400 text-xs">
                        No Tracking
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle Section */}
                <div className="flex-grow flex flex-col">
                  {/* To Address */}
                  <div className="mb-1">
                    <p className="font-bold text-xs md:text-sm">TO:</p>
                    <div className="pl-2">
                      <p className="text-xs md:text-sm font-bold">{customerName}</p>
                      {addressLines.map((line, idx) => (
                        <p key={idx} className="text-xs md:text-sm leading-tight break-words">{line}</p>
                      ))}
                      <p className="text-xs md:text-sm">Phone: {customerPhone}</p>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="border-t border-b border-dashed py-1 my-1">
                    <table className="w-full text-xs md:text-sm">
                      <tbody>
                        {resolveItems(order).map((row, index) => (
                          <React.Fragment key={index}>
                            <tr>
                              <td className="py-0.5 md:py-1">{row.name}</td>
                              <td className="py-0.5 md:py-1 text-right">{row.quantity} x ₹{row.price.toFixed(2)}</td>
                            </tr>
                            <tr className="border-b border-dotted">
                              <td></td>
                              <td className="py-0.5 md:py-1 text-right font-bold">₹{row.total.toFixed(2)}</td>
                            </tr>
                          </React.Fragment>
                        ))}

                        {resolveItems(order).length === 0 && (
                          <tr>
                            <td colSpan={2} className="text-center py-1 text-gray-500">Order items not available</td>
                          </tr>
                        )}
                        
                        {/* Subtotal */}
                        <tr>
                          <td className="py-0.5 md:py-1">Subtotal:</td>
                          <td className="py-0.5 md:py-1 text-right">₹{order.subtotal?.toFixed(2) || '0.00'}</td>
                        </tr>
                        
                        {/* Shipping */}
                        <tr>
                          <td className="py-0.5 md:py-1">Shipping:</td>
                          <td className="py-0.5 md:py-1 text-right">₹{shippingFee.toFixed(2)}</td>
                        </tr>
                        
                        {/* Tax */}
                        {order.tax > 0 && (
                          <tr>
                            <td className="py-0.5 md:py-1">Tax:</td>
                            <td className="py-0.5 md:py-1 text-right">₹{order.tax?.toFixed(2) || '0.00'}</td>
                          </tr>
                        )}
                        
                        {/* Discount */}
                        {order.discount > 0 && (
                          <tr>
                            <td className="py-0.5 md:py-1">Discount:</td>
                            <td className="py-0.5 md:py-1 text-right">-₹{order.discount?.toFixed(2) || '0.00'}</td>
                          </tr>
                        )}
                        
                        {/* Total */}
                        <tr className="font-bold">
                          <td className="py-0.5 md:py-1 text-sm">Total:</td>
                          <td className="py-0.5 md:py-1 text-right text-sm">₹{order.total?.toFixed(2) || '0.00'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Order Info */}
                  <div className="flex justify-between text-xs pt-1">
                    <div>
                      <p className="font-bold">Order #: {order.id.slice(0, 8)}</p>
                      <p>Date: {new Date(order.created).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Status: {order.status}</p>
                      <p>Payment: {order.payment_status}</p>
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Footer */}
                <div className="border-t border-black mt-1 pt-1 text-center">
                  <p className="text-xs font-bold">Thank you for shopping with Karigai!</p>
                  <p className="text-xs">For any questions, contact us at support@karigai.com</p>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
});

PrintableSlip.displayName = 'PrintableSlip';
