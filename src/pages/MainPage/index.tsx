import UrlInputBar from '@/components/UrlInputBar'
import VideoPreview from '@/components/VideoPreview'
import ModeTabs from '@/components/ModeTabs'
import StreamSettings from '@/components/StreamSettings'
import StatusTimeline from '@/components/StatusTimeline'
import DownloadSection from '@/components/DownloadSection'
import { useDownloadPolling } from '@/hooks/useDownloadPolling'
import { useMainStore } from '@/store/useMainStore'

export default function MainPage() {
    useDownloadPolling()
    const info = useMainStore((state) => state.info)
    const infoError = useMainStore((state) => state.infoError)

    return (
        <div className="flex flex-col items-center min-h-screen">
            <header className="w-full pt-10 pb-8">
                <h1 className="text-center font-futura text-text-bright font-semibold tracking-widest text-4xl m-0">lwyd</h1>
            </header>

            <div className="flex flex-col gap-5 w-full max-w-xl px-4 pb-10">
                <UrlInputBar />
                {infoError && <p className="text-primary-300 text-sm m-0">{infoError}</p>}
                <VideoPreview />

                <div className={`flex flex-col gap-5 ${info ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    <ModeTabs />
                    <StreamSettings />
                </div>

                <StatusTimeline />
                <DownloadSection />
            </div>
        </div>
    )
}
