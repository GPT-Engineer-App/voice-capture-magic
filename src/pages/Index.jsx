import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Square, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const analyserRef = useRef(null);
  const { theme, setTheme } = useTheme();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
        toast.success("Recording saved successfully!");
        audioChunksRef.current = [];
        cancelAnimationFrame(animationRef.current);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      drawAmplitudeMeter();
      toast.success("Recording started!");
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error("Failed to start recording. Please check your microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const drawAmplitudeMeter = () => {
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, theme === 'dark' ? '#8B5CF6' : '#3B82F6');
      gradient.addColorStop(1, theme === 'dark' ? '#EC4899' : '#EF4444');

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;

        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  };

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="p-8 bg-card rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Voice Recorder</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
          </Button>
        </div>
        <div className="flex justify-center space-x-4 mb-6">
          {!isRecording ? (
            <Button onClick={startRecording} className="bg-red-500 hover:bg-red-600">
              <Mic className="mr-2 h-4 w-4" /> Record
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="destructive">
              <Square className="mr-2 h-4 w-4" /> Stop
            </Button>
          )}
        </div>
        {isRecording && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-foreground">Audio Amplitude</h2>
            <canvas ref={canvasRef} width="300" height="100" className="border border-border rounded-md"></canvas>
            <p className="text-sm text-center mt-2 text-destructive">Recording in progress...</p>
          </div>
        )}
        {audioURL && (
          <div className="flex flex-col items-center">
            <audio src={audioURL} controls className="mb-4" />
            <Button onClick={() => setAudioURL('')} variant="outline">
              Clear Recording
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
