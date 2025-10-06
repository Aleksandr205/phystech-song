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
    if (u.includes('vk.com/video')) return 'vk-video';
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
                  height="315" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
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
                  height="315" allow="autoplay; encrypted-media" allowfullscreen></iframe>
          <a href="${rawUrl}" target="_blank" class="action-link">Открыть на RuTube</a>
        </div>`;
    }

    // VK Video
    if (type === 'vk-video') {
      let ownerId = '', videoId = '';
      try {
        const u = new URL(url);
        const match = u.pathname.match(/\/video(-?\d+)_(\d+)/);
        if (match) {
          ownerId = match[1];
          videoId = match[2];
        }
      } catch (e) {}
      if (!ownerId || !videoId) return `<p style="color:#d32f2f;">Некорректная ссылка на видео ВК</p>`;
      return `
        <div class="audio-player">
          <iframe src="https://vk.com/video_ext.php?oid=${ownerId}&id=${videoId}&hd=2" 
                  height="315" allow="autoplay; encrypted-media" frameborder="0"></iframe>
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
                  allow="autoplay" style="height:100px;"></iframe>
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