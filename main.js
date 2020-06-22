let scene, camera, renderer, controls, raycaster, mouse;
let envScale,
  arrowHelper,
  ground,
  planeGeo,
  surfaces,
  paths,
  center,
  northwest,
  southeast,
  temp;

init();
animate();

function init() {
  // scene
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    3000
  );
  camera.position.x = -1;

  // environment
  envScale = 100;
  planeGeo = new THREE.PlaneBufferGeometry(envScale, envScale);
  paths = ['./textures/point0/', './textures/point1/', './textures/point2/'];
  surfaces = [
    {
      name: 'right',
      filename: 'px.jpg',
      position: { x: 0, y: 0, z: envScale * 0.5 },
      rotation: { x: 0, y: Math.PI, z: 0 }
    },
    {
      name: 'left',
      filename: 'nx.jpg',
      position: { x: 0, y: 0, z: -envScale * 0.5 },
      rotation: { x: 0, y: 0, z: 0 }
    },
    {
      name: 'top',
      filename: 'py.jpg',
      position: { x: 0, y: envScale * 0.5, z: 0 },
      rotation: { x: Math.PI * 0.5, y: 0, z: Math.PI * 0.5 }
    },
    {
      name: 'bottom',
      filename: 'ny.jpg',
      position: { x: 0, y: -envScale * 0.5, z: 0 },
      rotation: { x: -Math.PI * 0.5, y: 0, z: -Math.PI * 0.5 }
    },
    {
      name: 'front',
      filename: 'pz.jpg',
      position: { x: envScale * 0.5, y: 0, z: 0 },
      rotation: { x: 0, y: -Math.PI * 0.5, z: 0 }
    },
    {
      name: 'back',
      filename: 'nz.jpg',
      position: { x: -envScale * 0.5, y: 0, z: 0 },
      rotation: { x: 0, y: Math.PI * 0.5, z: 0 }
    }
  ];

  // cube groups
  center = new THREE.Group();
  northwest = new THREE.Group();
  southeast = new THREE.Group();
  temp = new THREE.Group();

  // populate groups
  northwest.add(...createCube(surfaces, paths[0]));
  center.add(...createCube(surfaces, paths[1]));
  southeast.add(...createCube(surfaces, paths[2]));

  // position and visibility
  northwest.position.x += envScale;
  southeast.position.x -= envScale;
  northwest.visible = false;
  southeast.visible = false;

  // populate scene
  ground = createGround(planeGeo);
  arrowHelper = createArrowHelper();
  scene.add(ground);
  scene.add(arrowHelper);
  scene.add(center);
  scene.add(northwest);
  scene.add(southeast);
  scene.add(temp);

  // ground
  function createGround(planeGeo) {
    const planeGroundMat = new THREE.MeshBasicMaterial({
      wireframe: false,
      transparent: true,
      opacity: 0.1,
      color: 0xffffff,
      side: THREE.FrontSide
    });
    const planeGround = new THREE.Mesh(planeGeo, planeGroundMat);
    planeGround.position.y = -envScale * 0.5;
    planeGround.rotation.x = -Math.PI / 2;
    planeGround.scale.x = envScale * 0.05;
    planeGround.visible = false;
    const ground = new THREE.Group();
    ground.add(planeGround);
    return ground;
  }

  // direction helper
  function createArrowHelper() {
    const arrowHelperGeo = new THREE.Geometry();
    arrowHelperGeo.vertices = [
      new THREE.Vector3(0, 0, 10),
      new THREE.Vector3(25, 0, 0),
      new THREE.Vector3(0, 0, -10)
    ];
    arrowHelperGeo.faces = [new THREE.Face3(0, 1, 2)];
    const arrowHelperMat = new THREE.MeshBasicMaterial({
      color: 0xdddddd,
      transparent: true,
      opacity: 0.7,
      wireframe: true,
      wireframeLinewidth: 3.0
    });
    const arrowHelper = new THREE.Mesh(arrowHelperGeo, arrowHelperMat);
    arrowHelper.position.x = -30;
    arrowHelper.position.y = -envScale * 0.5;
    arrowHelper.renderOrder = 10;
    return arrowHelper;
  }

  // surface material
  function createMeshBasicMaterial(path, filename) {
    const material = new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load(`${path}${filename}`),
      side: THREE.FrontSide,
      transparent: true,
      depthTest: false
    });
    return material;
  }

  // cube surface
  function createSurface(path, name, filename, position, rotation) {
    const material = createMeshBasicMaterial(path, filename);
    const mesh = new THREE.Mesh(planeGeo, material);
    mesh.name = name;
    mesh.position.set(position.x, position.y, position.z);
    mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    return mesh;
  }

  // cube assembly
  function createCube(surfaces, path) {
    const children = [];
    surfaces.forEach(({ name, filename, position, rotation }) => {
      const child = createSurface(path, name, filename, position, rotation);
      children.push(child);
    });
    return children;
  }

  // renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //   controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.minPolarAngle = Math.PI * 0.2;
  controls.maxPolarAngle = Math.PI * 0.8;
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.rotateSpeed = -0.3;

  // raycaster
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // events
  document.addEventListener('mousemove', onMouseMove, false);
  document.addEventListener('click', onClick, false);
  document.addEventListener('touchstart', onTouchStart, false);

  function onMouseMove(event) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(ground.children);
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    if (intersects.length) {
      if (intersects[0].point.x > 50) {
        arrowHelper.position.copy(intersects[0].point);
        arrowHelper.visible = true;
        arrowHelper.rotation.y = 0;
      } else if (intersects[0].point.x < -50) {
        arrowHelper.position.copy(intersects[0].point);
        arrowHelper.visible = true;
        arrowHelper.rotation.y = Math.PI;
      }
    } else {
      arrowHelper.visible = false;
      return;
    }
  }

  // redirect to onClick
  function onTouchStart(event) {
    event.preventDefault();
    event.clientX = event.touches[0].clientX;
    event.clientY = event.touches[0].clientY;
    onClick(event);
  }

  function onClick(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(ground.children);
    if (!controls.update() && !TWEEN.update() && intersects.length) {
      if (intersects[0].point.x > 50) {
        arrowHelper.material.color.set(0xaaffaa);
        nextStep('northwest');
      } else if (intersects[0].point.x < -50) {
        arrowHelper.material.color.set(0xaaffaa);
        nextStep('southeast');
      }
    } else {
      return;
    }
  }

  // get texture paths
  function getPath(direction) {
    if (direction === 'northwest') {
      const next = paths.pop();
      paths.unshift(next);
      return next;
    } else if (direction === 'southeast') {
      const next = paths.shift();
      paths.push(next);
      return next;
    }
  }

  // move forward
  function nextStep(direction) {
    if (direction === 'northwest') {
      const centerFront = center.getObjectByName('front');
      const northwestBack = northwest.getObjectByName('back');
      const removed = southeast.children;
      removed.forEach((element) => {
        element.geometry.dispose();
        element.material.dispose();
      });
      removed.length = 0;
      southeast.remove(...southeast.children);
      northwest.visible = true;
      temp.add(centerFront, northwestBack);
      const state = {
        fadeOut: 1.0,
        fadeIn: 0,
        center: center.position.x,
        northwest: northwest.position.x
      };
      const target = {
        fadeOut: 0,
        fadeIn: 1.0,
        center: center.position.x - envScale,
        northwest: northwest.position.x - envScale
      };
      const tween = new TWEEN.Tween(state);
      tween
        .to(target, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
          center.position.x = state.center;
          centerFront.position.x += state.center * 0.01; // transition type 1
          // centerFront.position.x = state.center * 0.01; // transition type 2
          centerFront.material.opacity = state.fadeOut;
          northwestBack.material.opacity = state.fadeIn;
          northwest.position.x = state.northwest;
        })
        .start()
        .onComplete(() => {
          centerFront.material.opacity = 1;
          centerFront.position.x = envScale * 0.5;
          southeast.add(centerFront, ...center.children);
          center.position.x += envScale;
          center.add(northwestBack, ...northwest.children);
          northwest.position.x += envScale;
          northwest.add(...createCube(surfaces, getPath('northwest')));
          northwest.visible = false;
          arrowHelper.material.color.set(0xdddddd);
        });
    } else if (direction === 'southeast') {
      const centerBack = center.getObjectByName('back');
      const southeastFront = southeast.getObjectByName('front');
      const removed = northwest.children;
      removed.forEach((element) => {
        element.geometry.dispose();
        element.material.dispose();
      });
      removed.length = 0;
      northwest.remove(...northwest.children);
      southeast.visible = true;
      temp.add(centerBack, southeastFront);
      const state = {
        fadeOut: 1.0,
        fadeIn: 0,
        center: center.position.x,
        southeast: southeast.position.x
      };
      const target = {
        fadeOut: 0,
        fadeIn: 1.0,
        center: center.position.x + envScale,
        southeast: southeast.position.x + envScale
      };
      const tween = new TWEEN.Tween(state);
      tween
        .to(target, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
          center.position.x = state.center;
          centerBack.position.x += state.center * 0.01; // transition type 1
          // centerBack.position.x = state.center * 0.01; // transition type 2
          centerBack.material.opacity = state.fadeOut;
          southeastFront.material.opacity = state.fadeIn;
          southeast.position.x = state.southeast;
        })
        .start()
        .onComplete(() => {
          centerBack.material.opacity = 1;
          centerBack.position.x = envScale * -0.5;
          northwest.add(centerBack, ...center.children);
          center.position.x -= envScale;
          center.add(southeastFront, ...southeast.children);
          southeast.position.x -= envScale;
          southeast.add(...createCube(surfaces, getPath('southeast')));
          southeast.visible = false;
          arrowHelper.material.color.set(0xdddddd);
        });
    }
  }
}

// update loop
function animate() {
  controls.update();
  requestAnimationFrame(animate);
  TWEEN.update();
  renderer.render(scene, camera);
}

// window size listener
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);
