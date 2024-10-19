import { Component, ChangeDetectorRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Match } from '../match';
import { SearchService } from '../services/search.service';
import { AudioPlayerComponent } from './audio-player/audio-player.component';

@Component({
  selector: 'app-audio-uploader',
  standalone: true,
  imports: [CommonModule, AudioPlayerComponent],
  templateUrl: './audio-uploader.component.html',
  styleUrls: ['./audio-uploader.component.css']
})
export class AudioUploaderComponent {
  uploadedFileUrl: string | null = null;
  matches: Match[] = [];
  mediaRecorder: MediaRecorder | null = null;
  maxRecordTime = 2000; // 2 seconds in milliseconds
  isRecording = false;
  recordingCountdown: number | null = null;
  recordingProgress: number | null = null;
  showAudioPlayer = false;

  constructor(private searchService: SearchService,
    private changeDetectorRef: ChangeDetectorRef) { }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processAudioFile(input.files[0]);
    }
  }

  loadPreUploadedAudio(): void {
    fetch('/assets/audio/couch kick 1 @TeaBoi.wav')
      .then(response => response.blob())
      .then(blob => {
        this.processAudioFile(new File([blob], 'couch kick 1 @TeaBoi.wav', { type: 'audio/wav' }));
      });
  }
  private processAudioFile(file: File): void {
    const audioContext = new AudioContext();
    const reader = new FileReader();

    reader.onload = (event: any) => {
      audioContext.decodeAudioData(event.target.result)
        .then(buffer => {
          if (buffer.duration > 2) {
            this.truncateAudio(buffer, audioContext)
              .then(truncatedBuffer => {
                this.setUploadedFile(new File([truncatedBuffer], file.name, { type: 'audio/wav' }));
              });
          } else {
            this.setUploadedFile(file);
          }
        })
        .catch(error => console.error('Error processing audio file:', error));
    };
    reader.readAsArrayBuffer(file);
  }
  private truncateAudio(buffer: AudioBuffer, audioContext: AudioContext): Promise<Blob> {
    return new Promise(resolve => {
      const truncatedBuffer = audioContext.createBuffer(buffer.numberOfChannels, audioContext.sampleRate * 2, audioContext.sampleRate);
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        truncatedBuffer.copyToChannel(buffer.getChannelData(channel), channel, 0);
      }

      // Export the truncated buffer to a blob
      const bufferSource = audioContext.createBufferSource();
      bufferSource.buffer = truncatedBuffer;
      const dest = audioContext.createMediaStreamDestination();
      bufferSource.connect(dest);
      bufferSource.start();

      const recorder = new MediaRecorder(dest.stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => resolve(new Blob(chunks, { type: 'audio/wav' }));

      recorder.start();
      setTimeout(() => recorder.stop(), 2000); // Stop recording after 2 seconds
    });
  }
  startRecording(): void {
    this.recordingCountdown = 3;
    const countdownInterval = setInterval(() => {
      this.recordingCountdown = this.recordingCountdown as number - 1;
      if (this.recordingCountdown === 0) {
        clearInterval(countdownInterval);
        this.beginRecording();
      }
    }, 1000);
  }

  private setUploadedFile(file: File): void {
    this.uploadedFileUrl = URL.createObjectURL(file);
    this.toggleAudioPlayer();
  }

  private toggleAudioPlayer(): void {
    this.showAudioPlayer = false;
    // Introduce a brief delay before resetting showAudioPlayer to true
    setTimeout(() => {
      this.showAudioPlayer = true;
      this.changeDetectorRef.detectChanges(); // Trigger change detection
    }, 100); // A 100ms delay is typically enough
  }


  private beginRecording(): void {
    this.isRecording = true;
    this.recordingProgress = 100;

    navigator.mediaDevices.getUserMedia({ audio: { noiseSuppression: true } })
      .then(stream => {
        this.mediaRecorder = new MediaRecorder(stream);
        const audioChunks: BlobPart[] = [];

        this.mediaRecorder.ondataavailable = event => {
          audioChunks.push(event.data);
        };

        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          this.uploadedFileUrl = URL.createObjectURL(audioBlob);
          this.toggleAudioPlayer(); // Delete and recreate the audio player component
        };        

        this.mediaRecorder.start();

        setTimeout(() => {
          this.mediaRecorder?.stop();
        }, this.maxRecordTime);

        const progressInterval = setInterval(() => {
          this.recordingProgress = this.recordingProgress as number - 100 / (this.maxRecordTime / 100);
          if (this.recordingProgress <= 0) {
            clearInterval(progressInterval);
          }
        }, 100);
      })
      .catch(error => {
        console.error('Error accessing media devices:', error);
        this.isRecording = false;
      });
  }

  performSearch(): void {
    if (this.uploadedFileUrl) {
      fetch(this.uploadedFileUrl)
        .then(response => response.blob())
        .then(blob => {
          const file = new File([blob], 'search-audio.wav', { type: 'audio/wav' });
          this.uploadFile(file);
        });
    }
  }

  private adjustFileUrl(url: string): string {
    if (url.includes('s3.amazonaws.com')) {
      return url.split('?')[0];
    } else {
      return url;
    }
  }

  private uploadFile(file: File): void {
    this.searchService.searchAudio(file).subscribe({
      next: (response) => {
        console.log('Success:', response);
        this.matches = response.map(match => ({
          file_url: this.adjustFileUrl(match.file_url),
          id: match.id
        }));
      },
      error: (error) => console.error('Error:', error),
      complete: () => console.log('Upload complete')
    });
  }
}
