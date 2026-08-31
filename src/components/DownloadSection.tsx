import RefreshIcon from '@/components/icons/RefreshIcon'
import { AnimatePresence, motion } from 'framer-motion'
import { Mode, TaskStatus } from '../enums'
import { useMainStore } from '../store/useMainStore'
import { downloadUrl } from '../api/video'

const DOWNLOADING_STATUSES = new Set<TaskStatus>([
    TaskStatus.WAIT,
    TaskStatus.FETCHING,
    TaskStatus.DOWNLOADING,
    TaskStatus.POST_PROCESSING,
])

export default function DownloadSection() {
    const info = useMainStore((state) => state.info)
    const mode = useMainStore((state) => state.mode)
    const videoResolution = useMainStore((state) => state.videoResolution)
    const videoCodec = useMainStore((state) => state.videoCodec)
    const audioBitrate = useMainStore((state) => state.audioBitrate)
    const audioCodec = useMainStore((state) => state.audioCodec)
    const taskId = useMainStore((state) => state.taskId)
    const task = useMainStore((state) => state.task)
    const cancelling = useMainStore((state) => state.cancelling)
    const downloadError = useMainStore((state) => state.downloadError)
    const beginDownload = useMainStore((state) => state.beginDownload)
    const cancelDownload = useMainStore((state) => state.cancelDownload)
    const resetDownload = useMainStore((state) => state.resetDownload)

    const ready = info !== null && (mode === Mode.AUDIO ? audioBitrate !== null && audioCodec !== null : videoResolution !== null && videoCodec !== null)
    const downloading = task !== null && DOWNLOADING_STATUSES.has(task.status)

    if (task?.status === TaskStatus.DONE && taskId) {
        return (
            <div className="flex gap-2 items-center">
                <a
                    href={downloadUrl(taskId)}
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
        )
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center">
                <motion.button
                    className={`
                    h-8 rounded-full text-center font-thin flex-1
                    ${ready && !downloading ? 'bg-primary-575 text-text-bright' : 'bg-background-secondary text-text-secondary'}
                    ${!ready ? 'opacity-30 pointer-events-none' : ''}
                    `}
                    onClick={beginDownload}
                    disabled={!ready || downloading}
                >
                    {cancelling ? 'cancelling...' : downloading ? 'downloading...' : 'Download'}
                </motion.button>
                <AnimatePresence>
                    {downloading && (
                        <motion.div
                            key="cancel"
                            className="overflow-hidden"
                            initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                            animate={{ width: 32, opacity: 1, marginLeft: 8 }}
                            exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        >
                            {cancelling ? (
                                <div className="size-8 rounded-full bg-background-secondary flex items-center justify-center">
                                    <div className="size-4 rounded-full border-2 border-text-secondary border-t-transparent animate-spin" />
                                </div>
                            ) : (
                                <button
                                    className="size-8 rounded-full bg-background-secondary text-text-primary hover:bg-background-hover duration-150 flex items-center justify-center"
                                    onClick={cancelDownload}
                                >
                                    <svg className="size-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {downloadError && <p className="text-primary-300 text-sm m-0">{downloadError}</p>}
        </div>
    )
}
