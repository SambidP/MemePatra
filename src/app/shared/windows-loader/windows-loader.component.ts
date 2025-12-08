import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-windows-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="windows-loader">
      <div class="loader-track">
        <div class="loader-chunk" *ngFor="let i of chunks"></div>
      </div>
    </div>
  `,
  styles: [`
    .windows-loader {
      width: 100%;
      padding: 2px;
    }
    .loader-track {
      height: 20px;
      border-top: 2px solid #808080;
      border-left: 2px solid #808080;
      border-bottom: 2px solid #ffffff;
      border-right: 2px solid #ffffff;
      background: #c0c0c0;
      padding: 2px;
      display: flex;
      gap: 2px;
      overflow: hidden;
      position: relative;
      justify-content: flex-start;
    }
    .loader-chunk {
        width: 12px;
        height: 100%;
        background-color: var(--win-blue, #000080);
        animation: progress 1.5s infinite ease-in-out;
    }

    @keyframes progress {
        0% { transform: translateX(-50px); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateX(300px); opacity: 0; }
    }
  `]
})
export class WindowsLoaderComponent {
  chunks = new Array(5);
}
