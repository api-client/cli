import net from 'net';
import os from 'os';

export interface Options extends Omit<net.ListenOptions, 'port'> {
	/**
	A preferred port or an iterable of preferred ports to use.
	*/
	readonly port?: number | Iterable<number>;

	/**
	The host on which port resolution should be performed. Can be either an IPv4 or IPv6 address.

	By default, it checks availability on all local addresses defined in [OS network interfaces](https://nodejs.org/api/os.html#os_os_networkinterfaces). If this option is set, it will only check the given host.
	*/
	readonly host?: string;
}

class Locked extends Error {
	constructor(port = 0) {
		super(`${port} is locked`);
	}
}

const lockedPorts = {
	old: new Set(),
	young: new Set(),
};

// On this interval, the old locked ports are discarded,
// the young locked ports are moved to old locked ports,
// and a new young set for locked ports are created.
const releaseOldLockedPortsIntervalMs = 1000 * 15;

// Lazily create interval on first use
let interval:NodeJS.Timer;

const getLocalHosts = (): Set<string | undefined> => {
	const interfaces = os.networkInterfaces();

	// Add undefined value for createServer function to use default host,
	// and default IPv4 host in case createServer defaults to IPv6.
	const results = new Set([undefined, '0.0.0.0']);

	for (const _interface of Object.values(interfaces)) {
    if (_interface) {
      for (const config of _interface) {
        results.add(config.address);
      }
    }
	}

	return results;
};

const checkAvailablePort = (options: net.ListenOptions): Promise<number> =>
	new Promise((resolve, reject) => {
		const server = net.createServer();
		server.unref();
		server.on('error', reject);

		server.listen(options, () => {
			const {port} = server.address() as net.AddressInfo;
			server.close(() => {
				resolve(port);
			});
		});
	});

const getAvailablePort = async (options: net.ListenOptions, hosts: Set<string | undefined>): Promise<number | undefined> => {
	if (options.host || options.port === 0) {
		return checkAvailablePort(options);
	}

	for (const host of hosts) {
		try {
			await checkAvailablePort({port: options.port, host}); // eslint-disable-line no-await-in-loop
		} catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const typed = error as any;
			if (!['EADDRNOTAVAIL', 'EINVAL'].includes(typed.code)) {
				throw typed;
			}
		}
	}

	return options.port;
};

const portCheckSequence = function * (ports?: number[] | Iterable<number>): IterableIterator<number|undefined> {
	if (ports) {
		yield * ports;
	}

	yield 0; // Fall back to 0 if anything else failed
};

/**
Get an available TCP port number.

@returns Port number.

@example
```
import getPort from 'get-port';

console.log(await getPort());
//=> 51402

// Pass in a preferred port
console.log(await getPort({port: 3000}));
// Will use 3000 if available, otherwise fall back to a random port

// Pass in an array of preferred ports
console.log(await getPort({port: [3000, 3001, 3002]}));
// Will use any element in the preferred ports array if available, otherwise fall back to a random port
```
*/
export default async function getPort(options?: Options): Promise<number> {
	let ports: number[] | Iterable<number> = [];

	if (options) {
    if (typeof options.port === 'number') {
      ports = [options.port];
    } else if (options.port) {
      ports = options.port;
    }
	}

	if (interval === undefined) {
		interval = setInterval(() => {
			lockedPorts.old = lockedPorts.young;
			lockedPorts.young = new Set();
		}, releaseOldLockedPortsIntervalMs);

		// Does not exist in some environments (Electron, Jest jsdom env, browser, etc).
		if (interval.unref) {
			interval.unref();
		}
	}

	const hosts = getLocalHosts();

	for (const port of portCheckSequence(ports)) {
		try {
			let availablePort = await getAvailablePort({...options, port}, hosts); // eslint-disable-line no-await-in-loop
			while (lockedPorts.old.has(availablePort) || lockedPorts.young.has(availablePort)) {
				if (port !== 0) {
					throw new Locked(port);
				}

				availablePort = await getAvailablePort({...options, port}, hosts); // eslint-disable-line no-await-in-loop
			}

			lockedPorts.young.add(availablePort);
      if (!availablePort) {
        throw new Error('No available ports found');
      }
			return availablePort;
		} catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const typed = error as any;
			if (!['EADDRINUSE', 'EACCES'].includes(typed.code) && !(typed instanceof Locked)) {
				throw error;
			}
		}
	}

	throw new Error('No available ports found');
}

/**
Generate port numbers in the given range `from`...`to`.

@param from - The first port of the range. Must be in the range `1024`...`65535`.
@param to - The last port of the range. Must be in the range `1024`...`65535` and must be greater than `from`.
@returns The port numbers in the range.

@example
```
import getPort, {portNumbers} from 'get-port';

console.log(await getPort({port: portNumbers(3000, 3100)}));
// Will use any port from 3000 to 3100, otherwise fall back to a random port
```
*/
export function portNumbers(from: number, to: number): Iterable<number> {
	if (!Number.isInteger(from) || !Number.isInteger(to)) {
		throw new TypeError('`from` and `to` must be integer numbers');
	}

	if (from < 1024 || from > 65_535) {
		throw new RangeError('`from` must be between 1024 and 65535');
	}

	if (to < 1024 || to > 65_536) {
		throw new RangeError('`to` must be between 1024 and 65536');
	}

	if (to < from) {
		throw new RangeError('`to` must be greater than or equal to `from`');
	}

	const generator = function * (from: number, to: number): IterableIterator<number> {
		for (let port = from; port <= to; port++) {
			yield port;
		}
	};

	return generator(from, to);
}
