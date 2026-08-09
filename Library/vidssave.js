'use strict';
import axios from 'axios';
const PARSE_URL = 'https://api.vidssave.com/api/contentsite_api/media/parse';
const AUTH = '20250901majwlqo';
const DOMAIN = 'api-ak.vidssave.com';
const HEADERS = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Referer: 'https://id.vidssave.com/',
    Origin: 'https://id.vidssave.com',
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};
async function parse(link, origin) {
    const params = new URLSearchParams({ auth: AUTH, domain: DOMAIN, origin, link });
    const res = await axios.post(PARSE_URL, params.toString(), { headers: HEADERS, timeout: 30000 });
    return res.data;
}
export async function getYoutubeResources(link) {
    let data = await parse(link, 'cache');
    let resources = (data?.data?.resources || []).filter((r) => r.download_url);
    if (!resources.length) {
        data = await parse(link, 'source');
        resources = (data?.data?.resources || []).filter((r) => r.download_url);
    }
    if (!data?.data || !resources.length) {
        throw new Error('vidssave tidak mengembalikan link download yang valid untuk video ini.');
    }
    return {
        id: data.data.id,
        title: data.data.title,
        thumbnail: data.data.thumbnail,
        duration: data.data.duration,
        resources,
    };
}
const AUDIO_QUALITY_PRIORITY = ['128KBPS', '256KBPS', '48KBPS'];
const VIDEO_QUALITY_PRIORITY = ['480P', '360P', '720P', '240P', '144P', '1080P'];
function pickResource(resources, type, qualityPriority, preferFormat) {
    const pool = resources.filter((r) => r.type === type);
    if (!pool.length) return null;
    for (const q of qualityPriority) {
        const match = pool.find((r) => r.quality === q && (!preferFormat || r.format === preferFormat));
        if (match) return match;
    }
    for (const q of qualityPriority) {
        const match = pool.find((r) => r.quality === q);
        if (match) return match;
    }
    return pool[0];
}
export function pickAudio(resources) {
    return pickResource(resources, 'audio', AUDIO_QUALITY_PRIORITY, 'M4A');
}
export function pickVideo(resources, quality) {
    const priority = quality ? [quality, ...VIDEO_QUALITY_PRIORITY] : VIDEO_QUALITY_PRIORITY;
    return pickResource(resources, 'video', priority, 'MP4');
}
export default { getYoutubeResources, pickAudio, pickVideo };
