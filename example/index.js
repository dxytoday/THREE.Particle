import * as THREE from "three";
import { OrbitControls } from "./lib/OrbitControls.js";
import { GUI } from "./lib/lil-gui.esm.js";
import { Particle } from "../dist/THREE.Particle.module.js";
import Stats from "./lib/stats.module.js";

var scene, gui, group, allSettings = [];

function addParticle(particle) {

    const settings = {}

    // 添加对象

    if (particle === undefined) {

        particle = new Particle();

        particle.name = `粒子-${particle.uuid.substring(0, 8)}`;
        particle.count = 10;

        particle.material.emissionDuration = 5;

        particle.material.motionDuration = 3;
        particle.material.motionSpeed = 5;

        particle.material.map = './textures/colors.png';
        particle.material.useMap = true;

    }

    const material = particle.material;
    group.add(particle);

    const folder = gui.addFolder(particle.name);
    folder.close();

    // 添加控制按钮

    settings.rotation = {};

    Object.defineProperties(settings.rotation,
        {
            x: {
                get: () => particle.rotation.x * THREE.MathUtils.RAD2DEG,
                set: (value) => particle.rotation.x = value * THREE.MathUtils.DEG2RAD,
            },
            y: {
                get: () => particle.rotation.y * THREE.MathUtils.RAD2DEG,
                set: (value) => particle.rotation.y = value * THREE.MathUtils.DEG2RAD,
            },
            z: {
                get: () => particle.rotation.z * THREE.MathUtils.RAD2DEG,
                set: (value) => particle.rotation.z = value * THREE.MathUtils.DEG2RAD,
            }
        }
    );

    const positionFoler = folder.addFolder('平移').close();
    positionFoler.add(particle.position, 'x', 0, 10);
    positionFoler.add(particle.position, 'y', 0, 10);
    positionFoler.add(particle.position, 'z', 0, 10);

    const rotationFoler = folder.addFolder('旋转').close();
    rotationFoler.add(settings.rotation, 'x', -360, 360);
    rotationFoler.add(settings.rotation, 'y', -360, 360);
    rotationFoler.add(settings.rotation, 'z', -360, 360);

    const scaleFoler = folder.addFolder('缩放').close();
    scaleFoler.add(particle.scale, 'x', 1, 5);
    scaleFoler.add(particle.scale, 'y', 1, 5);
    scaleFoler.add(particle.scale, 'z', 1, 5);

    Object.defineProperties(settings,
        {
            '运行时长': {
                get: () => material.elapsed,
                set: (value) => material.elapsed = value,
            },

            '运动过程独立': {
                get: () => particle.independentMotion,
                set: (value) => particle.independentMotion = value,
            },
            '发射总量': {
                get: () => particle.count,
                set: (value) => particle.count = value,
            },
            '发射时长/秒': {
                get: () => material.emissionDuration,
                set: (value) => material.emissionDuration = value,
            },
            '发射立体角': {
                get: () => material.directionSolidAngle,
                set: (value) => material.directionSolidAngle = value,
            },

            '运动时长/秒': {
                get: () => material.motionDuration,
                set: (value) => material.motionDuration = value,
            },
            '运动时长随机系数': {
                get: () => material.motionDurationRandomRatio,
                set: (value) => material.motionDurationRandomRatio = value,
            },

            '运动速度/长度': {
                get: () => material.motionSpeed,
                set: (value) => material.motionSpeed = value,
            },
            '运动速度随机系数': {
                get: () => material.motionSpeedRandomRatio,
                set: (value) => material.motionSpeedRandomRatio = value,
            },

            '重力值': {
                get: () => material.gravity,
                set: (value) => material.gravity = value,
            },

            '纹理贴图': {
                get: () => material.map,
                set: (value) => material.map = value,
            },
            '启用纹理贴图': {
                get: () => material.useMap,
                set: (value) => material.useMap = value,
            },

            '贴图旋转速度': {
                get: () => material.rotationSpeed,
                set: (value) => material.rotationSpeed = value,
            },
            '旋转速度随机系数': {
                get: () => material.rotationSpeedRandomRatio,
                set: (value) => material.rotationSpeedRandomRatio = value,
            },

            '运动开始尺寸': {
                get: () => material.startSize,
                set: (value) => material.startSize = value,
            },
            '运动结束尺寸': {
                get: () => material.endSize,
                set: (value) => material.endSize = value,
            },
            '尺寸随机系数': {
                get: () => material.sizeRandomRatio,
                set: (value) => material.sizeRandomRatio = value,
            },

            '运动开始透明度': {
                get: () => material.startOpacity,
                set: (value) => material.startOpacity = value,
            },
            '运动结束透明度': {
                get: () => material.endOpacity,
                set: (value) => material.endOpacity = value,
            },
            '透明度随机系数': {
                get: () => material.opacityRandomRatio,
                set: (value) => material.opacityRandomRatio = value,
            },

            '运动开始颜色': {
                get: () => material.startColor,
                set: (value) => material.startColor = value,
            },
            '运动结束颜色': {
                get: () => material.endColor,
                set: (value) => material.endColor = value,
            }
        }
    )

    folder.add(settings, '运行时长').listen().disable();

    folder.add(settings, '运动过程独立');

    folder.add(settings, '发射总量');
    folder.add(settings, '发射时长/秒', 0, 10);
    folder.add(settings, '发射立体角', 0, 360);

    folder.add(settings, '运动时长/秒', 0, 10);
    folder.add(settings, '运动时长随机系数', 0, 1);

    folder.add(settings, '运动速度/长度', 0, 10);
    folder.add(settings, '运动速度随机系数', 0, 1);

    folder.add(settings, '重力值', 0, 1);

    // folder.add(settings, '纹理贴图');
    folder.add(settings, '启用纹理贴图');

    folder.add(settings, '贴图旋转速度', 0, 360);
    folder.add(settings, '旋转速度随机系数', 0, 1);

    folder.add(settings, '运动开始尺寸', 0, 10);
    folder.add(settings, '运动结束尺寸', 0, 10);
    folder.add(settings, '尺寸随机系数', 0, 1);

    folder.add(settings, '运动开始透明度', 0, 1);
    folder.add(settings, '运动结束透明度', 0, 1);
    folder.add(settings, '透明度随机系数', 0, 1);

    folder.addColor(settings, '运动开始颜色');
    folder.addColor(settings, '运动结束颜色');

    settings['移除'] = function () {

        group.remove(particle);
        particle.dispose();

        folder.destroy();

    }

    folder.add(settings, '移除');

    allSettings.push(settings);

}

function addTailFlame() {

    for (const settings of allSettings) {

        settings['移除']();

    }

    allSettings.length = 0;

    group.position.set(0, 0, 0);
    group.rotation.set(-Math.PI / 2, 0, 0);
    group.scale.set(1, 1, 1);

    {

        const particle = new Particle();
        particle.name = '焰芯';
        particle.count = 1000;

        particle.material.map = './textures/fire1.png';
        particle.material.useMap = true;

        particle.material.emissionDuration = 3;
        particle.material.motionDuration = 3;

        particle.material.motionSpeed = 3;
        particle.material.motionSpeedRandomRatio = 0.4;

        particle.material.startSize = 0.6;
        particle.material.endSize = 0.002;
        particle.material.endOpacity = 0;

        particle.material.startColor = "#ffcc22";
        particle.material.endColor = "#ffaa00";

        addParticle(particle);

    }

    {
        const particle = new Particle();

        particle.name = "焰白";
        particle.count = 1500;

        particle.position.y = 0.1

        particle.material.emissionDuration = 1.5;
        particle.material.motionDuration = 1.5;

        particle.material.motionSpeed = 2;

        particle.material.map = "./textures/fire1.png";
        particle.material.useMap = true;

        particle.material.startSize = 0.5;
        particle.material.endSize = 0.05;

        particle.material.startColor = "#ffff99";
        particle.material.endColor = "#ffaa00";

        addParticle(particle);

    }

    {

        const particle = new Particle();

        particle.name = "焰头";
        particle.count = 500;

        particle.material.emissionDuration = 1;
        particle.material.motionDuration = 1;

        particle.material.motionSpeed = 1;
        particle.material.motionSpeedRandomRatio = 0.3;

        particle.material.directionSolidAngle = 5;

        particle.material.map = "./textures/fire2.png";
        particle.material.useMap = true;

        particle.material.startSize = 1;
        particle.material.endSize = 0.15;

        particle.material.startColor = "#ffee99";
        particle.material.endColor = "#ffee99";

        particle.material.rotationSpeed = 180;
        particle.material.rotationSpeedRandomRatio = 1;

        addParticle(particle);

    }

    {

        const particle = new Particle();

        particle.name = "火花";
        particle.count = 50;

        particle.material.emissionDuration = 2;

        particle.material.motionDuration = 2;
        particle.material.motionDurationRandomRatio = 0.5;

        particle.material.directionSolidAngle = 90;

        particle.material.motionSpeed = 3;

        particle.material.map = "./textures/fire3.png";
        particle.material.useMap = true;

        particle.material.startSize = 0.05;
        particle.material.endSize = 0.2;
        particle.material.sizeRandomRatio = 0.5;

        particle.material.endColor = "#ffaa55";

        particle.material.rotationSpeed = 20;
        particle.material.rotationSpeedRandomRatio = 0.3;

        particle.material.startOpacity = 0.8;
        particle.material.endOpacity = 0;

        particle.material.gravity = 0.07;

        addParticle(particle);

    }

    {


        const particle = new Particle();

        particle.name = "烟雾";
        particle.count = 25;

        particle.material.emissionDuration = 1.5;
        particle.material.motionDuration = 1.5;

        particle.material.motionSpeed = 4.5;
        particle.material.motionSpeedRandomRatio = 0.1;

        particle.material.startSize = 1;
        particle.material.endSize = 10;
        particle.material.sizeRandomRatio = 0.2;

        particle.material.map = "./textures/fog1.png";
        particle.material.useMap = true;

        particle.material.startColor = "#b0a09b";
        particle.material.endColor = "#434343";

        particle.material.rotationSpeed = 180;
        particle.material.rotationSpeedRandomRatio = 0.5;

        particle.material.startOpacity = 0.5;
        particle.material.endOpacity = 0;

        particle.material.gravity = 0.05;

        addParticle(particle);

    }

}

function initGUI() {

    const settings = {};

    gui = new GUI({ title: "控制面板", width: 230 });

    group = new THREE.Group();
    scene.add(group);

    Object.defineProperties(settings,
        {
            x: {
                get: () => group.rotation.x * THREE.MathUtils.RAD2DEG,
                set: (value) => group.rotation.x = value * THREE.MathUtils.DEG2RAD,
            },
            y: {
                get: () => group.rotation.y * THREE.MathUtils.RAD2DEG,
                set: (value) => group.rotation.y = value * THREE.MathUtils.DEG2RAD,
            },
            z: {
                get: () => group.rotation.z * THREE.MathUtils.RAD2DEG,
                set: (value) => group.rotation.z = value * THREE.MathUtils.DEG2RAD,
            }
        }
    )

    const positionFoler = gui.addFolder('组-平移').close();
    positionFoler.add(group.position, 'x', 0, 10);
    positionFoler.add(group.position, 'y', 0, 10);
    positionFoler.add(group.position, 'z', 0, 10);

    const rotationFoler = gui.addFolder('组-旋转').close();
    rotationFoler.add(settings, 'x', -360, 360);
    rotationFoler.add(settings, 'y', -360, 360);
    rotationFoler.add(settings, 'z', -360, 360);

    const scaleFoler = gui.addFolder('组-缩放').close();
    scaleFoler.add(group.scale, 'x', 1, 5);
    scaleFoler.add(group.scale, 'y', 1, 5);
    scaleFoler.add(group.scale, 'z', 1, 5);

    settings['添加粒子'] = addParticle;
    gui.add(settings, '添加粒子');

    settings['添加尾焰'] = addTailFlame;
    gui.add(settings, '添加尾焰');

    addTailFlame();

}

function initScene() {

    const canvas = document.getElementById("canvas");

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    canvas.width = width;
    canvas.height = height;

    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);

    const aspect = width / height;
    const camera = new THREE.PerspectiveCamera(70, aspect, 0.01, 5000);

    camera.position.x = 20;
    camera.position.y = 20;
    camera.position.z = 20;

    scene = new THREE.Scene();

    const orbitControls = new OrbitControls(camera, canvas);

    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    const stats = new Stats();
    document.body.appendChild(stats.dom);

    function render() {

        orbitControls.update();
        renderer.render(scene, camera);
        stats.update();

        requestAnimationFrame(render);

    }

    render();

}

function start() {

    initScene();

    initGUI();

}

start();
