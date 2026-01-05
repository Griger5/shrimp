<script setup lang="ts">
import { ref } from "vue";
import { useWebGPU } from "../composables/use-webgpu";

import invertShader from "../../src/shaders/invert-colors.wgsl?raw";
import renderVertex from "../../src/shaders/render-vertex.wgsl?raw";
import renderFragment from "../../src/shaders/render-fragment.wgsl?raw";
import { downloadBlob } from "~/composables/download-blob";

const { t } = useI18n();

const enum ComputeBackend {
	WEBGPU,
	WASM,
}

const canvas = ref<HTMLCanvasElement | null>(null);
const imageBitmap = ref<ImageBitmap | null>(null);

const computeBackend = ref<ComputeBackend | null>(null);

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

let wasmModule: any = null;
let wasmInvertImage: any = null;
let imageData: ImageData | null = null;

onMounted(async () => {
	const gpu = useWebGPU();

	if (gpu) {
		computeBackend.value = ComputeBackend.WEBGPU;

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
	}
	else {
		computeBackend.value = ComputeBackend.WASM;
		wasmModule = await import("../../public/wasm/image-manipulation.js").then(m => m.default());
		wasmInvertImage = wasmModule.cwrap("invert_image", null, ["number", "number", "number"]);
	}
});

const render = () => {
	if (computeBackend.value !== ComputeBackend.WEBGPU) return;

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

	if (computeBackend.value === ComputeBackend.WEBGPU) {
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
	}
	else if (computeBackend.value === ComputeBackend.WASM) {
		const ctx = canvas.value!.getContext("2d")!;
		ctx.drawImage(img, 0, 0);
		imageData = ctx.getImageData(0, 0, width, height);
	}
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

const runFunctionWASM = async (wasmFunc: any) => {
	if (!imageData || !wasmFunc || !wasmModule) return;

	const { data, width, height } = imageData;
	const size = data.length;

	const ptr = wasmModule._malloc(size);
	wasmModule.HEAPU8.set(data, ptr);

	wasmFunc(ptr, width, height);

	data.set(wasmModule.HEAPU8.subarray(ptr, ptr + size));
	wasmModule._free(ptr);

	canvas.value!.getContext("2d")!.putImageData(imageData, 0, 0);
};

const invertImage = async () => {
	if (computeBackend.value === ComputeBackend.WEBGPU) {
		applyShader(invertShader);
	}
	else if (computeBackend.value === ComputeBackend.WASM) {
		runFunctionWASM(wasmInvertImage);
	}
};

const volume = ref(50);
const count = ref(0);
const enabled = ref(false);

const downloadImage = async () => {
	let blob: Blob;

	if (computeBackend.value === ComputeBackend.WEBGPU) {
		const buffer = await GPUTextureToBuffer(device, inputTexture, width, height);
		blob = await GPUBufferToBlob(buffer, width, height);
	}
	else if (computeBackend.value === ComputeBackend.WASM) {
		blob = await new Promise<Blob>((resolve, reject) =>
			canvas.value!.toBlob(b => b ? resolve(b) : reject(new Error("Failed to convert canvas to blob")), "image/png"),
		);
	}

	await downloadBlob(blob);
};
</script>

<template>
	<div class="container">
		<div class="container">
			<h1>{{ t("editor.title") }}</h1>

			<input
				type="file"
				accept="image/*"
				@change="onNewImage"
			>
		</div>
		<div class="page-container">
			<div class="canvas-wrapper">
				<canvas ref="canvas" />
				<button @click="downloadImage">
					{{ t("editor.download") }}
				</button>
			</div>
			<div>
				<aside class="sidebar-panel">
					<h3>{{ t("editor.controls") }}</h3>

					<button
						class="secondary"
						@click="invertImage"
					>
						{{ t("editor.functions.invert") }}
					</button>

					<label for="volume">Volume: {{ volume }}</label>
					<input
						id="volume"
						v-model="volume"
						type="range"
						min="0"
						max="100"
					>

					<label for="count">Count:</label>
					<input
						id="count"
						v-model="count"
						type="number"
						min="0"
						max="100"
					>

					<label>
						<input
							v-model="enabled"
							type="checkbox"
						> Enable Feature
					</label>
				</aside>
			</div>
		</div>
	</div>
</template>

<style scoped>
canvas {
	width: 800px;
	height: 800px;
	object-fit: contain;
	border: 3px solid #ccc;
	background-color: #000000;
	display: block;
}

.canvas-wrapper {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 1rem;
	align-items: flex-start;
}

.page-container {
	display: flex;
	gap: 1rem;
	padding: 1rem;
	min-height: 100vh;
}

.sidebar-panel {
	width: 250px;
	padding: 1rem;
	border: 3px solid #000000;
	background: #1c2538;
	display: flex;
	flex-direction: column;
	gap: 1rem;
	box-sizing: border-box;
}
</style>
