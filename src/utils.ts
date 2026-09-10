import type { StreamInfo, VideoInfo } from './api/video'
import { AudioCodec, AUDIO_CONTAINERS, Container, Mode, VIDEO_CONTAINERS, VideoCodec } from './enums'

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

export type DefaultSelection = {
    videoResolution: string | null
    videoCodec: VideoCodec | null
    audioBitrate: string | null
    audioCodec: AudioCodec | null
    container: Container
}

function pickVideoCodec(streams: StreamInfo[], container: Container): VideoCodec | null {
    const copyable = streams.filter((stream) => stream.copy_containers.includes(container))
    if (copyable.length) return videoCodecFamily(copyable[0].codec ?? '')
    const families = uniqueSorted(streams.map((stream) => videoCodecFamily(stream.codec ?? ''))) as VideoCodec[]
    return families.includes(VideoCodec.H264) ? VideoCodec.H264 : families[0] ?? null
}

function pickAudioCodec(streams: StreamInfo[], container: Container): AudioCodec | null {
    const copyable = streams.filter((stream) => stream.copy_containers.includes(container))
    const families = uniqueSorted((copyable.length ? copyable : streams).map((stream) => audioCodecFamily(stream.codec ?? ''))) as AudioCodec[]
    return families.includes(AudioCodec.AAC) ? AudioCodec.AAC : families[0] ?? null
}

// Pick settings that let ffmpeg copy streams as-is instead of re-encoding them,
// e.g. prefer the highest resolution whose codec fits mp4, else fall back to webm.
export function pickCopySafeDefaults(info: VideoInfo, mode: Mode): DefaultSelection {
    const audioStreams = info.audio_streams

    if (mode === Mode.AUDIO) {
        const pool = audioStreams.length ? audioStreams : []
        return {
            videoResolution: null,
            videoCodec: null,
            audioBitrate: uniqueSorted(pool.map((stream) => stream.abr))[0] ?? null,
            audioCodec: pickAudioCodec(audioStreams, AUDIO_CONTAINERS[0]),
            container: AUDIO_CONTAINERS[0],
        }
    }

    const videoResolution = uniqueSorted(info.video_streams.map((stream) => stream.resolution))[0] ?? null
    const topStreams = info.video_streams.filter((stream) => stream.resolution === videoResolution)
    const container = VIDEO_CONTAINERS.find((candidate) => topStreams.some((stream) => stream.copy_containers.includes(candidate))) ?? Container.MP4
    const copyableAudio = audioStreams.filter((stream) => stream.copy_containers.includes(container))
    const audioPool = copyableAudio.length ? copyableAudio : audioStreams
    return {
        videoResolution,
        videoCodec: pickVideoCodec(topStreams, container),
        audioBitrate: uniqueSorted(audioPool.map((stream) => stream.abr))[0] ?? null,
        audioCodec: pickAudioCodec(audioStreams, container),
        container,
    }
}

// Containers that can hold the selected video stream without re-encoding it.
// Video re-encoding is the slow path (audio-only re-encodes finish in seconds),
// so this drives the warning. Empty for audio-only mode.
export function copySafeContainers(
    info: VideoInfo,
    mode: Mode,
    resolution: string | null,
    videoCodec: VideoCodec | null,
): Container[] {
    if (mode === Mode.AUDIO) return []

    const videoPool = info.video_streams.filter((stream) => stream.resolution === resolution)
    const matched = videoPool.filter((stream) => videoCodecFamily(stream.codec ?? '') === videoCodec)
    const allowed = new Set((matched.length ? matched : videoPool).flatMap((stream) => stream.copy_containers))
    return VIDEO_CONTAINERS.filter((candidate) => allowed.has(candidate))
}

export type CopySuggestions = {
    codecs: VideoCodec[]
    containers: Container[]
}

// Alternatives that fix a slow (re-encoded) selection: a codec that fits the
// current container, and/or a container that fits the current codec.
export function copySuggestions(
    info: VideoInfo,
    mode: Mode,
    resolution: string | null,
    videoCodec: VideoCodec | null,
    container: Container,
): CopySuggestions {
    if (mode === Mode.AUDIO) return { codecs: [], containers: [] }

    const pool = info.video_streams.filter((stream) => stream.resolution === resolution)
    const codecs = [...new Set(
        pool
            .filter((stream) => stream.copy_containers.includes(container))
            .map((stream) => videoCodecFamily(stream.codec ?? '')),
    )].filter((codec) => codec !== videoCodec)

    const containers = copySafeContainers(info, mode, resolution, videoCodec).filter((candidate) => candidate !== container)
    return { codecs, containers }
}
