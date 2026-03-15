import { motion } from 'framer-motion'
import * as React from 'react'
import {forwardRef} from "react";

type UnderlineBoxProps = {
    isFocused: boolean
    children: React.ReactNode
}

const UnderlineBox =
    forwardRef<HTMLDivElement, UnderlineBoxProps>((
        {isFocused, children}, ref
    ) => {
        return (
            <div className="relative size-full" ref={ref}>
                <div className="size-full px-1 pb-3">{children}</div>
                <div className="absolute bottom-0 w-full h-0.5 rounded-full bg-text-primary">
                    <motion.div
                        className="h-full bg-primary-425"
                        animate={{ width: isFocused ? '100%' : '0' }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    />
                </div>
            </div>
        )
})

export default UnderlineBox