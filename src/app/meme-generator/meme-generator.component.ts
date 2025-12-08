import { Component, signal, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { WindowsLoaderComponent } from '../shared/windows-loader/windows-loader.component';

@Component({
  selector: 'app-meme-generator',
  standalone: true,
  imports: [CommonModule, WindowsLoaderComponent],
  templateUrl: './meme-generator.component.html',
  styleUrl: './meme-generator.component.scss'
})
export class MemeGeneratorComponent implements OnInit {
  http = inject(HttpClient);
  isLeftMinimized = false;
  isCenterMinimized = false;
  isRightMinimized = false;

  // Signals
  file = signal<File | null>(null);
  instructions = signal<string>('');
  
  // New Signals
  contextLanguage = signal<'English' | 'Nepali'>('Nepali');
  templates = signal<string[]>([]);
  isLoading = signal<boolean>(false);

  // Generated Memes
  generatedMemes = signal<any[]>([]);
  currentMemeIndex = signal<number>(0);

  // Tab State (Standard Property)
  activeTab: 'trendy' | 'custom' = 'trendy';

  // Hardcoded Trendy Templates
  trendyTemplates = [
    'https://i.imgflip.com/30b1gx.jpg', // Drake
    'https://i.imgflip.com/1g8my4.jpg', // Two Buttons
    'https://i.imgflip.com/1ur9b0.jpg', // Distracted Boyfriend
    'https://i.imgflip.com/261o3j.jpg', // Expanding Brain
    'https://i.imgflip.com/265k.jpg',   // Batman Slapping Robin
  ];

  ngOnInit() {
    this.loadTemplates();
  }
  
  toggleMinimize(panel: 'left' | 'center' | 'right') {
    if (panel === 'left') this.isLeftMinimized = !this.isLeftMinimized;
    if (panel === 'center') this.isCenterMinimized = !this.isCenterMinimized;
    if (panel === 'right') this.isRightMinimized = !this.isRightMinimized;
  }

  // Logic to handle file selection
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.file.set(input.files[0]);
    }
  }
  
  // Discard file (Cross Button)
  removeFile() {
    this.file.set(null);
    const fileInput = document.querySelector('.file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  // Logic to update instructions signal
  updateInstructions(event: Event) {
    const input = event.target as HTMLTextAreaElement;
    this.instructions.set(input.value);
  }

  // Context Toggle
  setContext(lang: 'English' | 'Nepali') {
    this.contextLanguage.set(lang);
  }

  // Set Active Tab
  setActiveTab(tab: 'trendy' | 'custom') {
    this.activeTab = tab;
  }

  // Load Templates
  loadTemplates() {
    this.http.get<string[]>('http://localhost:3000/api/templates').subscribe({
        next: (urls) => this.templates.set(urls),
        error: (err) => console.error('Failed to load templates', err)
    });
  }

  // Upload Template
  onTemplateUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
        const file = input.files[0];
        const formData = new FormData();
        formData.append('template', file); // Use 'template' field

        this.isLoading.set(true);
        this.http.post<{ success: boolean, url: string }>('http://localhost:3000/api/upload-template', formData)
            .subscribe({
                next: (res) => {
                    this.loadTemplates(); 
                    this.isLoading.set(false);
                },
                error: (err) => {
                    console.error('Template upload failed', err);
                    this.isLoading.set(false);
                }
            });
    }
  }

  // Generation
  onGenerate() {
    this.isLoading.set(true);
    const formData = new FormData();
    const currentFile = this.file();
    
    if (currentFile) {
        formData.append('file', currentFile);
    }
    
    // Instructions might be used as fallback context if file fails or is missing, 
    // but primarily we just want the parsed text.
    formData.append('instructions', this.instructions());

    // 1. Parse Context
    this.http.post<{ success: boolean, parsedText: string }>('http://localhost:3000/api/parse-context', formData)
      .subscribe({
        next: (parseResponse) => {
          console.log('Parsed Context Response:', parseResponse);
          
          if (parseResponse && parseResponse.success) {
              const parsedContext = parseResponse.parsedText;
              
              // 2. Generate Memes
              // Input: parsedNewsText, userVibe
              const generatePayload = {
                  parsedNewsText: parsedContext,
                  userVibe: this.instructions()
              };

              this.http.post<{ success: boolean, memes: any[] }>('http://localhost:3000/api/generate-memes', generatePayload)
                .subscribe({
                    next: (genResponse) => {
                        console.log('Generated Memes:', genResponse);
                        if (genResponse.success && genResponse.memes) {
                            this.generatedMemes.set(genResponse.memes);
                            this.currentMemeIndex.set(0); 
                        }
                        this.isLoading.set(false);
                    },
                    error: (genErr) => {
                        console.error('Meme generation failed:', genErr);
                        this.isLoading.set(false);
                    }
                });

          } else {
              console.error('Context parsing failed or returned no success flag');
              this.isLoading.set(false);
          }
        },
        error: (error) => {
          console.error('Error parsing context:', error);
          this.isLoading.set(false);
        }
      });
  }

  nextMeme() {
    this.currentMemeIndex.update(i => (i + 1) % this.generatedMemes().length);
  }
  
  prevMeme() {
    this.currentMemeIndex.update(i => (i - 1 + this.generatedMemes().length) % this.generatedMemes().length);
  }
}
