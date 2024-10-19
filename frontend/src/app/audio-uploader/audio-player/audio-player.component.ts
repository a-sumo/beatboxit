import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-audio-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <audio *ngIf="audioUrl" controls>
      <source [src]="audioUrl" type="audio/wav">
      Your browser does not support the audio element.
    </audio>
  `
})
export class AudioPlayerComponent implements OnChanges {
  @Input() audioUrl: string | null = null;

  ngOnChanges(): void {

  }
}
