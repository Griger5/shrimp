export default defineNuxtPlugin(async (nuxtApp) => {
	if (!navigator.gpu) {
		console.warn("WebGPU not supported");
		return {
			provide: {
				webgpu: null,
			},
		};
	}

	const adapter = await navigator.gpu.requestAdapter();
	if (!adapter) {
		console.warn("No GPU adapter found");
		return {
			provide: {
				webgpu: null,
			},
		};
	}

	const device = await adapter.requestDevice();
	const queue = device.queue;
	const format = navigator.gpu.getPreferredCanvasFormat();

	return {
		provide: {
			webgpu: {
				adapter,
				device,
				queue,
				format,
			},
		},
	};
});
