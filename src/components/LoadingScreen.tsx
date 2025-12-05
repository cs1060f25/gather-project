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

// Generate stars data
const generateStars = (count: number) => {
    const stars = [];
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * 360;
        const duration = 5000 + Math.random() * 10000;
        const fadeStart = Math.random() * 30;
        const size = Math.random() > 0.5 ? 2 : 1;
        // Add depth for parallax effect (0.2 to 1.0)
        const depth = 0.2 + Math.random() * 0.8;
        stars.push({ angle, duration, fadeStart, size, depth, id: i });
    }
    return stars;
};

const starsData = generateStars(200);

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
            {/* Galaxy background */}
            <div className="galaxy">
                <div className="galaxy-layer layer-1" />
                <div className="galaxy-layer layer-2" />
                <div className="galaxy-layer layer-3" />
            </div>

            {/* Stars Animation */}
            <div 
                className="stars-container"
                style={{
                    transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -15}px)`,
                    transition: 'transform 0.1s ease-out'
                }}
            >
                {starsData.map((star) => {
                    // Parallax offset based on mouse and star depth
                    const parallaxX = mousePos.x * 30 * star.depth;
                    const parallaxY = mousePos.y * 30 * star.depth;
                    
                    return (
                        <span
                            key={star.id}
                            className="star"
                            style={{
                                width: `${star.size}px`,
                                height: `${star.size}px`,
                                left: '50%',
                                top: '50%',
                                animationName: `starMove${star.id}, starFade${star.id}`,
                                animationDuration: `${star.duration}ms, ${star.duration}ms`,
                                animationDelay: '-3s, -3s',
                                marginLeft: `${parallaxX}px`,
                                marginTop: `${parallaxY}px`,
                            }}
                        />
                    );
                })}
            </div>
            
            {/* Inject keyframes for stars */}
            <style>
                {starsData.map((star) => {
                    const radians = (star.angle * Math.PI) / 180;
                    const endX = 80 * Math.cos(radians);
                    const endY = 80 * Math.sin(radians);
                    const fadeStart = star.fadeStart;
                    const fadeEnd = fadeStart + 15;
                    
                    return `
                        @keyframes starMove${star.id} {
                            0% { transform: translate(0, 0); }
                            100% { transform: translate(${endX}vw, ${endY}vh); }
                        }
                        @keyframes starFade${star.id} {
                            0% { opacity: 0; }
                            ${fadeStart}% { opacity: 0; }
                            ${fadeEnd}% { opacity: 0.8; }
                            100% { opacity: 0.8; }
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
