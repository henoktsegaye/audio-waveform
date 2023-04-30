export const mimeType = MediaRecorder.isTypeSupported("video/webm; codecs=vp9")
  ? "video/webm; codecs=vp9"
  : "video/webm";

export const generateVideo = async ({
    audio,
    color,
    backgroundImage,
    fileName,
    canvas,
    sourceNode,
    audioCtx,
    setMediaRecorder,
  }: {
    audio: HTMLAudioElement;
    color: string;
    backgroundImage: HTMLImageElement;
    fileName: string;
    canvas: HTMLCanvasElement;
    sourceNode: MediaElementAudioSourceNode;
    audioCtx: AudioContext;
    setMediaRecorder: React.Dispatch<React.SetStateAction<MediaRecorder | null>>;
  }) => {
    if (!audio) return;
  
    if (!sourceNode) return;
    async function generateVideoInside() {
      if (!canvas || !audio) return;
  
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.connect(audioCtx.destination);
      sourceNode.connect(analyserNode);
      analyserNode.fftSize = 2048;
  
      await audio.play();
  
      // create a data array to store the frequency data
      const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
  
      // get the canvas element and its context
  
      // set the canvas size to match the background image
      canvas.width = backgroundImage.width;
      canvas.height = backgroundImage.height;
  
      // draw the background image on the canvas
      ctx.drawImage(backgroundImage, 0, 0);
  
      // draw the visualization
      function draw() {
        if (!ctx || !canvas) return;
        requestAnimationFrame(draw);
        // clear the canvas
        const height = canvas.height / 2;
        ctx.fillStyle = color;
        ctx.clearRect(0, 0, canvas.width, height);
  
        // draw the background image on the canvas
        ctx.drawImage(backgroundImage, 0, 0);
        // get the frequency data
        analyserNode.getByteFrequencyData(dataArray);
  
        // draw the frequency data as bars
        const barWidth = canvas.width / dataArray.length;
        let barHeight;
        for (let i = 0; i < dataArray.length; i++) {
          barHeight = (dataArray[i] / 255) * height;
          ctx.fillRect(
            i * barWidth,
            canvas.height - barHeight,
            barWidth,
            barHeight
          );
        }
      }
  
      // start drawing the visualization
      draw();
    }
    generateVideoInside().then(() => {
      // create a MediaRecorder to record the canvas as a video
      if (!canvas || !audio) return;
  
      const chunks: Blob[] = [];
  
      // add the audio to the video
      const stream = canvas.captureStream();
      // TODO: fix this issue later
      const audioTrack = (audio as unknown as any)
        .captureStream()
        .getAudioTracks()[0];
      stream.addTrack(audioTrack);
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      setMediaRecorder(mediaRecorder);
      mediaRecorder.start();
  
      // stop recording when the audio file ends
  
      audio.addEventListener("ended", () => {
        sourceNode.disconnect();
        mediaRecorder.stop();
      });
  
      // save the video when recording stops
      mediaRecorder.addEventListener("stop", () => {
        const blob = new Blob(chunks, { type: "video/webmm" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `${fileName}.webm`;
        link.href = url;
        link.click();
      });
  
      // add chunks to the array when they become available
      mediaRecorder.addEventListener("dataavailable", (event) => {
        chunks.push(event.data);
      });
    });
  };