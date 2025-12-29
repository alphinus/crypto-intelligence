"use client";

import React from "react";

export function VignetteOverlay() {
    return (
        <div
            className="pointer-events-none fixed inset-0 z-50 h-screen w-full"
            style={{
                background: `
          linear-gradient(to bottom, 
            var(--background) 0%, 
            rgba(255, 255, 255, 0) 15%, 
            rgba(255, 255, 255, 0) 85%, 
            var(--background) 100%
          )
        `,
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
                maskImage: `
          linear-gradient(to bottom, 
            black 0%, 
            transparent 15%, 
            transparent 85%, 
            black 100%
          )
        `,
                WebkitMaskImage: `
          linear-gradient(to bottom, 
            black 0%, 
            transparent 15%, 
            transparent 85%, 
            black 100%
          )
        `,
            }}
        />
    );
}
