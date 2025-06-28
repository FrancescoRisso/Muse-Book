import { Component, inject, input } from '@angular/core';
import { NavBarIcons } from '../../types';
import { DeviceService } from '../device.service';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-navbar-icon',
	imports: [CommonModule],
	templateUrl: './navbar-icon.component.html',
	styleUrl: './navbar-icon.component.scss',
})
export class NavbarIconComponent {
	iconName = input.required<NavBarIcons>();
	dispName = input.required<string>();
	device = inject(DeviceService).device;
}
