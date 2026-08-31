import { AnimatePresence, motion } from 'framer-motion'
import { TaskStatus } from '../enums'
import { useMainStore } from '../store/useMainStore'

const STAGES: { key: TaskStatus, label: string }[] = [
    { key: TaskStatus.FETCHING, label: 'Fetching video info' },
    { key: TaskStatus.DOWNLOADING, label: 'Downloading media' },
    { key: TaskStatus.POST_PROCESSING, label: 'Post processing' },
    { key: TaskStatus.DONE, label: 'Done' },
]

const COLORS = {
    bright: '#ffffff',
    primary: '#7b7b7b',
    secondary: '#5c5c5c',
    primary425: '#D0604D',
    primary300: '#F3806B',
}

function stageIndex(status: TaskStatus): number {
    return STAGES.findIndex((stage) => stage.key === status)
}

const PROGRESS_STATUSES = new Set<TaskStatus>([
    TaskStatus.DOWNLOADING,
    TaskStatus.POST_PROCESSING,
    TaskStatus.DONE,
])

export default function StatusTimeline() {
    const task = useMainStore((state) => state.task)

    if (!task) return null

    const currentStage = stageIndex(task.status)
    const showProgress = PROGRESS_STATUSES.has(task.status)

    return (
        <AnimatePresence>
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
                            <div key={stage.key} className="relative flex flex-col items-center justify-center" style={{ minHeight: '3rem' }}>
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
                            <div key={stage.key} className="flex items-center gap-3" style={{ minHeight: '3rem' }}>
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
                    {task.status === TaskStatus.ERROR && <p className="text-primary-300 text-sm m-0 mt-1">{task.error}</p>}
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
