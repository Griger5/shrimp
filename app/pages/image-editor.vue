<script setup lang="ts">
import { ref } from "vue";
import { useWebGPU } from "../composables/use-webgpu";

const canvas = ref<HTMLCanvasElement | null>(null);
const imageBitmap = ref<ImageBitmap | null>(null);

const onFileChange = async (e: Event) => {
	const file = (e.target as HTMLInputElement).files?.[0];
	if (!file) return;

	const img = await createImageBitmap(file);
	imageBitmap.value = img;

	const ctx = canvas.value!.getContext("2d")!;
	canvas.value!.width = img.width;
	canvas.value!.height = img.height;
	ctx.drawImage(img, 0, 0);
};

const invertImage = async () => {
	const { device, queue } = useWebGPU();

	const img = imageBitmap.value!;
	const width = img.width;
	const height = img.height;

	const inputTexture = device.createTexture({
		size: [width, height],
		format: "rgba8unorm",
		usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING,
	});

	queue.copyExternalImageToTexture(
		{ source: img },
		{ texture: inputTexture },
		[width, height],
	);

	const outputTexture = device.createTexture({
		size: [width, height],
		format: "rgba8unorm",
		usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING,
	});

	const shaderCode = `
		@group(0) @binding(0)
		var inputTex: texture_2d<f32>;
		@group(0) @binding(1)
		var outputTex: texture_storage_2d<rgba8unorm, write>;

		@compute @workgroup_size(16,16)
		fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
		let dims = textureDimensions(inputTex);
		if (gid.x >= dims.x || gid.y >= dims.y) { return; }

		let pixel = textureLoad(inputTex, vec2<i32>(i32(gid.x), i32(gid.y)), 0);
		let inverted = vec4<f32>(1.0 - pixel.rgb, pixel.a);
		textureStore(outputTex, vec2<i32>(i32(gid.x), i32(gid.y)), inverted);
		}
	`;

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

	const encoder = device.createCommandEncoder();
	const pass = encoder.beginComputePass();
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
</script>

<template>
	<div class="container">
		<h1>Image Editor</h1>

		<div class="container">
			<input
				type="file"
				accept="image/*"
				@change="onFileChange"
			>

			<button :disabled="!imageBitmap" @click="invertImage">
				Invert Colors
			</button>

			<canvas ref="canvas" />
		</div>
	</div>
</template>