import AudioIcon from '@/componenets/icons/AudioIcon'
import LinkIcon from '@/componenets/icons/LinkIcon'
import SearchIcon from '@/componenets/icons/SearchIcon'
import VideoIcon from '@/componenets/icons/VideoIcon'
import UnderlineDropdownSelect from '@/componenets/UnderlineDropdownSelect'
import UnderlineInputBox from '@/componenets/UnderlineInputBox'
import {useState} from 'react'
import InfoIcon from '@/componenets/icons/InfoIcon'
import YouTubeVideoParms from "@/componenets/YouTubeVideo";
import LoadingBar from "@/componenets/LoadingBar"

export default function MainPage() {
    const [inputValue, setInputValue] = useState('')

    const [videoLoaded, setVideoLoaded] = useState(false)
    const [videoUrl, setVideoUrl] = useState<string | null>(null)
    const [videoId, setVideoId] = useState<string | null>(null)

    const [loadingStatus, setLoadingStatus] = useState<'loading' | 'progress'>('progress')
    const [currentProgress, setCurrentProgress] = useState(0.5)

    const [selectedVideoQuality, setVideoQuality] = useState<string | null>(null)
    const [selectedAudioQuality, setAudioQuality] = useState<string | null>(null)
    const [selectedFileFormat, setFileFormat] = useState<string | null>(null)

    const handleVideoQualitySelect = (key: string) => setVideoQuality(key)
    const handleAudioQualitySelect = (key: string) => setAudioQuality(key)
    const handleFileFormatSelect = (key: string) => setFileFormat(key)

    const videoResolutions = [
        'No video',
        '480 320',
        '640 480',
        '1024 768',
        '1280 800',
        '1440 900',
        '2460 1200',
        '4560 2400'
    ]
    const audioResolutions = [
        'No audio',
        '32kbps',
        '64kbps',
        '96kbps',
        '128kbps',
        '160kbps',
        '192kbps',
        '216kbps'
    ]
    const fileFormats = [
        'mp4',
        'mp3',
        'wav',
        'mkv',
        'ogg',
        'flac',
        'mov'
    ]

    return (
        <div className="flex justify-center">
            <div className="flex flex-col gap-5 w-1/2 min-w-[min(100%,500px)] p-4 pt-[10vh]">
                <div className="w-full aspect-video bg-background-secondary rounded-2xl overflow-hidden">
                    {videoId && <YouTubeVideoParms videoId="bphk5T74dBI" />}
                </div>

                <div className="relative w-full h-2 bg-background-secondary rounded-full overflow-hidden">
                    <LoadingBar
                        type={loadingStatus}
                        progress={currentProgress}
                    />
                </div>

                <div className="w-full h-8">
                    <UnderlineInputBox
                        frontIcon={
                            <div className="h-full">
                                <LinkIcon fillColor="var(--color-text-primary)" />
                            </div>
                        }
                        backIcon={
                            <button className="h-full" onClick={() => {
                                setVideoUrl(inputValue)
                                setVideoLoaded(true)
                            }}>
                                <SearchIcon fillColor="var(--color-text-primary)" />
                            </button>
                        }
                        textColor="var(--color-text-primary)"
                        placeholder="Put your youtube url here"
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                </div>

                <div
                    className={`
                    flex flex-col gap-5
                    ${videoLoaded ? 'opacity-100' : 'opacity-30 pointer-events-none'}
                    duration-150
                    `}
                >
                    <div className="flex gap-4 h-8">
                        <UnderlineDropdownSelect
                            textColor="var(--color-text-primary)"
                            frontIcon={
                                <VideoIcon fillColor="var(--color-text-primary)" />
                            }
                            elements={Object.fromEntries(
                                videoResolutions.map((resolution) => {
                                    return [
                                        resolution,
                                        <li className="ml-4">{resolution}</li>
                                    ]
                                }),
                            )}
                            maxHeight="10rem"
                            placeholder="Video resolution here"
                            onSelect={handleVideoQualitySelect}
                        />
                        <UnderlineDropdownSelect
                            textColor="var(--color-text-primary)"
                            frontIcon={
                                <AudioIcon fillColor="var(--color-text-primary)" />
                            }
                            elements={Object.fromEntries(
                                audioResolutions.map((resolution) => {
                                    return [
                                        resolution,
                                        <li className="ml-4">{resolution}</li>
                                    ]
                                }),
                            )}
                            maxHeight="10rem"
                            placeholder="Audio resolution here"
                            onSelect={handleAudioQualitySelect}
                        />
                    </div>

                    <div className="w-full h-8">
                        <UnderlineDropdownSelect
                            textColor="var(--color-text-primary)"
                            frontIcon={
                                <div className="h-full aspect-square overflow-hidden">
                                    <InfoIcon fillColor="var(--color-text-primary)" />
                                </div>
                            }
                            elements={Object.fromEntries(
                                fileFormats.map((fileFormat) => {
                                    return [
                                        fileFormat,
                                        <li className="ml-4">{fileFormat}</li>
                                    ]
                                })
                            )}
                            maxHeight="10rem"
                            placeholder="File format & codec here"
                            onSelect={handleFileFormatSelect}
                        />
                    </div>
                </div>

                <button
                    className={`
                    w-full
                    h-8
                    ${
                        selectedVideoQuality && selectedAudioQuality && selectedFileFormat
                            ? 'bg-linear-to-r from-primary-425 via-primary-575 to-primary-750 '
                            : 'bg-background-secondary opacity-30 pointer-events-none'
                    }
                    duration-150
                    rounded-full
                    text-center
                    text-text-bright
                    font-thin
                    `}
                >
                    Download
                </button>
            </div>
        </div>
    )
}
