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
		throw new Error("No GPU adapter found");
	}

	const device = await adapter.requestDevice();
	const queue = device.queue;

	const canvasFormat = navigator.gpu.getPreferredCanvasFormat();

	return {
		provide: {
			webgpu: {
				adapter,
				device,
				queue,
				canvasFormat,
			},
		},
	};
});
