import UnderlineBox from '@/componenets/UnderlineBox'
import { useState } from 'react'
import * as React from 'react'

type UnderlineInputBox = {
    frontIcon?: React.ReactNode
    backIcon?: React.ReactNode
    placeholder?: string
    textColor: string
    onChange?: (event: React.ChangeEvent<HTMLInputElement, HTMLInputElement>) => void
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
}

export default function UnderlineInputBox({
    frontIcon,
    backIcon,
    placeholder,
    textColor,
    onChange,
    onKeyDown,
}: UnderlineInputBox) {
    const [focused, setFocused] = useState(false)

    return (
        <UnderlineBox isFocused={focused}>
            <div className="flex size-full gap-4 items-center">
                <div className="h-full">{frontIcon}</div>
                <input
                    className="flex-1"
                    style={{ color: textColor }}
                    placeholder={placeholder}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                />
                <div className="h-full">{backIcon}</div>
            </div>
        </UnderlineBox>
    )
}
