/* ---------------------------------------------------------
  [숭연시] 모바일 터치 + 사운드 버그 수정 최종본
------------------------------------------------------------ */

let imgThumb, imgBar, imgGun, imgDohyuk, imgRowoon;
let bgmNormal, bgmTension, sfxFlash, sfxShake;
let currentBGM;

let gameState = "INTRO"; 
let playerName = "여주"; 

let introAlpha = 0, introSize = 25, introState = 0, introTimer = 0;
let fadeAlpha = 0, isFading = false, fadeState = 0; 
let fadeWaitTimer = 0; 
let shakeMagnitude = 0, flashAlpha = 0;

let nameInput, submitBtn;
let dialogues = [];
let currentLine = 0;
let typedText = "", charIndex = 0, isTyping = false;

let lastInputTime = 0; 
let affectionGun = 0, affectionDohyuk = 0, affectionRowoon = 0; 

function preload() {
  imgThumb = loadImage('thumbnail.png'); 
  imgBar = loadImage('bar.png');         
  imgGun = loadImage('건.png');          
  imgDohyuk = loadImage('도혁.png');      
  imgRowoon = loadImage('로운.png');      
  
  soundFormats('mp3', 'wav');
  bgmNormal = loadSound('bgm_normal.mp3');
  bgmTension = loadSound('bgm_tension.mp3');
  sfxFlash = loadSound('sfx_flash.mp3');
  sfxShake = loadSound('sfx_shake.mp3');
}

function setup() {
  createCanvas(960, 540); 
  textFont('Nanum Gothic, 맑은 고딕, sans-serif'); 
  
  nameInput = createInput('여주'); 
  nameInput.position(width / 2 - 120, height / 2 - 20); 
  nameInput.size(160, 35);
  nameInput.style('font-size', '20px');
  nameInput.style('text-align', 'center');
  
  submitBtn = createButton('결정');
  submitBtn.position(width / 2 + 50, height / 2 - 20);
  submitBtn.size(80, 41);
  submitBtn.style('font-size', '18px');
  submitBtn.style('cursor', 'pointer');
  
  // 🌟 모바일에서 버튼 클릭이 씹히지 않도록 mousePressed 대신 전용 함수 연결
  submitBtn.mousePressed(onNameSubmit);
  
  nameInput.hide();
  submitBtn.hide();
  
  initDialogues();
  lastInputTime = millis();
}

function draw() {
  background(0);

  if (gameState === "INTRO") {
    introSize += 0.05; 
    if (introState === 0) { 
      introAlpha += 2;
      if (introAlpha >= 255) { introAlpha = 255; introState = 1; }
    } else if (introState === 1) { 
      introTimer++;
      if (introTimer > 120) introState = 2;
    } else if (introState === 2) { 
      introAlpha -= 3;
      if (introAlpha <= 0) {
        gameState = "NAME_INPUT";
        nameInput.show(); submitBtn.show();
        changeBGM(bgmNormal);
      }
    }
    fill(255, introAlpha); textAlign(CENTER, CENTER);
    textSize(introSize); 
    text("제작: 김정윤, 윤혜린, 한우주", width / 2, height / 2 - 30);
    textSize(introSize * 0.6); 
    text("본 작품은 정말 100% 픽션이며 실제 인물, 단체와 무관합니다.", width / 2, height / 2 + 40);
  }
  
  else if (gameState === "NAME_INPUT") {
    fill(255); textSize(28); textAlign(CENTER, CENTER);
    text("주인공의 이름을 설정해주세요.", width / 2, height / 2 - 80);
  }
  
  else if (gameState === "START") {
    image(imgThumb, 0, 0, width, height);
    fill(255); textSize(16); textAlign(CENTER, CENTER);
    if (frameCount % 60 < 45) text("화면을 터치하여 게임을 시작하세요.", width / 2, height - 18);
  } 
  
  else if (gameState === "PLAY" || gameState === "CHOICE") {
    let currentDialogue = dialogues[currentLine];
    push(); 
    if (shakeMagnitude > 0) {
      translate(random(-shakeMagnitude, shakeMagnitude), random(-shakeMagnitude, shakeMagnitude));
      shakeMagnitude *= 0.85; 
      if (shakeMagnitude < 0.5) shakeMagnitude = 0;
    }

    if (currentDialogue.char != null) image(currentDialogue.char, 0, 0, width, height);
    else if (currentDialogue.bg != null) {
      image(currentDialogue.bg, 0, 0, width, height);
      fill(0, 100); rect(0, 0, width, height);
    }
    
    if (gameState === "PLAY") {
      fill(0, 200); rect(width * 0.05, height - 160, width * 0.9, 140, 10);
      fill(255, 200, 200); textSize(24); textAlign(LEFT, TOP);
      text(currentDialogue.name, width * 0.08, height - 145);
      
      fill(255); 
      textSize(22);
      if (isTyping && frameCount % 2 === 0 && charIndex < currentDialogue.text.length) {
          typedText += currentDialogue.text.charAt(charIndex++);
          if (charIndex >= currentDialogue.text.length) isTyping = false;
      } 
      
      textLeading(34); 
      text(typedText, width * 0.08, height - 105, width * 0.84, 90);

      if (!isTyping && (millis() - lastInputTime > 2000)) {
        drawContinueGuide(); 
      }
    }
    if (gameState === "CHOICE") drawChoices();
    pop(); 

    if (flashAlpha > 0) {
      fill(255, flashAlpha); rect(0, 0, width, height);
      flashAlpha -= 15; 
    }
  }
  
  else if (gameState === "END") {
    fill(255); textAlign(CENTER, CENTER);
    textSize(36); text("프롤로그 완료!", width / 2, height / 2 - 60);
    textSize(24); text("현재 호감도 현황", width / 2, height / 2);
    fill(200, 200, 255); textSize(22);
    text(`김건: ${affectionGun} | 백도혁: ${affectionDohyuk} | 차로운: ${affectionRowoon}`, width / 2, height / 2 + 50);
  }

  // 통합 페이드 로직
  if (isFading) {
    fill(0, fadeAlpha); rect(0, 0, width, height);
    if (fadeState === 1) {
      fadeAlpha += 10;
      if (fadeAlpha >= 255) {
        fadeAlpha = 255;
        fadeWaitTimer++; 
        if (fadeWaitTimer > 80) { 
          fadeState = 2;
          fadeWaitTimer = 0;
          if (gameState === "START") { gameState = "PLAY"; startTyping(dialogues[0].effect); }
          else {
            currentLine++;
            if (currentLine >= dialogues.length) { gameState = "CHOICE"; currentLine = dialogues.length - 1; }
            else startTyping(dialogues[currentLine].effect);
          }
        }
      }
    } else if (fadeState === 2) {
      fadeAlpha -= 10;
      if (fadeAlpha <= 0) { fadeAlpha = 0; fadeState = 0; isFading = false; }
    }
  }
}

// -----------------------------------------------------------------
// 📱 모바일 터치 및 사운드 해결 핵심 구간
// -----------------------------------------------------------------

function handleInput() {
  // 🌟 [핵심] 모바일 브라우저의 사운드 기능을 터치하는 순간 깨웁니다.
  userStartAudio(); 

  lastInputTime = millis(); 

  if (gameState === "INTRO") { 
    // 첫 터치 시 배경음악이 정의되지 않았다면 재생 시작
    if (currentBGM === undefined) changeBGM(bgmNormal);
    return; 
  }
  
  // 이름 입력 중이거나 페이드 연출 중에는 터치 무시
  if (gameState === "NAME_INPUT" || isFading) return; 

  if (gameState === "START") { 
    isFading = true; fadeState = 1; 
  } 
  else if (gameState === "PLAY") {
    if (isTyping) { 
      typedText = dialogues[currentLine].text; 
      charIndex = dialogues[currentLine].text.length; 
      isTyping = false; 
    } else {
      if (currentLine < dialogues.length - 1) {
        if (dialogues[currentLine].scene !== dialogues[currentLine + 1].scene) { isFading = true; fadeState = 1; }
        else { currentLine++; startTyping(dialogues[currentLine].effect); }
      } else { isFading = true; fadeState = 1; }
    }
  } 
  else if (gameState === "CHOICE") {
    for (let i = 0; i < 3; i++) {
      let yPos = 180 + (i * 80);
      if (mouseX > width * 0.25 && mouseX < width * 0.75 && mouseY > yPos && mouseY < yPos + 60) {
        if (i === 0) affectionGun++; else if (i === 1) affectionDohyuk++; else affectionRowoon++;
        gameState = "END";
      }
    }
  }
}

// 🌟 PC와 모바일 입력을 각각 따로 명확히 정의합니다.
function mousePressed() {
  handleInput();
}

function touchStarted() {
  // 이름 입력 단계에서는 기본 터치 동작(버튼 누르기 등)을 방해하지 않도록 합니다.
  if (gameState !== "NAME_INPUT") {
    handleInput();
    return false; // 화면 밀림 방지
  }
}

// -----------------------------------------------------------------
// 나머지 보조 함수들
// -----------------------------------------------------------------

function onNameSubmit() {
  userStartAudio(); // 버튼 누를 때도 사운드 깨우기
  playerName = nameInput.value() || "여주";
  nameInput.hide();
  submitBtn.hide();
  initDialogues();
  gameState = "START";
  isFading = true; fadeState = 2; fadeAlpha = 255;
  lastInputTime = millis();
}

function drawContinueGuide() {
  push();
  let guideAlpha = map(sin(frameCount * 0.1), -1, 1, 50, 255);
  fill(255, guideAlpha);
  textSize(22); textAlign(RIGHT, CENTER);
  text("▼", width * 0.92, height - 45);
  pop();
}

function changeBGM(newBGM) {
  if (currentBGM === newBGM) return;
  if (currentBGM) currentBGM.stop();
  currentBGM = newBGM;
  if (currentBGM && currentBGM.isLoaded()) {
    currentBGM.loop();
  }
}

function startTyping(effectType = null) {
  typedText = ""; charIndex = 0; isTyping = true;
  if (effectType) triggerEffect(effectType);
  let s = dialogues[currentLine].scene;
  if (s === 6) changeBGM(bgmTension); else changeBGM(bgmNormal);
}

function triggerEffect(effectType) {
  if (effectType === "shake") { shakeMagnitude = 15; if(sfxShake.isLoaded()) sfxShake.play(); }
  if (effectType === "shake_mild") { shakeMagnitude = 8; if(sfxShake.isLoaded()) sfxShake.play(); }
  if (effectType === "flash") { flashAlpha = 200; if(sfxFlash.isLoaded()) sfxFlash.play(); }
  if (effectType === "flash_shake") { shakeMagnitude = 20; flashAlpha = 200; if(sfxFlash.isLoaded()) sfxFlash.play(); if(sfxShake.isLoaded()) sfxShake.play(); }
}

function initDialogues() {
  dialogues = [
     { scene: 1, name: playerName + " (독백)", text: "새 학기가 시작됐다. 글로벌미디어학부에서 맞는 2학년 1학기.", bg: imgBar, char: null, effect: null },
    { scene: 1, name: playerName + " (독백)", text: "안 그래도 친구가 없는데 방학 내내 알바만 하느라 오티고 새터고 전부 패스했더니...", bg: imgBar, char: null, effect: null },
    { scene: 1, name: playerName + " (독백)", text: "아는 얼굴이라곤 하나도 없는 개강총회에 끌려가는 중이다.", bg: imgBar, char: null, effect: null },
    { scene: 1, name: playerName + " (독백)", text: "뭐, 상관없다. 적당히 구석에 있다가 눈치껏 빠지면 되니까.", bg: imgBar, char: null, effect: null },
    
    { scene: 2, name: "건", text: "왔냐.", bg: null, char: imgGun, effect: "shake" }, 
    { scene: 2, name: playerName + " (독백)", text: "김건. 유일하게 말 섞는 동기이자 곧 군대 갈 놈. 입대가 코앞이라 그런지 오늘따라 더 삐딱하다.", bg: null, char: imgGun, effect: null },
    { scene: 2, name: "건", text: "…넌 또 멍때리냐.", bg: null, char: imgGun, effect: "shake" }, 
    { scene: 2, name: playerName, text: "어. 사람 너무 많아. 기 빨려.", bg: null, char: imgGun, effect: null },
    { scene: 2, name: "건", text: "그러니까 누가 과 행사 다 빠지고 여기서 처음 얼굴 트래.", bg: null, char: imgGun, effect: null },
    { scene: 2, name: playerName, text: "돈은 벌어야지 어떡해. 너야말로 군대 갈 날 받아놓고 술이 넘어가냐?", bg: null, char: imgGun, effect: null },
    { scene: 2, name: "건", text: "...어차피 갈 거, 가기 전까지 최대한 놀다 가야지. 안주는, 뭐 먹을래.", bg: null, char: imgGun, effect: null },
     { scene: 2, name: playerName + "(독백)", text: "김건의 질문에 답하려는데, 등 뒤로 묘한 시선이 느껴져 고개를 돌렸다.", bg: null, char: imgGun, effect: null },
     { scene: 2, name: playerName + "(독백)", text: "그곳엔 우리 테이블을 흥미롭다는 듯 지켜보는 낯선 남자가 서있었다.", bg: null, char: imgGun, effect: null },
    
    
    { scene: 3, name: playerName + " (독백)", text: "...딱 봐도 피곤해 보이는 복학생 등장. 내가 가장 피하고 싶은 인간 군상 1순위다.", bg: null, char: imgDohyuk, effect: null },
    { scene: 3, name: "도혁", text: "안녕? 2학년 맞지?", bg: null, char: imgDohyuk, effect: null }, 
    { scene: 3, name: "도혁", text: "내가 저쪽 테이블에서 게임에 졌는데, 벌칙이 다른 테이블에서 술 한잔 받아오는 거라.", bg: null, char: imgDohyuk, effect: null },
    { scene: 3, name: "건", text: "...", bg: null, char: imgGun, effect: null }, 
    { scene: 3, name: "도혁", text: "부탁할게. 딱 한잔만 따라줄래?", bg: null, char: imgDohyuk, effect: null },
    { scene: 3, name: playerName, text: "(아, 귀찮다... 빨리 보내버려야지.) ...네. (소주 한 잔을 가득 채워준다.)", bg: null, char: imgDohyuk, effect: null },
    { scene: 3, name: "도혁", text: "와, 쿨하네. 고마워요, 후배님.", bg: null, char: imgDohyuk, effect: null },
    { scene: 3, name: "도혁", text:"아, 내 이름도 모르겠구나. 백도혁. 이번에 복학했어. 이따 또 올게?", bg: null, char: imgDohyuk, effect: null },
    { scene: 3, name: playerName +"(독백)", text: "…원래 있던 테이블에 여자밖에 없네. 엮이면 힘들어질 스타일….", bg: null, char: imgDohyuk, effect: null },
    
    { scene: 4, name: playerName + "(독백)", text: "…백도혁 선배인지 뭔지... 기만 잔뜩 빨린 기분이다. 슬슬 피곤한데, 그냥 일찍 들어가볼까...", bg: null, char: imgBar, effect: null },
    { scene: 4, name: playerName + "(독백)", text: "겉옷을 챙기려는데, 옆에서 누군가가 내 어깨를 조심스레 톡톡 쳤다.", bg: null, char: imgBar, effect: null },

    { scene: 5, name: playerName + " (독백)", text: "이번엔 잔뜩 취한 핏덩이 신입생인가. 오늘 내 자리, 터가 안 좋은 게 틀림없다. 집에 가고 싶다.", bg: null, char: imgRowoon, effect: null },
    { scene: 5, name: "로운", text: "저, 저기...! 선배님...!", bg: null, char: imgRowoon, effect: "shake_mild" }, 
    { scene: 5, name: "로운", text: "아까부터 계속 봤는데요... 그, 인스타 아이디 좀... 알려주실 수 있을까요...?", bg: null, char: imgRowoon, effect: null },
    { scene: 5, name: playerName, text: "아, 나 인스타 잘 안 하는데.", bg: null, char: imgRowoon, effect: null },
    { scene: 5, name: "로운", text: "아... 그럼 번호라도... 아니면 카톡이라도...!", bg: null, char: imgRowoon, effect: "shake_mild" },
    { scene: 5, name: playerName, text: "...알겠어. 폰 줘봐.", bg: null, char: imgRowoon, effect: null },
     { scene: 5, name: "로운", text: "감사합니다! …저는 차로운이에요! 이번 글미에 1학년으로...", bg: null, char: imgRowoon, effect: null }, 
    { scene: 5, name: "로운", text: "으앗…! (휘청거린다.)", bg: null, char: imgRowoon, effect: "flash_shake" }, 
    { scene: 5, name: "건", text: "야, 얘 완전 취했다. 동기들 어디 있어. 얘 데려가라.", bg: null, char: imgGun, effect: null }, 
    
    { scene: 6, name: playerName + " (독백)", text: "...그로부터 몇 분이나 지났을까... 어쩌다 보니 내 자리 상황이 아주 이상하게 돌아가고 있다.", bg: imgBar, char: null, effect: null },
    { scene: 6, name: playerName + " (독백)", text: "맞은편엔 아까 그 복학생 백도혁 선배가 언제부턴가 자연스럽게 합석해 턱을 괴고 있고...", bg: null, char: imgDohyuk, effect: null },
    { scene: 6, name: playerName + " (독백)", text: "옆에는 잔뜩 취한 1학년 차로운이 기어코 내 옷자락을 꼭 쥔 채 앉아 있다.", bg: null, char: imgRowoon, effect: null },
    { scene: 6, name: "건", text: "하아... 너, 아니다.... 술이나 마시자. 어디서 이상한 놈들만 꼬여가지고.", bg: null, char: imgGun, effect: null },
    { scene: 6, name: playerName + " (독백)", text: "숨 막히는 이 상황... 적당히 눈치껏 빠지려던 내 계획은 완전히 망했다.", bg: imgBar, char: null, effect: null },
    { scene: 6, name: playerName + " (독백)", text: "지금, 이 셋 중 누구에게 먼저 장단을 맞춰줘야 할까?", bg: imgBar, char: null, effect: null }
  ];
}


function drawChoices() {
  let choices = ["조용히 김건의 잔을 부딪친다.", "백도혁에게 말을 건다.", "차로운을 챙긴다."];
  textAlign(CENTER, CENTER); textSize(20);
  for (let i = 0; i < choices.length; i++) {
    let yPos = 180 + (i * 80);
    if (mouseX > width * 0.25 && mouseX < width * 0.75 && mouseY > yPos && mouseY < yPos + 60) fill(255, 100, 100, 230); 
    else fill(0, 0, 0, 200); 
    rect(width * 0.25, yPos, width * 0.5, 60, 10);
    fill(255); text(choices[i], width / 2, yPos + 30);
  }
}