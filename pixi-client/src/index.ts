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
import { AnimatedSprite } from "pixi.js";
import { goToStore } from "./js/goToStore";

gsap.registerPlugin(MotionPathPlugin);

const MAX_AMOUNT = 50;

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

  let buildingLAnim: AnimatedSprite | null = null;
  let buildingRAnim: AnimatedSprite | null = null;
  let railAnim: AnimatedSprite | null = null;
  let chickenRunAnim: AnimatedSprite | null = null;
  let limitTween: gsap.core.Timeline | null = null;

  const app = new Application();
  await app.init({
    background: "#ffffff",
    resizeTo: window,
    antialias: true,
  });

  type Lane = "left" | "center" | "right";

  let currentLane: Lane = "center";

  let lanePositions: Record<Lane, number> = {
    left: 0,
    center: 0,
    right: 0
  };

  function spawnTrain(lane: Lane) {

    let frames: Texture[] = [];

    if (lane === "center") {
      frames = trainMidFrames;
    } else {
      frames = trainLeftFrames;
    }

    const train = new AnimatedSprite(frames);

    train.anchor.set(0.5);

    const baseScale = 0.7;

    if (lane === "right") {
      train.scale.set(-baseScale, baseScale);
    } else {
      train.scale.set(baseScale);
    }

    train.animationSpeed = 0.3;
    train.loop = false;

    let xPos = lanePositions[lane];

    const offsetFix = app.screen.width * 0.055;

    if (lane === "left") xPos -= offsetFix;
    if (lane === "right") xPos += offsetFix;

    train.x = xPos;

    train.y = blur.y - blur.height / 2 + train.height / 2;

    world.addChild(train);
    train.play();

    gsap.to(train, {
      y: app.screen.height * 0.8,
      duration: 1.6,
      ease: "power2.out",
      onComplete: () => {
        world.removeChild(train);
        train.destroy();
      }
    });
  }

  function playLimitAnimation() {
    if (limitTween) {
      limitTween.kill();
    }

    amountText.style.fill = 0xff0000;

    limitTween = gsap.timeline({
      onComplete: () => {
        amountText.style.fill = 0x000000;
        amountText.scale.set(0.7);
        limitTween = null;
      }
    });

    limitTween.to(amountText.scale, {
      x: 0.8,
      y: 0.8,
      duration: 0.1,
      ease: "power2.out"
    });

    limitTween.to(amountText.scale, {
      x: 0.7,
      y: 0.7,
      duration: 0.2,
      ease: "back.out(2)"
    });
  }

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

  function playRoadSignAnimation() {
    let frame = 0;

    const interval = setInterval(() => {
      roadSignSprite.texture = roadSignFrames[frame];
      frame++;

      if (frame >= roadSignFrames.length) {
        clearInterval(interval);
      }
    }, 40);
  }

  function playRoadSignCustomAnimation(frames: Texture[]) {
    let frame = 0;

    const interval = setInterval(() => {
      roadSignSprite.texture = frames[frame];
      frame++;

      if (frame >= frames.length) {
        clearInterval(interval);
      }
    }, 40);
  }

  function playBarrierAnimation(): Promise<void> {
    return new Promise((resolve) => {
      let frame = 0;

      const interval = setInterval(() => {
        barrier.texture = barrierFrames[frame];
        frame++;

        if (frame >= barrierFrames.length) {
          clearInterval(interval);
          resolve();
        }
      }, 40);
    });
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

  function playFramesOnce(
    sprite: Sprite,
    frames: Texture[],
    duration: number
  ) {
    let frame = 0;
    const frameTime = duration / frames.length;

    const interval = setInterval(() => {
      sprite.texture = frames[frame];
      frame++;

      if (frame >= frames.length) {
        clearInterval(interval);
      }
    }, frameTime * 1000);
  }

  function updateWithdrawLayout() {
    withdrawEUR.x =
      withdrawAmountText.x + withdrawAmountText.width;
  }

  root.appendChild(app.canvas);

  document.body.style.cursor = "none";
  root.style.cursor = "none";
  app.canvas.style.cursor = "none";

  const world = new Container();
  app.stage.addChild(world);

  const blur = new Sprite(await loadTexture(IMAGE_DATA[`blur_00000`]));
  blur.anchor.set(0.5);
  blur.scale.set(1)
  blur.alpha = 1;
  app.stage.addChild(blur);

  const sky = new Sprite(await loadTexture(IMAGE_DATA[`sky V_00158`]));
  sky.anchor.set(0.5)
  sky.scale.set(1)
  sky.position.set(app.screen.width / 2, app.screen.height / 2);

  sky.width = app.screen.width;
  sky.height = app.screen.height;

  world.addChild(sky);

  const road = new Sprite(await loadTexture(IMAGE_DATA[`road_00000`]));
  road.anchor.set(0.5)
  road.scale.set(1)
  road.position.set(app.screen.width * 2, app.screen.height / 2);

  road.width = app.screen.width * 0.5;
  road.height = app.screen.height;
  world.addChild(road);

  const buildingL = new Sprite(await loadTexture(IMAGE_DATA[`building L_00000`]));
  buildingL.anchor.set(0.5)
  buildingL.scale.set(1)
  buildingL.position.set(app.screen.width * 0.5, app.screen.height * 0.5);
  world.addChild(buildingL);

  const buildingLFrames: Texture[] = [];
  for (let i = 0; i <= 13; i++) {
    const num = i.toString().padStart(5, "0");
    buildingLFrames.push(
      await loadTexture(IMAGE_DATA[`building L_${num}`])
    );
  }

  const buildingR = new Sprite(await loadTexture(IMAGE_DATA[`building R_00000`]));
  buildingR.anchor.set(0.5);
  buildingR.scale.set(1);
  buildingR.position.set(app.screen.width * 0.5, app.screen.height * 0.5);
  world.addChild(buildingR);

  const buildingRFrames: Texture[] = [];
  for (let i = 0; i <= 11; i++) {
    const num = i.toString().padStart(5, "0");
    buildingRFrames.push(
      await loadTexture(IMAGE_DATA[`building R_${num}`])
    );
  }

  const rail = new Sprite(await loadTexture(IMAGE_DATA[`PLBL rail road_00045`]));
  rail.anchor.set(0.5);
  rail.scale.set(1);
  rail.position.set(app.screen.width * 0.5, app.screen.height * 0.5);
  world.addChild(rail);

  const railFrames: Texture[] = [];
  for (let i = 45; i <= 51; i++) {
    const num = i.toString().padStart(5, "0");
    railFrames.push(
      await loadTexture(IMAGE_DATA[`PLBL rail road_${num}`])
    );
  }

  const barrier = new Sprite(await loadTexture(IMAGE_DATA[`barrier_00041`]));
  barrier.anchor.set(0.5);
  barrier.scale.set(0.4);
  barrier.position.set(app.screen.width * 0.5, app.screen.height * 0.5);
  world.addChild(barrier);

  const barrierRunTexture = await loadTexture(IMAGE_DATA[`barrier_00050`]);

  const barrierFrames: Texture[] = [];

  for (let i = 41; i <= 50; i++) {
    const num = i.toString().padStart(5, "0");
    barrierFrames.push(
      await loadTexture(IMAGE_DATA[`barrier_${num}`])
    );
  }

  const trainLeftFrames: Texture[] = [];
  for (let i = 7; i <= 20; i++) {
    const num = i.toString().padStart(5, "0");
    trainLeftFrames.push(
      await loadTexture(IMAGE_DATA[`train side L_${num}`])
    );
  }

  const trainMidFrames: Texture[] = [];
  for (let i = 6; i <= 20; i++) {
    const num = i.toString().padStart(5, "0");
    trainMidFrames.push(
      await loadTexture(IMAGE_DATA[`train Mid_${num}`])
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

  const chickenRunFrames: Texture[] = [];

  for (let i = 4; i <= 18; i++) {
    const num = i.toString().padStart(5, "0");
    chickenRunFrames.push(
      await loadTexture(IMAGE_DATA[`chicken run_${num}`])
    );
  }

  const chickenJumpStartFrames: Texture[] = [];
  for (let i = 53; i <= 58; i++) {
    const num = i.toString().padStart(5, "0");
    chickenJumpStartFrames.push(
      await loadTexture(IMAGE_DATA[`chicken jump_${num}`])
    );
  }

  const chickenJumpEndFrames: Texture[] = [];
  for (let i = 58; i >= 53; i--) {
    const num = i.toString().padStart(5, "0");
    chickenJumpEndFrames.push(
      await loadTexture(IMAGE_DATA[`chicken jump_${num}`])
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

  function jumpChicken(targetLane: Lane) {

    const sprite = chickenRunAnim ?? chicken;

    if (currentLane === targetLane) {

      laneButtons.forEach(btn => {
        btn.alpha = 1;
        btn.eventMode = "static";
      });

      if (targetLane === "left") {
        playRoadSignCustomAnimation(roadSignLeftBackFrames);
      } else if (targetLane === "right") {
        playRoadSignCustomAnimation(roadSignRightBackFrames);
      } else {
        playRoadSignCustomAnimation(roadSignCenterBackFrames);
      }

      spawnTrain(targetLane);

      return;
    }

    const duration = 0.35;
    const peakHeight = 70;

    const startX = sprite.x;
    const startY = sprite.y;
    const targetX = lanePositions[targetLane];

    currentLane = targetLane;
    isJumping = true;

    laneButtons.forEach(btn => {
      btn.alpha = 0.4;
      btn.eventMode = "none";
    });

    let switched = false;

    gsap.to(sprite, {
      duration,
      ease: "none",

      onStart() {
        playFramesOnce(sprite, chickenJumpStartFrames, duration / 2);

        gsap.to(sprite.scale, {
          x: 0.75,
          y: 0.6,
          duration: 0.08,
          yoyo: true,
          repeat: 1,
          ease: "power1.out"
        });
      },

      onUpdate() {
        const progress = this.progress();

        sprite.x = startX + (targetX - startX) * progress;

        const arc = 4 * peakHeight * progress * (1 - progress);
        sprite.y = startY - arc;

        if (progress >= 0.5 && !switched) {
          switched = true;

          spawnTrain(targetLane);

          playFramesOnce(sprite, chickenJumpEndFrames, duration / 2);
        }
      },

      onComplete() {
        sprite.y = startY;
        sprite.x = targetX;

        isJumping = false;

        laneButtons.forEach(btn => {
          btn.alpha = 1;
          btn.eventMode = "static";
        });

        if (targetLane === "left") {
          playRoadSignCustomAnimation(roadSignLeftBackFrames);
        } else if (targetLane === "right") {
          playRoadSignCustomAnimation(roadSignRightBackFrames);
        } else {
          playRoadSignCustomAnimation(roadSignCenterBackFrames);
        }
      }
    });
  }

  const bottomPanel = new Sprite(await loadTexture(IMAGE_DATA[`PLBL bottom panel_00000`]));
  bottomPanel.anchor.set(0.5);
  bottomPanel.scale.set(0.7);
  bottomPanel.position.set(app.screen.width * 0.5, app.screen.height * 0.5);
  app.stage.addChild(bottomPanel);

  const betsContainer = new Container();
  betsContainer.scale.set(0.7);
  app.stage.addChild(betsContainer);

  const roadSignSprite = new Sprite(await loadTexture(IMAGE_DATA[`PLBL road sign_00045`]));
  roadSignSprite.anchor.set(0.5);
  roadSignSprite.scale.set(0.8);
  roadSignSprite.position.set(app.screen.width * 0.5, app.screen.height * 0.5);

  app.stage.addChild(roadSignSprite);

  const roadSignFrames: Texture[] = [];

  for (let i = 45; i <= 50; i++) {
    const num = i.toString().padStart(5, "0");
    roadSignFrames.push(
      await loadTexture(IMAGE_DATA[`PLBL road sign_${num}`])
    );
  }

  const roadSignLeftFrames: Texture[] = [];
  for (let i = 234; i <= 237; i++) {
    const num = i.toString().padStart(5, "0");
    roadSignLeftFrames.push(
      await loadTexture(IMAGE_DATA[`PLBL road sign_${num}`])
    );
  }

  const roadSignRightFrames: Texture[] = [];
  for (let i = 388; i <= 391; i++) {
    const num = i.toString().padStart(5, "0");
    roadSignRightFrames.push(
      await loadTexture(IMAGE_DATA[`PLBL road sign_${num}`])
    );
  }

  const roadSignCenterFrames: Texture[] = [];
  for (let i = 466; i <= 469; i++) {
    const num = i.toString().padStart(5, "0");
    roadSignCenterFrames.push(
      await loadTexture(IMAGE_DATA[`PLBL road sign_${num}`])
    );
  }

  const roadSignLeftBackFrames = [...roadSignLeftFrames].reverse();
  const roadSignRightBackFrames = [...roadSignRightFrames].reverse();
  const roadSignCenterBackFrames = [...roadSignCenterFrames].reverse();


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

      if (totalAmount + value > MAX_AMOUNT) {
        playLimitAnimation();
        return;
      }

      totalAmount += value;
      amountText.text = `€${totalAmount}`;

      updateMainButtonState();
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

  function updateMainButtonState() {
    const enabled = totalAmount > 0;

    button.eventMode = enabled ? "static" : "none";
  }

  const amountText = new Text("€0", {
    fontSize: 64,
    fill: 0x4a2e00,
    fontWeight: "bold",
  });

  amountText.anchor.set(0.5);
  amountText.scale.set(0.7);
  app.stage.addChild(amountText);

  const button = new Sprite(await loadTexture(IMAGE_DATA[`button_00000`]));
  button.anchor.set(0.5)
  button.scale.set(0.65)
  button.x = app.screen.width / 2;
  button.y = bottomPanel.y + bottomPanel.height / 2;
  app.stage.addChild(button);

  button.eventMode = "none";
  button.cursor = "none";

  updateMainButtonState();

  const leftBtnTex = new Sprite(await loadTexture(IMAGE_DATA[`PLBL button left arrow_00006`]));
  const forwardBtnTex = new Sprite(await loadTexture(IMAGE_DATA[`PLBL button forward arrow_00005`]));
  const rightBtnTex = new Sprite(await loadTexture(IMAGE_DATA[`PLBL button right arrow_00051`]));

  const laneButtons = [leftBtnTex, forwardBtnTex, rightBtnTex];

  laneButtons.forEach(btn => {
    btn.anchor.set(0.5)
    btn.scale.set(0.65)
    app.stage.addChild(btn);

    btn.eventMode = "static";
    btn.cursor = "none";
  });

  function setLaneButtonsState(activeBtn: Sprite | null) {
    laneButtons.forEach(btn => {
      btn.alpha = btn === activeBtn ? 1 : 0.4;
    });
  }

  function handleLaneClick(multiplier: number, btn: Sprite) {
    if (totalAmount <= 0) return;

    playFingerDown();

    setTimeout(() => {
      playFingerUp();
    }, 120);

    playClick();

    gsap.to(btn.scale, {
      x: 0.72,
      y: 0.72,
      duration: 0.08,
      ease: "power1.out",
    });

    gsap.to(btn.scale, {
      x: 0.65,
      y: 0.65,
      duration: 0.12,
      ease: "back.out(2)",
      delay: 0.08,
    });

    animateTotalMultiply(multiplier);

    setLaneButtonsState(btn);

    if (btn === leftBtnTex) {
      playRoadSignCustomAnimation(roadSignLeftFrames);
      jumpChicken("left");
    }
    else if (btn === rightBtnTex) {
      playRoadSignCustomAnimation(roadSignRightFrames);
      jumpChicken("right");
    }
    else if (btn === forwardBtnTex) {
      playRoadSignCustomAnimation(roadSignCenterFrames);
      jumpChicken("center");
    }
  }

  function setupLaneButton(btn: Sprite, multiplier: number) {
    btn.on("pointerdown", () => {
      handleLaneClick(multiplier, btn);
    });

    btn.on("pointerup", () => {
      playFingerUp();
    });

    btn.on("pointerupoutside", () => {
      playFingerUp();
    });
  }

  setupLaneButton(leftBtnTex, 2);
  setupLaneButton(forwardBtnTex, 1.5);
  setupLaneButton(rightBtnTex, 3);

  const withdrawContainer = new Container();

  const withdrawBg = new Sprite(
    await loadTexture(IMAGE_DATA[`PLBL withdraw_00009`])
  );

  withdrawBg.anchor.set(0.5);
  withdrawBg.scale.set(0.8);

  withdrawContainer.addChild(withdrawBg);
  app.stage.addChild(withdrawContainer);

  const withdrawLabel = new Text("Withdraw", {
    fontSize: 26,
    fill: 0x6b5c3a,
    fontWeight: "bold",
  });

  withdrawLabel.anchor.set(0, 0.5);
  withdrawLabel.x = -withdrawBg.width * 0.25;
  withdrawLabel.y = -6;

  withdrawContainer.addChild(withdrawLabel);

  function animateTotalMultiply(multiplier: number) {
    const start = 0;

    const target = totalAmount * multiplier;

    const duration = 0.4;
    const fps = 60;
    const totalFrames = duration * fps;
    let frame = 0;

    const diff = target - start;

    const interval = setInterval(() => {
      frame++;

      const progress = frame / totalFrames;
      totalAmount = start + diff * progress;

      if (frame >= totalFrames) {
        totalAmount = target;
        clearInterval(interval);
      }

      withdrawAmountText.text = totalAmount.toFixed(2);
      amountText.text = `€${totalAmount.toFixed(2)}`;

      updateWithdrawLayout();
    }, 1000 / fps);
  }

  const withdrawAmountText = new Text("0.00", {
    fontSize: 26,
    fill: 0x6b5c3a,
    fontWeight: "bold",
  });

  withdrawAmountText.anchor.set(0.3, 0.5);
  withdrawAmountText.x = withdrawBg.width * 0.05;
  withdrawAmountText.y = -5;

  withdrawContainer.addChild(withdrawAmountText);

  const withdrawEUR = new Text("EUR", {
    fontSize: 26,
    fill: 0x6b5c3a,
    fontWeight: "bold",
  });

  withdrawEUR.anchor.set(0, 0.5);
  withdrawEUR.x = withdrawAmountText.x + withdrawAmountText.width;
  withdrawEUR.y = -5;

  withdrawContainer.addChild(withdrawEUR);

  updateWithdrawLayout();

  const afterBarrierSprites = [
    leftBtnTex,
    forwardBtnTex,
    rightBtnTex,
    withdrawContainer,
    roadSignSprite,
  ];

  afterBarrierSprites.forEach(s => {
    s.visible = false;
  });

  button.on("pointerdown", (e) => {

    playFingerDown();
    playClick();

    showClickCircle(e.global.x, e.global.y);

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

  button.on("pointerup", async () => {

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

    await playBarrierAnimation();

    afterBarrierSprites.forEach(s => {
      s.visible = true;
    });

    roadSignSprite.visible = true;
    playRoadSignAnimation();

    world.removeChild(chicken);
    world.removeChild(barrier);

    world.removeChild(buildingL);
    world.removeChild(buildingR);
    world.removeChild(rail);

    chickenRunAnim = new AnimatedSprite(chickenRunFrames);
    buildingLAnim = new AnimatedSprite(buildingLFrames);
    buildingRAnim = new AnimatedSprite(buildingRFrames);
    railAnim = new AnimatedSprite(railFrames);

    chickenRunAnim.anchor.set(0.5);
    buildingLAnim.anchor.set(0.5);
    buildingRAnim.anchor.set(0.5);
    railAnim.anchor.set(0.5);

    chickenRunAnim.position.copyFrom(chicken.position);
    buildingLAnim.position.copyFrom(buildingL.position);
    buildingRAnim.position.copyFrom(buildingR.position);
    railAnim.position.copyFrom(rail.position);

    chickenRunAnim.scale.set(chicken.scale.x);
    buildingLAnim.scale.set(buildingL.scale.x);
    buildingRAnim.scale.set(buildingR.scale.x);
    railAnim.scale.set(rail.scale.x);

    chickenRunAnim.animationSpeed = 0.6;
    buildingLAnim.animationSpeed = 0.6;
    buildingRAnim.animationSpeed = 0.6;
    railAnim.animationSpeed = 0.6;

    chickenRunAnim.loop = true;
    buildingLAnim.loop = true;
    buildingRAnim.loop = true;
    railAnim.loop = true;

    world.addChild(chickenRunAnim);
    world.addChild(buildingLAnim);
    world.addChild(buildingRAnim);
    world.addChild(railAnim);

    world.setChildIndex(chickenRunAnim, world.children.length - 1);

    chickenRunAnim.play();
    buildingLAnim.play();
    buildingRAnim.play();
    railAnim.play();

    const barrierRun = new Sprite(barrierRunTexture);
    barrierRun.anchor.set(0.5);
    barrierRun.scale.set(0.4);
    barrierRun.position.copyFrom(barrier.position);

    world.addChild(barrierRun);

    gsap.to(barrierRun, {
      y: app.screen.height + barrierRun.height,
      duration: 1,
      ease: "power2.in",
      onComplete: () => {
        world.removeChild(barrierRun);
      }
    });
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

  runText.eventMode = "none";
  runText.cursor = "default";

  const logo = new Sprite(await loadTexture(IMAGE_DATA["logo_00000"]));
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

    if (buildingLAnim) {
      buildingLAnim.position.set(w / 2 - buildingOffsetX, buildingY + 10);
    }
    if (buildingRAnim) {
      buildingRAnim.position.set(w / 2 + buildingOffsetX, buildingY + 10);
    }
    if (railAnim) {
      railAnim.position.set(centerX, centerY);
    }

    roadSignSprite.position.set(
      w / 2,
      h * 0.18
    );

    const laneY = h * 0.86;
    const offsetX = w * 0.25;

    leftBtnTex.position.set(w / 2 - offsetX / 1.5, laneY);
    forwardBtnTex.position.set(w / 2, laneY);
    rightBtnTex.position.set(w / 2 + offsetX / 1.5, laneY);

    withdrawContainer.position.set(
      w / 2,
      h * 0.72
    );

    const laneOffset = w * 0.15;

    lanePositions.center = centerX;
    lanePositions.left = centerX - laneOffset;
    lanePositions.right = centerX + laneOffset;

    const sprite = chickenRunAnim ?? chicken;
    sprite.x = lanePositions[currentLane];
  }

  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;
  app.stage.on("pointerdown", async () => {
    if (isJumping) return;
  });
}

document.addEventListener("DOMContentLoaded", initApp);
