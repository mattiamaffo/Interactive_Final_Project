import './style.css'
import * as THREE from 'three'
import { GUI } from 'dat.gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

let gameStarted = false;
let gameState = 'ready'; // 'ready', 'playing', 'gameover'
let tubes = [];
const range = [ [-3, 7], [-4, 6], [-5, 5], [-6, 4], [-7, 3] ]; // Range of the tubes on the y-axis
var birdModel;
let id; // Animation ID
let lastTime = 0;
const gui = new GUI();
var score;
var maxScore = 0;

var debugParams = {
    showBoundingBox: false
}; // Debug parameters -> Show bounding box.

// Physics parameters
var physicsParams = {
    amplitude: 0.5, // Amplitude of the oscillation
    frequency: 1.2, // Frequency of the oscillation
    jumpForce: 2, // How much the bird jumps when flapping
    vel: 0, // Initial velocity
    speed: 3, // Speed of the tubes
    gravity: 1 // Gravity
};


// Create a new scene
var scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);  // Initial background color

// Create a new camera
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); // Field of view, aspect ratio, near, far
camera.position.set(0, 0, 5);

// Create a new renderer
var renderer = new THREE.WebGLRenderer(); // It is the WebGL renderer -> It will render the scene.
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Type of shadows: soft
document.body.appendChild(renderer.domElement);

// Audio setup
var stream = 'sounds/flappybird_theme.m4a';
var audioLoader = new THREE.AudioLoader();
var listener = new THREE.AudioListener();
var audio = new THREE.Audio(listener);

// Ambient light, white color, intensity 0.5
var ambientLight = new THREE.AmbientLight(0xffffff, 1); // It is a light that adds a constant color throughout the scene.
scene.add(ambientLight);

var directionalLight = new THREE.DirectionalLight(0xffffff, 2); // It is a light that shines in a specific direction.
directionalLight.position.set(-10, 10, 5); 
directionalLight.target.position.set(-14.5, 1, 2); // Points the light for the best illumination of the bird
directionalLight.castShadow = true;
scene.add(directionalLight);
scene.add(directionalLight.target);

// GUI setup
const lightFolder = gui.addFolder('Directional Light');
lightFolder.add(directionalLight.position, 'x', -20, 20).name('Position X');
lightFolder.add(directionalLight.position, 'y', -20, 20).name('Position Y');
lightFolder.add(directionalLight.position, 'z', -20, 20).name('Position Z');
lightFolder.add(directionalLight.target.position, 'x', -20, 20).name('Target X');
lightFolder.add(directionalLight.target.position, 'y', -20, 20).name('Target Y');
lightFolder.add(directionalLight.target.position, 'z', -20, 20).name('Target Z');
lightFolder.add(directionalLight, 'intensity', 0, 2).name('Intensity');


// Background setup
var backgroundMesh1, backgroundMesh2;

var loader = new THREE.TextureLoader(); // It is a loader for loading textures -> It is used to load the background image.
loader.load('/background1.jpg', function(texture) {
    var backgroundMaterial1 = new THREE.MeshBasicMaterial({ map: texture }); // It is a material for the background image -> MeshBasicMaterial is used for creating materials that are not affected by lights.
    var backgroundMaterial2 = new THREE.MeshBasicMaterial({ map: texture.clone() });

    texture.wrapS = THREE.ClampToEdgeWrapping; // It is a wrapping mode for the texture -> ClampToEdgeWrapping is used to repeat the texture.
    texture.wrapT = THREE.ClampToEdgeWrapping;

    backgroundMaterial2.map.wrapS = THREE.RepeatWrapping;
    backgroundMaterial2.map.repeat.x = -1; // Reflect the texture to create continuity

    var aspectRatio = texture.image.width / texture.image.height;
    var planeHeight = 35;
    var planeWidth = planeHeight * aspectRatio;

    var backgroundGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight); // It is a geometry for the background image -> PlaneGeometry is used to create a plane.

    backgroundMesh1 = new THREE.Mesh(backgroundGeometry, backgroundMaterial1);
    backgroundMesh2 = new THREE.Mesh(backgroundGeometry, backgroundMaterial2);

    backgroundMesh1.position.set(0, 0, -10);
    backgroundMesh2.position.set(planeWidth, 0, -10);

    scene.add(backgroundMesh1);
    scene.add(backgroundMesh2);
});

const physicFolder = gui.addFolder('Physics');
physicFolder.add(physicsParams, 'gravity', -10, 10).name('Gravity');
physicFolder.add(physicsParams, 'jumpForce', 1, 3).name('Jump');

const debugFolder = gui.addFolder('Debug');
debugFolder.add(debugParams, 'showBoundingBox').name('Show Bounding Box');

// Function to generate random tubes
let lastTubeX = 10; // Position of the last tube
const tubeDistance = 9; // Fixed distance for generation of tubes

function generateRandomTubes() {
    const loader = new GLTFLoader(); // It is a loader for loading GLTF files -> It is used to load the tubes.
    const scaleFactor = 0.5;

    let tube1, tube2;
    
    const randomIndex1 = Math.floor(Math.random() * range.length);
    const positionY1 = range[randomIndex1][0];
    const positionY2 = range[randomIndex1][1];

    // Compute the position of the tubes
    const posX1 = lastTubeX;
    const posX2 = posX1;

    loader.load('pipe2.glb', function(gltf) {
        tube1 = gltf.scene; // gltf.scene is the root of the hierarchy
        tube1.traverse(function(node) { // Traverse the hierarchy of the tube
            if (node.isMesh) {
                node.receiveShadow = true;
                node.name = 'tube';
                node.geometry.computeBoundingBox();
            }
        });
        tube1.position.set(posX1, positionY1, 0); 
        tube1.scale.set(scaleFactor, 1.5, scaleFactor);
        tube1.userData.boundingBox = new THREE.Box3().setFromObject(tube1); // Compute the bounding box of the tube
        const BoxHelper = new THREE.BoxHelper(tube1, 0xff0000); // Create a box helper for the tube
        scene.add(BoxHelper);
        tube1.userData.boxHelper = BoxHelper;
        scene.add(tube1);
        tube1.userData.passed = false; // Flag to check if the bird has passed the tube

        tubes.push(tube1); // Add tube1 to the tubes array
    });

    // Same here as above, for the second tube
    loader.load('pipe2.glb', function(gltf) {
        tube2 = gltf.scene;
        tube2.traverse(function(node) {
            if (node.isMesh) {
                node.receiveShadow = true;
                node.rotation.x = Math.PI;
                node.name = 'tube';
                node.geometry.computeBoundingBox();
            }
        });
        tube2.position.set(posX2, positionY2, 0);
        tube2.scale.set(scaleFactor, 1.5, scaleFactor);
        tube2.userData.boundingBox = new THREE.Box3().setFromObject(tube2);
        const BoxHelper = new THREE.BoxHelper(tube2, 0xff0000);
        scene.add(BoxHelper);
        tube2.userData.boxHelper = BoxHelper;
        scene.add(tube2);
        tube2.userData.passed = false;

        tubes.push(tube2); // Add tube2 to the tubes array
    });

    // Update lastTubeX
    lastTubeX += tubeDistance;
}

// Flap function
function onFlap() {
    if (gameState === 'playing') {
        physicsParams.vel = physicsParams.jumpForce; // We want to improve velocity when flapping for the y-axis
    }
}

window.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        onFlap();
    }
});

window.addEventListener('click', function() {
    onFlap();
});


function removeAllTubes() {
    tubes.forEach(tube => {
        if (tube && tube.userData) { // Check if the tube exists and has user data
            scene.remove(tube.userData.boxHelper);
            scene.remove(tube);
        }
    });
    tubes = []; // Empty the tubes array
}

// Reset function
function resetScene() {
    console.log('Collision detected!');
    cancelAnimationFrame(id); // Cancel the animation frame -> Stop the animation with the id.
    gameStarted = false;
    gameState = 'ready';
    showGameOver(); // Show the game over screen
    console.log('Resetting scene...');
    if (birdModel) { // Check if the bird model exists
        console.log('Removing bird model...');
        scene.remove(birdModel.userData.boxHelper);
        scene.remove(birdModel);
        birdModel = null;
    }
    if (tubes.length > 0) {
        removeAllTubes();
    }

    // Reset the physics parameters
    physicsParams.gravity = 1;
    // Reset lastTime
    lastTime = 0;
    // Reset the score
    score = 0;
    document.getElementById('score').textContent = score;

    // Reset lastTubeX
    lastTubeX = 10;

}

function handleCollisions() {
    // Check if the bird collides with the tubes
    tubes.forEach(tube => {
        if (birdModel && birdModel.userData.boundingBox && tube && tube.userData.boundingBox) { // Check if the bird model and the tube exist and then check if they have bounding boxes. 
            if (birdModel.userData.boundingBox.intersectsBox(tube.userData.boundingBox)) { // Check if the bounding boxes intersect with the specific method.
                resetScene();
            }
        }
    });
}

function animate(time) {
    console.log('Animating');

    if (!gameStarted || !birdModel) return; // If the game has not started or the bird model does not exist, return.

    id = requestAnimationFrame(animate);

    const deltaTime = (time - lastTime) / 1000; // Compute the time difference between the current time and the last time -> useful for the physics.
    lastTime = time;

    generateRandomTubes();

    if (backgroundMesh1 && backgroundMesh2) { // Check if the background meshes exist
        // Simulate the movement of the background
        backgroundMesh1.position.x -= physicsParams.speed * deltaTime;
        backgroundMesh2.position.x -= physicsParams.speed * deltaTime;

        // Check if the background meshes are out of the screen -> If they are, reset their position to create a continuous background.
        if (backgroundMesh1.position.x < -backgroundMesh1.geometry.parameters.width) {
            backgroundMesh1.position.x = backgroundMesh2.position.x + backgroundMesh2.geometry.parameters.width;
        }
        if (backgroundMesh2.position.x < -backgroundMesh2.geometry.parameters.width) {
            backgroundMesh2.position.x = backgroundMesh1.position.x + backgroundMesh1.geometry.parameters.width;
        }
    }

    tubes.forEach(tube => {
        tube.position.x -= physicsParams.speed * deltaTime;

        // Update bounding box and box helper
        if (tube.userData.boundingBox) {
            tube.userData.boundingBox.setFromObject(tube); // Compute the bounding box of the tube
        }
        if (tube.userData.boxHelper) {
            tube.userData.boxHelper.update(); // Update the box helper
            tube.userData.boxHelper.visible = debugParams.showBoundingBox;
        }

        // Score updating
        if (!tube.userData.passed && birdModel.position.x > tube.position.x) {
            tube.userData.passed = true;
            // Update the score only for one tube of the pair, otherwise it would be updated twice
            if (tube.position.y < 0) {
                updateScore();
                console.log('Score:', score);
            }
        }
    });

    // Simulate the oscillation of the bird with the camera
    const oscillationTime = time / 1000;
    camera.position.y = Math.sin(oscillationTime * physicsParams.frequency) * physicsParams.amplitude;

    if (birdModel) {
        if (gameState === 'ready') {
            birdModel.position.y = 0;
            physicsParams.vel = 0;
        }
        if (gameState === 'playing') {
            
            // Decrease the gravity to obtain the desired gravity effect
            physicsParams.gravity --;
            if (physicsParams.gravity < -4.5) {
                physicsParams.gravity = -4.5;
            }
            
            physicsParams.vel += physicsParams.gravity * deltaTime;
            birdModel.position.y += physicsParams.vel * deltaTime;

            // Check if the bird is out of the screen -> If it is, reset the scene (GameOver).
            const minY = -5;
            if (birdModel.position.y < minY) {
                resetScene();
            }
        }

        // Same for the tubes
        if (birdModel.userData.boundingBox) {
            birdModel.userData.boundingBox.setFromObject(birdModel);
        }
        if (birdModel.userData.boxHelper) {
            birdModel.userData.boxHelper.update();
            birdModel.userData.boxHelper.visible = debugParams.showBoundingBox;
        }

        handleCollisions();
    }

    renderer.render(scene, camera);
}

function updateScore() {
    score += 1;
    document.getElementById('score').textContent = score;
    if (score > maxScore) {
        maxScore = score;
        document.getElementById('maxScore').textContent = maxScore;
    }
}

function showGameOver() {
    document.getElementById('gameOverScreen').style.display = 'flex';
}

function startGame() {
    console.log('Game started');

    document.getElementById('score').style.visibility = 'visible';
    document.getElementById('maxScore').style.visibility = 'visible';
    document.getElementById('maxText').style.visibility = 'visible';
    gameStarted = true;
    gameState = 'playing';
    document.getElementById('startScreen').style.display = 'none';
    gui.show();
    score = 0;
    
    // Load the audio.
    audioLoader.load(stream, function(buffer) {
        audio.setBuffer(buffer);
        audio.setLoop(true);
        audio.setVolume(0.3);
        audio.play();
    });


    console.log('Loading bird model...');

    // Load the bird model here because we want to start the game only when the bird model is loaded. -> We load the bird before all.
    const bird = new GLTFLoader();
    bird.load(
        'bird2.glb',
        function(gltf) {
            console.log('Bird model loaded successfully');
            birdModel = gltf.scene;
            birdModel.traverse(function(node) {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    node.geometry.computeBoundingBox();
                }
            });
            birdModel.position.set(-3, 0, 0);
            birdModel.rotation.y = Math.PI / 2;
            birdModel.userData.boundingBox = new THREE.Box3().setFromObject(birdModel);
            const boxHelper = new THREE.BoxHelper(birdModel, 0x00ff00);
            scene.add(boxHelper);
            birdModel.userData.boxHelper = boxHelper;
            scene.add(birdModel);
            console.log('Bird added to scene at position:', birdModel.position);

            // Reset the velocity.
            physicsParams.vel = 0;

            // Start the animation
            requestAnimationFrame(animate);
        },
    );

    // Render the initial scene
    renderer.render(scene, camera);
}

gui.hide();
document.getElementById('startButton').addEventListener('click', startGame);

document.getElementById('restartButton').addEventListener('click', function() {
    document.getElementById('gameOverScreen').style.display = 'none';
    startGame();
});

// Window resize handling
window.addEventListener('resize', onWindowResize, false);

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
