import { motion } from 'framer-motion'
import { Mode } from '../enums'
import { useMainStore } from '../store/useMainStore'

const TAB_LABELS: Record<Mode, string> = {
    [Mode.VIDEO]: 'Video only',
    [Mode.AUDIO]: 'Audio only',
    [Mode.BOTH]: 'Both',
}

export default function ModeTabs() {
    const mode = useMainStore((state) => state.mode)
    const setMode = useMainStore((state) => state.setMode)
    const info = useMainStore((state) => state.info)

    if (!info) return null

    const tabIndex = mode === Mode.VIDEO ? 0 : mode === Mode.AUDIO ? 1 : 2

    return (
        <div className="relative">
            <div className="flex gap-6 px-2">
                {([Mode.VIDEO, Mode.AUDIO, Mode.BOTH] as const).map((value) => (
                    <button
                        key={value}
                        onClick={() => setMode(value)}
                        className={`
                        flex-1 h-8 text-sm relative
                        ${mode === value ? 'text-text-bright' : 'text-text-primary'}
                        hover:text-text-bright duration-150
                        `}
                    >
                        {TAB_LABELS[value]}
                    </button>
                ))}
            </div>
            <motion.div
                className="absolute bottom-0 h-0.5 bg-primary-425 rounded-full"
                animate={{
                    left: `${tabIndex * (100 / 3)}%`,
                    width: `${100 / 3}%`,
                    opacity: 1,
                }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            />
            <div className="absolute -bottom-1 left-0 right-0 h-px bg-background-hover" />
        </div>
    )
}
