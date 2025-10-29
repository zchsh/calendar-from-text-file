export function throttlePromise(func, limit) {
	let timeoutId = null;
	let lastArgs = null;
	let lastResolve = null;
	let lastReject = null;

	const throttled = (...args) => {
		if (timeoutId === null) {
			return executeFunction(args);
		}

		return new Promise((resolve, reject) => {
			lastArgs = args;
			lastResolve = resolve;
			lastReject = reject;
		});
	};

	const executeFunction = async (args) => {
		try {
			const result = await func(...args);

			timeoutId = setTimeout(() => {
				timeoutId = null;
				if (lastArgs) {
					const args = lastArgs;
					const resolve = lastResolve;
					const reject = lastReject;

					lastArgs = null;
					lastResolve = null;
					lastReject = null;

					executeFunction(args).then(resolve).catch(reject);
				}
			}, limit);

			return result;
		} catch (error) {
			timeoutId = null;
			throw error;
		}
	};

	throttled.cancel = () => {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
		if (lastReject) {
			lastReject(new Error("Throttled function cancelled"));
			lastArgs = null;
			lastResolve = null;
			lastReject = null;
		}
	};

	throttled.flush = async () => {
		if (lastArgs) {
			const args = lastArgs;
			lastArgs = null;
			return func(...args);
		}
		return undefined;
	};

	return throttled;
}
