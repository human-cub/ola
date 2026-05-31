import { useState, useEffect } from "react";

const TOP_BAR_HEIGHT = 48;

const MESSAGES = [
  "ENVÍO GRATIS EN CABA!",
  "ENTREGA EL MISMO DÍA EN CABA Y GBA SI PEDÍS ANTES DE LAS 14:00 HS",
];

export const TopBar = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [isRendered, setIsRendered] = useState(true);
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const isClosed = localStorage.getItem("topBarClosed");
        if (isClosed === "true") {
            setIsVisible(false);
            setIsRendered(false);
        }
    }, []);

    useEffect(() => {
        document.documentElement.style.paddingTop = isVisible ? `${TOP_BAR_HEIGHT}px` : "0px";

        return () => {
            document.documentElement.style.paddingTop = "0px";
        };
    }, [isVisible]);

    useEffect(() => {
        if (!isRendered) return;
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [isRendered]);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem("topBarClosed", "true");
        setTimeout(() => {
            setIsRendered(false);
        }, 300); // Wait for transition to finish
    };

    if (!isRendered) return null;

    return (
        <div
            className={`bg-primary text-primary-foreground transition-all duration-300 ease-in-out origin-top ${isVisible ? "translate-y-0 max-h-[48px] opacity-100" : "-translate-y-full max-h-0 opacity-0"
                }`}
        >
            <div className="container mx-auto px-4 py-2 flex justify-center items-center w-full h-[48px] overflow-hidden">
                <div className="flex items-center gap-4">
                    <p
                        key={messageIndex}
                        className="text-xs sm:text-sm font-medium uppercase tracking-wide text-center animate-fade-in"
                    >
                        {MESSAGES[messageIndex]}
                    </p>
                    <button
                        onClick={handleClose}
                        className="text-white hover:text-white/70 transition-colors flex-shrink-0 flex items-center justify-center"
                        aria-label="Cerrar"
                    >
                        <span className="text-2xl leading-none">&times;</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
