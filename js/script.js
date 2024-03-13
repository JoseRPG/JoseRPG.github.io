// Modulos necesarios
import * as THREE from "../lib/three.module.js";
import { GLTFLoader } from "../lib/GLTFLoader.module.js";
import { OrbitControls } from "../lib/OrbitControls.module.js";
import { TWEEN } from "../lib/tween.module.min.js";
import { GUI } from "../lib/lil-gui.module.min.js";
import { FontLoader } from '../lib/FontLoader.module.js';
import { TextGeometry } from '../lib/TextGeometry.module.js';


// Variables de consenso
let renderer, scene, camera, controls, selectedSpaceship, spaceship, spaceships, panel, video, room, title, subtitle;
let elapsedTime = 0;
let moveLeft = false;
let moveRight = false;
let asteroids = [];
let asteroids2 = [];
let asteroids3 = [];
let texturesBackground = [];
let isAnimating = false;
let isExplosion = false;
let isSelection = false;
let round = 1;
const numAsteroids = 35;
const maxZ = 50;
const spaceshipSpeed = 0.1;
let asteroidsSpeed = 0.05;
let lifes = 3;
const asteroidMaterial = new THREE.MeshLambertMaterial({ map: new THREE.TextureLoader().load('images/asteroid.jpg') });
// Acciones
init();
loadScene();
loadGUI();
render();

function init() {
    // Motor de render
    renderer = new THREE.WebGLRenderer();
    var width = window.innerWidth;
    var height = window.innerHeight;
    
    // Calcular el alto en base a la proporción 2/3
    var calculatedHeight = (width / 3) * 2;

    // Verificar si el alto calculado es mayor que el alto actual de la ventana
    if (calculatedHeight > height) {
        // Calcular el ancho en base a la proporción 3/2
        var calculatedWidth = (height / 2) * 3;
        // Establecer el ancho y alto del renderizador
        renderer.setSize(calculatedWidth, height);
    } else {
        // Establecer el ancho y alto del renderizador
        renderer.setSize(width, calculatedHeight);
    }
    document.body.appendChild(renderer.domElement);

    // Habilitar el buffer de sombras
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Escena
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 10, 30);

    // Camara
    camera = new THREE.PerspectiveCamera(75, 3/2);
    camera.position.set(0, 2, 7);
    camera.rotation.set(10, 10, 10);

    // Agrega los controles de la cámara
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false;

    // Actualiza el tamaño de la ventana
    window.addEventListener('resize', onWindowResize);

    // Luces
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 3, 3);
    pointLight.position.set(0, 2.6, 2);
    pointLight.castShadow = true;
    scene.add(pointLight);

    // Event listeners para las teclas izquierda y derecha
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
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

function selectNextShip() {
    if(isAnimating) return;
    // Guardar la posición de la última nave
    const initialPosition = {
        x: spaceships[5].position.x,
        z: spaceships[5].position.z
    };

    // Animar el deslizamiento de las naves
    for (let i = 5; i > 0; i--) {
        const nextPosition = {
            x: spaceships[i - 1].position.x,
            z: spaceships[i - 1].position.z
        };
        animateShip(spaceships[i], nextPosition);
    }
    // Mover la primera nave a la posición guardada
    animateShip(spaceships[0], initialPosition);

    selectedSpaceship > 4 ? selectedSpaceship = 0 : selectedSpaceship++;
}

function selectPreviousShip() {
    if(isAnimating) return;
    // Guardar la posición de la primera nave
    const initialPosition = {
        x: spaceships[0].position.x,
        z: spaceships[0].position.z
    };

    // Animar el deslizamiento de las naves
    for (let i = 0; i < 5; i++) {
        const nextPosition = {
            x: spaceships[i + 1].position.x,
            z: spaceships[i + 1].position.z
        };
        animateShip(spaceships[i], nextPosition);
    }
    // Mover la última nave a la posición guardada
    animateShip(spaceships[5], initialPosition);

    selectedSpaceship < 1 ? selectedSpaceship = 5 : selectedSpaceship--;
}

// Función para animar el desplazamiento de una nave a una nueva posición
function animateShip(ship, newPosition) {
    new TWEEN.Tween(ship.position)
        .to(newPosition, 700)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onStart(function () {
            isAnimating = true;
        })
        .onComplete(function () {
            isAnimating = false;
        })
        .start();
}

function loadScene() {
    const panelGeometry = new THREE.PlaneGeometry(30, 20);
    panel = new THREE.Mesh(panelGeometry, new THREE.MeshBasicMaterial({ color: 0x0000ff }));
    panel.position.y = 0;
    panel.position.z = -5;
    scene.add(panel);

    // Definir geometrías de asteroides
    const asteroidGeometries = [
        new THREE.SphereGeometry(0.5, 5, 5),
        new THREE.SphereGeometry(0.5, 3, 3),
        new THREE.DodecahedronGeometry(0.5)
    ];
    
    for (let i = 0; i < numAsteroids; i++) {
        const asteroidGeometry = asteroidGeometries[i % asteroidGeometries.length];
        const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
        asteroid.position.x = Math.random() * 14 - 7; // Posición aleatoria en el rango de -7 a 7 en el eje x
        asteroid.position.z = -(Math.random() * maxZ + 15); // Posición aleatoria en el rango de -maxZ a 15 en el eje z
        scene.add(asteroid);
        asteroids.push(asteroid);
    }

    for (let i = 0; i < numAsteroids/4; i++) {
        const asteroidGeometry = new THREE.TetrahedronGeometry(0.5);
        const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
        asteroid.position.x = Math.random() * 14 - 7; // Posición aleatoria en el rango de -7 a 7 en el eje x
        asteroid.position.z = -(Math.random() * maxZ + 15); // Posición aleatoria en el rango de -maxZ a 15 en el eje z
        asteroids2.push(asteroid);
    }

    for (let i = 0; i < numAsteroids/8; i++) {
        const asteroidGeometry = new THREE.BoxGeometry(0.5);
        const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
        if (i % 2 === 0) {
            asteroid.position.x = Math.random() * 7; // Posición aleatoria en el rango de 0 a 7 en el eje x
        } else {
            asteroid.position.x = -(Math.random() * 7); // Posición aleatoria en el rango de -7 a 0 en el eje x
        }
        asteroid.position.z = -(Math.random() * 15 + 15); // Posición aleatoria en el rango de -30 a -15 en el eje z
        asteroids3.push(asteroid);
    }

    // Añadir a la escena las naves espaciales a partir de ficheros GLTF
    const loader = new GLTFLoader();
    spaceships = [];
    let promises = [];

    for (let i = 0; i < 6; i++) {
        promises.push(new Promise((resolve, reject) => {
            loader.load('models/naves/spaceship' + i + '.gltf', function (gltf) {
                const spaceship = gltf.scene;
                scene.add(spaceship);
                spaceships[i] = spaceship;
                resolve();
            }, undefined, function (error) {
                console.error(error);
                reject(error);
            });
        }));
    }

    Promise.all(promises).then(() => {
        // All models loaded
        for (let i = 0; i < 6; i++) {
            spaceships[i].position.z = Math.cos((i / 6) * Math.PI * 2) * 3;
            spaceships[i].position.x = Math.sin((i / 6) * Math.PI * 2) * 3;
        }
        selectedSpaceship = 0;
        isSelection = true;
    }).catch(error => {
        console.error('Error loading models:', error);
    });

    // Cargar texturas del espacio
    const textureLoader = new THREE.CubeTextureLoader();
    texturesBackground[0] = textureLoader.load([
        './images/bkg/blue/bkg1_left.png', './images/bkg/blue/bkg1_right.png',
        './images/bkg/blue/bkg1_bot.png', './images/bkg/blue/bkg1_top.png',
        './images/bkg/blue/bkg1_front.png', './images/bkg/blue/bkg1_back.png',
    ]);

    texturesBackground[1] = textureLoader.load([
        './images/bkg/lightblue/left.png', './images/bkg/lightblue/right.png',
        './images/bkg/lightblue/bot.png', './images/bkg/lightblue/top.png',
        './images/bkg/lightblue/front.png', './images/bkg/lightblue/back.png',
    ]);

    texturesBackground[2] = textureLoader.load([
        './images/bkg/red/bkg1_left2.png', './images/bkg/red/bkg1_right1.png',
        './images/bkg/red/bkg1_bottom4.png', './images/bkg/red/bkg1_top3.png',
        './images/bkg/red/bkg1_front5.png', './images/bkg/red/bkg1_back6.png',
    ]);

    texturesBackground[3] = textureLoader.load([
        './images/bkg/red/bkg2_left2.png', './images/bkg/red/bkg2_right1.png',
        './images/bkg/red/bkg2_bottom4.png', './images/bkg/red/bkg2_top3.png',
        './images/bkg/red/bkg2_front5.png', './images/bkg/red/bkg2_back6.png',
    ]);

    // Crear material con textura de cubo
    var material = new THREE.MeshBasicMaterial({ 
        envMap: texturesBackground[0],
        side: THREE.BackSide,
        depthWrite: false
    });

    // Crear un cubo con la textura de cubo
    room = new THREE.Mesh(new THREE.BoxGeometry(40,40,40), material);
    room.position.copy(camera.position);
    scene.add(room);

    // let cube = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 10), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
    // cube.position.y = -1;
    // cube.receiveShadow = true;
    // scene.add(cube);

    // Textura de video
    video = document.createElement('video');
    video.src = 'videos/star_wars_opening.mp4';
    video.loop = true;
    //video.muted = true;
    video.volume = 0.1;
    video.play();
    const texture = new THREE.VideoTexture(video);
    panel.material = new THREE.MeshBasicMaterial({ map: texture });

    // Insertar título en threejs
    const loaderTitle = new FontLoader();
    const materialTitle = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    loaderTitle.load('fonts/helvetiker_regular.typeface.json', function (font) {
        const geometry = new TextGeometry('ASTEROIDS', {
            font: font,
            size: 2.5,
            height: 0.1,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelSegments: 5
        });
        title = new THREE.Mesh(geometry, materialTitle);
        title.position.x = -10;
        title.position.y = 1.5;
        title.position.z = -3;
        title.rotation.x = -0.5;
        scene.add(title);
    });

    loaderTitle.load('fonts/helvetiker_regular.typeface.json', function (font) {
        const geometry = new TextGeometry('by JR productions', {
            font: font,
            size: 0.5,
            height: 0.1,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelSegments: 5
        });
        subtitle = new THREE.Mesh(geometry, materialTitle);
        subtitle.position.x = -2.5;
        subtitle.position.y = 0.5;
        subtitle.position.z = -3;
        subtitle.rotation.x = -0.5;
        scene.add(subtitle);
    });
        

}

function loadGUI() {
    // Interfaz de usuario
    const gui = new GUI();

    // Funcion de disparo de animaciones
    gui.add({ Flip: function () {
        if(isAnimating) return;

        // Iterar sobre cada nave en el array spaceships
        spaceships.forEach(element => {
            // Animación con Tween para cada nave
            const initialRotation = { z: element.rotation.z };
            const targetRotation = { z: element.rotation.z + Math.PI * 2 };
            new TWEEN.Tween(initialRotation)
                .to(targetRotation, 2000)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .onUpdate(function () {
                    element.rotation.z = initialRotation.z; // Aplicar la rotación interpolada
                })
                .onStart(function () {
                    isAnimating = true;
                })
                .onComplete(function () {
                    isAnimating = false;
                })
                .start();});
    }}, 'Flip');

    // Botones de selección de naves
    const selectShipButtons = document.createElement('div');
    selectShipButtons.style.position = 'absolute';
    selectShipButtons.style.bottom = '50px';
    selectShipButtons.style.left = '50%';

    selectShipButtons.innerHTML = `
        <button id="prevShipButton">◄</button>
        <button id="nextShipButton">►</button>
        <button id="startGameButton">Start</button>
    `;
    document.body.appendChild(selectShipButtons);

    // Agregar event listeners a los botones
    document.getElementById('prevShipButton').addEventListener('click', selectPreviousShip);
    document.getElementById('nextShipButton').addEventListener('click', selectNextShip);
    document.getElementById('startGameButton').addEventListener('click', startGame);

    const textureControls = gui.addFolder('Textures');
    textureControls.add({ cambiarMaterial: "Sólido"}, 'cambiarMaterial', { Solido: 'solido', Alámbrico: 'alambrico' }).name('Material de los asteroides').onChange(function(value) {
        // Crear el nuevo material
        let newMaterial;
        if (value === 'solido') {
            newMaterial = asteroidMaterial;
        } else if (value === 'alambrico') {
            newMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
        }
        asteroids.forEach(asteroid => {
            asteroid.material = newMaterial;
        });
        asteroids2.forEach(asteroid => {
            asteroid.material = newMaterial;
        });
        asteroids3.forEach(asteroid => {
            asteroid.material = newMaterial;
        });
    });

    // Definir un objeto para almacenar las opciones de textura
    const textureOptions = {
        "Blue Background": texturesBackground[0],
        "Light Blue Background": texturesBackground[1],
        "Red Background 1": texturesBackground[2],
        "Red Background 2": texturesBackground[3],
    };

    // Función para cambiar la textura de fondo
    function changeBackgroundTexture(texture) {
        room.material.envMap = texture;
        room.material.needsUpdate = true;
    }

    // Agregar un control de selección al GUI
    textureControls.add(textureOptions, 'texture', Object.keys(textureOptions)).name('Background Texture').onChange(function(value) {
        changeBackgroundTexture(textureOptions[value]);
    });

    // Boton de play/pause y checkbox de mute
    const videoControls = gui.addFolder('Audio y cinemáticas');
    videoControls.add(video, 'play').name('Play');
    videoControls.add(video, 'pause').name('Pause');
    // Crear un control de volumen
    const volumeControl = videoControls.add(video, 'volume', 0, 1).name('Volume');

    // Event listener para cambiar el volumen cuando se cambie el control
    volumeControl.onChange(function(value) {
        video.volume = value;
    });
    videoControls.add(video, 'muted').name('Mute');


    const adminControls = gui.addFolder('Modo admin');
    adminControls.add(controls, 'enabled').name('Activar/Desactivar OrbitControls');
}

function update() {
    TWEEN.update();

    if(spaceship) {
        // Actualizar la posición y la rotación de la nave según las teclas presionadas
        let targetRotation = 0;

        if (moveLeft && spaceship.position.x > -6) {
            // Mover la nave hacia la izquierda y rotar hacia la izquierda
            spaceship.position.x -= spaceshipSpeed;
            targetRotation = Math.PI / 4; // Angulo de inclinación hacia la izquierda
        }

        if (moveRight && spaceship.position.x < 6) {
            // Mover la nave hacia la derecha y rotar hacia la derecha
            spaceship.position.x += spaceshipSpeed;
            targetRotation = -Math.PI / 4; // Angulo de inclinación hacia la derecha
        }

        // Interpolar la rotación actual de la nave hacia la rotación objetivo
        spaceship.rotation.z = THREE.MathUtils.lerp(spaceship.rotation.z, targetRotation, 0.1);

        // Verificar colisiones con los asteroides lejanos
        asteroids.forEach(asteroid => {
            asteroid.position.z += asteroidsSpeed; // Avance constante hacia la coordenada 0 en el eje z

            // Calcular la distancia entre la nave y el asteroide
            const distance = spaceship.position.distanceTo(asteroid.position);

            const minCollisionDistance = 1;

            // Verificar si hay colisión
            if (!isExplosion && distance < minCollisionDistance) {
                // Colisión detectada
                isExplosion = true
                explode(asteroid.position);
                asteroids.splice(asteroids.indexOf(asteroid), 1);
                scene.remove(asteroid);
                lifes--;
                if (lifes === 0) {
                    alert('Game Over. Tu tiempo ha sido ' + elapsedTime + ' segundos.');
                    location.reload();
                }
            }

            // Eliminar asteroides que hayan pasado más allá de la coordenada 10
            if (asteroid.position.z > 10) {
                asteroid.position.z = -(Math.random() * maxZ + 20); // Reiniciar la posición del asteroide
            }
        });

        if (round > 1) {
            // Verificar colisiones con los asteroides lejanos
            asteroids2.forEach(asteroid => {
            asteroid.position.z += asteroidsSpeed * 2; // Avance constante hacia la coordenada 0 en el eje z

            // Calcular la distancia entre la nave y el asteroide
            const distance = spaceship.position.distanceTo(asteroid.position);

            const minCollisionDistance = 1;

            // Verificar si hay colisión
            if (!isExplosion && distance < minCollisionDistance) {
                // Colisión detectada
                isExplosion = true
                explode(asteroid.position);
                asteroids.splice(asteroids2.indexOf(asteroid), 1);
                scene.remove(asteroid);
                lifes--;
                if (lifes === 0) {
                    alert('Game Over');
                    location.reload();
                }
            }

            // Eliminar asteroides que hayan pasado más allá de la coordenada 10
            if (asteroid.position.z > 10) {
                asteroid.position.z = -(Math.random() * maxZ + 20); // Reiniciar la posición del asteroide
            }
        });
        }

        if (round > 2) {
             // Verificar colisiones con los asteroides lejanos
                asteroids3.forEach((asteroid, index) => {
                asteroid.position.z += asteroidsSpeed/2; // Avance constante hacia la coordenada 0 en el eje z
                if (index % 2 === 0) {
                    asteroid.position.x -= 0.01;
                } else {
                    asteroid.position.x += 0.01;
                }
    
                // Calcular la distancia entre la nave y el asteroide
                const distance = spaceship.position.distanceTo(asteroid.position);
                const minCollisionDistance = 1;
    
                // Verificar si hay colisión
                if (!isExplosion && distance < minCollisionDistance) {
                    // Colisión detectada
                    isExplosion = true
                    explode(asteroid.position);
                    asteroids.splice(asteroids3.indexOf(asteroid), 1);
                    scene.remove(asteroid);
                    lifes--;
                    if (lifes === 0) {
                        alert('Game Over');
                        location.reload();
                    }
                }
    
                // Eliminar asteroides que hayan pasado más allá de la coordenada 10
                if (asteroid.position.z > 10) {
                    asteroid.position.z = -(Math.random() * 15 + 15);
                    if (index % 2 === 0) {
                        asteroid.position.x = Math.random() * 5; // Posición aleatoria en el rango de 0 a 5 en el eje x
                    } else {
                        asteroid.position.x = -(Math.random() * 5); // Posición aleatoria en el rango de -5 a 0 en el eje x
                    }
                }
            });
        }
            
        
    }
}

function increaseAsteroidSpeed() {
    asteroidsSpeed += 0.005; // Aumentar la velocidad de los asteroides en 0.1
}

function explode(position) {
    const explosionGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const explosionMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, transparent: true, opacity: 0.6 });
    const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
    explosion.position.copy(position);
    scene.add(explosion);

    const light = new THREE.PointLight(0xff0000, 1, 20);
    light.position.copy(position);
    scene.add(light);

    new TWEEN.Tween(explosion.scale)
        .to({ x: 5, y: 5, z: 5 }, 500)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(() => {
            scene.remove(explosion);
            scene.remove(light);
            isExplosion = false;
        })
        .start();

    new TWEEN.Tween(light)
        .to({ intensity: 0 }, 500)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
}


function render() {
    requestAnimationFrame(render);
    update();
    if (controls.enabled) { controls.update(); }

    if (isSelection) {
        spaceships.forEach(element => {
            element.rotation.y += 0.01;
        });
    } else {
        asteroids.forEach((element, index) => {
            if (index % 4 === 0) {
                element.rotation.x += 0.01;
            } else if (index % 4 === 1) {
                element.rotation.x -= 0.01;
                element.rotation.y -= 0.01;
            } else if (index % 4 === 2) {
                element.rotation.z += 0.01;
                element.rotation.y -= 0.01;
            } else {
                element.rotation.x += 0.01;
                element.rotation.y += 0.01;
                element.rotation.z += 0.01;
            }
        });

        asteroids2.forEach(element => element.rotation.x += 0.05);
        asteroids3.forEach(element => element.rotation.y += 0.005);
    }
    room.position.copy(camera.position);
    renderer.render(scene, camera);
}

function onWindowResize() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    
    // Calcular el alto en base a la proporción 2/3
    var calculatedHeight = (width / 3) * 2;

    // Verificar si el alto calculado es mayor que el alto actual de la ventana
    if (calculatedHeight > height) {
        // Calcular el ancho en base a la proporción 3/2
        var calculatedWidth = (height / 2) * 3;
        // Establecer el ancho y alto del renderizador
        renderer.setSize(calculatedWidth, height);
    } else {
        // Establecer el ancho y alto del renderizador
        renderer.setSize(width, calculatedHeight);
    }
}

function addNewAsteroids() {
    asteroids2.forEach(asteroid => {
        scene.add(asteroid);
    });
    round = 2;
}

function addLastAsteroids() {
    asteroids3.forEach(asteroid => {
        scene.add(asteroid);
    });
    round = 3;
}

function startTimer() {
    // Reiniciar el tiempo transcurrido y detener el intervalo anterior si existe
    elapsedTime = 0;

    // Actualizar el cronómetro cada segundo
    setInterval(updateTimer, 1000);
}

function updateTimer() {
    elapsedTime++; // Incrementar el tiempo transcurrido en segundos

    // Mostrar el tiempo transcurrido en el elemento HTML con id "timer"
    const timerElement = document.getElementById('startGameButton');
    timerElement.textContent = "Tiempo: " + elapsedTime + "s";

}


function startGame() {
    spaceship = spaceships[selectedSpaceship];
    isSelection = false;

    scene.remove(title);
    scene.remove(subtitle);
    scene.remove(panel);
    // Colocar la nave seleccionada

    // Animar rotación
    const targetRotation = new THREE.Quaternion(); // Rotación destino hacia -z
    targetRotation.setFromAxisAngle(new THREE.Vector3(0, 0, 0), Math.PI); // Rotación hacia -z
    new TWEEN.Tween(spaceship.rotation)
        .to({ x: targetRotation.x, y: targetRotation.y, z: targetRotation.z }, 1000) // Duración de la animación en milisegundos
        .easing(TWEEN.Easing.Quadratic.InOut) // Tipo de interpolación
        .start(); // Iniciar la animación

    // Animar posición
    const targetPosition = new THREE.Vector3(0, 0, 0); // Posición destino
    new TWEEN.Tween(spaceship.position)
        .to({ x: targetPosition.x, y: targetPosition.y, z: targetPosition.z }, 1000) // Duración de la animación en milisegundos
        .easing(TWEEN.Easing.Quadratic.InOut) // Tipo de interpolación
        .start(); // Iniciar la animación

    // Ocultar las demás naves
    spaceships.forEach(element => {
        if (element !== spaceship) {
            element.visible = false;
        }
    });

    // Animar posición cámara
    const targetCameraPosition = new THREE.Vector3(0, 10, 0);
    new TWEEN.Tween(camera.position)
        .to({ x: targetCameraPosition.x, y: targetCameraPosition.y, z: targetCameraPosition.z }, 1000)
        .easing(TWEEN.Easing.Quadratic.InOut) // Tipo de interpolación
        .start();

    // Animar dirección de la cámara
    const targetLookAt = new THREE.Vector3(0, -25, 0);
    // Calcular la dirección hacia donde la cámara debe mirar
    const direction = targetLookAt.clone().sub(camera.position).normalize();

    // Calcular los ángulos de rotación a partir de la dirección
    const pitch = Math.asin(direction.y);
    const yaw = Math.atan2(-direction.x, -direction.z);

    // Animar la rotación de la cámara
    new TWEEN.Tween(camera.rotation)
        .to({ x: pitch, y: yaw, z: 0 }, 1000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();

    // Limpiar la interfaz
    const selectShipButtons = document.querySelector('div');
    selectShipButtons.style.display = 'none';

    setInterval(increaseAsteroidSpeed, 3000); // Aumentar la velocidad de los asteroides cada 10 segundos
    setTimeout(addNewAsteroids, 20000); // Añadir segunda oleada asteroides
    setTimeout(addLastAsteroids, 40000); // Añadir tercera oleada asteroides

    startTimer();
}
