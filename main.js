import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { TextureLoader } from 'three/src/loaders/TextureLoader.js'

// TODO: FIX SHADOWS, ADD TEXTURE TO FLOOR, ADD CLOUDS, ADD PIPES -> THEN: GAME LOGIC

// Create a scene
const scene = new THREE.Scene()

// Set the background color of the renderer
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0x87CEEB) // Light blue color for the sky
renderer.shadowMap.enabled = true // Enable shadow mapping
document.body.appendChild(renderer.domElement)

// Create a box geometry for the floor
const floorGeometry = new THREE.BoxGeometry(5, 25, 5)
const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x20BB20 })
const floor = new THREE.Mesh(floorGeometry, floorMaterial)
floor.position.set(0, -12.5, 0) // Position the floor at the desired height
floor.scale.set(100000, 0.001, 100000) // Scale the floor to make it flat and wide
floor.receiveShadow = true // Enable shadow casting
scene.add(floor)


const loader = new OBJLoader()
loader.load(
  'public/gallina.obj', // Path to your OBJ file in the public folder
  function (obj) {
    // Load the texture
    const textureLoader = new TextureLoader();
    const texture = textureLoader.load('public/textureg.png'); // Path to your texture file

    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Apply the texture as material
        child.material = new THREE.MeshLambertMaterial({ map: texture }); // Use Lambert material with texture
        child.castShadow = true // Enable shadow casting
        child.receiveShadow = true // Enable shadow receiving
      }
    })

    // Flip the object horizontally
    obj.scale.x *= -1;

    // Increase object size
    obj.scale.multiplyScalar(1.5); // Increase object size by 1.5 times

    scene.add(obj)
  },
  undefined,
  function (error) {
    console.error('An error occurred while loading the model', error)
  }
)

// Create a camera with a perspective view
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(-20, 5, -8) // Position the camera
camera.lookAt(new THREE.Vector3(0, 0, 0)) // Make the camera look at the center of the scene

// Add OrbitControls for the camera with vertical rotation disabled
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableRotate = true // Enable rotation
controls.enableZoom = true
controls.enablePan = false // Disable panning
controls.maxPolarAngle = Math.PI / 2; // Limit vertical rotation
controls.update()

// Add ambient light
const ambientLight = new THREE.AmbientLight(0x888888)
scene.add(ambientLight)

// Add directional light
const directionalLight = new THREE.DirectionalLight(0xfdfcf0, 1)
directionalLight.position.set(-20, 10, -20) // Position the light on the right side
directionalLight.castShadow = true // Enable shadow casting
directionalLight.shadow.camera.bottom = -15; // Adjust the distance of the shadow
scene.add(directionalLight)

// Animation function
function animate() {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

// Start the animation
animate()

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
