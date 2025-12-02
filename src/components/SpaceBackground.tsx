import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const SpaceBackground: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<{
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        cameraGroup: THREE.Group;
        objects: any[];
        starField: THREE.Points;
        clock: THREE.Clock;
        mouseX: number;
        mouseY: number;
    } | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        
        // Scene setup
        const scene = new THREE.Scene();
        const darkSpace = new THREE.Color(0x050510);
        scene.background = darkSpace;
        scene.fog = new THREE.Fog(darkSpace, 40, 110);

        // Camera
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
        camera.position.set(0, 0, 20);

        const cameraGroup = new THREE.Group();
        cameraGroup.add(camera);
        scene.add(cameraGroup);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ReinhardToneMapping;
        renderer.toneMappingExposure = 1.3;
        container.appendChild(renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        sunLight.position.set(10, 20, 10);
        scene.add(sunLight);

        const fillLight = new THREE.DirectionalLight(0x8888ff, 0.8);
        fillLight.position.set(-10, -10, -10);
        scene.add(fillLight);

        // Shapes data
        const SHAPES = [
            [[0,0,1,1,1,0,0],[0,1,1,1,1,1,0],[1,1,1,1,1,1,1],[1,1,0,1,1,0,1],[1,1,1,1,1,1,1],[0,1,0,1,0,1,0]], // ghost
            [[0,0,1,1,1,0,0],[0,1,1,1,1,1,0],[1,1,1,1,1,0,0],[1,1,1,1,0,0,0],[1,1,1,1,1,0,0],[0,1,1,1,1,1,0],[0,0,1,1,1,0,0]], // pacman
            [[0,0,0,1,0,0,0],[0,0,1,1,1,0,0],[0,1,1,1,1,1,0],[1,1,1,1,1,1,1],[1,0,1,0,1,0,1]], // invader
            [[1,1,1],[0,1,0]], // T tetris
            [[1,0],[1,0],[1,1]], // L tetris
            [[1,1,0],[0,1,1]], // Z tetris
            [[1],[1],[1],[1]], // I tetris
        ];

        const vibrantColors = [
            0x00ffcc, 0xff00aa, 0x8800ff, 0xffaa00,
            0x0088ff, 0xffee00, 0xff3333, 0x00ff44, 0xffffff
        ];

        // Create voxel model
        const createVoxelModel = (matrix: number[][], color: number) => {
            const group = new THREE.Group();
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.3,
                roughness: 0.3,
                metalness: 0.1
            });

            const height = matrix.length;
            const width = matrix[0].length;

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (matrix[y][x] === 1) {
                        const cube = new THREE.Mesh(geometry, material);
                        cube.position.set(x - width / 2, (height - y) - height / 2, 0);
                        group.add(cube);
                    }
                }
            }

            group.userData.baseRadius = Math.max(width, height) / 2 * 1.5;
            return group;
        };

        // Reset object position
        const resetObjectPosition = (obj: THREE.Group, randomZ = false) => {
            obj.position.x = (Math.random() - 0.5) * 90;
            obj.position.y = (Math.random() - 0.5) * 60;
            obj.position.z = randomZ ? Math.random() * -70 - 80 : -150;
            const scale = Math.random() * 0.6 + 0.4;
            obj.scale.set(scale, scale, scale);
        };

        // Create floating objects
        const floatingObjects: any[] = [];
        for (let i = 0; i < 50; i++) {
            const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            const color = vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
            const obj = createVoxelModel(shape, color);
            resetObjectPosition(obj, true);
            scene.add(obj);

            floatingObjects.push({
                mesh: obj,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() * 0.2 + 0.1) * 2
                ),
                rotSpeed: (Math.random() - 0.5) * 0.02,
                floatOffset: Math.random() * Math.PI * 2
            });
        }

        // Stars
        const starsGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(1500 * 3);
        for (let i = 0; i < 1500 * 3; i++) {
            starPos[i] = (Math.random() - 0.5) * 600;
        }
        starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starsMat = new THREE.PointsMaterial({
            color: 0xaaaaaa, size: 0.4, transparent: true, opacity: 0.6
        });
        const starField = new THREE.Points(starsGeo, starsMat);
        scene.add(starField);

        const clock = new THREE.Clock();

        sceneRef.current = {
            scene, camera, renderer, cameraGroup, objects: floatingObjects, starField, clock,
            mouseX: 0, mouseY: 0
        };

        // Mouse tracking
        const handleMouseMove = (e: MouseEvent) => {
            if (sceneRef.current) {
                sceneRef.current.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
                sceneRef.current.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
            }
        };
        document.addEventListener('mousemove', handleMouseMove);

        // Animation
        let animationId: number;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            if (!sceneRef.current) return;

            const { objects, starField, cameraGroup, mouseX, mouseY } = sceneRef.current;
            const time = clock.getElapsedTime();

            objects.forEach(item => {
                item.mesh.position.add(item.velocity);
                item.mesh.rotation.y += item.rotSpeed;
                item.mesh.rotation.x = Math.sin(time * 0.5 + item.floatOffset) * 0.15;

                if (item.mesh.position.z > 20) {
                    resetObjectPosition(item.mesh, false);
                    item.velocity.set(
                        (Math.random() - 0.5) * 0.1,
                        (Math.random() - 0.5) * 0.1,
                        Math.random() * 0.2 + 0.2
                    );
                }
            });

            starField.position.z += 0.5;
            if (starField.position.z > 200) starField.position.z = 0;

            cameraGroup.rotation.y += (mouseX * 0.3 - cameraGroup.rotation.y) * 0.02;
            cameraGroup.rotation.x += (mouseY * 0.2 - cameraGroup.rotation.x) * 0.02;

            renderer.render(scene, camera);
        };
        animate();

        // Resize
        const handleResize = () => {
            if (!sceneRef.current) return;
            const { camera, renderer } = sceneRef.current;
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            document.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            container.removeChild(renderer.domElement);
        };
    }, []);

    return <div ref={containerRef} id="space-bg-container" />;
};

