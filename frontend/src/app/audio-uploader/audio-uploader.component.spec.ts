import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioUploaderComponent } from './audio-uploader.component';

describe('AudioUploaderComponent', () => {
  let component: AudioUploaderComponent;
  let fixture: ComponentFixture<AudioUploaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AudioUploaderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AudioUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
