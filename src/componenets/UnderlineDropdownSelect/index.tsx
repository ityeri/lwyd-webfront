import UnderlineBox from '@/componenets/UnderlineBox'
import {AnimatePresence, motion} from 'framer-motion'
import * as React from 'react'
import {useEffect, useRef, useState} from 'react'
import {autoUpdate, flip, offset, shift, useFloating, useMergeRefs} from "@floating-ui/react";

type UnderlineDropdownSelect = {
    frontIcon?: React.ReactNode
    backIcon?: React.ReactNode
    textColor: string
    placeholder?: string
    defaultValue?: string
    maxHeight: string
    elements: Record<string, React.ReactNode>
    onSelect?: (key: string) => void
}

export default function UnderlineDropdownSelect({
    frontIcon,
    backIcon,
    textColor,
    placeholder,
    defaultValue,
    maxHeight,
    elements,
    onSelect = () => {}
}: UnderlineDropdownSelect) {
    const [focused, setFocused] = useState(false)
    const [inputValue, setInputValue] = useState(defaultValue ?? '')
    const [selectedValue, setSelectedValue] = useState<string | null>(null)
    const inputElementRef = useRef<HTMLInputElement | null>(null)
    const highlightElementRef = useRef<HTMLButtonElement | null>(null)
    const {refs, floatingStyles, isPositioned, placement} = useFloating({
        open: focused,
        onOpenChange: setFocused,
        placement: 'bottom-start',
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(10),
            flip(),
            shift(),
        ]
    })
    const referencedRef = useMergeRefs([refs.setReference]);
    const floatingRef = useMergeRefs([refs.setFloating]);

    const [prevPositioned, setPrevPositioned] = useState(false)
    useEffect(() => {
        if (prevPositioned != isPositioned) {
            setTimeout(() => {
                setPrevPositioned(isPositioned)
            }, 10)
        }
    }, [prevPositioned, isPositioned]);

    const [prevDefault, setPrevDefault] = useState(defaultValue)
    if (defaultValue !== prevDefault) {
        setPrevDefault(defaultValue)
        setInputValue(defaultValue ?? '')
        setSelectedValue(defaultValue ?? null)
    }

    const selectElement = (key: string) => {
        setInputValue(key)
        setSelectedValue(key)
        onSelect(key)
    }

    // Show all options unless the user is actually typing a filter.
    const isFiltering = inputValue !== selectedValue
    const displayElements = Object.keys(elements).filter((key) =>
        isFiltering ? key.includes(inputValue) : true,
    )
    const [highlightIndex, setHighlightIndex] = useState<number | null>(null)

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            setHighlightIndex(
                highlightIndex !== null
                    ? highlightIndex < displayElements.length - 1
                        ? highlightIndex + 1
                        : 0
                    : 0,
            )
        } else if (e.key === 'ArrowUp') {
            setHighlightIndex(
                highlightIndex !== null
                    ? 0 < highlightIndex
                        ? highlightIndex - 1
                        : displayElements.length - 1
                    : displayElements.length - 1,
            )
        } else if (e.key === 'Enter') {
            if (highlightIndex !== null) {
                selectElement(displayElements[highlightIndex])
                inputElementRef.current!.blur()
            } else {
                const topElement = displayElements[0]
                if (topElement != undefined) {
                    selectElement(topElement)
                    inputElementRef.current!.blur()
                }
            }
        } else if (e.key === 'Escape') {
            inputElementRef.current!.blur()
        }
    }

    useEffect(() => {
        if (highlightElementRef.current)
            highlightElementRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            })
    })

    // Reveal by cropping from the anchor edge: bottom placement opens downward,
    // flipped (top) placement opens upward.
    const opensDownward = placement.startsWith('bottom')
    const closedClipPath = opensDownward ? 'inset(0% 0% 100% 0%)' : 'inset(100% 0% 0% 0%)'

    return (
        <div className="relative size-full">
            <UnderlineBox isFocused={focused} ref={referencedRef}>
                <div className="flex size-full gap-4">
                    <div className="h-full">{frontIcon}</div>
                    <input
                        key={selectedValue}
                        ref={inputElementRef}
                        className="flex-1 h-full min-w-0"
                        style={{ color: textColor }}
                        placeholder={placeholder}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="h-full">{backIcon}</div>
                </div>
            </UnderlineBox>

            <AnimatePresence>
                {focused && (
                    <motion.div
                        className="
                        absolute
                        left-0 top-0
                        flex flex-col
                        w-full
                        bg-background-secondary
                        rounded-lg overflow-y-hidden
                        shadow-lg
                        z-10
                        "
                        ref={floatingRef}
                        style={{
                            maxHeight: maxHeight,
                        }}
                        transition={{
                            clipPath: {
                                duration: 0.25,
                                ease: [0.16, 1, 0.3, 1]
                            },
                            transform: {
                                duration: isPositioned && prevPositioned ? 0.2 : 0,
                                ease: [0.16, 1, 0.3, 1]
                            }
                        }}
                        animate={{
                            transform: floatingStyles.transform,
                            clipPath: 'inset(0% 0% 0% 0%)',
                        }}
                        initial={{
                            clipPath: closedClipPath,
                        }}
                        exit={{
                            clipPath: closedClipPath,
                        }}
                    >
                        <div
                            className="flex flex-col flex-1 overflow-y-scroll"
                            tabIndex={-1}
                        >
                            {displayElements.map((key, index) => {
                                return (
                                    <button
                                        className={`
                                    shrink-0
                                    h-11 w-full px-5
                                    ${index == highlightIndex && 'bg-background-hover'}
                                    hover:bg-background-hover duration-150
                                    `}
                                        tabIndex={-1}
                                        onClick={() => selectElement(key)}
                                        ref={
                                            index == highlightIndex
                                                ? highlightElementRef
                                                : undefined
                                        }
                                    >
                                        {elements[key]}
                                    </button>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
