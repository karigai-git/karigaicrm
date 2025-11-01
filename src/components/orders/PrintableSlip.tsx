import React, { forwardRef } from 'react';
import Barcode from 'react-barcode';
import { Order } from '@/types/schema';

// Layout options for printing
export type LayoutOption = 1 | 2 | 4 | 6;

// This component is what will actually be printed.
// It's designed to be roughly 4x4 inches.
export const PrintableSlip = forwardRef<HTMLDivElement, { orders: Order[]; layout: LayoutOption; hideDetails?: boolean; largeAddress?: boolean }>(({ orders, layout, hideDetails = false, largeAddress = false }, ref) => {
  if (!orders || orders.length === 0) {
    return null;
  }

  // Define grid layout based on number of slips per page
  const getGridStyles = () => {
    switch (layout) {
      case 2: return 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 print:gap-2';
      case 4: return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 sm:gap-6 print:gap-2';
      case 6: return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 print:gap-2';
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
        const name = it?.name || (typeof it?.product === 'string' ? it.product : it?.product?.name) || it?.title || 'Item';
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
      // First, try to normalize doubled quotes patterns like ""key"": and ""value""
      const normalizeDoubledQuotes = (str: string) =>
        str
          .replace(/\\"{2}/g, '\\"') // \"\" => \"
          .replace(/"{2}([^"])/g, '"$1') // ""X => "X
          .replace(/([^\\])"{2}/g, '$1"'); // X"" => X"
      // JSON array case
      if ((t.startsWith('[') && t.endsWith(']')) || (t.startsWith('{') && t.endsWith('}'))) {
        try {
          const normalized = normalizeDoubledQuotes(t);
          const parsed = JSON.parse(normalized);
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          arr.forEach((it: any) => {
            const name = it?.name || it?.title || (typeof it?.product === 'string' ? it.product : it?.product?.name) || 'Item';
            const qty = it?.quantity ?? it?.qty ?? 1;
            const price = it?.price ?? it?.unitPrice ?? 0;
            pushRow(name, qty, price, it?.total);
          });
          if (rows.length > 0) return rows;
        } catch {
          // ignore and fall through to relaxed parsing
        }
      }
      // Relaxed parser: try to find object-like segments and parse them
      try {
        const objects = t.match(/\{[^}]*\}/g) || [];
        for (const seg of objects) {
          let s = seg
            .replace(/\\"/g, '"')        // unescape quotes
            .replace(/'([^']*)'/g, '"$1"') // single to double quotes
            .replace(/,\s*}/g, '}');        // remove trailing commas before }
          s = normalizeDoubledQuotes(s);
          try {
            const it = JSON.parse(s);
            const name = it?.name || it?.title || (typeof it?.product === 'string' ? it.product : it?.product?.name) || 'Item';
            const qty = it?.quantity ?? it?.qty ?? 1;
            const price = it?.price ?? it?.unitPrice ?? 0;
            pushRow(name, qty, price, it?.total);
          } catch {}
        }
        if (rows.length > 0) return rows;
      } catch {}

      // Heuristic extraction: find pairs (name|product) and quantity numbers
      try {
        const nameMatches = Array.from(t.matchAll(/"(?:name|product)"\s*:\s*"\s*([^"\n]+)\s*"/g));
        const qtyMatches = Array.from(t.matchAll(/"quantity"\s*:\s*"?(\d+)/g));
        const count = Math.max(nameMatches.length, qtyMatches.length);
        for (let i = 0; i < count; i++) {
          const nm = nameMatches[i]?.[1] || 'Item';
          const qv = qtyMatches[i]?.[1] || '1';
          pushRow(nm, Number(qv) || 1, 0, 0);
        }
        if (rows.length > 0) return rows;
      } catch {}

      // If still not parsable, skip items rendering
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
            
            // resolve items once and compute subtotal fallback
            const items = resolveItems(order);
            const fallbackSubtotal = items.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
            const effectiveSubtotal = typeof (order as any).subtotal === 'number' && (order as any).subtotal > 0
              ? (order as any).subtotal
              : fallbackSubtotal;

            return (
              <div key={order.id} className={`${getSlipStyles()} border-2 border-black flex flex-col font-sans text-xs overflow-hidden mb-0 mx-auto`}>
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
                    <p className={largeAddress ? "font-bold text-sm md:text-base" : "font-bold text-xs md:text-sm"}>TO:</p>
                    <div className="pl-2">
                      <p className={largeAddress ? "text-sm md:text-base font-bold" : "text-xs md:text-sm font-bold"}>{customerName}</p>
                      {addressLines.map((line, idx) => (
                        <p key={idx} className={largeAddress ? "text-sm md:text-base leading-tight break-words" : "text-xs md:text-sm leading-tight break-words"}>{line}</p>
                      ))}
                      <p className={largeAddress ? "text-sm md:text-base" : "text-xs md:text-sm"}>Phone: {customerPhone}</p>
                    </div>
                  </div>

                  {/* Product Details (optional) */}
                  {!hideDetails && (
                    <div className="border-t border-b border-dashed py-1 my-1">
                      <div className="space-y-1">
                        {items.length > 0 ? (
                          items.map((row, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="truncate">{row.name}</span>
                              <span className="font-medium">× {row.quantity}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-1 text-gray-500">Order items not available</div>
                        )}
                      </div>

                      <div className="mt-2 border-t pt-1">
                        <div className="flex justify-between"><span>Subtotal:</span><span>₹{(Number(effectiveSubtotal) || 0).toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Shipping:</span><span>₹{shippingFee.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold"><span>Total:</span><span>₹{(Number(order.total) || Number(effectiveSubtotal) + shippingFee).toFixed(2)}</span></div>
                      </div>
                    </div>
                  )}

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
                  <div className="w-full flex justify-center mb-1">
                    <img
                      src="https://shop.karigaistore.in/karigai-logo.webp"
                      alt="Karigai logo"
                      className="inline-block"
                      style={{ maxWidth: '120px', height: 'auto' }}
                      onError={(e) => {
                        // fallback: hide broken image
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
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
