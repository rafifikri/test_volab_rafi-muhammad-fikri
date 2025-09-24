import { useNavigate } from "react-router-dom";
import landscape from "@/assets/Frame-Landscape.png";
import portrait from "@/assets/Frame-Portrait.png";

const ChooseFrame = () => {
  const navigate = useNavigate();

  const selectFrame = (type) => {
    // Simpan pilihan frame ke localStorage
    localStorage.setItem("frameType", type);

    // Simpan konfigurasi tambahan sesuai jenis frame
    if (type === "landscape") {
      localStorage.setItem(
        "photoConfig",
        JSON.stringify({
          pairing: true, // Landscape butuh 2 foto berpasangan
          photosPerPair: 2,
        })
      );
    } else {
      localStorage.setItem(
        "photoConfig",
        JSON.stringify({
          pairing: false, // Portrait hanya perlu 1 foto
          photosPerPair: 1,
        })
      );
    }

    // Arahkan ke halaman capture setelah memilih frame
    navigate("/capture");
  };

  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">Pilih Frame</h1>
      <div className="flex gap-8 justify-center flex-wrap">
        {/* === Frame Landscape === */}
        <div
          onClick={() => selectFrame("landscape")}
          className="cursor-pointer group"
        >
          <div
            className="w-96 h-64 border rounded-lg shadow overflow-hidden bg-blue-200
                       transition-transform duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:bg-blue-300"
          >
            <img
              src={landscape}
              alt="Landscape"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="mt-2 text-lg">Landscape</p>
        </div>

        {/* === Frame Portrait === */}
        <div
          onClick={() => selectFrame("portrait")}
          className="cursor-pointer group"
        >
          <div
            className="w-96 h-64 border rounded-lg shadow overflow-hidden bg-blue-200
                       transition-transform duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:bg-blue-300"
          >
            <img
              src={portrait}
              alt="Portrait"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <p className="mt-2 text-lg">Portrait</p>
        </div>
      </div>
    </div>
  );
};

export default ChooseFrame;
