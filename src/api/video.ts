import { apiClient } from './client'
import { AudioCodec, Container, Mode, VideoCodec } from '../enums'

export type StreamInfo = {
    itag: number
    type: 'video' | 'audio'
    resolution: string | null
    abr: string | null
    codec: string | null
    container: string | null
    fps: number | null
}

export type VideoInfo = {
    video_id: string
    title: string
    thumbnail_url: string
    duration_seconds: number
    video_streams: StreamInfo[]
    audio_streams: StreamInfo[]
}

export type DownloadRequest = {
    mode: Mode
    video_resolution: string | null
    video_codec: VideoCodec | null
    audio_bitrate: string | null
    audio_codec: AudioCodec | null
    container: Container
}

export type TaskState = {
    status: 'WAIT' | 'FETCHING' | 'DOWNLOADING' | 'POST_PROCESSING' | 'DONE' | 'ERROR' | 'CANCELLED'
    progress: number | null
    error: string | null
}

export async function fetchVideoInfo(videoId: string): Promise<VideoInfo> {
    const response = await apiClient.post<VideoInfo>(`/info/${videoId}`)
    return response.data
}

export async function startDownload(videoId: string, request: DownloadRequest): Promise<{ task_id: string }> {
    const response = await apiClient.post(`/predownload/${videoId}`, request)
    return response.data
}

export async function fetchTaskStatus(taskId: string): Promise<TaskState & { task_id: string }> {
    const response = await apiClient.get(`/task/${taskId}`)
    return response.data
}

export async function cancelTask(taskId: string): Promise<void> {
    await apiClient.post(`/cancel/${taskId}`)
}

export function downloadUrl(taskId: string): string {
    return `/api/download/${taskId}`
}
