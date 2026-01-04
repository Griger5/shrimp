export const useWebGPU = () => {
	const nuxtApp = useNuxtApp();
	const webgpu = nuxtApp.$webgpu;

	if (!webgpu) {
		return null;
	}

	return webgpu as {
		adapter: GPUAdapter;
		device: GPUDevice;
		queue: GPUQueue;
		format: GPUTextureFormat;
	};
};
