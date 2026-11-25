import axios from "axios";
import * as rax from "retry-axios";

function axiosWithRetry({ config = undefined, retryConfig = undefined } = {}) {
	const raxConfig = {
		retry: 5,
		backoffType: "exponential",
		jitter: "equal",
		retryDelay: 1000,
		httpMethodsToRetry: ["GET", "HEAD", "OPTIONS", "DELETE", "PUT"],
		statusCodesToRetry: [
			[100, 199],
			[409, 409],
			[429, 429],
			[500, 599],
		],
		onRetryAttempt: (err) => {
			const cfg = rax.getConfig(err);
			console.log(`retry attempt #${cfg.currentRetryAttempt}`);
			console.log(`retries remaining: ${cfg.retriesRemaining}`);
		},
		...retryConfig,
	};
	const instance = axios.create({
		...config,
		...{ defaults: { ...config?.defaults, raxConfig: raxConfig } },
	});
	rax.attach(instance);
	return instance;
}

export default axiosWithRetry;
