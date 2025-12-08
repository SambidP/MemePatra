import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { MemeGeneratorComponent } from './meme-generator/meme-generator.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'generate', component: MemeGeneratorComponent }
];
