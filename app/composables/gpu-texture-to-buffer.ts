export async function GPUTextureToBuffer(device: GPUDevice, texture: GPUTexture, width: number, height: number) {
	const bytesPerPixel = 4;
	const unpaddedBytesPerRow = width * bytesPerPixel;
	const paddedBytesPerRow = Math.ceil(unpaddedBytesPerRow / 256) * 256;

	const bufferSize = paddedBytesPerRow * height;

	const readBuffer = device.createBuffer({
		size: bufferSize,
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
	});

	const encoder = device.createCommandEncoder();
	encoder.copyTextureToBuffer(
		{ texture },
		{
			buffer: readBuffer,
			bytesPerRow: paddedBytesPerRow,
			rowsPerImage: height,
		},
		{ width, height, depthOrArrayLayers: 1 },
	);

	device.queue.submit([encoder.finish()]);

	await readBuffer.mapAsync(GPUMapMode.READ);

	return readBuffer;
}
