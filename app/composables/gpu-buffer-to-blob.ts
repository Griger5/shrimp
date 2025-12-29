export async function GPUBufferToBlob(buffer: GPUBuffer, width: number, height: number) {
	const bytesPerPixel = 4;
	const unpaddedBytesPerRow = width * bytesPerPixel;
	const paddedBytesPerRow = Math.ceil(unpaddedBytesPerRow / 256) * 256;

	const mapped = buffer.getMappedRange();
	const data = new Uint8ClampedArray(mapped);

	const pixels = new Uint8ClampedArray(width * height * 4);
	for (let y = 0; y < height; y++) {
		const srcOffset = y * paddedBytesPerRow;
		const dstOffset = y * unpaddedBytesPerRow;
		pixels.set(
			data.subarray(srcOffset, srcOffset + unpaddedBytesPerRow),
			dstOffset,
		);
	}

	buffer.unmap();

	const canvas = new OffscreenCanvas(width, height);
	canvas.width = width;
	canvas.height = height;

	const ctx = canvas.getContext("2d")!;
	const imageData = new ImageData(pixels, width, height);
	ctx.putImageData(imageData, 0, 0);

	return canvas.convertToBlob();
}