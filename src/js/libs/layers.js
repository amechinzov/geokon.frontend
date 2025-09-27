export default {
  init() {
    const firstLayer = document.querySelector(".layers__content-item");
    firstLayer.classList.add("active");
    const firstLayerImage = document.querySelector(".layers__images-image");
    firstLayerImage.classList.add("active");

    const layers = document.querySelectorAll(".layers__content-item");
    layers.forEach(layer => {
      layer.addEventListener("mouseenter", () => {
        const index = layer.getAttribute("data-index");
        const image = document.querySelector(`.layers__images-image[data-index="${index}"]`);
        const activeImage = document.querySelector(".layers__images-image.active");
        activeImage.classList.remove("active");
        image.classList.add("active");
        const activeLayer = document.querySelector(".layers__content-item.active");
        activeLayer.classList.remove("active");
        layer.classList.add("active");
      });
    })
  }

}