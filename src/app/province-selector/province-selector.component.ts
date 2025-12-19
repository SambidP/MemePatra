
import { Component, OnInit, inject, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { WindowsLoaderComponent } from '../shared/windows-loader/windows-loader.component';

@Component({
    selector: 'app-province-selector',
    standalone: true,
    imports: [CommonModule, WindowsLoaderComponent],
    templateUrl: './province-selector.component.html',
    styleUrls: ['./province-selector.component.scss']
})
export class ProvinceSelectorComponent implements OnInit {
    private router = inject(Router);
    private http = inject(HttpClient);
    private sanitizer = inject(DomSanitizer);

    svgContent: SafeHtml | null = null;
    isLoading = true;
    instructionText = 'Select a province to begin meme generation...';
    selectedProvince: string | null = null;
    isGenerating = false;

    ngOnInit(): void {
        this.loadMap();
    }

    private loadMap(): void {
        this.http.get('assets/svg/nepal-province.svg', { responseType: 'text' })
            .subscribe({
                next: (svg) => {
                    this.svgContent = this.sanitizer.bypassSecurityTrustHtml(svg);
                    this.isLoading = false;
                },
                error: (err) => {
                    console.error('Failed to load map SVG', err);
                    this.isLoading = false;
                }
            });
    }

    @HostListener('click', ['$event'])
    onMapClick(event: MouseEvent): void {
        if (this.isGenerating) return;

        const target = event.target as Element;

        // Check if the clicked element is a path inside the SVG
        if (target.tagName.toLowerCase() === 'path') {
            const id = target.id;
            if (id) {
                const cleanedName = id.replace(/^Province/i, '').trim();
                console.log(`Province clicked: ${id} -> ${cleanedName}`);

                if (cleanedName) {
                    // 1. Manage Active Class
                    // Remove active class from all other paths
                    const svg = target.closest('svg');
                    if (svg) {
                        svg.querySelectorAll('path').forEach(p => p.classList.remove('active'));
                    }

                    // Add active class to current target
                    target.classList.add('active');

                    // 2. Update State
                    this.selectedProvince = cleanedName;
                    this.instructionText = `${cleanedName} Selected`;
                }
            }
        }
    }

    onStartGeneration() {
        if (this.selectedProvince) {
            this.isGenerating = true;
            setTimeout(() => {
                this.router.navigate(['/meme-generator', this.selectedProvince]);
            }, 4000);
        }
    }
}
