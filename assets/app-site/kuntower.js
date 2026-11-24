const ktEnemies = {
  skeleton: { name: '骷髅战士 (Skeleton)', atk: 52, def: 12, hp: 55, img: 'skeleton.png', note: '1-10F 基础近战魔物' },
  skeletonCaptain: { name: '骷髅队长 (Skeleton Captain)', atk: 150, def: 90, hp: 400, img: 'skeleton_captain.png', note: '10F 小头目，卡防门槛怪' },
  orc: { name: '兽人武士 (Orc Warrior)', atk: 122, def: 18, hp: 340, img: 'orc.png', note: '11-20F 常见物理战士' },
  bigBat: { name: '嗜血大飞蝠 (Big Bat)', atk: 230, def: 70, hp: 450, img: 'big_bat.png', note: '15F 飞蝠领主，需优先堆防' },
  vampire: { name: '吸血鬼领主 (Vampire Boss)', atk: 340, def: 95, hp: 700, img: 'vampire.png', note: '20F 霸主，持有圣光十字架可翻倍破防' },
  brownWizard: { name: '麻衣电击巫师 (Brown Wizard)', atk: 370, def: 110, hp: 220, img: 'brown_wizard.png', note: '进场扣除 100 点固定领域电击伤害' },
  magicDragon: { name: '远古魔龙 (Ancient Dragon)', atk: 500, def: 250, hp: 1200, img: 'magic_dragon.png', note: '24F 守门恶龙，高攻高防需持有屠龙剑' },
  bossYellow: { name: '黄金魔王 (Yellow King)', atk: 450, def: 180, hp: 1000, img: 'boss_yellow.png', note: '30F 黄金宫殿主宰' },
  octopus: { name: '深海八爪鱼 (Octopus)', atk: 520, def: 210, hp: 1400, img: 'octopus.png', note: '35F 深渊触手魔物' },
  redWizard: { name: '魔音大魔导 (Red Wizard)', atk: 380, def: 130, hp: 200, img: 'red_wizard.png', note: '进场扣除 200 点固定领域音波伤害' },
  bossTwin: { name: '双子大魔导 (Twin Archmages)', atk: 560, def: 280, hp: 1800, img: 'boss_twin.png', note: '40F 领主，击败后可得闪避护符' },
  darkKnight: { name: '黑暗骑士 (Dark Knight)', atk: 580, def: 320, hp: 2000, img: 'dark_knight.png', note: '41-48F 精锐重装骑士' },
  bossRed: { name: '49F 假魔王 (Crimson Impostor)', atk: 620, def: 350, hp: 2600, img: 'boss_red.png', note: '封魔阵假领主，破除后开启 50F 密道' },
  demonKing: { name: '50F 终极黑粉魔王 (Demon King)', atk: 680, def: 420, hp: 3800, img: 'demon_king.png', note: '终极黑粉头目，决战巅峰！' },
  shadowDevourer: { name: '变异沙包练习生 (Trainee)', atk: 450, def: 300, hp: 2500, img: 'shadow_devourer.png', note: '狂野模式变异共生魔物' }
};

const ktSpriteDirectory = new URL('../../images/kuntower/', document.currentScript.src);
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
  const enemyKey = ktEnemySelect.value;
  const enemy = ktEnemies[enemyKey] || ktEnemies.orc;

  ktMonsterImage.src = new URL(enemy.img, ktSpriteDirectory).href;
  ktMonsterName.textContent = enemy.name;
  ktMonsterStats.textContent = `生命值 ${enemy.hp} · 攻击力 ${enemy.atk} · 防御力 ${enemy.def}`;
  ktMonsterNote.textContent = enemy.note;

  if (attack <= enemy.def) {
    ktStatus.parentElement.dataset.state = 'blocked';
    ktStatus.textContent = '无法破防，攻击力需要高于对手防御力。';
    ktDamage.textContent = '999999';
    ktRounds.textContent = '∞';
    ktRemaining.textContent = '0';
    ktHealthBar.style.width = '0%';
    return;
  }

  const rounds = Math.ceil(enemy.hp / (attack - enemy.def));
  const enemyDamage = Math.max(0, enemy.atk - defense);
  let damage = (rounds - 1) * enemyDamage;
  if (enemyKey === 'brownWizard') damage += 100;
  if (enemyKey === 'redWizard') damage += 200;

  const remaining = Math.max(0, health - damage);
  if (remaining === 0) {
    ktStatus.parentElement.dataset.state = 'lost';
    ktStatus.textContent = `战力不足。预计需要 ${rounds} 回合，当前生命值不足以撑完。`;
  } else if (damage === 0) {
    ktStatus.parentElement.dataset.state = 'safe';
    ktStatus.textContent = '可以无伤击败对手。';
  } else {
    ktStatus.parentElement.dataset.state = 'win';
    ktStatus.textContent = `可以战胜，预计损耗 ${damage} 点生命值。`;
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
