const canvas = document.getElementById('sortingCanvas');
const ctx = canvas.getContext('2d');

const width = canvas.width;
const height = canvas.height;
let barWidth = 5;
let numBars = Math.floor(width / barWidth);
const delay = 1; // Delay in milliseconds between steps

// Initialize bars with evenly distributed heights
let bars = Array.from({ length: numBars }, (_, i) => (i + 1) * (height / numBars));
let currentOscillator = null;
let isSorting = false;

function showNotification(message, duration = 5000) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

window.addEventListener('resize', () => {
    width = canvas.width; // Update width to current canvas width
    height = canvas.height;
    numBars = Math.floor(width / barWidth); // Recalculate numBars based on updated canvas width and barWidth
    bars = Array.from({ length: numBars }, (_, i) => (i + 1) * (height / numBars)); // Update bars array
    drawBars(bars); // Redraw bars with updated dimensions
});

// Event listener for applying new settings
document.getElementById('applySettingsButton').addEventListener('click', async () => {
    const newBarWidth = parseInt(document.getElementById('barWidthInput').value);
    if (newBarWidth >= 1 && newBarWidth <= 20) {
        barWidth = newBarWidth;
        numBars = Math.floor(width / barWidth); // Recalculate numBars based on updated barWidth
        bars = Array.from({ length: numBars }, (_, i) => (i + 1) * (height / numBars)); // Update bars array
        await shuffle(bars);
        drawBars(bars);
    } else {
        showNotification('Please enter a value between 1 and 20 for bar width.');
    }
});

async function swap(bars, i, j) {
    [bars[i], bars[j]] = [bars[j], bars[i]];
    drawBars(bars, i);  // Highlight the bar being swapped
    playSound(i, bars[i]);
    await new Promise(resolve => setTimeout(resolve, delay));
    drawBars(bars, j);  // Highlight the bar being swapped
    playSound(i, bars[i]);
    await new Promise(resolve => setTimeout(resolve, delay));
}

// Shuffle function to create an unsorted array
async function shuffle(bars) {
    for (let i = bars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        await swap(bars, i, j);
    }
}

// Function to draw the bars
function drawBars(bars, movingIndex = -1) {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < bars.length; i++) {
        ctx.fillStyle = (i === movingIndex) ? 'red' : 'white';
        ctx.fillRect(i * barWidth, height - bars[i], barWidth, bars[i]);
    }
}

async function waveEffect(bars){
    const flashDelay = 5;
    for(let i = 0; i < bars.length; i++){
        ctx.fillStyle = 'red';
        ctx.fillRect(i * barWidth, height - bars[i], barWidth, bars[i]);
        playSound(i, bars[i]);
        await new Promise(resolve => setTimeout(resolve, flashDelay));

        ctx.fillStyle = 'green';
        ctx.fillRect(i * barWidth, height - bars[i], barWidth, bars[i]);
    }
}


let audioContext = null;
function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

// Function to play a sound effect based on the height of the bar
async function playSound(index, barHeight) {
    const audioContext = getAudioContext();
    
    const oscillator = audioContext.createOscillator();
    currentOscillator = oscillator;  // Update the current oscillator
    oscillator.type = 'sine';
    
    const minFrequency = 100;
    const maxFrequency = 1000;
    const normalizedHeight = barHeight / height;
    const frequency = minFrequency + normalizedHeight * (maxFrequency - minFrequency);
    
    var volume = audioContext.createGain();
    volume.connect(audioContext.destination);
    volume.gain.value = 0.1;

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(volume);
    oscillator.start();
    
    // Stop oscillator after a short duration (adjust duration as needed)
    await new Promise(resolve => setTimeout(() => {
        oscillator.stop();
        resolve();
    }, 20));  // Increased duration to reduce popping
}

// Function to partition the array and return the pivot index
async function partition(bars, low, high) {
    let pivot = bars[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
        if (bars[j] < pivot) {
            i++;
            [bars[i], bars[j]] = [bars[j], bars[i]];
            drawBars(bars, j);
            await playSound(j, bars[j]); // Play sound effect with bar height
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    [bars[i + 1], bars[high]] = [bars[high], bars[i + 1]];
    drawBars(bars, high);
    playSound(high, bars[high]); // Play sound effect with bar height
    await new Promise(resolve => setTimeout(resolve, delay));

    return i + 1;
}

async function selectionSort(bars) {
    for (let i = 0; i < bars.length; i++) {
        let minIndex = i;
        for (let j = i + 1; j < bars.length; j++) {
            if (bars[j] < bars[minIndex]) {
                minIndex = j;
            }
        }
        if (minIndex !== i) {
            [bars[i], bars[minIndex]] = [bars[minIndex], bars[i]];
            drawBars(bars, minIndex);
            await playSound(minIndex, bars[minIndex]); // Play sound effect with bar height
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Quicksort algorithm
async function quickSort(bars, low, high) {
    if (low < high) {
        let pivotIndex = await partition(bars, low, high);

        await quickSort(bars, low, pivotIndex - 1);
        await quickSort(bars, pivotIndex + 1, high);
    }
}

// Merge Sort algorithm
async function mergeSort(bars, left, right) {
    if (left >= right) {
        return;
    }
    
    const middle = Math.floor((left + right) / 2);
    await mergeSort(bars, left, middle);
    await mergeSort(bars, middle + 1, right);
    await merge(bars, left, middle, right);
}

async function merge(bars, left, middle, right) {
    const leftArray = bars.slice(left, middle + 1);
    const rightArray = bars.slice(middle + 1, right + 1);
    
    let i = 0, j = 0, k = left;
    while (i < leftArray.length && j < rightArray.length) {
        if (leftArray[i] <= rightArray[j]) {
            bars[k++] = leftArray[i++];
        } else {
            bars[k++] = rightArray[j++];
        }
        drawBars(bars, k - 1);
        await playSound(j, bars[j]);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    while (i < leftArray.length) {
        bars[k++] = leftArray[i++];
        drawBars(bars, k - 1);
        await playSound(j, bars[j]);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    while (j < rightArray.length) {
        bars[k++] = rightArray[j++];
        drawBars(bars, k - 1);
        await playSound(j, bars[j]);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

// Function to heapify a subtree rooted with node i which is an index in bars[]
async function heapify(bars, n, i) {
    let largest = i;
    let left = 2 * i + 1;
    let right = 2 * i + 2;

    if (left < n && bars[left] > bars[largest]) {
        largest = left;
    }

    if (right < n && bars[right] > bars[largest]) {
        largest = right;
    }

    if (largest !== i) {
        [bars[i], bars[largest]] = [bars[largest], bars[i]];
        drawBars(bars, i);
        await playSound(i, bars[i]);
        await new Promise(resolve => setTimeout(resolve, delay));
        await heapify(bars, n, largest);
    }
}

// HeapSort algorithm
async function heapSort(bars) {
    let n = bars.length;

    // Build a max heap
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        await heapify(bars, n, i);
    }

    // One by one extract an element from heap
    for (let i = n - 1; i > 0; i--) {
        // Move current root to end
        [bars[0], bars[i]] = [bars[i], bars[0]];
        drawBars(bars, i);
        await playSound(i, bars[i]);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Call max heapify on the reduced heap
        await heapify(bars, i, 0);
    }
}

function isSorted(array) {
    for (let i = 1; i < array.length; i++) {
        if (array[i] < array[i - 1]) {
            return false;
        }
    }
    return true;
}

async function bogoSort(bars) {
    while (!isSorted(bars)) {
        await shuffle(bars);
        drawBars(bars);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}
// Function to get the number of digits in the largest number
function getMaxDigits(arr) {
    let max = Math.max(...arr);
    return max.toString().length;
}

// Function to get digit at specific position from right
function getDigit(num, digitIndex) {
    return Math.floor(num / Math.pow(10, digitIndex)) % 10;
}

// American Flag Sort
async function americanFlagSort(bars) {
    const maxDigits = getMaxDigits(bars);
    
    for (let digit = 0; digit < maxDigits; digit++) {
        let buckets = Array.from({ length: 10 }, () => []);
        
        for (let i = 0; i < bars.length; i++) {
            let digitValue = getDigit(bars[i], digit);
            buckets[digitValue].push(bars[i]);
        }
        
        let index = 0;
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < buckets[i].length; j++) {
                bars[index++] = buckets[i][j];
                drawBars(bars, index - 1); // Highlight the bar being moved
                playSound(i, bars[i]);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    drawBars(bars);
    await waveEffect(bars);
}

async function doubleSelectionSort(bars) {
    let left = 0;
    let right = bars.length - 1;

    while (left < right) {
        let minIndex = left;
        let maxIndex = right;

        for (let i = left; i <= right; i++) {
            if (bars[i] < bars[minIndex]) {
                playSound(i, bars[i]);
                minIndex = i;
            }
            if (bars[i] > bars[maxIndex]) {
                playSound(i, bars[i]);
                maxIndex = i;
            }
        }

        // Swap the smallest element to the correct position
        [bars[left], bars[minIndex]] = [bars[minIndex], bars[left]];

        // If the largest element was moved to the position of the smallest element
        if (maxIndex === left) {
            maxIndex = minIndex;
        }

        // Swap the largest element to the correct position
        [bars[right], bars[maxIndex]] = [bars[maxIndex], bars[right]];

        drawBars(bars, left); // Highlight the smallest element position
        await new Promise(resolve => setTimeout(resolve, delay));
        drawBars(bars, right); // Highlight the largest element position
        await new Promise(resolve => setTimeout(resolve, delay));

        left++;
        right--;
    }

    drawBars(bars);
    await waveEffect(bars);
}

// Initial drawing of the bars
drawBars(bars);

document.getElementById('mergeSortButton').addEventListener('click', async () => {
    if (isSorting) {
        showNotification("Sorting is already in progress!");
        return;
    } else if (isSorted(bars)){
        showNotification("Already sorted!");
        return;
    }
    isSorting = true;
    drawBars(bars);
    await mergeSort(bars, 0, bars.length - 1);
    drawBars(bars);
    await waveEffect(bars);
    isSorting = false;
});

document.getElementById('quickSortButton').addEventListener('click', async () => {
    if (isSorting) {
        showNotification("Sorting is already in progress!");
        return;
    } else if (isSorted(bars)){
        showNotification("Already sorted!");
        return;
    }
    isSorting = true;
    drawBars(bars);
    await quickSort(bars, 0, bars.length - 1);
    drawBars(bars);
    await waveEffect(bars);
    isSorting = false;
});

document.getElementById('heapSortButton').addEventListener('click', async () => {
    if (isSorting) {
        showNotification("Sorting is already in progress!");
        return;
    } else if (isSorted(bars)){
        showNotification("Already sorted!");
        return;
    }
    isSorting = true;
    drawBars(bars);
    await heapSort(bars);
    drawBars(bars);
    await waveEffect(bars);
    isSorting = false;
});

document.getElementById('selectionSortButton').addEventListener('click', async () => {
    if (isSorting) {
        showNotification("Sorting is already in progress!");
        return;
    } else if (isSorted(bars)){
        showNotification("Already sorted!");
        return;
    }
    isSorting = true;
    drawBars(bars);
    await selectionSort(bars);
    drawBars(bars);
    await waveEffect(bars);
    isSorting = false;
});

document.getElementById('bogoSortButton').addEventListener('click', async () => {
    if (isSorting) {
        showNotification("Sorting is already in progress!");
        return;
    } else if (isSorted(bars)){
        showNotification("Already sorted!");
        return;
    }
    isSorting = true;
    drawBars(bars);
    await bogoSort(bars);
    drawBars(bars);
    await waveEffect(bars);
    isSorting = false;
});

document.getElementById('americanFlagSort').addEventListener('click', async () => {
    if (isSorting) {
        showNotification("Sorting is already in progress!");
        return;
    } else if (isSorted(bars)){
        showNotification("Already sorted!");
        return;
    }
    isSorting = true;
    drawBars(bars);
    await americanFlagSort(bars);
    isSorting = false;
});

document.getElementById('doubleSelectionSortButton').addEventListener('click', async () => {
    if (isSorting) {
        showNotification("Sorting is already in progress!");
        return;
    } else if (isSorted(bars)){
        showNotification("Already sorted!");
        return;
    }
    isSorting = true;
    drawBars(bars);
    await doubleSelectionSort(bars);
    isSorting = false;
});

document.getElementById('shuffleButton').addEventListener('click', async () => {
    if (isSorting) {
        showNotification("Sorting is already in progress!");
        return;
    }
    isSorting = true;
    await shuffle(bars);
    drawBars(bars);
    isSorting = false;
});