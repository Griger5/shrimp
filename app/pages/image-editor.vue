<script setup lang="ts">
import { ref } from "vue";
import { useWebGPU } from "../composables/use-webgpu";

import invertShader from "../../src/shaders/invert-colors.wgsl?raw";

const canvas = ref<HTMLCanvasElement | null>(null);
const imageBitmap = ref<ImageBitmap | null>(null);

let width: number;
let height: number;

let device: GPUDevice;
let queue: GPUQueue;
let encoder: GPUCommandEncoder;
let pass: GPUComputePassEncoder;

let inputTexture: GPUTexture;
let outputTexture: GPUTexture;

onMounted(async () => {
	const gpu = useWebGPU();
	if (!gpu) {
		alert("WebGPU not available");
		return;
	}

	device = gpu.device;
	queue = gpu.queue;
	encoder = gpu.encoder;
	pass = gpu.pass;
});

const onNewImage = async (e: Event) => {
	const file = (e.target as HTMLInputElement).files?.[0];
	if (!file) return;

	imageBitmap.value = await createImageBitmap(file);

	const ctx = canvas.value!.getContext("2d")!;
	canvas.value!.width = imageBitmap.value.width;
	canvas.value!.height = imageBitmap.value.height;
	ctx.drawImage(imageBitmap.value, 0, 0);

	const img = imageBitmap.value!;
	width = img.width;
	height = img.height;

	inputTexture = device.createTexture({
		size: [imageBitmap.value.width, imageBitmap.value.height],
		format: "rgba8unorm",
		usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING,
	});

	queue.copyExternalImageToTexture(
		{ source: img },
		{ texture: inputTexture },
		[width, height],
	);

	outputTexture = device.createTexture({
		size: [width, height],
		format: "rgba8unorm",
		usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING,
	});
};

const applyShader = async (shaderCode: string) => {
	const shaderModule = device.createShaderModule({ code: shaderCode });
	const pipeline = device.createComputePipeline({
		layout: "auto",
		compute: { module: shaderModule, entryPoint: "main" },
	});

	const bindGroup = device.createBindGroup({
		layout: pipeline.getBindGroupLayout(0),
		entries: [
			{ binding: 0, resource: inputTexture.createView() },
			{ binding: 1, resource: outputTexture.createView() },
		],
	});

	pass.setPipeline(pipeline);
	pass.setBindGroup(0, bindGroup);
	pass.dispatchWorkgroups(Math.ceil(width / 16), Math.ceil(height / 16));
	pass.end();

	const bytesPerPixel = 4;
	const unalignedBytesPerRow = width * bytesPerPixel;
	const bytesPerRow = Math.ceil(unalignedBytesPerRow / 256) * 256;

	const readBuffer = device.createBuffer({
		size: bytesPerRow * height,
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
	});

	encoder.copyTextureToBuffer(
		{ texture: outputTexture },
		{
			buffer: readBuffer,
			bytesPerRow,
		},
		[width, height],
	);

	queue.submit([encoder.finish()]);

	await readBuffer.mapAsync(GPUMapMode.READ);
	const mapped = new Uint8Array(readBuffer.getMappedRange());

	const pixels = new Uint8ClampedArray(width * height * 4);

	for (let y = 0; y < height; y++) {
		const srcOffset = y * bytesPerRow;
		const dstOffset = y * width * 4;

		pixels.set(
			mapped.subarray(
				srcOffset,
				srcOffset + width * 4,
			),
			dstOffset,
		);
	}

	const imgData = new ImageData(pixels, width, height);
	canvas.value!.getContext("2d")!.putImageData(imgData, 0, 0);

	readBuffer.unmap();
};

const invertImage = async () => {
	applyShader(invertShader);
};
</script>

<template>
	<div class="container">
		<h1>Image Editor</h1>

		<div class="container">
			<input
				type="file"
				accept="image/*"
				@change="onNewImage"
			>

			<button
				:disabled="!imageBitmap"
				@click="invertImage"
			>
				Invert Colors
			</button>

			<canvas ref="canvas" />
		</div>
	</div>
</template>
