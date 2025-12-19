import { Component, signal, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { WindowsLoaderComponent } from '../shared/windows-loader/windows-loader.component';

@Component({
  selector: 'app-meme-generator',
  standalone: true,
  imports: [CommonModule, WindowsLoaderComponent, DragDropModule],
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
  // Hardcoded Trendy Templates with Stats
  trendyTemplates = [
    { url: 'assets/images/templates/trend_1.jpeg', likes: '1.1k', shares: '232' },
    { url: 'assets/images/templates/trend_2.jpeg', likes: '531', shares: '278' },
    { url: 'assets/images/templates/trend_3.jpeg', likes: '2.3k', shares: '1.2k' },
    { url: 'assets/images/templates/trend_4.jpeg', likes: '1.1k', shares: '407' },
    { url: 'assets/images/templates/trend_5.jpeg', likes: '4.3k', shares: '1.7k' },
    { url: 'assets/images/templates/trend_6.jpeg', likes: '6.8k', shares: '2.1k' },
    { url: 'assets/images/templates/trend_7.jpeg', likes: '217', shares: '57' },
    { url: 'assets/images/templates/trend_8.jpeg', likes: '4.6k', shares: '812' },
    { url: 'assets/images/templates/trend_9.jpeg', likes: '782', shares: '86' },
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

  // Manual Editing Signals
  selectedTemplate = signal<string | null>(null);
  isManualEditMode = signal<boolean>(false);
  manualText = signal<string>('Add a caption');

  // Select a template for manual editing
  selectTemplate(url: string) {
    this.selectedTemplate.set(url);
    this.generatedMemes.set([]); // Clear generated memes to avoid confusion
    this.isManualEditMode.set(false); // Reset edit mode initially
  }

  // Toggle Edit Mode
  toggleEditMode() {
    this.isManualEditMode.update(v => !v);
  }

  // Update Manual Text
  updateManualText(event: Event) {
    const input = event.target as HTMLTextAreaElement;
    this.manualText.set(input.value);
  }

  // Download Meme
  async downloadMeme() {
    // Dynamic import
    const html2canvas = (await import('html2canvas')).default;

    // Select the card element
    const element = document.querySelector('.meme-card') as HTMLElement;
    if (element) {
      try {
        // Capture the card, excluding the download button from the image
        const canvas = await html2canvas(element, {
          useCORS: true,
          scale: 2,
          ignoreElements: (element) =>
            element.classList.contains('download-btn') ||
            element.classList.contains('text-handle') ||
            element.classList.contains('edit-toggle-btn')
        });

        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error('Blob creation failed');

        // Try File System Access API (Save As Dialog)
        if ('showSaveFilePicker' in window) {
          try {
            const handle = await (window as any).showSaveFilePicker({
              suggestedName: `memepatra-${Date.now()}.png`,
              types: [{
                description: 'PNG Image',
                accept: { 'image/png': ['.png'] },
              }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return; // Success
          } catch (err: any) {
            // If aborted or failed, do nothing or log
            if (err.name !== 'AbortError') console.error('File Picker failed:', err);
            return;
          }
        }

        // Fallback for browsers without File System Access API
        const link = document.createElement('a');
        link.download = `memepatra-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

      } catch (err) {
        console.error('Download failed:', err);
      }
    }
  }

  // Generation
  onGenerate() {
    this.selectedTemplate.set(null); // Clear manual template
    this.isLoading.set(true);
    const formData = new FormData();
    const currentFile = this.file();

    if (currentFile) {
      formData.append('file', currentFile);
    }

    formData.append('instructions', this.instructions());

    // 1. Parse Context
    this.http.post<{ success: boolean, parsedText: string }>('http://localhost:3000/api/parse-context', formData)
      .subscribe({
        next: (parseResponse) => {
          console.log('Parsed Context Response:', parseResponse);

          if (parseResponse && parseResponse.success) {
            const parsedContext = parseResponse.parsedText;

            // 2. Generate Memes
            // Input: parsedNewsText, userVibe, contextLanguage
            const generatePayload = {
              parsedNewsText: parsedContext,
              userVibe: this.instructions(),
              contextLanguage: this.contextLanguage()
            };

            this.http.post<{ success: boolean, memes: any[] }>('http://localhost:3000/api/generate-memes', generatePayload)
              .subscribe({
                next: (genResponse) => {
                  console.log('Generated Memes:', genResponse);
                  if (genResponse.success && genResponse.memes) {
                    this.generatedMemes.set(genResponse.memes);
                    this.currentMemeIndex.set(0);
                    // Auto-refresh templates to show newly generated history
                    this.loadTemplates();
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
