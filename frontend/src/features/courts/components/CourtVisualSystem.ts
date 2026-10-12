import basketCementoImg from '@/assets/create-courts/Basket_Court_Cemento.jpg'
import basketMaderaImg from '@/assets/create-courts/Basket_Court_Madera.jpg'
import futbolCourtImg from '@/assets/create-courts/Futbol_Court.jpg'
import futsalCourtImg from '@/assets/create-courts/Futsal_Court.png'
import tenisCementoImg from '@/assets/create-courts/Tenis_Court_Cemento.jpg'
import tenisPastoImg from '@/assets/create-courts/Tenis_Court_Pasto.jpg'
import tenisPolvoImg from '@/assets/create-courts/Tenis_Court_PolvoLadrillo.jpg'
import voleyCourtImg from '@/assets/create-courts/Voley_Court.jpg'
import padelCourtImg from '@/assets/create-courts/Padel_Court.jpg'

export interface CourtVisualResolution {
  imageUrl: string
  caption: string
}

export function resolveCourtImage(sportName?: string, surfaceType?: string): CourtVisualResolution {
  const sport = (sportName || '').toLowerCase().trim()
  const surface = (surfaceType || '').toLowerCase().trim()

  // 1. BASKET
  if (sport.includes('basket')) {
    if (surface.includes('madera') || surface.includes('parquet')) {
      return {
        imageUrl: basketMaderaImg,
        caption: 'Cancha de Básquetbol sobre Parquet / Madera',
      }
    }
    return {
      imageUrl: basketCementoImg,
      caption: 'Cancha de Básquetbol sobre Cemento / Hormigón',
    }
  }

  // 2. TENIS
  if (sport.includes('tenis')) {
    if (surface.includes('polvo') || surface.includes('ladrillo') || surface.includes('arcilla')) {
      return {
        imageUrl: tenisPolvoImg,
        caption: 'Cancha de Tenis en Polvo de Ladrillo',
      }
    }
    if (surface.includes('pasto') || surface.includes('césped') || surface.includes('cesped') || surface.includes('sintético') || surface.includes('sintetico')) {
      return {
        imageUrl: tenisPastoImg,
        caption: 'Cancha de Tenis sobre Césped',
      }
    }
    return {
      imageUrl: tenisCementoImg,
      caption: 'Cancha de Tenis sobre Cemento / Pista Rápida',
    }
  }

  // 3. FÚTBOL
  if (sport.includes('futbol') || sport.includes('fútbol')) {
    if (surface.includes('madera') || surface.includes('parquet') || surface.includes('cemento') || surface.includes('baldosa')) {
      return {
        imageUrl: futsalCourtImg,
        caption: 'Cancha de Futsal / Fútbol de Salón',
      }
    }
    return {
      imageUrl: futbolCourtImg,
      caption: 'Campo de Fútbol sobre Césped',
    }
  }

  // 4. PÁDEL
  if (sport.includes('padel') || sport.includes('pádel')) {
    return {
      imageUrl: padelCourtImg,
      caption: 'Pista de Pádel con Cerramiento Vidriado',
    }
  }

  // 5. VÓLEY
  if (sport.includes('voley') || sport.includes('vóley') || sport.includes('voleibol')) {
    return {
      imageUrl: voleyCourtImg,
      caption: 'Cancha de Vóley Reglamentaria',
    }
  }

  // 6. HANDBALL
  if (sport.includes('handball') || sport.includes('balonmano')) {
    if (surface.includes('madera') || surface.includes('parquet')) {
      return {
        imageUrl: basketMaderaImg,
        caption: 'Cancha Polideportiva de Handball',
      }
    }
    return {
      imageUrl: futsalCourtImg,
      caption: 'Pista de Handball en Superficie Lisa',
    }
  }

  // Fallback por defecto según superficie o vista general
  if (surface.includes('madera') || surface.includes('parquet')) {
    return {
      imageUrl: basketMaderaImg,
      caption: 'Pista Multideporte sobre Madera',
    }
  }

  return {
    imageUrl: futbolCourtImg,
    caption: 'Instalación Deportiva',
  }
}
