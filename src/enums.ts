export const Mode = {
    VIDEO: 'video',
    AUDIO: 'audio',
    BOTH: 'both',
} as const
export type Mode = typeof Mode[keyof typeof Mode]

export const VideoCodec = {
    H264: 'h264',
    VP9: 'vp9',
    AV01: 'av01',
} as const
export type VideoCodec = typeof VideoCodec[keyof typeof VideoCodec]

export const AudioCodec = {
    AAC: 'aac',
    OPUS: 'opus',
    VORBIS: 'vorbis',
    MP3: 'mp3',
} as const
export type AudioCodec = typeof AudioCodec[keyof typeof AudioCodec]

export const Container = {
    MP4: 'mp4',
    WEBM: 'webm',
    MKV: 'mkv',
    MOV: 'mov',
    MP3: 'mp3',
    WAV: 'wav',
    FLAC: 'flac',
    OGG: 'ogg',
    M4A: 'm4a',
} as const
export type Container = typeof Container[keyof typeof Container]

export const TaskStatus = {
    WAIT: 'WAIT',
    FETCHING: 'FETCHING',
    DOWNLOADING: 'DOWNLOADING',
    POST_PROCESSING: 'POST_PROCESSING',
    DONE: 'DONE',
    ERROR: 'ERROR',
    CANCELLED: 'CANCELLED',
} as const
export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus]

export const VIDEO_CONTAINERS: Container[] = [Container.MP4, Container.WEBM, Container.MKV, Container.MOV]
export const AUDIO_CONTAINERS: Container[] = [Container.MP3, Container.WAV, Container.FLAC, Container.OGG, Container.M4A]
