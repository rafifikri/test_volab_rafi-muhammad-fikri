import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import landscapeFrame from "@/assets/Frame-Landscape.png";
import portraitFrame from "@/assets/Frame-Portrait.png";

const ReviewPage = () => {
  const navigate = useNavigate();

  // State utama
  const [photos, setPhotos] = useState([]);
  const [frameType, setFrameType] = useState("portrait");
  const [photoConfig, setPhotoConfig] = useState({
    pairing: false,
    photosPerPair: 1,
  });
  const [frameDimensions, setFrameDimensions] = useState({
    width: 1080,
    height: 1350, // Default: portrait
  });

  // Ambil data dari localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("capturedPhotos") || "[]");
    const ft = localStorage.getItem("frameType") || "portrait";
    const config = JSON.parse(
      localStorage.getItem("photoConfig") ||
        '{"pairing":false,"photosPerPair":1}'
    );

    setPhotos(stored);
    setFrameType(ft);
    setPhotoConfig(config);

    // Set ukuran frame sesuai orientasi
    if (ft === "landscape") {
      setFrameDimensions({ width: 1920, height: 1080 });
    } else {
      setFrameDimensions({ width: 1080, height: 1350 });
    }
  }, []);

  const frameAsset = frameType === "landscape" ? landscapeFrame : portraitFrame;

  // =====================
  // UTIL FUNCTIONS
  // =====================

  // Load image helper
  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  // Compose framed photo
  const composeFramedDataUrl = async (photoDataUrl) => {
    const photoImg = await loadImage(photoDataUrl);
    const frameImg = await loadImage(frameAsset);

    const canvas = document.createElement("canvas");
    canvas.width = frameDimensions.width;
    canvas.height = frameDimensions.height;
    const ctx = canvas.getContext("2d");

    // Helper crop function (cover style)
    const cropPhotoToFit = (img, targetWidth, targetHeight) => {
      const imgWidth = img.naturalWidth || img.width;
      const imgHeight = img.naturalHeight || img.height;

      const scaleX = targetWidth / imgWidth;
      const scaleY = targetHeight / imgHeight;
      const scale = Math.max(scaleX, scaleY);

      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;

      return {
        scale,
        cropX: (scaledWidth - targetWidth) / 2,
        cropY: (scaledHeight - targetHeight) / 2,
        scaledWidth,
        scaledHeight,
      };
    };

    const photoCrop = cropPhotoToFit(
      photoImg,
      frameDimensions.width,
      frameDimensions.height
    );

    ctx.drawImage(
      photoImg,
      -photoCrop.cropX,
      -photoCrop.cropY,
      photoCrop.scaledWidth,
      photoCrop.scaledHeight
    );

    // Frame selalu di atas
    ctx.drawImage(
      frameImg,
      0,
      0,
      frameDimensions.width,
      frameDimensions.height
    );

    return canvas.toDataURL("image/png", 0.95);
  };

  // Compose landscape pair
  const composeLandscapeLayout = async (leftPhoto, rightPhoto) => {
    const leftImg = await loadImage(leftPhoto);
    const rightImg = await loadImage(rightPhoto);
    const frameImg = await loadImage(frameAsset);

    const canvasWidth = frameDimensions.width;
    const canvasHeight = frameDimensions.height;
    const singlePhotoWidth = canvasWidth / 2;

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");

    // LEFT
    ctx.drawImage(leftImg, 0, 0, singlePhotoWidth, canvasHeight);

    // RIGHT
    ctx.drawImage(
      rightImg,
      singlePhotoWidth,
      0,
      singlePhotoWidth,
      canvasHeight
    );

    // FRAME di atas
    ctx.drawImage(frameImg, 0, 0, canvasWidth, canvasHeight);

    return canvas.toDataURL("image/png", 0.95);
  };

  // Download helpers
  const triggerDownload = (dataUrl, filename) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadFramed = async (dataUrl, idx) => {
    try {
      const framed = await composeFramedDataUrl(dataUrl);
      triggerDownload(framed, `photo-framed-${idx + 1}.png`);
    } catch (err) {
      console.error(err);
      alert("Gagal membuat/mendownload foto berbingkai.");
    }
  };

  const downloadLandscapePair = async (leftPhoto, rightPhoto, pairIndex) => {
    try {
      const composed = await composeLandscapeLayout(leftPhoto, rightPhoto);
      triggerDownload(composed, `photo-landscape-pair-${pairIndex + 1}.png`);
    } catch (err) {
      console.error("Error composing landscape pair:", err);
      alert("Gagal membuat/mendownload landscape pair.");
    }
  };

  const downloadAll = async () => {
    if (!photos || photos.length === 0) return;

    if (photoConfig.pairing) {
      // Landscape (berpasangan)
      for (let i = 0; i < photos.length; i += 2) {
        const left = photos[i];
        const right = photos[i + 1] ?? null;

        if (right) {
          await new Promise((r) => setTimeout(r, 100));
          await downloadLandscapePair(left, right, Math.floor(i / 2));
        } else {
          triggerDownload(left, `photo-original-${i + 1}.png`);
        }
      }
    } else {
      // Portrait (framed semua)
      for (let i = 0; i < photos.length; i++) {
        await new Promise((r) => setTimeout(r, 100));
        try {
          const framed = await composeFramedDataUrl(photos[i]);
          triggerDownload(framed, `photo-framed-${i + 1}.png`);
        } catch (err) {
          console.error("Error compose framed in downloadAll", err);
        }
      }
    }
  };

  // =====================
  // PREVIEW COMPONENTS
  // =====================

  const FramedPhotoPreview = ({ photo, photoNumber }) => {
    const [composedUrl, setComposedUrl] = useState(null);

    useEffect(() => {
      const composePreview = async () => {
        try {
          const url = await composeFramedDataUrl(photo);
          setComposedUrl(url);
        } catch (err) {
          console.error("Error composing preview:", err);
        }
      };
      composePreview();
    }, [photo]);

    if (!composedUrl) {
      return (
        <div className="flex items-center justify-center border rounded bg-gray-100 h-64">
          <p className="text-gray-400">Loading preview...</p>
        </div>
      );
    }

    return (
      <div
        className="relative border rounded overflow-hidden bg-black mx-auto"
        style={{
          maxWidth: frameType === "landscape" ? "500px" : "300px",
          aspectRatio: `${frameDimensions.width}/${frameDimensions.height}`,
        }}
      >
        <img
          src={composedUrl}
          alt={`framed-${photoNumber}`}
          className="w-full h-full object-contain"
        />
      </div>
    );
  };

  const LandscapePairPreview = ({ leftPhoto, rightPhoto, pairNumber }) => {
    const [composedUrl, setComposedUrl] = useState(null);

    useEffect(() => {
      const composePreview = async () => {
        try {
          const url = await composeLandscapeLayout(leftPhoto, rightPhoto);
          setComposedUrl(url);
        } catch (err) {
          console.error("Error composing landscape preview:", err);
        }
      };

      if (leftPhoto && rightPhoto) composePreview();
    }, [leftPhoto, rightPhoto]);

    if (!composedUrl) {
      return (
        <div className="flex items-center justify-center border rounded bg-gray-100 h-64">
          <p className="text-gray-400">Loading preview...</p>
        </div>
      );
    }

    return (
      <div
        className="relative border rounded overflow-hidden bg-black mx-auto"
        style={{
          maxWidth: "600px",
          aspectRatio: `${frameDimensions.width}/${frameDimensions.height}`,
        }}
      >
        <img
          src={composedUrl}
          alt={`landscape-pair-${pairNumber}`}
          className="w-full h-full object-contain"
        />
      </div>
    );
  };

  // =====================
  // RENDER PHOTOS
  // =====================

  const renderPhotos = () => {
    if (photoConfig.pairing) {
      // Landscape: berpasangan
      const pairs = [];
      for (let i = 0; i < photos.length; i += 2) {
        pairs.push([photos[i], photos[i + 1] ?? null]);
      }

      return pairs.map((pair, rowIdx) => {
        const [left, right] = pair;
        const leftNumber = rowIdx * 2 + 1;
        const rightNumber = rowIdx * 2 + 2;

        return (
          <div key={rowIdx} className="bg-white rounded shadow p-4">
            <div className="flex flex-col items-center">
              <p className="text-sm font-medium mb-4">
                Landscape Layout {rowIdx + 1}
              </p>

              {right && (
                <>
                  <LandscapePairPreview
                    leftPhoto={left}
                    rightPhoto={right}
                    pairNumber={rowIdx + 1}
                  />
                  <div className="mt-4 grid text-center items-center gap-4">
                    <span className="text-xs text-gray-500">
                      Photos {leftNumber} & {rightNumber}
                    </span>
                    <button
                      onClick={() => downloadLandscapePair(left, right, rowIdx)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      DOWNLOAD
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      });
    } else {
      // Portrait: single framed
      return photos.map((photo, idx) => (
        <div key={idx} className="bg-white rounded shadow p-4">
          <div className="flex flex-col items-center">
            <p className="text-sm font-medium mb-2">Potrait Layout {idx + 1}</p>
            <FramedPhotoPreview photo={photo} photoNumber={idx + 1} />
            <div className="mt-3 grid text-center items-center gap-3">
              <button
                onClick={() => downloadFramed(photo, idx)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                DOWNLOAD
              </button>
            </div>
          </div>
        </div>
      ));
    }
  };

  // =====================
  // MAIN RENDER
  // =====================

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Review Photos ({photoConfig.pairing ? "Landscape" : "Portrait"})
      </h1>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => navigate("/capture")}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          ULANGI
        </button>

        <button
          onClick={downloadAll}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          disabled={photos.length === 0}
        >
          DOWNLOAD ALL
        </button>
      </div>

      {photos.length === 0 ? (
        <div className="p-6 bg-gray-50 rounded text-center text-gray-500">
          Belum ada foto. Silakan ambil foto dulu.
        </div>
      ) : (
        <div className="space-y-6">{renderPhotos()}</div>
      )}
    </div>
  );
};

export default ReviewPage;
