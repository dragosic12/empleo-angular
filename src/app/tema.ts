import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Tema {
  readonly oscuro = signal(document.documentElement.classList.contains('dark'));

  alternar(): void {
    const dark = !this.oscuro();
    this.oscuro.set(dark);
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('tema', dark ? 'oscuro' : 'claro'); } catch { /* sin almacenamiento */ }
  }
}
