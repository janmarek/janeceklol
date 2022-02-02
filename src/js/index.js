const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generators = [
  { url: "https://source.unsplash.com/800x800?people", weight: 10 },
  { url: "https://source.unsplash.com/800x800?group", weight: 5 },
];

const unrolledGenerators = generators.flatMap(({ url, weight }) => Array(weight).fill(url));

const imageReader = new FileReader();

let currentImage = new Image();

const rerollImage = async () => {
  const imageData = await fetch(pickRandom(unrolledGenerators));

  return new Promise((resolve) => {
    const image = new Image();

    image.addEventListener("load", () => {
      currentImage = image;
      resolve();
    });

    image.crossOrigin = "anonymous";
    image.src = imageData.url;
  });
};

const canvas = document.getElementById("picture");
const ctx = canvas.getContext("2d");
const font = new FontFace("Bebas Neue", "url(public/BebasNeue-Bold.ttf)");

const getCanvasInfo = () => {
  const canvasRect = canvas.getBoundingClientRect();
  return {
    offsetX: canvasRect.left,
    offsetY: canvasRect.top,
    canvasScale: canvasRect.width / 800,
  };
};

let { offsetX, offsetY, canvasScale } = getCanvasInfo();

let isDragging = false;
let startX;
let startY;

const overlayImage = new Image();
overlayImage.src = "public/janecek.png";
const initialWidth = 493;
const initialHeight = 897;
const descale = 1.8;
const overlayImageCoords = {
  x: 500,
  y: 800 - (initialHeight / descale),
  width: initialWidth / descale,
  height: initialHeight / descale,
};

const onMouseDown = (e) => {
  const isTouch = !!e.touches;
  // mouse position
  const mx = Number((isTouch ? e.touches[0].clientX : e.clientX) - offsetX);
  const my = Number((isTouch ? e.touches[0].clientY : e.clientY) - offsetY);

  // overlay image position (with scaling)
  const ix = overlayImageCoords.x * canvasScale;
  const iy = overlayImageCoords.y * canvasScale;
  const iw = overlayImageCoords.width * canvasScale;
  const ih = overlayImageCoords.height * canvasScale;

  if (mx > ix && mx < ix + iw && my > iy && my < iy + ih) {
    isDragging = true;
  }

  startX = mx;
  startY = my;
};

canvas.addEventListener("mousedown", onMouseDown);
canvas.addEventListener("touchstart", onMouseDown);

canvas.addEventListener("mouseup", () => { isDragging = false; });

const initFont = async () => {
  await font.load();
  document.fonts.add(font);
};

const setFile = (file) => {
  if (!file.type.startsWith("image/")) {
    return;
  }

  imageReader.readAsDataURL(file);
};

canvas.addEventListener("dragover", (e) => e.preventDefault());

canvas.addEventListener("drop", (e) => {
  e.preventDefault();
  if (!e.dataTransfer || e.dataTransfer.files.length <= 0) {
    return;
  }

  setFile(e.dataTransfer.files[0]);
});

const repaintImage = async () => {
  // clear to black (for transparent images)
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // scale image to always fill the canvas
  const scaleX = canvas.width / currentImage.width;
  const scaleY = canvas.height / currentImage.height;
  const scale = Math.max(scaleX, scaleY);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.drawImage(currentImage, 0, 0);
  ctx.setTransform(); // reset so that everything else is normal size

  ctx.drawImage(overlayImage, overlayImageCoords.x, overlayImageCoords.y, overlayImageCoords.width, overlayImageCoords.height);

  /*
  const lines = splitText(currentText, 20).reverse();
  const fontSize = lines.length < 5 ? 60 : 40;
  ctx.font = `${fontSize}px 'Bebas Neue'`;
  lines.forEach((line, index) => {
    const x = 30;
    const y = 685;
    const padding = 15;
    const lineHeight = padding + fontSize;
    ctx.fillStyle = "#f9dc4d";
    ctx
      .fillRect(x, y - (index * lineHeight), ctx.measureText(line).width + 2 * padding, lineHeight);
    ctx.textBaseline = "top";
    ctx.fillStyle = "black";
    ctx.fillText(line, x + padding, y + padding - (index * lineHeight));
  });
  */
};

const onMove = (e) => {
  const isTouch = !!e.touches;
  // mouse position
  const mx = Number((isTouch ? e.touches[0].clientX : e.clientX) - offsetX);
  const my = Number((isTouch ? e.touches[0].clientY : e.clientY) - offsetY);
  //console.log(mx, my, isDragging)

  // overlay image position (with scaling)
  const ix = overlayImageCoords.x * canvasScale;
  const iy = overlayImageCoords.y * canvasScale;
  const iw = overlayImageCoords.width * canvasScale;
  const ih = overlayImageCoords.height * canvasScale;

  // fancy cursor
  if (mx > ix && mx < ix + iw && my > iy && my < iy + ih) {
    canvas.style.cursor = "pointer";
  } else {
    canvas.style.cursor = "initial";
  }

  if (isDragging) {
    // calculate the distance the mouse has moved
    // since the last mousemove
    const dx = mx - startX;
    const dy = my - startY;

    overlayImageCoords.x += dx / canvasScale;
    overlayImageCoords.y += dy / canvasScale;

    repaintImage();

    // reset the starting mouse position for the next mousemove
    startX = mx;
    startY = my;
  }
};

canvas.addEventListener("mousemove", onMove);
canvas.addEventListener("touchmove", onMove);

imageReader.addEventListener("load", (e) => {
  currentImage = new Image();
  currentImage.addEventListener("load", () => repaintImage());
  currentImage.src = e.target.result;
});

const buttonRandomImg = document.getElementById("randomize");
buttonRandomImg.addEventListener("click", async () => {
  await rerollImage();
  repaintImage();
});

const inputCustomImg = document.getElementById("customImage");
inputCustomImg.addEventListener("change", (e) => {
  e.preventDefault();
  if (e.target.files.length <= 0) {
    return;
  }
  setFile(e.target.files[0]);
});
const buttonCustomImg = document.getElementById("customImageBtn");
buttonCustomImg.addEventListener("click", () => {
  inputCustomImg.click();
});

const inputCustom = document.getElementById("customText");
const replaceWithCustomText = async (e) => {
  if (e.type === "input" || inputCustom.value) {
    currentText = inputCustom.value;
    repaintImage();
  }
};
inputCustom.addEventListener("click", replaceWithCustomText);
inputCustom.addEventListener("input", replaceWithCustomText);

const slider = document.getElementById("slider");
const moveSlider = (value) => {
  overlayImageCoords.width = initialWidth * (value / 100);
  overlayImageCoords.height = initialHeight * (value / 100);
  repaintImage();
};
slider.addEventListener("input", (e) => moveSlider(e.target.value));

const downloadLinkReal = document.createElement("a");
downloadLinkReal.setAttribute("download", "TohleJsmeMy.jpg");
const linkSave = document.getElementById("save");
linkSave.addEventListener("click", (e) => {
  e.preventDefault();
  downloadLinkReal.setAttribute("href", canvas.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream"));
  downloadLinkReal.click();
});

window.addEventListener("resize", () => {
  const resizedCanvasInfo = getCanvasInfo();
  offsetX = resizedCanvasInfo.offsetX;
  offsetY = resizedCanvasInfo.offsetY;
  canvasScale = resizedCanvasInfo.canvasScale;
});

initFont();

rerollImage()
  .then(() => repaintImage());

// /////////////////////
const evCache = [];
let prevDiff = -1;

canvas.addEventListener("pointerdown", (e) => evCache.push(e));
canvas.addEventListener("pointermove", (e) => {
  for (let i = 0; i < evCache.length; i++) {
    if (e.pointerId === evCache[i].pointerId) {
      evCache[i] = e;
      break;
    }
  }

  // If two pointers are down, check for pinch gestures
  if (evCache.length === 2) {
    // Calculate the distance between the two pointers
    const curDiff = Math.abs(evCache[0].clientX - evCache[1].clientX);

    if (prevDiff > 0) {
      // zoom in
      if (curDiff > prevDiff) {
        slider.value = Number(slider.value) + 2;
        moveSlider(slider.value);
      }
      // zoom out
      if (curDiff < prevDiff) {
        slider.value = Number(slider.value) - 2;
        moveSlider(slider.value);
      }
    }

    prevDiff = curDiff;
  }
});

const onPointerUp = (e) => {
  for (let i = 0; i < evCache.length; i++) {
    if (evCache[i].pointerId === e.pointerId) {
      evCache.splice(i, 1);
      break;
    }
  }
  // If the number of pointers down is less than two then reset diff tracker
  if (evCache.length < 2) prevDiff = -1;
};

canvas.addEventListener("pointerup", onPointerUp);
canvas.addEventListener("pointercancel", onPointerUp);
canvas.addEventListener("pointerout", onPointerUp);
canvas.addEventListener("pointerleave", onPointerUp);
