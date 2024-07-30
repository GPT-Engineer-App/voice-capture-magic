import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Square, Play } from "lucide-react";

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Voice Recorder</h1>
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
