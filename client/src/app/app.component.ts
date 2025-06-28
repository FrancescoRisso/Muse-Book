import { Component, inject } from '@angular/core';
// import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { DeviceService } from './device.service';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-root',
	imports: [NavbarComponent, CommonModule],
	// imports: [RouterOutlet, NavbarComponent, CommonModule],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss',
})
export class AppComponent {
	title = 'client';
	device = inject(DeviceService).device;
}
