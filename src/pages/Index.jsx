import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Square, Sun, Moon, Play, Pause, Type } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import WaveSurfer from 'wavesurfer.js';

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcription, setTranscription] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const wavesurferRef = useRef(null);
  const waveformRef = useRef(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    document.body.className = theme;

    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: theme === 'dark' ? '#8B5CF6' : '#3B82F6',
      progressColor: theme === 'dark' ? '#EC4899' : '#EF4444',
      cursorColor: theme === 'dark' ? '#EC4899' : '#EF4444',
      barWidth: 2,
      barRadius: 3,
      responsive: true,
      height: 100,
      normalize: true,
      partialRender: true,
    });

    wavesurferRef.current.on('play', () => setIsPlaying(true));
    wavesurferRef.current.on('pause', () => setIsPlaying(false));
    wavesurferRef.current.on('finish', () => setIsPlaying(false));

    return () => wavesurferRef.current.destroy();
  }, [theme]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        wavesurferRef.current.loadBlob(audioBlob);
        toast.success("Recording saved successfully!");
        audioChunksRef.current = [];
        setIsPlaying(false);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      wavesurferRef.current.empty();
      wavesurferRef.current.microphone.start();
      toast.success("Recording started!");
    } catch (error) {
      console.error('Error accessing microphone:', error);
      // Removed error toast
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      wavesurferRef.current.microphone.stop();
      toast.success("Recording stopped!");
      transcribeAudio();
    }
  };

  const transcribeAudio = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTranscription(transcript);
      toast.success("Transcription completed!");
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      toast.error("Transcription failed. Please try again.");
    };

    recognition.start();
  };

  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setOptions({
        waveColor: theme === 'dark' ? '#8B5CF6' : '#3B82F6',
        progressColor: theme === 'dark' ? '#EC4899' : '#EF4444',
      });
    }
  }, [theme]);

  return (
    <div className={cn("flex flex-col items-center justify-center min-h-screen bg-background", theme)}>
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
        <div className="mb-6 w-full">
          <h2 className="text-lg font-semibold mb-2 text-foreground">Audio Waveform</h2>
          <div ref={waveformRef} className="border border-border rounded-md"></div>
          {isRecording && (
            <p className="text-sm text-center mt-2 text-destructive">Recording in progress...</p>
          )}
        </div>
        {audioURL && (
          <div className="flex flex-col items-center">
            <div className="flex space-x-2 mb-4">
              <Button onClick={togglePlayPause} variant="outline">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button onClick={() => setAudioURL('')} variant="outline">
                Clear Recording
              </Button>
            </div>
          </div>
        )}
        {transcription && (
          <div className="mt-6 p-4 bg-muted rounded-md">
            <h2 className="text-lg font-semibold mb-2 flex items-center">
              <Type className="mr-2 h-4 w-4" /> Transcription
            </h2>
            <p className="text-sm text-foreground">{transcription}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
