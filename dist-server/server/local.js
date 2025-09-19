import app from './index';
import { createServer } from 'http';
import { writeFileSync } from 'fs';
import { join } from 'path';
const DEFAULT_PORT = parseInt(process.env.SERVER_PORT || '3001', 10);
const ALTERNATIVE_PORTS = [3002, 3003, 3004, 4001, 4002, 4003];
const server = createServer(app);
const savePortInfo = (port) => {
    try {
        const portInfoPath = join(process.cwd(), 'port-info.json');
        writeFileSync(portInfoPath, JSON.stringify({ port }));
        console.log(`Port information saved to ${portInfoPath}`);
    }
    catch (err) {
        console.error('Failed to save port information:', err);
    }
};
const startServer = (port) => {
    return new Promise((resolve, reject) => {
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`Port ${port} is already in use, trying another port...`);
                reject(err);
            }
            else {
                reject(err);
            }
        });
        server.once('listening', () => {
            console.log(`Email server running on port ${port}`);
            savePortInfo(port);
            resolve(port);
        });
        server.listen(port);
    });
};
const tryPorts = async () => {
    try {
        await startServer(DEFAULT_PORT);
    }
    catch (err) {
        let started = false;
        for (const port of ALTERNATIVE_PORTS) {
            try {
                await startServer(port);
                started = true;
                break;
            }
            catch (err) {
                console.log(`Port ${port} also failed, trying next...`);
            }
        }
        if (!started) {
            console.error('Failed to start server on any port');
            process.exit(1);
        }
    }
};
tryPorts();
