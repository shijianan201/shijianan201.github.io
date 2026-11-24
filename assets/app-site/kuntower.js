const ktMessages = JSON.parse(document.getElementById('kt-calculator').dataset.messages);
const ktAttack = document.getElementById('kt-player-atk');
const ktDefense = document.getElementById('kt-player-def');
const ktHealth = document.getElementById('kt-player-hp');
const ktEnemySelect = document.getElementById('kt-enemy-select');
const ktMonsterImage = document.getElementById('kt-monster-icon');
const ktMonsterName = document.getElementById('kt-monster-display-name');
const ktMonsterStats = document.getElementById('kt-monster-display-stats');
const ktMonsterNote = document.getElementById('kt-monster-display-note');
const ktStatus = document.getElementById('kt-result-status');
const ktDamage = document.getElementById('kt-res-damage');
const ktRounds = document.getElementById('kt-res-rounds');
const ktRemaining = document.getElementById('kt-res-remain-hp');
const ktHealthBar = document.getElementById('kt-hp-bar');

function ktCalculate() {
  const attack = Number.parseInt(ktAttack.value || '0', 10);
  const defense = Number.parseInt(ktDefense.value || '0', 10);
  const health = Number.parseInt(ktHealth.value || '0', 10);
  const enemy = ktEnemySelect.selectedOptions[0].dataset;
  const enemyDefense = Number(enemy.defense);

  if (ktMonsterImage.getAttribute('src') !== enemy.sprite) {
    ktMonsterImage.src = enemy.sprite;
  }
  ktMonsterName.textContent = enemy.name;
  ktMonsterStats.textContent = ktMessages.stats
    .replace('%hp%', enemy.hp)
    .replace('%atk%', enemy.atk)
    .replace('%def%', enemy.defense);
  ktMonsterNote.textContent = enemy.note;

  if (attack <= enemyDefense) {
    ktStatus.parentElement.dataset.state = 'blocked';
    ktStatus.textContent = ktMessages.blocked;
    ktDamage.textContent = '999999';
    ktRounds.textContent = '∞';
    ktRemaining.textContent = '0';
    ktHealthBar.style.width = '0%';
    return;
  }

  const rounds = Math.ceil(Number(enemy.hp) / (attack - enemyDefense));
  const enemyDamage = Math.max(0, Number(enemy.atk) - defense);
  const damage = (rounds - 1) * enemyDamage + Number(enemy.fieldDamage || 0);

  const remaining = Math.max(0, health - damage);
  if (remaining === 0) {
    ktStatus.parentElement.dataset.state = 'lost';
    ktStatus.textContent = ktMessages.lost.replace('%rounds%', rounds);
  } else if (damage === 0) {
    ktStatus.parentElement.dataset.state = 'safe';
    ktStatus.textContent = ktMessages.safe;
  } else {
    ktStatus.parentElement.dataset.state = 'win';
    ktStatus.textContent = ktMessages.win.replace('%damage%', damage);
  }

  ktDamage.textContent = damage;
  ktRounds.textContent = rounds;
  ktRemaining.textContent = remaining;
  ktHealthBar.style.width = remaining > 0 ? Math.round(remaining / health * 100) + '%' : '0%';
}

for (const input of [ktAttack, ktDefense, ktHealth]) {
  input.addEventListener('input', ktCalculate);
}
ktEnemySelect.addEventListener('change', ktCalculate);

for (const button of document.querySelectorAll('.kt-gear-btn[data-attack-bonus]')) {
  button.addEventListener('click', () => {
    const attack = Number.parseInt(ktAttack.value || '0', 10);
    const defense = Number.parseInt(ktDefense.value || '0', 10);
    ktAttack.value = Math.max(1, attack + Number(button.dataset.attackBonus));
    ktDefense.value = Math.max(0, defense + Number(button.dataset.defenseBonus));
    ktCalculate();
  });
}

document.getElementById('kt-reset-stats').addEventListener('click', () => {
  for (const input of [ktAttack, ktDefense, ktHealth]) {
    input.value = input.defaultValue;
  }
  ktCalculate();
});

window.addEventListener('pageshow', ktCalculate);
ktCalculate();
