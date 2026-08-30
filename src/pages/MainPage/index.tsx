import AudioIcon from '@/componenets/icons/AudioIcon'
import LinkIcon from '@/componenets/icons/LinkIcon'
import SearchIcon from '@/componenets/icons/SearchIcon'
import VideoIcon from '@/componenets/icons/VideoIcon'
import UnderlineDropdownSelect from '@/componenets/UnderlineDropdownSelect'
import UnderlineInputBox from '@/componenets/UnderlineInputBox'
import { useEffect, useState } from 'react'
import InfoIcon from '@/componenets/icons/InfoIcon'
import RefreshIcon from '@/componenets/icons/RefreshIcon'
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
    { key: 'PROCESSING', label: 'Post processing' },
    { key: 'DONE', label: 'Done' },
]

const COLORS = {
    bright: '#ffffff',
    primary: '#7b7b7b',
    secondary: '#5c5c5c',
    primary425: '#D0604D',
    primary300: '#F3806B',
}

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

    useEffect(() => {
        setContainer(mode === 'audio' ? AUDIO_CONTAINERS[0] : VIDEO_CONTAINERS[0])
    }, [mode])

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

    const resetDownload = () => {
        setTaskId(null)
        setTask(null)
        setDownloadError(null)
    }

    useEffect(() => {
        if (!taskId) return
        const poll = async () => {
            try {
                const response = await fetch(`/api/task/${taskId}`)
                if (!response.ok) throw new Error(`HTTP ${response.status}`)
                const data: TaskState & { task_id: string } = await response.json()
                setTask((prev) => {
                    const prevProgress = prev?.progress ?? 0
                    return {
                        status: data.status,
                        progress: Math.max(prevProgress, data.progress ?? 0),
                        error: data.error,
                    }
                })
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
    const showProgress = task !== null && ['DOWNLOADING', 'PROCESSING', 'DONE'].includes(task.status)

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
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-text-secondary text-sm m-0">Paste a YouTube URL to preview it here</p>
                        </div>
                    )}
                </div>

                <div className={`flex flex-col gap-5 ${info ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    <div className="relative">
                        <div className="flex gap-6 px-2">
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
                                    {value === 'video' ? 'Video only' : value === 'audio' ? 'Audio only' : 'Both'}
                                </button>
                            ))}
                        </div>
                        <motion.div
                            className="absolute bottom-0 h-0.5 bg-primary-425 rounded-full"
                            animate={{
                                left: `${(mode === 'video' ? 0 : mode === 'audio' ? 1 : 2) * (100 / 3)}%`,
                                width: `${100 / 3}%`,
                                opacity: 1,
                            }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        />
                        <div className="absolute -bottom-1 left-0 right-0 h-px bg-background-hover" />
                    </div>

                    <motion.div
                        className="flex gap-4 h-8"
                        animate={{ opacity: mode === 'audio' ? 0.15 : 1 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        style={mode === 'audio' ? { pointerEvents: 'none' } : undefined}
                    >
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
                    </motion.div>

                    <motion.div
                        className="flex gap-4 h-8"
                        animate={{ opacity: mode === 'video' ? 0.15 : 1 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        style={mode === 'video' ? { pointerEvents: 'none' } : undefined}
                    >
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
                    </motion.div>

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
                    {task && (
                        <motion.div
                            key="timeline"
                            className="flex gap-4 pl-1"
                            initial={{ opacity: 0, height: 0, marginBottom: -20 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                            exit={{ opacity: 0, height: 0, marginBottom: -20 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="flex flex-col items-center">
                                {STAGES.map((stage, index) => {
                                    const state = currentStage > index ? 'done' : currentStage === index ? 'active' : 'pending'
                                    const isLast = index === STAGES.length - 1
                                    const dotColor = state === 'done' ? COLORS.primary425 : state === 'active' ? COLORS.primary300 : COLORS.secondary
                                    return (
                                        <div key={stage.key} className="relative flex flex-col items-center justify-center" style={{ minHeight: isLast ? '1.25rem' : '3rem' }}>
                                            {!isLast && (
                                                <div className={`absolute left-1/2 -translate-x-1/2 top-1/2 w-px ${currentStage > index ? 'bg-primary-425' : 'bg-background-secondary'}`} style={{ height: '100%' }} />
                                            )}
                                            <motion.div
                                                className="relative size-2.5 rounded-full shrink-0"
                                                animate={{ backgroundColor: dotColor }}
                                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                            >
                                                {state === 'active' && (
                                                    <motion.div
                                                        className="absolute inset-0 rounded-full"
                                                        animate={{ scale: [1, 2.4], opacity: [1, 0], backgroundColor: dotColor }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: 'easeOut' }}
                                                    />
                                                )}
                                            </motion.div>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="flex flex-col justify-center flex-1 min-w-0">
                                {STAGES.map((stage, index) => {
                                    const state = currentStage > index ? 'done' : currentStage === index ? 'active' : 'pending'
                                    const textColor = state === 'done' ? COLORS.primary : state === 'active' ? COLORS.bright : COLORS.secondary
                                    const showBar = state === 'active' && showProgress
                                    return (
                                        <div key={stage.key} className="flex items-center gap-3" style={{ minHeight: index === STAGES.length - 1 ? '1.25rem' : '3rem' }}>
                                            <motion.p
                                                className="text-sm m-0 whitespace-nowrap"
                                                animate={{ color: textColor }}
                                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                            >
                                                {stage.label}
                                            </motion.p>
                                            {showBar && (
                                                <>
                                                    <div className="flex-1 h-1 bg-background-secondary rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full bg-primary-425 rounded-full"
                                                            initial={{ width: '0%' }}
                                                            animate={{ width: `${Math.min(100, (task.progress ?? 0) * 100)}%` }}
                                                            transition={{ duration: 0.4, ease: 'easeOut' }}
                                                        />
                                                    </div>
                                                    <p className="text-text-secondary text-xs m-0 tabular-nums">{Math.round((task.progress ?? 0) * 100)}%</p>
                                                </>
                                            )}
                                        </div>
                                    )
                                })}
                                {task.status === 'ERROR' && <p className="text-primary-300 text-sm m-0 mt-1">{task.error}</p>}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {task?.status === 'DONE' && taskId && (
                    <div className="flex gap-2 items-center">
                        <a
                            href={`/api/download/${taskId}`}
                            className="flex-1 h-8 rounded-full bg-primary-575 text-text-bright font-thin text-center leading-8 block"
                        >
                            Download file
                        </a>
                        <button
                            className="size-8 rounded-full bg-background-secondary text-text-primary hover:bg-background-hover duration-150 flex items-center justify-center"
                            onClick={resetDownload}
                        >
                            <div className="size-4">
                                <RefreshIcon fillColor="var(--color-text-primary)" />
                            </div>
                        </button>
                    </div>
                )}

                {task?.status !== 'DONE' && (
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2 items-center">
                            <motion.button
                                className={`
                                h-8 rounded-full text-center font-thin flex-1
                                ${ready && !downloading ? 'bg-primary-575 text-text-bright' : 'bg-background-secondary text-text-secondary'}
                                ${!ready ? 'opacity-30 pointer-events-none' : ''}
                                `}
                                onClick={startDownload}
                                disabled={!ready || downloading}
                            >
                                {downloading ? 'downloading...' : 'Download'}
                            </motion.button>
                            <AnimatePresence>
                                {downloading && (
                                    <motion.div
                                        key="cancel"
                                        className="overflow-hidden"
                                        initial={{ width: 0, opacity: 0 }}
                                        animate={{ width: 32, opacity: 1 }}
                                        exit={{ width: 0, opacity: 0 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                    >
                                        <button
                                            className="size-8 rounded-full bg-background-secondary text-text-primary hover:bg-background-hover duration-150 flex items-center justify-center"
                                            onClick={cancelDownload}
                                        >
                                            <svg className="size-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {task?.status === 'CANCELLED' && (
                            <p className="text-text-secondary text-sm m-0 text-center">cancelled</p>
                        )}
                    </div>
                )}

                {downloadError && <p className="text-primary-300 text-sm m-0">{downloadError}</p>}
            </div>
        </div>
    )
}
