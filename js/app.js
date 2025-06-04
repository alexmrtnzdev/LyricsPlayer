import { API } from './api.js';
import { DeezerAPI } from './deezer.js';
import * as UI from './interfaz.js';
import { HuggingFaceAPI } from './hugginface.js';

let debounceTimeout;
let letraActual = "";

async function mostrarCancionesPopulares(canciones) {
  UI.suggestionsContainer.innerHTML = '';
  
  const categoriasHTML = `
    <div class="categorias-inicio">
      <h2 class="titulo-categorias">🔥 Tendencias Musicales</h2>
      <div class="grid-categorias">
        ${canciones.map((cancion, index) => `
          <div class="categoria-card" data-id="${cancion.id}">
            <img src="${cancion.album.cover_medium}" alt="${cancion.title}">
            <div class="info-categoria">
              <h3>${index + 1}. ${cancion.title}</h3>
              <p>${cancion.artist.name}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  UI.suggestionsContainer.innerHTML = categoriasHTML;
  
  document.querySelectorAll('.categoria-card').forEach(card => {
    card.addEventListener('click', async () => {
      const cancionId = card.dataset.id;
      await cargarCancionPorId(cancionId);
    });
  });
}

async function cargarCancionPorId(id) {
  const proxy = 'https://api.codetabs.com/v1/proxy?quest=';
  const url = `${proxy}https://api.deezer.com/track/${id}`;
  
  try {
    const res = await fetch(url);
    const cancion = await res.json();
    mostrarCancionEnReproductor(cancion);
  } catch (error) {
    console.error('Error al cargar canción:', error);
  }
}

function mostrarCancionEnReproductor(cancion) {
  UI.searchInput.value = `${cancion.artist.name} - ${cancion.title}`;
  UI.suggestionsContainer.innerHTML = '';
  UI.generateMeaningBtn.classList.remove('hidden');
  document.getElementById('showLyricsBtn').classList.add('hidden');

  UI.lyricsText.textContent = 'Cargando letra...';
  UI.albumCover.src = '';
  UI.currentTrack.textContent = '';
  UI.currentArtist.textContent = '';
  UI.releaseDate.textContent = '';

  const artistaLimpio = limpiarTexto(cancion.artist.name);
  const tituloLimpio = limpiarTexto(cancion.title_short);

  const api = new API(artistaLimpio, tituloLimpio);
  api.consultarAPI().then(({ respuesta }) => {
    if (respuesta && respuesta.lyrics) {
      letraActual = respuesta.lyrics;
      UI.albumCover.src = cancion.album.cover_big || cancion.album.cover_medium;
      UI.lyricsText.textContent = letraActual;
    } else {
      letraActual = "";
      UI.lyricsText.textContent = 'Letra no disponible';
    }

    UI.currentTrack.textContent = cancion.title;
    UI.currentArtist.textContent = cancion.artist.name;
    UI.releaseDate.textContent = cancion.release_date
      ? `Publicado el ${cancion.release_date}`
      : 'Fecha de lanzamiento no disponible';

    UI.playerSection.classList.remove('hidden');
    UI.playerSection.scrollIntoView({ behavior: 'smooth' });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const cancionesPopulares = await DeezerAPI.obtenerTendencias(12);
  mostrarCancionesPopulares(cancionesPopulares);

  if (!UI.searchInput) {
    console.error('Elemento searchInput no encontrado');
    return;
  }

  UI.generateMeaningBtn.onclick = async () => {
    if (!letraActual || letraActual.length < 10) {
      UI.lyricsText.textContent = 'No hay letra disponible para analizar';
      return;
    }

    try {
      UI.lyricsText.textContent = 'Analizando letra...';
      const significado = await HuggingFaceAPI.generarSignificado(letraActual);
      UI.lyricsText.textContent = significado;

      UI.generateMeaningBtn.classList.add('hidden');
      document.getElementById('showLyricsBtn').classList.remove('hidden');
    } catch (error) {
      UI.lyricsText.textContent = 'Error generando significado';
    }
  };

  document.getElementById('showLyricsBtn').onclick = () => {
    UI.lyricsText.textContent = letraActual;
    document.getElementById('showLyricsBtn').classList.add('hidden');
    UI.generateMeaningBtn.classList.remove('hidden');
  };

  UI.searchInput.addEventListener('input', () => {
    const query = UI.searchInput.value.trim();

    clearTimeout(debounceTimeout);
    if (query.length < 2) {
      UI.suggestionsContainer.innerHTML = '';
      UI.playerSection.classList.add('hidden');
      return;
    }

    debounceTimeout = setTimeout(async () => {
      const canciones = await DeezerAPI.buscarCanciones(query, 5);
      mostrarResultados(canciones);
    }, 300);
  });

  UI.searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = UI.searchInput.value.trim();
    if (query.length < 2) return;

    const [resultadosArtista, resultadosCanciones] = await Promise.all([
      DeezerAPI.buscarPorArtista(query, 10),
      DeezerAPI.buscarCanciones(query, 10)
    ]);

    const resultadosCombinados = [...resultadosArtista, ...resultadosCanciones]
      .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
      .slice(0, 20);

    mostrarResultados(resultadosCombinados);
  });

  function mostrarResultados(canciones) {
    UI.suggestionsContainer.innerHTML = '';
    UI.playerSection.classList.add('hidden');
    UI.suggestionsContainer.classList.remove('hidden');

    canciones.forEach(cancion => {
      const card = document.createElement('div');
      card.classList.add('song-card');

      card.innerHTML = `
        <img src="${cancion.album.cover_medium}" alt="Carátula de ${cancion.album.title}">
        <div class="info">
          <h3>${cancion.title}</h3>
          <p>${cancion.artist.name}</p>
          <button>Ver Letra</button>
        </div>
      `;

      card.querySelector('button').addEventListener('click', async () => {
        UI.searchInput.value = `${cancion.artist.name} - ${cancion.title}`;
        UI.suggestionsContainer.innerHTML = '';
        UI.generateMeaningBtn.classList.remove('hidden');
        document.getElementById('showLyricsBtn').classList.add('hidden');

        UI.lyricsText.textContent = 'Cargando letra...';
        UI.albumCover.src = '';
        UI.currentTrack.textContent = '';
        UI.currentArtist.textContent = '';
        UI.releaseDate.textContent = '';

        const artistaLimpio = limpiarTexto(cancion.artist.name);
        const tituloLimpio = limpiarTexto(cancion.title);

        const api = new API(artistaLimpio, tituloLimpio);
        const { respuesta } = await api.consultarAPI();

        if (respuesta && respuesta.lyrics) {
          letraActual = respuesta.lyrics;
          UI.albumCover.src = cancion.album.cover_big || cancion.album.cover_medium;
          UI.lyricsText.textContent = letraActual;
        } else {
          letraActual = "";
          UI.lyricsText.textContent = 'Letra no disponible';
        }

        UI.currentTrack.textContent = cancion.title;
        UI.currentArtist.textContent = cancion.artist.name;
        UI.releaseDate.textContent = cancion.release_date
          ? `Publicado el ${cancion.release_date}`
          : 'Fecha de lanzamiento no disponible';

        UI.playerSection.classList.remove('hidden');
        UI.playerSection.scrollIntoView({ behavior: 'smooth' });
      });

      UI.suggestionsContainer.appendChild(card);
    });
  }

  function limpiarTexto(texto) {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\[\]()\-_.!¡¿?'"“”‘’,]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
  document.getElementById('themeToggle').addEventListener('click', () => {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') === 'dark';
    
    body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    
    createThemeParticles(isDark ? '#ffffff' : '#1DB954');
  });
  
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.setAttribute('data-theme', savedTheme);
  
  function createThemeParticles(color) {
    const container = document.createElement('div');
    container.className = 'particles-container';
    
    for(let i = 0; i < 8; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.backgroundColor = color;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      container.appendChild(particle);
    }
    
    document.body.appendChild(container);
    setTimeout(() => container.remove(), 1000);
  }
});
