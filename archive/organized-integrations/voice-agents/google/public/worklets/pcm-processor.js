/**
 * PCM Audio Processor for Google Gemini Voice
 *
 * Converts Float32 audio from Web Audio API to Int16 PCM format
 * that Gemini's Multimodal Live API expects
 */

class PCMProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];

    if (input.length > 0) {
      const inputChannel = input[0];

      // Convert Float32 (-1 to 1) to Int16 (-32768 to 32767)
      const int16Data = new Int16Array(inputChannel.length);

      for (let i = 0; i < inputChannel.length; i++) {
        // Clamp the value between -1 and 1
        const clampedValue = Math.max(-1, Math.min(1, inputChannel[i]));

        // Convert to Int16
        int16Data[i] = clampedValue < 0
          ? clampedValue * 0x8000  // -32768
          : clampedValue * 0x7FFF; // 32767
      }

      // Send the Int16 data to the main thread
      this.port.postMessage(int16Data.buffer, [int16Data.buffer]);
    }

    // Return true to keep the processor alive
    return true;
  }
}

// Register the processor with the worklet name
registerProcessor('pcm-processor', PCMProcessor);