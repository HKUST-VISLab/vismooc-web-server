// import { createServer } from "http";
import { CONFIG, initAll } from './init';
import Server from './server';

export default async function main() {

    // Save your local vars in .env for testing. DO NOT VERSION CONTROL `.env`!.
    // if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") require("dotenv").config();
    await initAll();

    /**
     * Get port from environment and store in Express.
     */
    // const app = Server();
    // const port = CONFIG.port;
    const server = Server().listen(CONFIG.port);

    /**
     * Listen on provided port, on all network interfaces.
     */
    // server.listen(port);
    server.on('listening', () => {
        const addr = server.address();
        console.info(`Listening on port ${addr.port}`);
    });

    server.on('error', (error) => {
        if ((error as any).syscall !== 'listen') {
            throw error;
        }
        const bind = `Port ${CONFIG.port}`;

        // handle specific listen errors with friendly messages
        switch ((error as any).code) {
            case 'EACCES':
                console.error(`${bind} requires elevated privileges`);
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(`${bind} is already in use`);
                process.exit(1);
                break;
            default:
                throw error;
        }
    });
}

main();
