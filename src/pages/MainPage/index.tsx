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
import { AnimatePresence, motion } from 'framer-motion'

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
    status: 'WAIT' | 'FETCHING' | 'DOWNLOADING' | 'PROCESSING' | 'DONE' | 'ERROR' | 'CANCELLED'
    progress: number | null
    error: string | null
}

type Mode = 'video' | 'audio' | 'both'

const VIDEO_CONTAINERS = ['mp4', 'webm', 'mkv', 'mov']
const AUDIO_CONTAINERS = ['mp3', 'wav', 'flac', 'ogg', 'm4a']

const STAGES: { key: TaskState['status'], label: string }[] = [
    { key: 'FETCHING', label: 'Fetching video info' },
    { key: 'DOWNLOADING', label: 'Downloading media' },
    { key: 'PROCESSING', label: 'Processing with ffmpeg' },
    { key: 'DONE', label: 'Done' },
]

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

function stageIndex(status: TaskState['status']): number {
    return STAGES.findIndex((stage) => stage.key === status)
}

export default function MainPage() {
    const [inputValue, setInputValue] = useState('')
    const [videoId, setVideoId] = useState<string | null>(null)
    const [info, setInfo] = useState<VideoInfo | null>(null)
    const [infoLoading, setInfoLoading] = useState(false)
    const [infoError, setInfoError] = useState<string | null>(null)

    const [mode, setMode] = useState<Mode>('both')
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

    const searching = videoId !== null && !infoLoading && info === null && infoError === null
    const downloading = task !== null && ['WAIT', 'FETCHING', 'DOWNLOADING', 'PROCESSING'].includes(task.status)

    const search = async (id?: string) => {
        const resolved = id ?? extractVideoId(inputValue)
        if (!resolved) {
            setInfoError('유효한 유튜브 URL이 아닙니다')
            return
        }
        setVideoId(resolved)
        setInfo(null)
        setTaskId(null)
        setTask(null)
        setInfoLoading(true)
        setInfoError(null)
        try {
            const response = await fetch(`/api/info/${resolved}`, { method: 'POST' })
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setInputValue(value)
        const id = extractVideoId(value)
        if (id && id !== videoId) {
            search(id)
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

    const cancelDownload = async () => {
        if (!taskId) return
        try {
            await fetch(`/api/cancel/${taskId}`, { method: 'POST' })
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
    const currentStage = task ? stageIndex(task.status) : -1

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
                            <button className="h-full" onClick={() => search()} disabled={infoLoading}>
                                <SearchIcon fillColor="var(--color-text-primary)" />
                            </button>
                        }
                        textColor="var(--color-text-primary)"
                        placeholder="Put your youtube url here"
                        onChange={handleInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && search()}
                    />
                </div>

                {infoError && <p className="text-primary-300 text-sm m-0">{infoError}</p>}

                <div className="relative w-full aspect-video bg-background-secondary rounded-2xl overflow-hidden">
                    {videoId && info && (
                        <div className="absolute inset-0">
                            <YouTubeVideoParms videoId={videoId} />
                        </div>
                    )}
                    {(infoLoading || searching) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-10">
                            <p className="text-text-primary text-sm m-0">loading...</p>
                            <div className="w-full h-2 bg-background-primary rounded-full overflow-hidden">
                                <LoadingBar type="loading" />
                            </div>
                        </div>
                    )}
                    {!videoId && !infoLoading && (
                        <div className="absolute inset-0" />
                    )}
                </div>

                <div className={`flex flex-col gap-5 ${info ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    <div className="flex">
                        {(['video', 'audio', 'both'] as const).map((value) => (
                            <button
                                key={value}
                                onClick={() => setMode(value)}
                                className={`
                                flex-1 h-8 text-sm relative
                                ${mode === value ? 'text-text-bright' : 'text-text-primary'}
                                hover:text-text-bright duration-150
                                `}
                            >
                                {value === 'video' ? 'Video' : value === 'audio' ? 'Audio' : 'Both'}
                                <motion.div
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-425 rounded-full"
                                    animate={{ opacity: mode === value ? 1 : 0 }}
                                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                />
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
                                        <span className="ml-4">{resolution}</span>,
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
                                        <span className="ml-4">{codec}</span>,
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
                                        <span className="ml-4">{bitrate}</span>,
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
                                        <span className="ml-4">{codec}</span>,
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
                                    <span className="ml-4">{format}</span>,
                                ]),
                            )}
                            maxHeight="10rem"
                            placeholder="File format"
                            defaultValue={container}
                            onSelect={setContainer}
                        />
                    </div>
                </div>

                <AnimatePresence>
                    {task && (downloading || task.status === 'ERROR' || task.status === 'CANCELLED') && (
                        <motion.div
                            key="timeline"
                            className="flex flex-col gap-0 pl-1"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {STAGES.map((stage, index) => {
                                const state = currentStage > index ? 'done' : currentStage === index ? 'active' : 'pending'
                                const isLast = index === STAGES.length - 1
                                return (
                                    <div key={stage.key} className="relative flex gap-4 pb-2">
                                        {!isLast && (
                                            <div className={`absolute left-[5px] top-4 bottom-0 w-px ${currentStage > index ? 'bg-primary-425' : 'bg-background-secondary'}`} />
                                        )}
                                        <div className={`relative mt-1.5 size-2.5 rounded-full shrink-0 ${state === 'done' ? 'bg-primary-425' : state === 'active' ? 'bg-primary-300' : 'bg-background-secondary'}`}>
                                            {state === 'active' && (
                                                <motion.div
                                                    className="absolute inset-0 rounded-full bg-primary-300"
                                                    animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: 'easeOut' }}
                                                />
                                            )}
                                        </div>
                                        <p className={`text-sm m-0 ${state === 'done' ? 'text-text-primary' : state === 'active' ? 'text-text-bright' : 'text-text-secondary'}`}>
                                            {stage.label}
                                        </p>
                                    </div>
                                )
                            })}
                            {task.status === 'ERROR' && <p className="text-primary-300 text-sm m-0 mt-1">{task.error}</p>}
                            {task.status === 'CANCELLED' && <p className="text-text-secondary text-sm m-0 mt-1">cancelled</p>}
                        </motion.div>
                    )}
                </AnimatePresence>

                {task?.status === 'DONE' && taskId && (
                    <a
                        href={`/api/download/${taskId}`}
                        className="w-full h-8 rounded-full bg-primary-575 text-text-bright font-thin text-center leading-8 block"
                    >
                        Download file
                    </a>
                )}

                {task?.status !== 'DONE' && (
                    <div className="flex gap-2 items-center">
                        <motion.button
                            layout
                            className={`
                            h-8 rounded-full text-center text-text-bright font-thin duration-150
                            ${ready ? 'bg-primary-575' : 'bg-background-secondary opacity-30 pointer-events-none'}
                            ${downloading ? 'flex-1' : 'w-full'}
                            `}
                            onClick={startDownload}
                            disabled={!ready || downloading}
                            transition={{ layout: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
                        >
                            {downloading ? 'downloading...' : 'Download'}
                        </motion.button>
                        <AnimatePresence>
                            {downloading && (
                                <motion.button
                                    key="cancel"
                                    layout
                                    className="size-8 rounded-full bg-background-secondary text-text-primary hover:bg-background-hover duration-150 flex items-center justify-center"
                                    onClick={cancelDownload}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    <svg className="size-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {task?.status === 'DONE' && (
                    <div className="w-full h-2 bg-background-secondary rounded-full overflow-hidden">
                        <LoadingBar type="progress" progress={1} />
                    </div>
                )}

                {downloadError && <p className="text-primary-300 text-sm m-0">{downloadError}</p>}
            </div>
        </div>
    )
}
