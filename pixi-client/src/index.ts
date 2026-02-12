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

  root.appendChild(app.canvas);

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

  const chicken = new Sprite(await loadTexture(IMAGE_DATA.chicken));
  chicken.anchor.set(0.5);
  chicken.scale.set(0.7);
  chicken.position.set(app.screen.width * 0.5, app.screen.height * 0.5);
  world.addChild(chicken);

  const bottomPanel = new Sprite(await loadTexture(IMAGE_DATA.bottomPanel));
  bottomPanel.anchor.set(0.5);
  bottomPanel.scale.set(0.7);
  bottomPanel.position.set(app.screen.width * 0.5, app.screen.height * 0.5);
  app.stage.addChild(bottomPanel);

  const button = new Sprite(await loadTexture(IMAGE_DATA.button));
  button.anchor.set(0.5)
  button.scale.set(0.65)
  button.x = app.screen.width / 2;
  button.y = bottomPanel.y + bottomPanel.height / 2;
  button.eventMode = "static";
  button.cursor = "pointer";
  app.stage.addChild(button);

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

  const finger = new Sprite(await loadTexture(IMAGE_DATA["FINGER_-0137"]));
  finger.anchor.set(0.5)
  finger.scale.set(1)
  app.stage.addChild(finger);

  finger.cursor = "none";
  app.stage.cursor = "none";

  app.stage.on("pointermove", (event) => {
    finger.position.set(event.global.x, event.global.y);
  });

  window.addEventListener("resize", resizeLayout);
  resizeLayout();

  const clickSound = loadAudio(AUDIO_DATA.click || "");
  let clickCount = 0;
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

    button.position.set(w / 2, panelY + bottomPanel.height / 2 - 35);

    runText.position.set(button.x, button.y);
  }

  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;
  app.stage.on("pointerdown", async () => {
    if (isJumping) return;
  });
}

document.addEventListener("DOMContentLoaded", initApp);
