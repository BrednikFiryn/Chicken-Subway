import {
  Application,
  Sprite,
  Texture,
  Container,
  Text,
  TextStyle,
} from "pixi.js";

import { IMAGE_DATA } from "./js/imageData";
import { AUDIO_DATA } from "./js/AudioData";
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
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
  await app.init({ background: "#000", resizeTo: window, antialias: true });
  root.appendChild(app.canvas);

  const world = new Container();
  app.stage.addChild(world);

  const sky = new Sprite(await loadTexture(IMAGE_DATA.sky_V_00158));
  sky.width = app.screen.width;
  sky.height = app.screen.height;
  world.addChild(sky);

  const road = new Sprite(await loadTexture(IMAGE_DATA.road_00000));
  road.anchor.set(0.5);
  road.x = app.screen.width / 2;
  road.y = app.screen.height * 0.5;
  world.addChild(road);

  const buildingL = new Sprite(await loadTexture(IMAGE_DATA.building_L_00000));
  buildingL.anchor.set(0, 0);
  buildingL.y = app.screen.height * 0.25;
  world.addChild(buildingL);

  const buildingR = new Sprite(await loadTexture(IMAGE_DATA.building_R_00000));
  buildingR.anchor.set(1, 0);
  buildingR.x = app.screen.width;
  buildingR.y = app.screen.height * 0.25;
  world.addChild(buildingR);

  const rail = new Sprite(await loadTexture(IMAGE_DATA.PLBL_rail_road_00045));
  rail.anchor.set(0.5, 0);
  rail.x = app.screen.width / 2;
  rail.y = app.screen.height * 0.55;
  world.addChild(rail);

  const barrier = new Sprite(await loadTexture(IMAGE_DATA.barrier_00041));
  barrier.anchor.set(0.5);
  barrier.x = app.screen.width / 2;
  barrier.y = app.screen.height * 0.48;
  world.addChild(barrier);

  const chicken = new Sprite(await loadTexture(IMAGE_DATA.chicken_idle_00000));
  chicken.anchor.set(0.5);
  chicken.scale.set(0.8);
  chicken.x = app.screen.width / 2;
  chicken.y = app.screen.height * 0.7;
  world.addChild(chicken);

  const bottomPanel = new Sprite(await loadTexture(IMAGE_DATA.PLBL_bottom_panel_00000));
  bottomPanel.y = app.screen.height - bottomPanel.height - 50;
  app.stage.addChild(bottomPanel);

  const button = new Sprite(await loadTexture(IMAGE_DATA.button_00000));
  button.anchor.set(0.5);
  button.x = app.screen.width / 2;
  button.y = bottomPanel.y + bottomPanel.height / 2;
  button.eventMode = "static";
  button.cursor = "pointer";
  app.stage.addChild(button);

  const logo = new Sprite(await loadTexture(IMAGE_DATA.logo_00000));
  logo.anchor.set(0.5);
  logo.x = app.screen.width / 2;
  logo.y = app.screen.height * 0.1;
  app.stage.addChild(logo);

  const euroText = new Text("\u20AC0", new TextStyle({
    fill: "#000",
    fontSize: 48,
    fontWeight: "bold",
  }));
  euroText.anchor.set(0.5);
  euroText.x = button.x;
  euroText.y = button.y - 60;
  app.stage.addChild(euroText);

  const finger = new Sprite(await loadTexture(IMAGE_DATA["FINGER_-0137"]));
  finger.anchor.set(0.5);
  finger.x = chicken.x;
  finger.y = chicken.y + 150;
  world.addChild(finger);

  gsap.to(finger, {
    y: finger.y - 50,
    repeat: -1,
    yoyo: true,
    duration: 0.8,
    ease: "power1.inOut",
  });

  const clickSound = loadAudio(AUDIO_DATA.click || "");
  let clickCount = 0;
  let isJumping = false;

  function jumpOverBarrier() {
    isJumping = true;
    gsap.to(chicken, {
      duration: 0.8,
      ease: "power1.inOut",
      motionPath: {
        path: [
          { x: chicken.x, y: chicken.y },
          { x: chicken.x, y: chicken.y - 200 },
          { x: chicken.x, y: chicken.y },
        ],
        curviness: 0.3,
      },
      onComplete: () => {
        isJumping = false;
      },
    });
  }

  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;
  app.stage.on("pointerdown", async () => {
    if (isJumping) return;

    clickCount++;
    clickSound.currentTime = 0;
    clickSound.play().catch(() => { });

    if (clickCount === 1) {
      jumpOverBarrier();
    } else if (clickCount === 2) {
      const blur = new Sprite(await loadTexture(IMAGE_DATA.blur_00000));
      blur.width = app.screen.width;
      blur.height = app.screen.height;
      blur.alpha = 0;
      app.stage.addChild(blur);
      gsap.to(blur, { alpha: 1, duration: 0.5 });
    } else {
      goToStore();
    }
  });
}

document.addEventListener("DOMContentLoaded", initApp);
