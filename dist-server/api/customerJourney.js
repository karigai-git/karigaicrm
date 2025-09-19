import express from 'express';
import crypto from 'crypto';
import { pb, ensureAdminAuth } from '@/lib/pocketbase';
const router = express.Router();
// In-memory storage for demo purposes (replace with database in production)
let journeyEvents = [];
let customers = [];
// Webhook secret for signature verification
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret-key';
// Verify webhook signature
function verifyWebhookSignature(payload, signature) {
    try {
        const expectedSignature = crypto
            .createHmac('sha256', WEBHOOK_SECRET)
            .update(payload)
            .digest('hex');
        const providedSignature = signature.replace('sha256=', '');
        return crypto.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(providedSignature, 'hex'));
    }
    catch (error) {
        console.error('Error verifying webhook signature:', error);
        return false;
    }
}
// Validate webhook payload
function validateWebhookPayload(payload) {
    const errors = [];
    if (!payload.customer_id) {
        errors.push('customer_id is required');
    }
    if (!payload.event) {
        errors.push('event is required');
    }
    if (!payload.stage) {
        errors.push('stage is required');
    }
    if (!payload.timestamp) {
        errors.push('timestamp is required');
    }
    else {
        // Validate timestamp format
        const timestamp = new Date(payload.timestamp);
        if (isNaN(timestamp.getTime())) {
            errors.push('timestamp must be a valid ISO 8601 date');
        }
    }
    // Validate stage values
    const validStages = ['awareness', 'consideration', 'purchase', 'retention', 'advocacy'];
    if (payload.stage && !validStages.includes(payload.stage)) {
        errors.push(`stage must be one of: ${validStages.join(', ')}`);
    }
    // Validate event types
    const validEvents = [
        'stage_entered', 'stage_completed', 'purchase_made',
        'email_opened', 'link_clicked', 'form_submitted'
    ];
    if (payload.event && !validEvents.includes(payload.event)) {
        errors.push(`event must be one of: ${validEvents.join(', ')}`);
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
// Update or create customer data
function updateCustomerData(event) {
    let customer = customers.find(c => c.id === event.customer_id);
    if (!customer) {
        // Create new customer
        customer = {
            id: event.customer_id,
            name: event.customer_name || `Customer ${event.customer_id}`,
            email: event.customer_email || '',
            currentStage: event.stage,
            totalValue: event.metadata.value || 0,
            firstSeen: event.timestamp,
            lastActivity: event.timestamp,
            events: [event]
        };
        customers.push(customer);
    }
    else {
        // Update existing customer
        customer.currentStage = event.stage;
        customer.lastActivity = event.timestamp;
        customer.events.push(event);
        if (event.metadata.value) {
            customer.totalValue += event.metadata.value;
        }
        if (event.customer_name) {
            customer.name = event.customer_name;
        }
        if (event.customer_email) {
            customer.email = event.customer_email;
        }
    }
    return customer;
}
// CORS middleware
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Webhook-Signature');
    if (req.method === 'OPTIONS') {
        return res.status(204).send();
    }
    next();
});
// Webhook endpoint for receiving customer journey events
router.post('/webhook/customer-journey', async (req, res) => {
    try {
        const rawPayload = JSON.stringify(req.body);
        const signature = req.headers['x-webhook-signature'];
        // Log incoming webhook for debugging
        console.log('Received webhook:', {
            headers: req.headers,
            body: req.body,
            signature: signature
        });
        // Verify signature (skip in development mode)
        if (process.env.NODE_ENV === 'production' && signature) {
            if (!verifyWebhookSignature(rawPayload, signature)) {
                console.error('Invalid webhook signature');
                return res.status(401).json({
                    success: false,
                    error: 'Invalid webhook signature'
                });
            }
        }
        // Validate payload
        const validation = validateWebhookPayload(req.body);
        if (!validation.valid) {
            console.error('Invalid webhook payload:', validation.errors);
            return res.status(400).json({
                success: false,
                error: 'Invalid payload',
                details: validation.errors
            });
        }
        // Create event record
        const event = {
            id: crypto.randomUUID(),
            customer_id: req.body.customer_id,
            event: req.body.event,
            stage: req.body.stage,
            timestamp: req.body.timestamp,
            metadata: req.body.metadata || {},
            customer_name: req.body.customer_name,
            customer_email: req.body.customer_email
        };
        // Store event
        journeyEvents.unshift(event); // Add to beginning for latest-first order
        // Update customer data
        const customer = updateCustomerData(event);
        // Try to store in PocketBase if available
        try {
            await ensureAdminAuth();
            // Check if customer_journey_events collection exists, create if not
            try {
                await pb.collection('customer_journey_events').getList(1, 1);
            }
            catch (collectionError) {
                // Collection doesn't exist, create it
                await pb.collections.create({
                    name: 'customer_journey_events',
                    schema: [
                        {
                            name: 'customer_id',
                            type: 'text',
                            required: true,
                        },
                        {
                            name: 'event',
                            type: 'text',
                            required: true,
                        },
                        {
                            name: 'stage',
                            type: 'text',
                            required: true,
                        },
                        {
                            name: 'timestamp',
                            type: 'date',
                            required: true,
                        },
                        {
                            name: 'metadata',
                            type: 'json',
                        },
                        {
                            name: 'customer_name',
                            type: 'text',
                        },
                        {
                            name: 'customer_email',
                            type: 'text',
                        },
                    ],
                });
                console.log('Created customer_journey_events collection');
            }
            // Store event in PocketBase
            await pb.collection('customer_journey_events').create({
                customer_id: event.customer_id,
                event: event.event,
                stage: event.stage,
                timestamp: event.timestamp,
                metadata: event.metadata,
                customer_name: event.customer_name,
                customer_email: event.customer_email
            });
            console.log('Event stored in PocketBase successfully');
        }
        catch (pbError) {
            console.warn('Failed to store in PocketBase, using in-memory storage:', pbError);
        }
        // Log successful processing
        console.log('Processed customer journey event:', {
            customer_id: event.customer_id,
            event: event.event,
            stage: event.stage,
            timestamp: event.timestamp
        });
        // Return success response
        res.status(200).json({
            success: true,
            message: 'Event processed successfully',
            event_id: event.id,
            customer_stage: customer.currentStage,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get customer journey data
router.get('/customer-journey/data', async (req, res) => {
    try {
        // Try to load from PocketBase first
        try {
            await ensureAdminAuth();
            const pbEvents = await pb.collection('customer_journey_events').getList(1, 100, {
                sort: '-timestamp'
            });
            // Convert PocketBase events to our format
            const convertedEvents = pbEvents.items.map(item => ({
                id: item.id,
                customer_id: item.customer_id,
                event: item.event,
                stage: item.stage,
                timestamp: item.timestamp,
                metadata: item.metadata || {},
                customer_name: item.customer_name,
                customer_email: item.customer_email
            }));
            // Rebuild customer data from events
            const customerMap = new Map();
            convertedEvents.forEach(event => {
                let customer = customerMap.get(event.customer_id);
                if (!customer) {
                    customer = {
                        id: event.customer_id,
                        name: event.customer_name || `Customer ${event.customer_id}`,
                        email: event.customer_email || '',
                        currentStage: event.stage,
                        totalValue: event.metadata.value || 0,
                        firstSeen: event.timestamp,
                        lastActivity: event.timestamp,
                        events: [event]
                    };
                    customerMap.set(event.customer_id, customer);
                }
                else {
                    customer.events.push(event);
                    customer.lastActivity = event.timestamp;
                    if (new Date(event.timestamp) > new Date(customer.lastActivity)) {
                        customer.currentStage = event.stage;
                    }
                    if (event.metadata.value) {
                        customer.totalValue += event.metadata.value;
                    }
                }
            });
            const pbCustomers = Array.from(customerMap.values());
            return res.json({
                success: true,
                customers: pbCustomers,
                events: convertedEvents
            });
        }
        catch (pbError) {
            console.warn('PocketBase not available, using in-memory data:', pbError);
        }
        // Fallback to in-memory data
        res.json({
            success: true,
            customers: customers,
            events: journeyEvents
        });
    }
    catch (error) {
        console.error('Error fetching journey data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch journey data'
        });
    }
});
// Get customer details by ID
router.get('/customer-journey/customer/:id', async (req, res) => {
    try {
        const customerId = req.params.id;
        const customer = customers.find(c => c.id === customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }
        res.json({
            success: true,
            customer: customer
        });
    }
    catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch customer data'
        });
    }
});
// Health check endpoint
router.get('/customer-journey/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        events_count: journeyEvents.length,
        customers_count: customers.length
    });
});
export default router;
