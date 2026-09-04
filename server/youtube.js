const https = require('https');
const { YoutubeTranscript } = require('youtube-transcript');

function extractVideoId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

async function getYouTubeTranscript(url) {
  try {
    const segments = await YoutubeTranscript.fetchTranscript(url);
    if (segments && segments.length > 0) {
      return segments
        .map(s => s.text)
        .join(' ')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"');
    }
  } catch (err) {
    console.log("Could not auto-fetch YouTube transcript:", err.message);
  }
  return null;
}

async function getYouTubeInfo(url) {
  const videoId = extractVideoId(url);
  if (!videoId) {
    return { valid: false, error: "Invalid YouTube URL" };
  }

  const transcript = await getYouTubeTranscript(url);
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

  return new Promise((resolve) => {
    https.get(oembedUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            resolve({
              valid: true,
              videoId,
              title: parsed.title,
              author: parsed.author_name,
              thumbnailUrl: parsed.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              transcript
            });
          } else {
            resolve({
              valid: true,
              videoId,
              title: "YouTube Audio Clip (" + videoId + ")",
              author: "YouTube",
              thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              transcript
            });
          }
        } catch (e) {
          resolve({
            valid: true,
            videoId,
            title: "YouTube Video",
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            transcript
          });
        }
      });
    }).on('error', () => {
      resolve({
        valid: true,
        videoId,
        title: "YouTube Video",
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        transcript
      });
    });
  });
}

module.exports = {
  extractVideoId,
  getYouTubeInfo,
  getYouTubeTranscript
};
