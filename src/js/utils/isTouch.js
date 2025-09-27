const supportsTouch = () => 'ontouchstart' in window || navigator.msMaxTouchPoints;

export { supportsTouch };
