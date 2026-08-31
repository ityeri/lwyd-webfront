import YouTubeVideo from '@/components/YouTubeVideo'
import LoadingBar from '@/components/LoadingBar'
import { useMainStore } from '../store/useMainStore'

export default function VideoPreview() {
    const videoId = useMainStore((state) => state.videoId)
    const info = useMainStore((state) => state.info)
    const infoLoading = useMainStore((state) => state.infoLoading)
    const infoError = useMainStore((state) => state.infoError)

    const searching = videoId !== null && !infoLoading && info === null && infoError === null

    return (
        <div className="relative w-full aspect-video bg-background-secondary rounded-2xl overflow-hidden">
            {videoId && info && (
                <div className="absolute inset-0">
                    <YouTubeVideo videoId={videoId} />
                </div>
            )}
            {(infoLoading || searching) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-10">
                    <p className="text-text-primary text-base m-0">loading...</p>
                    <div className="w-1/2 h-1 bg-background-primary rounded-full overflow-hidden">
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
    )
}
