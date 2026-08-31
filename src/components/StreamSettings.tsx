import AudioIcon from '@/components/icons/AudioIcon'
import InfoIcon from '@/components/icons/InfoIcon'
import VideoIcon from '@/components/icons/VideoIcon'
import UnderlineDropdownSelect from '@/components/UnderlineDropdownSelect'
import { motion } from 'framer-motion'
import { AudioCodec, AUDIO_CONTAINERS, Container, Mode, VIDEO_CONTAINERS, VideoCodec } from '../enums'
import { useMainStore } from '../store/useMainStore'
import { audioCodecFamily, uniqueSorted, videoCodecFamily } from '../utils'

function DropdownOption({ value }: { value: string }) {
    return <span className="ml-4">{value}</span>
}

export default function StreamSettings() {
    const info = useMainStore((state) => state.info)
    const mode = useMainStore((state) => state.mode)
    const videoResolution = useMainStore((state) => state.videoResolution)
    const videoCodec = useMainStore((state) => state.videoCodec)
    const audioBitrate = useMainStore((state) => state.audioBitrate)
    const audioCodec = useMainStore((state) => state.audioCodec)
    const container = useMainStore((state) => state.container)
    const setVideoResolution = useMainStore((state) => state.setVideoResolution)
    const setVideoCodec = useMainStore((state) => state.setVideoCodec)
    const setAudioBitrate = useMainStore((state) => state.setAudioBitrate)
    const setAudioCodec = useMainStore((state) => state.setAudioCodec)
    const setContainer = useMainStore((state) => state.setContainer)

    if (!info) return null

    const videoResolutions = uniqueSorted(info.video_streams.map((stream) => stream.resolution))
    const videoCodecs = uniqueSorted(info.video_streams.map((stream) => videoCodecFamily(stream.codec ?? '')))
    const audioBitrates = uniqueSorted(info.audio_streams.map((stream) => stream.abr))
    const audioCodecs = uniqueSorted(info.audio_streams.map((stream) => audioCodecFamily(stream.codec ?? '')))
    const containers = mode === Mode.AUDIO ? AUDIO_CONTAINERS : VIDEO_CONTAINERS

    return (
        <div className="flex flex-col gap-5">
            <motion.div
                className="flex gap-4 h-8"
                animate={{ opacity: mode === Mode.AUDIO ? 0.15 : 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={mode === Mode.AUDIO ? { pointerEvents: 'none' } : undefined}
            >
                <UnderlineDropdownSelect
                    textColor="var(--color-text-primary)"
                    frontIcon={<VideoIcon fillColor="var(--color-text-primary)" />}
                    elements={Object.fromEntries(videoResolutions.map((value) => [value, <DropdownOption value={value} />]))}
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
                    elements={Object.fromEntries(videoCodecs.map((value) => [value, <DropdownOption value={value} />]))}
                    maxHeight="10rem"
                    placeholder="Video codec"
                    defaultValue={videoCodec ?? undefined}
                    onSelect={(value) => setVideoCodec(value as VideoCodec)}
                />
            </motion.div>

            <motion.div
                className="flex gap-4 h-8"
                animate={{ opacity: mode === Mode.VIDEO ? 0.15 : 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={mode === Mode.VIDEO ? { pointerEvents: 'none' } : undefined}
            >
                <UnderlineDropdownSelect
                    textColor="var(--color-text-primary)"
                    frontIcon={<AudioIcon fillColor="var(--color-text-primary)" />}
                    elements={Object.fromEntries(audioBitrates.map((value) => [value, <DropdownOption value={value} />]))}
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
                    elements={Object.fromEntries(audioCodecs.map((value) => [value, <DropdownOption value={value} />]))}
                    maxHeight="10rem"
                    placeholder="Audio codec"
                    defaultValue={audioCodec ?? undefined}
                    onSelect={(value) => setAudioCodec(value as AudioCodec)}
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
                    elements={Object.fromEntries(containers.map((value) => [value, <DropdownOption value={value} />]))}
                    maxHeight="10rem"
                    placeholder="File format"
                    defaultValue={container}
                    onSelect={(value) => setContainer(value as Container)}
                />
            </div>
        </div>
    )
}
