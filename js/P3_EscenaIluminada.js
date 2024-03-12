// Modulos necesarios
import * as THREE from "../lib/three.module.js";
import { GLTFLoader } from "../lib/GLTFLoader.module.js";
import { OrbitControls } from "../lib/OrbitControls.module.js";
import { TWEEN } from "../lib/tween.module.min.js";
import { GUI } from "../lib/lil-gui.module.min.js";

// Variables de consenso
let renderer, scene, camera, controls, selectedSpaceship, spaceship, spaceships, ground, video, room;
let moveLeft = false;
let moveRight = false;
let asteroids = [];
let asteroids2 = [];
let asteroids3 = [];
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
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Habilitar el buffer de sombras
    renderer.shadowMap.enabled = true;

    // Escena
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.01);

    // Camara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
    camera.position.set(0, 2, 7);
    camera.lookAt(new THREE.Vector3(0, 1, 0));

    // Agrega los controles de la cámara
    controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

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
    // Construir un suelo en el plano XZ
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    ground = new THREE.Mesh(groundGeometry, new THREE.MeshBasicMaterial({ color: 0x0000ff }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Definir geometrías de asteroides
    const asteroidGeometries = [
        new THREE.SphereGeometry(0.5, 5, 5),
        new THREE.SphereGeometry(0.5, 3, 3),
        new THREE.DodecahedronGeometry(0.5)
    ];
    
    for (let i = 0; i < numAsteroids; i++) {
        const asteroidGeometry = asteroidGeometries[i % asteroidGeometries.length];
        const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
        asteroid.position.x = Math.random() * 10 - 5; // Posición aleatoria en el rango de -5 a 5 en el eje x
        asteroid.position.z = -(Math.random() * maxZ + 10); // Posición aleatoria en el rango de -maxZ a 10 en el eje z
        scene.add(asteroid);
        asteroids.push(asteroid);
    }

    for (let i = 0; i < numAsteroids/4; i++) {
        const asteroidGeometry = new THREE.TetrahedronGeometry(0.5);
        const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
        asteroid.position.x = Math.random() * 10 - 5; // Posición aleatoria en el rango de -5 a 5 en el eje x
        asteroid.position.z = -(Math.random() * maxZ + 10); // Posición aleatoria en el rango de -maxZ a 10 en el eje z
        asteroids2.push(asteroid);
    }

    for (let i = 0; i < numAsteroids/8; i++) {
        const asteroidGeometry = new THREE.BoxGeometry(0.5);
        const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
        if (i % 2 === 0) {
            asteroid.position.x = Math.random() * 5; // Posición aleatoria en el rango de 0 a 5 en el eje x
        } else {
            asteroid.position.x = -(Math.random() * 5); // Posición aleatoria en el rango de -5 a 0 en el eje x
        }
        asteroid.position.z = -(Math.random() * 15 + 10); // Posición aleatoria en el rango de -20 a -10 en el eje z
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

    // Texturas
    const environmentTexture = new THREE.TextureLoader().load('images/space.jpg');

    // Habitación de entorno
    const roomGeometry = new THREE.SphereGeometry(150);
    const roomMaterial = new THREE.MeshBasicMaterial({ map: environmentTexture, side: THREE.BackSide });
    room = new THREE.Mesh(roomGeometry, roomMaterial);
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

function loadGUI() {
    // Interfaz de usuario
    const gui = new GUI();

    // Funcion de disparo de animaciones
    gui.add({ animate: function () {
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
    }}, 'animate');

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

    gui.add({ cambiarMaterial: "Sólido"}, 'cambiarMaterial', { Solido: 'solido', Alámbrico: 'alambrico' }).name('Material de los asteroides').onChange(function(value) {
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

    // Boton de play/pause y checkbox de mute
    const videoControls = gui.addFolder('Controles de video');
    videoControls.add(video, 'play').name('Play');
    videoControls.add(video, 'pause').name('Pause');
    videoControls.add(video, 'muted').name('Mute');
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
                    alert('Game Over');
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
                    asteroid.position.z = -(Math.random() * 15 + 10);
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
    // Crear una esfera de explosión
    const explosionGeometry = new THREE.SphereGeometry(0.5, 10, 10); // Aumentamos el radio de la explosión
    const explosionMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
    explosion.position.copy(position);
    scene.add(explosion);

    // Animar la escala de la explosión
    new TWEEN.Tween(explosion.scale)
        .to({ x: 5, y: 5, z: 5 }, 500)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(() => {
            // Remover la explosión cuando la animación termine
            scene.remove(explosion);
            isExplosion = false;
        })
        .start();
}


function render() {
    requestAnimationFrame(render);
    update();
    renderer.render(scene, camera);
    controls.update();

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
    room.rotation.y += 0.0001;
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
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

function startGame() {
    spaceship = spaceships[selectedSpaceship];
    isSelection = false;

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
    const targetCameraPosition = new THREE.Vector3(0, 10, 5); // Posición destino
    new TWEEN.Tween(camera.position)
        .to({ x: targetCameraPosition.x, y: targetCameraPosition.y, z: targetCameraPosition.z }, 1000) // Duración de la animación en milisegundos
        .easing(TWEEN.Easing.Quadratic.InOut) // Tipo de interpolación
        .start(); // Iniciar la animación

    // Limpiar la interfaz
    const selectShipButtons = document.querySelector('div');
    selectShipButtons.style.display = 'none';

    setInterval(increaseAsteroidSpeed, 3000); // Aumentar la velocidad de los asteroides cada 10 segundos
    setTimeout(addNewAsteroids, 20000); // Añadir segunda oleada asteroides
    setTimeout(addLastAsteroids, 40000); // Añadir tercera oleada asteroides
}
