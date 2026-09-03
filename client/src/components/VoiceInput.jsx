import React, { useState, useEffect } from "react";
import { Mic, MicOff, Volume2, AlertCircle } from "lucide-react";

const VoiceInput = ({ onTranscript, textValue = "" }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        }
      }
      if (finalTranscript) {
        onTranscript((prev) => {
          const space = prev && !prev.endsWith(" ") ? " " : "";
          return prev + space + finalTranscript.trim();
        });
      }
    };

    rec.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    setRecognition(rec);
  }, []);

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.error("Error starting speech recognition:", err);
      }
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-400/80 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
        <AlertCircle className="w-4 h-4" />
        <span>Voice dictation is not supported in this browser (Use Chrome or Edge).</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggleListening}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
          isListening
            ? "bg-rose-600 text-white shadow-lg shadow-rose-600/40 animate-pulse"
            : "bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30"
        }`}
      >
        {isListening ? (
          <>
            <MicOff className="w-4 h-4" />
            <span>Stop Recording</span>
          </>
        ) : (
          <>
            <Mic className="w-4 h-4 text-indigo-400" />
            <span>Voice Input (Speak)</span>
          </>
        )}
      </button>

      {isListening && (
        <span className="flex items-center gap-2 text-xs text-rose-400 font-medium animate-pulse">
          <Volume2 className="w-4 h-4" />
          Listening... Dictate your answer clearly
        </span>
      )}
    </div>
  );
};

export default VoiceInput;
