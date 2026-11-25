import { Component, inject, input, type OnInit, output, signal } from '@angular/core';
import { FormControl, FormGroup, FormRecord, ReactiveFormsModule } from '@angular/forms';
import { IonButton, IonInput, IonNote, IonSpinner, IonText } from '@ionic/angular';

import type { ActaAbierta, BorradorActa, FotoActa, Ubicacion, ValoresActa } from '../../../core/models';
import { ErrorApp } from '../../../core/models/error-app';
import { CapturaService } from '../../../core/services/captura.service';
import { UMBRAL_NITIDEZ } from '../../../core/services/nitidez';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { enteroNoNegativo, totalesValidator } from '../../../core/validators/acta.validator';

const conteo = (valor: string | number = '') =>
  new FormControl(String(valor), { nonNullable: true, validators: enteroNoNegativo });

/** Registro y corrección de un acta. Exige foto nítida, GPS y totales que cuadren. */
@Component({
  selector: 'app-acta-form',
  templateUrl: 'acta-form.component.html',
  styleUrl: 'acta-form.component.scss',
  imports: [ReactiveFormsModule, IonButton, IonInput, IonNote, IonSpinner, IonText],
})
export class ActaFormComponent implements OnInit {
  private readonly captura = inject(CapturaService);
  private readonly notificacion = inject(NotificacionService);

  readonly datos = input.required<ActaAbierta>();
  readonly enviando = input(false);
  readonly guardar = output<BorradorActa>();
  readonly cambio = output<ValoresActa>();

  protected readonly umbral = UMBRAL_NITIDEZ;
  protected readonly ocupado = signal<'camara' | 'gps' | null>(null);
  protected readonly foto = signal<FotoActa | null>(null);
  protected readonly gps = signal<Ubicacion | null>(null);
  private capturadaEn = '';
  private ultimo = { contenido: '', foto: null as Blob | null, operacionId: '' };

  form = new FormGroup(
    {
      votos: new FormRecord<FormControl<string>>({}),
      blancos: conteo(),
      nulos: conteo(),
      totalSufragantes: conteo(),
    },
    totalesValidator,
  );

  ngOnInit(): void {
    const { candidaturas, acta, valores } = this.datos();
    for (const { id } of candidaturas) this.form.controls.votos.addControl(id, conteo(acta?.votos[id]));
    if (acta) {
      this.form.patchValue({
        blancos: String(acta.blancos),
        nulos: String(acta.nulos),
        totalSufragantes: String(acta.totalSufragantes),
      });
    }
    if (valores) this.form.patchValue(valores);
    this.descartarFoto();
  }

  async tomarFoto(): Promise<void> {
    if (this.ocupado()) return;
    this.ocupado.set('camara');
    let foto: FotoActa;
    try {
      foto = await this.captura.foto();
    } catch (e) {
      if (!(e instanceof ErrorApp && e.codigo === 'CAMARA_CANCELADA')) await this.notificacion.error(e);
      return;
    } finally {
      this.ocupado.set(null);
    }
    this.foto.set(foto);
    if (!foto.aceptable) return;
    this.capturadaEn = new Date().toISOString();
    this.gps.set(null); // la ubicación debe ser la de esta foto
    await this.ubicar();
  }

  async ubicar(): Promise<void> {
    if (this.ocupado()) return;
    this.ocupado.set('gps');
    try {
      this.gps.set(await this.captura.ubicacion());
    } catch (e) {
      await this.notificacion.error(e);
    } finally {
      this.ocupado.set(null);
    }
  }

  /** Vuelve a la foto y ubicación guardadas, si las hay. */
  descartarFoto(): void {
    const { acta } = this.datos();
    this.foto.set(null);
    this.gps.set(acta ? { lat: acta.lat, lng: acta.lng, precisionM: acta.precisionM } : null);
    this.capturadaEn = acta?.capturadaEn ?? '';
  }

  puedeGuardar(): boolean {
    const foto = this.foto();
    const fotoLista = foto ? foto.aceptable : this.datos().acta !== null;
    return this.form.valid && fotoLista && this.gps() !== null && !this.ocupado() && !this.enviando();
  }

  enviar(): void {
    this.form.markAllAsTouched();
    const gps = this.gps();
    if (!this.puedeGuardar() || !gps) return;
    const { mesa, dignidad, acta } = this.datos();
    const v = this.form.getRawValue();
    const foto = this.foto()?.blob ?? null;
    const contenido = {
      jrvId: mesa.id,
      recintoId: mesa.recintoId,
      dignidad,
      votos: Object.fromEntries(Object.entries(v.votos).map(([id, n]) => [id, Number(n)])),
      blancos: Number(v.blancos),
      nulos: Number(v.nulos),
      totalSufragantes: Number(v.totalSufragantes),
      ...gps,
      capturadaEn: this.capturadaEn,
      versionBase: acta?.version ?? 0,
    };
    this.guardar.emit({
      ...contenido,
      foto,
      fotoPath: foto ? null : (acta?.fotoPath ?? null),
      operacionId: this.operacion(JSON.stringify(contenido), foto),
    });
  }

  /** Reintentar lo mismo repite la operación; si algo cambió, es otra. */
  private operacion(contenido: string, foto: Blob | null): string {
    if (contenido !== this.ultimo.contenido || foto !== this.ultimo.foto) {
      this.ultimo = { contenido, foto, operacionId: crypto.randomUUID() };
    }
    return this.ultimo.operacionId;
  }
}
