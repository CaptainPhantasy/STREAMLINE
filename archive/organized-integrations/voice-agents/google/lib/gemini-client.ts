/**
 * Gemini Voice Client
 *
 * A lightweight wrapper around Google's Multimodal Live API
 * Handles: Microphone, Speaker, WebSocket, and Tool Events
 */

export type ToolHandler = (name: string, args: any) => Promise<any>;
export type StatusChangeHandler = (status: string, data?: any) => void;
export type AudioReceivedHandler = (audioData: ArrayBuffer) => void;

interface GeminiConfig {
  apiKey: string;
  url: string;
  model: string;
  userContext?: any;
}

interface GeminiTool {
  name: string;
  description: string;
  parameters?: any;
}

export class GeminiVoiceClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private isConnected = false;
  private isSpeaking = false;
  private onToolCall: ToolHandler;
  private onStatusChange: StatusChangeHandler;
  private onAudioReceived?: AudioReceivedHandler;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  constructor({
    onToolCall,
    onStatusChange,
    onAudioReceived
  }: {
    onToolCall: ToolHandler;
    onStatusChange: StatusChangeHandler;
    onAudioReceived?: AudioReceivedHandler;
  }) {
    this.onToolCall = onToolCall;
    this.onStatusChange = onStatusChange;
    this.onAudioReceived = onAudioReceived;
  }

  async connect(config: GeminiConfig, tools: GeminiTool[], systemInstruction: string) {
    if (this.isConnected) {
      console.warn('[GeminiClient] Already connected');
      return;
    }

    try {
      this.onStatusChange('connecting');

      // 1. Setup Audio Context
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000
        });
      }

      // Resume audio context if suspended (browser policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Load audio worklet
      await this.audioContext.audioWorklet.addModule('/voice-agents/google/public/worklets/pcm-processor.js');

      // 2. Setup WebSocket
      const wsUrl = `${config.url}?key=${config.apiKey}`;
      console.log('[GeminiClient] Connecting to:', wsUrl.replace(config.apiKey, '[REDACTED]'));

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[GeminiClient] WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.onStatusChange('connected');

        // Send Initial Setup
        const setupMessage = {
          setup: {
            model: config.model,
            generation_config: {
              response_modalities: ["AUDIO"],
              speech_config: {
                voice_config: {
                  prebuilt_voice_config: {
                    voice_name: "Kore" // Professional, neutral voice
                  }
                }
              },
              temperature: 0.7
            },
            system_instruction: {
              parts: [{ text: systemInstruction }]
            },
            tools: tools.length > 0 ? [{ function_declarations: tools }] : undefined
          }
        };

        console.log('[GeminiClient] Sending setup message');
        this.sendJSON(setupMessage);

        // Start microphone after setup is sent
        setTimeout(() => {
          this.startMicrophone();
        }, 500);
      };

      this.ws.onmessage = async (event) => {
        try {
          let data;
          if (event.data instanceof Blob) {
            data = JSON.parse(await event.data.text());
          } else {
            data = JSON.parse(event.data);
          }

          await this.handleServerMessage(data);
        } catch (error) {
          console.error('[GeminiClient] Error parsing message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('[GeminiClient] WebSocket closed:', event.code, event.reason);
        this.isConnected = false;
        this.onStatusChange('disconnected');

        // Attempt reconnection if not intentionally closed
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`[GeminiClient] Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
          setTimeout(() => {
            this.connect(config, tools, systemInstruction);
          }, 2000 * this.reconnectAttempts);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[GeminiClient] WebSocket error:', error);
        this.onStatusChange('error', { error: 'WebSocket connection failed' });
      };

    } catch (error) {
      console.error('[GeminiClient] Failed to connect:', error);
      this.onStatusChange('error', { error: 'Failed to initialize voice client' });
      throw error;
    }
  }

  private async handleServerMessage(data: any) {
    // Handle setup complete
    if (data.setupComplete) {
      console.log('[GeminiClient] Setup complete');
      this.onStatusChange('ready');
      return;
    }

    // Handle Audio
    if (data.serverContent?.modelTurn?.parts) {
      for (const part of data.serverContent.modelTurn.parts) {
        if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/')) {
          this.isSpeaking = true;
          this.onStatusChange('speaking');

          // Convert base64 to ArrayBuffer
          const audioBuffer = this.base64ToArrayBuffer(part.inlineData.data);

          if (this.onAudioReceived) {
            this.onAudioReceived(audioBuffer);
          } else {
            // Default audio playback
            await this.playAudio(audioBuffer);
          }
        }

        // Check for text content
        if (part.text) {
          console.log('[GeminiClient] Agent text:', part.text);
        }
      }
    }

    // Handle Tool Calls
    if (data.toolCall?.functionCalls) {
      for (const call of data.toolCall.functionCalls) {
        console.log(`[GeminiClient] Tool call: ${call.name}`, call.args);

        try {
          // Execute Tool
          const result = await this.onToolCall(call.name, call.args);

          // Send Response back
          this.sendJSON({
            toolResponse: {
              functionResponses: [{
                name: call.name,
                id: call.id,
                response: { result: result }
              }]
            }
          });
        } catch (error) {
          console.error(`[GeminiClient] Tool execution error for ${call.name}:`, error);

          // Send error response
          this.sendJSON({
            toolResponse: {
              functionResponses: [{
                name: call.name,
                id: call.id,
                response: {
                  error: error instanceof Error ? error.message : 'Unknown error'
                }
              }]
            }
          });
        }
      }
    }

    // Handle turn complete
    if (data.serverContent?.turnComplete) {
      this.isSpeaking = false;
      this.onStatusChange('ready');
    }
  }

  private sendJSON(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[GeminiClient] Cannot send message, WebSocket not ready');
    }
  }

  private async startMicrophone() {
    try {
      console.log('[GeminiClient] Starting microphone');

      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000
        }
      });

      // Create audio source
      this.sourceNode = this.audioContext!.createMediaStreamSource(this.stream);

      // Create processor node
      this.workletNode = new AudioWorkletNode(this.audioContext!, 'pcm-processor');

      // Handle audio data from processor
      this.workletNode.port.onmessage = (event) => {
        if (this.isConnected && event.data) {
          // Convert to base64 and send
          const base64Audio = this.arrayBufferToBase64(event.data);
          this.sendJSON({
            realtime_input: {
              media_chunks: [{
                mime_type: "audio/pcm;rate=24000",
                data: base64Audio
              }]
            }
          });
        }
      };

      // Connect audio nodes
      this.sourceNode.connect(this.workletNode);
      this.workletNode.connect(this.audioContext!.destination);

      console.log('[GeminiClient] Microphone started successfully');
      this.onStatusChange('listening');

    } catch (error) {
      console.error('[GeminiClient] Failed to start microphone:', error);
      this.onStatusChange('error', { error: 'Microphone access denied' });
      throw error;
    }
  }

  private async playAudio(audioBuffer: ArrayBuffer) {
    try {
      if (!this.audioContext) return;

      // Convert Int16 PCM to Float32
      const int16Data = new Int16Array(audioBuffer);
      const float32Data = new Float32Array(int16Data.length);

      for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 32768.0;
      }

      // Create audio buffer
      const buffer = this.audioContext.createBuffer(1, float32Data.length, 24000);
      buffer.copyToChannel(float32Data, 0);

      // Create and play source
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start();

      source.onended = () => {
        this.isSpeaking = false;
        this.onStatusChange('ready');
      };

    } catch (error) {
      console.error('[GeminiClient] Audio playback error:', error);
    }
  }

  // Send a text message to the agent
  sendText(text: string) {
    if (!this.isConnected) {
      console.warn('[GeminiClient] Cannot send text, not connected');
      return;
    }

    this.sendJSON({
      client_content: {
        parts: [{ text: text }]
      }
    });
  }

  // Mute/unmute microphone
  setMuted(muted: boolean) {
    if (this.stream) {
      this.stream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  getIsMuted(): boolean {
    if (this.stream) {
      return !this.stream.getAudioTracks()[0]?.enabled;
    }
    return true;
  }

  disconnect() {
    console.log('[GeminiClient] Disconnecting...');
    this.isConnected = false;
    this.isSpeaking = false;

    if (this.ws) {
      this.ws.close(1000, 'User disconnect');
      this.ws = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.onStatusChange('disconnected');
  }

  // Utility methods
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Get current status
  getStatus(): {
    isConnected: boolean;
    isSpeaking: boolean;
    isListening: boolean;
  } {
    return {
      isConnected: this.isConnected,
      isSpeaking: this.isSpeaking,
      isListening: this.stream?.getAudioTracks()[0]?.enabled || false
    };
  }
}