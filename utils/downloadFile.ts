/**
 * Cross-browser file download utility.
 *
 * PROBLEM: Chrome processes blob URL downloads through an asynchronous
 * download manager. If the blob URL is revoked (or even garbage-collected)
 * before Chrome's download manager resolves it, Chrome silently falls back
 * to using the blob URL's UUID as the filename instead of the `download`
 * attribute value. Edge, Firefox, and Safari do not exhibit this behavior.
 *
 * SOLUTION: Convert the blob to a Data URL (base64-encoded inline content).
 * Data URLs embed the file content directly in the href — there is no
 * external URL that can be revoked or lost. Chrome reads the `download`
 * attribute correctly when the href is a Data URL.
 *
 * TRADEOFF: Data URLs are ~33% larger than binary blobs due to base64
 * encoding. For typical export files (< 5 MB), this overhead is negligible.
 * For very large files (> 10 MB), the blob URL approach with an extended
 * timeout is used as a fallback.
 */

const DATA_URL_SIZE_LIMIT = 10 * 1024 * 1024; // 10 MB

export function downloadBlob(blob: Blob, filename: string): void {
  if (blob.size <= DATA_URL_SIZE_LIMIT) {
    // Primary approach: Data URL (reliable across all browsers including Chrome)
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const anchor = document.createElement('a');
      anchor.style.display = 'none';
      anchor.href = dataUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      // Cleanup after a short delay (the download is fully inline,
      // so this is just DOM cleanup — no URL to revoke)
      setTimeout(() => {
        document.body.removeChild(anchor);
      }, 100);
    };
    reader.readAsDataURL(blob);
  } else {
    // Fallback for very large files: use blob URL with extended timeout
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.style.display = 'none';
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    // Extended timeout to give Chrome's download manager ample time
    setTimeout(() => {
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    }, 30000); // 30 seconds for large files
  }
}

export function downloadCSV(csvContent: string, filename: string): void {
  // Prepend UTF-8 BOM so Excel correctly reads unicode characters
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  downloadBlob(blob, filename);
}

export function downloadXLSX(workbookOutput: ArrayBuffer, filename: string): void {
  const blob = new Blob([workbookOutput], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, filename);
}
