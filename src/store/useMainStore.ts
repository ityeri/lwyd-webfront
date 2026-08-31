import { create } from 'zustand'
import { AudioCodec, AUDIO_CONTAINERS, Container, Mode, VIDEO_CONTAINERS, VideoCodec } from '../enums'
import { cancelTask, fetchTaskStatus, fetchVideoInfo, startDownload } from '../api/video'
import type { DownloadRequest, TaskState, VideoInfo } from '../api/video'
import { extractVideoId, uniqueSorted, videoCodecFamily, audioCodecFamily } from '../utils'

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

export const useMainStore = create<MainState>((set, get) => ({
    inputValue: '',
    videoId: null,
    info: null,
    infoLoading: false,
    infoError: null,

    mode: Mode.BOTH,
    videoResolution: null,
    videoCodec: null,
    audioBitrate: null,
    audioCodec: null,
    container: Container.MP4,

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
            const resolutions = uniqueSorted(data.video_streams.map((stream) => stream.resolution))
            const videoCodecs = uniqueSorted(data.video_streams.map((stream) => videoCodecFamily(stream.codec ?? '')))
            const bitrates = uniqueSorted(data.audio_streams.map((stream) => stream.abr))
            const audioCodecs = uniqueSorted(data.audio_streams.map((stream) => audioCodecFamily(stream.codec ?? '')))
            set({
                info: data,
                videoResolution: resolutions[0] ?? null,
                videoCodec: videoCodecs.includes(VideoCodec.H264) ? VideoCodec.H264 : (videoCodecs[0] as VideoCodec | null) ?? null,
                audioBitrate: bitrates[0] ?? null,
                audioCodec: audioCodecs.includes(AudioCodec.AAC) ? AudioCodec.AAC : (audioCodecs[0] as AudioCodec | null) ?? null,
                container: Container.MP4,
            })
        } catch (error) {
            set({ infoError: error instanceof Error ? error.message : 'Unknown error' })
        } finally {
            set({ infoLoading: false })
        }
    },

    setMode: (mode) => {
        set({
            mode,
            container: mode === Mode.AUDIO ? AUDIO_CONTAINERS[0] : VIDEO_CONTAINERS[0],
        })
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
    return { status: data.status, progress: data.progress, error: data.error }
}
