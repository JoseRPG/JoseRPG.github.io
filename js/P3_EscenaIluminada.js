// Modulos necesarios
import * as THREE from "../lib/three.module.js";
import { GLTFLoader } from "../lib/GLTFLoader.module.js";
import { OrbitControls } from "../lib/OrbitControls.module.js";
import { TWEEN } from "../lib/tween.module.min.js";
import { GUI } from "../lib/lil-gui.module.min.js";

// Variables de consenso
let renderer, scene, camera, controls, spaceship, ground, video;

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
    const materialLambert = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const materialPhong = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const materialBasic = new THREE.MeshBasicMaterial({ color: 0x0000ff });

    // Construir un suelo en el plano XZ
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    ground = new THREE.Mesh(groundGeometry, materialBasic);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true; // Permitir que el suelo reciba sombras
    scene.add(ground);

    // Construir una escena con 5 figuras diferentes posicionadas en los cinco vértices de un pentágono regular alrededor del origen
    const geometry = new THREE.BoxGeometry();
    for (let i = 0; i < 5; i++) {
        let material;
        if (i === 0) material = materialLambert;
        else if (i === 1) material = materialPhong;
        else material = materialBasic;

        const cube = new THREE.Mesh(geometry, material);
        cube.position.x = Math.cos((i / 5) * Math.PI * 2) * 3;
        cube.position.z = Math.sin((i / 5) * Math.PI * 2) * 3;
        cube.castShadow = true; // Permitir que los cubos emitan sombras
        scene.add(cube);
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
    const overlayTexture = new THREE.TextureLoader().load('images/Earth.jpg');
    const environmentTexture = new THREE.TextureLoader().load('images/Earth.jpg');

    // Materiales
    const materialOverlay = new THREE.MeshBasicMaterial({ map: overlayTexture });
    const materialEnvironment = new THREE.MeshBasicMaterial({ map: environmentTexture });

    // Habitación de entorno
    const roomGeometry = new THREE.BoxGeometry(10, 10, 10);
    const roomMaterial = new THREE.MeshBasicMaterial({ map: environmentTexture, side: THREE.BackSide });
    const room = new THREE.Mesh(roomGeometry, roomMaterial);
    scene.add(room);

    // Textura de video
    video = document.createElement('video');
    video.src = 'videos/Pixar.mp4';
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


    // Selector de color para cambio de algún material
    gui.addColor({ color: 0xff0000 }, 'color').name('Color').onChange(function (value) {
        materialLambert.color.set(value);
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
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
