import React, { useRef, useState, useEffect, useCallback } from 'react';
import './Sketchpad.css';

interface SketchpadProps {
    onTranscript: (text: string) => void;
    onClose: () => void;
}

export const Sketchpad: React.FC<SketchpadProps> = ({ onTranscript, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sketchpadRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [pencilPos, setPencilPos] = useState({ x: -100, y: -100 });
    const [pencilRotation, setPencilRotation] = useState({ x: 0, y: 0 });
    const [isOverPaper, setIsOverPaper] = useState(false);
    const lastPosRef = useRef<{ x: number; y: number } | null>(null);

    // Initialize canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const sketchpad = sketchpadRef.current;
        if (!canvas || !sketchpad) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Size canvas to sketchpad
        const updateSize = () => {
            const rect = sketchpad.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            // White background
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };
        
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Track mouse globally for pencil position
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const wW = window.innerWidth;
            const wH = window.innerHeight;
            
            setPencilPos({ x: e.clientX, y: e.clientY });
            
            // Calculate rotation based on position (like CodePen)
            const rangeX = (e.clientX / wW) - 0.5;
            const rangeY = (e.clientY / wH) - 0.5;
            setPencilRotation({
                x: rangeY * 20,
                y: rangeX * 60
            });

            // Check if over paper
            const sketchpad = sketchpadRef.current;
            if (sketchpad) {
                const rect = sketchpad.getBoundingClientRect();
                const over = e.clientX >= rect.left && e.clientX <= rect.right &&
                            e.clientY >= rect.top && e.clientY <= rect.bottom;
                setIsOverPaper(over);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const getCanvasPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
        const sketchpad = sketchpadRef.current;
        if (!sketchpad) return null;

        const rect = sketchpad.getBoundingClientRect();
        
        if ('touches' in e) {
            const touch = e.touches[0] || e.changedTouches[0];
            return {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
        }
        
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const pos = getCanvasPos(e);
        if (!pos) return;
        
        e.preventDefault();
        setIsDrawing(true);
        setHasDrawn(true);
        lastPosRef.current = pos;
        
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        
        const pos = getCanvasPos(e);
        if (!pos) return;
        
        e.preventDefault();

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || !lastPosRef.current) return;

        // Pencil-like stroke
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        lastPosRef.current = pos;
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        lastPosRef.current = null;
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
    };

    const sendToOpenAI = useCallback(async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setIsProcessing(true);

        try {
            const imageData = canvas.toDataURL('image/png');
            const base64Image = imageData.split(',')[1];

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || ''}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        {
                            role: 'system',
                            content: 'Read the handwritten text in this image and transcribe it as a scheduling request. Output ONLY the transcribed text, nothing else.'
                        },
                        {
                            role: 'user',
                            content: [
                                { type: 'text', text: 'Transcribe this handwriting:' },
                                { type: 'image_url', image_url: { url: `data:image/png;base64,${base64Image}` } }
                            ]
                        }
                    ],
                    max_tokens: 200,
                }),
            });

            if (!response.ok) throw new Error('Failed');

            const data = await response.json();
            const text = data.choices?.[0]?.message?.content?.trim() || '';
            
            if (text) {
                onTranscript(text);
                onClose();
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to read handwriting.');
        } finally {
            setIsProcessing(false);
        }
    }, [onTranscript, onClose]);

    return (
        <div id="sketch-wrapper">
            <div id="sketch-bg"></div>
            
            <div 
                id="sketchpad" 
                ref={sketchpadRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            >
                <canvas ref={canvasRef} id="sketch-canvas"></canvas>
            </div>

            {/* 3D Pencil - like CodePen */}
            <div 
                id="pencil-container"
                style={{
                    left: pencilPos.x,
                    top: pencilPos.y,
                }}
            >
                <div 
                    id="pencil3D"
                    className={isDrawing ? 'drawing' : ''}
                    style={{
                        transform: `
                            rotateX(${pencilRotation.x}deg)
                            rotateY(${pencilRotation.y}deg)
                            rotateZ(-35deg)
                            translateY(${isDrawing ? 0 : -10}px)
                        `
                    }}
                >
                    <div className="pencil-eraser"></div>
                    <div className="pencil-ferrule"></div>
                    <div className="pencil-body">
                        <div className="pencil-face front"></div>
                        <div className="pencil-face back"></div>
                        <div className="pencil-face left"></div>
                        <div className="pencil-face right"></div>
                        <div className="pencil-face top"></div>
                        <div className="pencil-face bottom"></div>
                    </div>
                    <div className="pencil-tip">
                        <div className="tip-wood"></div>
                        <div className="tip-graphite"></div>
                    </div>
                </div>
                
                {/* Shadow */}
                <div 
                    id="pencil-shadow"
                    style={{
                        opacity: isOverPaper ? (isDrawing ? 0.5 : 0.25) : 0.1,
                        transform: `scale(${isDrawing ? 0.6 : 1}) translateY(${isDrawing ? 5 : 20}px)`
                    }}
                ></div>
            </div>

            {/* Controls */}
            <div id="sketch-controls">
                <button onClick={clearCanvas} disabled={isProcessing} className="sketch-btn">
                    Erase
                </button>
                <button 
                    onClick={sendToOpenAI} 
                    disabled={!hasDrawn || isProcessing}
                    className="sketch-btn primary"
                >
                    {isProcessing ? 'Reading...' : 'Send'}
                </button>
                <button onClick={onClose} className="sketch-btn close">
                    ✕
                </button>
            </div>
        </div>
    );
};
