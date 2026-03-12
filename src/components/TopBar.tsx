import { useState, useEffect } from "react";

export const TopBar = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [isRendered, setIsRendered] = useState(true);

    useEffect(() => {
        const isClosed = localStorage.getItem("topBarClosed");
        if (isClosed === "true") {
            setIsVisible(false);
            setIsRendered(false);
        }
    }, []);

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
            className={`bg-primary text-primary-foreground transition-all duration-300 ease-in-out origin-top ${isVisible ? "translate-y-0 max-h-16 opacity-100" : "-translate-y-full max-h-0 opacity-0"
                }`}
        >
            <div className="container mx-auto px-4 py-2 flex justify-center items-center w-full min-h-[32px] overflow-hidden">
                <div className="flex items-center gap-4">
                    <p className="text-xs sm:text-sm font-medium uppercase tracking-wide text-center">
                        ENTREGA EL MISMO DÍA EN CABA Y GBA SI PEDÍS ANTES DE LAS 14:00 HS
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
