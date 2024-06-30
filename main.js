import './style.css'
import * as THREE from 'three'
import { generateTubes } from './generateTubes'
import { GUI } from 'dat.gui';

// Create a new scene
var scene = new THREE.Scene();

// Create a new camera
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Create a new renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Ambient light, white color, intensity 0.5
var ambientLight = new THREE.AmbientLight(0xffffff, 0.5); 
scene.add(ambientLight);

// Directional light, white color, intensity 1
var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1).normalize();
directionalLight.castShadow = true; // La luce direzionale proietta ombre
scene.add(directionalLight);

// Now we take care of the background, we create two planes with the same texture that will move horizontally. We need 2 planes to create a continuous movement effect.
// So we need to create two meshes and two materials, one for each plane.
var backgroundMesh1, backgroundMesh2;

// Load the texture
var loader = new THREE.TextureLoader();
loader.load('/background1.jpg', function(texture) {
    // Create two materials with the same texture -> this type of material doesn't need light to be visible and doesn't reflect light.
    var backgroundMaterial1 = new THREE.MeshBasicMaterial({
        map: texture
    });

    var backgroundMaterial2 = new THREE.MeshBasicMaterial({
        map: texture.clone()
    });

    // We don't want the texture to repeat, we want it to be clamped
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    // For obtaining a continuous movement effect, we need to set the second texture to reflect the first one. It's a sort of trick to create a continuous effect.
    backgroundMaterial2.map.wrapS = THREE.RepeatWrapping;
    backgroundMaterial2.map.repeat.x = -1;

    // Calculate the aspect ratio of the texture
    var aspectRatio = texture.image.width / texture.image.height;
    var planeHeight = 35; // Height of the plane (arbitrary)
    var planeWidth = planeHeight * aspectRatio;

    // Create the geometry of the planes
    var backgroundGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);

    // Apply the materials to the planes
    backgroundMesh1 = new THREE.Mesh(backgroundGeometry, backgroundMaterial1);
    backgroundMesh2 = new THREE.Mesh(backgroundGeometry, backgroundMaterial2);

    // Set the position of the planes. The second one is placed next to the first one.
    backgroundMesh1.position.set(0, 0, -10);
    backgroundMesh2.position.set(planeWidth, 0, -10);

    // Add the planes to the scene
    scene.add(backgroundMesh1);
    scene.add(backgroundMesh2);
});


// TODO: adjust the tubes, add a circle to the top opening of the tube. -> Generate two tubes with each call of the function. -> Random position of the tubes.

// Generate and add a green tube to the scene
const greenTube = generateTubes(0x00ff00, 9, 0.8, 1, 12); // Smaller tube
greenTube.position.set(4, -7, 0); // Set the initial position of the tube to make it appear from below
scene.add(greenTube);


// Instantiate parameters for the animate function.
var speed = 0.01; // Speed of the movement

// We set an oscillation effect for the camera, like as we're flying. We need to set the amplitude and the frequency of the oscillation.
var amplitude = 0.5;
var frequency = 1.2;
var time = 0; // Time parameter for the oscillation

function animate() {
    requestAnimationFrame(animate);

    // Move the background horizontally.
    if (backgroundMesh1 && backgroundMesh2) {
        backgroundMesh1.position.x -= speed;
        backgroundMesh2.position.x -= speed;

        // Reset the position of the planes when they are out of the screen.
        if (backgroundMesh1.position.x < -backgroundMesh1.geometry.parameters.width) {
            backgroundMesh1.position.x = backgroundMesh2.position.x + backgroundMesh2.geometry.parameters.width;
        }
        if (backgroundMesh2.position.x < -backgroundMesh2.geometry.parameters.width) {
            backgroundMesh2.position.x = backgroundMesh1.position.x + backgroundMesh1.geometry.parameters.width;
        }
    }

    // Oscillation effect for the camera
    time += 0.01;
    camera.position.y = Math.sin(time * frequency) * amplitude;

    renderer.render(scene, camera);
}
animate();