document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const seriesId = urlParams.get('id');
    const seriesSlug = urlParams.get('online');
    const seasonNumber = urlParams.get('season');
    const episodeNumber = urlParams.get('episode');

    console.log('Parâmetros da URL:', { seriesId, seriesSlug, seasonNumber, episodeNumber }); // Log de depuração

    // 1. Atualiza os metadados básicos antes de carregar os scripts
    updateBasicMetaTags(seriesId, seriesSlug, seasonNumber, episodeNumber);

    // 2. Carrega os scripts de forma assíncrona
    const scriptUrls = [];
    for (let i = 1; i <= 126; i++) {
        scriptUrls.push(`https://cdn.jsdelivr.net/gh/telavip/tvshow@main/serie${i}.js`);
    }

    loadScripts(scriptUrls, () => {
        window.seriesData = {};
        for (let i = 1; i <= 126; i++) {
            const seriesKey = `series${i}Data`;
            if (window[seriesKey]) {
                window.seriesData = { ...window.seriesData, ...window[seriesKey] };
                delete window[seriesKey];
            }
        }

        console.log('Dados das séries carregados:', window.seriesData); // Log de depuração

        if (seriesSlug && window.seriesData) {
            const foundSeries = Object.values(window.seriesData).find(series => series.slug === seriesSlug);
            if (foundSeries) {
                fetchSeriesData(foundSeries.id, seasonNumber, episodeNumber);
            } else {
                console.error('❌ Série não encontrada pelo slug.');
            }
        }
        else if (seriesId && window.seriesData && window.seriesData[seriesId]) {
            fetchSeriesData(seriesId, seasonNumber, episodeNumber);
        } else {
            console.error('❌ ID ou slug da série não fornecido.');
        }
    });
});

// Função para atualizar os metadados básicos antes de carregar os scripts
function updateBasicMetaTags(seriesId, seriesSlug, seasonNumber, episodeNumber) {
    const title = seriesSlug ? `Assistir ${seriesSlug} - TelaVip` : 'TelaVip - Séries Online';
    const description = seriesSlug ? `Assista ${seriesSlug} online. Temporadas completas, episódios grátis e muito mais.` : 'Assista séries online gratuitamente no TelaVip.';

    document.title = title;
    document.querySelector('meta[name="description"]').content = description;
    document.querySelector('meta[name="keywords"]').content = seriesSlug ? `${seriesSlug}, assistir séries online, TelaVip` : 'assistir séries online, TelaVip';
    document.querySelector('meta[property="og:title"]').content = title;
    document.querySelector('meta[property="og:description"]').content = description;
    document.querySelector('meta[property="og:url"]').content = window.location.href;
}

// Função para carregar scripts de forma assíncrona
function loadScripts(urls, callback) {
    let loadedScripts = 0;
    urls.forEach(url => {
        const script = document.createElement("script");
        script.src = url;
        script.async = true; // Carrega os scripts de forma assíncrona
        script.onload = () => {
            loadedScripts++;
            if (loadedScripts === urls.length) {
                callback();
            }
        };
        script.onerror = () => console.error(`❌ Erro ao carregar: ${url}`);
        document.body.appendChild(script);
    });
}

// Função para buscar e exibir os dados da série
function fetchSeriesData(seriesId, seasonNumber = null, episodeNumber = null) {
    const data = window.seriesData[seriesId];

    if (!data) {
        console.error('❌ Série não encontrada.');
        return;
    }

    console.log('Dados da série carregados:', data); // Log de depuração

    updateMetaTags(data);

    // Atualiza o título da página com base nos parâmetros
    updatePageTitle(data, seasonNumber, episodeNumber);

    // Atualiza o título da série no h2 com id "movie-title"
    const movieTitle = document.getElementById('movie-title');
    if (movieTitle) {
        movieTitle.textContent = data.name; // Atualiza o título da série
    }

    // Atualiza o nome da série no span com id "series-name"
    const seriesNameSpan = document.getElementById('series-name');
    if (seriesNameSpan) {
        seriesNameSpan.textContent = data.name;
    }

    // Atualiza o conteúdo da div com a classe Kwatch-text com base nos parâmetros
    const watchButtonText = document.querySelector('.Kwatch-text');
    if (watchButtonText) {
        let content = '';

        if (episodeNumber && seasonNumber) {
            // Com o episódio
            const seasonData = data.seasons[seasonNumber];
            if (seasonData) {
                const episodeData = seasonData.episodes[episodeNumber];
                if (episodeData) {
                    // Verifica se o nome do episódio é um nome real ou apenas um número
                    const episodeName = episodeData.name;
                    const isRealName = !/^(episódio|ep\.|capítulo|cap\.)\s*\d+/i.test(episodeName);

                    if (isRealName) {
                        // Nome real: Ep. 1: A Florida - Temporada 1 - Amor Pra Sempre
                        content = `Ep. ${episodeNumber}: ${episodeName} - ${seasonData.name || `Temporada ${seasonNumber}`} - ${data.name}`;
                    } else {
                        // Nome numérico: Episódio 1 - Temporada 1 - Amor Pra Sempre
                        content = `${episodeName} - ${seasonData.name || `Temporada ${seasonNumber}`} - ${data.name}`;
                    }
                } else {
                    // Episódio sem nome
                    content = `Episódio ${episodeNumber} - ${seasonData.name || `Temporada ${seasonNumber}`} - ${data.name}`;
                }
            } else {
                // Temporada ou episódio não encontrado
                content = `Episódio ${episodeNumber} - Temporada ${seasonNumber} - ${data.name}`;
            }
        } else if (seasonNumber) {
            // Com a temporada: Nome da Temporada - NomeSérie - Lista de Episódios
            const seasonData = data.seasons[seasonNumber];
            content = `${seasonData?.name || `Temporada ${seasonNumber}`} - ${data.name} - Lista de Episódios`;
        } else {
            // Somente a série: NomeSérie - Lista de Episódios
            content = `${data.name} - Lista de Episódios`;
        }

        watchButtonText.textContent = content;
    }

    // Restante das atualizações (gêneros, sinopse, etc.)
    const genreMap = {
        "Anima��o": 16,
        "Action & Adventure": 10759,
        "Drama": 18,
        "Mistério": 9648,
        "Sci-Fi & Fantasy": 10765,
        "Ação": 28,
        "Aventura": 12,
        "Comédia": 35,
        "Crime": 80,
        "Documentário": 99,
        "Família": 10751,
        "Fantasia": 14,
        "Ficção Científica": 878,
        "História": 36,
        "Terror": 27,
        "Música": 10402,
        "Romance": 10749,
        "Reality": 10764,
        "Thriller": 53,
        "Guerra": 10752,
        "Faroeste": 37
    };

    const genresElement = document.getElementById('movie-genres');
    if (data.genres && Array.isArray(data.genres)) {
        genresElement.innerHTML = data.genres.map(genre => {
            const genreId = genreMap[genre];
            if (genreId) {
                return `<a href="/p/series.html?genre=${genreId}" style="color: inherit; text-decoration: none;" onmouseover="this.style.color='darkred'" onmouseout="this.style.color='inherit'">${genre}</a>`;
            } else {
                return genre; // Exibe o gênero sem link se o ID não for encontrado
            }
        }).join(', ');
    } else {
        genresElement.innerText = 'Gêneros não disponíveis';
    }

    document.getElementById('movie-synopsis').innerText = data.overview;
    document.getElementById('movie-date').innerText = data.first_air_date;
    document.getElementById('movie-duration').innerText = data.episode_run_time + " min";
    document.getElementById('movie-rating').innerText = data.vote_average.toFixed(1);
    document.getElementById('movie-seasons').innerText = data.number_of_seasons;
    document.getElementById('movie-episodes').innerText = data.number_of_episodes;
    document.getElementById('movie-director').textContent = data.created_by.join(', ') || 'Não disponível';
    document.getElementById('movie-company').innerText = data.production_companies[0] || "Desconhecido";
    document.getElementById('movie-cast').innerText = data.cast.slice(0, 5).join(', ');
    document.getElementById('movie-background').style.backgroundImage = `url(${data.backdrop_path})`;
    document.getElementById('movie-poster').src = data.poster_path;

    const movieClassific = document.getElementById('movie-classific');
    if (data.certification) {
        movieClassific.innerText = data.certification;
    } else {
        movieClassific.innerText = 'Classificação não disponível';
    }

    const playerIframe = document.getElementById('player-iframe');
    playerIframe.style.background = `url(${data.backdrop_path}) center/cover no-repeat`;
    playerIframe.src = '';

    const trailerIframe = document.getElementById('LKtrailer');
    if (data.trailer) {
        trailerIframe.src = `https://www.youtube.com/embed/${data.trailer}`;
    } else {
        trailerIframe.src = ''; // Limpa o iframe se não houver trailer
    }

    fetchSeasons(seriesId, seasonNumber, episodeNumber);

    if (episodeNumber) {
        openEpisode(seriesId, seasonNumber, episodeNumber);
    }
}

// Função para atualizar os metadados da página
function updateMetaTags(data) {
    document.querySelector('meta[name="description"]').content = `Assista ${data.name} online. Temporadas completas, episódios grátis e muito mais.`;
    document.querySelector('meta[name="keywords"]').content = `${data.name}, ${data.genres.join(', ')}, assistir séries online, TelaVip`;
    document.querySelector('meta[property="og:title"]').content = `${data.name} - TelaVip`;
    document.querySelector('meta[property="og:description"]').content = `Assista ${data.name} online. Temporadas completas, episódios grátis e muito mais.`;
    document.querySelector('meta[property="og:image"]').content = data.poster_path;
    document.querySelector('meta[property="og:url"]').content = window.location.href;
    document.querySelector('meta[name="twitter:title"]').content = `${data.name} - TelaVip`;
    document.querySelector('meta[name="twitter:description"]').content = `Assista ${data.name} online. Temporadas completas, episódios grátis e muito mais.`;
    document.querySelector('meta[name="twitter:image"]').content = data.poster_path;
}

// Função para atualizar o título da página
function updatePageTitle(seriesData, seasonNumber = null, episodeNumber = null) {
    let title = `${seriesData.name} - TelaVip`; // Título padrão

    if (episodeNumber && seasonNumber) {
        // Se há um episódio selecionado, exibe o nome do episódio
        const seasonData = seriesData.seasons[seasonNumber];
        if (seasonData) {
            const episodeData = seasonData.episodes[episodeNumber];
            if (episodeData) {
                // Verifica se o nome do episódio é um nome real ou apenas um número
                const episodeName = episodeData.name;
                const isRealName = !/^(episódio|ep\.|capítulo|cap\.)\s*\d+/i.test(episodeName);

                if (isRealName) {
                    // Nome real: Ep. 1: A Florida - Temporada 1 - Amor Pra Sempre
                    title = `Ep. ${episodeNumber}: ${episodeName} - ${seasonData.name || `Temporada ${seasonNumber}`} - ${seriesData.name} - TelaVip`;
                } else {
                    // Nome numérico: Episódio 1 - Temporada 1 - Amor Pra Sempre
                    title = `${episodeName} - ${seasonData.name || `Temporada ${seasonNumber}`} - ${seriesData.name} - TelaVip`;
                }
            } else {
                // Episódio sem nome
                title = `Episódio ${episodeNumber} - ${seasonData.name || `Temporada ${seasonNumber}`} - ${seriesData.name} - TelaVip`;
            }
        } else {
            // Temporada ou episódio não encontrado
            title = `Episódio ${episodeNumber} - Temporada ${seasonNumber} - ${seriesData.name} - TelaVip`;
        }
    } else if (seasonNumber) {
        // Se há apenas temporada, exibe o nome da temporada e da série
        const seasonData = seriesData.seasons[seasonNumber];
        title = `${seasonData?.name || `Temporada ${seasonNumber}`} - ${seriesData.name} - TelaVip`;
    }

    document.title = title;
}

// Função para buscar e exibir as temporadas
function fetchSeasons(seriesId, selectedSeason = null, selectedEpisode = null) {
    const data = window.seriesData[seriesId];

    const seasonList = document.getElementById('season-list');
    seasonList.innerHTML = '';

    Object.keys(data.seasons).forEach(seasonNum => {
        const season = data.seasons[seasonNum];

        const seasonDiv = document.createElement('div');
        seasonDiv.className = 'season-container';

        const seasonButton = document.createElement('button');
        seasonButton.className = 'season-button';

        const seasonPoster = season.poster_path ? season.poster_path : 'https://placehold.co/150/000000/FFF?text=Imagem+N%C3%A3o+Dispon%C3%ADvel';

        seasonButton.innerHTML = `<img src="${seasonPoster}" alt="Thumb"> ${season.name || `Temporada ${seasonNum}`}`;
        seasonButton.onclick = () => {
            toggleEpisodes(seriesId, seasonNum);
            openSeason(seriesId, seasonNum); // Exibe as informações da temporada
            highlightSeasonButton(seasonButton); // Destaca o botão da temporada
        };

        const episodeList = document.createElement('div');
        episodeList.className = 'episode-list';
        episodeList.id = `episodes-${seasonNum}`;
        episodeList.style.display = 'none';

        seasonDiv.appendChild(seasonButton);
        seasonDiv.appendChild(episodeList);
        seasonList.appendChild(seasonDiv);

        if (selectedSeason == seasonNum) {
            toggleEpisodes(seriesId, seasonNum, selectedEpisode);
            openSeason(seriesId, seasonNum); // Exibe as informações da temporada selecionada
            highlightSeasonButton(seasonButton); // Destaca o botão da temporada selecionada
            // Rola o botão da temporada para a visibilidade
            setTimeout(() => seasonButton.scrollIntoView({ behavior: "smooth", block: "center" }), 500);
        }
    });

    if (selectedSeason && !selectedEpisode) {
        openSeason(seriesId, selectedSeason);
    }
}

// Função para alternar a exibição dos episódios
function toggleEpisodes(seriesId, seasonNumber, selectedEpisode = null) {
    const data = window.seriesData[seriesId];
    const episodeList = document.getElementById(`episodes-${seasonNumber}`);
    const seasonButton = episodeList.previousElementSibling;

    if (!episodeList) return;

    if (episodeList.innerHTML === '') {
        Object.keys(data.seasons[seasonNumber].episodes).forEach(epNum => {
            const episode = data.seasons[seasonNumber].episodes[epNum];

            const episodeButton = document.createElement('button');
            episodeButton.className = 'episode-button';

            const episodeThumbnail = episode.still_path ? episode.still_path : 'https://placehold.co/150/000000/FFF?text=Imagem+N%C3%A3o+Dispon%C3%ADvel';

            const equalizerIcon = selectedEpisode && epNum == selectedEpisode ? `
                <div class="equalizer-container">
                    <div class="equalizer">
                        <div class="bar"></div>
                        <div class="bar"></div>
                        <div class="bar"></div>
                        <div class="bar"></div>
                        <div class="bar"></div>
                    </div>
                </div>
            ` : '';

            episodeButton.innerHTML = `
                <div class="episode-thumbnail">
                    <img src="${episodeThumbnail}" alt="Thumb">
                    ${equalizerIcon}
                </div>
                Ep. ${epNum}: ${episode.name}
            `;
            episodeButton.setAttribute('data-season', seasonNumber); // Adiciona atributo data-season
            episodeButton.setAttribute('data-episode', epNum); // Adiciona atributo data-episode
            episodeButton.onclick = () => {
                openEpisode(seriesId, seasonNumber, epNum);
                updateEqualizer(episodeButton); // Atualiza o ícone de equalizador
            };

            if (selectedEpisode && epNum == selectedEpisode) {
                episodeButton.classList.add('active');
                setTimeout(() => episodeButton.scrollIntoView({ behavior: "smooth", block: "center" }), 500);
                openEpisode(seriesId, seasonNumber, epNum); // Abre o episódio automaticamente
            }

            episodeList.appendChild(episodeButton);
        });
    }

    episodeList.style.display = episodeList.style.display === 'block' ? 'none' : 'block';
    seasonButton.classList.toggle('expanded');
}

// Função para destacar o botão da temporada selecionada
function highlightSeasonButton(seasonButton) {
    document.querySelectorAll('.season-button').forEach(btn => btn.classList.remove('active-season'));

    seasonButton.classList.add('active-season');
}

// Função para abrir as informações da temporada
function openSeason(seriesId, season) {
    const videoPlayer = document.getElementById('video-player');
    const playerIframe = document.getElementById('player-iframe');
    const data = window.seriesData[seriesId];
    const seasonData = data.seasons[season];

    playerIframe.src = ''; // Limpa o iframe
    playerIframe.style.background = `url(${seasonData.poster_path}) center/cover no-repeat`;

    const existingInfoBox = document.querySelector('.episode-info-box');
    if (existingInfoBox) {
        existingInfoBox.remove();
    }

    const infoBox = document.createElement('div');
    infoBox.className = 'episode-info-box';
    infoBox.innerHTML = `
        <div class="info-top">
            <span class="info-item"><i class="fas fa-list"></i> ${season}ª Temporada</span>
            <span class="info-item"><i class="fas fa-calendar"></i> ${seasonData.air_date}</span>
            <span class="info-item"><i class="fas fa-list-ol"></i> ${seasonData.episode_count} Episódios</span>
            <span class="info-item"><i class="fas fa-star"></i> ${seasonData.vote_average ? seasonData.vote_average.toFixed(1) : 'N/A'}</span>
        </div>
        <div class="info-synopsis">${seasonData.overview}</div>
        <center><div class="Kwatch-button" style="width:100%;max-width:350px;border-radius: 30px;">
            <a onclick="playEpisode('${seriesId}', '${season}', '1', '${seasonData.poster_path}')" target="_self">
                <div class="Kplay-icon"><i class="fas fa-play"></i></div>
                <div class="Kwatch-text">ASSISTIR PRIMEIRO EPISÓDIO</div>
            </a>
        </div></center>
    `;

    videoPlayer.appendChild(infoBox);
}

// Função para abrir as informações do episódio
function openEpisode(seriesId, season, episode) {
    const videoPlayer = document.getElementById('video-player');
    const playerIframe = document.getElementById('player-iframe');
    const data = window.seriesData[seriesId];
    const episodeData = data.seasons[season].episodes[episode];

    playerIframe.src = ''; // Limpa o iframe
    playerIframe.style.background = `url(${episodeData.still_path}) center/cover no-repeat`;

    const existingInfoBox = document.querySelector('.episode-info-box');
    if (existingInfoBox) {
        existingInfoBox.remove();
    }

    const infoBox = document.createElement('div');
    infoBox.className = 'episode-info-box';
    infoBox.innerHTML = `
        <div class="info-top">
            <span class="info-item"><i class="fas fa-list"></i> T${season.padStart(2, '0')}E${episode.padStart(2, '0')}</span>
            <span class="info-item"><i class="fas fa-calendar"></i> ${episodeData.air_date}</span>
            <span class="info-item"><i class="fas fa-clock"></i> ${episodeData.runtime} min</span>
            <span class="info-item"><i class="fas fa-star"></i> ${episodeData.vote_average ? episodeData.vote_average.toFixed(1) : 'N/A'}</span>
        </div>
        <div class="info-synopsis">${episodeData.overview}</div>
        <center><div class="Kwatch-button" style="width:100%;max-width:145px;border-radius: 30px;">
            <a onclick="playEpisode('${seriesId}', '${season}', '${episode}', '${episodeData.still_path}')" target="_self">
                <div class="Kplay-icon"><i class="fas fa-play"></i></div>
                <div class="Kwatch-text">PLAY</div>
            </a>
        </div></center>
    `;

    videoPlayer.appendChild(infoBox);

    document.querySelectorAll('.episode-button').forEach(btn => btn.classList.remove('active'));
    const selectedButton = document.querySelector(`.episode-button[data-season="${season}"][data-episode="${episode}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
}

// Função para reproduzir o episódio
function playEpisode(seriesId, season, episode, backdropPath) {
    const playerIframe = document.getElementById('player-iframe');

    const infoBox = document.querySelector('.episode-info-box');
    if (infoBox) {
        infoBox.remove();
    }
    playerIframe.style.background = 'none'; // Remove a imagem de fundo
    playerIframe.src = `/p/serieplay.html?id=${seriesId}/${season}/${episode}&id1=${seriesId}&id2=${season}&id3=${episode}&i=${backdropPath}`; // Carrega o vídeo
}

// Função para atualizar o ícone de equalizador
function updateEqualizer(selectedButton) {
    document.querySelectorAll('.equalizer-container').forEach(icon => icon.remove());

    const equalizerIcon = `
        <div class="equalizer-container">
            <div class="equalizer">
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
            </div>
        </div>
    `;
    selectedButton.querySelector('.episode-thumbnail').insertAdjacentHTML('beforeend', equalizerIcon);
}

// Estilos CSS para a página
const styles = `
    <style>
        #video-player {
            position: relative;
            width: 100%;
            height: 500px;
            overflow: hidden;
            background-color: #000;
        }
        #player-iframe {
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
        }
        .episode-info-box {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 70%;
            max-width: 600px;
            background: #000c;
            padding: 20px;
            border-radius: 10px;
            color: #fff;
            text-align: center;
            z-index: 10;
        }
        .info-top {
            display: flex;
            justify-content: space-around;
            margin-bottom: 15px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            justify-content: center;
        }
        @media (max-width: 600px) {
            .info-top {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        @media (max-width: 400px) {
            .info-top {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        .info-synopsis {
            font-size: 14px;
            margin-bottom: 20px;
            max-height: 80px;
            overflow-y: auto;
            padding-right: 5px;
        }
        .watch-now-button {
            background: #e50914;
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 0 auto;
        }
        .watch-now-button:hover {
            background: #f40612;
        }
        .icon-calendario::before {
            content: "📅";
        }
        .icon-relogio::before {
            content: "⏱️";
        }
        .icon-lista::before {
            content: "📋";
        }
        .icon-play::before {
            content: "▶️";
        }
        .season-button.active-season {
            background-color: #000;
            color: #fff;
        }
    </style>
`;

// Adiciona os estilos ao head do documento
document.head.insertAdjacentHTML('beforeend', styles);
