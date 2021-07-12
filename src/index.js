import data from "./data.js";

const canvas = document.getElementById("picture");
const ctx = canvas.getContext("2d");
const font = new FontFace("Bebas Neue", "url(fonts/BebasNeue-Bold.ttf)");
const fontSize = 60;

const initFont = async () => {
  await font.load();
  document.fonts.add(font);
  ctx.font = `${fontSize}px 'Bebas Neue'`;
};

const splitter = (str, l) => {
  const strs = [];
  while (str.length > l) {
    let pos = str.substring(0, l).lastIndexOf(" ");
    pos = pos <= 0 ? l : pos;
    strs.push(str.substring(0, pos));
    let i = str.indexOf(" ", pos) + 1;
    if (i < pos || i > pos + l) i = pos;
    str = str.substring(i);
  }
  strs.push(str);
  return strs;
};

const getText = () => {
  const rand = (n) => Math.floor(Math.random() * n);
  const txt = data[rand(data.length)];
  return txt;
};

const initImage = async (customText) => {
  const loadLogo = () => {
    const logo = new Image();
    logo.src = "logo2.png";
    logo.addEventListener("load", () => ctx.drawImage(logo, 525, 20));
  };

  const imageData = await fetch("https://picsum.photos/800");
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = imageData.url;
  image.addEventListener("load", () => {
    ctx.drawImage(image, 0, 0);
    loadLogo();
    let i = 0;
    const unsplitText = customText ?? getText();
    const text = splitter(unsplitText, 20).reverse();
    text.forEach((line) => {
      const x = 30;
      const y = 685;
      const padding = 15;
      const lineHeight = padding + fontSize;
      ctx.fillStyle = "#f9dc4d";
      ctx.fillRect(x, y - (i * lineHeight), ctx.measureText(line).width + 2 * padding, lineHeight);
      ctx.textBaseline = "top";
      ctx.fillStyle = "black";
      ctx.fillText(line, x + padding, y + padding - (i * lineHeight));
      i += 1;
    });

    const linkSave = document.getElementById("save");
    linkSave.setAttribute("download", "PirStanKampan.png");
    linkSave.setAttribute("href", canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"));
  });
};

const buttonRandom = document.getElementById("randomized");
buttonRandom.onclick = () => initImage();
// buttonRandom.addEventListener("click", () => initImage);

const customInput = document.getElementById("customText");
const buttonCustom = document.getElementById("submitCustomText");
buttonCustom.onclick = () => {
  if (customInput.value) {
    initImage(customInput.value);
  }
};

initFont();
initImage();