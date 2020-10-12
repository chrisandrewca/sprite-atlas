// API

const editorKeyDown = (e) => console.log('keyDown', e);
const editorKeyUp = (e) => console.log('keyUp', e);

const editorWheel = (e) => {

  const factor = e.deltaY < 0
    ? state.sourceImage.zoom.factor + 1 // TODO zoom limit?
    : Math.max(state.sourceImage.zoom.factor - 1, 0);

  // warning: This is ok if the construction of this type is sound
  //  tries to save on the cost of a state copy for the factor dependency
  const zoomOffset = getZoomOffset({ tileSize: state.sourceImage.zoom.tileSize, factor });

  const bounds = state.canvas.getBoundingClientRect();
  const mouseX = e.clientX - bounds.left;
  const mouseY = e.clientY - bounds.top;
  const centerX = Math.floor(bounds.width / 2);
  const centerY = Math.floor(bounds.height / 2);

  // bigger / smaller
  // lefter / righter
  // upper / downer
  // the center of the image must be chained to the center of the canvas surface
  // the direction of the chain must be driven by the quadrant location of the mouse
  //  4 cases
  //  +x, +y
  //  +x, -y
  //  -x, -y,
  //  -x, +y
  // the length of a chain link is zoomOffset
  // console.log({ centerX, centerY, mouseX, mouseY, dx: centerX - mouseX, dy: centerY - mouseY });
  //  all seem to remain the same
  const dx = centerX - mouseX < 0
    ? -zoomOffset
    : zoomOffset;

  const dy = centerY - mouseY < 0
    ? -zoomOffset
    : zoomOffset;

  const posX = dx < 0
    ? dx
    : 0;

  const posY = dy < 0
    ? dy
    : 0;
  // TODO graph these points help solve the problem

  // Idea: Complexity management; (for previous iteration of code)
  //  understanding that getZoomOffset deps on state.sourceImage.zoom.factor to have been updated in previous phase state
  //  aka this state can only be valid when zoom.factor is computable for and shall be computed for phaseState[current - 2] -> phaseState[current - 1]
  //    Cost of a runtime solution?
  //      Compute probability of or prove correctness
  //      Compute task
  //        Stitching, runtimes, analysis, paradigms, annotations, proofs, rules, understand => ML
  state = {
    ...state,
    sourceImage: {
      ...state.sourceImage,
      render: {
        ...state.render,
        ...vecAddScalar(
          getFittedSize(
            state.sourceImage.image.width,
            state.sourceImage.image.height,
            state.canvas.height),
          zoomOffset),
        x: posX,
        y: posY,
        debug: {
          mouseX,
          mouseY
        }
      },
      zoom: {
        ...state.sourceImage.zoom,
        factor
      }
    }
  };

  render();
};

const openSourceImage = (e) => {

  const image = new Image();

  image.onload = (e) => {

    const canvas = document.createElement('canvas');
    canvas.onkeydown = editorKeyDown;
    canvas.onkeyup = editorKeyUp;
    canvas.onwheel = editorWheel;
    canvas.style.width = '100%';
    canvas.style.height = '600px';
    canvas.style.border = '1px solid black';
    canvas.tabIndex = "-1"; // TODO make next tabbable after choose file

    document.querySelector('main').appendChild(canvas);
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    state = clearState();
    state = {
      ...state,
      canvas,
      sourceImage: {
        ...state.sourceImage,
        image: e.path[0],
        render: {
          ...state.sourceImage.render,
          ...getFittedSize(
            e.path[0].width,
            e.path[0].height,
            canvas.height)
        }
      }
    };

    render();
  };

  image.src = URL.createObjectURL(e.target.files[0]);
};

const onMouseDown = () => { };

const onMousePosition = () => { };

const onMouseUp = () => { };

const createLocalBoundingBox = (x1, y1, x2, y2) => { };

const createGlobalBoundingBox = (x1, y1, x2, y2) => { };

// Implementation

const clearState = () => ({
  canvas: null, // Question: By which phase state does this need to be initialized? Can tools figure that out?
  sourceImage: {
    image: null,
    render: {
      w: null,
      h: null,
      x: null,
      y: null
    },
    // Idea: My programs type system.
    //  Begin constraining the ways in which my program can fail.
    //  Trying to be more than a reduction in code complexity.
    //    A type of <Zoom> where factor<Number:Integer>, tileSize<Number:Integer>
    zoom: {
      factor: 0,
      tileSize: 25
    }
  }
});

let state = clearState();

const render = () => {

  const c = state.canvas.getContext('2d');

  c.clearRect(0, 0, c.canvas.width, c.canvas.height);

  drawSourceImage(c);

  if (state.sourceImage.render.debug) {
    c.fillStyle = '#FF0000'; // RED
    c.beginPath();
    c.arc(
      state.sourceImage.render.debug.mouseX,
      state.sourceImage.render.debug.mouseY,
      5,
      0,
      2 * Math.PI);
    c.fill();
  }
};

const drawSourceImage = (c) => {

  const
    { image, render } = state.sourceImage,
    { w, h, x, y } = render;

  c.drawImage(image, x, y, w, h);
};

const getFittedSize = (w, h, boundingHeight) => ({
  w: Math.floor(w * (boundingHeight / h)),
  h: boundingHeight
});

// Idea: What this function expects in my programs type system.
//  Accepts
//    A type of <Object> whose values are of <Number:Integer>
//    A type of <Number:Integer>
//  Produces
//    A type of <Object> whose values are of <Number:Integer>
const vecAddScalar = (v, s) => Object
  .keys(v)
  .map(component => ({ [component]: v[component] + s }))
  .reduce((vector, component) => ({ ...vector, ...component }), {});

// Idea: What this function expects in my programs type system.
//  Accepts
//    A type of <Object> with keys tileSize<Number:Integer>, factor<Number:Integer>
//  Produces
//    A type of <Number:Integer>
const getZoomOffset = ({ tileSize, factor }) => tileSize * factor;

// Code analysis idea:
//  1. Add a new feature which requires new state 'photos[]' on 'user{}'
//  2. Forget to initialize default state or validate its state
//  3. Program crash
// Solutions:
//  Functional programming w/ certain feature set
//  ML - humans forget things - so train an acceptable net?

// Another example:
//  1. Code sets image.src triggering image.onload
//  2. image.onload uses event.path to access the target element
//  3. Code gets refactored and image is created in a way where the event.path changes
//  4. Program crash
//    Side effects, dependencies, API knowledge
//    Solutions: Comments, Safer programming (check, iterate over path), Learning, FP, Proofs, ML

// Ideas:
// Group code together for reasoning, alphabetical within groups for searching
// Tool:
  //  1) Generate function comment which includes type schema
  //  2) Dev hooking up some complex subsystems w/ business logic; we have ctrl + space for intellisense; alt + period for schema exploration / asking questions of the phase space
  //  3) ...steps towards minority report validation diamond
    // Could be done for JavaScript with Joi at runtime + lint time because Joi produces the best runtime errors I've seen
    // TypeScript?
    // Haskell - Google - does this exist?