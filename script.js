let timerInterval;
let timeLeft = 30;

async function generateQRCode() {
  const input = document.getElementById('instanceName');
  const name = input.value.trim();
  
  if (!name) {
    input.focus();
    input.classList.add('border-red-400', 'ring-4', 'ring-red-100');
    setTimeout(() => {
      input.classList.remove('border-red-400', 'ring-4', 'ring-red-100');
    }, 2500);
    return;
  }

  await fetchQRCode(name);
}

async function fetchQRCode(name) {
  const loader = document.getElementById('loader');
  const button = document.getElementById('generateButton');
  const buttonText = document.getElementById('buttonText');
  const buttonIcon = document.getElementById('buttonIcon');
  const qrSection = document.getElementById('qrcode');
  const qrImageContainer = document.getElementById('qrImage');
  const timerSection = document.getElementById('timer');

  // Show loading state
  qrSection.classList.add('hidden');
  timerSection.classList.add('hidden');
  loader.classList.remove('hidden');
  button.disabled = true;
  buttonText.textContent = 'Gerando...';
  buttonIcon.innerHTML = '<div class="spinner"></div>';

  try {
    const endpoint = '{{ $json.endpoint }}'; 

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instance: name })
    });

    if (!res.ok) {
      let errorMsg = `Erro HTTP: ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData && errorData.message) {
          errorMsg = errorData.message;
        }
      } catch (e) {
        errorMsg = res.statusText || errorMsg;
      }
      throw new Error(errorMsg);
    }
    
    const blob = await res.blob();
    if (blob.type.startsWith('image/')) {
      const url = URL.createObjectURL(blob);
      qrImageContainer.innerHTML = `<img src="${url}" alt="QR Code WhatsApp" class="rounded-xl max-w-64 mx-auto" />`;
    } else {
      const textResponse = await blob.text();
      console.error("Resposta inesperada:", textResponse);
      throw new Error('Resposta inesperada do servidor. Verifique o console.');
    }

    // Show QR code
    loader.classList.add('hidden');
    qrSection.classList.remove('hidden');
    timerSection.classList.remove('hidden');
    resetTimer();

  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    loader.classList.add('hidden');
    qrSection.classList.add('hidden');
    timerSection.classList.add('hidden');
    showError(error.message || 'Erro ao gerar QR Code. Tente novamente.');
  } finally {
    button.disabled = false;
    buttonText.textContent = 'Gerar QR Code';
    buttonIcon.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5"/>
      </svg>
    `;
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  timeLeft = 30;
  updateTimerDisplay();
  timerInterval = setInterval(updateTimerDisplay, 1000);
}

function updateTimerDisplay() {
  const timerTextEl = document.getElementById('timerText');
  const progressPath = document.querySelector('.progress-path');
  const timerSection = document.getElementById('timer');
  const qrSection = document.getElementById('qrcode');
  
  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    timerTextEl.textContent = 'Código expirado!';
    progressPath.style.strokeDashoffset = 157;
    setTimeout(() => {
      timerSection.classList.add('hidden');
      qrSection.classList.add('hidden');
      showError('QR Code expirado. Gere um novo código.');
    }, 1000);
    return;
  }
  
  timerTextEl.textContent = `${timeLeft}s`;
  
  const circumference = 2 * Math.PI * 25;
  const offset = circumference - (timeLeft / 30) * circumference;
  progressPath.style.strokeDashoffset = offset;
  
  timeLeft--;
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'fixed top-6 right-6 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg z-50 text-sm font-medium max-w-sm';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  
  setTimeout(() => {
    errorDiv.style.animation = 'fadeIn 0.3s ease-out reverse';
    setTimeout(() => errorDiv.remove(), 300);
  }, 4000);
}

// Event listeners
document.getElementById('instanceName').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    generateQRCode();
  }
});

window.addEventListener('load', () => {
  document.getElementById('instanceName').focus();
});
