import { useEffect } from 'react'
import { pollTask, useMainStore } from '../store/useMainStore'

export function useDownloadPolling() {
    const taskId = useMainStore((state) => state.taskId)
    const setTask = useMainStore((state) => state.setTask)

    useEffect(() => {
        if (!taskId) return
        let cancelled = false

        const poll = async () => {
            try {
                const state = await pollTask(taskId)
                if (!cancelled && state) {
                    setTask({
                        status: state.status,
                        progress: state.progress ?? null,
                        error: state.error,
                    })
                }
            } catch (error) {
                if (!cancelled) {
                    setTask({ status: 'ERROR', progress: null, error: error instanceof Error ? error.message : 'Unknown error' })
                }
            }
        }

        poll()
        const interval = setInterval(poll, 1000)
        return () => {
            cancelled = true
            clearInterval(interval)
        }
    }, [taskId, setTask])
}
