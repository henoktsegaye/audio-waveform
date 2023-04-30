import React, { useState, useRef, useEffect, useMemo } from "react";
import { generateVideo } from "./generateVideo";
import alpha from "color-alpha";

type AudioVisualizerProps = {
  backgroundImage: HTMLImageElement;
  fileName: string;
  audio: HTMLAudioElement;
  color: string;
  audioCtx: AudioContext | null;
  sourceNode: MediaElementAudioSourceNode | null;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
};

const defaultColor = "#ffff00";

const InputClass = `
form-input

mt-3
block
w-full
rounded-md
text-white
bg-gray-800

border-gray-700
shadow-sm
focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50
`;

function AudioVisualizer({ canvasRef }: AudioVisualizerProps) {
  return (
    <div className="flex w-full py-10 flex-col gap-4">
      <canvas ref={canvasRef} />
    </div>
  );
}

function App() {
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [color, setColor] = useState(defaultColor);
  const [opacity, setOpacity] = useState<number>(1);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [backgroundImage, setBackgroundImage] =
    useState<HTMLImageElement | null>(null);

  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [sourceNode, setSourceNode] =
    useState<MediaElementAudioSourceNode | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );

  const colorWithOpacity = useMemo((): string => {
    try {
      return alpha(color, opacity) as string;
    } catch {
      return color;
    }
  }, [color, opacity]);

  const checkIfValidAudioFileSelected = (file: File | null) => {
    if (!file) return false;
    const validFileTypes = ["audio/mpeg", "audio/wav", "audio/ogg"];
    return validFileTypes.includes(file.type);
  };

  const checkIfValidImageFileSelected = (file: File | null) => {
    console.log("FILE TYPE", file?.type);
    if (!file) return false;
    const validFileTypes = ["image/jpeg", "image/png"];
    return validFileTypes.includes(file.type);
  };

  function handleAudioFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const audioFile = event?.target?.files?.[0] ?? null;

    if (!audioFile || !checkIfValidAudioFileSelected(audioFile)) return;
    const audioUrl = URL.createObjectURL(audioFile);
    setAudioFile(audioUrl);
    setFileName(audioFile.name.split(".").slice(0, -1).join("."));
  }

  useEffect(() => {
    if (!audioFile) return;
    const audio = new Audio(audioFile);
    setAudio(audio);
  }, [audioFile]);

  useEffect(() => {
    if (!audio) return;
    const audioCtx = new AudioContext();
    const sourceNode = audioCtx.createMediaElementSource(audio);
    setAudioCtx(audioCtx);
    setSourceNode(sourceNode);
  }, [audio]);

  useEffect(() => {
    if (!canvasRef.current || !backgroundImage) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    canvasRef.current.width = backgroundImage.width;
    canvasRef.current.height = backgroundImage.height;
    ctx.drawImage(backgroundImage, 0, 0);
  }, [backgroundImage]);

  function handleBackgroundImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const image = new Image();
      image.onload = () => {
        setBackgroundImage(image);
      };
      image.src = fileReader.result as string;
    };
    const file = event?.target?.files?.[0] ?? null;
    if (!file || !checkIfValidImageFileSelected(file)) return;
    fileReader.readAsDataURL(file);
  }

  return (
    <div className=" grid grid-cols-12 gap-4  h-screen w-screen">
      <div className=" col-span-3 border-r-2 flex flex-col justify-between  h-full px-4 py-10 border-gray-900">
        <div>
          <h1 className="text-3xl  uppercase font-bold text-left mb-2 text-green-500">
            Audio Visualizer
          </h1>
          <p className="text-sm text-gray-400 mb-6 ">
            Give it audio and image and it will create an audio Visualizer with
            that image as a video. which you can download and use.
          </p>
          <div className="mb-2 bg-black rounded-lg p-4">
            <label htmlFor="audioFile">Audio File</label>
            <input
              type="file"
              className={InputClass}
              accept="audio/*"
              id="audioFile"
              onChange={handleAudioFileChange}
            />
          </div>
          <div className="mb-2 bg-black rounded-lg p-4">
            <label htmlFor="backgroundImage">Background Image</label>
            <input
              type="file"
              className={InputClass}
              accept="image/*"
              id="backgroundImage"
              onChange={handleBackgroundImageChange}
            />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 mt-4">
            <label htmlFor="color">Color:</label>
            <input
              type="color"
              id="color"
              className={`${InputClass} h-12 w-44`}
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <label htmlFor="range"> Opacity:</label>
            <input
              type="range"
              step={0.001}
              min={0}
              max={1}
              value={opacity}
              onChange={(e) => {
                setOpacity(parseFloat(e.target.value) ?? 0);
              }}
            />
          </div>
          <div className="flex flex-col gap-3">
            <button
              className=" text-sm px-6 py-2 disabled:opacity-60  w-auto  border-2 text-green-600 border-green-600 rounded "
              disabled={!audioFile || !backgroundImage}
              onClick={() => {
                audio?.pause();
                mediaRecorder?.stop();
              }}
            >
              Stop
            </button>
            <button
              disabled={!audioFile || !backgroundImage}
              onClick={() =>
                sourceNode &&
                audioCtx &&
                audio &&
                backgroundImage &&
                canvasRef.current &&
                fileName &&
                generateVideo({
                  canvas: canvasRef.current,
                  audio,
                  color: colorWithOpacity,
                  backgroundImage,
                  fileName,
                  sourceNode,
                  audioCtx,
                  setMediaRecorder,
                })
              }
              title="once the download button has been clicked we will play the clip and download the video for you."
              className=" px-6 py-2 disabled:opacity-60   bg-green-600 text-white rounded "
            >
              Export into Video
            </button>
          </div>
        </div>
      </div>
      <div className="flex col-span-9 flex-wrap items-center justify-center overflow-auto h-full ">
        {audio && backgroundImage && (
          <AudioVisualizer
            fileName={fileName ?? `Audio-visualizer-${Date.now()}`} // if fileName is null, use generic name
            audio={audio}
            color={color}
            backgroundImage={backgroundImage}
            audioCtx={audioCtx}
            sourceNode={sourceNode}
            canvasRef={canvasRef}
          />
        )}
        {(!audioFile || !backgroundImage) && (
          <div className="flex flex-col items-center justify-center">
            <p className="text-xl mb-6 text-gray-500 text-center ">
              Please select an audio file and a background image to get started.
            </p>
            <div className="bg-gray-900 p-4 text-center rounded-lg">
              <span className="text-8xl block   mb-6 ">🪴 </span>
              <p className="text-sm text-gray-400 mt-4">
                Please plant a tree before you download the video.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
