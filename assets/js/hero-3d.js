// assets/js/hero-3d.js
// Minimal GLB render first (debug-friendly). Surface sampling comes after this works.

import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.159.0/examples/jsm/loaders/GLTFLoader.js';

console.log('[hero-3d] init');

const canvas = document.getElementById('hero-canvas');
if (!canvas) console.warn('[hero-3d] canvas #hero-canvas not found');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true
});

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x020308, 0); // transparent

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020308, 0.28);

const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.15, 3.1);

scene.add(new THREE.HemisphereLight(0x9f7bff, 0x020308, 0.9));
const dir = new THREE.DirectionalLight(0xffffff, 0.75);
dir.position.set(2, 3, 4);
scene.add(dir);

const root = new THREE.Group();
scene.add(root);

// ---- DEBUG FALLBACK (should ALWAYS show) ----
const fallback = new THREE.Mesh(
  new THREE.BoxGeometry(0.6, 0.6, 0.6),
  new THREE.MeshStandardMaterial({
    color: 0x4aa8ff,
    emissive: 0x4aa8ff,
    emissiveIntensity: 0.6,
    roughness: 0.4,
    metalness: 0.1,
    transparent: true,
    opacity: 0.35
  })
);
fallback.position.set(0, 0.0, 0);
root.add(fallback);

// ---- LOAD GLB ----
// IMPORTANT: hero-3d.js sits in assets/js/, so models is ../models/
const MODEL_URL = new URL('../models/Butterfly.glb', import.meta.url).href;
console.log('[hero-3d] loading', MODEL_URL);

const loader = new GLTFLoader();
loader.load(
  MODEL_URL,
  (gltf) => {
    console.log('[hero-3d] GLB loaded ✅', gltf);

    // remove fallback cube once model loads
    root.remove(fallback);

    const model = gltf.scene;

    // force a consistent, visible material (ignores broken embedded materials)
    model.traverse((child) => {
      if (!child.isMesh) return;
      child.geometry.computeVertexNormals();
      child.material = new THREE.MeshStandardMaterial({
        color: 0x0b1220,
        emissive: new THREE.Color(0x4aa8ff),
        emissiveIntensity: 0.35,
        roughness: 0.85,
        metalness: 0.08,
        transparent: true,
        opacity: 0.45
      });
    });

    // center + scale to fit camera
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;

    model.position.sub(center);
    model.scale.setScalar(1.9 / maxDim);

    // optional orientation tweak
    model.rotation.x = -Math.PI * 0.08;
    model.rotation.y =  Math.PI * 0.12;

    root.add(model);
  },
  undefined,
  (err) => {
    console.error('[hero-3d] GLB failed ❌', err);
    // fallback cube stays visible if load fails
  }
);

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', onResize);

let last = performance.now();
function animate(now) {
  requestAnimationFrame(animate);

  const dt = (now - last) / 1000;
  last = now;

  root.rotation.y += 0.12 * dt;
  root.rotation.x = Math.sin(now * 0.00015) * 0.12;

  renderer.render(scene, camera);
}
animate(performance.now());
