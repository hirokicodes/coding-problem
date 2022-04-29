import "./App.css";
import { useState, useRef } from "react";
import "react-image-crop/dist/ReactCrop.css";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import imageCompression from "browser-image-compression";
import { canvasPreview } from "./canvasPreview";
import { useDebounceEffect } from "./useDebounceEffect";

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

function App() {
  const [imgSrc, setImgSrc] = useState("");
  const previewCanvasRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const imgRef = useRef(null);

  const aspect = 1;

  function onSelectFile(e) {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setImgSrc(reader.result.toString() || "")
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspect));
  }

  function handleCroppedImageDownload() {
    const options = {
      maxSizeMB: 1,
      useWebWorker: true,
    };

    const previewCanvas = previewCanvasRef.current;

    if (!previewCanvas) {
      return;
    }

    previewCanvas.toBlob(
      async (blob) => {
        let compressedFile = blob;

        try {
          compressedFile = await imageCompression(blob, options);
        } catch (err) {
          console.log(err);
        }
        const link = document.createElement("a");
        document.body.append(link);
        link.download = "image.jpg";
        link.href = URL.createObjectURL(compressedFile);
        link.click();
        link.remove();
      },
      "image/jpeg",
      1
    );
  }

  useDebounceEffect(
    async () => {
      if (
        completedCrop?.width &&
        completedCrop?.height &&
        imgRef.current &&
        previewCanvasRef.current
      ) {
        canvasPreview(imgRef.current, previewCanvasRef.current, completedCrop);
      }
    },
    100,
    [completedCrop]
  );

  return (
    <div className="App">
      <header className="App-header">
        <p>{"1. Allow user to upload image."}</p>
        <p>{"2. Allow user to crop image to a square."}</p>
        <p>
          {
            "3. Compress the image such that it is less than 1 mb and save it locally."
          }
        </p>
        <p>{"You can use any packages. Styling is not so important."}</p>
      </header>
      <input type="file" accept="image/*" onChange={onSelectFile} />
      {imgSrc && (
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={aspect}
        >
          <img ref={imgRef} alt="Crop me" src={imgSrc} onLoad={onImageLoad} />
        </ReactCrop>
      )}
      <div>
        {Boolean(completedCrop) && (
          <canvas
            ref={previewCanvasRef}
            style={{
              border: "1px solid black",
              objectFit: "contain",
              width: completedCrop.width,
              height: completedCrop.height,
            }}
          />
        )}
      </div>

      <button onClick={handleCroppedImageDownload}>
        Download Cropped Image
      </button>
    </div>
  );
}

export default App;
