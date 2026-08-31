import LinkIcon from '@/componenets/icons/LinkIcon'
import SearchIcon from '@/componenets/icons/SearchIcon'
import UnderlineInputBox from '@/componenets/UnderlineInputBox'
import { useMainStore } from '../store/useMainStore'
import { extractVideoId } from '../utils'

export default function UrlInputBar() {
    const inputValue = useMainStore((state) => state.inputValue)
    const infoLoading = useMainStore((state) => state.infoLoading)
    const setInputValue = useMainStore((state) => state.setInputValue)
    const search = useMainStore((state) => state.search)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setInputValue(value)
        const id = extractVideoId(value)
        if (id) {
            search(id)
        }
    }

    return (
        <div className="w-full h-8">
            <UnderlineInputBox
                frontIcon={
                    <div className="h-full">
                        <LinkIcon fillColor="var(--color-text-primary)" />
                    </div>
                }
                backIcon={
                    <button className="h-full" onClick={() => search()} disabled={infoLoading}>
                        <SearchIcon fillColor="var(--color-text-primary)" />
                    </button>
                }
                textColor="var(--color-text-primary)"
                placeholder="Put your youtube url here"
                autoFocus
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && search()}
            />
        </div>
    )
}
