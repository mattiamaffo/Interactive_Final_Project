import * as THREE from 'three';

export function generateTubes(color = 0x00ff00, height = 10, radiusTop = 2, radiusBottom = 2, radialSegments = 12) {
  const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
  const material = new THREE.MeshStandardMaterial({ color });
  
  const tube = new THREE.Mesh(geometry, material);
  tube.castShadow = true;
  tube.receiveShadow = true;

  // Add a circle to the top opening
  const circleGeometry = new THREE.CircleGeometry(radiusTop, 32);
  const circleMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const circle = new THREE.Mesh(circleGeometry, circleMaterial);

  circle.rotation.x = Math.PI / 2; // Rotate the circle to be horizontal
  circle.position.y = height / 2; // Position the circle at the top of the cylinder

  tube.add(circle);

  return tube; // Return both the tube and the circle
}
