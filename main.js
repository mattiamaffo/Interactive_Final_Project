import './style.css'
import * as THREE from 'three'
import { GUI } from 'dat.gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Create a new scene
var scene = new THREE.Scene();

// Create a new camera
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Create a new renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Type of shadows: soft
document.body.appendChild(renderer.domElement);

// Ambient light, white color, intensity 0.5
var ambientLight = new THREE.AmbientLight(0xffffff, 1); 
scene.add(ambientLight);

var directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(-10, 10, 5); 
directionalLight.target.position.set(-14.5, 1, 2); // Points the light for the best illumination of the bird
directionalLight.castShadow = true;
scene.add(directionalLight);
scene.add(directionalLight.target);

// GUI setup
const gui = new GUI();
const lightFolder = gui.addFolder('Directional Light');
lightFolder.add(directionalLight.position, 'x', -20, 20).name('Position X');
lightFolder.add(directionalLight.position, 'y', -20, 20).name('Position Y');
lightFolder.add(directionalLight.position, 'z', -20, 20).name('Position Z');
lightFolder.add(directionalLight.target.position, 'x', -20, 20).name('Target X');
lightFolder.add(directionalLight.target.position, 'y', -20, 20).name('Target Y');
lightFolder.add(directionalLight.target.position, 'z', -20, 20).name('Target Z');
lightFolder.add(directionalLight, 'intensity', 0, 2).name('Intensity');
lightFolder.open();

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

// Function to generate random tubes with specific positions
function generateRandomTubes(posX = 11) {
    const loader = new GLTFLoader();
    const scaleFactor = 0.5; // Adjust this value as needed
    
    // Randomly select positions from the range array
    const randomIndex1 = Math.floor(Math.random() * range.length);
    console.log(randomIndex1)
    const positionY1 = range[randomIndex1][0]; // Lower bound of Y position
    const positionY2 = range[randomIndex1][1]; // Upper bound of Y position
    
    // Load the first tube (oriented upwards)
    loader.load('pipe2.glb', function(gltf) {
        const tube1 = gltf.scene;
        tube1.traverse(function(node) {
            if (node.isMesh) {
                node.receiveShadow = true;
                node.name = 'tube'; // Set a unique name for the tube
            }
        });
        tube1.position.set(posX, positionY1, 0); 
        console.log(tube1.position)
        tube1.scale.set(scaleFactor, 1.5, scaleFactor);
        scene.add(tube1);
    });
  
    // Load the second tube (oriented downwards)
    loader.load('pipe2.glb', function(gltf) {
        const tube2 = gltf.scene;
        tube2.traverse(function(node) {
            if (node.isMesh) {
                node.receiveShadow = true;
                // Rotate the tube to orient it downwards
                node.rotation.x = Math.PI; // Rotate 180 degrees around x-axis
                node.name = 'tube'; // Set a unique name for the tube
            }
        });
        tube2.position.set(posX, positionY2, 0);
        console.log(tube2.position)
        tube2.scale.set(scaleFactor, 1.5, scaleFactor);
        scene.add(tube2);
    });
}

// Array of Y positions for tubes
const range = [ [-3, 7], [-4, 6], [-5, 5], [-6, 4], [-7, 3] ];

generateRandomTubes(5); // Generate the first tubes

setTimeout(() => {generateRandomTubes(10)}, 2000); // Generate the second tubes after 2 seconds

// Call generateRandomTubes every 5.8 seconds
setInterval(generateRandomTubes, 5800);

// LOAD THE BIRD MODEL

var birdModel;
const bird = new GLTFLoader();
bird.load('bird2.glb', function(gltf) {
    birdModel = gltf.scene;
    birdModel.traverse(function(node) {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            node.name = 'bird'; // Set a unique name for the bird
        }
    });
    birdModel.position.set(-3, 0, 0);
    birdModel.rotation.y = Math.PI / 2;
    scene.add(birdModel);
});


// Instantiate parameters for the animate function.
// We set an oscillation effect for the camera, like as we're flying. We need to set the amplitude and the frequency of the oscillation.
var physicsParams = {
    amplitude: 0.5,
    frequency: 1.2,
    jumpForce: 2,
    vel: 0,
    speed: 3,
    gravity: -4.5 // Valore iniziale della gravità
};
const physicFolder = gui.addFolder('Physics');
// Add the parameters to the GUI (only gravity at the beginning)
physicFolder.add(physicsParams, 'gravity', -10, 10).name('Gravity');
physicFolder.add(physicsParams, 'jumpForce', 1, 3).name('Jump');

function onFlap() {
    physicsParams.vel = physicsParams.jumpForce;
}

window.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        onFlap();
    }
});

window.addEventListener('click', function() {
    onFlap();
});

let lastTime = 0;

function animate(time) {
    requestAnimationFrame(animate);

    // Calculate the time elapsed since the last frame
    const deltaTime = (time - lastTime) / 1000; // s -> ms
    lastTime = time;

    if (backgroundMesh1 && backgroundMesh2) {
        backgroundMesh1.position.x -= physicsParams.speed * deltaTime;
        backgroundMesh2.position.x -= physicsParams.speed * deltaTime;

        // Background movement effect
        if (backgroundMesh1.position.x < -backgroundMesh1.geometry.parameters.width) {
            backgroundMesh1.position.x = backgroundMesh2.position.x + backgroundMesh2.geometry.parameters.width;
        }
        if (backgroundMesh2.position.x < -backgroundMesh2.geometry.parameters.width) {
            backgroundMesh2.position.x = backgroundMesh1.position.x + backgroundMesh1.geometry.parameters.width;
        }
    }

    // Horizontal movement of the tubes
    scene.traverse(function(object) {
        if (object.isMesh && object.name === 'tube') {
            object.position.x -= physicsParams.speed * deltaTime;
        }
    });

    // Oscillatory movement of the camera
    const oscillationTime = time / 1000; // Convert time to seconds for the oscillation calculation
    camera.position.y = Math.sin(oscillationTime * physicsParams.frequency) * physicsParams.amplitude;

    if (birdModel) {
        physicsParams.vel += physicsParams.gravity * deltaTime; // Apply gravity.
        birdModel.position.y += physicsParams.vel * deltaTime; // Change the y-position.
    }

    renderer.render(scene, camera);
}
animate();
