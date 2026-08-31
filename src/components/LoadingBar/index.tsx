import {motion} from "framer-motion";

type LoadingBarParams = {
    type: 'progress' | 'loading'
    progress?: number
}

export default function LoadingBar({type, progress = 0}: LoadingBarParams) {
    return <div className="relative size-full bg-background-secondary rounded-full overflow-hidden">
        <motion.div
            className="absolute h-full bg-primary-425"
            animate={
            type == 'loading' ? {
                left: [0, 0, 0, '100%', 0],
                right: [0, '100%', 0, 0, 0]
            } : {
                left: 0,
                width: `${progress * 100}%`
            }
            }

            transition={
            type == 'loading' ? {
                duration: 1.5,
                repeat: Infinity,
                ease: [0.16, 1, 0.3, 1]
            } : {
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1]
            }
            }
        />
    </div>
}