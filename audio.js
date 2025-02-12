const audioElement = document.getElementById('audioElement');
const playIcon = document.getElementById('playIcon');
const waveAnimation = document.getElementById('waveAnimation');
let isPlaying = false;

function toggleAudio() {
    if (isPlaying) {
        audioElement.pause();
        playIcon.style.display = 'block';
        waveAnimation.style.display = 'none';
    } else {
        audioElement.play();
        playIcon.style.display = 'none';
        waveAnimation.style.display = 'block';
    }
    isPlaying = !isPlaying;
}

audioElement.addEventListener('ended', () => {
    isPlaying = false;
    playIcon.style.display = 'block';
    waveAnimation.style.display = 'none';
});