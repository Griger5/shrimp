<script setup lang="ts">
import { ref } from "vue";
import { useWebGPU } from "../composables/use-webgpu";

import invertShader from "../../src/shaders/invert-colors.wgsl?raw";
import renderVertex from "../../src/shaders/render-vertex.wgsl?raw";
import renderFragment from "../../src/shaders/render-fragment.wgsl?raw";

const canvas = ref<HTMLCanvasElement | null>(null);
const imageBitmap = ref<ImageBitmap | null>(null);

let width: number;
let height: number;

let device: GPUDevice;
let queue: GPUQueue;
let format: GPUTextureFormat;

let inputTexture: GPUTexture;
let outputTexture: GPUTexture;

let sampler: GPUSampler;
let renderPipeline: GPURenderPipeline;

let context: GPUCanvasContext;

onMounted(async () => {
	const gpu = useWebGPU();
	if (!gpu) {
		alert("WebGPU not available");
		return;
	}

	device = gpu.device;
	queue = gpu.queue;
	format = gpu.format;

	context = canvas.value!.getContext("webgpu") as GPUCanvasContext;
	context.configure({
		device,
		format,
		alphaMode: "premultiplied",
	});

	sampler = device.createSampler({ magFilter: "nearest", minFilter: "nearest" });

	renderPipeline = device.createRenderPipeline({
		layout: "auto",
		vertex: { module: device.createShaderModule({ code: renderVertex }), entryPoint: "main" },
		fragment: {
			module: device.createShaderModule({ code: renderFragment }),
			entryPoint: "main",
			targets: [{ format }],
		},
		primitive: { topology: "triangle-list" },
	});
});

const render = () => {
	const encoder = device.createCommandEncoder();
	const view = context.getCurrentTexture().createView();

	const renderBindGroup = device.createBindGroup({
		layout: renderPipeline.getBindGroupLayout(0),
		entries: [
			{ binding: 0, resource: inputTexture.createView() },
			{ binding: 1, resource: sampler },
		],
	});

	const pass = encoder.beginRenderPass({
		colorAttachments: [
			{
				view,
				loadOp: "clear",
				storeOp: "store",
				clearValue: { r: 0, g: 0, b: 0, a: 1 },
			},
		],
	});

	pass.setPipeline(renderPipeline);
	pass.setBindGroup(0, renderBindGroup);
	pass.draw(6);
	pass.end();

	queue.submit([encoder.finish()]);
};

const onNewImage = async (e: Event) => {
	const file = (e.target as HTMLInputElement).files?.[0];
	if (!file) return;

	imageBitmap.value = await createImageBitmap(file);

	const img = imageBitmap.value!;
	width = img.width;
	height = img.height;

	canvas.value!.width = width;
	canvas.value!.height = height;

	canvas.value!.style.width = "800px";
	canvas.value!.style.height = "800px";

	inputTexture = device.createTexture({
		size: [width, height],
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

	render(); 
};

const applyShader = async (shaderCode: string) => {
	const encoder = device.createCommandEncoder();
	const pass = encoder.beginComputePass();

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

	queue.submit([encoder.finish()]);

	[inputTexture, outputTexture] = [outputTexture, inputTexture];

	render();
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

<style scoped>
canvas {
  	width: 800px;
  	height: 800px;
  	object-fit: contain;
}
</style>