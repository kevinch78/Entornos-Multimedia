// src/components/models/Robot.tsx
import { useGLTF } from '@react-three/drei'
import type { JSX } from 'react'

type RobotProps = JSX.IntrinsicElements['group']

export function Robot(props: RobotProps) {
  const gltf = useGLTF('/models/Robot.glb')
  return <primitive object={gltf.scene} scale={1.2} {...props} />
}

useGLTF.preload('/models/Robot.glb')