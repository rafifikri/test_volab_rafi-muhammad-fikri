import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CapturePage = () => {
  const navigate = useNavigate();

  // ===== State utama =====
  const [photoConfig, setPhotoConfig] = useState({
    pairing: false, // true = landscape (harus berpasangan)
    photosPerPair: 1, // default 1 (portrait)
  });
  const [numPhotos, setNumPhotos] = useState(2);
  const [status, setStatus] = useState("Not started");
  const [savedPhotos, setSavedPhotos] = useState([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(null);

  // ===== Ref untuk kamera =====
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // ===== Ambil konfigurasi dari localStorage saat awal =====
  useEffect(() => {
    const config = JSON.parse(
      localStorage.getItem("photoConfig") ||
        '{"pairing":false,"photosPerPair":1}'
    );
    setPhotoConfig(config);

    // Set jumlah foto default berdasar config
    if (config.pairing) {
      setNumPhotos(2); // landscape minimal 2
    } else {
      setNumPhotos(1); // portrait minimal 1
    }
  }, []);

  // ===== Nyalakan kamera =====
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error("Error akses kamera:", err);
      setStatus("Error saat mengakses kamera");
    }
  };

  // ===== Matikan kamera =====
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch {}
    }
  };

  // ===== Mulai sesi pemotretan =====
  const startSession = () => {
    if (savedPhotos.length >= numPhotos) {
      setStatus(
        "Jumlah foto sudah terpenuhi. Hapus beberapa foto jika ingin tambah."
      );
      return;
    }
    setIsSessionActive(true);
    setStatus(`Mengambil foto ${savedPhotos.length + 1} dari ${numPhotos}`);
    startCamera();
  };

  // ===== Akhiri sesi =====
  const endSession = () => {
    setIsSessionActive(false);
    stopCamera();
    setCurrentPhoto(null);
    setStatus("Session ended");
  };

  // ===== Ambil foto (preview) =====
  const takePhoto = () => {
    if (!videoRef.current) return;

    const vw = videoRef.current.videoWidth || 640;
    const vh = videoRef.current.videoHeight || 480;
    canvasRef.current.width = vw;
    canvasRef.current.height = vh;

    const ctx = canvasRef.current.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, vw, vh);

    const dataUrl = canvasRef.current.toDataURL("image/png");
    setCurrentPhoto(dataUrl);
  };

  // ===== Simpan foto ke galeri =====
  const savePhoto = () => {
    if (!currentPhoto) return;

    setSavedPhotos((prev) => {
      const next = [...prev, currentPhoto];

      // Jika sudah mencapai target foto, otomatis stop
      if (next.length >= numPhotos) {
        setIsSessionActive(false);
        stopCamera();
        setStatus("All photos taken");
      } else {
        setStatus(`Mengambil foto ${next.length + 1} dari ${numPhotos}`);
      }
      return next;
    });

    setCurrentPhoto(null);
  };

  // ===== Ambil ulang (hapus preview) =====
  const retakePhoto = () => {
    setCurrentPhoto(null);
    setStatus(`Mengambil foto ${savedPhotos.length + 1} dari ${numPhotos}`);
  };

  // ===== Hapus foto tertentu =====
  const deletePhoto = (idx) => {
    setSavedPhotos((prev) => {
      const next = prev.filter((_, i) => i !== idx);

      // Jika setelah hapus jadi kurang dari target → boleh start session lagi
      if (next.length < numPhotos && !isSessionActive) {
        setStatus("Kamu bisa mulai sesi baru untuk ambil foto yang kurang");
      }
      return next;
    });
  };

  // ===== Lanjut ke halaman review =====
  const continueToReview = () => {
    if (savedPhotos.length === 0) {
      alert("Belum ada foto untuk direview.");
      return;
    }

    // Validasi jumlah foto untuk landscape
    if (photoConfig.pairing && savedPhotos.length % 2 !== 0) {
      alert("Untuk frame landscape, jumlah foto harus genap (kelipatan 2).");
      return;
    }

    localStorage.setItem("capturedPhotos", JSON.stringify(savedPhotos));
    localStorage.setItem("photoConfig", JSON.stringify(photoConfig));
    navigate("/review");
  };

  // ===== Handle perubahan jumlah foto =====
  const handleNumPhotosChange = (value) => {
    const num = Math.max(1, value);

    if (photoConfig.pairing) {
      // Landscape harus genap
      setNumPhotos(num % 2 === 0 ? num : num + 1);
    } else {
      // Portrait bebas
      setNumPhotos(num);
    }
  };

  // ===== Variabel bantu UI =====
  const canStart = !isSessionActive && savedPhotos.length < numPhotos;
  const remaining = Math.max(0, numPhotos - savedPhotos.length);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        {photoConfig.pairing
          ? "Landscape Photo Capture"
          : "Portrait Photo Capture"}
      </h1>

      {/* Bagian Header & Pengaturan */}
      <div className="bg-white border rounded p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <button
              onClick={() => navigate(`/choose`)}
              className="bg-blue-600 hover:bg-blue-700 rounded-md text-white mb-4 p-2"
            >
              Kembali
            </button>
            <label className="block text-sm font-medium">
              Number of Photos:
            </label>
            <input
              type="number"
              min={photoConfig.pairing ? 2 : 1}
              step={photoConfig.pairing ? 2 : 1}
              value={numPhotos}
              onChange={(e) => {
                const v = parseInt(e.target.value || "1", 10);
                handleNumPhotosChange(v);
              }}
              disabled={isSessionActive}
              className={`border rounded px-2 py-1 w-20 ${
                isSessionActive ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
            />
            <p className="text-xs text-gray-500">Remaining: {remaining}</p>
          </div>

          {/* Tombol Start/End Session */}
          <div className="flex items-center gap-2 ml-2">
            {canStart && (
              <button
                onClick={startSession}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Start Session
              </button>
            )}
            {isSessionActive && (
              <button
                onClick={endSession}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                End Session
              </button>
            )}
          </div>

          {/* Status */}
          <div className="ml-auto text-left">
            <p className="text-sm">
              Status: <span className="font-medium">{status}</span>
            </p>
            <p className="text-sm">
              Saved:{" "}
              <span className="font-medium">
                {savedPhotos.length} of {numPhotos}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Grid Camera & Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel Kamera */}
        <div className="border rounded p-4 bg-white shadow-sm">
          <h2 className="font-semibold mb-3">Camera</h2>
          <div className="mb-3">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-64 bg-black object-cover rounded border"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Tombol Ambil Foto */}
          <div className="space-y-2">
            {isSessionActive &&
              !currentPhoto &&
              savedPhotos.length < numPhotos && (
                <button
                  onClick={takePhoto}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Ambil Foto
                </button>
              )}

            {/* Tombol Save / Retake setelah foto diambil */}
            {currentPhoto && (
              <div className="flex gap-3">
                <button
                  onClick={savePhoto}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save Photo
                </button>
                <button
                  onClick={retakePhoto}
                  className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Retake
                </button>
              </div>
            )}

            {/* Preview sementara */}
            {currentPhoto && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Preview</p>
                <img
                  src={currentPhoto}
                  alt="Preview"
                  className="w-full rounded border"
                />
              </div>
            )}

            {/* Pesan panduan */}
            {!isSessionActive && savedPhotos.length < numPhotos && (
              <p className="text-sm text-gray-500">
                Tekan <b>Start Session</b> untuk menyalakan kamera.
              </p>
            )}
            {!isSessionActive && savedPhotos.length >= numPhotos && (
              <p className="text-sm text-green-600">
                Target foto terpenuhi. Kamu bisa lanjut ke Review atau hapus
                foto untuk mengambil ulang.
              </p>
            )}
          </div>
        </div>

        {/* Panel Galeri */}
        <div className="border rounded p-4 bg-white shadow-sm">
          <h2 className="font-semibold mb-3">Photo Gallery</h2>

          {savedPhotos.length === 0 ? (
            <div className="p-6 bg-gray-50 rounded text-center text-gray-500">
              No photos taken yet
            </div>
          ) : (
            <div className="space-y-3">
              {savedPhotos.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border rounded p-2"
                >
                  <img
                    src={p}
                    alt={`Photo ${i + 1}`}
                    className="w-24 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm">
                      Photo {i + 1} of {numPhotos}
                    </p>
                    <p className="text-xs text-gray-500">
                      Size: {Math.round((p.length * (3 / 4)) / 1024)} KB
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        if (confirm("Hapus foto ini?")) deletePhoto(i);
                      }}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tombol Lanjut & Reset */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={continueToReview}
              className={`flex-1 px-4 py-2 text-white rounded 
                ${
                  savedPhotos.length === 0
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              disabled={savedPhotos.length === 0}
            >
              Lanjutkan ke Review
            </button>

            <button
              onClick={() => {
                if (confirm("Ambil ulang semua foto?")) {
                  setSavedPhotos([]);
                  setCurrentPhoto(null);
                  setStatus("Not started");
                }
              }}
              className={`px-4 py-2 rounded 
                ${
                  savedPhotos.length === 0
                    ? "bg-gray-100 cursor-not-allowed text-gray-400"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              disabled={savedPhotos.length === 0}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapturePage;
