(function (global) {
  'use strict';

  function renderLyricsWithChords(lyrics) {
    if (!lyrics) return '';

    return lyrics.split('\n').map(line => {
      const isEmpty = line.trim() === '';
      if (isEmpty) {
        return '<div class="lyrics-line lyrics-line--empty">&nbsp;</div>';
      }

      const hasChords = /\[([^\]]+)\]/.test(line);
      const lineClasses = ['lyrics-line'];
      if (hasChords) lineClasses.push('lyrics-line--with-chords');

      if (!hasChords) {
        return `<div class="${lineClasses.join(' ')}">${line}</div>`;
      }

      const tokens = [];
      let lastIndex = 0;
      let match;
      const chordRegex = /\[([^\]]+)\]/g;

      while ((match = chordRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          tokens.push({ type: 'text', value: line.slice(lastIndex, match.index) });
        }
        tokens.push({ type: 'chord', value: match[1] });
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < line.length) {
        tokens.push({ type: 'text', value: line.slice(lastIndex) });
      }

      let html = `<div class="${lineClasses.join(' ')}">`;
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].type === 'chord') {
          const chord = tokens[i].value;
          let text = '';
          if (i + 1 < tokens.length && tokens[i + 1].type === 'text') {
            text = tokens[i + 1].value;
            i++;
          }
          html += `<span class="lyric-word"><span class="chord-above">${chord}</span>${text}</span>`;
        } else {
          html += `<span class="lyric-word">${tokens[i].value}</span>`;
        }
      }
      html += '</div>';
      return html;
    }).join('');
  }

  global.TildaComponents = global.TildaComponents || {};
  global.TildaComponents.renderLyricsWithChords = renderLyricsWithChords;

})(typeof window !== 'undefined' ? window : global);