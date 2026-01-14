import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Hook phát hiện và chặn DevTools
 * Kết hợp nhiều phương pháp: console trick, window size, debugger, keyboard
 */
export function useDevToolsBlocker() {
    const [isOpen, setIsOpen] = useState(false);
    const threshold = 160;
    const emitLimit = useRef(false);

    const onDevToolsOpen = useCallback(() => {
        if (!emitLimit.current) {
            emitLimit.current = true;
            setIsOpen(true);
            // Clear sensitive data
            sessionStorage.clear();
            localStorage.removeItem("listOutput");
        }
    }, []);

    useEffect(() => {
        // Method 1: Console trick (khi DevTools mở, console.log sẽ trigger getter)
        const element = new Image();
        Object.defineProperty(element, 'id', {
            get: function () {
                onDevToolsOpen();
                return '';
            }
        });

        // Check periodically
        const consoleCheck = setInterval(() => {
            console.log('%c', element);
            console.clear();
        }, 1000);

        // Method 2: Debugger statement (sẽ pause nếu DevTools mở)
        const debuggerCheck = setInterval(() => {
            const start = performance.now();
            debugger;
            const end = performance.now();
            // Nếu debugger bị pause > 100ms thì DevTools đang mở
            if (end - start > 100) {
                onDevToolsOpen();
            }
        }, 1000);

        // Method 3: Window size difference
        const checkWindowSize = () => {
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;
            if (widthThreshold || heightThreshold) {
                onDevToolsOpen();
            }
        };

        const resizeCheck = setInterval(checkWindowSize, 500);
        window.addEventListener('resize', checkWindowSize);

        // Method 4: Block keyboard shortcuts
        const handleKeyDown = (e) => {
            // F12
            if (e.key === 'F12') {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
            if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            // Ctrl+U (View Source)
            if (e.ctrlKey && e.key.toUpperCase() === 'U') {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        };

        // Method 5: Block right click
        const handleContextMenu = (e) => {
            e.preventDefault();
            return false;
        };

        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('contextmenu', handleContextMenu);

        return () => {
            clearInterval(consoleCheck);
            clearInterval(debuggerCheck);
            clearInterval(resizeCheck);
            window.removeEventListener('resize', checkWindowSize);
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [onDevToolsOpen]);

    return { isDevToolOpen: isOpen };
}
