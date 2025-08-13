declare module 'jsqr' {
  interface QRCodeLocation {
    topLeftCorner: { x: number; y: number };
    topRightCorner: { x: number; y: number };
    bottomLeftCorner: { x: number; y: number };
    bottomRightCorner: { x: number; y: number };
  }

  interface QRCode {
    data: string;
    location: QRCodeLocation;
    version: number;
  }

  interface JsqrOptions {
    inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth';
  }

  function jsQR(
    imageData: Uint8ClampedArray,
    width: number,
    height: number,
    options?: JsqrOptions
  ): QRCode | null;

  export = jsQR;
} 