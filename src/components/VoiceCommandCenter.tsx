import { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { parseVoiceCommand, formatCommandSummary, ParsedCommand } from '@/utils/nlpProcessor';
import { useToast } from '@/hooks/use-toast';

interface VoiceCommandCenterProps {
  onCommandParsed?: (command: ParsedCommand) => void;
}

const VoiceCommandCenter = ({ onCommandParsed }: VoiceCommandCenterProps) => {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [lastCommand, setLastCommand] = useState<ParsedCommand | null>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const { toast } = useToast();

  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: voiceSupported,
    error: voiceError,
  } = useVoiceRecognition((result) => {
    if (result.isFinal && result.transcript.trim()) {
      handleVoiceCommand(result.transcript);
    }
  });

  const {
    speak,
    cancel: cancelSpeech,
    isSpeaking,
    isSupported: ttsSupported,
  } = useTextToSpeech();

  useEffect(() => {
    if (voiceError) {
      toast({
        title: 'Voice Recognition Error',
        description: voiceError,
        variant: 'destructive',
      });
    }
  }, [voiceError, toast]);

  const handleVoiceCommand = (text: string) => {
    const parsed = parseVoiceCommand(text);
    setLastCommand(parsed);
    setCommandHistory((prev) => [text, ...prev.slice(0, 4)]);

    console.log('Parsed command:', parsed);

    // Provide voice feedback
    if (parsed.needsClarification && parsed.clarificationQuestion) {
      speak(parsed.clarificationQuestion, { rate: 1.0, pitch: 1.0 });
      toast({
        title: 'Clarification Needed',
        description: parsed.clarificationQuestion,
      });
    } else {
      const summary = formatCommandSummary(parsed);
      speak(`Searching for ${summary}`, { rate: 1.1, pitch: 1.0 });
      toast({
        title: 'Command Recognized',
        description: summary,
      });
    }

    if (onCommandParsed) {
      onCommandParsed(parsed);
    }
  };

  const toggleVoiceMode = () => {
    if (!voiceSupported) {
      toast({
        title: 'Not Supported',
        description: 'Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.',
        variant: 'destructive',
      });
      return;
    }

    if (voiceEnabled) {
      stopListening();
      cancelSpeech();
      resetTranscript();
      setVoiceEnabled(false);
    } else {
      startListening();
      setVoiceEnabled(true);
      speak('Voice mode activated. I\'m listening.', { rate: 1.0 });
    }
  };

  const handleManualSubmit = () => {
    if (transcript.trim()) {
      handleVoiceCommand(transcript);
      resetTranscript();
    }
  };

  const displayTranscript = transcript + (interimTranscript ? ` ${interimTranscript}` : '');

  return (
    <Card className="p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Voice Command Center</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Speak naturally to search cases and investigate crimes
          </p>
        </div>

        {/* Voice Mode Toggle */}
        <div className="flex items-center justify-center gap-4">
          <span className="text-sm font-medium">Voice Mode</span>
          <Button
            variant={voiceEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={toggleVoiceMode}
            className="gap-2"
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {voiceEnabled ? 'ON' : 'OFF'}
          </Button>
          {isSpeaking && (
            <Badge variant="secondary" className="animate-pulse">
              Speaking...
            </Badge>
          )}
        </div>

        {/* Microphone Button */}
        <div className="flex justify-center">
          <button
            onClick={toggleVoiceMode}
            disabled={!voiceSupported}
            className={`
              relative rounded-full p-12 transition-all duration-300
              ${isListening 
                ? 'bg-primary shadow-glow-blue animate-recording' 
                : 'bg-primary/20 hover:bg-primary/30'
              }
              ${!voiceSupported ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {isListening ? (
              <Mic className="h-16 w-16 text-primary-foreground" />
            ) : (
              <MicOff className="h-16 w-16 text-primary" />
            )}
            
            {isListening && (
              <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping" />
            )}
          </button>
        </div>

        {/* Status Indicator */}
        <div className="text-center">
          {isListening ? (
            <Badge variant="default" className="gap-2">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              Listening...
            </Badge>
          ) : (
            <Badge variant="outline">
              {voiceEnabled ? 'Voice mode active' : 'Click microphone to start'}
            </Badge>
          )}
        </div>

        {/* Transcript Display */}
        {displayTranscript && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Recognized Speech:</label>
            <div className="relative">
              <div className="min-h-[100px] p-4 rounded-lg bg-muted border border-border">
                <p className="text-foreground font-mono">
                  {transcript}
                  {interimTranscript && (
                    <span className="text-muted-foreground italic"> {interimTranscript}</span>
                  )}
                </p>
              </div>
              {transcript && !isListening && (
                <Button
                  onClick={handleManualSubmit}
                  size="sm"
                  className="absolute bottom-2 right-2"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Process Command
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Last Parsed Command */}
        {lastCommand && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Parsed Command:</label>
            <div className="p-4 rounded-lg bg-card border border-border space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={lastCommand.needsClarification ? 'destructive' : 'default'}>
                  Intent: {lastCommand.intent.replace('_', ' ')}
                </Badge>
                <Badge variant="secondary">
                  Confidence: {(lastCommand.confidence * 100).toFixed(0)}%
                </Badge>
              </div>
              
              {Object.keys(lastCommand.entities).length > 0 && (
                <div className="text-sm">
                  <p className="font-medium mb-1">Extracted Information:</p>
                  <p className="text-muted-foreground">{formatCommandSummary(lastCommand)}</p>
                </div>
              )}

              {lastCommand.needsClarification && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">
                    {lastCommand.clarificationQuestion}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Command History */}
        {commandHistory.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Recent Commands:</label>
            <div className="space-y-1">
              {commandHistory.map((cmd, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-md bg-muted text-sm text-muted-foreground truncate"
                >
                  {cmd}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
          <p className="text-sm font-medium mb-2">Example Commands:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• "Show me all armed robberies this month"</li>
            <li>• "Find cases near Sector 9 from last week"</li>
            <li>• "Search for theft cases involving vehicles"</li>
            <li>• "Get homicide cases from this year"</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default VoiceCommandCenter;
