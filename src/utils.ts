import { AudioCodec, VideoCodec } from './enums'

export function extractVideoId(url: string): string | null {
    const match = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/)
    return match?.[1] ?? null
}

export function videoCodecFamily(codec: string): VideoCodec {
    if (codec.includes('avc1') || codec.includes('h264')) return VideoCodec.H264
    if (codec.includes('vp9')) return VideoCodec.VP9
    if (codec.includes('av01')) return VideoCodec.AV01
    return codec.split('.')[0] as VideoCodec
}

export function audioCodecFamily(codec: string): AudioCodec {
    if (codec.includes('mp4a')) return AudioCodec.AAC
    if (codec.includes('opus')) return AudioCodec.OPUS
    if (codec.includes('vorbis')) return AudioCodec.VORBIS
    if (codec.includes('mp3')) return AudioCodec.MP3
    return codec.split('.')[0] as AudioCodec
}

export function uniqueSorted(values: (string | null)[]): string[] {
    return [...new Set(values.filter((value): value is string => value !== null))].sort((a, b) => {
        const an = parseInt(a)
        const bn = parseInt(b)
        if (!isNaN(an) && !isNaN(bn)) return bn - an
        return a.localeCompare(b)
    })
}
