import { AnimatePresence, motion } from 'framer-motion'
import { Mode, TaskStatus } from '../enums'
import { useMainStore } from '../store/useMainStore'
import type { TaskState } from '../api/video'

type StageKey = 'fetching' | 'video' | 'audio' | 'processing' | 'done'

const STAGE_LABELS: Record<StageKey, string> = {
    fetching: 'Fetching video info',
    video: 'Downloading video',
    audio: 'Downloading audio',
    processing: 'Post processing',
    done: 'Done',
}

const COLORS = {
    bright: '#ffffff',
    primary: '#7b7b7b',
    secondary: '#5c5c5c',
    primary425: '#D0604D',
    primary300: '#F3806B',
}

// Stages depend on the mode: audio-only never downloads video and vice versa.
function buildStages(mode: Mode): StageKey[] {
    const stages: StageKey[] = ['fetching']
    if (mode !== Mode.AUDIO) stages.push('video')
    if (mode !== Mode.VIDEO) stages.push('audio')
    stages.push('processing', 'done')
    return stages
}

function currentStageIndex(status: TaskStatus, stages: StageKey[], task: TaskState): number {
    const at = (key: StageKey) => stages.indexOf(key)
    switch (status) {
        case TaskStatus.FETCHING:
            return at('fetching')
        case TaskStatus.DOWNLOADING: {
            const videoIndex = at('video')
            if (videoIndex >= 0 && (task.video_progress ?? 0) < 1) return videoIndex
            const audioIndex = at('audio')
            if (audioIndex >= 0) return audioIndex
            return videoIndex >= 0 ? videoIndex : at('processing')
        }
        case TaskStatus.POST_PROCESSING:
            return at('processing')
        case TaskStatus.DONE:
            return at('done')
        default:
            return -1
    }
}

function stageProgress(key: StageKey, task: TaskState): number | null {
    if (key === 'video') return task.video_progress
    if (key === 'audio') return task.audio_progress
    if (key === 'processing' || key === 'done') return task.progress
    return null
}

export default function StatusTimeline() {
    const task = useMainStore((state) => state.task)
    const mode = useMainStore((state) => state.mode)

    const stages = buildStages(mode)
    const currentStage = task ? currentStageIndex(task.status, stages, task) : -1

    return (
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
                    {stages.map((stage, index) => {
                        const state = currentStage > index ? 'done' : currentStage === index ? 'active' : 'pending'
                        const isLast = index === stages.length - 1
                        const dotColor = state === 'done' ? COLORS.primary425 : state === 'active' ? COLORS.primary300 : COLORS.secondary
                        return (
                            <div key={stage} className="relative flex flex-col items-center justify-center" style={{ minHeight: '3rem' }}>
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
                    {stages.map((stage, index) => {
                        const state = currentStage > index ? 'done' : currentStage === index ? 'active' : 'pending'
                        const textColor = state === 'done' ? COLORS.primary : state === 'active' ? COLORS.bright : COLORS.secondary
                        const value = stageProgress(stage, task)
                        const showBar = state === 'active' && value !== null
                        return (
                            <div key={stage} className="flex items-center gap-3" style={{ minHeight: '3rem' }}>
                                <motion.p
                                    className="text-sm m-0 whitespace-nowrap"
                                    animate={{ color: textColor }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                >
                                    {STAGE_LABELS[stage]}
                                </motion.p>
                                {showBar && (
                                    <>
                                        <div className="flex-1 h-1 bg-background-secondary rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-primary-425 rounded-full"
                                                initial={{ width: '0%' }}
                                                animate={{ width: `${Math.min(100, value * 100)}%` }}
                                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                            />
                                        </div>
                                        <p className="text-text-secondary text-xs m-0 tabular-nums">{Math.round(value * 100)}%</p>
                                    </>
                                )}
                            </div>
                        )
                    })}
                    {task.status === TaskStatus.ERROR && <p className="text-primary-300 text-sm m-0 mt-1">{task.error}</p>}
                </div>
            </motion.div>
            )}
        </AnimatePresence>
    )
}
