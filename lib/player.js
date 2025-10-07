// lib/player.js
(function (global) {
  'use strict';

  function getGoogleDriveFileId(url) {
    const match = url.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?.*?[?&]id=))([a-zA-Z0-9_-]{28,})/);
    return match ? match[1] : null;
  }

  function getSourceType(url) {
    if (!url) return 'direct';
    const u = url.toLowerCase();
    if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
    if (u.includes('rutube.ru')) return 'rutube';
    if (u.includes('vkvideo.ru/video')) return 'vk-video-proxy';     // Сторонний, но рабочий плеер
    if (u.includes('vk.com/video')) return 'vk-video-official';      // Официальный VK — embed почти не работает
    if (u.includes('vk.com/audio')) return 'vk-audio';
    if (u.includes('drive.google.com')) return 'google';
    if (u.includes('dropbox.com')) return 'dropbox';
    return 'direct';
  }

  function renderAudio(rawUrl) {
    if (!rawUrl) return '';

    const type = getSourceType(rawUrl);
    let url = rawUrl.trim();

    // YouTube
    if (type === 'youtube') {
      let videoId = '';
      try {
        const u = new URL(url);
        if (u.hostname === 'youtu.be') videoId = u.pathname.slice(1);
        else if (u.hostname.includes('youtube.com')) videoId = u.searchParams.get('v') || '';
      } catch (e) {}
      if (!videoId) return `<p style="color:#d32f2f;">Некорректная ссылка на YouTube</p>`;
      return `
        <div class="audio-player">
          <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=0" 
                  width="100%" height="315" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowfullscreen></iframe>
          <a href="${rawUrl}" target="_blank" class="action-link">Открыть на YouTube</a>
        </div>`;
    }

    // RuTube
    if (type === 'rutube') {
      let videoId = '';
      try {
        const u = new URL(url);
        const match = u.pathname.match(/\/(?:video|play)\/([a-zA-Z0-9_-]{10,})/);
        videoId = match ? match[1] : '';
      } catch (e) {}
      if (!videoId) return `<p style="color:#d32f2f;">Некорректная ссылка на RuTube</p>`;
      return `
        <div class="audio-player">
          <iframe src="https://rutube.ru/play/embed/${videoId}" 
                  width="100%" height="315" allow="autoplay; encrypted-media" allowfullscreen></iframe>
          <a href="${rawUrl}" target="_blank" class="action-link">Открыть на RuTube</a>
        </div>`;
    }

    // VK Video через vkvideo.ru (работает!)
    if (type === 'vk-video-proxy') {
      let ownerId = '', videoId = '';
      try {
        const u = new URL(url);
        const match = u.pathname.match(/\/video(-?\d+)_(\d+)/);
        if (match) {
          ownerId = match[1];
          videoId = match[2];
        }
      } catch (e) {}
      if (!ownerId || !videoId) {
        return `<p style="color:#d32f2f;">Некорректная ссылка на vkvideo.ru</p>`;
      }
      return `
        <div class="audio-player">
          <iframe src="https://vkvideo.ru/video_ext.php?oid=${ownerId}&id=${videoId}&hd=2" 
                  width="100%" height="315" 
                  style="background-color:#000" 
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture" 
                  frameborder="0" allowfullscreen></iframe>
          <a href="${rawUrl}" target="_blank" class="action-link">Открыть на vkvideo.ru</a>
        </div>`;
    }

    // Официальное видео ВКонтакте (vk.com) — embed без hash не работает
    if (type === 'vk-video-official') {
      return `
        <div class="audio-player">
          <p>Видео ВКонтакте доступно только на сайте ВКонтакте.</p>
          <a href="${rawUrl}" target="_blank" class="action-link">Открыть в ВКонтакте</a>
        </div>`;
    }

    // VK Audio
    if (type === 'vk-audio') {
      url = url.startsWith('http') ? url : `https://${url}`;
      return `
        <div class="audio-player">
          <a href="${url}" target="_blank" class="action-link" style="background:#4a76a8;color:white;padding:6px 20px;border-radius:4px;display:inline-block;text-decoration:none;">Открыть в ВК</a>
        </div>`;
    }

    // Google Drive
    if (type === 'google') {
      const id = getGoogleDriveFileId(url);
      if (!id) return `<p style="color:#d32f2f;">Ошибка Google Drive</p>`;
      return `
        <div class="audio-player">
          <iframe src="https://drive.google.com/file/d/${id}/preview" 
                  width="100%" height="100" allow="autoplay"></iframe>
          <a href="https://drive.google.com/file/d/${id}/view" target="_blank" class="action-link">Открыть в Google Drive</a>
        </div>`;
    }

    // Dropbox
    if (type === 'dropbox') {
      try {
        const u = new URL(url);
        u.searchParams.set('dl', '1');
        url = u.toString();
      } catch (e) {}
    }

    // Прямая аудиоссылка
    try {
      new URL(url);
      return `
        <div class="audio-player">
          <audio controls src="${url}"></audio>
          <a href="${url}" download class="action-link">Скачать</a>
        </div>`;
    } catch (e) {
      return `<p style="color:#d32f2f;">Некорректная ссылка</p>`;
    }
  }

  global.TildaComponents = global.TildaComponents || {};
  global.TildaComponents.renderAudio = renderAudio;

})(typeof window !== 'undefined' ? window : global);