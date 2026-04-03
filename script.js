(async () => {
    let trustedURL;
    if (window.trustedTypes && trustedTypes.createPolicy) {
        const policy = trustedTypes.createPolicy('myPolicy', { createScriptURL: (input) => input });
        trustedURL = policy.createScriptURL('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    } else {
        trustedURL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    }
    const loadScript = (src) =>
        new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.onload = resolve;
            s.onerror = reject;
            s.src = src;
            document.body.appendChild(s);
        });
    await loadScript(trustedURL);
    const { jsPDF } = window.jspdf;
    const imgs = Array.from(document.getElementsByTagName("img"))
        .filter(img => /^blob:/.test(img.src));
    if (!imgs.length) return;

    const getPageConfig = (w, h) => ({
        orientation: w >= h ? "landscape" : "portrait",
        format: [w, h],
    });

    let pdf;

    for (const img of imgs) {
        if (!img.complete || img.naturalWidth === 0) {
            await new Promise((r) => img.addEventListener("load", r, { once: true }));
        }

        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const imgData = canvas.toDataURL("image/jpeg", 0.92);

        if (!pdf) {
            pdf = new jsPDF({
                ...getPageConfig(w, h),
                unit: "pt",
                compress: true,
            });
        } else {
            pdf.addPage([w, h], w >= h ? "landscape" : "portrait");
        }
        pdf.addImage(imgData, "JPEG", 0, 0, w, h);
    }

    pdf.save("download.pdf");
})();
