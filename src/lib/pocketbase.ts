
import PocketBase from 'pocketbase';

// Initialize PocketBase with the URL from environment variables
export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'https://backend-pocketbase.7za6uc.easypanel.host/');

// Helper function to get authenticated admin user
export const authenticateAdmin = async (email: string, password: string) => {
  try {
    const authData = await pb.admins.authWithPassword(email, password);
    return authData;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

// Helper functions for orders
export const getOrders = async () => {
  try {
    const records = await pb.collection('orders').getList(1, 50, {
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
    const record = await pb.collection('orders').update(id, { status });
    return record;
  } catch (error) {
    console.error(`Error updating order ${id}:`, error);
    throw error;
  }
};
