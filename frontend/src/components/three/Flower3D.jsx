import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { PETALS, PETAL_COLORS } from '../../data/brand'

// Forma de gota: la punta en (0,0) y la parte redonda hacia +Y
function createPetalGeometry() {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.bezierCurveTo(-0.26, 0.32, -0.6, 0.72, -0.56, 1.14)
  s.bezierCurveTo(-0.52, 1.6, 0.52, 1.6, 0.56, 1.14)
  s.bezierCurveTo(0.6, 0.72, 0.26, 0.32, 0, 0)
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.08,
    bevelSegments: 12,
    curveSegments: 56,
  })
  geo.translate(0, 0, -0.08)
  return geo
}

const easeOut = (t) => 1 - Math.pow(1 - t, 3)

// Entorno de luz "de estudio" para que los pétalos tengan reflejos brillantes
function StudioEnvironment() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    return () => {
      scene.environment = null
      env.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])
  return null
}

function Petal({ geometry, color, angle, index, burst }) {
  const ref = useRef()
  const mat = useRef()
  const [hovered, setHovered] = useState(false)
  const rad = THREE.MathUtils.degToRad(angle)
  const dir = useMemo(() => new THREE.Vector3(Math.cos(rad), Math.sin(rad), 0), [rad])
  const base = useMemo(() => new THREE.Color(color), [color])

  // Posición inicial "desarmada": cada pétalo llega volando desde afuera
  const start = useMemo(
    () => ({
      pos: dir.clone().multiplyScalar(7).add(new THREE.Vector3(0, 0, 5 - index * 2)),
      rot: (index % 2 ? 1 : -1) * Math.PI * 2,
    }),
    [dir, index],
  )
  const target = useMemo(() => new THREE.Vector3(), [])
  const pop = useRef(0)

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime()
    const intro = easeOut(Math.min(Math.max((t - index * 0.12) / 1.6, 0), 1))

    // Florecer: los pétalos se abren y se cierran como si respiraran
    const bloom = (Math.sin(t * 1.6 - index * 0.5) + 1) * 0.09
    // Al pasar el mouse o al hacer clic, el pétalo salta hacia afuera
    const goal = (hovered ? 0.45 : 0) + burst.current * 1.4
    pop.current = THREE.MathUtils.damp(pop.current, goal, 6, delta)

    target.copy(dir).multiplyScalar(0.16 + bloom + pop.current)
    target.z = Math.sin(t * 2 + index * 1.3) * 0.22 + pop.current * 0.9

    ref.current.position.lerpVectors(start.pos, target, intro)
    ref.current.rotation.z = rad - Math.PI / 2 + start.rot * (1 - intro) + Math.sin(t * 2.2 + index) * 0.06
    ref.current.rotation.x = Math.sin(t * 1.7 + index * 2) * 0.32
    ref.current.rotation.y = Math.cos(t * 1.4 + index) * 0.38 + pop.current * 1.2

    // Brillo que late suavemente
    mat.current.emissiveIntensity = 0.22 + Math.sin(t * 3 + index) * 0.06 + pop.current * 0.4
  })

  return (
    <mesh
      ref={ref}
      geometry={geometry}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = ''
      }}
    >
      <meshPhysicalMaterial
        ref={mat}
        color={base}
        emissive={base}
        emissiveIntensity={0.22}
        roughness={0.12}
        metalness={0}
        clearcoat={1}
        clearcoatRoughness={0.04}
        envMapIntensity={0.55}
      />
    </mesh>
  )
}

// Textura de punto redondo con borde difuso, para que los destellos no sean cuadrados
function createDotTexture() {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.9)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

// Destellos de colores que orbitan alrededor de la flor
function Sparkles({ count = 90 }) {
  const ref = useRef()
  const dot = useMemo(() => createDotTexture(), [])
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const r = 2.2 + Math.random() * 1.6
      const a = Math.random() * Math.PI * 2
      positions.set([Math.cos(a) * r, Math.sin(a) * r, (Math.random() - 0.5) * 2], i * 3)
      c.set(PETAL_COLORS[i % PETAL_COLORS.length])
      colors.set([c.r, c.g, c.b], i * 3)
    }
    return { positions, colors }
  }, [count])

  useFrame(({ clock }, delta) => {
    ref.current.rotation.z += delta * 0.15
    ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.4) * 0.3
    ref.current.material.size = 0.12 + Math.sin(clock.getElapsedTime() * 3) * 0.035
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        map={dot}
        size={0.12}
        sizeAttenuation
        transparent
        opacity={0.95}
        depthWrite={false}
      />
    </points>
  )
}

function Flower() {
  const group = useRef()
  const geometry = useMemo(() => createPetalGeometry(), [])
  const burst = useRef(0)
  const spin = useRef(0.35)

  // Gira, se balancea y se inclina siguiendo el mouse
  useFrame(({ clock, pointer }, delta) => {
    const g = group.current
    const t = clock.getElapsedTime()
    spin.current = THREE.MathUtils.damp(spin.current, 0.35, 2, delta)
    burst.current = THREE.MathUtils.damp(burst.current, 0, 3, delta)
    g.rotation.z -= delta * spin.current
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -pointer.y * 0.7 + Math.sin(t * 0.7) * 0.15, 0.06)
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, pointer.x * 0.8 + Math.cos(t * 0.5) * 0.2, 0.06)
    g.position.y = Math.sin(t * 1.1) * 0.15
    const s = 0.92 + Math.sin(t * 1.6) * 0.03
    g.scale.setScalar(s)
  })

  // Clic: los pétalos explotan hacia afuera, la flor gira rápido y se vuelve a armar
  function handleClick() {
    burst.current = 1
    spin.current = 6
  }

  return (
    <group ref={group} onClick={handleClick}>
      {PETALS.map((p, i) => (
        <Petal key={p.color} geometry={geometry} color={p.color} angle={p.angle} index={i} burst={burst} />
      ))}
    </group>
  )
}

export default function Flower3D() {
  return (
    <Canvas
      className="flower3d"
      flat
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6.4], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
    >
      <StudioEnvironment />
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 5, 5]} intensity={1.6} />
      <pointLight position={[-3, 2, 3]} intensity={8} distance={10} color="#ff4fa3" />
      <pointLight position={[3, -2, 3]} intensity={8} distance={10} color="#19c3ff" />
      <Flower />
      <Sparkles />
    </Canvas>
  )
}
