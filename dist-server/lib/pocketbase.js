import PocketBase from 'pocketbase';
// Initialize PocketBase with the URL from environment variables
export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'https://backend-pocketbase.7za6uc.easypanel.host');
// Disable auto-cancellation of requests which is causing issues
pb.autoCancellation(false);
// Add a timeout to PocketBase requests
const AUTH_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 3;
// Prevent multiple concurrent auth attempts with a simple lock
let authInProgress = false;
let authPromiseResolve = null;
let authPromiseReject = null;
let authPromise = null;
// Auto authenticate with admin credentials
export const initAdmin = async (retryCount = 0) => {
    // If authentication is already in progress, return the existing promise
    if (authInProgress && authPromise) {
        return authPromise;
    }
    // Create a new authentication promise
    authInProgress = true;
    authPromise = new Promise((resolve, reject) => {
        authPromiseResolve = resolve;
        authPromiseReject = reject;
    });
    try {
        if (retryCount > MAX_RETRIES) {
            console.error('Max authentication retries reached');
            const error = new Error('Failed to authenticate after multiple attempts');
            if (authPromiseReject)
                authPromiseReject(error);
            authInProgress = false;
            throw error;
        }
        // For demo/development fallback credentials 
        const email = import.meta.env.VITE_POCKETBASE_ADMIN_EMAIL || 'nnirmal7107@gmail.com';
        const password = import.meta.env.VITE_POCKETBASE_ADMIN_PASSWORD || 'Kamala@7107';
        // Wrap the auth request in a timeout
        let timeoutId = null;
        try {
            // Set a timeout
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error('Authentication timed out'));
                }, AUTH_TIMEOUT);
            });
            // Make the auth request
            const authData = await Promise.race([
                pb.admins.authWithPassword(email, password),
                timeoutPromise
            ]);
            // Clear the timeout
            if (timeoutId)
                clearTimeout(timeoutId);
            console.log('Admin authenticated successfully');
            if (authPromiseResolve)
                authPromiseResolve(authData);
            authInProgress = false;
            return authData;
        }
        catch (innerError) {
            // Clear the timeout if it exists
            if (timeoutId)
                clearTimeout(timeoutId);
            throw innerError;
        }
    }
    catch (error) {
        console.error(`Admin authentication failed (attempt ${retryCount + 1}):`, error);
        // Check if it's a network error (status 0) and retry
        if ((error?.status === 0 || error?.message === 'Authentication timed out') && retryCount < MAX_RETRIES) {
            console.log(`Retrying authentication in ${(retryCount + 1) * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
            authInProgress = false;
            return initAdmin(retryCount + 1);
        }
        // If it's not a network error or we've exceeded retries, reject the promise and throw the error
        if (authPromiseReject)
            authPromiseReject(error);
        authInProgress = false;
        throw error;
    }
};
// Initialize admin authentication with a more graceful failure approach
let authInitialized = false;
initAdmin()
    .then(() => {
    authInitialized = true;
    console.log('Initial admin authentication successful');
})
    .catch(error => {
    console.error('Initial admin authentication failed, will retry on demand:', error);
});
// Helper function to ensure admin authentication
export const ensureAdminAuth = async () => {
    try {
        // If auth is valid, return the model
        if (pb.authStore.isValid && pb.authStore.model?.admin) {
            return pb.authStore.model;
        }
        // Otherwise try to authenticate
        return await initAdmin();
    }
    catch (error) {
        console.error('Failed to ensure admin authentication:', error);
        throw error;
    }
};
// Helper function for admin login
export const authenticateAdmin = async (email, password) => {
    try {
        const authData = await pb.admins.authWithPassword(email, password);
        console.log('Admin authenticated with credentials');
        return authData;
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
};
export const getOrderById = async (id) => {
    try {
        await ensureAdminAuth();
        const record = await pb.collection('orders').getOne(id, {
            expand: 'user_id,shipping_address,items',
        });
        return record;
    }
    catch (error) {
        console.error(`Error fetching order ${id}:`, error);
        throw error;
    }
};
export const updateOrderStatus = async (id, status) => {
    try {
        await ensureAdminAuth();
        const record = await pb.collection('orders').update(id, { status });
        return record;
    }
    catch (error) {
        console.error(`Error updating order ${id}:`, error);
        throw error;
    }
};
// Update tracking details and mark as shipped
export const updateOrderTrackingAndShip = async (id, tracking_code, tracking_url) => {
    try {
        await ensureAdminAuth();
        const data = {
            tracking_code,
            tracking_url,
            status: 'shipped',
        };
        const record = await pb.collection('orders').update(id, data);
        return record;
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error fetching monthly revenue data:', error);
        throw error;
    }
};
export const getImageUrl = (collectionId, recordId, fileName) => {
    if (!collectionId || !recordId || !fileName) {
        console.warn('Missing parameters for getImageUrl', { collectionId, recordId, fileName });
        return 'https://placehold.co/400x400/e2e8f0/64748b?text=No+Image';
    }
    const envBase = import.meta.env.VITE_POCKETBASE_URL;
    const fallbackEnv = import.meta.env.VITE_PB_FALLBACK_URL || import.meta.env.PUBLIC_PB_URL;
    // Last-resort hardcoded fallback (update if backend host changes)
    const hardcoded = 'https://backend-pocketbase.p3ibd8.easypanel.host';
    const base = envBase || fallbackEnv || hardcoded;
    return `${base}/api/files/${collectionId}/${recordId}/${fileName}`;
};
