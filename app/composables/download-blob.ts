export async function downloadBlob(blob: Blob, suggestedName = "image.png") {
	const saved = await downloadWithFileDialog(blob, suggestedName);

	if (!saved) {
		downloadFallback(blob, suggestedName);
	}
}

async function downloadWithFileDialog(blob: Blob, suggestedName: string) {
	if (!("showSaveFilePicker" in window)) {
		return false;
	}

	const handle = await (window as any).showSaveFilePicker({
		suggestedName: suggestedName,
		startIn: "downloads",
		types: [
			{
				description: "Image formats",
				accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"], "image/webp": [".webp"] },
			},
		],
	});

	const writable = await handle.createWritable();
	await writable.write(blob);
	await writable.close();

	return true;
}

function downloadFallback(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);

	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();

	URL.revokeObjectURL(url);
}
