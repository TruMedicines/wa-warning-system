/*
 * AdShuffle — vendored copy, MIT License
 * Source: https://github.com/codions/ad-shuffle
 *
 * Modified from the original: removed the library's auto-injected <style> block
 * (which referenced an image on the author's own domain) so this file has zero
 * external dependencies. WA Watch supplies its own CSS for sponsor slots instead
 * — see the .sponsor-slot rules in index.html.
 *
 * Handles: banner rotation (random-by-frequency or sequential, with optional
 * start/end dates per banner) and a persistent show/hide toggle via localStorage.
 */
class AdShuffleManager {
  constructor() {
    this.adsContainers = document.querySelectorAll(".rb-ads");
    this.toggleButton = document.getElementById("ads-toggle-button");
    this.initializeAds();
  }
  initializeAds() {
    const hidden = this.areAdsHidden();
    this.updateAdsVisibility(hidden);
    if (this.toggleButton) {
      this.toggleButton.textContent = hidden ? "Show" : "Hide";
      this.toggleButton.addEventListener("click", () => this.toggleAds());
    }
    if (!hidden) this.initializeRotationLogic();
  }
  areAdsHidden() {
    return localStorage.getItem("ads-hidden") === "true";
  }
  updateAdsVisibility(hidden) {
    this.adsContainers.forEach((n) => { n.style.display = hidden ? "none" : "block"; });
  }
  toggleAds() {
    const hidden = !this.areAdsHidden();
    localStorage.setItem("ads-hidden", String(hidden));
    this.updateAdsVisibility(hidden);
    if (this.toggleButton) this.toggleButton.textContent = hidden ? "Show" : "Hide";
    if (!hidden) this.initializeRotationLogic();
  }
  initializeRotationLogic() {
    this.adsContainers.forEach((container) => {
      const slots = container.querySelectorAll(".rb-random-ads");
      const auto = container.getAttribute("data-auto-rotate") === "true";
      const interval = 1000 * parseInt(container.getAttribute("data-interval") || "0", 10);
      if (container.getAttribute("data-sequential") === "true") {
        this.rotateSequentially(slots, interval, auto);
      } else {
        this.rotateRandomly(slots, interval, auto);
      }
    });
  }
  rotateSequentially(slots, interval, auto) {
    let i = 0;
    const total = slots.length;
    const show = () => {
      slots.forEach((s) => (s.style.display = "none"));
      if (total) slots[i].style.display = "block";
      i = (i + 1) % total;
    };
    show();
    if (auto && interval > 0) setInterval(show, interval);
  }
  rotateRandomly(slots, interval, auto) {
    const pool = [];
    let totalWeight = 0;
    slots.forEach((s) => {
      const start = s.getAttribute("data-start-date") ? new Date(s.getAttribute("data-start-date")) : null;
      const end = s.getAttribute("data-end-date") ? new Date(s.getAttribute("data-end-date")) : null;
      if ((start && new Date() < start) || (end && new Date() > end)) return;
      const freq = parseInt(s.getAttribute("data-frequency")) || 1;
      totalWeight += freq;
      for (let k = 0; k < freq; k++) pool.push(s);
    });
    if (!pool.length) return;
    const show = () => {
      const pick = pool[Math.floor(Math.random() * totalWeight) % pool.length];
      slots.forEach((s) => (s.style.display = "none"));
      pick.style.display = "block";
    };
    show();
    if (auto && interval > 0) setInterval(show, interval);
  }
}

document.addEventListener("DOMContentLoaded", () => { new AdShuffleManager(); });
window.AdShuffleManager = AdShuffleManager;
