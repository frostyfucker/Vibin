
import { VideoTrack } from 'livekit-client';

/*
  ================================================================
  FUTURE OPTIMIZATION: Offload to Web Worker
  ================================================================
  The process of drawing to a canvas and encoding to base64 can be computationally
  intensive, especially for high-resolution screen shares. On lower-end devices, this
  could cause a momentary stutter in the UI (jank) because it runs on the main thread.

  A robust solution is to offload this entire operation to a Web Worker.
  The main thread would send the VideoTrack's MediaStreamTrack to the worker.
  The worker would then use `createImageBitmap` and `OffscreenCanvas` to perform
  the capture and encoding off the main thread, then post the resulting base64
  string back to the main thread. This ensures the UI remains perfectly smooth.
*/

/**
 * Captures a single frame from a LiveKit VideoTrack.
 * @param track The VideoTrack to capture a frame from.
 * @returns A Promise that resolves with a base64 encoded JPEG image string.
 */
export const captureFrame = (track: VideoTrack): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!track.mediaStream) {
      return reject(new Error('MediaStream is not available on the track.'));
    }

    const videoEl = document.createElement('video');
    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.autoplay = true;
    videoEl.style.display = 'none'; // Keep it off-screen
    videoEl.srcObject = track.mediaStream;

    const onCanPlay = () => {
      // Short delay to ensure the frame is fully rendered
      setTimeout(() => {
        const canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          return reject(new Error('Failed to get 2D context from canvas.'));
        }

        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        
        // toDataURL returns a base64 string. The default is PNG.
        // JPEG is generally smaller for screenshots.
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9); // 0.9 quality
        
        cleanup();
        resolve(dataUrl);
      }, 100);
    };

    const onError = (e: Event) => {
      cleanup();
      reject(new Error(`Video element error: ${e}`));
    };
    
    const cleanup = () => {
        videoEl.removeEventListener('canplay', onCanPlay);
        videoEl.removeEventListener('error', onError);
        // Stop the video playback and release resources
        videoEl.pause();
        if(videoEl.srcObject){
            const mediaStream = videoEl.srcObject as MediaStream;
            mediaStream.getTracks().forEach(track => track.stop());
        }
        videoEl.srcObject = null;
    };

    videoEl.addEventListener('canplay', onCanPlay, { once: true });
    videoEl.addEventListener('error', onError, { once: true });

    videoEl.play().catch(e => {
        cleanup();
        reject(new Error(`Failed to play video for capture: ${e}`));
    });
  });
};