import { AudioCodec, Container, Mode, VideoCodec } from './enums'

export type UrlSettings = {
    videoId: string | null
    mode: Mode | null
    videoResolution: string | null
    videoCodec: VideoCodec | null
    audioBitrate: string | null
    audioCodec: AudioCodec | null
    container: Container | null
}

const KEYS = {
    videoId: 'v',
    mode: 'mode',
    videoResolution: 'res',
    videoCodec: 'vc',
    audioBitrate: 'abr',
    audioCodec: 'ac',
    container: 'ct',
} as const

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
    return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : null
}

// Read the selection carried by the current url so a duplicated tab or a
// pasted link opens with the same settings.
export function readSettingsFromUrl(): UrlSettings {
    const params = new URLSearchParams(window.location.search)
    return {
        videoId: params.get(KEYS.videoId),
        mode: oneOf(params.get(KEYS.mode), Object.values(Mode)),
        videoResolution: params.get(KEYS.videoResolution),
        videoCodec: oneOf(params.get(KEYS.videoCodec), Object.values(VideoCodec)),
        audioBitrate: params.get(KEYS.audioBitrate),
        audioCodec: oneOf(params.get(KEYS.audioCodec), Object.values(AudioCodec)),
        container: oneOf(params.get(KEYS.container), Object.values(Container)),
    }
}

export type UrlSync = {
    videoId: string | null
    mode: Mode
    videoResolution: string | null
    videoCodec: VideoCodec | null
    audioBitrate: string | null
    audioCodec: AudioCodec | null
    container: Container
}

export function buildQuery(settings: UrlSync): string {
    const params = new URLSearchParams()
    if (settings.videoId) params.set(KEYS.videoId, settings.videoId)
    params.set(KEYS.mode, settings.mode)
    if (settings.videoResolution) params.set(KEYS.videoResolution, settings.videoResolution)
    if (settings.videoCodec) params.set(KEYS.videoCodec, settings.videoCodec)
    if (settings.audioBitrate) params.set(KEYS.audioBitrate, settings.audioBitrate)
    if (settings.audioCodec) params.set(KEYS.audioCodec, settings.audioCodec)
    params.set(KEYS.container, settings.container)
    return params.toString()
}

let lastQuery: string | null = null

export function syncUrl(settings: UrlSync): void {
    const query = buildQuery(settings)
    if (query === lastQuery) return
    lastQuery = query
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname)
}
