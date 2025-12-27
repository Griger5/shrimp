export const useWebGPU = () => {
	const nuxtApp = useNuxtApp();
	const webgpu = nuxtApp.$webgpu;

	if (!webgpu) {
		throw new Error("WebGPU plugin not available");
	}

	return webgpu as {
		adapter: GPUAdapter;
		device: GPUDevice;
		queue: GPUQueue;
		format: GPUTextureFormat;
	};
};
