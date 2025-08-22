import { useEffect, useRef, useState, useMemo } from 'react'
import * as THREE from 'three'

export default function GeometryExplorer() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const currentMeshRef = useRef<THREE.Mesh | null>(null)
  const animRef = useRef<number | null>(null)

  const [wireframe, setWireframe] = useState<boolean>(() => localStorage.getItem("wireframe") === "true")
  const [autoRotate, setAutoRotate] = useState<boolean>(() => localStorage.getItem("autoRotate") !== "false")
  const [geometryType, setGeometryType] = useState<string>("cube")

  const wireframeRef = useRef(wireframe)
  const autoRotateRef = useRef(autoRotate)

  useEffect(() => {
    wireframeRef.current = wireframe
    localStorage.setItem("wireframe", String(wireframe))
  }, [wireframe])

  useEffect(() => {
    autoRotateRef.current = autoRotate
    localStorage.setItem("autoRotate", String(autoRotate))
  }, [autoRotate])

  // 🔥 Catálogo de geometrías (memoizado)
  const geometries = useMemo(() => ({
    cube: {
      name: "Cube",
      category: "Primitivas",
      description: "Cubo",
      create: () => new THREE.BoxGeometry(1.5, 1.5, 1.5),
      color: "#44aa88"
    },
    sphere: {
      name: "Sphere",
      category: "Primitivas",
      description: "Esfera",
      create: () => new THREE.SphereGeometry(1, 32, 16),
      color: "#FF6B6B"
    },
    plane: {
      name: "Plane",
      category: "Primitivas",
      description: "Plano",
      create: () => new THREE.PlaneGeometry(2, 2),
      color: "#6BCB77"
    },
    cone: {
      name: "Cone",
      category: "Primitivas",
      description: "Cono",
      create: () => new THREE.ConeGeometry(1, 2, 32),
      color: "#FFD93D"
    },
    cylinder: {
      name: "Cylinder",
      category: "Primitivas",
      description: "Cilindro",
      create: () => new THREE.CylinderGeometry(1, 1, 2, 32),
      color: "#4D96FF"
    },
    torus: {
      name: "Torus",
      category: "Primitivas",
      description: "Toro",
      create: () => new THREE.TorusGeometry(1, 0.3, 16, 100),
      color: "#FF6B6B"
    },
    knot: {
      name: "Torus Knot",
      category: "Primitivas",
      description: "Nudo Toroidal",
      create: () => new THREE.TorusKnotGeometry(1, 0.3, 100, 16),
      color: "#845EC2"
    },
    circle: {
      name: "Circle",
      category: "Primitivas",
      description: "Círculo",
      create: () => new THREE.CircleGeometry(1, 32),
      color: "#FF9671"
    }
  }), [])

  // Geometría activa
  const geometry = useMemo(() => geometries[geometryType].create(), [geometryType, geometries])

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    sceneRef.current = scene

    const { width, height } = mountRef.current.getBoundingClientRect()
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(3, 2, 4)
    cameraRef.current = camera

    if (rendererRef.current) {
      rendererRef.current.dispose()
      if (mountRef.current.contains(rendererRef.current.domElement)) {
        mountRef.current.removeChild(rendererRef.current.domElement)
      }
    }
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight(0xffffff, 0.35)
    const dir = new THREE.DirectionalLight(0xffffff, 0.9)
    dir.position.set(5, 5, 5)
    scene.add(ambient, dir)

    // Mesh inicial
    const material = new THREE.MeshPhongMaterial({
      color: geometries[geometryType].color,
      wireframe: wireframeRef.current
    })
    const mesh = new THREE.Mesh(geometry, material)
    currentMeshRef.current = mesh
    scene.add(mesh)

    const axes = new THREE.AxesHelper(2)
    const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
    scene.add(axes, grid)

    const animate = () => {
      animRef.current = requestAnimationFrame(animate)
      if (autoRotateRef.current && currentMeshRef.current) {
        currentMeshRef.current.rotation.x += 0.01
        currentMeshRef.current.rotation.y += 0.015
      }
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!mountRef.current) return
      const rect = mountRef.current.getBoundingClientRect()
      const w = rect.width || 800
      const h = rect.height || 600
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animRef.current) cancelAnimationFrame(animRef.current)
      renderer.dispose()
      mesh.geometry.dispose()
      material.dispose()
      scene.clear()
    }
  }, [])

  // Reemplazar mesh al cambiar geometría
  useEffect(() => {
    if (!sceneRef.current || !currentMeshRef.current) return

    sceneRef.current.remove(currentMeshRef.current)
    currentMeshRef.current.geometry.dispose()
    ;(currentMeshRef.current.material as THREE.Material).dispose()

    const material = new THREE.MeshPhongMaterial({
      color: geometries[geometryType].color,
      wireframe: wireframeRef.current
    })
    const mesh = new THREE.Mesh(geometry, material)
    currentMeshRef.current = mesh
    sceneRef.current.add(mesh)
  }, [geometryType, geometry, geometries])

  // Wireframe dinámico
  useEffect(() => {
    const mesh = currentMeshRef.current
    if (!mesh) return
    const mat = mesh.material as THREE.MeshPhongMaterial
    mat.wireframe = wireframe
    mat.needsUpdate = true
  }, [wireframe])

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Panel lateral */}
      <div style={{
        width: 200,
        background: '#1a1a1a',
        color: 'white',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        overflowY: 'auto'
      }}>
        <h3>Catálogo</h3>
        {Object.entries(geometries).map(([key, geo]) => (
          <button
            key={key}
            style={{
              padding: '6px 8px',
              background: geometryType === key ? geo.color : '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              color: 'white'
            }}
            onClick={() => setGeometryType(key)}
          >
            {geo.description}
          </button>
        ))}

        <hr style={{ margin: '12px 0' }} />

        <button onClick={() => setAutoRotate(!autoRotate)}>
          {autoRotate ? '⏸️ Pausar Rotación' : '▶️ Reanudar Rotación'}
        </button>
        <button onClick={() => setWireframe(!wireframe)}>
          {wireframe ? '🔲 Sólido' : '🔳 Wireframe'}
        </button>
      </div>

      {/* Canvas */}
      <div ref={mountRef} style={{ flex: 1 }} />
    </div>
  )
}
