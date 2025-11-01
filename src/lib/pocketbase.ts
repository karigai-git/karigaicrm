import PocketBase from 'pocketbase';

// Initialize PocketBase with the URL from environment variables
export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'https://backend-pocketbase.7za6uc.easypanel.host');

// Disable auto-cancellation of requests which is causing issues
pb.autoCancellation(false);

// Ensure a user is authenticated (no auto-admin)
export const ensureAdminAuth = async () => {
  try {
    if (pb.authStore.isValid) {
      return pb.authStore.model;
    }
    throw new Error('Not authenticated');
  } catch (error) {
    console.error('Auth check failed:', error);
    throw error;
  }
};

// User login using default PocketBase users collection
export const authenticateAdmin = async (email: string, password: string) => {
  try {
    const authData = await pb.collection('users').authWithPassword(email, password);
    return authData;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

// Helper functions for orders
export const getOrders = async (limit = 50) => {
  try {
    await ensureAdminAuth();
    const records = await pb.collection('orders').getList(1, limit, {
      sort: '-created', 
      expand: 'user_id,shipping_address',
    });
    return records;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

export const getOrderById = async (id: string) => {
  try {
    await ensureAdminAuth();
    const record = await pb.collection('orders').getOne(id, {
      expand: 'user_id,shipping_address,items',
    });
    return record;
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    throw error;
  }
};

export const updateOrderStatus = async (id: string, status: string) => {
  try {
    await ensureAdminAuth();
    const record = await pb.collection('orders').update(id, { status });
    return record;
  } catch (error) {
    console.error(`Error updating order ${id}:`, error);
    throw error;
  }
};

// Update tracking details and mark as shipped
export const updateOrderTrackingAndShip = async (
  id: string,
  tracking_code: string,
  tracking_url: string
) => {
  try {
    await ensureAdminAuth();
    const data: any = {
      tracking_code,
      tracking_url,
      status: 'shipped',
    };
    const record = await pb.collection('orders').update(id, data);
    return record;
  } catch (error) {
    console.error(`Error updating tracking for order ${id}:`, error);
    throw error;
  }
};

// Get dashboard metrics
export const getDashboardMetrics = async () => {
  try {
    await ensureAdminAuth();
    
    // Get all orders to calculate metrics
    const ordersResult = await pb.collection('orders').getFullList({
      sort: '-created',
    });
    
    // Calculate the metrics using ONLY paid orders
    const paidOrders = ordersResult.filter(order => order.payment_status === 'paid');
    const totalOrders = paidOrders.length;

    // Pending = orders that are NOT paid
    const pendingOrders = ordersResult.filter(order => order.payment_status !== 'paid').length;

    // Completed orders by delivery status (unchanged)
    const completedOrders = ordersResult.filter(order => order.status === 'delivered').length;

    // Revenue metrics from PAID orders only
    const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.total || 0), 0);

    const averageOrderValue = totalOrders > 0
      ? totalRevenue / totalOrders
      : 0;
    
    // Calculate today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const revenueToday = ordersResult
      .filter(order => {
        const orderDate = new Date(order.created);
        return orderDate >= today && order.payment_status === 'paid';
      })
      .reduce((sum, order) => sum + (order.total || 0), 0);
    
    return {
      total_orders: totalOrders,
      pending_orders: pendingOrders,
      completed_orders: completedOrders,
      total_revenue: totalRevenue,
      average_order_value: averageOrderValue,
      revenue_today: revenueToday
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw error;
  }
};

// Get revenue data for chart (monthly revenue)
export const getMonthlyRevenueData = async () => {
  try {
    await ensureAdminAuth();
    
    // Get all orders
    const ordersResult = await pb.collection('orders').getFullList({
      sort: 'created',
    });
    
    // Get current year
    const currentYear = new Date().getFullYear();
    
    // Create an object to store monthly revenue
    const monthlyRevenue = {
      'Jan': 0, 'Feb': 0, 'Mar': 0, 'Apr': 0, 'May': 0, 'Jun': 0,
      'Jul': 0, 'Aug': 0, 'Sep': 0, 'Oct': 0, 'Nov': 0, 'Dec': 0
    };
    
    // Calculate revenue for each month
    ordersResult.forEach(order => {
      const orderDate = new Date(order.created);
      
      // Only include orders from current year
      if (orderDate.getFullYear() === currentYear) {
        const month = orderDate.toLocaleString('default', { month: 'short' });
        monthlyRevenue[month] += (order.total || 0);
      }
    });
    
    // Convert to array format expected by chart
    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue
    }));
  } catch (error) {
    console.error('Error fetching monthly revenue data:', error);
    throw error;
  }
};

export const getImageUrl = (collectionId: string, recordId: string, fileName: string) => {
  if (!collectionId || !recordId || !fileName) {
    console.warn('Missing parameters for getImageUrl', { collectionId, recordId, fileName });
    return 'https://placehold.co/400x400/e2e8f0/64748b?text=No+Image';
  }
  const envBase = import.meta.env.VITE_POCKETBASE_URL as string | undefined;
  const fallbackEnv = (import.meta.env.VITE_PB_FALLBACK_URL as string | undefined) || (import.meta.env.PUBLIC_PB_URL as string | undefined);
  // Last-resort hardcoded fallback (update if backend host changes)
  const hardcoded = 'https://backend-pocketbase.p3ibd8.easypanel.host';
  const base = envBase || fallbackEnv || hardcoded;
  return `${base}/api/files/${collectionId}/${recordId}/${fileName}`;
};
