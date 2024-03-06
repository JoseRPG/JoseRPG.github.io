// Modulos necesarios
import * as THREE from "../lib/three.module.js";
import { GLTFLoader } from "../lib/GLTFLoader.module.js";
import { OrbitControls } from "../lib/OrbitControls.module.js";
import { TWEEN } from "../lib/tween.module.min.js";
import { GUI } from "../lib/lil-gui.module.min.js";

// Variables de consenso
let renderer, scene, camera, controls, spaceship, ground, video, asteroids;

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
}

function render(delta) {
    requestAnimationFrame(render);
    update(delta);
    renderer.render(scene, camera);
    controls.update();
    asteroids.forEach(asteroid => {
        asteroid.rotation.x += 0.4;
        asteroid.position.z += Math.sin(Date.now() * 0.005) * 0.5;
        asteroid.position.x += Math.cos(Date.now() * 0.005) * 0.5;
    });
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
