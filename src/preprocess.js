// Utility to preprocess image for ONNX.js (resize, normalize, etc.)
export async function preprocessImage(imageSrc, inputShape = [1, 3, 224, 224]) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const [N, C, H, W] = inputShape;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, W, H);
      const imageData = ctx.getImageData(0, 0, W, H);
      const { data } = imageData;
      // Convert to float32, normalize to [0,1], then mean/std normalize if needed
      // Assume model expects NCHW, RGB, normalized to [0,1]
      const floatData = new Float32Array(C * H * W);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          for (let c = 0; c < C; c++) {
            // ONNX.js expects channel-first
            floatData[c * H * W + y * W + x] = data[(y * W + x) * 4 + c] / 255.0;
          }
        }
      }
      resolve(floatData);
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}
