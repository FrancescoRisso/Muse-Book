import { Component, HostBinding, inject, effect } from '@angular/core';
import { DeviceService } from '../device.service';
import { NavbarIconComponent } from '../navbar-icon/navbar-icon.component';

@Component({
	selector: 'app-navbar',
	imports: [NavbarIconComponent],
	templateUrl: './navbar.component.html',
	styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
	device = inject(DeviceService).device;

	constructor() {
		effect(() => (this.deviceClass = this.device()));
	}

	@HostBinding('class') deviceClass: string = this.device();
}
