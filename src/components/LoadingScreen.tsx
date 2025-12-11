import React, { useEffect, useState, useRef } from 'react';
import { GatherlyLogo } from './GatherlyLogo';
import omImage from '../assets/om.png';
import crescentImage from '../assets/crescent.png';
import kanjiImage from '../assets/kanji.png';

interface LoadingScreenProps {
    onComplete: () => void;
}

const greetings = [
    { text: 'Namaste', image: omImage, alt: 'Om Symbol', id: 'namaste' },
    { text: 'Assalamu Alaikum', image: crescentImage, alt: 'Crescent Symbol', id: 'salaam' },
    { text: 'Konnichiwa', image: kanjiImage, alt: 'Kanji Peace Symbol', id: 'konnichiwa' }
];

// Generate stars data for parallax rushing effect
const generateStars = (count: number) => {
    const stars = [];
    const glowColors = ['white', 'green', 'blue', 'purple'];
    
    for (let i = 0; i < count; i++) {
        // Random angle from center (0-360 degrees)
        const angle = Math.random() * 360;
        // Random duration for rushing toward camera
        const duration = 2000 + Math.random() * 4000;
        // Random delay so stars appear at different times
        const delay = Math.random() * 3000;
        // Size varies - starts small, grows as it comes toward you
        const baseSize = 1 + Math.random() * 2;
        // Depth layer (0-1) affects parallax intensity
        const depth = Math.random();
        // Random glow color
        const glowColor = glowColors[Math.floor(Math.random() * glowColors.length)];
        // Starting position (near center)
        const startX = 45 + Math.random() * 10; // 45-55% from left
        const startY = 45 + Math.random() * 10; // 45-55% from top
        
        stars.push({ 
            angle, 
            duration, 
            delay, 
            baseSize, 
            depth, 
            glowColor,
            startX,
            startY,
            id: i 
        });
    }
    return stars;
};

const starsData = generateStars(150);

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isExiting, setIsExiting] = useState(false);
    const [slideState, setSlideState] = useState<'enter' | 'visible' | 'exit'>('enter');
    const [progress, setProgress] = useState(0);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Track mouse movement for parallax effect
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Calculate mouse position relative to center (-1 to 1)
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;
            setMousePos({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        // Smooth progress bar animation
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                return prev + 2;
            });
        }, 60);

        // Billboard-style sliding animations
        // Greeting 1: Namaste (0-1500ms)
        setSlideState('enter');
        const t1 = setTimeout(() => setSlideState('visible'), 80);
        const t2 = setTimeout(() => setSlideState('exit'), 1200);

        // Greeting 2: Salaam (1500-3000ms)
        const t3 = setTimeout(() => {
            setCurrentIndex(1);
            setSlideState('enter');
        }, 1500);
        const t4 = setTimeout(() => setSlideState('visible'), 1580);
        const t5 = setTimeout(() => setSlideState('exit'), 2700);

        // Greeting 3: Konnichiwa (3000-4500ms) - stays visible
        const t6 = setTimeout(() => {
            setCurrentIndex(2);
            setSlideState('enter');
        }, 3000);
        const t7 = setTimeout(() => setSlideState('visible'), 3080);

        // Exit
        const t8 = setTimeout(() => {
            setIsExiting(true);
            onComplete();
        }, 4500);

        return () => {
            [t1, t2, t3, t4, t5, t6, t7, t8].forEach(clearTimeout);
            clearInterval(progressInterval);
        };
    }, [onComplete]);

    const currentGreeting = greetings[currentIndex];

    return (
        <div className={`loading-screen ${isExiting ? 'exit' : ''}`} ref={containerRef}>
            {/* Stars Animation - Parallax rushing toward viewer */}
            <div 
                className="stars-container"
                style={{
                    transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)`,
                    transition: 'transform 0.15s ease-out'
                }}
            >
                {starsData.map((star) => {
                    // Enhanced parallax offset based on mouse and star depth
                    const parallaxX = mousePos.x * 50 * star.depth;
                    const parallaxY = mousePos.y * 50 * star.depth;
                    
                    return (
                        <span
                            key={star.id}
                            className={`star glow-${star.glowColor}`}
                            style={{
                                width: `${star.baseSize}px`,
                                height: `${star.baseSize}px`,
                                left: `${star.startX}%`,
                                top: `${star.startY}%`,
                                animationName: `starRush${star.id}`,
                                animationDuration: `${star.duration}ms`,
                                animationDelay: `${star.delay}ms`,
                                animationIterationCount: 'infinite',
                                marginLeft: `${parallaxX}px`,
                                marginTop: `${parallaxY}px`,
                            }}
                        />
                    );
                })}
            </div>
            
            {/* Inject keyframes for rushing stars */}
            <style>
                {starsData.map((star) => {
                    const radians = (star.angle * Math.PI) / 180;
                    // Stars rush outward from center
                    const endX = 120 * Math.cos(radians);
                    const endY = 120 * Math.sin(radians);
                    // Stars grow as they approach
                    const endSize = star.baseSize * (3 + star.depth * 4);
                    
                    return `
                        @keyframes starRush${star.id} {
                            0% { 
                                transform: translate(0, 0) scale(0.1);
                                opacity: 0;
                            }
                            10% {
                                opacity: 1;
                            }
                            80% {
                                opacity: 1;
                            }
                            100% { 
                                transform: translate(${endX}vw, ${endY}vh) scale(${endSize});
                                opacity: 0;
                            }
                        }
                    `;
                }).join('')}
            </style>

            <div className="loading-center-container">
                <div className="logo-wrapper">
                    <GatherlyLogo animate className="mb-4" />
                    <span className="gatherly-brand-text">gatherly</span>
                </div>

                <div className="greeting-container">
                    <div className={`greeting-wrapper greeting-${slideState} greeting-${currentGreeting.id}`}>
                        <h1 className="greeting-text">
                            {currentGreeting.text}
                        </h1>
                        <img
                            src={currentGreeting.image}
                            alt={currentGreeting.alt}
                            className={`greeting-symbol symbol-${currentGreeting.id}`}
                        />
                    </div>
                </div>
            </div>

            <div className="loading-bar-container">
                <div className="bar"></div>
                <div className="progress" style={{ width: `${progress}%` }}>
                    {progress}%
                </div>
            </div>
        </div>
    );
};
