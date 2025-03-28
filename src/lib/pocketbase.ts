import PocketBase from 'pocketbase';

// Initialize PocketBase with the URL from environment variables
export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL);

// Add a timeout to PocketBase requests
const AUTH_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;

// Auto authenticate with admin credentials
export const initAdmin = async (retryCount = 0) => {
  try {
    if (retryCount > MAX_RETRIES) {
      console.error('Max authentication retries reached');
      throw new Error('Failed to authenticate after multiple attempts');
    }
    
    // Set a timeout for the authentication request
    const authPromise = pb.admins.authWithPassword(
      'nnirmal7107@gmail.com',
      'Kamala@7107'
    );
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Authentication timed out')), AUTH_TIMEOUT);
    });
    
    const authData = await Promise.race([authPromise, timeoutPromise]);
    console.log('Admin authenticated successfully');
    return authData;
  } catch (error) {
    console.error(`Admin authentication failed (attempt ${retryCount + 1}):`, error);
    
    // Check if it's a network error (status 0) and retry
    if (error?.status === 0 && retryCount < MAX_RETRIES) {
      console.log(`Retrying authentication in ${(retryCount + 1) * 1000}ms...`);
      await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
      return initAdmin(retryCount + 1);
    }
    
    // If it's not a network error or we've exceeded retries, throw the error
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
  } catch (error) {
    console.error('Failed to ensure admin authentication:', error);
    throw error;
  }
};

// Helper function for admin login
export const authenticateAdmin = async (email: string, password: string) => {
  try {
    const authData = await pb.admins.authWithPassword(email, password);
    console.log('Admin authenticated with credentials');
    return authData;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

// Helper functions for orders
export const getOrders = async () => {
  try {
    await ensureAdminAuth();
    const records = await pb.collection('orders').getList(1, 50, {
      sort: 'created', 
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

export const getImageUrl = (collectionId: string, recordId: string, fileName: string) => {
  if (!collectionId || !recordId || !fileName) {
    console.warn('Missing parameters for getImageUrl', { collectionId, recordId, fileName });
    return 'https://placehold.co/400x400/e2e8f0/64748b?text=No+Image';
  }
  return `${import.meta.env.VITE_POCKETBASE_URL}/api/files/${collectionId}/${recordId}/${fileName}`;
};
