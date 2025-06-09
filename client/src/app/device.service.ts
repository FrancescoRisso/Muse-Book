import { Injectable, signal } from '@angular/core';
import { Device } from '../types';

@Injectable({
	providedIn: 'root',
})
export class DeviceService {
	public device = signal<Device>('pc');

	constructor() {
		this.updateDeviceType();
		window.addEventListener('resize', (_) => this.updateDeviceType());
	}

	private updateDeviceType() {
		const width = window.innerWidth;

		if (width < 420) this.device.set('mobile');
		else if (width < 1024) this.device.set('tablet');
		else this.device.set('pc');
	}
}
