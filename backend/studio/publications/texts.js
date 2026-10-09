// Ready-to-paste texts of a channel variant: the same strings go to the clipboard and to the ZIP. Isomorphic.
export const AI_NOTE = 'Ilustracja tła wygenerowana przy użyciu AI.';
export const folders = { instagram_feed: 'instagram', instagram_story: 'relacja', facebook: 'facebook', website: 'strona' };

export function channelTexts(item, graphic) {
  const c = item.copy;
  const ai = graphic?.aiAssets ? `\n\n${AI_NOTE}` : '';
  if (item.channel === 'instagram_feed')
    return {
      'opis.txt': `${c.caption}${c.hashtags.length ? `\n\n${c.hashtags.join(' ')}` : ''}${ai}`,
      'pierwszy-komentarz.txt': c.firstComment,
      'tekst-alternatywny.txt': c.altText,
    };
  if (item.channel === 'instagram_story')
    return {
      'naklejka.txt': [c.stickerText, c.sticker !== 'none' ? `Naklejka: ${c.sticker}` : '', c.link].filter(Boolean).join('\n'),
      'tekst-alternatywny.txt': c.altText,
    };
  if (item.channel === 'facebook')
    return {
      'post.txt': `${c.text}${c.sponsors ? `\n\n${c.sponsors}` : ''}${c.link ? `\n\n${c.link}` : ''}${c.hashtags.length ? `\n\n${c.hashtags.join(' ')}` : ''}${ai}`,
      'tekst-alternatywny.txt': c.altText,
    };
  return {
    'artykul.md': `---\ntitle: ${JSON.stringify(c.title)}\nexcerpt: ${JSON.stringify(c.excerpt)}\ntags: ${JSON.stringify(c.tags)}\ncoverAlt: ${JSON.stringify(c.coverAlt)}\n---\n\n${c.content}${graphic?.aiAssets ? `\n\n_${AI_NOTE}_` : ''}\n`,
  };
}

// The main text the owner pastes into the app (post body, story sticker or article body).
export function mainText(item, graphic) {
  const texts = channelTexts(item, graphic);
  return texts['opis.txt'] ?? texts['post.txt'] ?? texts['naklejka.txt'] ?? item.copy.content ?? '';
}
