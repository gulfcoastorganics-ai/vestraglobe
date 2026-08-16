"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type SphereProject = { name: string; slug: string; color: string; type: string };

type Props = {
  projects: SphereProject[];
  active: number;
  selected: number | null;
  paused: boolean;
  reduced: boolean;
  onFocus: (index: number) => void;
  onLaunch: (index: number) => void;
};

type PanelMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial> & {
  userData: {
    projectIndex: number;
    targetPosition: THREE.Vector3;
    raisedPosition: THREE.Vector3;
    targetQuaternion: THREE.Quaternion;
    startPosition: THREE.Vector3;
    startQuaternion: THREE.Quaternion;
  };
};

const PANEL_COUNT = 32;
const SPHERE_RADIUS = 2.24;
const PANEL_WIDTH = 1.04;
const PANEL_HEIGHT = .67;
const PANEL_LIFT = .22;
const ENTRY_DURATION = 1.65;
const ENTRY_STAGGER = .028;
const ENTRY_END = ENTRY_DURATION + (PANEL_COUNT - 1) * ENTRY_STAGGER;
const SPHERE_TILT_X = -.04;
const PROJECT_SLOTS = [21, 19, 17, 15, 13, 22, 20, 18, 16, 14, 12];
const PROJECT_SLOT_SET = new Set(PROJECT_SLOTS);
const PANEL_SLOT_ORDER = [
  ...PROJECT_SLOTS,
  ...Array.from({ length: PANEL_COUNT }, (_, index) => index).filter(index => !PROJECT_SLOT_SET.has(index)),
];

function easeOutQuart(value: number) {
  return 1 - Math.pow(1 - value, 4);
}

function sphericalPanelGeometry(width: number, height: number, sphereRadius: number) {
  const xSegments = 8;
  const ySegments = 5;
  const columns = xSegments + 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let row = 0; row <= ySegments; row++) {
    const v = row / ySegments;
    const y = height / 2 - v * height;
    for (let column = 0; column <= xSegments; column++) {
      const u = column / xSegments;
      const x = u * width - width / 2;
      const z = Math.sqrt(Math.max(0, sphereRadius ** 2 - x ** 2 - y ** 2)) - sphereRadius;
      positions.push(x, y, z);
      uvs.push(u, 1 - v);
    }
  }

  for (let row = 0; row < ySegments; row++) {
    for (let column = 0; column < xSegments; column++) {
      const topLeft = column + columns * row;
      const bottomLeft = column + columns * (row + 1);
      const bottomRight = column + 1 + columns * (row + 1);
      const topRight = column + 1 + columns * row;
      indices.push(topLeft, bottomLeft, topRight, bottomLeft, bottomRight, topRight);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function drawImageCover(context: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;
  let sourceX = 0;
  let sourceY = 0;
  if (sourceRatio > targetRatio) {
    sourceWidth = image.naturalHeight * targetRatio;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = image.naturalWidth / targetRatio;
    sourceY = (image.naturalHeight - sourceHeight) / 2;
  }
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
}

function projectTexture(project: SphereProject, index: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 320;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#090909";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  const image = new Image();
  image.decoding = "async";
  image.src = `/art/${project.slug}.webp`;
  image.onload = () => {
    drawImageCover(context, image, canvas.width, canvas.height);
    const gradient = context.createLinearGradient(0, 120, 0, 320);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(.62, "rgba(0,0,0,.32)");
    gradient.addColorStop(1, "rgba(0,0,0,.94)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = project.color;
    context.fillRect(23, 23, 4, 55);
    context.font = "500 16px monospace";
    context.fillText(String(index + 1).padStart(2, "0"), 39, 41);
    context.fillStyle = "#ffffff";
    context.font = project.name.length > 18 ? "600 29px sans-serif" : "600 36px sans-serif";
    context.fillText(project.name, 23, 276, 462);
    context.fillStyle = "rgba(255,255,255,.72)";
    context.font = "13px monospace";
    context.fillText(project.type.toUpperCase(), 24, 300, 462);
    texture.needsUpdate = true;
  };
  return texture;
}

function fillerTexture(index: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 320;
  const context = canvas.getContext("2d")!;
  context.fillStyle = index % 3 === 0 ? "#151515" : "#090909";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = index % 2 === 0 ? "rgba(255,255,255,.42)" : "rgba(255,255,255,.22)";
  context.lineWidth = 2;
  context.strokeRect(18, 18, 476, 284);
  context.beginPath();
  if (index % 4 === 0) {
    for (let x = 42; x < 490; x += 44) { context.moveTo(x, 42); context.lineTo(x, 278); }
  } else if (index % 4 === 1) {
    context.arc(256, 160, 96, 0, Math.PI * 2);
    context.moveTo(38, 160); context.lineTo(474, 160);
  } else if (index % 4 === 2) {
    context.moveTo(40, 262); context.lineTo(150, 118); context.lineTo(230, 205); context.lineTo(350, 72); context.lineTo(474, 184);
  } else {
    for (let y = 58; y < 280; y += 42) { context.moveTo(42, y); context.lineTo(470, y); }
  }
  context.stroke();
  context.fillStyle = "rgba(255,255,255,.54)";
  context.font = "18px monospace";
  context.fillText(`AUX / ${String(index + 1).padStart(2, "0")}`, 38, 54);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function fibonacciPosition(index: number) {
  const offset = 2 / PANEL_COUNT;
  const y = ((index * offset) - 1) + (offset / 2);
  const radius = Math.sqrt(1 - y * y);
  const angle = index * Math.PI * (3 - Math.sqrt(5));
  return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius).multiplyScalar(SPHERE_RADIUS);
}

export default function ProjectSphere3D({ projects, active, selected, paused, reduced, onFocus, onLaunch }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  const selectedRef = useRef(selected);
  const pausedRef = useRef(paused);
  const reducedRef = useRef(reduced);
  const focusRef = useRef(onFocus);
  const launchRef = useRef(onLaunch);
  const [fallback, setFallback] = useState(false);

  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { reducedRef.current = reduced; }, [reduced]);
  useEffect(() => { focusRef.current = onFocus; }, [onFocus]);
  useEffect(() => { launchRef.current = onLaunch; }, [onLaunch]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      queueMicrotask(() => setFallback(true));
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.domElement.className = "sphere-canvas";
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, .042);
    const camera = new THREE.PerspectiveCamera(39, 1, .1, 100);
    camera.position.set(0, .15, 9.1);

    const root = new THREE.Group();
    root.rotation.x = SPHERE_TILT_X;
    scene.add(root);

    scene.add(new THREE.AmbientLight(0xffffff, 1.15));
    const keyLight = new THREE.PointLight(0xffffff, 13, 18, 2);
    keyLight.position.set(4.8, 4.2, 6.4);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xb6c5ff, 7, 15, 2);
    rimLight.position.set(-5, -2, 2);
    scene.add(rimLight);

    const coreGeometry = new THREE.IcosahedronGeometry(2.18, 4);
    const core = new THREE.Mesh(coreGeometry, new THREE.MeshPhysicalMaterial({
      color: 0x050505, metalness: .82, roughness: .23, transparent: true, opacity: .84,
      clearcoat: 1, clearcoatRoughness: .2,
    }));
    root.add(core);
    const wire = new THREE.Mesh(coreGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: .12 }));
    wire.scale.setScalar(1.012);
    root.add(wire);

    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .2 });
    const ringOne = new THREE.Mesh(new THREE.TorusGeometry(2.62, .012, 8, 160), ringMaterial);
    ringOne.rotation.x = 1.08;
    ringOne.rotation.y = .22;
    root.add(ringOne);
    const ringTwo = ringOne.clone();
    ringTwo.rotation.set(.22, 1.24, .68);
    root.add(ringTwo);

    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(540 * 3);
    for (let index = 0; index < 540; index++) {
      const radius = 8 + (index % 17) * .42;
      const angle = index * 2.39996;
      starPositions[index * 3] = Math.cos(angle) * radius;
      starPositions[index * 3 + 1] = ((index % 41) - 20) * .42;
      starPositions[index * 3 + 2] = Math.sin(angle) * radius - 5;
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: .025, transparent: true, opacity: .38 })));

    const panelGeometry = sphericalPanelGeometry(PANEL_WIDTH, PANEL_HEIGHT, SPHERE_RADIUS);
    const normal = new THREE.Vector3(0, 0, 1);
    const panels: PanelMesh[] = [];
    const textures: THREE.Texture[] = [];

    for (let index = 0; index < PANEL_COUNT; index++) {
      const project = projects[index];
      const texture = project ? projectTexture(project, index) : fillerTexture(index);
      textures.push(texture);
      const color = new THREE.Color(project?.color ?? (index % 2 ? "#888888" : "#d8d8d8"));
      const material = new THREE.MeshStandardMaterial({
        map: texture, color: 0xffffff, metalness: project ? .16 : .58, roughness: project ? .6 : .36,
        emissive: project ? color : new THREE.Color(0x111111), emissiveIntensity: project ? .16 : .08,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(panelGeometry, material) as PanelMesh;
      const target = fibonacciPosition(PANEL_SLOT_ORDER[index]);
      const raised = target.clone().setLength(SPHERE_RADIUS + PANEL_LIFT);
      const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(normal, target.clone().normalize());
      const spiralAngle = index * .82;
      const start = new THREE.Vector3(Math.cos(spiralAngle) * (7.4 - index * .08), (index - PANEL_COUNT / 2) * .24, -4.8 + Math.sin(spiralAngle) * 1.4);
      const startQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(index * .18, -spiralAngle, index * .11));
      mesh.position.copy(reducedRef.current ? target : start);
      mesh.quaternion.copy(reducedRef.current ? targetQuaternion : startQuaternion);
      mesh.scale.setScalar(reducedRef.current ? 1 : .08);
      mesh.userData = { projectIndex: project ? index : -1, targetPosition: target, raisedPosition: raised, targetQuaternion, startPosition: start, startQuaternion };
      root.add(mesh);
      panels.push(mesh);
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(4, 4);
    let hovered = -1;
    let visible = !document.hidden;
    let launch: { mesh: PanelMesh; start: number; fromPosition: THREE.Vector3; fromQuaternion: THREE.Quaternion } | null = null;
    let restoredSelected = -1;
    const startTime = performance.now();
    let lastTime = startTime;
    let animationFrame = 0;
    let targetTiltX = SPHERE_TILT_X;
    let targetTiltY = 0;
    const targetScale = new THREE.Vector3(1, 1, 1);
    const launchPosition = new THREE.Vector3(.72, .08, 6.2);

    const resize = () => {
      const width = host.clientWidth || 1;
      const height = host.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = width < 720 ? 10.35 : 9.1;
      root.scale.setScalar(width < 720 ? .82 : 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const updatePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      targetTiltX = reducedRef.current ? SPHERE_TILT_X : SPHERE_TILT_X + pointer.y * .08;
      targetTiltY = reducedRef.current ? root.rotation.y : pointer.x * .16;
    };
    const clearPointer = () => { pointer.set(4, 4); hovered = -1; host.style.cursor = "default"; targetTiltX = SPHERE_TILT_X; targetTiltY = 0; };
    const click = () => {
      if (hovered < 0 || launch) return;
      const mesh = panels.find(item => item.userData.projectIndex === hovered);
      if (!mesh) return;
      if (reducedRef.current) {
        launchRef.current(hovered);
        return;
      }
      scene.attach(mesh);
      launch = { mesh, start: performance.now(), fromPosition: mesh.position.clone(), fromQuaternion: mesh.quaternion.clone() };
      launchRef.current(hovered);
    };
    const visibility = () => { visible = !document.hidden; };
    renderer.domElement.addEventListener("pointermove", updatePointer);
    renderer.domElement.addEventListener("pointerleave", clearPointer);
    renderer.domElement.addEventListener("click", click);
    document.addEventListener("visibilitychange", visibility);

    const render = (time: number) => {
      animationFrame = requestAnimationFrame(render);
      if (!visible) return;
      const delta = Math.min((time - lastTime) / 1000, .05);
      lastTime = time;
      const elapsed = (time - startTime) / 1000;

      if (!reducedRef.current) {
        for (let index = 0; index < panels.length; index++) {
          const mesh = panels[index];
          if (mesh === launch?.mesh || mesh.parent !== root) continue;
          const progress = THREE.MathUtils.clamp((elapsed - index * ENTRY_STAGGER) / ENTRY_DURATION, 0, 1);
          const eased = easeOutQuart(progress);
          mesh.position.lerpVectors(mesh.userData.startPosition, mesh.userData.targetPosition, eased);
          mesh.quaternion.slerpQuaternions(mesh.userData.startQuaternion, mesh.userData.targetQuaternion, eased);
          mesh.scale.setScalar(.08 + eased * .92);
        }
      }

      if (!pausedRef.current && selectedRef.current === null && !reducedRef.current && elapsed > ENTRY_END) {
        root.rotation.y += delta * .12;
      }
      root.rotation.x += (targetTiltX - root.rotation.x) * Math.min(1, delta * 2.7);
      if (Math.abs(targetTiltY) > .002 && !pausedRef.current && selectedRef.current === null) root.rotation.y += (targetTiltY - root.rotation.y) * Math.min(1, delta * .12);
      wire.rotation.y += delta * .022;
      core.rotation.y -= delta * .016;

      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects([core, ...panels], false)[0];
      const hitPanel = hit?.object !== core ? hit?.object as PanelMesh | undefined : undefined;
      const nextHovered = hitPanel && hitPanel.userData.projectIndex >= 0 ? hitPanel.userData.projectIndex : -1;
      if (nextHovered !== hovered && !launch) {
        hovered = nextHovered;
        host.style.cursor = hovered >= 0 ? "pointer" : "default";
        if (hovered >= 0) focusRef.current(hovered);
      }

      for (const mesh of panels) {
        if (mesh === launch?.mesh) continue;
        const index = mesh.userData.projectIndex;
        const highlighted = index >= 0 && (index === activeRef.current || index === hovered);
        if (reducedRef.current) {
          mesh.position.copy(mesh.userData.targetPosition);
          mesh.scale.setScalar(1);
        } else if (elapsed > ENTRY_END) {
          mesh.position.lerp(highlighted ? mesh.userData.raisedPosition : mesh.userData.targetPosition, Math.min(1, delta * 8));
          targetScale.setScalar(highlighted ? 1.1 : 1);
          mesh.scale.lerp(targetScale, Math.min(1, delta * 8));
        }
        mesh.material.emissiveIntensity += ((highlighted ? .62 : index >= 0 ? .16 : .08) - mesh.material.emissiveIntensity) * Math.min(1, delta * 8);
      }

      if (launch) {
        const progress = THREE.MathUtils.clamp((time - launch.start) / 720, 0, 1);
        const eased = easeOutQuart(progress);
        launch.mesh.position.lerpVectors(launch.fromPosition, launchPosition, eased);
        launch.mesh.quaternion.slerpQuaternions(launch.fromQuaternion, camera.quaternion, eased);
        launch.mesh.scale.setScalar(1 + eased * 1.7);
        launch.mesh.material.emissiveIntensity = .9;
      }

      if (launch && selectedRef.current === null && time - launch.start > 900 && restoredSelected !== launch.mesh.userData.projectIndex) {
        restoredSelected = launch.mesh.userData.projectIndex;
        root.attach(launch.mesh);
        launch.mesh.position.copy(launch.mesh.userData.targetPosition);
        launch.mesh.quaternion.copy(launch.mesh.userData.targetQuaternion);
        launch.mesh.scale.setScalar(1);
        launch = null;
      } else if (selectedRef.current !== null) {
        restoredSelected = -1;
      }

      renderer.render(scene, camera);
    };
    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointermove", updatePointer);
      renderer.domElement.removeEventListener("pointerleave", clearPointer);
      renderer.domElement.removeEventListener("click", click);
      document.removeEventListener("visibilitychange", visibility);
      textures.forEach(texture => texture.dispose());
      panelGeometry.dispose(); coreGeometry.dispose(); starGeometry.dispose();
      panels.forEach(mesh => mesh.material.dispose());
      (core.material as THREE.Material).dispose(); (wire.material as THREE.Material).dispose(); ringMaterial.dispose();
      renderer.dispose(); renderer.domElement.remove();
    };
  }, [projects]);

  if (fallback) return <div className="sphere-fallback"><span>3D rendering is unavailable on this device.</span><a href="#projects">Open the project deck</a></div>;
  return <div ref={hostRef} className="webgl-sphere" />;
}
