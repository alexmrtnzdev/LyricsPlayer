export class DeezerAPI {
  static async buscarCanciones(query, limit = 10) {
    const proxy = 'https://api.codetabs.com/v1/proxy?quest=';
    const deezerUrl = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&order=RATING_DESC`;
    const searchUrl = `${proxy}${encodeURIComponent(deezerUrl)}`; 
  
    try {
      const res = await fetch(searchUrl);
      const data = await res.json();
  
      if (!Array.isArray(data.data)) {
        console.error("Respuesta inesperada de Deezer:", data);
        return [];
      }
  
      return data.data.slice(0, limit);
    } catch (error) {
      console.error('Error al buscar canciones:', error);
      return [];
    }
  }

  static async buscarPorArtista(query, limit = 20) {
    const proxy = 'https://api.codetabs.com/v1/proxy?quest=';
    const deezerArtistUrl = `https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}`;
    const artistUrl = `${proxy}${deezerArtistUrl}`; 
    try {
      const res = await fetch(artistUrl);
      const data = await res.json();
      const artista = data.data[0];

      if (!artista) return [];

      const cancionesUrl = `${proxy}${encodeURIComponent(`https://api.deezer.com/artist/${artista.id}/top?limit=${limit}`)}`;      
      const cancionesRes = await fetch(cancionesUrl);
      const cancionesData = await cancionesRes.json();

      return cancionesData.data || [];

    } catch (error) {
      console.error('Error al buscar por artista:', error);
      return [];
    }
  }

  static async obtenerTendencias(limit = 20) {
    const proxy = 'https://api.codetabs.com/v1/proxy?quest=';
    const url = `${proxy}https://api.deezer.com/chart/0/tracks`;
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      return data.data.slice(0, limit);
    } catch (error) {
      console.error('Error al obtener tendencias:', error);
      return [];
    }
  }
}
