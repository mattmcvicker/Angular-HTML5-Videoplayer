import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TestComponent } from './test/test.component';
import {VideoComponent} from './video/video.component';
const routes: Routes = [
  { path: 'test-component', component: TestComponent },
  { path: 'video-component', component: VideoComponent},
  { path: 'test-component',   redirectTo: '/video-component', pathMatch: 'full' },
  { path: '**', component: TestComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
