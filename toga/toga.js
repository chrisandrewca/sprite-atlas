// API

const editorKeyDown = (e) => console.log('keyDown', e);
const editorKeyUp = (e) => console.log('keyUp', e);

const editorWheel = (e) => {

  const factor = e.deltaY < 0
    ? state.sourceImage.zoom.factor + 1
    : state.sourceImage.zoom.factor - 1;

  // warning: This is ok if the construction of this type is sound
  //  tries to save on the cost of a state copy for the factor dependency
  const zoomOffset = getZoomOffset({ tileSize: state.sourceImage.zoom.tileSize, factor });

  // wip: zoom to mouse
  // get mouse location

  const bounds = state.canvas.getBoundingClientRect();
  const mX = e.clientX - bounds.left; // warning: can be 0
  const mY = e.clientY - bounds.top; // warnig: can be 0

  // scale them to the image coord space for zoom?
  // warning: I chose Math.round since
  //  the division is producing values like 4.03 and 4.83
  //  and I think mX/mY >= 0
  const smX = mX * (Math.round(state.sourceImage.image.width / bounds.width));
  const smY = mY * (Math.round(state.sourceImage.image.height / bounds.height));
  // console.log({ mX, mY, smX, smY, cX: e.clientX, cY: e.clientY, bounds });

  // create image position dX/dY
  // translate smX/smY of the image towards the center of the canvas by tileSize steps
  const cX = Math.floor(bounds.width / 2) * (Math.round(state.sourceImage.image.width / bounds.width));
  const cY = Math.floor(bounds.height / 2) * (Math.round(state.sourceImage.image.height / bounds.height));
  console.log({ midX: Math.floor(bounds.width / 2), midY: Math.floor(bounds.height / 2), cX, cY, zoomOffset });

  const pX = state.sourceImage.render.x + cX - smX + zoomOffset;
  const pY = state.sourceImage.render.y + cY - smY + zoomOffset;
  console.log({ pX, pY });

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
        x: pX,
        y: pY
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
      x: 0,
      y: 0
    },
    // Idea: My programs type system.
    //  Begin constraining the ways in which my program can fail.
    //  Trying to be more than a reduction in code complexity.
    //    A type of <Zoom> where factor<Number:Integer>, tileSize<Number:Integer>
    zoom: {
      factor: 0,
      tileSize: 200
    }
  }
});

let state = clearState();

const render = () => {

  const c = state.canvas.getContext('2d');

  c.clearRect(0, 0, c.canvas.width, c.canvas.height);

  drawSourceImage(c);
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