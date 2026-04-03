# Google Drive View-Only PDF Downloader

Gist origin:
https://gist.github.com/dpaluy/74258794f7930401cc27262e0ea794dd

This repo contains a browser-console script that rebuilds a downloadable PDF from the page images rendered by the Google Drive PDF viewer.

It is useful when a PDF is visible in the browser but the normal download option is unavailable, limited, or inconvenient, and the viewer has already rendered each page as an image.

## Quick Use

1. Open the PDF in the Google Drive viewer.
2. Scroll through the document until all pages you want have been rendered.
3. Open Developer Tools and switch to the Console tab.
4. Paste the contents of [`script.js`](./script.js) into the console and run it.
5. Wait for the script to finish. Your browser will download `download.pdf`.

That is the full workflow. The important part is step 2: the script can only capture pages that already exist in the DOM as rendered `blob:` images.

## What the Script Does

The script:

1. Loads `jsPDF` from a CDN at runtime.
2. Finds `img` elements whose `src` starts with `blob:`.
3. Waits for each image to finish loading if needed.
4. Draws each image onto a temporary canvas.
5. Converts the canvas into a JPEG data URL.
6. Creates a PDF page sized to that image.
7. Inserts the image edge-to-edge on the PDF page.
8. Downloads the finished file as `download.pdf`.

## How It Works

The current version is intentionally simple:

- It does not read the original PDF file directly.
- It does not parse PDF structure or metadata.
- It uses whatever the viewer has already rendered into the page.

In practice, that means the output PDF is a PDF made from page images, not a byte-for-byte copy of the original source PDF.

## Orientation and Page Size

The current script does not force A4 or any other fixed paper size.

For each page, it uses the rendered image dimensions as the PDF page format and chooses orientation from the image aspect ratio:

- landscape when `width >= height`
- portrait when `height > width`

Because of that, it works with:

- all-landscape PDFs
- all-portrait PDFs
- mixed-orientation PDFs
- non-A4 aspect ratios
- mixed page sizes

This avoids the old behavior where portrait pages could be dropped into a landscape page with large side margins.

## Requirements

The script depends on the viewer behaving in a specific way:

- The PDF viewer must render pages as `img` elements.
- Those images must use `blob:` URLs.
- The pages you want must already be loaded in the DOM.
- The page must allow loading `jsPDF` from the CDN used in the script.

If any of those assumptions fail, the script may do nothing or produce an incomplete PDF.

## Limitations

Before using or modifying the script, keep these limits in mind:

- Only rendered pages are captured. If you do not scroll far enough, missing pages will not appear in the output.
- Output quality is limited by the viewer's rendered image resolution.
- The output PDF is image-based, so searchable text, links, selectable text, and original PDF structure are not preserved.
- If the viewer displays a rotated page incorrectly, the output will preserve that rendered result.
- If the site changes its DOM structure and no longer uses `blob:` images, the script will stop working until updated.
- Some sites may block the external `jsPDF` CDN or use security policies that prevent this script from running.

## Files in This Repo

- [`script.js`](./script.js): current script
- [`improvement_1/`](./improvement_1): earlier improved variant and notes
- [`original_bad/`](./original_bad): original version and minimal instructions from the gist workflow

## Script Walkthrough

The core flow in [`script.js`](./script.js) is:

- load `jsPDF`
- collect matching images from the page
- create a per-page PDF configuration from image width and height
- convert each image to JPEG through a canvas
- add each image as a full-page PDF page
- save the final PDF

Important implementation details:

- `trustedTypes.createPolicy(...)` is used when available so the CDN script can still be loaded in environments that enforce Trusted Types.
- `img.complete` and `img.naturalWidth` are checked before processing to reduce blank-page issues.
- `unit: "pt"` is passed to `jsPDF`, but the page dimensions come directly from the rendered image size values.
- `compress: true` is enabled on the generated PDF.
- `canvas.toDataURL("image/jpeg", 0.92)` is used to balance file size and image quality.

## How to Modify It

The script is short, so the easiest way to customize behavior is to edit a few lines in [`script.js`](./script.js).

### Change the output filename

Edit:

```js
pdf.save("download.pdf");
```

Example:

```js
pdf.save("my-file.pdf");
```

### Change image quality or format

Edit:

```js
const imgData = canvas.toDataURL("image/jpeg", 0.92);
```

Options:

- use a higher JPEG quality like `0.98` for larger files and slightly better image quality
- use a lower JPEG quality like `0.8` for smaller files
- switch to `"image/png"` for lossless output, usually with much larger file size

If you switch to PNG, also update the `addImage` format string:

```js
pdf.addImage(imgData, "PNG", 0, 0, w, h);
```

### Force a fixed page size such as A4

Right now the script uses the image size directly:

```js
format: [w, h]
```

If you want every page to use a fixed format, you would need to:

1. replace the dynamic `format` with a fixed page size
2. calculate scaling so the image fits within that page
3. optionally add margins and center the image

That would trade exact viewer-size matching for standard paper output.

### Add margins instead of edge-to-edge pages

Right now the image fills the entire page:

```js
pdf.addImage(imgData, "JPEG", 0, 0, w, h);
```

To add margins, you would:

1. create a larger fixed page
2. scale the image down
3. offset `x` and `y` from `0, 0`

### Capture a different set of images

The current filter is:

```js
const imgs = Array.from(document.getElementsByTagName("img"))
    .filter(img => /^blob:/.test(img.src));
```

If the viewer changes, this is the first place to update. For example, you might need:

- a more specific selector
- a different URL pattern
- an ordering step if images are discovered out of page order

### Use a different `jsPDF` version or local source

The script loads:

```js
https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
```

You can replace that with:

- another CDN version
- a self-hosted copy
- a locally injected script if you are adapting this into an extension or userscript

## Troubleshooting

### Nothing downloads

Possible causes:

- the page did not contain any matching `blob:` images
- the pages were not fully rendered yet
- the CDN script failed to load
- the site blocked script injection or external scripts

### Some pages are missing

You almost certainly did not scroll far enough before running the script, or the viewer unloaded earlier pages while you were navigating.

### The PDF downloads but quality is poor

That usually means the viewer only rendered low-resolution page images. The script can only capture the resolution it is given.

### The output has no searchable text

Expected. This script creates a PDF from images, not from the original PDF text layer.

## Disclaimer

This script is provided for educational and archival use on content you are authorized to access and copy. Review the rules and obligations that apply to the documents and services you use.
