import AudioIcon from '@/componenets/icons/AudioIcon'
import LinkIcon from '@/componenets/icons/LinkIcon'
import SearchIcon from '@/componenets/icons/SearchIcon'
import VideoIcon from '@/componenets/icons/VideoIcon'
import UnderlineDropdownSelect from '@/componenets/UnderlineDropdownSelect'
import UnderlineInputBox from '@/componenets/UnderlineInputBox'
import { useEffect, useState } from 'react'
import InfoIcon from '@/componenets/icons/InfoIcon'
import YouTubeVideoParms from '@/componenets/YouTubeVideo'
import LoadingBar from '@/componenets/LoadingBar'

type StreamInfo = {
    itag: number
    type: 'video' | 'audio'
    resolution: string | null
    abr: string | null
    codec: string | null
    container: string | null
    fps: number | null
}

type VideoInfo = {
    video_id: string
    title: string
    thumbnail_url: string
    duration_seconds: number
    video_streams: StreamInfo[]
    audio_streams: StreamInfo[]
}

type TaskState = {
    status: 'WAIT' | 'PROCESSING' | 'DONE' | 'ERROR'
    progress: number | null
    error: string | null
}

const VIDEO_CONTAINERS = ['mp4', 'webm', 'mkv', 'mov']
const AUDIO_CONTAINERS = ['mp3', 'wav', 'flac', 'ogg', 'm4a']

function extractVideoId(url: string): string | null {
    const match = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/)
    return match?.[1] ?? null
}

function codecFamily(codec: string): string {
    if (codec.includes('avc1') || codec.includes('h264')) return 'h264'
    if (codec.includes('vp9')) return 'vp9'
    if (codec.includes('av01')) return 'av01'
    if (codec.includes('mp4a')) return 'aac'
    if (codec.includes('opus')) return 'opus'
    return codec.split('.')[0] ?? codec
}

function uniqueSorted(values: (string | null)[]): string[] {
    return [...new Set(values.filter((value): value is string => value !== null))].sort((a, b) => {
        const an = parseInt(a)
        const bn = parseInt(b)
        if (!isNaN(an) && !isNaN(bn)) return bn - an
        return a.localeCompare(b)
    })
}

export default function MainPage() {
    const [inputValue, setInputValue] = useState('')
    const [videoId, setVideoId] = useState<string | null>(null)
    const [info, setInfo] = useState<VideoInfo | null>(null)
    const [infoLoading, setInfoLoading] = useState(false)
    const [infoError, setInfoError] = useState<string | null>(null)

    const [mode, setMode] = useState<'video' | 'audio' | 'both'>('both')
    const [videoResolution, setVideoResolution] = useState<string | null>(null)
    const [videoCodec, setVideoCodec] = useState<string | null>(null)
    const [audioBitrate, setAudioBitrate] = useState<string | null>(null)
    const [audioCodec, setAudioCodec] = useState<string | null>(null)
    const [container, setContainer] = useState<string>('mp4')

    const [taskId, setTaskId] = useState<string | null>(null)
    const [task, setTask] = useState<TaskState | null>(null)
    const [downloadError, setDownloadError] = useState<string | null>(null)

    const videoResolutions = info ? uniqueSorted(info.video_streams.map((stream) => stream.resolution)) : []
    const videoCodecs = info ? uniqueSorted(info.video_streams.map((stream) => codecFamily(stream.codec ?? ''))) : []
    const audioBitrates = info ? uniqueSorted(info.audio_streams.map((stream) => stream.abr)) : []
    const audioCodecs = info ? uniqueSorted(info.audio_streams.map((stream) => codecFamily(stream.codec ?? ''))) : []
    const containers = mode === 'audio' ? AUDIO_CONTAINERS : VIDEO_CONTAINERS

    const search = async () => {
        const id = extractVideoId(inputValue)
        if (!id) {
            setInfoError('유효한 유튜브 URL이 아닙니다')
            return
        }
        setVideoId(id)
        setInfo(null)
        setTaskId(null)
        setTask(null)
        setInfoLoading(true)
        setInfoError(null)
        try {
            const response = await fetch(`/api/info/${id}`, { method: 'POST' })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const data: VideoInfo = await response.json()
            setInfo(data)
            const resolutions = uniqueSorted(data.video_streams.map((stream) => stream.resolution))
            const codecs = uniqueSorted(data.video_streams.map((stream) => codecFamily(stream.codec ?? '')))
            const bitrates = uniqueSorted(data.audio_streams.map((stream) => stream.abr))
            const audioCodecOptions = uniqueSorted(data.audio_streams.map((stream) => codecFamily(stream.codec ?? '')))
            setVideoResolution(resolutions[0] ?? null)
            setVideoCodec(codecs.includes('h264') ? 'h264' : (codecs[0] ?? null))
            setAudioBitrate(bitrates[0] ?? null)
            setAudioCodec(audioCodecOptions.includes('aac') ? 'aac' : (audioCodecOptions[0] ?? null))
            setContainer('mp4')
        } catch (error) {
            setInfoError(error instanceof Error ? error.message : '알 수 없는 오류')
        } finally {
            setInfoLoading(false)
        }
    }

    const startDownload = async () => {
        if (!videoId) return
        setTaskId(null)
        setTask(null)
        setDownloadError(null)
        try {
            const response = await fetch(`/api/predownload/${videoId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode,
                    video_resolution: mode === 'audio' ? null : videoResolution,
                    video_codec: mode === 'audio' ? null : videoCodec,
                    audio_bitrate: mode === 'video' ? null : audioBitrate,
                    audio_codec: mode === 'video' ? null : audioCodec,
                    container,
                }),
            })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const data = await response.json()
            setTaskId(data.task_id)
        } catch (error) {
            setDownloadError(error instanceof Error ? error.message : '알 수 없는 오류')
        }
    }

    useEffect(() => {
        if (!taskId) return
        const poll = async () => {
            try {
                const response = await fetch(`/api/task/${taskId}`)
                if (!response.ok) throw new Error(`HTTP ${response.status}`)
                const data: TaskState & { task_id: string } = await response.json()
                setTask({ status: data.status, progress: data.progress, error: data.error })
            } catch (error) {
                setTask({ status: 'ERROR', progress: null, error: error instanceof Error ? error.message : '알 수 없는 오류' })
            }
        }
        poll()
        const interval = setInterval(poll, 1000)
        return () => clearInterval(interval)
    }, [taskId])

    const ready = info !== null && (mode === 'audio' ? audioBitrate !== null && audioCodec !== null : videoResolution !== null && videoCodec !== null)

    return (
        <div className="flex flex-col items-center min-h-screen">
            <header className="w-full pt-10 pb-8">
                <h1 className="text-center font-futura text-text-bright font-semibold tracking-widest text-4xl m-0">lwyd</h1>
            </header>

            <div className="flex flex-col gap-5 w-full max-w-xl px-4 pb-10">
                <div className="w-full h-8">
                    <UnderlineInputBox
                        frontIcon={
                            <div className="h-full">
                                <LinkIcon fillColor="var(--color-text-primary)" />
                            </div>
                        }
                        backIcon={
                            <button className="h-full" onClick={search} disabled={infoLoading}>
                                <SearchIcon fillColor="var(--color-text-primary)" />
                            </button>
                        }
                        textColor="var(--color-text-primary)"
                        placeholder="Put your youtube url here"
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && search()}
                    />
                </div>

                {infoError && <p className="text-primary-300 text-sm m-0">{infoError}</p>}

                {infoLoading && (
                    <div className="w-full h-2 bg-background-secondary rounded-full overflow-hidden">
                        <LoadingBar type="loading" />
                    </div>
                )}

                {videoId && (
                    <div className="w-full aspect-video bg-background-secondary rounded-2xl overflow-hidden">
                        <YouTubeVideoParms videoId={videoId} />
                    </div>
                )}

                <div className={`flex flex-col gap-5 ${info ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    <div className="flex gap-2">
                        {(['video', 'audio', 'both'] as const).map((value) => (
                            <button
                                key={value}
                                onClick={() => setMode(value)}
                                className={`
                                flex-1 h-8 rounded-full text-sm
                                ${mode === value ? 'bg-primary-575 text-text-bright' : 'bg-background-secondary text-text-primary'}
                                hover:bg-background-hover duration-150 text-center
                                `}
                            >
                                {value === 'video' ? 'Video' : value === 'audio' ? 'Audio' : 'Both'}
                            </button>
                        ))}
                    </div>

                    {mode !== 'audio' && (
                        <div className="flex gap-4 h-8">
                            <UnderlineDropdownSelect
                                textColor="var(--color-text-primary)"
                                frontIcon={
                                    <VideoIcon fillColor="var(--color-text-primary)" />
                                }
                                elements={Object.fromEntries(
                                    videoResolutions.map((resolution) => [
                                        resolution,
                                        <li className="ml-4">{resolution}</li>,
                                    ]),
                                )}
                                maxHeight="10rem"
                                placeholder="Video resolution"
                                defaultValue={videoResolution ?? undefined}
                                onSelect={setVideoResolution}
                            />
                            <UnderlineDropdownSelect
                                textColor="var(--color-text-primary)"
                                frontIcon={
                                    <div className="h-full aspect-square overflow-hidden">
                                        <InfoIcon fillColor="var(--color-text-primary)" />
                                    </div>
                                }
                                elements={Object.fromEntries(
                                    videoCodecs.map((codec) => [
                                        codec,
                                        <li className="ml-4">{codec}</li>,
                                    ]),
                                )}
                                maxHeight="10rem"
                                placeholder="Video codec"
                                defaultValue={videoCodec ?? undefined}
                                onSelect={setVideoCodec}
                            />
                        </div>
                    )}

                    {mode !== 'video' && (
                        <div className="flex gap-4 h-8">
                            <UnderlineDropdownSelect
                                textColor="var(--color-text-primary)"
                                frontIcon={
                                    <AudioIcon fillColor="var(--color-text-primary)" />
                                }
                                elements={Object.fromEntries(
                                    audioBitrates.map((bitrate) => [
                                        bitrate,
                                        <li className="ml-4">{bitrate}</li>,
                                    ]),
                                )}
                                maxHeight="10rem"
                                placeholder="Audio bitrate"
                                defaultValue={audioBitrate ?? undefined}
                                onSelect={setAudioBitrate}
                            />
                            <UnderlineDropdownSelect
                                textColor="var(--color-text-primary)"
                                frontIcon={
                                    <div className="h-full aspect-square overflow-hidden">
                                        <InfoIcon fillColor="var(--color-text-primary)" />
                                    </div>
                                }
                                elements={Object.fromEntries(
                                    audioCodecs.map((codec) => [
                                        codec,
                                        <li className="ml-4">{codec}</li>,
                                    ]),
                                )}
                                maxHeight="10rem"
                                placeholder="Audio codec"
                                defaultValue={audioCodec ?? undefined}
                                onSelect={setAudioCodec}
                            />
                        </div>
                    )}

                    <div className="w-full h-8">
                        <UnderlineDropdownSelect
                            textColor="var(--color-text-primary)"
                            frontIcon={
                                <div className="h-full aspect-square overflow-hidden">
                                    <InfoIcon fillColor="var(--color-text-primary)" />
                                </div>
                            }
                            elements={Object.fromEntries(
                                containers.map((format) => [
                                    format,
                                    <li className="ml-4">{format}</li>,
                                ]),
                            )}
                            maxHeight="10rem"
                            placeholder="File format"
                            defaultValue={container}
                            onSelect={setContainer}
                        />
                    </div>
                </div>

                {task?.status === 'PROCESSING' && (
                    <div className="w-full h-2 bg-background-secondary rounded-full overflow-hidden">
                        <LoadingBar type="progress" progress={task.progress ?? 0} />
                    </div>
                )}

                {task?.status === 'ERROR' && <p className="text-primary-300 text-sm m-0">{task.error}</p>}
                {downloadError && <p className="text-primary-300 text-sm m-0">{downloadError}</p>}

                {task?.status === 'DONE' && taskId && (
                    <a
                        href={`/api/download/${taskId}`}
                        className="w-full h-8 rounded-full bg-primary-575 text-text-bright font-thin text-center leading-8 block"
                    >
                        Download file
                    </a>
                )}

                {task?.status !== 'DONE' && (
                    <button
                        className={`
                        w-full h-8 rounded-full text-center text-text-bright font-thin
                        ${ready ? 'bg-primary-575' : 'bg-background-secondary opacity-30 pointer-events-none'}
                        duration-150
                        `}
                        onClick={startDownload}
                        disabled={!ready || task?.status === 'PROCESSING'}
                    >
                        Download
                    </button>
                )}
            </div>
        </div>
    )
}
