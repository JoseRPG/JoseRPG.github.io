// Modulos necesarios
import * as THREE from "../lib/three.module.js";
import { GLTFLoader } from "../lib/GLTFLoader.module.js";
import { OrbitControls } from "../lib/OrbitControls.module.js";
import { TWEEN } from "../lib/tween.module.min.js";
import { GUI } from "../lib/lil-gui.module.min.js";

// Variables de consenso
let renderer, scene, camera, controls, spaceship, ground, video, asteroids;
let moveLeft = false;
let moveRight = false;
let distantAsteroids = [];
const numDistantAsteroids = 20;
const maxZ = 50;
// Acciones
init();
loadScene();
loadGUI();
render();

function init() {
    // Motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Habilitar el buffer de sombras
    renderer.shadowMap.enabled = true;

    // Escena
    scene = new THREE.Scene();

    // Camara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0.5, 2, 7);
    camera.lookAt(new THREE.Vector3(0, 1, 0));

    // Agrega los controles de la cámara
    controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    // Actualiza el tamaño de la ventana
    window.addEventListener('resize', onWindowResize);

    // Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 1, 0);
    directionalLight.castShadow = true; // Habilitar sombras
    scene.add(directionalLight);

    const focalLight = new THREE.SpotLight(0xffffff, 1);
    focalLight.position.set(0, 3, 0);
    focalLight.castShadow = true; // Habilitar sombras
    scene.add(focalLight);

    // Event listeners para las teclas izquierda y derecha
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
}

// Función para verificar la colisión entre la nave y los asteroides
function checkCollisionWithAsteroids(spaceship, asteroids) {
    // Verificar si la nave y los asteroides son instancias de THREE.Mesh
    if (!(spaceship instanceof THREE.Mesh) || !Array.isArray(asteroids)) {
        console.error("La nave o los asteroides no son instancias válidas de THREE.Mesh.");
        return false;
    }

    // Verificar si la nave tiene geometría definida
    if (!spaceship.geometry) {
        console.error("La nave no tiene una geometría definida.");
        return false;
    }

    // Iterar sobre los asteroides y verificar la colisión con la nave
    for (const asteroid of asteroids) {
        // Verificar si el asteroide es una instancia de THREE.Mesh y tiene geometría definida
        if (asteroid instanceof THREE.Mesh && asteroid.geometry) {
            const distance = spaceship.position.distanceTo(asteroid.position);
            const minDistance = spaceship.geometry.boundingSphere.radius + asteroid.geometry.boundingSphere.radius;
            if (distance < minDistance) {
                // Colisión detectada
                return true;
            }
        } else {
            console.error("El asteroide no es una instancia válida de THREE.Mesh o no tiene geometría definida.");
        }
    }

    // No se detectó ninguna colisión con los asteroides
    return false;
}




// Event listeners para las teclas izquierda y derecha
function onKeyDown(event) {
    switch (event.key) {
        case 'ArrowLeft':
            moveLeft = true;
            break;
        case 'ArrowRight':
            moveRight = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.key) {
        case 'ArrowLeft':
            moveLeft = false;
            break;
        case 'ArrowRight':
            moveRight = false;
            break;
    }
}


function loadScene() {

    // Construir un suelo en el plano XZ
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    ground = new THREE.Mesh(groundGeometry, new THREE.MeshBasicMaterial({ color: 0x0000ff }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Definir geometrías de asteroides
    const asteroidGeometries = [
        new THREE.SphereGeometry(0.5, 32, 32),
        new THREE.TetrahedronBufferGeometry(0.5),
        new THREE.DodecahedronGeometry(0.5)
    ];

    // Cargar texturas para los asteroides
    const asteroidTexture = new THREE.TextureLoader().load('images/metal_128.jpg');

    // Definir materiales para los asteroides
    const asteroidMaterials = [
        new THREE.MeshLambertMaterial({ map: asteroidTexture }), // Para Lambert, utiliza map para aplicar la textura
        new THREE.MeshPhongMaterial({ map: asteroidTexture }) // Para Phong, también utiliza map para aplicar la textura
    ];

    // Construir asteroides
    asteroids = [];
    for (let i = 0; i < 5; i++) {
        const asteroidGeometry = asteroidGeometries[i % asteroidGeometries.length];
        const asteroidMaterial = asteroidMaterials[i % asteroidMaterials.length];

        const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
        asteroid.position.x = Math.cos((i / 5) * Math.PI * 2) * 3;
        asteroid.position.z = Math.sin((i / 5) * Math.PI * 2) * 3;
        scene.add(asteroid);
        asteroids.push(asteroid);
    }

    for (let i = 0; i < numDistantAsteroids; i++) {
        const asteroidGeometry = asteroidGeometries[i % asteroidGeometries.length];
        const asteroidMaterial = asteroidMaterials[i % asteroidMaterials.length];

        const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
        asteroid.position.x = Math.random() * 10 - 5; // Posición aleatoria en el rango de -5 a 5 en el eje x
        asteroid.position.y = Math.random() * 2; // Posición aleatoria en el rango de 0 a 2 en el eje y
        asteroid.position.z = -(Math.random() * maxZ); // Posición aleatoria en el rango de -maxZ a 0 en el eje z
        scene.add(asteroid);
        distantAsteroids.push(asteroid);
    }

    // Añadir a la escena un modelo importado en el centro del pentágono
    const loader = new GLTFLoader();
    loader.load('models/naves/sin_nombre.gltf', function (gltf) {
        spaceship = gltf.scene;
        spaceship.rotation.x = Math.PI / 2;
        spaceship.position.y = 1;
        scene.add(spaceship);
    }, undefined, function (error) {
        console.error(error);
    });

    // Texturas
    const environmentTexture = new THREE.TextureLoader().load('images/space.jpg');

    // Habitación de entorno
    const roomGeometry = new THREE.SphereGeometry(100, 10, 10);
    const roomMaterial = new THREE.MeshBasicMaterial({ map: environmentTexture, side: THREE.BackSide });
    const room = new THREE.Mesh(roomGeometry, roomMaterial);
    scene.add(room);

    // Textura de video
    video = document.createElement('video');
    video.src = 'videos/star_wars.mp4';
    video.loop = true;
    video.muted = true;
    video.play();
    const texture = new THREE.VideoTexture(video);
    const floorMaterial = new THREE.MeshBasicMaterial({ map: texture });
    ground.material = floorMaterial; // Aplicar la textura de video al suelo
}

let isAnimating = false;
function loadGUI() {
    // Interfaz de usuario
    const gui = new GUI();

    // Funcion de disparo de animaciones
    const animateButton = gui.add({ animate: function () {
        // Verificar si ya se está reproduciendo una animación
        if (!isAnimating) {
            // Animación con Tween
            const initialRotation = { y: spaceship.rotation.y };
            const targetRotation = { y: spaceship.rotation.y + Math.PI * 2 };
            const tween = new TWEEN.Tween(initialRotation)
                .to(targetRotation, 2000)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .onUpdate(function () {
                    spaceship.rotation.y = initialRotation.y;
                })
                .onStart(function () {
                    isAnimating = true;
                })
                .onComplete(function () {
                    isAnimating = false;
                })
                .start();
        }
    }}, 'animate');

    // Slider de control de radio del pentagono
    gui.add(ground.scale, 'x', 1, 5).name('Radio del pentágono');

    // Checkbox para alambrico/solido
    gui.add(ground.material, 'wireframe').name('Alámbrico/Sólido');

    // Checkbox de sombras
    gui.add({ shadowEnabled: true }, 'shadowEnabled').name('Sombras').onChange(function (value) {
        // Habilitar/deshabilitar sombras en las luces
        scene.traverse(function (node) {
            if (node instanceof THREE.Light) {
                if (node instanceof THREE.DirectionalLight || node instanceof THREE.SpotLight) {
                    node.castShadow = value;
                }
            }
        });
    });

    // Boton de play/pause y checkbox de mute
    const videoControls = gui.addFolder('Controles de video');
    videoControls.add(video, 'play').name('Play');
    videoControls.add(video, 'pause').name('Pause');
    videoControls.add(video, 'muted').name('Mute');
}

function update(delta) {
    TWEEN.update();

    // Actualizar la posición y la rotación de la nave según las teclas presionadas
    const movementSpeed = 0.1;

    // Inicializar la rotación de la nave
    let targetRotation = 0;

    if (moveLeft) {
        // Mover la nave hacia la izquierda y rotar hacia la izquierda
        spaceship.position.x -= movementSpeed;
        targetRotation = Math.PI / 4; // Angulo de inclinación hacia la izquierda
    }

    if (moveRight) {
        // Mover la nave hacia la derecha y rotar hacia la derecha
        spaceship.position.x += movementSpeed;
        targetRotation = -Math.PI / 4; // Angulo de inclinación hacia la derecha
    }

    // Interpolar la rotación actual de la nave hacia la rotación objetivo
    spaceship.rotation.y = THREE.MathUtils.lerp(spaceship.rotation.y, targetRotation, 0.1);

    // Verificar colisiones con los asteroides lejanos
    distantAsteroids.forEach(asteroid => {
        asteroid.position.z += 0.05; // Avance constante hacia la coordenada 0 en el eje z

        // Verificar colisión con la nave
        if (checkCollisionWithAsteroids(spaceship, asteroid)) {
            // Mostrar explosión
            showExplosion(spaceship.position.clone());

            // Remover asteroide
            scene.remove(asteroid);
            distantAsteroids.splice(distantAsteroids.indexOf(asteroid), 1);
        }

        // Eliminar asteroides que hayan pasado más allá de la coordenada 0
        if (asteroid.position.z > 10) {
            scene.remove(asteroid);
            distantAsteroids.splice(distantAsteroids.indexOf(asteroid), 1);
        }
    });
}

// Función para mostrar una explosión en una posición específica
function showExplosion(position) {
    console.log("Explosión en", position);
    // Configurar la geometría y el material de las partículas de la explosión
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const particleCount = 100; // Número de partículas en la explosión

    for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * 0.5 - 0.25;
        const y = Math.random() * 0.5 - 0.25;
        const z = Math.random() * 0.5 - 0.25;

        vertices.push(x, y, z);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const material = new THREE.PointsMaterial({
        size: 0.1,
        color: 0xff0000 // Color de las partículas de la explosión
    });

    // Crear el objeto de partículas y añadirlo a la escena
    const explosion = new THREE.Points(geometry, material);
    explosion.position.copy(position);
    scene.add(explosion);

    // Eliminar las partículas después de un tiempo
    setTimeout(() => {
        scene.remove(explosion);
    }, 1000); // Cambia el tiempo de acuerdo a la duración deseada de la explosión
}




function render(delta) {
    requestAnimationFrame(render);
    update(delta);
    renderer.render(scene, camera);
    controls.update();

    // Verificar si spaceship está definido antes de continuar
    if (spaceship) {
        asteroids.forEach(asteroid => {
            // Calcula la posición relativa de los asteroides respecto a la nave
            const relativePosition = new THREE.Vector3();
            relativePosition.copy(asteroid.position).sub(spaceship.position);

            // Calcula el ángulo de rotación alrededor de la nave
            const angle = 0.01;

            // Aplica una rotación a la posición relativa
            relativePosition.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);

            // Actualiza la posición del asteroide
            asteroid.position.copy(relativePosition).add(spaceship.position);

            // Rota el asteroide alrededor de su propio eje
            asteroid.rotation.x += 0.04;
            asteroid.rotation.y += 0.03;
            asteroid.rotation.z += 0.02;
        });
    }
    renderer.render(scene, camera);
}



function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
