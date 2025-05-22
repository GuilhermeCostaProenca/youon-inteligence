import axios from 'axios';

export interface Coordenada {
  latitude: number;
  longitude: number;
}

export async function geolocalizarEndereco(endereco: string, apiKey: string): Promise<Coordenada | null> {
  try {
    const encoded = encodeURIComponent(endereco);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`;
    const response = await axios.get(url);
    const location = response.data.results[0]?.geometry?.location;

    if (location) {
      return {
        latitude: location.lat,
        longitude: location.lng
      };
    }

    return null;
  } catch (error) {
    console.warn(`❌ Erro ao geolocalizar "${endereco}":`, error);
    return null;
  }
}
