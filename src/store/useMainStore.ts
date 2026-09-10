import { create } from 'zustand'
import { AudioCodec, AUDIO_CONTAINERS, Container, Mode, VIDEO_CONTAINERS, VideoCodec } from '../enums'
import { cancelTask, fetchTaskStatus, fetchVideoInfo, startDownload } from '../api/video'
import type { DownloadRequest, TaskState, VideoInfo } from '../api/video'
import { extractVideoId, pickCopySafeDefaults, uniqueSorted, videoCodecFamily, audioCodecFamily } from '../utils'
import { readSettingsFromUrl, syncUrl } from '../urlState'

type MainState = {
    inputValue: string
    videoId: string | null
    info: VideoInfo | null
    infoLoading: boolean
    infoError: string | null

    mode: Mode
    videoResolution: string | null
    videoCodec: VideoCodec | null
    audioBitrate: string | null
    audioCodec: AudioCodec | null
    container: Container

    taskId: string | null
    task: TaskState | null
    cancelling: boolean
    downloadError: string | null

    setInputValue: (value: string) => void
    search: (id?: string) => Promise<void>
    setMode: (mode: Mode) => void
    setVideoResolution: (value: string) => void
    setVideoCodec: (value: VideoCodec) => void
    setAudioBitrate: (value: string) => void
    setAudioCodec: (value: AudioCodec) => void
    setContainer: (value: Container) => void
    setTask: (task: TaskState | null | ((prev: TaskState | null) => TaskState | null)) => void
    setCancelling: (value: boolean) => void
    setDownloadError: (error: string | null) => void
    beginDownload: () => Promise<void>
    cancelDownload: () => Promise<void>
    resetDownload: () => void
}

const initialUrl = readSettingsFromUrl()

export const useMainStore = create<MainState>((set, get) => ({
    inputValue: initialUrl.videoId ? `https://www.youtube.com/watch?v=${initialUrl.videoId}` : '',
    videoId: initialUrl.videoId,
    info: null,
    infoLoading: false,
    infoError: null,

    mode: initialUrl.mode ?? Mode.BOTH,
    videoResolution: initialUrl.videoResolution,
    videoCodec: initialUrl.videoCodec,
    audioBitrate: initialUrl.audioBitrate,
    audioCodec: initialUrl.audioCodec,
    container: initialUrl.container ?? Container.MP4,

    taskId: null,
    task: null,
    cancelling: false,
    downloadError: null,

    setInputValue: (value) => set({ inputValue: value }),

    search: async (id) => {
        const resolved = id ?? extractVideoId(get().inputValue)
        if (!resolved) {
            set({ infoError: 'Invalid YouTube URL' })
            return
        }
        set({ videoId: resolved, info: null, taskId: null, task: null, infoLoading: true, infoError: null })
        try {
            const data = await fetchVideoInfo(resolved)
            const current = get()
            const defaults = pickCopySafeDefaults(data, current.mode)
            const resolutions = uniqueSorted(data.video_streams.map((stream) => stream.resolution))
            const videoCodecs = uniqueSorted(data.video_streams.map((stream) => videoCodecFamily(stream.codec ?? '')))
            const bitrates = uniqueSorted(data.audio_streams.map((stream) => stream.abr))
            const audioCodecs = uniqueSorted(data.audio_streams.map((stream) => audioCodecFamily(stream.codec ?? '')))
            const containers = current.mode === Mode.AUDIO ? AUDIO_CONTAINERS : VIDEO_CONTAINERS
            const keep = <T,>(value: T | null, allowed: string[]): T | null =>
                value !== null && allowed.includes(value as unknown as string) ? value : null
            set({
                info: data,
                videoResolution: keep(current.videoResolution, resolutions) ?? defaults.videoResolution,
                videoCodec: keep(current.videoCodec, videoCodecs) ?? defaults.videoCodec,
                audioBitrate: keep(current.audioBitrate, bitrates) ?? defaults.audioBitrate,
                audioCodec: keep(current.audioCodec, audioCodecs) ?? defaults.audioCodec,
                container: containers.includes(current.container) ? current.container : defaults.container,
            })
        } catch (error) {
            set({ infoError: error instanceof Error ? error.message : 'Unknown error' })
        } finally {
            set({ infoLoading: false })
        }
    },

    setMode: (mode) => {
        const info = get().info
        const container = info
            ? pickCopySafeDefaults(info, mode).container
            : mode === Mode.AUDIO ? AUDIO_CONTAINERS[0] : VIDEO_CONTAINERS[0]
        set({ mode, container })
    },

    setVideoResolution: (value) => set({ videoResolution: value }),
    setVideoCodec: (value) => set({ videoCodec: value }),
    setAudioBitrate: (value) => set({ audioBitrate: value }),
    setAudioCodec: (value) => set({ audioCodec: value }),
    setContainer: (value) => set({ container: value }),
    setTask: (task) => set((state) => ({
        task: typeof task === 'function' ? task(state.task) : task,
    })),
    setCancelling: (value) => set({ cancelling: value }),
    setDownloadError: (error) => set({ downloadError: error }),

    beginDownload: async () => {
        const state = get()
        if (!state.videoId) return
        set({ taskId: null, task: null, downloadError: null })
        try {
            const request: DownloadRequest = {
                mode: state.mode,
                video_resolution: state.mode === Mode.AUDIO ? null : state.videoResolution,
                video_codec: state.mode === Mode.AUDIO ? null : state.videoCodec,
                audio_bitrate: state.mode === Mode.VIDEO ? null : state.audioBitrate,
                audio_codec: state.mode === Mode.VIDEO ? null : state.audioCodec,
                container: state.container,
            }
            const data = await startDownload(state.videoId, request)
            set({ taskId: data.task_id })
        } catch (error) {
            set({ downloadError: error instanceof Error ? error.message : 'Unknown error' })
        }
    },

    cancelDownload: async () => {
        const taskId = get().taskId
        if (!taskId) return
        set({ cancelling: true })
        try {
            await cancelTask(taskId)
        } catch (error) {
            set({ cancelling: false, downloadError: error instanceof Error ? error.message : 'Unknown error' })
        }
    },

    resetDownload: () => set({ taskId: null, task: null, downloadError: null, cancelling: false }),
}))

export async function pollTask(taskId: string): Promise<TaskState | null> {
    const data = await fetchTaskStatus(taskId)
    if (data.status === 'CANCELLED') {
        useMainStore.setState({ cancelling: false, task: null, taskId: null })
        return null
    }
    useMainStore.setState({ cancelling: false })
    return { status: data.status, progress: data.progress, video_progress: data.video_progress, audio_progress: data.audio_progress, error: data.error }
}

useMainStore.subscribe((state) => {
    syncUrl({
        videoId: state.videoId,
        mode: state.mode,
        videoResolution: state.videoResolution,
        videoCodec: state.videoCodec,
        audioBitrate: state.audioBitrate,
        audioCodec: state.audioCodec,
        container: state.container,
    })
})
