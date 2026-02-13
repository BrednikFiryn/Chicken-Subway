import {
  Application,
  Sprite,
  Texture,
  Container,
  Text,
  TextStyle,
  Graphics,
} from "pixi.js";

import { IMAGE_DATA } from "./js/imageData";
import { AUDIO_DATA } from "./js/audioData";
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { t } from "./js/localization";
import { goToStore } from "./js/goToStore";

gsap.registerPlugin(MotionPathPlugin);

function loadAudio(base64: string): HTMLAudioElement {
  const audio = new Audio();
  audio.src = base64.trim();
  audio.volume = 0.8;
  return audio;
}

async function loadTexture(base64: string): Promise<Texture> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(Texture.from(img));
    img.onerror = () => resolve(Texture.EMPTY);
    img.src = base64;
  });
}

async function initApp() {
  const root = document.getElementById("pixi-container");
  if (!root) return;

  const app = new Application();
  await app.init({
    background: "#ffffff",
    resizeTo: window,
    antialias: true,
  });

  function showClickCircle(x: number, y: number) {
    for (let i = 0; i < 2; i++) {
      const ring = new Graphics();

      ring.circle(0, 0, 13);
      ring.stroke({
        width: 2,
        color: 0xffffff,
        alpha: 1,
      });

      ring.position.set(x, y);
      app.stage.addChild(ring);

      gsap.to(ring.scale, {
        x: 1.3 + i * 0.2,
        y: 1.3 + i * 0.2,
        duration: 0.4 + i * 0.15,
        ease: "power1.out",
      });

      gsap.to(ring, {
        alpha: 0,
        duration: 0.4,
        delay: i * 0.08,
        ease: "power1.out",
        onComplete: () => {
          ring.destroy();
        },
      });
    }
  }

  function playBarrierAnimation() {
    let frame = 0;

    const interval = setInterval(() => {
      barrier.texture = barrierFrames[frame];
      frame++;

      if (frame >= barrierFrames.length) {
        clearInterval(interval);
      }
    }, 40);
  }

  function playFingerDown() {
    let frame = 0;

    const interval = setInterval(() => {
      finger.texture = fingerDownFrames[frame];
      frame++;

      if (frame >= fingerDownFrames.length) {
        clearInterval(interval);
      }
    }, 16);
  }

  function playFingerUp() {
    let frame = 0;

    const interval = setInterval(() => {
      finger.texture = fingerUpFrames[frame];
      frame++;

      if (frame >= fingerUpFrames.length) {
        clearInterval(interval);
      }
    }, 16);
  }

  function createRipple(x: number, y: number) {
    const ring = new Graphics();
    ring.lineStyle(4, 0x66cc66, 1);
    ring.drawCircle(0, 0, 10);
    ring.position.set(x, y);
    app.stage.addChild(ring);

    gsap.to(ring.scale, {
      x: 4,
      y: 4,
      duration: 0.5,
      ease: "power1.out",
    });

    gsap.to(ring, {
      alpha: 0,
      duration: 0.5,
      onComplete: () => {
        app.stage.removeChild(ring);
        ring.destroy();
      },
    });
  }

  root.appendChild(app.canvas);

  document.body.style.cursor = "none";
  root.style.cursor = "none";
  app.canvas.style.cursor = "none";

  const world = new Container();
  app.stage.addChild(world);

  const blur = new Sprite(await loadTexture(IMAGE_DATA.blur_00000));
  blur.anchor.set(0.5);
  blur.scale.set(1)
  blur.alpha = 1;
  app.stage.addChild(blur);

  const sky = new Sprite(await loadTexture(IMAGE_DATA.sky));
  sky.anchor.set(0.5)
  sky.scale.set(1)
  sky.position.set(app.screen.width / 2, app.screen.height / 2);

  sky.width = app.screen.width;
  sky.height = app.screen.height;

  world.addChild(sky);

  const road = new Sprite(await loadTexture(IMAGE_DATA.road));
  road.anchor.set(0.5)
  road.scale.set(1)
  road.position.set(app.screen.width * 2, app.screen.height / 2);

  road.width = app.screen.width * 0.5;
  road.height = app.screen.height;
  world.addChild(road);

  const buildingL = new Sprite(await loadTexture(IMAGE_DATA.building_L));
  buildingL.anchor.set(0.5)
  buildingL.scale.set(1)
  buildingL.position.set(app.screen.width * 0.5, app.screen.height * 0.5);
  world.addChild(buildingL);

  const buildingR = new Sprite(await loadTexture(IMAGE_DATA.building_R));
  buildingR.anchor.set(0.5);
  buildingR.scale.set(1);
  buildingR.position.set(app.screen.width * 0.5, app.screen.height * 0.5);
  world.addChild(buildingR);

  const rail = new Sprite(await loadTexture(IMAGE_DATA.rail));
  rail.anchor.set(0.5);
  rail.scale.set(1);
  rail.position.set(app.screen.width * 0.5, app.screen.height * 0.5);
  world.addChild(rail);

  const barrier = new Sprite(await loadTexture(IMAGE_DATA.barrier));
  barrier.anchor.set(0.5);
  barrier.scale.set(0.4);
  barrier.position.set(app.screen.width * 0.5, app.screen.height * 0.5);
  world.addChild(barrier);

  const barrierFrames: Texture[] = [];

  for (let i = 41; i <= 50; i++) {
    const num = i.toString().padStart(5, "0");
    barrierFrames.push(
      await loadTexture(IMAGE_DATA[`barrier_${num}`])
    );
  }
  const chicken = new Sprite(await loadTexture(IMAGE_DATA[`chicken idle_0000`]));
  chicken.anchor.set(0.5);
  chicken.scale.set(0.7);
  chicken.position.set(app.screen.width * 0.5, app.screen.height * 0.5);
  world.addChild(chicken);

  const chickenFrames: Texture[] = [];

  for (let i = 1; i <= 35; i++) {
    const num = i.toString().padStart(5, "0");
    chickenFrames.push(
      await loadTexture(IMAGE_DATA[`chicken idle_${num}`])
    );
  }

  let chickenFrameIndex = 0;

  gsap.ticker.add(() => {
    chickenFrameIndex += 0.25;
    if (chickenFrameIndex >= chickenFrames.length) {
      chickenFrameIndex = 0;
    }
    chicken.texture = chickenFrames[Math.floor(chickenFrameIndex)];
  });

  const bottomPanel = new Sprite(await loadTexture(IMAGE_DATA.bottomPanel));
  bottomPanel.anchor.set(0.5);
  bottomPanel.scale.set(0.7);
  bottomPanel.position.set(app.screen.width * 0.5, app.screen.height * 0.5);
  app.stage.addChild(bottomPanel);

  const betsContainer = new Container();
  betsContainer.scale.set(0.7);
  app.stage.addChild(betsContainer);

  const clickSound = loadAudio(AUDIO_DATA.click);

  function playClick() {
    const sound = new Audio(AUDIO_DATA.click.trim());
    sound.volume = 0.8;
    sound.play().catch(() => { });
  }

  function createBetButton(label: string, value: number) {
    const container = new Container();

    const bg = new Graphics();
    bg.beginFill(0x9be26b);
    bg.drawRoundedRect(-70, -30, 140, 60, 18);
    bg.endFill();

    const text = new Text(label, {
      fontSize: 28,
      fill: 0x2f5b18,
      fontWeight: "bold",
    });

    text.anchor.set(0.5);

    container.addChild(bg);
    container.addChild(text);

    container.eventMode = "static";
    container.cursor = "none";

    container.on("pointerdown", (e) => {

      playFingerDown();

      clickSound.currentTime = 0;
      playClick();

      showClickCircle(e.global.x, e.global.y);

      gsap.to(container.scale, {
        x: 1.08,
        y: 1.08,
        duration: 0.08,
        ease: "power1.out",
      });

      createRipple(e.global.x, e.global.y);

      gsap.to(container.scale, {
        x: 1.08,
        y: 1.08,
        duration: 0.08,
        ease: "power1.out",
      });

      totalAmount += value;
      amountText.text = `€${totalAmount}`;
    });

    container.on("pointerup", () => {

      playFingerUp();

      gsap.to(container.scale, {
        x: 1,
        y: 1,
        duration: 0.12,
        ease: "back.out(2)",
      });
    });

    container.on("pointerupoutside", () => {
      gsap.to(container.scale, {
        x: 1,
        y: 1,
        duration: 0.12,
      });
    });

    return container;
  }

  let totalAmount = 0;

  const amountText = new Text("€0", {
    fontSize: 64,
    fill: 0x4a2e00,
    fontWeight: "bold",
  });

  amountText.anchor.set(0.5);
  amountText.scale.set(0.7);
  app.stage.addChild(amountText);

  const button = new Sprite(await loadTexture(IMAGE_DATA.button));
  button.anchor.set(0.5)
  button.scale.set(0.65)
  button.x = app.screen.width / 2;
  button.y = bottomPanel.y + bottomPanel.height / 2;
  app.stage.addChild(button);

  button.eventMode = "static";
  button.cursor = "none";

  button.on("pointerdown", () => {

    playFingerDown();
    playClick();

    gsap.to(button.scale, {
      x: 0.72,
      y: 0.72,
      duration: 0.08,
      ease: "power1.out",
    });

    gsap.to(runText.scale, {
      x: 1.08,
      y: 1.08,
      duration: 0.08,
    });

  });

  button.on("pointerup", () => {

    playFingerUp();

    gsap.to(button.scale, {
      x: 0.65,
      y: 0.65,
      duration: 0.12,
      ease: "back.out(2)",
    });

    gsap.to(runText.scale, {
      x: 1,
      y: 1,
      duration: 0.12,
    });

    button.eventMode = "none";

    gsap.to(betsContainer, {
      alpha: 0,
      duration: 0.3,
      onComplete: () => {
        betsContainer.visible = false;
      }
    });

    gsap.to(bottomPanel, {
      alpha: 0,
      duration: 0.3,
      onComplete: () => {
        bottomPanel.visible = false;
      }
    });

    gsap.to([button, runText], {
      alpha: 0,
      duration: 0.3,
      onComplete: () => {
        button.visible = false;
        runText.visible = false;
        amountText.visible = false;
      }
    });

    playBarrierAnimation();
  });


  const runText = new Text(t("RUN!"), {
    fontSize: 48,
    fill: 0x000000,
    fontWeight: "bold",
    align: "center",
  });

  runText.anchor.set(0.5);
  runText.position.set(button.x, button.y);
  app.stage.addChild(runText);

  const logo = new Sprite(await loadTexture(IMAGE_DATA.logo));
  logo.anchor.set(0.5)
  logo.scale.set(0.7)
  logo.x = app.screen.width / 2;
  logo.y = app.screen.height * 0.1;
  app.stage.addChild(logo);

  const finger = new Sprite(await loadTexture(IMAGE_DATA["FINGER_-0146"]));
  finger.anchor.set(0.5);
  finger.scale.set(1)
  app.stage.addChild(finger);

  const fingerDownFrames: Texture[] = [];
  const fingerUpFrames: Texture[] = [];

  for (let i = 135; i <= 138; i++) {
    const key = `FINGER_-0${i}`;
    fingerDownFrames.push(await loadTexture(IMAGE_DATA[key]));
  }

  for (let i = 139; i <= 146; i++) {
    const key = `FINGER_-0${i}`;
    fingerUpFrames.push(await loadTexture(IMAGE_DATA[key]));
  }

  finger.eventMode = "none";

  app.stage.on("pointermove", (event) => {
    finger.position.set(event.global.x + 35, event.global.y + 40);
  });

  window.addEventListener("resize", resizeLayout);

  const bet2 = createBetButton("€2", 2);
  const bet5 = createBetButton("€5", 5);
  const bet10 = createBetButton("€10", 10);

  betsContainer.addChild(bet2);
  betsContainer.addChild(bet5);
  betsContainer.addChild(bet10);

  resizeLayout();

  let isJumping = false;

  function resizeLayout() {
    const w = app.screen.width;
    const h = app.screen.height;

    blur.position.set(w / 2, h / 5);
    blur.width = w / 1.7;
    blur.height = h / 2;

    sky.position.set(w / 2, h / 3);
    sky.width = w;
    sky.height = h;

    road.position.set(w / 2, h / 2 + h * 0.25);
    road.width = w;
    road.height = h;

    const buildingY = h / 2;
    const buildingOffsetX = w * 0.35;

    buildingL.position.set(w / 2 - buildingOffsetX, buildingY + 10);
    buildingR.position.set(w / 2 + buildingOffsetX, buildingY + 10);

    const centerX = w / 2;
    const centerY = h * 0.72;

    rail.position.set(centerX, centerY);
    rail.width = w / 1.5;

    barrier.position.set(w / 2, h * 0.1);

    chicken.position.set(centerX, centerY - 70);

    logo.position.set(w / 2, h * 0.06);

    const panelY = h * 0.82;
    bottomPanel.position.set(w / 2, panelY + 20);

    amountText.position.set(w / 2, panelY - 40);

    button.position.set(w / 2, panelY + bottomPanel.height / 2 - 35);

    runText.position.set(button.x, button.y);

    betsContainer.position.set(w / 2, panelY + 8);

    bet2.position.set(-155, 0);
    bet5.position.set(0, 0);
    bet10.position.set(155, 0);
  }

  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;
  app.stage.on("pointerdown", async () => {
    if (isJumping) return;
  });
}

document.addEventListener("DOMContentLoaded", initApp);
