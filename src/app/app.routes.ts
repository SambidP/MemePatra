import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { MemeGeneratorComponent } from './meme-generator/meme-generator.component';
import { ProvinceSelectorComponent } from './province-selector/province-selector.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'select-province', component: ProvinceSelectorComponent },
    { path: 'generate', component: MemeGeneratorComponent }
];
