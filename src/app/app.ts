import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Tema } from './tema';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
})
export class App {
  protected tema = inject(Tema);
  protected menu = [
    { ruta: '/ofertas', icono: 'work', texto: 'Ofertas' },
    { ruta: '/resumen', icono: 'monitoring', texto: 'Resumen' },
  ];
}
