import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const STAR_COUNT = 1650;
const FIELD_SIZE = 160;
const FIELD_DEPTH = 260;

function StarPoints({ controlRef }) {
  const materialRef = useRef(null);
  const targetColor = useRef(new THREE.Color("#ffb3c6"));
  const currentColor = useRef(new THREE.Color("#ffb3c6"));

  const starData = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3);
    const drift = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = THREE.MathUtils.randFloatSpread(FIELD_SIZE);
      positions[i3 + 1] = THREE.MathUtils.randFloatSpread(FIELD_SIZE);
      positions[i3 + 2] = THREE.MathUtils.randFloat(-FIELD_DEPTH, 10);
      drift[i] = Math.random() * 0.5 + 0.3;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geometry, drift };
  }, []);

  useEffect(() => () => starData.geometry.dispose(), [starData.geometry]);

  useFrame((_, delta) => {
    const c = controlRef.current;
    c.warp += (c.warpTarget - c.warp) * Math.min(1, delta * 3);
    const speed = Math.max(0, c.targetSpeed + c.warp);
    c.currentSpeed += (speed - c.currentSpeed) * Math.min(1, delta * 2.2);
    c.currentOpacity += (c.targetOpacity - c.currentOpacity) * Math.min(1, delta * 2);
    targetColor.current.set(c.targetTint);
    currentColor.current.lerp(targetColor.current, Math.min(1, delta * 2.4));
    if (materialRef.current) {
      materialRef.current.color.copy(currentColor.current);
      materialRef.current.opacity = c.currentOpacity;
    }
    const attr = starData.geometry.attributes.position;
    const pos = attr.array;
    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      pos[i3 + 2] += (c.currentSpeed * 12 + starData.drift[i] * 3) * delta;
      if (pos[i3 + 2] > 14) {
        pos[i3 + 2] = -FIELD_DEPTH;
        pos[i3] = THREE.MathUtils.randFloatSpread(FIELD_SIZE);
        pos[i3 + 1] = THREE.MathUtils.randFloatSpread(FIELD_SIZE);
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <points geometry={starData.geometry}>
      <pointsMaterial ref={materialRef} size={0.28} sizeAttenuation transparent opacity={0.5} depthWrite={false} />
    </points>
  );
}

function OrbMesh({ objectsRef }) {
  const meshRef = useRef(null);
  const matRef = useRef(null);
  const targetColor = useRef(new THREE.Color("#ff8fa3"));

  useFrame(({ clock }, delta) => {
    const cfg = objectsRef.current.orb;
    if (!meshRef.current) return;
    meshRef.current.visible = cfg.visible;
    if (!cfg.visible) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * cfg.pulseSpeed) * 0.06;
    meshRef.current.scale.setScalar(pulse * cfg.scale);
    meshRef.current.rotation.y += delta * 0.22;
    meshRef.current.rotation.x += delta * 0.11;
    meshRef.current.position.set(cfg.x ?? 0, cfg.y ?? 0, cfg.z ?? -5);
    if (matRef.current) {
      targetColor.current.set(cfg.color);
      matRef.current.color.lerp(targetColor.current, Math.min(1, delta * 4));
      matRef.current.emissive.lerp(targetColor.current, Math.min(1, delta * 4));
      matRef.current.emissiveIntensity = cfg.emissiveIntensity;
    }
  });

  return (
    <mesh ref={meshRef} visible={false}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial ref={matRef} roughness={0.28} metalness={0.24} />
    </mesh>
  );
}

function PlanetMesh({ objectsRef }) {
  const meshRef = useRef(null);
  const matRef = useRef(null);
  const targetColor = useRef(new THREE.Color("#ffcdb2"));

  useFrame(({ clock }, delta) => {
    const cfg = objectsRef.current.planet;
    if (!meshRef.current) return;
    meshRef.current.visible = cfg.visible;
    if (!cfg.visible) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * cfg.pulseSpeed) * 0.04;
    meshRef.current.scale.setScalar(pulse * cfg.scale);
    meshRef.current.rotation.y += delta * 0.18;
    meshRef.current.rotation.x += delta * 0.09;
    meshRef.current.position.set(cfg.x ?? 0, cfg.y ?? 0, cfg.z ?? -5);
    if (matRef.current) {
      targetColor.current.set(cfg.color);
      matRef.current.color.lerp(targetColor.current, Math.min(1, delta * 4));
      matRef.current.emissive.lerp(targetColor.current, Math.min(1, delta * 4));
      matRef.current.emissiveIntensity = cfg.emissiveIntensity;
    }
  });

  return (
    <mesh ref={meshRef} visible={false}>
      <sphereGeometry args={[1.3, 64, 64]} />
      <meshStandardMaterial ref={matRef} roughness={0.32} metalness={0.2} />
    </mesh>
  );
}

/* Bloom via Three.js native postprocessing — managed imperatively to avoid
   React 19 serialization issues with @react-three/postprocessing */
function BloomEffect({ objectsRef }) {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef(null);
  const bloomRef = useRef(null);

  useEffect(() => {
    const rt = new THREE.WebGLRenderTarget(size.width, size.height, {
      type: THREE.HalfFloatType,
    });
    const composer = new EffectComposer(gl, rt);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0,   // strength — driven dynamically via objectsRef
      0.4, // radius
      0.3, // threshold
    );
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    composerRef.current = composer;
    bloomRef.current = bloom;
    return () => {
      composer.dispose();
      rt.dispose();
    };
  }, [gl, scene, camera]);

  // Handle resize separately so we don't recreate the whole composer
  useEffect(() => {
    if (composerRef.current) composerRef.current.setSize(size.width, size.height);
  }, [size.width, size.height]);

  // Priority 1 takes over rendering from R3F's default render loop
  useFrame((_, delta) => {
    if (!composerRef.current || !bloomRef.current) return;
    const target = objectsRef.current.bloomIntensity;
    bloomRef.current.strength += (target - bloomRef.current.strength) * 0.08;
    composerRef.current.render(delta);
  }, 1);

  return null;
}

export default function Starfield({ controlRef, objectsRef }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 [touch-action:none]">
      <Canvas camera={{ position: [0, 0, 11], fov: 55 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.35} />
        <pointLight position={[2.2, 2.2, 3.5]} intensity={1.8} color="#ff8fa3" />
        <pointLight position={[-2.5, -1.7, -2.5]} intensity={0.6} color="#ffffff" />
        <StarPoints controlRef={controlRef} />
        <OrbMesh objectsRef={objectsRef} />
        <PlanetMesh objectsRef={objectsRef} />
        <BloomEffect objectsRef={objectsRef} />
      </Canvas>
    </div>
  );
}
