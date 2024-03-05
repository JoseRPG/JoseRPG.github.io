// Modulos necesarios
import * as THREE from "../lib/three.module.js";
import {GLTFLoader} from "../lib/GLTFLoader.module.js";
import {OrbitControls} from "../lib/OrbitControls.module.js";
import {TWEEN} from "../lib/tween.module.min.js";
import {GUI} from "../lib/lil-gui.module.min.js";

// Variables de consenso
let renderer, scene, camera, controls;

// Otras globales
let spaceship;

// Acciones
init();
loadScene();
render();

function init() {
    // Motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

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
}

function loadScene() {
    const material = new THREE.MeshNormalMaterial();

    // Construir un suelo en el plano XZ
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    const ground = new THREE.Mesh(groundGeometry, material);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Construir una escena con 5 figuras diferentes posicionadas en los cinco vértices de un pentágono regular alrededor del origen
    const geometry = new THREE.BoxGeometry();
    for (let i = 0; i < 5; i++) {
        const cube = new THREE.Mesh(geometry, material);
        cube.position.x = Math.cos((i / 5) * Math.PI * 2) * 3;
        cube.position.z = Math.sin((i / 5) * Math.PI * 2) * 3;
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

    // Agregar una luz direccional
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);

    // Añadir a la escena unos ejes
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
}

function update() {
    if (spaceship) {
        spaceship.rotation.z += 0.01;
    }
}

function render() {
    requestAnimationFrame(render);
    update();
    renderer.render(scene, camera);
    controls.update();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
