// ═══════════════════════════════════════════════
// DATA  (temporada 2025-26)
// ═══════════════════════════════════════════════
const LEAGUES=[
  // Premier League 2025-26
  // Saíram (rebaixados 24-25): Leicester City, Ipswich Town, Southampton
  // Entraram (subidos 24-25): Sunderland, Leeds United, Burnley
  {id:'premier',name:'Premier League',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',teams:[
    'Arsenal','Aston Villa','Bournemouth','Brentford','Brighton',
    'Burnley','Chelsea','Crystal Palace','Everton','Fulham',
    'Leeds United','Liverpool','Manchester City','Manchester United',
    'Newcastle','Nottingham Forest','Sunderland','Tottenham','West Ham','Wolverhampton'
  ]},
  // La Liga 2025-26
  // Saíram (rebaixados 24-25): Las Palmas, Valladolid, Leganés
  // Entraram (promovidos 24-25): Elche, Levante, Real Oviedo
  {id:'laliga',name:'La Liga',flag:'🇪🇸',teams:[
    'Barcelona','Real Madrid','Villarreal','Atlético Madrid','Betis',
    'Celta Vigo','Getafe','Rayo Vallecano','Valencia','Real Sociedad',
    'Espanyol','Athletic Club','Sevilla','Alavés','Elche',
    'Levante','Osasuna','Mallorca','Girona','Real Oviedo'
  ]},
  // Bundesliga 2025-26
  // Saíram (rebaixados 24-25): Holstein Kiel, VfL Bochum
  // Entraram (promovidos 24-25): Hamburger SV, 1. FC Köln
  // St. Pauli voltou na 25-26 (promovido) e foi rebaixado ao final dela
  {id:'bundesliga',name:'Bundesliga',flag:'🇩🇪',teams:[
    'Bayern München','Borussia Dortmund','RB Leipzig','VfB Stuttgart','Hoffenheim',
    'Bayer Leverkusen','Freiburg','Eintracht Frankfurt','Augsburg','Mainz',
    'Union Berlin','Mönchengladbach','Hamburger SV','Köln','Werder Bremen',
    'Wolfsburg','Heidenheim','St. Pauli'
  ]},
  // Serie A 2025-26
  // Saíram (rebaixados 24-25): Venezia, Monza, Lecce (foram rebaixados ao fim da 24-25)
  // Entraram (promovidos 24-25): Sassuolo, Como (já estava), Cremonese, Pisa
  // Tabela final: Inter, Napoli, Roma, Como, Milan, Juve, Atalanta, Bologna,
  //               Lazio, Udinese, Sassuolo, Torino, Parma, Cagliari,
  //               Fiorentina, Genoa, Lecce, Cremonese, Hellas Verona, Pisa
  {id:'seriea',name:'Serie A',flag:'🇮🇹',teams:[
    'Inter','Napoli','Roma','Como','Milan',
    'Juventus','Atalanta','Bologna','Lazio','Udinese',
    'Sassuolo','Torino','Parma','Cagliari','Fiorentina',
    'Genoa','Lecce','Cremonese','Hellas Verona','Pisa'
  ]},
  // Ligue 1 2025-26 (18 clubes)
  // Saíram (rebaixados 24-25): Montpellier, Saint-Étienne, Angers
  // Entraram (promovidos 24-25): Lorient, Paris FC, Metz
  // Nizza era duplicata de Nice — removida; Metz promovido entra
  {id:'ligue1',name:'Ligue 1',flag:'🇫🇷',teams:[
    'PSG','Lens','Lille','Lyon','Marseille',
    'Monaco','Strasbourg','Rennes','Toulouse','Lorient',
    'Paris FC','Brest','Angers','Le Havre','Auxerre',
    'Nice','Nantes','Metz'
  ]},
  // Eredivisie 2025-26 (18 clubes)
  // Saíram (rebaixados/play-off 24-25): Almere City, RKC Waalwijk, Willem II
  // Entraram: Volendam, Excelsior, Telstar
  {id:'eredivisie',name:'Eredivisie',flag:'🇳🇱',teams:[
    'PSV','Feyenoord','NEC Nijmegen','AZ','Twente',
    'FC Utrecht','Go Ahead Eagles','Heerenveen','Ajax','Sparta Rotterdam',
    'Heracles','PEC Zwolle','Fortuna Sittard','NAC Breda','Groningen',
    'Volendam','Excelsior','Telstar'
  ]},
  // Liga Portugal 2025-26 (18 clubes)
  // Saíram (rebaixados 24-25): Farense, Portimonense, Boavista
  // Entraram (promovidos 24-25): Alverca, Tondela, AVS
  {id:'portugal',name:'Liga Portugal',flag:'🇵🇹',teams:[
    'Porto','Sporting','Benfica','Braga','Famalicão',
    'Gil Vicente','Moreirense','Arouca','Vitória SC','Estoril',
    'Alverca','Rio Ave','Santa Clara','Nacional','Estrela Amadora',
    'Casa Pia','Tondela','AVS'
  ]},
  {id:'mundial2026',name:'Mundial 2026',flag:'🌍',teams:[
    // Anfitriãs
    'Estados Unidos','México','Canadá',
    // UEFA
    'Espanha','França','Inglaterra','Alemanha','Portugal','Países Baixos',
    'Itália','Argentina','Brasil','Bélgica','Croácia','Suíça','Noruega',
    'Áustria','Escócia','Turquia','Tchéquia','Suécia','Bósnia',
    // CONMEBOL
    'Uruguai','Colômbia','Equador','Paraguai',
    // AFC
    'Japão','Coreia do Sul','Irã','Austrália','Arábia Saudita','Catar','Jordânia','Uzbequistão',
    // CAF
    'Marrocos','Egito','Argélia','Gana','Tunísia','Senegal','África do Sul',
    'República Democrática do Congo','Camarões','Costa do Marfim',
    // CONCACAF (excluindo anfitriãs)
    'Jamaica','Panamá','Honduras',
    // OFC
    'Nova Zelândia'
  ]},
  {id:'selecoes',name:'Seleções Clássicas',flag:'⭐',teams:[
    'Brasil','Argentina','França','Alemanha','Espanha','Portugal','Inglaterra',
    'Itália','Países Baixos','Bélgica','Uruguai','Colômbia','Croácia',
    'Marrocos','Japão','Coreia do Sul','México','Senegal','Dinamarca','Polônia'
  ]},
];
const EMOJIS={
  // Premier League 2025-26
  'Arsenal':'❤️','Aston Villa':'💜','Bournemouth':'❤️','Brentford':'🔴','Brighton':'💙',
  'Burnley':'🔵','Chelsea':'💙','Crystal Palace':'🔵','Everton':'💙','Fulham':'⬛',
  'Leeds United':'🤍','Liverpool':'❤️','Manchester City':'🩵','Manchester United':'❤️',
  'Newcastle':'⬛','Nottingham Forest':'🔴','Sunderland':'🔴','Tottenham':'🤍',
  'West Ham':'🩵','Wolverhampton':'🟠',
  // La Liga 2025-26
  'Barcelona':'🔵','Real Madrid':'🤍','Villarreal':'💛','Atlético Madrid':'❤️','Betis':'💚',
  'Celta Vigo':'🩵','Getafe':'💙','Rayo Vallecano':'🔴','Valencia':'🦇','Real Sociedad':'🔵',
  'Espanyol':'🔵','Athletic Club':'❤️','Sevilla':'🤍','Alavés':'💙','Elche':'💚',
  'Levante':'🔵','Osasuna':'❤️','Mallorca':'🔴','Girona':'🔴','Real Oviedo':'💙',
  // Bundesliga 2025-26
  'Bayern München':'🔴','Borussia Dortmund':'💛','RB Leipzig':'🔴','VfB Stuttgart':'🔴','Hoffenheim':'💙',
  'Bayer Leverkusen':'🔴','Freiburg':'🔴','Eintracht Frankfurt':'⚫','Augsburg':'🔴','Mainz':'🔴',
  'Union Berlin':'🔴','Mönchengladbach':'🟢','Hamburger SV':'🔵','Köln':'⚫','Werder Bremen':'💚',
  'Wolfsburg':'💚','Heidenheim':'🔴','St. Pauli':'🟤',
  // Serie A 2025-26
  'Inter':'🔵','Napoli':'💙','Roma':'🟡','Como':'🔵','Milan':'🔴',
  'Juventus':'🖤','Atalanta':'🖤','Bologna':'🔴','Lazio':'🩵','Udinese':'⬛',
  'Sassuolo':'💚','Torino':'🟤','Parma':'💛','Cagliari':'🔴','Fiorentina':'💜',
  'Genoa':'🔴','Lecce':'🟡','Cremonese':'🔴','Hellas Verona':'💙','Pisa':'🔵',
  // Ligue 1 2025-26
  'PSG':'🔵','Lens':'🟡','Lille':'🔴','Lyon':'🔴','Marseille':'🤍',
  'Monaco':'🔴','Strasbourg':'🔵','Rennes':'🔴','Toulouse':'💜','Lorient':'🟠',
  'Paris FC':'💙','Brest':'🔴','Angers':'⬛','Le Havre':'💙','Auxerre':'🤍',
  'Nice':'🔴','Nantes':'💛','Metz':'🟣',
  // Eredivisie 2025-26
  'PSV':'❤️','Feyenoord':'❤️','NEC Nijmegen':'🔴','AZ':'🔴','Twente':'🔴',
  'FC Utrecht':'🔴','Go Ahead Eagles':'💛','Heerenveen':'💙','Ajax':'🔴','Sparta Rotterdam':'🔴',
  'Heracles':'🔴','PEC Zwolle':'💙','Fortuna Sittard':'💛','NAC Breda':'🔴','Groningen':'💚',
  'Volendam':'🟠','Excelsior':'🔴','Telstar':'🤍',
  // Liga Portugal 2025-26
  'Porto':'💙','Sporting':'💚','Benfica':'🔴','Braga':'🔴','Famalicão':'💙',
  'Gil Vicente':'⬛','Moreirense':'💚','Arouca':'💛','Vitória SC':'🖤','Estoril':'💛',
  'Alverca':'🔴','Rio Ave':'💚','Santa Clara':'🔴','Nacional':'🖤','Estrela Amadora':'🔴',
  'Casa Pia':'🔵','Tondela':'🔴','AVS':'🔵',
  // Seleções Nacionais
  'Brasil':'💛','Argentina':'💙','França':'💙','Alemanha':'🖤','Espanha':'🔴',
  'Portugal':'🔴','Inglaterra':'🤍','Itália':'💙','Países Baixos':'🟠','Bélgica':'🔴',
  'Uruguai':'💙','Colômbia':'💛','Croácia':'🔴','Marrocos':'🔴','Japão':'🔴',
  'Coreia do Sul':'🔴','Escócia':'💙','Suíça':'🔴','Noruega':'🔴','Áustria':'🔴',
  'México':'🟢','Canadá':'🔴','Estados Unidos':'🔴','Turquia':'🔴','Tchéquia':'🔴',
  'Suécia':'💛','Bósnia':'💙','Equador':'💛','Paraguai':'🔴',
  'Irã':'💚','Austrália':'💛','Arábia Saudita':'💚','Catar':'🟤','Jordânia':'🔴','Uzbequistão':'💙',
  'Egito':'🔴','Argélia':'🟢','Gana':'🖤','Tunísia':'🔴','Senegal':'💚',
  'África do Sul':'🟡','República Democrática do Congo':'💙','Camarões':'🟢','Costa do Marfim':'🟠',
  'Jamaica':'🟡','Panamá':'🔴','Honduras':'💙','Nova Zelândia':'🖤','Polônia':'🤍','Dinamarca':'🔴',
};
function emo(t){return EMOJIS[t]||'🛡️'}

// ═══════════════════════════════════════════════
// PERSISTÊNCIA — localStorage
// ═══════════════════════════════════════════════
const STORAGE_KEY = 'sorte_ar_state_v1';

function saveState() {
  try {
    const s = __collectState(); // já serializa selectedLeagues como array
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch(e) {
    console.warn('Não foi possível salvar o estado:', e);
  }
  // Fire-and-forget API save when logged in (Req 4.4)
  if (typeof saveStateToAPI === 'function' && typeof getAccessToken === 'function') {
    saveStateToAPI().catch(() => {}); // errors handled inside saveStateToAPI
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch(e) {
    console.warn('Não foi possível carregar o estado:', e);
    return null;
  }
}

function clearSavedState() {
  localStorage.removeItem(STORAGE_KEY);
}

// ═══════════════════════════════════════════════
// MAPA DE CALLBACKS — substitui eval()
// ═══════════════════════════════════════════════
// Armazena funções de save indexadas por panelId para evitar eval().
const SCORER_SAVE_CBS = {};

function registerScorerCb(panelId, fn) {
  SCORER_SAVE_CBS[panelId] = fn;
}

function callScorerCb(panelId) {
  if (typeof SCORER_SAVE_CBS[panelId] === 'function') {
    SCORER_SAVE_CBS[panelId]();
  }
}

// ═══════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════
let players=[], manualTeams=[], selectedLeagues=new Set();
let drawnPairs=[]; // [{player, team}]
let tournament={
  format:'groups-knockout', // 'groups-knockout' | 'groups' | 'knockout'
  numGroups:4,
  qualifyPerGroup:2,
  groups:[], // [{name, pairs:[{player,team}], matches:[{a,b,scoreA,scoreB,done}]}]
  knockoutRounds:[], // [{name, matches:[{teamA,playerA,teamB,playerB,scoreA,scoreB,done}]}]
  champion:null
};

// ═══════════════════════════════════════════════
// STEPPER
// ═══════════════════════════════════════════════
const STEPS=[
  {id:'players',label:'Jogadores'},
  {id:'teams',label:'Times'},
  {id:'draw',label:'Sorteio'},
  {id:'tournament-setup',label:'Campeonato'},
  {id:'groups',label:'Grupos'},
  {id:'knockout',label:'Mata-mata'},
  {id:'champion',label:'Campeão'},
];
let currentPage='players';

function renderStepper(){
  const pages=['players','teams','draw','tournament-setup','groups','knockout','champion'];
  const usePages=tournament.format==='groups'
    ?['players','teams','draw','tournament-setup','groups-only','champion']
    :tournament.format==='knockout'
    ?['players','teams','draw','tournament-setup','knockout','champion']
    :tournament.format==='league'
    ?['players','teams','draw','tournament-setup','league','champion']
    :pages;
  const labels={players:'Jogadores',teams:'Times',draw:'Sorteio','tournament-setup':'Torneio',groups:'Grupos','groups-only':'Grupos',knockout:'Mata-mata',champion:'Campeão',league:'Liga'};
  const visPages=usePages;
  const visIdx=visPages.indexOf(currentPage);
  const s=document.getElementById('stepper');
  s.innerHTML=visPages.map((p,i)=>{
    const done=i<visIdx, active=i===visIdx;
    return `
      ${i>0?`<div class="step-line ${i<=visIdx?'done':''}"></div>`:''}
      <div class="step">
        <div class="step-dot ${done?'done':active?'active':''}">${done?'✓':i+1}</div>
        <span class="step-label ${done?'done':active?'active':''}">${labels[p]}</span>
      </div>`;
  }).join('');
}

function goToPage(name){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const el=document.getElementById('page-'+name);
  if(el) el.classList.add('active');
  currentPage=name;
  renderStepper();
  if(name==='teams' && teamMode==='custom') renderCustomTeamsList();
  window.scrollTo({top:0,behavior:'smooth'});
  saveState();
}

// ═══════════════════════════════════════════════
// PLAYERS + POTS
// ═══════════════════════════════════════════════
// players = [{name, pot}]  (pot = 'A'|'B'|'C'|'D' or null when pots off)
const POT_LETTERS = ['A','B','C','D'];
const POT_COLORS  = {A:'pot-A',B:'pot-B',C:'pot-C',D:'pot-D'};
let potsMode = false;
let activePots = ['A','B']; // which pots currently exist

function togglePotsMode(){
  potsMode = !potsMode;
  const track = document.getElementById('pots-toggle-track');
  track.classList.toggle('on', potsMode);
  document.getElementById('pot-select-wrap').style.display = potsMode ? '' : 'none';
  document.getElementById('pots-hint').style.display = potsMode ? '' : 'none';
  const mgmt = document.getElementById('pots-manage-btns');
  mgmt.style.display = potsMode ? 'flex' : 'none';
  renderPlayers();
}

function addPot(){
  const next = POT_LETTERS.find(l => !activePots.includes(l));
  if(!next) return;
  activePots.push(next);
  // update select options
  updatePotSelect();
  renderPlayers();
}

function removeLastPot(){
  if(activePots.length <= 1) return;
  const removed = activePots[activePots.length-1];
  // move players in removed pot to the previous pot
  const prev = activePots[activePots.length-2];
  players.forEach(p => { if(p.pot === removed) p.pot = prev; });
  activePots.pop();
  updatePotSelect();
  renderPlayers();
}

function updatePotSelect(){
  const sel = document.getElementById('player-pot-select');
  const cur = sel.value;
  sel.innerHTML = activePots.map(l=>`<option value="${l}">Pote ${l}</option>`).join('');
  if(activePots.includes(cur)) sel.value = cur;
}

function addPlayer(){
  const inp = document.getElementById('player-input');
  const n = inp.value.trim();
  if(!n || players.some(p=>p.name===n)){ inp.value=''; return; }
  const pot = potsMode ? document.getElementById('player-pot-select').value : null;
  players.push({name:n, pot});
  inp.value='';
  renderPlayers();
  saveState();
  inp.focus();
}

function removePlayer(i){ players.splice(i,1); renderPlayers(); saveState(); }
function clearPlayers(){ players=[]; renderPlayers(); saveState(); }

function changePlayerPot(i, pot){
  players[i].pot = pot;
  renderPlayers();
}

function renderPlayers(){
  const n = players.length;
  document.getElementById('player-count').textContent =
    `${n} jogador${n!==1?'es':''} adicionado${n!==1?'s':''}`;

  if(!potsMode){
    document.getElementById('player-list-flat').style.display = '';
    document.getElementById('player-list-pots').style.display = 'none';
    const list = document.getElementById('player-list');
    list.innerHTML = n===0
      ? '<span class="empty-hint">Nenhum jogador ainda…</span>'
      : players.map((p,i)=>`<span class="tag">${p.name}<button class="tag-remove" onclick="removePlayer(${i})">×</button></span>`).join('');
    return;
  }

  // Pots mode
  document.getElementById('player-list-flat').style.display = 'none';
  document.getElementById('player-list-pots').style.display = '';
  const container = document.getElementById('player-list-pots');
  if(n===0){
    container.innerHTML = '<div class="tag-list"><span class="empty-hint">Nenhum jogador ainda…</span></div>';
    return;
  }
  container.innerHTML = activePots.map(pot => {
    const potPlayers = players.map((p,i)=>({...p,i})).filter(p=>p.pot===pot);
    return `
    <div class="pot-section">
      <div class="pot-section-header">
        <span class="pot-badge pot-badge-${pot}">${pot}</span>
        <span class="pot-label">Pote ${pot}</span>
        <span class="pot-count">${potPlayers.length} jogador${potPlayers.length!==1?'es':''}</span>
      </div>
      <div class="tag-list" style="min-height:36px">
        ${potPlayers.length===0
          ? '<span class="empty-hint">Vazio</span>'
          : potPlayers.map(p=>`
            <span class="tag pot-${pot}" style="display:flex;align-items:center;gap:5px">
              <span class="pot-dot pot-dot-${pot}"></span>
              ${p.name}
              <select class="pot-inline-select" onchange="changePlayerPot(${p.i},this.value)" title="Mover para outro pote">
                ${activePots.map(l=>`<option value="${l}" ${l===pot?'selected':''}>${l}</option>`).join('')}
              </select>
              <button class="tag-remove" onclick="removePlayer(${p.i})">×</button>
            </span>`).join('')}
      </div>
    </div>`;
  }).join('');
}


// ═══════════════════════════════════════════════
// TEAM MODE
// ═══════════════════════════════════════════════
let teamMode = 'league'; // 'league' | 'pool' | 'custom'
let poolTeams = [];
let customTeamMap = {}; // { playerName: teamName }

function setTeamMode(mode) {
  teamMode = mode;
  ['league','pool','custom'].forEach(m => {
    document.getElementById('mode-'+m).style.display = m === mode ? 'block' : 'none';
    document.getElementById('mode-btn-'+m).classList.toggle('active', m === mode);
  });
  if (mode === 'custom') renderCustomTeamsList();
}

function renderCustomTeamsList() {
  const container = document.getElementById('custom-teams-list');
  const empty = document.getElementById('custom-teams-empty');
  if (players.length === 0) {
    container.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  container.innerHTML = players.map(p => {
    const key = p.name;
    const val = customTeamMap[key] || '';
    const potBadge = potsMode && p.pot ? `<span class="pot-badge pot-badge-${p.pot}" style="margin-right:4px">${p.pot}</span>` : '';
    return `<div class="custom-team-row">
      <span class="custom-player-label">${potBadge}👤 ${p.name}</span>
      <input class="custom-team-input" type="text" placeholder="Nome do time..." value="${val}"
        oninput="customTeamMap['${key}']=this.value.trim(); updateCustomOk(this)"
        onkeydown="if(event.key==='Enter')this.closest('.custom-team-row').nextElementSibling?.querySelector('input')?.focus()"
      />
      <span class="custom-team-ok ${val ? 'visible' : ''}">✓</span>
    </div>`;
  }).join('');
}

function updateCustomOk(input) {
  const ok = input.closest('.custom-team-row').querySelector('.custom-team-ok');
  ok.classList.toggle('visible', input.value.trim().length > 0);
}

function addPoolTeam() {
  const inp = document.getElementById('pool-team-input');
  const n = inp.value.trim();
  if (!n || poolTeams.includes(n)) { inp.value = ''; return; }
  poolTeams.push(n);
  inp.value = '';
  renderPoolTeams();
  inp.focus();
}

function removePoolTeam(i) {
  poolTeams.splice(i, 1);
  renderPoolTeams();
}

function renderPoolTeams() {
  const list = document.getElementById('pool-team-list');
  list.innerHTML = poolTeams.length === 0
    ? '<span class="empty-hint">Nenhum time na lista</span>'
    : poolTeams.map((t,i) => `<span class="tag">${t}<button class="tag-remove" onclick="removePoolTeam(${i})">×</button></span>`).join('');
  const c = document.getElementById('pool-count');
  c.textContent = `${poolTeams.length} time${poolTeams.length !== 1 ? 's' : ''} · ${players.length} jogador${players.length !== 1 ? 'es' : ''}`;
}

// ═══════════════════════════════════════════════
// TEAMS
// ═══════════════════════════════════════════════
function renderLeagues(){
  document.getElementById('leagues-grid').innerHTML=LEAGUES.map(l=>`
    <div class="league-card ${selectedLeagues.has(l.id)?'selected':''}" onclick="toggleLeague('${l.id}')">
      <span class="league-flag">${l.flag}</span>
      <div class="league-info"><div class="league-name">${l.name}</div><div class="league-count">${l.teams.length} times</div></div>
      <span class="league-check">✓</span>
    </div>`).join('');
  updateTeamSummary();
}
function toggleLeague(id){selectedLeagues.has(id)?selectedLeagues.delete(id):selectedLeagues.add(id);renderLeagues();}
function getAllTeams(){
  let arr=[];
  LEAGUES.forEach(l=>{if(selectedLeagues.has(l.id))arr=arr.concat(l.teams);});
  return [...new Set([...arr,...manualTeams])];
}
function updateTeamSummary(){
  const all=getAllTeams();
  document.getElementById('team-total').textContent=all.length;
  const chips=document.getElementById('team-chips');
  chips.innerHTML=all.length===0
    ?'<span style="font-size:13px;color:var(--text3)">Selecione ligas ou adicione times acima</span>'
    :all.map(t=>`<span class="team-chip">${emo(t)} ${t}</span>`).join('');
}
function addManualTeam(){
  const inp=document.getElementById('team-input');
  const n=inp.value.trim();
  if(!n||manualTeams.includes(n)){inp.value='';return;}
  manualTeams.push(n);inp.value='';renderManualTeams();updateTeamSummary();inp.focus();
}
function removeManualTeam(i){manualTeams.splice(i,1);renderManualTeams();updateTeamSummary();}
function renderManualTeams(){
  const list=document.getElementById('manual-team-list');
  list.innerHTML=manualTeams.length===0
    ?'<span class="empty-hint">Nenhum time manual</span>'
    :manualTeams.map((t,i)=>`<span class="tag">${t}<button class="tag-remove" onclick="removeManualTeam(${i})">×</button></span>`).join('');
}

// ═══════════════════════════════════════════════
// DRAW
// ═══════════════════════════════════════════════
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function runDraw(){
  if(players.length===0){alert('Adicione pelo menos um jogador!');return;}
  const playerNames = players.map(p=>p.name);

  // MODE: custom — one team per player, fixed assignment (no shuffle of teams)
  if(teamMode==='custom'){
    const missing=players.filter(p=>!customTeamMap[p.name]||!customTeamMap[p.name].trim());
    if(missing.length>0){alert('Defina o time de todos os jogadores antes de sortear!\nFaltando: '+missing.map(p=>p.name).join(', '));return;}
    // Monta os pares mantendo o time de cada jogador — sem embaralhar times
    // Apenas ordena a exibição (por pote, se ativo)
    const sp = potsMode ? shuffleWithinPots(players) : shuffle(players);
    drawnPairs=sp.map(p=>({player:p.name,team:customTeamMap[p.name].trim(),pot:p.pot}));
    renderDrawResults();
    goToPage('draw');
    return;
  }

  // MODE: pool — free list of teams
  if(teamMode==='pool'){
    if(poolTeams.length===0){alert('Adicione pelo menos um time na lista!');return;}
    if(poolTeams.length<players.length){alert(`Você tem ${players.length} jogadores mas apenas ${poolTeams.length} time(s). Adicione mais times!`);return;}
    const sp = potsMode ? shuffleWithinPots(players) : shuffle(players);
    const st=shuffle(poolTeams);
    drawnPairs=sp.map((p,i)=>({player:p.name,team:st[i],pot:p.pot}));
    renderDrawResults();
    goToPage('draw');
    return;
  }

  // MODE: league (default)
  const teams=getAllTeams();
  if(teams.length===0){alert('Selecione pelo menos uma liga ou adicione times!');return;}
  const sp = potsMode ? shuffleWithinPots(players) : shuffle(players);
  const st=shuffle(teams);
  drawnPairs=sp.map((p,i)=>({player:p.name,team:st[i%st.length],pot:p.pot}));
  renderDrawResults();
  goToPage('draw');
}

// Shuffle players but keep pots together in the result list (for display)
function shuffleWithinPots(playerList){
  const result = [];
  activePots.forEach(pot => {
    const inPot = playerList.filter(p=>p.pot===pot);
    result.push(...shuffle(inPot));
  });
  // also include any player with no pot
  result.push(...shuffle(playerList.filter(p=>!p.pot)));
  return result;
}

function renderDrawResults(){
  const grid=document.getElementById('draw-results-grid');
  grid.innerHTML=drawnPairs.map((p,i)=>{
    const potBadge = p.pot ? `<span class="rc-pot-badge pot-badge pot-badge-${p.pot}">${p.pot}</span>` : '';
    return `
    <div class="result-card" style="animation-delay:${i*.05}s">
      <span class="rc-order">#${i+1}</span>
      ${potBadge}
      <span class="rc-shield">${emo(p.team)}</span>
      <span class="rc-team">${p.team}</span>
      <span class="rc-player">${p.player}</span>
    </div>`;
  }).join('');
  
  // Render player-link inputs when logged in (Req 6.1)
  if (typeof renderPlayerLinkInputs === 'function') {
    setTimeout(renderPlayerLinkInputs, 100); // slight delay to let DOM settle
  }
}

// ═══════════════════════════════════════════════
// TOURNAMENT SETUP
// ═══════════════════════════════════════════════
function selectFormat(el){
  document.querySelectorAll('.format-card').forEach(c=>c.classList.remove('selected'));
  el.classList.add('selected');
  tournament.format=el.dataset.fmt;
  const fmt=tournament.format;
  document.getElementById('groups-config').style.display=(fmt==='knockout'||fmt==='league')?'none':'block';
  document.getElementById('knockout-config').style.display=fmt==='knockout'?'block':'none';
  document.getElementById('league-config').style.display=fmt==='league'?'block':'none';
  updateGroupPreview();
}

function updateGroupPreview(){
  const fmt=tournament.format;
  const n=drawnPairs.length;
  if(fmt==='knockout'){
    const rounds=Math.ceil(Math.log2(n));
    document.getElementById('knockout-preview').textContent=
      `⚔️ ${n} jogadores → mata-mata com ${Math.pow(2,rounds)} vagas (bracket de ${rounds} rodadas)`;
    return;
  }
  if(fmt==='league'){
    const legs=parseInt(document.getElementById('cfg-league-legs')?.value)||2;
    const totalMatches=n*(n-1)/2*legs;
    document.getElementById('league-preview').textContent=
      `🥇 ${n} jogadores → ${totalMatches} jogos no total (${legs===2?'ida e volta':'só ida'})`;
    return;
  }
  const ng=parseInt(document.getElementById('cfg-num-groups').value)||4;
  const qpg=parseInt(document.getElementById('cfg-qualify').value)||2;
  const perGroup=Math.ceil(n/ng);
  const total=ng*qpg;
  const potInfo = potsMode && drawnPairs.some(p=>p.pot) ? ` · potes: ${activePots.join(', ')}` : '';
  document.getElementById('group-preview').textContent=
    `📊 ${n} jogadores → ${ng} grupos de ~${perGroup} · ${qpg} classificado${qpg>1?'s':''} por grupo → ${total} no mata-mata${potInfo}`;
}

function buildTournament(){
  const fmt=tournament.format;
  tournament.numGroups=parseInt(document.getElementById('cfg-num-groups')?.value)||4;
  tournament.qualifyPerGroup=parseInt(document.getElementById('cfg-qualify')?.value)||2;
  tournament.leagueLegs=parseInt(document.getElementById('cfg-league-legs')?.value)||2;
  // 3º lugar: válido só para knockout / groups-knockout
  var _tp1=document.getElementById('cfg-third-place');
  var _tp2=document.getElementById('cfg-third-place-ko');
  tournament.thirdPlace = (fmt==='knockout') ? !!(_tp2 && _tp2.checked)
                        : (fmt==='groups-knockout') ? !!(_tp1 && _tp1.checked)
                        : false;
  tournament.format=fmt;

  if(fmt==='league'){
    buildLeague();
    goToPage('league');
  } else if(fmt==='knockout'){
    buildKnockoutFromPairs(drawnPairs);
    goToPage('knockout');
  } else {
    buildGroups();
    if(fmt==='groups') goToPage('groups-only');
    else goToPage('groups');
  }
}

// ═══════════════════════════════════════════════
// LEAGUE
// ═══════════════════════════════════════════════
// tournament.league = { legs, matches: [{homeIdx, awayIdx, leg, scoreH, scoreA, done}], rounds: [{name, matchIndexes}] }

function buildLeague(){
  const pairs = drawnPairs;
  const legs = tournament.leagueLegs || 2;
  const n = pairs.length;
  const matches = [];
  const rounds = [];

  // Generate round-robin schedule using circle method
  const schedule = roundRobinSchedule(n); // [ [{h,a},...], ... ] rounds of fixtures

  schedule.forEach((round, ri) => {
    const roundMatchIdxs = [];
    round.forEach(({h,a}) => {
      roundMatchIdxs.push(matches.length);
      matches.push({homeIdx:h, awayIdx:a, leg:1, scoreH:'', scoreA:'', done:false});
    });
    rounds.push({name:`${ri+1}ª Rodada`, matchIndexes:roundMatchIdxs});
  });

  if(legs===2){
    // Reverse fixtures for second leg
    schedule.forEach((round, ri) => {
      const roundMatchIdxs = [];
      round.forEach(({h,a}) => {
        roundMatchIdxs.push(matches.length);
        matches.push({homeIdx:a, awayIdx:h, leg:2, scoreH:'', scoreA:'', done:false});
      });
      rounds.push({name:`${schedule.length+ri+1}ª Rodada (Volta)`, matchIndexes:roundMatchIdxs});
    });
  }

  tournament.league = {legs, matches, rounds};
  renderLeaguePage();
}

// Circle algorithm for balanced round-robin
function roundRobinSchedule(n){
  const hasBye = n % 2 !== 0;
  const teams = Array.from({length: hasBye ? n+1 : n}, (_,i)=>i);
  const numRounds = teams.length - 1;
  const matchesPerRound = teams.length / 2;
  const rounds = [];
  for(let r=0; r<numRounds; r++){
    const round = [];
    for(let m=0; m<matchesPerRound; m++){
      const h = teams[m], a = teams[teams.length-1-m];
      if(!hasBye || (h < n && a < n)){
        round.push(r%2===0 ? {h,a} : {h:a,a:h});
      }
    }
    rounds.push(round);
    // rotate all but first
    teams.splice(1,0,teams.pop());
  }
  return rounds;
}

function calcLeagueStandings(){
  const pairs = drawnPairs;
  const stats = pairs.map((p,i)=>({
    idx:i, player:p.player, team:p.team, pot:p.pot,
    j:0, v:0, e:0, d:0, gp:0, gc:0, pts:0
  }));
  tournament.league.matches.forEach(m=>{
    if(!m.done) return;
    const h=stats[m.homeIdx], a=stats[m.awayIdx];
    const gh=parseInt(m.scoreH), ga=parseInt(m.scoreA);
    h.j++; a.j++;
    h.gp+=gh; h.gc+=ga; a.gp+=ga; a.gc+=gh;
    if(gh>ga){ h.v++; h.pts+=3; a.d++; }
    else if(gh<ga){ a.v++; a.pts+=3; h.d++; }
    else { h.e++; a.e++; h.pts+=1; a.pts+=1; }
  });

  // Desempate: pts | saldo geral | gols | confronto direto | alfabético
  function directH2H(a, b){
    let ptsA=0,ptsB=0,sgA=0,gpA=0;
    tournament.league.matches.forEach(m=>{
      if(!m.done) return;
      const gh=parseInt(m.scoreH), ga=parseInt(m.scoreA);
      if(m.homeIdx===a.idx && m.awayIdx===b.idx){
        sgA+=gh-ga; gpA+=gh;
        if(gh>ga){ptsA+=3;} else if(ga>gh){ptsB+=3;} else{ptsA++;ptsB++;}
      } else if(m.homeIdx===b.idx && m.awayIdx===a.idx){
        sgA+=ga-gh; gpA+=ga;
        if(ga>gh){ptsA+=3;} else if(gh>ga){ptsB+=3;} else{ptsA++;ptsB++;}
      }
    });
    if(ptsA!==ptsB) return ptsB-ptsA;
    if(sgA!==0) return -sgA;
    return -gpA;
  }

  stats.sort((a,b)=>{
    if(b.pts!==a.pts) return b.pts-a.pts;
    const sgA=a.gp-a.gc, sgB=b.gp-b.gc;
    if(sgB!==sgA) return sgB-sgA;
    if(b.gp!==a.gp) return b.gp-a.gp;
    const h2h=directH2H(a,b);
    if(h2h!==0) return h2h;
    return a.player.localeCompare(b.player);
  });
  return stats;
}

let leagueActiveTab = 'table';
function switchLeagueTab(tab){
  leagueActiveTab = tab;
  document.getElementById('league-tab-table').classList.toggle('active', tab==='table');
  document.getElementById('league-tab-matches').classList.toggle('active', tab==='matches');
  document.getElementById('league-tab-scorers').classList.toggle('active', tab==='scorers');
  document.getElementById('league-table-view').style.display = tab==='table' ? '' : 'none';
  document.getElementById('league-matches-view').style.display = tab==='matches' ? '' : 'none';
  document.getElementById('league-scorers-view').style.display = tab==='scorers' ? '' : 'none';
}

function renderLeaguePage(){
  renderLeagueTable();
  renderLeagueMatches();
  updateArtilhariaWidgets();
}

function renderLeagueTable(){
  const stats = calcLeagueStandings();
  const totalMatches = tournament.league.matches.length;
  const doneMatches = tournament.league.matches.filter(m=>m.done).length;

  let html = `<div class="league-progress">
    <b>${doneMatches}</b> de <b>${totalMatches}</b> jogos realizados
    ${doneMatches===totalMatches ? ' · <span style="color:var(--accent)">✓ Liga encerrada</span>' : ''}
  </div>`;

  html += `<div class="card" style="padding:0;overflow:hidden">
  <table class="league-table">
    <thead><tr>
      <th>#</th><th>Jogador / Time</th>
      <th title="Jogos">J</th><th title="Vitórias">V</th><th title="Empates">E</th><th title="Derrotas">D</th>
      <th title="Gols pró">GP</th><th title="Gols contra">GC</th><th title="Saldo de gols">SG</th>
      <th title="Pontos">Pts</th>
    </tr></thead><tbody>`;

  stats.forEach((s,i)=>{
    const sg = s.gp - s.gc;
    const rowClass = i===0 ? 'league-1st' : i<3 ? 'league-podium' : '';
    const potDot = s.pot ? `<span class="pot-dot pot-dot-${s.pot}" style="display:inline-block;margin-right:4px"></span>` : '';
    html += `<tr class="${rowClass}">
      <td>${i+1}</td>
      <td>${potDot}<b>${s.player}</b><br><span style="font-size:10px;color:var(--text3)">${emo(s.team)} ${s.team}</span></td>
      <td>${s.j}</td><td>${s.v}</td><td>${s.e}</td><td>${s.d}</td>
      <td>${s.gp}</td><td>${s.gc}</td>
      <td style="color:${sg>0?'var(--green)':sg<0?'var(--red)':'var(--text3)'}">${sg>0?'+':''}${sg}</td>
      <td><b style="color:var(--text);font-size:13px">${s.pts}</b></td>
    </tr>`;
  });
  html += `</tbody></table></div>`;

  if(doneMatches===totalMatches && stats.length>0){
    const champ = stats[0];
    if(!tournament.champion){
      tournament.champion = {team:champ.team, player:champ.player};
      if(window.__autoFinalize) window.__autoFinalize();
    }
    html += `<div class="card" style="text-align:center;padding:1.5rem">
      <div style="font-size:48px;margin-bottom:8px;animation:bounce .7s ease infinite alternate">🏆</div>
      <div style="font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:var(--text3);letter-spacing:.12em;text-transform:uppercase;margin-bottom:6px">Campeão da Liga</div>
      <div style="font-size:28px;margin-bottom:4px">${emo(champ.team)}</div>
      <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:var(--accent)">${champ.team}</div>
      <div style="font-size:15px;color:var(--text2);margin-top:4px">${champ.player}</div>
      <div style="font-size:12px;color:var(--text3);margin-top:8px">${champ.pts} pts · ${champ.v}V ${champ.e}E ${champ.d}D · SG ${champ.gp-champ.gc>0?'+':''}${champ.gp-champ.gc}</div>
    </div>`;
  }

  document.getElementById('league-table-view').innerHTML = html;
}

function renderLeagueMatches(){
  const pairs = drawnPairs;
  const {matches, rounds} = tournament.league;

  let html = '<div class="rounds-grid">';
  rounds.forEach((round, ri) => {
    const roundMatches = round.matchIndexes.map(i=>({...matches[i], globalIdx:i}));
    const doneCnt = roundMatches.filter(m=>m.done).length;
    const allDone = doneCnt === roundMatches.length;
    html += `<div class="round-card ${allDone?'all-done':''}" id="league-round-${ri}">
      <div class="round-header" onclick="toggleRound(${ri})">
        <span class="round-header-title">${round.name}</span>
        <span style="display:flex;align-items:center;gap:10px">
          <span class="round-header-meta">${doneCnt}/${roundMatches.length} jogos</span>
          ${allDone?'<span style="color:var(--accent);font-size:11px;font-weight:600">✓</span>':''}
          <span class="round-header-chevron">›</span>
        </span>
      </div>
      <div class="round-body"><div class="matches-list" style="padding:0 14px 8px">`;

    roundMatches.forEach(m => {
      const h = pairs[m.homeIdx], a = pairs[m.awayIdx];
      if(m.done){
        html += `<div class="match-row" style="flex-direction:column;align-items:stretch">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <div class="match-teams">
              <span class="match-team home" style="display:flex;flex-direction:column;align-items:flex-end;gap:1px">${emo(h.team)} ${h.player}<span style="font-size:10px;color:var(--text3);font-weight:400">${h.team}</span></span>
              <span class="match-vs">${m.scoreH} – ${m.scoreA}</span>
              <span class="match-team away" style="display:flex;flex-direction:column;align-items:flex-start;gap:1px">${emo(a.team)} ${a.player}<span style="font-size:10px;color:var(--text3);font-weight:400">${a.team}</span></span>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0">
              <button class="btn btn-sm" onclick="toggleLeagueGoalsPanel(${m.globalIdx})">⚽ Gols</button>
              <button class="btn btn-sm" onclick="undoLeagueMatch(${m.globalIdx})">✏️</button>
            </div>
          </div>
          ${scorersDisplayLine(m)}
          <div id="lgp-${m.globalIdx}" style="display:none">
            ${renderScorerPanel(m, parseInt(m.scoreH)+parseInt(m.scoreA), ()=>saveLeagueGoals(m.globalIdx), `lgp-${m.globalIdx}`, [{player:h.player,team:h.team},{player:a.player,team:a.team}])}
          </div>
        </div>`;
      } else {
        html += `<div class="match-row">
          <div class="match-teams">
            <span class="match-team home" style="display:flex;flex-direction:column;align-items:flex-end;gap:1px">${emo(h.team)} ${h.player}<span style="font-size:10px;color:var(--text3);font-weight:400">${h.team}</span></span>
            <span class="match-score">
              <input type="number" min="0" max="99" class="score-input" id="lm-${m.globalIdx}-h" placeholder="0"/>
              <span class="score-sep">–</span>
              <input type="number" min="0" max="99" class="score-input" id="lm-${m.globalIdx}-a" placeholder="0"/>
            </span>
            <span class="match-team away" style="display:flex;flex-direction:column;align-items:flex-start;gap:1px">${emo(a.team)} ${a.player}<span style="font-size:10px;color:var(--text3);font-weight:400">${a.team}</span></span>
          </div>
          <button class="btn btn-primary btn-sm btn-confirm" onclick="confirmLeagueMatch(${m.globalIdx})">✓</button>
        </div>`;
      }
    });

    html += `</div></div></div>`;
  });
  html += '</div>';
  document.getElementById('league-matches-view').innerHTML = html;
}

function toggleRound(ri){
  const el = document.getElementById('league-round-'+ri);
  if(el) el.classList.toggle('collapsed');
}

function toggleGroupRound(roundId){
  const el = document.getElementById(roundId);
  if(el) el.classList.toggle('collapsed');
}

function confirmLeagueMatch(idx){
  const m = tournament.league.matches[idx];
  const h = parseInt(document.getElementById(`lm-${idx}-h`).value);
  const a = parseInt(document.getElementById(`lm-${idx}-a`).value);
  if(isNaN(h)||isNaN(a)){alert('Preencha os dois placares!');return;}
  m.scoreH=h; m.scoreA=a; m.done=true;
  saveState();
  renderLeaguePage();
  if(leagueActiveTab==='matches') switchLeagueTab('matches');
}

function undoLeagueMatch(idx){
  const m = tournament.league.matches[idx];
  m.done=false; m.scoreH=''; m.scoreA=''; m.scorers=[];
  saveState();
  renderLeaguePage();
  if(leagueActiveTab==='matches') switchLeagueTab('matches');
}

function toggleLeagueGoalsPanel(idx){
  const panel=document.getElementById(`lgp-${idx}`);
  if(panel){
    const visible = panel.style.display==='none';
    panel.style.display = visible ? 'block' : 'none';
    if(visible) updateScorerHint(`lgp-${idx}`);
  }
}

function saveLeagueGoals(idx){
  const m = tournament.league.matches[idx];
  m.scorers = readScorerRows(`lgp-${idx}`);
  saveState();
  renderLeaguePage();
  if(leagueActiveTab==='matches') switchLeagueTab('matches');
}

// ═══════════════════════════════════════════════
// SCORERS / ARTILHARIA
// ═══════════════════════════════════════════════

// Retorna [{player, team, goals}] ordenado por gols desc
function calcAllScorers(){
  const map = {};
  function addGoals(player, goals, team){
    if(!player || !goals || goals <= 0) return;
    if(!map[player]) map[player] = {player, team: team||'', goals:0};
    if(team && !map[player].team) map[player].team = team;
    map[player].goals += goals;
  }

  // Monta um dicionário player→team a partir dos drawnPairs para enriquecer os dados
  const playerTeamMap = {};
  drawnPairs.forEach(p => { playerTeamMap[p.player] = p.team; });

  // Grupos
  tournament.groups.forEach(g=>{
    g.matches.forEach(m=>{
      if(!m.done || !m.scorers) return;
      m.scorers.forEach(s=>addGoals(s.player, s.goals, playerTeamMap[s.player]));
    });
  });

  // Liga
  if(tournament.league){
    tournament.league.matches.forEach(m=>{
      if(!m.done || !m.scorers) return;
      m.scorers.forEach(s=>addGoals(s.player, s.goals, playerTeamMap[s.player]));
    });
  }

  // Mata-mata
  tournament.knockoutRounds.forEach(r=>{
    r.matches.forEach(m=>{
      if(!m.done || !m.scorers) return;
      m.scorers.forEach(s=>addGoals(s.player, s.goals, playerTeamMap[s.player]));
    });
  });

  // 3º lugar
  if(tournament.thirdPlaceMatch && tournament.thirdPlaceMatch.done && tournament.thirdPlaceMatch.scorers){
    tournament.thirdPlaceMatch.scorers.forEach(s=>addGoals(s.player, s.goals, playerTeamMap[s.player]));
  }
  return Object.values(map).sort((a,b)=>b.goals-a.goals||a.player.localeCompare(b.player));
}

function renderArtilhariaTable(scorers){
  if(!scorers.length) return `<div style="padding:14px 16px;font-size:12px;color:var(--text3)">Nenhum gol registrado ainda.</div>`;
  const medals=['🥇','🥈','🥉'];
  let html=`<table class="scorers-table">
    <thead><tr><th>#</th><th>Jogador / Time</th><th>⚽</th></tr></thead><tbody>`;
  scorers.forEach((s,i)=>{
    const medal = i<3 ? `<span style="margin-right:4px">${medals[i]}</span>` : `<span class="pos-badge" style="margin-right:4px">${i+1}</span>`;
    const rowStyle = i===0?'color:var(--gold)': i===1?'color:#b0b0bc': i===2?'color:#c8843c':'';
    html+=`<tr>
      <td style="${rowStyle}">${medal}</td>
      <td style="${rowStyle}"><b>${s.player}</b><br><span style="font-size:10px;color:var(--text3)">${emo(s.team)} ${s.team}</span></td>
      <td style="font-size:15px;font-weight:700;${rowStyle}">${s.goals}</td>
    </tr>`;
  });
  html+=`</tbody></table>`;
  return html;
}

function updateArtilhariaWidgets(){
  const scorers = calcAllScorers();
  const html = renderArtilhariaTable(scorers);

  // Grupos
  const ga = document.getElementById('groups-artilharia-body');
  const gac = document.getElementById('groups-artilharia-card');
  if(ga){ ga.innerHTML=html; if(gac) gac.style.display=scorers.length?'':'none'; }

  // Só grupos
  const goa = document.getElementById('groups-only-artilharia-body');
  const goac = document.getElementById('groups-only-artilharia-card');
  if(goa){ goa.innerHTML=html; if(goac) goac.style.display=scorers.length?'':'none'; }

  // Mata-mata
  const ka = document.getElementById('knockout-artilharia-body');
  const kac = document.getElementById('knockout-artilharia-card');
  if(ka){ ka.innerHTML=html; if(kac) kac.style.display=scorers.length?'':'none'; }

  // Liga (aba separada)
  const lsv = document.getElementById('league-scorers-view');
  if(lsv){
    lsv.innerHTML=`<div class="artilharia-card"><div style="padding:12px 16px;border-bottom:1px solid var(--border)">
      <span style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--text);letter-spacing:.04em;text-transform:uppercase">⚽ Artilharia</span>
    </div>${html}</div>`;
  }
}

// Renderiza o painel de gols com linhas dinâmicas (nome manual + quantidade)
// panelId: id único do painel; scorerTotal: total de gols esperado
// matchPlayers: [{player, team}] — os dois jogadores da partida (para select de time)
function renderScorerPanel(matchRef, scorerTotal, saveCallback, panelId, matchPlayers){
  const saved = matchRef.scorers || [];
  const entries = saved.length ? saved.map(s=>({name:s.player, goals:s.goals, team:s.team||''})) : [{name:'',goals:1,team:''}];
  const mp = matchPlayers || [];

  // Registra a callback no mapa para evitar eval()
  if(typeof saveCallback === 'function') {
    registerScorerCb(panelId, saveCallback);
  }
  // Compatibilidade: saveCallback pode ser string (legado) ou função
  const cbKey = panelId;

  function makeTeamSelect(selectedTeam, rowIdx){
    if(!mp.length) return '';
    const opts = mp.map(p=>`<option value="${p.team}" ${selectedTeam===p.team?'selected':''}>${p.player} (${p.team})</option>`).join('') +
      `<option value="" ${!selectedTeam?'selected':''}>— Outro —</option>`;
    return `<select class="scorer-team-select" id="${panelId}-t-${rowIdx}" data-panel="${panelId}" style="flex:0 0 auto;width:auto;max-width:140px;font-size:11px;padding:5px 7px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface2);color:var(--text);font-family:'DM Mono',monospace;outline:none;cursor:pointer">${opts}</select>`;
  }

  function escVal(s){ return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;'); }
  function makeRow(e, i){
    return `<div class="scorer-entry-row" id="${panelId}-row-${i}" style="flex-wrap:nowrap;gap:6px;align-items:center">
      <input type="text" class="scorer-entry-name" id="${panelId}-n-${i}" placeholder="Nome..." value="${escVal(e.name)}" autocomplete="off" data-panel="${panelId}" style="min-width:80px;flex:1"/>
      ${makeTeamSelect(e.team||'', i)}
      <input type="number" class="scorer-goals-input" id="${panelId}-g-${i}" min="1" value="${e.goals||1}" placeholder="1" data-panel="${panelId}"/>
      <button class="scorer-remove-btn" data-panel="${panelId}" data-row="${i}" title="Remover linha">×</button>
    </div>`;
  }

  const rows = entries.map((e,i)=>makeRow(e,i)).join('');
  // Calcula total atual dos campos (não só dos dados salvos, para o hint ser correto na abertura)
  const currentTotal = entries.reduce((a,e)=>a+(parseInt(e.goals)||1),0);
  const hintInfo = buildHintInfo(currentTotal, scorerTotal);
  const mpEncoded = mp.length ? encodeURIComponent(JSON.stringify(mp)) : '';

  return `
  <div class="scorers-panel" id="${panelId}">
    <div class="scorers-panel-title">⚽ Artilheiros da partida</div>
    <div id="${panelId}-rows">${rows}</div>
    <button class="scorers-add-btn" data-addpanel="${panelId}" data-mp="${mpEncoded}">+ Adicionar jogador</button>
    <div class="scorers-total-hint ${hintInfo.cls}" id="${panelId}-hint">${hintInfo.html}</div>
    <div style="margin-top:10px;display:flex;gap:8px;align-items:center">
      <button class="btn btn-primary btn-sm" data-savecb="${cbKey}" data-total="${scorerTotal}" id="${panelId}-savebtn" ${hintInfo.block?"disabled style='opacity:.35;cursor:not-allowed'":""}>Salvar</button>
      <button class="btn btn-sm" data-closepanel="${panelId}">Fechar</button>
    </div>
  </div>`;
}

function buildHintInfo(current, total){
  if(current === 0)  return {cls:'', html:`Esperado: <span class="hint-count">${total}</span> gol${total!==1?'s':''}  ·  Distribuído: <span class="hint-count">0</span>`, block:true};
  if(current < total) return {cls:'warn', html:`Esperado: <span class="hint-count">${total}</span>  ·  Distribuído: <span class="hint-count">${current}</span> — faltam ${total-current}`, block:true};
  if(current > total) return {cls:'warn', html:`Esperado: <span class="hint-count">${total}</span>  ·  Distribuído: <span class="hint-count">${current}</span> — ${current-total} a mais`, block:true};
  return {cls:'ok', html:`✓ <span class="hint-count">${current}</span> de <span class="hint-count">${total}</span> gol${total!==1?'s':''} distribuídos`, block:false};
}

// Atualiza o hint e o estado do botão Salvar em tempo real
function updateScorerHint(panelId){
  const hintEl = document.getElementById(`${panelId}-hint`);
  const saveBtn = document.getElementById(`${panelId}-savebtn`);
  if(!hintEl || !saveBtn) return;
  const total = parseInt(saveBtn.dataset.total)||0;
  const rows = document.getElementById(`${panelId}-rows`);
  if(!rows) return;
  let current = 0;
  rows.querySelectorAll('.scorer-goals-input').forEach(inp=>{
    current += parseInt(inp.value)||0;
  });
  const info = buildHintInfo(current, total);
  hintEl.className = `scorers-total-hint ${info.cls}`;
  hintEl.innerHTML = info.html;
  saveBtn.disabled = info.block;
  saveBtn.style.opacity = info.block ? '.35' : '1';
  saveBtn.style.cursor  = info.block ? 'not-allowed' : '';
}

// Delegação de eventos para os botões do painel (× remover, + adicionar, salvar, fechar)
document.addEventListener('click', function(e){
  // Remover linha
  const removeBtn = e.target.closest('[data-panel][data-row]');
  if(removeBtn){
    const panelId = removeBtn.dataset.panel;
    const row = document.getElementById(`${panelId}-row-${removeBtn.dataset.row}`);
    if(row) row.remove();
    updateScorerHint(panelId);
    return;
  }
  // Adicionar linha
  const addBtn = e.target.closest('[data-addpanel]');
  if(addBtn){
    addScorerRow(addBtn.dataset.addpanel);
    return;
  }
  // Fechar painel
  const closeBtn = e.target.closest('[data-closepanel]');
  if(closeBtn){
    const panel = document.getElementById(closeBtn.dataset.closepanel);
    if(panel) panel.style.display='none';
    return;
  }
  // Salvar — usa mapa de callbacks em vez de eval()
  const saveBtn = e.target.closest('[data-savecb]');
  if(saveBtn && !saveBtn.disabled){
    callScorerCb(saveBtn.dataset.savecb);
    return;
  }
});

// Atualiza hint em tempo real ao digitar nos campos de gols
document.addEventListener('input', function(e){
  const goalsInput = e.target.closest('.scorer-goals-input');
  if(goalsInput && goalsInput.dataset.panel){
    updateScorerHint(goalsInput.dataset.panel);
  }
});

// Adiciona uma nova linha vazia no painel
function addScorerRow(panelId, mpEncoded){
  const container = document.getElementById(panelId+'-rows');
  if(!container) return;
  const i = container.children.length;
  // Tenta obter matchPlayers do botão de adicionar
  if(!mpEncoded){
    const addBtn = document.querySelector(`[data-addpanel="${panelId}"]`);
    mpEncoded = addBtn ? addBtn.dataset.mp : '';
  }
  let mp = [];
  try{ if(mpEncoded) mp = JSON.parse(decodeURIComponent(mpEncoded)); } catch(e){}
  const teamSel = mp.length ? `<select class="scorer-team-select" id="${panelId}-t-${i}" data-panel="${panelId}" style="flex:0 0 auto;width:auto;max-width:140px;font-size:11px;padding:5px 7px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface2);color:var(--text);font-family:'DM Mono',monospace;outline:none;cursor:pointer">
    ${mp.map(p=>`<option value="${p.team}">${p.player} (${p.team})</option>`).join('')}
    <option value="">— Outro —</option>
  </select>` : '';
  const div = document.createElement('div');
  div.className = 'scorer-entry-row';
  div.id = `${panelId}-row-${i}`;
  div.style.cssText = 'flex-wrap:nowrap;gap:6px;align-items:center';
  div.innerHTML = `
    <input type="text" class="scorer-entry-name" id="${panelId}-n-${i}" placeholder="Nome..." autocomplete="off" data-panel="${panelId}" style="min-width:80px;flex:1"/>
    ${teamSel}
    <input type="number" class="scorer-goals-input" id="${panelId}-g-${i}" min="1" value="1" placeholder="1" data-panel="${panelId}"/>
    <button class="scorer-remove-btn" data-panel="${panelId}" data-row="${i}" title="Remover linha">×</button>`;
  container.appendChild(div);
  updateScorerHint(panelId);
  div.querySelector('input[type=text]').focus();
}

// Remove uma linha pelo índice (mantido para compatibilidade)
function removeScorerRow(panelId, i){
  const row = document.getElementById(`${panelId}-row-${i}`);
  if(row) row.remove();
}

// Lê todas as linhas do painel e retorna [{player, team, goals}]
function readScorerRows(panelId){
  const container = document.getElementById(panelId+'-rows');
  if(!container) return [];
  const result = [];
  container.querySelectorAll('.scorer-entry-row').forEach(row=>{
    const nameEl = row.querySelector('.scorer-entry-name');
    const goalsEl = row.querySelector('.scorer-goals-input');
    const teamEl = row.querySelector('.scorer-team-select');
    if(!nameEl || !goalsEl) return;
    const name = nameEl.value.trim();
    const goals = parseInt(goalsEl.value)||0;
    const team = teamEl ? teamEl.value : '';
    if(name && goals>0) result.push({player:name, team, goals});
  });
  return result;
}

// Linha de exibição de gols de uma partida já salva
function scorersDisplayLine(match){
  if(!match.scorers || !match.scorers.length) return '';
  const parts = match.scorers.filter(s=>s.goals>0).map(s=>`<span class="scorer-chip"><b>${s.player}</b> ${s.goals>1?`x${s.goals} `:' '}⚽</span>`);
  if(!parts.length) return '';
  return `<div class="match-scorers-display">${parts.join('')}</div>`;
}

// ═══════════════════════════════════════════════
// GROUPS
// ═══════════════════════════════════════════════
const GROUP_LETTERS='ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function buildGroups(){
  const ng=tournament.numGroups;
  tournament.groups=Array.from({length:ng},(_,i)=>({
    name:'Grupo '+GROUP_LETTERS[i],
    pairs:[],
    matches:[]
  }));

  if(potsMode && drawnPairs.some(p=>p.pot)){
    // Pot-aware distribution: draw one from each pot per group
    const byPot={};
    activePots.forEach(pot=>{
      byPot[pot]=shuffle(drawnPairs.filter(p=>p.pot===pot));
    });
    const noPot=shuffle(drawnPairs.filter(p=>!p.pot));

    // Distribute each pot round-robin across groups
    activePots.forEach(pot=>{
      byPot[pot].forEach((pair,i)=>{
        tournament.groups[i%ng].pairs.push(pair);
      });
    });
    noPot.forEach((pair,i)=>{
      tournament.groups[i%ng].pairs.push(pair);
    });
  } else {
    const shuffled=shuffle(drawnPairs);
    shuffled.forEach((p,i)=>tournament.groups[i%ng].pairs.push(p));
  }

  // build round-robin matches per group using circle algorithm
  tournament.groups.forEach(g=>{
    g.matches=[];
    g.rounds=[];
    const schedule = roundRobinSchedule(g.pairs.length);
    schedule.forEach((round, ri)=>{
      const idxs=[];
      round.forEach(({h,a})=>{
        idxs.push(g.matches.length);
        g.matches.push({a:h, b:a, scoreA:'', scoreB:'', done:false});
      });
      g.rounds.push({name:`${ri+1}ª Rodada`, matchIndexes:idxs});
    });
  });
  renderGroupsPage(false);
  renderGroupsPage(true);
}

function renderGroupsPage(onlyGroups){
  const pageId=onlyGroups?'page-groups-only':'page-groups';
  const tabsId=onlyGroups?'groups-only-tabs':'groups-tabs';
  const contentId=onlyGroups?'groups-only-content':'groups-content';

  const tabs=document.getElementById(tabsId);
  tabs.innerHTML=tournament.groups.map((g,i)=>
    `<button class="inner-tab ${i===0?'active':''}" onclick="switchGroupTab(${i},'${tabsId}','${contentId}')">${g.name}</button>`
  ).join('');
  renderGroupContent(0, contentId, onlyGroups);
}

function switchGroupTab(idx, tabsId, contentId){
  document.querySelectorAll(`#${tabsId} .inner-tab`).forEach((t,i)=>t.classList.toggle('active',i===idx));
  renderGroupContent(idx, contentId, contentId.includes('only'));
}

function renderGroupContent(idx, contentId, onlyGroups){
  const g=tournament.groups[idx];
  const stats=calcGroupStandings(g);
  const qpg=tournament.qualifyPerGroup;

  let html=`<div class="card">
    <div class="card-title">${g.name} — Classificação</div>
    <table class="group-table">
      <tr><th>#</th><th>Jogador / Time</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>Pts</th></tr>`;
  stats.forEach((s,i)=>{
    const q=i<qpg;
    html+=`<tr class="${q?'qualified':''}">
      <td>${i+1}</td>
      <td><b>${s.player}</b><br><span style="font-size:11px;color:var(--text2)">${emo(s.team)} ${s.team}</span></td>
      <td>${s.j}</td><td>${s.v}</td><td>${s.e}</td><td>${s.d}</td>
      <td>${s.gp}</td><td>${s.gc}</td><td>${s.gp-s.gc>0?'+':''}${s.gp-s.gc}</td>
      <td><b>${s.pts}</b></td>
    </tr>`;
  });
  html+=`</table></div>`;

  // matches em rodadas colapsáveis
  const groupRounds = g.rounds || [];
  html+=`<div class="card" style="padding:0;overflow:hidden"><div style="padding:10px 14px;border-bottom:1px solid var(--border)"><span class="card-title" style="margin:0">Jogos do ${g.name}</span></div><div class="rounds-grid" style="padding:10px;gap:8px">`;
  groupRounds.forEach((round, ri)=>{
    const roundMatches = round.matchIndexes.map(mi=>({m:g.matches[mi], mi}));
    const doneCnt = roundMatches.filter(({m})=>m.done).length;
    const allDone = doneCnt===roundMatches.length;
    const roundId = `grp-${idx}-r${ri}`;
    html+=`<div class="round-card ${allDone?'all-done':''}" id="${roundId}">
      <div class="round-header" onclick="toggleGroupRound('${roundId}')">
        <span class="round-header-title">${round.name}</span>
        <span style="display:flex;align-items:center;gap:10px">
          <span class="round-header-meta">${doneCnt}/${roundMatches.length} jogos</span>
          ${allDone?'<span style="color:var(--accent);font-size:11px;font-weight:600">✓</span>':''}
          <span class="round-header-chevron">›</span>
        </span>
      </div>
      <div class="round-body"><div class="matches-list" style="padding:0 14px 8px">`;
    roundMatches.forEach(({m, mi})=>{
      const pa=g.pairs[m.a], pb=g.pairs[m.b];
      if(m.done){
        html+=`<div class="match-row" style="flex-direction:column;align-items:stretch">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <div class="match-teams">
              <span class="match-team home" style="display:flex;flex-direction:column;align-items:flex-end;gap:1px">${emo(pa.team)} ${pa.player}<span style="font-size:10px;color:var(--text3);font-weight:400">${pa.team}</span></span>
              <span class="match-vs">${m.scoreA} – ${m.scoreB}</span>
              <span class="match-team away" style="display:flex;flex-direction:column;align-items:flex-start;gap:1px">${emo(pb.team)} ${pb.player}<span style="font-size:10px;color:var(--text3);font-weight:400">${pb.team}</span></span>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0">
              <button class="btn btn-sm" onclick="toggleGroupGoalsPanel(${idx},${mi},'${contentId}',${onlyGroups})">⚽ Gols</button>
              <button class="btn btn-sm" onclick="undoGroupMatch(${idx},${mi},'${contentId}',${onlyGroups})">✏️ Editar</button>
            </div>
          </div>
          ${scorersDisplayLine(m)}
          <div id="gp-${idx}-${mi}" style="display:none">
            ${renderScorerPanel(m, parseInt(m.scoreA)+parseInt(m.scoreB), ()=>saveGroupGoals(idx,mi,contentId,onlyGroups), `gp-${idx}-${mi}`, [{player:pa.player,team:pa.team},{player:pb.player,team:pb.team}])}
          </div>
        </div>`;
      } else {
        html+=`<div class="match-row" id="gmatch-${idx}-${mi}">
          <div class="match-teams">
            <span class="match-team home" style="display:flex;flex-direction:column;align-items:flex-end;gap:1px">${emo(pa.team)} ${pa.player}<span style="font-size:10px;color:var(--text3);font-weight:400">${pa.team}</span></span>
            <span class="match-score">
              <input type="number" min="0" max="99" class="score-input" id="gs-${idx}-${mi}-a" placeholder="0"/>
              <span class="score-sep">–</span>
              <input type="number" min="0" max="99" class="score-input" id="gs-${idx}-${mi}-b" placeholder="0"/>
            </span>
            <span class="match-team away" style="display:flex;flex-direction:column;align-items:flex-start;gap:1px">${emo(pb.team)} ${pb.player}<span style="font-size:10px;color:var(--text3);font-weight:400">${pb.team}</span></span>
          </div>
          <button class="btn btn-primary btn-sm btn-confirm" onclick="confirmGroupMatch(${idx},${mi},'${contentId}',${onlyGroups})">✓ Confirmar</button>
        </div>`;
      }
    });
    html+=`</div></div></div>`;
  });
  html+=`</div></div>`;

  document.getElementById(contentId).innerHTML=html;
  checkGroupsComplete();
  updateArtilhariaWidgets();
}

function toggleGroupGoalsPanel(gi, mi, contentId, onlyGroups){
  const panel=document.getElementById(`gp-${gi}-${mi}`);
  if(panel){
    const visible = panel.style.display==='none';
    panel.style.display = visible ? 'block' : 'none';
    if(visible) updateScorerHint(`gp-${gi}-${mi}`);
  }
}

function saveGroupGoals(gi, mi, contentId, onlyGroups){
  const m=tournament.groups[gi].matches[mi];
  m.scorers = readScorerRows(`gp-${gi}-${mi}`);
  saveState();
  renderGroupContent(gi, contentId, onlyGroups);
}

function confirmGroupMatch(gi, mi, contentId, onlyGroups){
  const m=tournament.groups[gi].matches[mi];
  const a=parseInt(document.getElementById(`gs-${gi}-${mi}-a`).value);
  const b=parseInt(document.getElementById(`gs-${gi}-${mi}-b`).value);
  if(isNaN(a)||isNaN(b)){alert('Preencha os dois placares!');return;}
  m.scoreA=a; m.scoreB=b; m.done=true;
  saveState();
  const idx=getCurrentGroupTab(onlyGroups?'groups-only-tabs':'groups-tabs');
  renderGroupContent(gi, contentId, onlyGroups);
  checkGroupsComplete();
}

function undoGroupMatch(gi, mi, contentId, onlyGroups){
  const m=tournament.groups[gi].matches[mi];
  m.done=false; m.scoreA=''; m.scoreB=''; m.scorers=[];
  saveState();
  renderGroupContent(gi, contentId, onlyGroups);
  checkGroupsComplete();
}

function getCurrentGroupTab(tabsId){
  const tabs=document.querySelectorAll(`#${tabsId} .inner-tab`);
  for(let i=0;i<tabs.length;i++) if(tabs[i].classList.contains('active')) return i;
  return 0;
}

function calcGroupStandings(g){
  const map={};
  g.pairs.forEach(p=>{map[p.player]={player:p.player,team:p.team,j:0,v:0,e:0,d:0,gp:0,gc:0,pts:0};});
  g.matches.forEach(m=>{
    if(!m.done) return;
    const pa=g.pairs[m.a].player, pb=g.pairs[m.b].player;
    const sa=parseInt(m.scoreA), sb=parseInt(m.scoreB);
    map[pa].j++; map[pb].j++;
    map[pa].gp+=sa; map[pa].gc+=sb;
    map[pb].gp+=sb; map[pb].gc+=sa;
    if(sa>sb){map[pa].v++;map[pa].pts+=3;map[pb].d++;}
    else if(sb>sa){map[pb].v++;map[pb].pts+=3;map[pa].d++;}
    else{map[pa].e++;map[pb].e++;map[pa].pts++;map[pb].pts++;}
  });

  const arr = Object.values(map);

  // Desempate 1: pontos | 2: saldo de gols geral | 3: gols marcados |
  // 4: confronto direto (pts, saldo, gols) | 5: ordem alfabética
  function directH2H(a, b){
    let ptsA=0,ptsB=0,sgA=0,sgB=0,gpA=0;
    g.matches.forEach(m=>{
      if(!m.done) return;
      const pa=g.pairs[m.a].player, pb=g.pairs[m.b].player;
      const sa=parseInt(m.scoreA), sb=parseInt(m.scoreB);
      if(pa===a.player && pb===b.player){
        sgA+=sa-sb; gpA+=sa;
        if(sa>sb){ptsA+=3;} else if(sb>sa){ptsB+=3;} else{ptsA++;ptsB++;}
      } else if(pa===b.player && pb===a.player){
        sgA+=sb-sa; gpA+=sb;
        if(sb>sa){ptsA+=3;} else if(sa>sb){ptsB+=3;} else{ptsA++;ptsB++;}
      }
    });
    if(ptsA!==ptsB) return ptsB-ptsA;
    if(sgA!==0) return -sgA; // saldo no confronto (a favor de A se sgA>0)
    return -gpA; // gols marcados no confronto
  }

  arr.sort((a,b)=>{
    if(b.pts!==a.pts) return b.pts-a.pts;
    const sgA=a.gp-a.gc, sgB=b.gp-b.gc;
    if(sgB!==sgA) return sgB-sgA;
    if(b.gp!==a.gp) return b.gp-a.gp;
    const h2h=directH2H(a,b);
    if(h2h!==0) return h2h;
    return a.player.localeCompare(b.player);
  });
  return arr;
}

function checkGroupsComplete(){
  const allDone=tournament.groups.every(g=>g.matches.every(m=>m.done));
  const btn=document.getElementById('btn-advance-knockout');
  if(btn) btn.disabled=!allDone;
}

function advanceToKnockout(){
  const qualified=[];
  tournament.groups.forEach(g=>{
    const standings=calcGroupStandings(g);
    standings.slice(0,tournament.qualifyPerGroup).forEach(s=>qualified.push({player:s.player,team:s.team}));
  });
  buildKnockoutFromPairs(qualified);
  goToPage('knockout');
}

// ═══════════════════════════════════════════════
// KNOCKOUT
// ═══════════════════════════════════════════════
function buildKnockoutFromPairs(pairs){
  const shuffled=shuffle(pairs);
  // pad to power of 2
  const size=Math.pow(2,Math.ceil(Math.log2(Math.max(shuffled.length,2))));
  while(shuffled.length<size) shuffled.push(null); // byes
  tournament.knockoutRounds=[];
  const firstMatches=[];
  for(let i=0;i<size;i+=2){
    const a=shuffled[i], b=shuffled[i+1];
    firstMatches.push({
      teamA:a?a.team:null,playerA:a?a.player:'BYE',
      teamB:b?b.team:null,playerB:b?b.player:'BYE',
      scoreA:'',scoreB:'',done:b?false:true,
      winner:a&&!b?0:null // 0=A wins bye
    });
  }
  tournament.knockoutRounds.push({name:roundName(size/2),matches:firstMatches});
  // Inicializa partida de 3º lugar se habilitado e houver semifinais (size>=4)
  if(tournament.thirdPlace && size>=4){
    tournament.thirdPlaceMatch={teamA:null,playerA:'A definir',teamB:null,playerB:'A definir',scoreA:'',scoreB:'',done:false,winner:null,scorers:[]};
  } else {
    tournament.thirdPlaceMatch=null;
  }
  // auto-advance byes
  firstMatches.forEach(m=>{if(!m.teamB){m.scoreA=1;m.scoreB=0;m.done=true;}});
  // build subsequent empty rounds
  let n=size/2;
  while(n>1){
    n=n/2;
    const matches=Array.from({length:n},()=>({teamA:null,playerA:'A definir',teamB:null,playerB:'A definir',scoreA:'',scoreB:'',done:false,winner:null}));
    tournament.knockoutRounds.push({name:roundName(n),matches});
  }
  propagateKnockout();
  renderKnockoutPage();
}

function roundName(n){
  if(n===1) return 'Final';
  if(n===2) return 'Semifinal';
  if(n===4) return 'Quartas de Final';
  if(n===8) return 'Oitavas de Final';
  return `Rodada de ${n*2}`;
}

function propagateKnockout(){
  for(let r=0;r<tournament.knockoutRounds.length-1;r++){
    const curr=tournament.knockoutRounds[r];
    const next=tournament.knockoutRounds[r+1];
    curr.matches.forEach((m,i)=>{
      const ni=Math.floor(i/2), slot=i%2;
      if(m.done&&m.winner!=null){
        const winner=m.winner===0?{team:m.teamA,player:m.playerA}:{team:m.teamB,player:m.playerB};
        if(slot===0){next.matches[ni].teamA=winner.team;next.matches[ni].playerA=winner.player;}
        else{next.matches[ni].teamB=winner.team;next.matches[ni].playerB=winner.player;}
      }
    });
  }
  // 3º lugar: popula perdedores das semifinais (penúltima rodada com 2 jogos)
  if(tournament.thirdPlace && tournament.thirdPlaceMatch){
    const rounds=tournament.knockoutRounds;
    const semis = rounds.length>=2 ? rounds[rounds.length-2] : null;
    const tpm = tournament.thirdPlaceMatch;
    if(semis && semis.matches.length===2){
      const losers=semis.matches.map(m=>{
        if(m.done && m.winner!=null){
          return m.winner===0 ? {team:m.teamB,player:m.playerB} : {team:m.teamA,player:m.playerA};
        }
        return null;
      });
      // Se alguma semi voltou ao não-confirmado, zera a partida de 3º
      if(!losers[0]||!losers[1]){
        tpm.teamA=null;tpm.playerA='A definir';tpm.teamB=null;tpm.playerB='A definir';
        tpm.scoreA='';tpm.scoreB='';tpm.done=false;tpm.winner=null;tpm.scorers=[];
      } else {
        const changed = tpm.teamA!==losers[0].team || tpm.playerA!==losers[0].player
                     || tpm.teamB!==losers[1].team || tpm.playerB!==losers[1].player;
        tpm.teamA=losers[0].team; tpm.playerA=losers[0].player;
        tpm.teamB=losers[1].team; tpm.playerB=losers[1].player;
        if(changed){ tpm.scoreA='';tpm.scoreB='';tpm.done=false;tpm.winner=null;tpm.scorers=[]; }
      }
    }
  }
  // check champion
  const last=tournament.knockoutRounds[tournament.knockoutRounds.length-1];
  if(last&&last.matches[0]&&last.matches[0].done&&last.matches[0].winner!=null){
    const m=last.matches[0];
    tournament.champion=m.winner===0?{team:m.teamA,player:m.playerA}:{team:m.teamB,player:m.playerB};
  }
}

function renderKnockoutPage(){
  renderBracket();
  renderKnockoutMatches();
  updateArtilhariaWidgets();
  const btnWrap = document.getElementById('btn-see-champion-wrap');
  if(btnWrap) btnWrap.style.display = tournament.champion ? 'block' : 'none';
}

function renderBracket(){
  const bracket=document.getElementById('bracket');
  let html='';
  tournament.knockoutRounds.forEach((round,ri)=>{
    html+=`<div class="bracket-round"><div class="bracket-round-title">${round.name}</div><div class="bracket-matches">`;
    round.matches.forEach(m=>{
      const aw=m.done&&m.winner===0, bw=m.done&&m.winner===1;
      html+=`<div class="bracket-match">
        <div class="bracket-team ${aw?'winner':m.done?'loser':''}">
          <span class="bracket-team-emoji">${m.teamA?emo(m.teamA):'❓'}</span>
          <span class="bracket-team-name ${m.playerA==='A definir'?'tbd':''}">${m.playerA}</span>
          <span class="bracket-team-score">${m.done?m.scoreA:''}</span>
        </div>
        <div class="bracket-team ${bw?'winner':m.done?'loser':''}">
          <span class="bracket-team-emoji">${m.teamB?emo(m.teamB):'❓'}</span>
          <span class="bracket-team-name ${m.playerB==='A definir'?'tbd':''}">${m.playerB}</span>
          <span class="bracket-team-score">${m.done?m.scoreB:''}</span>
        </div>
      </div>`;
    });
    html+=`</div></div>`;
    if(ri<tournament.knockoutRounds.length-1) html+=`<div style="display:flex;flex-direction:column;justify-content:space-around;width:16px;flex-shrink:0"></div>`;
  });
  bracket.innerHTML=html;
}

function renderKnockoutMatches(){
  const section=document.getElementById('knockout-matches-section');
  let html='';
  tournament.knockoutRounds.forEach((round,ri)=>{
    const pendingOrEditable=round.matches.some(m=>m.playerA!=='A definir'&&m.playerB!=='A definir'&&m.playerA!=='BYE'&&m.playerB!=='BYE');
    if(!pendingOrEditable) return;
    html+=`<div class="card"><div class="card-title">${round.name}</div><div class="matches-list">`;
    round.matches.forEach((m,mi)=>{
      if(m.playerA==='A definir'||m.playerB==='A definir') return;
      if(m.playerB==='BYE'){
        html+=`<div class="match-row"><span style="font-size:13px;color:var(--text2)">${emo(m.teamA)} <b>${m.playerA}</b> avança automaticamente (BYE)</span></div>`;
        return;
      }
      if(m.done){
        html+=`<div class="match-row" style="flex-direction:column;align-items:stretch">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <div class="match-teams">
              <span class="match-team home" style="display:flex;flex-direction:column;align-items:flex-end;gap:1px">${emo(m.teamA)} ${m.playerA}<span style="font-size:10px;color:var(--text3);font-weight:400">${m.teamA||''}</span></span>
              <span class="match-vs">${m.scoreA} – ${m.scoreB}${(m.penA!=null&&m.penB!=null)?` <small style="font-size:10px;color:var(--text3);font-weight:500">(pên. ${m.penA}–${m.penB})</small>`:''}</span>
              <span class="match-team away" style="display:flex;flex-direction:column;align-items:flex-start;gap:1px">${emo(m.teamB)} ${m.playerB}<span style="font-size:10px;color:var(--text3);font-weight:400">${m.teamB||''}</span></span>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0">
              <button class="btn btn-sm" onclick="toggleKnockoutGoalsPanel(${ri},${mi})">⚽ Gols</button>
              <button class="btn btn-sm" onclick="undoKnockoutMatch(${ri},${mi})">✏️ Editar</button>
            </div>
          </div>
          ${scorersDisplayLine(m)}
          <div id="kgp-${ri}-${mi}" style="display:none">
            ${renderScorerPanel(m, parseInt(m.scoreA)+parseInt(m.scoreB), ()=>saveKnockoutGoals(ri,mi), `kgp-${ri}-${mi}`, [{player:m.playerA,team:m.teamA||''},{player:m.playerB,team:m.teamB||''}])}
          </div>
        </div>`;
      } else {
        html+=`<div class="match-row">
          <div class="match-teams">
            <span class="match-team home" style="display:flex;flex-direction:column;align-items:flex-end;gap:1px">${emo(m.teamA)} ${m.playerA}<span style="font-size:10px;color:var(--text3);font-weight:400">${m.teamA||''}</span></span>
            <span class="match-score">
              <input type="number" min="0" max="99" class="score-input" id="ks-${ri}-${mi}-a" placeholder="0"/>
              <span class="score-sep">–</span>
              <input type="number" min="0" max="99" class="score-input" id="ks-${ri}-${mi}-b" placeholder="0"/>
            </span>
            <span class="match-team away" style="display:flex;flex-direction:column;align-items:flex-start;gap:1px">${emo(m.teamB)} ${m.playerB}<span style="font-size:10px;color:var(--text3);font-weight:400">${m.teamB||''}</span></span>
          </div>
          <button class="btn btn-primary btn-sm btn-confirm" onclick="confirmKnockoutMatch(${ri},${mi})">✓ Confirmar</button>
        </div>`;
      }
    });
    html+=`</div></div>`;
  });
  // Card da disputa de 3º lugar
  if(tournament.thirdPlace && tournament.thirdPlaceMatch){
    const m=tournament.thirdPlaceMatch;
    const ready = m.playerA!=='A definir' && m.playerB!=='A definir';
    html+=`<div class="card"><div class="card-title">🥉 Disputa de 3º Lugar</div><div class="matches-list">`;
    if(!ready){
      html+=`<div class="match-row"><span style="font-size:13px;color:var(--text2)">Aguardando definição das semifinais…</span></div>`;
    } else if(m.done){
      html+=`<div class="match-row" style="flex-direction:column;align-items:stretch">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <div class="match-teams">
            <span class="match-team home" style="display:flex;flex-direction:column;align-items:flex-end;gap:1px">${emo(m.teamA)} ${m.playerA}<span style="font-size:10px;color:var(--text3);font-weight:400">${m.teamA||''}</span></span>
            <span class="match-vs">${m.scoreA} – ${m.scoreB}${(m.penA!=null&&m.penB!=null)?` <small style="font-size:10px;color:var(--text3);font-weight:500">(pên. ${m.penA}–${m.penB})</small>`:''}</span>
            <span class="match-team away" style="display:flex;flex-direction:column;align-items:flex-start;gap:1px">${emo(m.teamB)} ${m.playerB}<span style="font-size:10px;color:var(--text3);font-weight:400">${m.teamB||''}</span></span>
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0">
            <button class="btn btn-sm" onclick="toggleThirdPlaceGoalsPanel()">⚽ Gols</button>
            <button class="btn btn-sm" onclick="undoThirdPlaceMatch()">✏️ Editar</button>
          </div>
        </div>
        ${scorersDisplayLine(m)}
        <div id="kgp-third" style="display:none">
          ${renderScorerPanel(m, parseInt(m.scoreA)+parseInt(m.scoreB), ()=>saveThirdPlaceGoals(), `kgp-third`, [{player:m.playerA,team:m.teamA||''},{player:m.playerB,team:m.teamB||''}])}
        </div>
      </div>`;
    } else {
      html+=`<div class="match-row">
        <div class="match-teams">
          <span class="match-team home" style="display:flex;flex-direction:column;align-items:flex-end;gap:1px">${emo(m.teamA)} ${m.playerA}<span style="font-size:10px;color:var(--text3);font-weight:400">${m.teamA||''}</span></span>
          <span class="match-score">
            <input type="number" min="0" max="99" class="score-input" id="ks-third-a" placeholder="0"/>
            <span class="score-sep">–</span>
            <input type="number" min="0" max="99" class="score-input" id="ks-third-b" placeholder="0"/>
          </span>
          <span class="match-team away" style="display:flex;flex-direction:column;align-items:flex-start;gap:1px">${emo(m.teamB)} ${m.playerB}<span style="font-size:10px;color:var(--text3);font-weight:400">${m.teamB||''}</span></span>
        </div>
        <button class="btn btn-primary btn-sm btn-confirm" onclick="confirmThirdPlaceMatch()">✓ Confirmar</button>
      </div>`;
    }
    html+=`</div></div>`;
  }
  section.innerHTML=html;
}

// ── Painel inline de pênaltis ──
// Renderiza o painel de pênaltis dentro do match-row existente.
// onConfirm(penA, penB) é chamado quando o usuário salva.
// onCancel() é chamado ao cancelar (reverte os inputs de placar).
function renderPenaltyPanel(containerId, nameA, nameB, onConfirm, onCancel){
  const container = document.getElementById(containerId);
  if(!container) return;
  // Remove painel anterior se existir
  const old = container.querySelector('.pen-panel');
  if(old) old.remove();

  const panel = document.createElement('div');
  panel.className = 'pen-panel';
  panel.innerHTML = `
    <div class="pen-panel-title">🥅 Empate — Pênaltis</div>
    <div class="pen-row">
      <span class="pen-player-label">${nameA}</span>
      <input class="pen-input" id="${containerId}-pa" type="number" min="0" max="99" placeholder="0"/>
    </div>
    <div class="pen-row">
      <span class="pen-player-label">${nameB}</span>
      <input class="pen-input" id="${containerId}-pb" type="number" min="0" max="99" placeholder="0"/>
    </div>
    <div class="pen-error" id="${containerId}-perr"></div>
    <div class="pen-actions">
      <button class="btn btn-primary btn-sm" onclick="__savePen('${containerId}')">✓ Salvar pênaltis</button>
      <button class="btn btn-sm btn-danger" onclick="__cancelPen('${containerId}')">✕ Cancelar</button>
    </div>
  `;
  container.appendChild(panel);
  // Foca no primeiro input
  setTimeout(()=>{ const el=document.getElementById(`${containerId}-pa`); if(el) el.focus(); }, 50);

  // Guarda callbacks no objeto do painel
  panel._onConfirm = onConfirm;
  panel._onCancel  = onCancel;
}

window.__savePen = function(containerId){
  const container = document.getElementById(containerId);
  const panel = container && container.querySelector('.pen-panel');
  if(!panel) return;
  const a = parseInt(document.getElementById(`${containerId}-pa`).value);
  const b = parseInt(document.getElementById(`${containerId}-pb`).value);
  const errEl = document.getElementById(`${containerId}-perr`);
  if(isNaN(a)||isNaN(b)||a<0||b<0){
    errEl.textContent = 'Preencha os dois campos com valores válidos.';
    errEl.style.display='block'; return;
  }
  if(a===b){
    errEl.textContent = 'Pênaltis também empatados — um time precisa converter mais.';
    errEl.style.display='block'; return;
  }
  errEl.style.display='none';
  const cb = panel._onConfirm;
  panel.remove();
  if(cb) cb(a, b);
};

window.__cancelPen = function(containerId){
  const container = document.getElementById(containerId);
  const panel = container && container.querySelector('.pen-panel');
  if(!panel) return;
  const cb = panel._onCancel;
  panel.remove();
  if(cb) cb();
};

// ── Handlers da partida de 3º lugar ──
function toggleThirdPlaceGoalsPanel(){
  const panel=document.getElementById('kgp-third');
  if(panel){
    const visible=panel.style.display==='none';
    panel.style.display=visible?'block':'none';
    if(visible) updateScorerHint('kgp-third');
  }
}
function saveThirdPlaceGoals(){
  const m=tournament.thirdPlaceMatch;
  m.scorers=readScorerRows('kgp-third');
  saveState();
  renderKnockoutPage();
}
function confirmThirdPlaceMatch(){
  const m=tournament.thirdPlaceMatch;
  const a=parseInt(document.getElementById('ks-third-a').value);
  const b=parseInt(document.getElementById('ks-third-b').value);
  if(isNaN(a)||isNaN(b)){alert('Preencha os dois placares!');return;}
  if(a===b){
    const rowId = 'pen-wrap-third';
    let wrap = document.getElementById(rowId);
    if(!wrap){
      const section = document.getElementById('knockout-matches-section');
      const rows = section.querySelectorAll('.match-row');
      const lastRow = rows[rows.length-1];
      wrap = document.createElement('div');
      wrap.id = rowId;
      lastRow.parentNode.insertBefore(wrap, lastRow.nextSibling);
    }
    wrap.innerHTML = '';
    wrap.id = rowId;
    renderPenaltyPanel(rowId, m.playerA, m.playerB,
      (pa, pb)=>{
        m.penA=pa; m.penB=pb;
        m.scoreA=a; m.scoreB=b; m.done=true; m.winner=pa>pb?0:1;
        saveState();
        renderKnockoutPage();
        if(tournament.champion && window.__autoFinalize) window.__autoFinalize();
      },
      ()=>{ /* cancelado */ }
    );
    return;
  }
  m.penA=null; m.penB=null;
  m.scoreA=a;m.scoreB=b;m.done=true;m.winner=a>b?0:1;
  saveState();
  renderKnockoutPage();
  if(tournament.champion && window.__autoFinalize) window.__autoFinalize();
}
function undoThirdPlaceMatch(){
  const m=tournament.thirdPlaceMatch;
  m.done=false;m.scoreA='';m.scoreB='';m.winner=null;m.scorers=[];m.penA=null;m.penB=null;
  saveState();
  renderKnockoutPage();
}
window.toggleThirdPlaceGoalsPanel=toggleThirdPlaceGoalsPanel;
window.saveThirdPlaceGoals=saveThirdPlaceGoals;
window.confirmThirdPlaceMatch=confirmThirdPlaceMatch;
window.undoThirdPlaceMatch=undoThirdPlaceMatch;

function toggleKnockoutGoalsPanel(ri, mi){
  const panel=document.getElementById(`kgp-${ri}-${mi}`);
  if(panel){
    const visible = panel.style.display==='none';
    panel.style.display = visible ? 'block' : 'none';
    if(visible) updateScorerHint(`kgp-${ri}-${mi}`);
  }
}

function saveKnockoutGoals(ri, mi){
  const m=tournament.knockoutRounds[ri].matches[mi];
  m.scorers = readScorerRows(`kgp-${ri}-${mi}`);
  saveState();
  renderKnockoutPage();
}

function confirmKnockoutMatch(ri, mi){
  const m=tournament.knockoutRounds[ri].matches[mi];
  const a=parseInt(document.getElementById(`ks-${ri}-${mi}-a`).value);
  const b=parseInt(document.getElementById(`ks-${ri}-${mi}-b`).value);
  if(isNaN(a)||isNaN(b)){alert('Preencha os dois placares!');return;}
  if(a===b){
    // Injeta painel de pênaltis logo abaixo do match-row atual
    const rowId = `pen-wrap-${ri}-${mi}`;
    const btn = document.querySelector(`[onclick="confirmKnockoutMatch(${ri},${mi})"]`);
    const matchRow = btn && btn.closest('.match-row');
    if(matchRow){
      let wrap = document.getElementById(rowId);
      if(!wrap){
        wrap = document.createElement('div');
        wrap.id = rowId;
        matchRow.parentNode.insertBefore(wrap, matchRow.nextSibling);
      }
      wrap.innerHTML='';
      renderPenaltyPanel(rowId, m.playerA, m.playerB,
        (pa, pb)=>{
          m.penA=pa; m.penB=pb;
          m.scoreA=a; m.scoreB=b; m.done=true; m.winner=pa>pb?0:1;
          propagateKnockout();
          saveState();
          renderKnockoutPage();
        },
        ()=>{ /* cancelado */ }
      );
    }
    return;
  }
  m.penA=null; m.penB=null; m.winner=a>b?0:1;
  m.scoreA=a;m.scoreB=b;m.done=true;
  propagateKnockout();
  saveState();
  renderKnockoutPage();
}

function undoKnockoutMatch(ri, mi){
  const m=tournament.knockoutRounds[ri].matches[mi];
  m.done=false;m.scoreA='';m.scoreB='';m.winner=null;m.scorers=[];m.penA=null;m.penB=null;
  for(let r=ri+1;r<tournament.knockoutRounds.length;r++){
    tournament.knockoutRounds[r].matches.forEach(nm=>{nm.done=false;nm.scoreA='';nm.scoreB='';nm.winner=null;nm.teamA=null;nm.playerA='A definir';nm.teamB=null;nm.playerB='A definir';nm.scorers=[];});
  }
  if(tournament.thirdPlaceMatch){
    const tpm=tournament.thirdPlaceMatch;
    tpm.teamA=null;tpm.playerA='A definir';tpm.teamB=null;tpm.playerB='A definir';
    tpm.scoreA='';tpm.scoreB='';tpm.done=false;tpm.winner=null;tpm.scorers=[];
  }
  tournament.champion=null;
  propagateKnockout();
  saveState();
  renderKnockoutPage();
}

// ═══════════════════════════════════════════════
// CHAMPION
// ═══════════════════════════════════════════════
function showChampion(){
  const c=tournament.champion;
  // Vice (perdedor da final / 2º da liga)
  let runner=null;
  try{ runner=__calcRunnerUp(); }catch(e){}
  // Terceiro lugar (apenas quando a disputa existe e foi concluída)
  let third=null;
  const tpm=tournament.thirdPlaceMatch;
  if(tournament.thirdPlace && tpm && tpm.done && tpm.winner!=null){
    third = tpm.winner===0 ? {team:tpm.teamA,player:tpm.playerA} : {team:tpm.teamB,player:tpm.playerB};
  }
  const cell = (place, medal, color, scale, data)=>{
    if(!data) return '';
    return `<div style="flex:1;min-width:140px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-lg);padding:${scale>=1?'20px 14px':'16px 12px'};text-align:center">
      <div style="font-size:${scale>=1?'40px':'30px'};line-height:1;margin-bottom:6px">${medal}</div>
      <div style="font-family:'Syne',sans-serif;font-size:10px;font-weight:700;color:var(--text3);letter-spacing:.12em;text-transform:uppercase;margin-bottom:6px">${place}</div>
      <div style="font-size:${scale>=1?'30px':'22px'};margin-bottom:2px">${emo(data.team)}</div>
      <div style="font-family:'Syne',sans-serif;font-size:${scale>=1?'20px':'16px'};font-weight:800;color:${color};letter-spacing:-.3px">${data.team||''}</div>
      <div style="font-size:${scale>=1?'14px':'12px'};color:var(--text2);margin-top:2px">${data.player||''}</div>
    </div>`;
  };
  let podiumHtml = '';
  podiumHtml += cell('Campeão','🏆','var(--accent)',1.1,c);
  if(runner) podiumHtml += cell('Vice','🥈','#b0b0bc',0.9,runner);
  if(third)  podiumHtml += cell('3º Lugar','🥉','#c8843c',0.9,third);
  document.getElementById('champion-box').innerHTML=`
    <h2 style="margin-bottom:14px">🏆 Pódio do Torneio</h2>
    <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;align-items:stretch">${podiumHtml}</div>
  `;

  // Artilharia final
  const scorers = calcAllScorers();
  const section = document.getElementById('champion-scorers-section');
  if(scorers.length){
    const medals=['🥇','🥈','🥉'];
    let podiumHtml='';
    scorers.slice(0,3).forEach((s,i)=>{
      const colors=['var(--gold)','#b0b0bc','#c8843c'];
      podiumHtml+=`<div style="flex:1;min-width:120px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px 12px;text-align:center">
        <div style="font-size:24px;margin-bottom:6px">${medals[i]}</div>
        <div style="font-size:22px;font-weight:700;color:${colors[i]}">${s.goals}</div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:2px">gol${s.goals!==1?'s':''}</div>
        <div style="font-size:13px;font-weight:600;color:var(--text)">${s.player}</div>

      </div>`;
    });
    section.innerHTML=`
      <div class="card">
        <div class="card-title" style="margin-bottom:1rem">⚽ Artilharia do Campeonato</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:${scorers.length>3?'1rem':'0'}">${podiumHtml}</div>
        ${scorers.length>3?`<div class="artilharia-card" style="margin:0"><div>${renderArtilhariaTable(scorers)}</div></div>`:''}
      </div>`;
  } else {
    section.innerHTML='';
  }
  goToPage('champion');
  saveState();
  if(window.__autoFinalize) window.__autoFinalize();
}

function restartAll(){
  players=[];manualTeams=[];poolTeams=[];customTeamMap={};selectedLeagues=new Set();drawnPairs=[];
  tournament={format:'groups-knockout',numGroups:4,qualifyPerGroup:2,groups:[],knockoutRounds:[],champion:null,thirdPlace:false,thirdPlaceMatch:null,league:null};
  teamMode='league';
  potsMode=false;
  activePots=['A','B'];
  // Limpa estado salvo
  clearSavedState();
  // Limpa mapa de callbacks de artilheiros
  Object.keys(SCORER_SAVE_CBS).forEach(k=>delete SCORER_SAVE_CBS[k]);
  // reset toggle UI
  document.getElementById('pots-toggle-track').classList.remove('on');
  document.getElementById('pot-select-wrap').style.display='none';
  document.getElementById('pots-hint').style.display='none';
  document.getElementById('pots-manage-btns').style.display='none';
  setTeamMode('league');
  renderPlayers();renderLeagues();renderManualTeams();renderPoolTeams();
  goToPage('players');
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
(function(){
  const saved = loadState();
  if(saved){
    // Restaura sessão anterior silenciosamente
    try{
      __applyState(saved);
      return; // __applyState já chama goToPage, renderLeagues etc.
    }catch(e){
      console.warn('Falha ao restaurar estado salvo, iniciando do zero.', e);
      clearSavedState();
    }
  }
  // Primeira visita ou estado inválido — inicializa normalmente
  renderLeagues();
  renderPlayers();
  renderManualTeams();
  renderPoolTeams();
  renderStepper();
  updateGroupPreview();
})();

// ═══════════════════════════════════════════════
// BRIDGE — comunicação com o app React (salvar/carregar campeonatos)
// ═══════════════════════════════════════════════

// ═══════════════════════════════════════════════
// FINALIZAÇÃO AUTOMÁTICA — histórico completo
// ═══════════════════════════════════════════════
function __calcTotalGoalsAndMatches(){
  let g=0, played=0;
  // Grupos
  if(tournament.groups && tournament.groups.length){
    tournament.groups.forEach(gr=>{
      (gr.matches||[]).forEach(m=>{
        if(m.done){ played++; g+=(parseInt(m.scoreA)||0)+(parseInt(m.scoreB)||0); }
      });
    });
  }
  // Mata-mata
  if(tournament.knockoutRounds && tournament.knockoutRounds.length){
    tournament.knockoutRounds.forEach(r=>{
      (r.matches||[]).forEach(m=>{
        if(m.done){ played++; g+=(parseInt(m.scoreA)||0)+(parseInt(m.scoreB)||0); }
      });
    });
  }
  // Disputa de 3º lugar
  if(tournament.thirdPlaceMatch && tournament.thirdPlaceMatch.done){
    const tpm=tournament.thirdPlaceMatch;
    played++; g+=(parseInt(tpm.scoreA)||0)+(parseInt(tpm.scoreB)||0);
  }
  // Liga
  if(tournament.league && tournament.league.matches){
    tournament.league.matches.forEach(m=>{
      if(m.done){ played++; g+=(parseInt(m.scoreH)||0)+(parseInt(m.scoreA)||0); }
    });
  }
  return {totalGoals:g, totalMatches:played};
}
function __calcRunnerUp(){
  // Liga: 2º colocado
  if(tournament.format==='league' && tournament.league){
    try{
      const st = calcLeagueStandings();
      if(st.length>=2) return {team:st[1].team, player:st[1].player};
    }catch(e){}
    return null;
  }
  // Mata-mata / Grupos+Mata-mata: perdedor da final
  if(tournament.knockoutRounds && tournament.knockoutRounds.length){
    const last = tournament.knockoutRounds[tournament.knockoutRounds.length-1];
    const f = last && last.matches && last.matches[0];
    if(f && f.done && f.winner!=null){
      return f.winner===0
        ? {team:f.teamB, player:f.playerB}
        : {team:f.teamA, player:f.playerA};
    }
  }
  return null;
}
function __buildFinalizePayload(){
  const champ = tournament.champion || null;
  const runner = __calcRunnerUp();
  const totals = __calcTotalGoalsAndMatches();
  let scorers = [];
  try{ scorers = calcAllScorers() || []; }catch(e){}
  const topScorer = scorers[0] || null;
  // 3º colocado
  let third=null;
  const tpm=tournament.thirdPlaceMatch;
  if(tournament.thirdPlace && tpm && tpm.done && tpm.winner!=null){
    third = tpm.winner===0 ? {team:tpm.teamA,player:tpm.playerA} : {team:tpm.teamB,player:tpm.playerB};
  }
  return {
    champion: champ ? champ.team : null,
    champion_player: champ ? champ.player : null,
    runner_up: runner ? runner.team : null,
    runner_up_player: runner ? runner.player : null,
    third_place: third ? third.team : null,
    third_place_player: third ? third.player : null,
    total_goals: totals.totalGoals,
    total_matches: totals.totalMatches,
    top_scorer: topScorer ? topScorer.player : null,
    top_scorer_goals: topScorer ? topScorer.goals : null,
    top_scorers: scorers.slice(0,10),
    finalized_at: new Date().toISOString()
  };
}
window.__buildFinalizePayload = __buildFinalizePayload;

async function __autoFinalize(){
  try{
    if(!window.__sb) return;
    const { data:{ user } } = await window.__sb.auth.getUser();
    if(!user) return; // usuário não logado: nada a salvar
    if(!tournament || !tournament.champion) return;
    if(window.__finalizing) return;
    window.__finalizing = true;

    const state = (typeof __collectState==='function') ? __collectState() : {};
    const extras = __buildFinalizePayload();
    const baseName = (window.saCurrentName && String(window.saCurrentName).trim())
      || ('Campeonato ' + new Date().toLocaleDateString('pt-BR'));
    const payload = Object.assign({
      user_id: user.id,
      name: baseName,
      format: state?.tournament?.format ?? null,
      state,
      updated_at: new Date().toISOString()
    }, extras);

    let res;
    if(window.saCurrentId){
      res = await window.__sb.from('tournaments').update(payload).eq('id', window.saCurrentId).select().single();
    } else {
      res = await window.__sb.from('tournaments').insert(payload).select().single();
    }
    if(res.error){
      console.error('Auto-finalize erro:', res.error);
      if(typeof saToast==='function') saToast('err','Não foi possível arquivar o torneio.');
    } else {
      if(typeof saSetCurrent==='function') saSetCurrent(res.data.id, res.data.name);
      if(typeof saToast==='function') saToast('ok','Torneio arquivado no histórico!');
    }
  }catch(e){
    console.error(e);
  }finally{
    window.__finalizing = false;
  }
}
window.__autoFinalize = __autoFinalize;

function __collectState(){
  return {
    players, manualTeams, selectedLeagues:[...selectedLeagues], drawnPairs,
    tournament, teamMode, poolTeams, customTeamMap, potsMode, activePots,
    leagueActiveTab, currentPage
  };
}

function __syncUIToggles(){
  // Potes
  var track=document.getElementById('pots-toggle-track');
  if(track) track.classList.toggle('on', !!potsMode);
  var wrap=document.getElementById('pot-select-wrap'); if(wrap) wrap.style.display = potsMode?'':'none';
  var hint=document.getElementById('pots-hint'); if(hint) hint.style.display = potsMode?'':'none';
  var mgmt=document.getElementById('pots-manage-btns'); if(mgmt) mgmt.style.display = potsMode?'flex':'none';
  updatePotSelect();
  // Formato selecionado
  document.querySelectorAll('.format-card').forEach(function(c){
    c.classList.toggle('selected', c.dataset.fmt===tournament.format);
  });
  var gc=document.getElementById('groups-config'); if(gc) gc.style.display=(tournament.format==='knockout'||tournament.format==='league')?'none':'block';
  var kc=document.getElementById('knockout-config'); if(kc) kc.style.display=tournament.format==='knockout'?'block':'none';
  var lc=document.getElementById('league-config'); if(lc) lc.style.display=tournament.format==='league'?'block':'none';
  var ng=document.getElementById('cfg-num-groups'); if(ng&&tournament.numGroups) ng.value=String(tournament.numGroups);
  var qp=document.getElementById('cfg-qualify'); if(qp&&tournament.qualifyPerGroup) qp.value=String(tournament.qualifyPerGroup);
  var ll=document.getElementById('cfg-league-legs'); if(ll&&tournament.leagueLegs) ll.value=String(tournament.leagueLegs);
  var tp1=document.getElementById('cfg-third-place'); if(tp1) tp1.checked=!!tournament.thirdPlace;
  var tp2=document.getElementById('cfg-third-place-ko'); if(tp2) tp2.checked=!!tournament.thirdPlace;
  var tpRow=document.getElementById('cfg-third-place-row');
  if(tpRow) tpRow.style.display = (tournament.format==='groups-knockout') ? '' : 'none';
}

function __applyState(s){
  if(!s) return;
  players=s.players||[];
  manualTeams=s.manualTeams||[];
  selectedLeagues=new Set(s.selectedLeagues||[]);
  drawnPairs=s.drawnPairs||[];
  tournament=s.tournament||tournament;
  teamMode=s.teamMode||'league';
  poolTeams=s.poolTeams||[];
  customTeamMap=s.customTeamMap||{};
  potsMode=!!s.potsMode;
  activePots=(s.activePots&&s.activePots.length)?s.activePots:['A','B'];
  leagueActiveTab=s.leagueActiveTab||'table';

  __syncUIToggles();
  renderPlayers(); renderLeagues(); renderManualTeams(); renderPoolTeams();
  setTeamMode(teamMode);
  updateGroupPreview();

  if(tournament.format==='league' && tournament.league){ renderLeaguePage(); switchLeagueTab(leagueActiveTab); }
  if(tournament.groups && tournament.groups.length){ renderGroupsPage(false); renderGroupsPage(true); }
  if(tournament.knockoutRounds && tournament.knockoutRounds.length){ renderKnockoutPage(); }
  if(tournament.champion){ showChampion(); }
  goToPage(s.currentPage||'players');
}


// ═══════════════════════════════════════════════
// AUTH UI
// ═══════════════════════════════════════════════

let _currentAuthTab = 'login';

function initAuth() {
  checkVerificationParam();

  const name = localStorage.getItem('sortear_display_name');
  const nameEl = document.getElementById('auth-user-name');
  if (nameEl && name) nameEl.textContent = '👤 ' + name;

  const profileBtn = document.getElementById('auth-profile-btn');
  if (profileBtn) profileBtn.style.display = '';

  // Load championships from API and dashboard feed
  if (typeof loadChampionshipsFromAPI === 'function') {
    loadChampionshipsFromAPI().catch(() => {});
  }
  if (typeof loadDashboardFeed === 'function') {
    loadDashboardFeed().catch(() => {});
  }
}

function showAuthModal() {
  document.getElementById('auth-modal').style.display = 'flex';
  document.getElementById('auth-error').style.display = 'none';
  switchAuthTab('login');
}

function hideAuthModal() {
  document.getElementById('auth-modal').style.display = 'none';
}

function switchAuthTab(tab) {
  _currentAuthTab = tab;
  document.getElementById('form-login').style.display = tab === 'login' ? '' : 'none';
  document.getElementById('form-register').style.display = tab === 'register' ? '' : 'none';
  document.getElementById('tab-login').style.color = tab === 'login' ? '#111' : '#6b7280';
  document.getElementById('tab-login').style.borderBottomColor = tab === 'login' ? '#2563eb' : 'transparent';
  document.getElementById('tab-register').style.color = tab === 'register' ? '#111' : '#6b7280';
  document.getElementById('tab-register').style.borderBottomColor = tab === 'register' ? '#2563eb' : 'transparent';
  document.getElementById('auth-error').style.display = 'none';
}

function showAuthError(message) {
  const el = document.getElementById('auth-error');
  el.innerHTML = message;   // innerHTML para suportar o link de reenvio
  el.style.display = '';
}

/**
 * Mostra tela de "verifique seu email" dentro do modal de auth.
 */
function showVerificationPending(email) {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  // Substituir conteúdo do card pelo estado de verificação pendente
  const card = modal.querySelector('div[style*="background:white"]');
  if (!card) return;

  card.innerHTML = `
    <div style="text-align:center;padding:32px 24px">
      <div style="font-size:48px;margin-bottom:16px">📧</div>
      <h2 style="margin:0 0 8px;color:#111827;font-size:18px;font-weight:700">Verifique seu e-mail</h2>
      <p style="margin:0 0 20px;color:#6b7280;font-size:14px;line-height:1.6">
        Enviamos um link de confirmação para<br/>
        <strong style="color:#111827">${email}</strong><br/>
        Clique no link para ativar sua conta.
      </p>
      <p style="margin:0 0 20px;color:#9ca3af;font-size:12px">
        Não recebeu? Verifique a pasta de spam ou reenvie abaixo.
      </p>
      <button onclick="handleResendVerification(event,'${email.replace(/'/g, "\\'")}')"
              id="resend-btn"
              style="margin-bottom:12px;width:100%;padding:10px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;cursor:pointer;font-size:14px;color:#374151">
        🔁 Reenviar e-mail de confirmação
      </button>
      <button onclick="hideAuthModal()"
              style="width:100%;padding:8px;border:none;background:none;cursor:pointer;color:#9ca3af;font-size:13px">
        Fechar
      </button>
    </div>`;
}

/**
 * Reenvia o e-mail de verificação.
 */
async function handleResendVerification(event, email) {
  if (event) event.preventDefault();
  const btn = document.getElementById('resend-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }
  try {
    await apiCall('POST', '/auth/resend-verification', { email }, false);
    if (btn) { btn.textContent = '✅ E-mail reenviado!'; }
  } catch (_) {
    if (btn) { btn.disabled = false; btn.textContent = '🔁 Reenviar e-mail de confirmação'; }
  }
}

/**
 * Verifica o parâmetro ?verified= na URL ao carregar a página
 * e exibe um toast informando o resultado.
 */
function checkVerificationParam() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('verified');
  if (!status) return;

  // Limpar o parâmetro da URL sem recarregar
  const url = new URL(window.location.href);
  url.searchParams.delete('verified');
  window.history.replaceState({}, '', url.toString());

  if (status === '1') {
    showToast('✅ E-mail confirmado! Faça login para continuar.', 'success');
    // Abrir modal de login automaticamente
    setTimeout(() => { showAuthModal(); switchAuthTab('login'); }, 600);
  } else if (status === 'expired') {
    showToast('⏰ Link expirado. Faça login e solicite um novo.', 'warning');
    setTimeout(() => { showAuthModal(); switchAuthTab('login'); }, 600);
  } else {
    showToast('❌ Link de verificação inválido.', 'error');
  }
}

/**
 * Exibe um toast de feedback no topo da tela.
 */
function showToast(message, type = 'info') {
  const existing = document.getElementById('sortear-toast');
  if (existing) existing.remove();

  const colors = {
    success: { bg: '#16a34a', text: 'white' },
    warning: { bg: '#d97706', text: 'white' },
    error:   { bg: '#dc2626', text: 'white' },
    info:    { bg: '#2563eb', text: 'white' },
  };
  const c = colors[type] || colors.info;

  const toast = document.createElement('div');
  toast.id = 'sortear-toast';
  toast.style.cssText = [
    'position:fixed', 'top:70px', 'left:50%', 'transform:translateX(-50%)',
    `background:${c.bg}`, `color:${c.text}`, 'padding:12px 24px',
    'border-radius:10px', 'z-index:9999', 'font-size:14px', 'font-weight:600',
    'box-shadow:0 4px 16px rgba(0,0,0,0.15)', 'pointer-events:none',
    'transition:opacity .3s'
  ].join(';');
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}


async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) { showAuthError('Preencha e-mail e senha.'); return; }
  try {
    const data = await apiCall('POST', '/auth/login', { email, password }, false);
    setTokens(data.accessToken, data.refreshToken);
    try {
      const profile = await apiCall('GET', '/profile/me', null, true);
      if (profile && profile.displayName) localStorage.setItem('sortear_display_name', profile.displayName);
    } catch (_) {}
    hideAuthModal();
    initAuth();
    if (typeof checkMigrationOffer === 'function') checkMigrationOffer();
  } catch (err) {
    const code = err?.error?.code;
    if (code === 'EMAIL_NOT_VERIFIED') {
      // Show resend option inline
      showAuthError('E-mail não confirmado. <a href="#" onclick="handleResendVerification(event, \'' + email.replace(/'/g, "\\'") + '\')" style="color:#2563eb;text-decoration:underline">Reenviar link de confirmação</a>');
    } else if (code === 'AUTHENTICATION_FAILED') {
      showAuthError('E-mail ou senha incorretos.');
    } else if (code === 'RATE_LIMIT_EMAIL' || code === 'RATE_LIMIT_IP') {
      showAuthError('Muitas tentativas. Tente novamente em 15 minutos.');
    } else {
      showAuthError('Erro ao entrar. Tente novamente.');
    }
  }
}

async function handleRegister() {
  const displayName = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  if (!displayName || !email || !password) { showAuthError('Preencha todos os campos.'); return; }
  try {
    await apiCall('POST', '/auth/register', { displayName, email, password }, false);
    // Don't log the user in — show "check your email" screen instead
    showVerificationPending(email);
  } catch (err) {
    const code = err?.error?.code;
    if (code === 'EMAIL_ALREADY_EXISTS') showAuthError('Este e-mail já está cadastrado.');
    else if (code === 'VALIDATION_ERROR') showAuthError(err?.error?.message || 'Dados inválidos. Verifique os campos.');
    else showAuthError('Erro ao criar conta. Tente novamente.');
  }
}

async function handleLogout() {
  const refreshToken = localStorage.getItem('sortear_refresh_token');
  try { await apiCall('POST', '/auth/logout', { refreshToken }, true); } catch (_) {}
  clearTokens();
  localStorage.removeItem('sortear_display_name');
  window.location.replace('/login');
}

// ═══════════════════════════════════════════════
// DASHBOARD FEED — campeonatos em aberto na home
// ═══════════════════════════════════════════════

async function loadDashboardFeed() {
  const card = document.getElementById('dashboard-feed-card');
  const container = document.getElementById('dashboard-feed');
  if (!card || !container) return;
  try {
    const feed = await apiCall('GET', '/championships/feed');
    const open = Array.isArray(feed) ? feed.filter(f => f.status === 'ongoing') : [];
    if (open.length === 0) { card.style.display = 'none'; return; }
    card.style.display = '';
    container.innerHTML = open.slice(0, 3).map(item => _renderFeedItem(item)).join('');
  } catch (_) {
    card.style.display = 'none';
  }
}

/**
 * Opens a championship from the feed by loading its data from the API
 * and restoring the full tournament state.
 */
async function openChampionshipFromFeed(championshipId) {
  try {
    showToast('Carregando campeonato...', 'info');
    const ch = await apiCall('GET', `/championships/${championshipId}`);
    if (!ch || !ch.data) {
      showToast('Não foi possível carregar o campeonato.', 'error');
      return;
    }
    // Set the current championship ID for subsequent PATCH saves
    window._currentChampionshipId = championshipId;
    // Restore full state using __applyState (players, tournament, pages, etc.)
    __applyState(ch.data);
    showToast('Campeonato carregado!', 'success');
  } catch (_) {
    showToast('Não foi possível carregar o campeonato.', 'error');
  }
}

/**
 * Deletes a championship after confirmation.
 */
async function deleteChampionship(championshipId, title) {
  if (!confirm(`Excluir o campeonato "${title}"?\n\nEssa ação não pode ser desfeita.`)) return;
  try {
    await apiCall('DELETE', `/championships/${championshipId}`);
    // If current championship was deleted, clear the ID
    if (window._currentChampionshipId === championshipId) {
      window._currentChampionshipId = null;
    }
    showToast('Campeonato excluído.', 'success');
    // Refresh feeds
    loadMyFeed().catch(() => {});
    loadDashboardFeed().catch(() => {});
  } catch (err) {
    const code = err?.error?.code;
    if (code === 'AUTHORIZATION_FAILED') showToast('Apenas o criador pode excluir o campeonato.', 'error');
    else showToast('Erro ao excluir campeonato.', 'error');
  }
}

// ═══════════════════════════════════════════════
// PERFIL — editar nome, username, avatar
// ═══════════════════════════════════════════════

async function saveDisplayName() {
  const input = document.getElementById('edit-display-name');
  const name = input?.value?.trim();
  if (!name) return;
  try {
    await apiCall('PATCH', '/profile/me', { displayName: name });
    localStorage.setItem('sortear_display_name', name);
    document.getElementById('profile-display-name').textContent = name;
    document.getElementById('auth-user-name').textContent = '👤 ' + name;
    showToast('Nome atualizado!', 'success');
  } catch (err) {
    showToast(err?.error?.message || 'Erro ao atualizar nome.', 'error');
  }
}

async function saveUsername() {
  const input = document.getElementById('edit-username');
  const feedback = document.getElementById('username-feedback');
  const raw = input?.value?.trim();
  if (!raw) return;
  const username = raw.toLowerCase().replace(/[^a-z0-9_]/g, '');
  input.value = username;
  if (username.length < 3) {
    feedback.textContent = 'Mínimo 3 caracteres.';
    feedback.style.color = '#dc2626';
    feedback.style.display = '';
    return;
  }
  try {
    await apiCall('PATCH', '/profile/me/username', { username });
    document.getElementById('profile-username-display').textContent = '@' + username;
    document.getElementById('profile-username-display').style.color = '#6b7280';
    feedback.textContent = '✅ Nickname salvo!';
    feedback.style.color = '#15803d';
    feedback.style.display = '';
    setTimeout(() => { feedback.style.display = 'none'; }, 3000);
    showToast('@' + username + ' definido!', 'success');
  } catch (err) {
    const code = err?.error?.code;
    feedback.textContent = code === 'USERNAME_TAKEN' ? 'Este nickname já está em uso.' : (err?.error?.message || 'Erro ao salvar.');
    feedback.style.color = '#dc2626';
    feedback.style.display = '';
  }
}

async function handleAvatarUpload(input) {
  const file = input?.files?.[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { showToast('Imagem deve ter menos de 2 MB.', 'error'); return; }
  const formData = new FormData();
  formData.append('avatar', file);
  const token = getAccessToken();
  try {
    showToast('Enviando foto...', 'info');
    const res = await fetch('/api/profile/me/avatar', {
      method: 'POST',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {},
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    if (data.avatarUrl) {
      const avatar = document.getElementById('profile-avatar');
      avatar.innerHTML = `<img src="${data.avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
      showToast('Foto atualizada!', 'success');
    }
  } catch (_) {
    showToast('Erro ao enviar foto. Tente novamente.', 'error');
  }
}

// Initialize auth on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}

// ═══════════════════════════════════════════════
// CHAMPIONSHIP PERSISTENCE (API)
// Requirements: 4.2, 4.3, 4.4, 4.5
// ═══════════════════════════════════════════════

/** Tracks the server-side championship ID for the current session */
window._currentChampionshipId = null;

/**
 * Shows a dismissable error banner for DB errors (Req 4.3, 4.5)
 * @param {string} code - Error code (DB_LOAD_ERROR or DB_SAVE_ERROR)
 * @param {string} message - User-facing message in Portuguese
 */
function showApiError(code, message) {
  const existing = document.getElementById('api-error-banner');
  if (existing) existing.remove();
  const banner = document.createElement('div');
  banner.id = 'api-error-banner';
  banner.style.cssText = [
    'position:fixed', 'bottom:16px', 'left:50%', 'transform:translateX(-50%)',
    'background:#dc2626', 'color:white', 'padding:10px 20px',
    'border-radius:8px', 'z-index:9999', 'font-size:13px', 'font-weight:500',
    'box-shadow:0 4px 12px rgba(0,0,0,0.2)', 'display:flex', 'align-items:center', 'gap:12px'
  ].join(';');
  const msg = document.createElement('span');
  msg.textContent = `⚠ ${message}`;
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = 'background:none;border:none;color:white;cursor:pointer;font-size:18px;line-height:1;padding:0';
  closeBtn.onclick = () => banner.remove();
  banner.appendChild(msg);
  banner.appendChild(closeBtn);
  document.body.appendChild(banner);
  setTimeout(() => { if (banner.parentNode) banner.remove(); }, 6000);
}

/**
 * Shows an info banner (e.g. loaded championships from server)
 */
function showApiInfo(message) {
  const existing = document.getElementById('api-info-banner');
  if (existing) existing.remove();
  const banner = document.createElement('div');
  banner.id = 'api-info-banner';
  banner.style.cssText = [
    'position:fixed', 'bottom:16px', 'left:50%', 'transform:translateX(-50%)',
    'background:#2563eb', 'color:white', 'padding:10px 20px',
    'border-radius:8px', 'z-index:9999', 'font-size:13px', 'font-weight:500',
    'box-shadow:0 4px 12px rgba(0,0,0,0.2)', 'display:flex', 'align-items:center', 'gap:12px'
  ].join(';');
  const msg = document.createElement('span');
  msg.textContent = `ℹ ${message}`;
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = 'background:none;border:none;color:white;cursor:pointer;font-size:18px;line-height:1;padding:0';
  closeBtn.onclick = () => banner.remove();
  banner.appendChild(msg);
  banner.appendChild(closeBtn);
  document.body.appendChild(banner);
  setTimeout(() => { if (banner.parentNode) banner.remove(); }, 5000);
}

/**
 * Saves the current championship state to the API (fire-and-forget).
 * Falls back silently if not logged in.
 * Req 4.4: persist in ≤ 2 s after user action
 * Req 4.5: show DB_SAVE_ERROR on failure, preserve previous state
 */
async function saveStateToAPI() {
  if (!getAccessToken()) return; // not logged in — localStorage already saved by saveState()
  try {
    const state = __collectState();
    if (window._currentChampionshipId) {
      // PATCH existing championship — Req 4.4
      await apiCall('PATCH', `/championships/${window._currentChampionshipId}`, {
        data: state,
        status: tournament.champion ? 'finished' : 'ongoing',
        champion: tournament.champion || undefined
      });
    } else {
      // POST new championship — Req 4.1
      const titleDate = new Date().toLocaleDateString('pt-BR');
      const created = await apiCall('POST', '/championships', {
        title: `Campeonato ${titleDate}`,
        format: tournament.format || 'groups-knockout',
        data: state
      });
      if (created && created.id) {
        window._currentChampionshipId = created.id;
      }
    }
  } catch (err) {
    // Req 4.5: notify user, do not modify localStorage state
    showApiError('DB_SAVE_ERROR', 'Não foi possível salvar o campeonato no servidor. Suas alterações estão salvas localmente.');
  }
}

/**
 * Loads championships from the API when user is logged in.
 * Req 4.2: load from server replacing localStorage behavior
 * Req 4.3: show DB_LOAD_ERROR on failure, do not show stale data
 */
async function loadChampionshipsFromAPI() {
  if (!getAccessToken()) return; // not logged in
  try {
    const result = await apiCall('GET', '/championships');
    if (result && result.items && result.items.length > 0) {
      showApiInfo(`${result.items.length} campeonato(s) salvo(s) no servidor. Retome um campeonato pelo menu.`);
    }
  } catch (err) {
    // Req 4.3: show error, do NOT fall back to localStorage
    showApiError('DB_LOAD_ERROR', 'Não foi possível carregar os campeonatos do servidor.');
  }
}

// ═══════════════════════════════════════════════
// PLAYER LINK UI
// Requirements: 6.1, 6.3, 6.6, 6.7
// ═══════════════════════════════════════════════

/** In-memory friend list cache */
let _friendsCache = null;

/**
 * Fetches the friend list from the API (cached per session).
 * @returns {Promise<Array>} Array of { id, displayName, email } objects
 */
async function getFriendsList() {
  if (!getAccessToken()) return [];
  if (_friendsCache) return _friendsCache;
  try {
    const result = await apiCall('GET', '/friends');
    _friendsCache = result?.friends || [];
    return _friendsCache;
  } catch {
    return [];
  }
}

/**
 * Renders a player-link email input row for each player in the draw results.
 * Called after the draw is rendered (when user is logged in).
 * Req 6.1: display optional email field per player
 */
async function renderPlayerLinkInputs() {
  if (!getAccessToken() || !window._currentChampionshipId) return;
  
  const friends = await getFriendsList();
  const cards = document.querySelectorAll('#draw-results-grid .result-card');
  if (!cards.length) return;
  
  cards.forEach((card, i) => {
    // Avoid adding duplicate link inputs
    if (card.querySelector('.player-link-row')) return;
    
    const pair = drawnPairs[i];
    if (!pair) return;
    
    const row = document.createElement('div');
    row.className = 'player-link-row';
    row.style.cssText = 'margin-top:8px;display:flex;flex-direction:column;gap:4px';
    
    // Email input with datalist for friend autocomplete
    const inputId = `player-link-input-${i}`;
    const listId = `player-link-list-${i}`;
    
    const label = document.createElement('label');
    label.style.cssText = 'font-size:11px;color:#6b7280;letter-spacing:.03em';
    label.textContent = '🔗 Vincular amigo (opcional)';
    label.htmlFor = inputId;
    
    const input = document.createElement('input');
    input.type = 'email';
    input.id = inputId;
    input.placeholder = 'E-mail do amigo...';
    input.list = listId;
    input.style.cssText = 'width:100%;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;box-sizing:border-box';
    
    // Datalist for friend autocomplete
    const datalist = document.createElement('datalist');
    datalist.id = listId;
    friends.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.email || f.displayName;
      datalist.appendChild(opt);
    });
    
    const errorEl = document.createElement('span');
    errorEl.className = 'player-link-error';
    errorEl.style.cssText = 'font-size:11px;color:#dc2626;display:none';
    
    const linkBtn = document.createElement('button');
    linkBtn.textContent = 'Vincular';
    linkBtn.className = 'btn btn-sm';
    linkBtn.style.cssText = 'margin-top:2px;font-size:11px;padding:4px 10px';
    linkBtn.onclick = async () => {
      const email = input.value.trim();
      if (!email) return;
      errorEl.style.display = 'none';
      linkBtn.disabled = true;
      try {
        await apiCall('POST', `/championships/${window._currentChampionshipId}/links`, {
          playerName: pair.player,
          linkedUserEmail: email
        });
        linkBtn.textContent = '✓ Vinculado';
        linkBtn.style.background = '#dcfce7';
        linkBtn.style.color = '#15803d';
        input.disabled = true;
      } catch (err) {
        linkBtn.disabled = false;
        const code = err?.error?.code;
        if (code === 'CONFLICT') errorEl.textContent = 'Este jogador ou usuário já está vinculado.';
        else if (code === 'FRIEND_NOT_FOUND') errorEl.textContent = 'E-mail não pertence a um amigo.';
        else if (code === 'AUTHORIZATION_FAILED') errorEl.textContent = 'Sem permissão para vincular.';
        else errorEl.textContent = 'Erro ao vincular. Tente novamente.';
        errorEl.style.display = '';
      }
    };
    
    row.appendChild(label);
    row.appendChild(input);
    row.appendChild(datalist);
    row.appendChild(errorEl);
    row.appendChild(linkBtn);
    card.appendChild(row);
  });
}

// ═══════════════════════════════════════════════
// MIGRATION PROMPT
// Requirements: 4.6, 4.7, 8.1, 8.3, 8.4, 8.6
// ═══════════════════════════════════════════════

const MIGRATION_REFUSED_KEY = 'sorte_ar_migration_refused';

/**
 * Checks if there is local data to migrate and no refusal flag.
 * Shows the migration modal if conditions are met.
 * Req 4.6, 8.1
 */
function checkMigrationOffer() {
  if (!getAccessToken()) return; // only for logged-in users
  const hasLocalData = !!localStorage.getItem('sorte_ar_state_v1');
  const hasRefused = !!localStorage.getItem(MIGRATION_REFUSED_KEY);
  if (hasLocalData && !hasRefused) {
    const modal = document.getElementById('migration-modal');
    if (modal) modal.style.display = 'flex';
  }
}

/**
 * User confirmed migration — calls POST /api/championships/migrate.
 * Req 8.3, 8.4
 */
async function handleMigrationConfirm() {
  const statusEl = document.getElementById('migration-status');
  const confirmBtn = document.getElementById('migration-confirm-btn');

  // Show loading state
  if (confirmBtn) confirmBtn.disabled = true;
  if (statusEl) {
    statusEl.style.display = '';
    statusEl.style.background = '#eff6ff';
    statusEl.style.color = '#1d4ed8';
    statusEl.textContent = '⏳ Migrando campeonatos...';
  }

  try {
    // Build migration payload from localStorage state
    const raw = localStorage.getItem('sorte_ar_state_v1');
    if (!raw) {
      if (statusEl) { statusEl.style.background = '#f0fdf4'; statusEl.style.color = '#15803d'; statusEl.textContent = '✓ Nenhum dado para migrar.'; }
      setTimeout(() => { const m = document.getElementById('migration-modal'); if (m) m.style.display = 'none'; }, 2000);
      return;
    }

    // Create a single championship entry from current localStorage state
    const state = JSON.parse(raw);
    const championships = [{
      localId: 'local-' + Date.now(),
      title: `Campeonato importado (${new Date().toLocaleDateString('pt-BR')})`,
      format: state.tournament?.format || 'groups-knockout',
      data: state
    }];

    const result = await apiCall('POST', '/championships/migrate', { championships });

    // Success — Req 8.3: clear localStorage on successful migration
    localStorage.removeItem('sorte_ar_state_v1');
    window._currentChampionshipId = null;

    if (statusEl) {
      statusEl.style.background = '#f0fdf4';
      statusEl.style.color = '#15803d';
      const migrated = result?.migrated || 0;
      const skipped = result?.skipped || 0;
      statusEl.textContent = `✓ ${migrated} campeonato(s) migrado(s)${skipped > 0 ? `, ${skipped} já existia(m)` : ''}.`;
    }

    setTimeout(() => {
      const m = document.getElementById('migration-modal');
      if (m) m.style.display = 'none';
    }, 2500);

  } catch (err) {
    // Req 8.4: on failure, keep localStorage intact, show retry message
    if (confirmBtn) confirmBtn.disabled = false;
    if (statusEl) {
      statusEl.style.background = '#fef2f2';
      statusEl.style.color = '#dc2626';
      statusEl.textContent = '⚠ Falha na migração. Seus dados locais foram preservados. Tente novamente.';
    }
  }
}

/**
 * User declined migration — store refusal flag.
 * Req 8.6
 */
function handleMigrationDecline() {
  localStorage.setItem(MIGRATION_REFUSED_KEY, '1');
  const modal = document.getElementById('migration-modal');
  if (modal) modal.style.display = 'none';
}

// ═══════════════════════════════════════════════
// PROFILE PAGE
// Requirements: 3.1, 3.4, 5.1, 5.9, 7.1, 7.2, 7.3, 7.4, 7.7
// ═══════════════════════════════════════════════

/**
 * Opens and renders the profile page for the current logged-in user.
 */
async function openProfilePage() {
  if (!getAccessToken()) { showAuthModal(); return; }
  goToPage('profile');
  await loadProfileData();
}

/**
 * Loads all profile data: profile info, feed, pending requests, friend list.
 */
async function loadProfileData() {
  await Promise.allSettled([
    loadMyProfile(),
    loadMyFeed(),
    loadPendingRequests(),
    loadFriendsList()
  ]);
}

async function loadMyProfile() {
  try {
    const name = localStorage.getItem('sortear_display_name') || '';
    document.getElementById('profile-display-name').textContent = name || 'Meu Perfil';
    const result = await apiCall('GET', '/profile/me');
    if (result) {
      if (result.displayName) {
        document.getElementById('profile-display-name').textContent = result.displayName;
        document.getElementById('edit-display-name').value = result.displayName;
        localStorage.setItem('sortear_display_name', result.displayName);
      }
      // Username
      const usernameEl = document.getElementById('profile-username-display');
      if (result.username) {
        usernameEl.textContent = '@' + result.username;
        document.getElementById('edit-username').value = result.username;
      } else {
        usernameEl.textContent = 'Sem nickname — defina um abaixo';
        usernameEl.style.color = '#f59e0b';
      }
      if (result.createdAt) {
        document.getElementById('profile-joined').textContent = 'Membro desde ' + new Date(result.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      }
      if (result.avatarUrl) {
        const avatar = document.getElementById('profile-avatar');
        avatar.innerHTML = `<img src="${result.avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
      }
      if (result.stats) {
        document.getElementById('profile-stat-player').textContent = result.stats.championshipsAsPlayer ?? '—';
        document.getElementById('profile-stat-wins').textContent = result.stats.wins ?? '—';
        document.getElementById('profile-stat-runnerup').textContent = result.stats.runnerUp ?? '—';
      }
    }
  } catch (_) {}
}

async function loadMyFeed() {
  const feedEl = document.getElementById('profile-feed');
  try {
    const feed = await apiCall('GET', '/championships/feed');
    if (!Array.isArray(feed) || feed.length === 0) {
      feedEl.innerHTML = '<span style="font-size:13px;color:#9ca3af">Nenhum campeonato ainda.</span>';
      return;
    }
    feedEl.innerHTML = feed.map(item => _renderFeedItem(item)).join('');
  } catch (_) {
    feedEl.innerHTML = '<span style="font-size:13px;color:#dc2626">Não foi possível carregar o feed.</span>';
  }
}

function _renderFeedItem(item) {
  const statusBadge = item.status === 'finished'
    ? `<span style="font-size:11px;background:#dcfce7;color:#15803d;padding:2px 7px;border-radius:99px;white-space:nowrap">✅ Finalizado</span>`
    : `<span style="font-size:11px;background:#dbeafe;color:#1d4ed8;padding:2px 7px;border-radius:99px;white-space:nowrap">⚡ Em andamento</span>`;
  const champion = item.champion ? `<div style="font-size:12px;color:#6b7280;margin-top:2px">🏆 Campeão: <strong>${item.champion}</strong></div>` : '';
  const phase = item.currentPhase && item.status !== 'finished' ? `<div style="font-size:12px;color:#6b7280;margin-top:2px">📍 ${item.currentPhase}</div>` : '';
  const userResult = item.finalPosition ? `<div style="font-size:12px;color:#6b7280;margin-top:2px">🎯 Sua posição: ${item.finalPosition}º</div>` : '';
  const updated = new Date(item.updatedAt).toLocaleDateString('pt-BR');
  const role = item.userRole === 'creator' ? '👑 Criador' : '⚽ Jogador';
  const titleEsc = item.title.replace(/'/g, "\\'");
  // Open button available for creator (has full state) and player (view mode)
  const openBtn = item.id
    ? `<button class="btn btn-sm btn-primary" style="margin-top:8px;font-size:11px" onclick="openChampionshipFromFeed('${item.id}')">Abrir campeonato →</button>`
    : '';
  // Delete button only for creator
  const deleteBtn = item.userRole === 'creator' && item.id
    ? `<button class="btn btn-sm" style="margin-top:8px;margin-left:6px;font-size:11px;background:#fef2f2;color:#dc2626" onclick="deleteChampionship('${item.id}', '${titleEsc}')">🗑 Excluir</button>`
    : '';
  return `<div style="padding:12px;border:1px solid #e5e7eb;border-radius:10px;background:#fafafa">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:2px">
      <span style="font-size:14px;font-weight:700;color:#111827;line-height:1.3">${item.title}</span>
      ${statusBadge}
    </div>
    <div style="font-size:11px;color:#9ca3af;margin-bottom:4px">${role} · Atualizado em ${updated}</div>
    ${champion}${phase}${userResult}
    <div>${openBtn}${deleteBtn}</div>
  </div>`;
}

async function loadPendingRequests() {
  const el = document.getElementById('profile-pending-requests');
  try {
    const result = await apiCall('GET', '/friends/requests/pending');
    const requests = result?.requests || [];
    if (requests.length === 0) {
      el.innerHTML = '<span style="font-size:13px;color:#9ca3af">Nenhuma solicitação pendente.</span>';
      return;
    }
    el.innerHTML = requests.map(req => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px;border:1px solid #e5e7eb;border-radius:8px">
        <span style="font-size:13px;font-weight:500">${req.fromUser || req.id}</span>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm" style="background:#dcfce7;color:#15803d" onclick="acceptFriendRequest('${req.id}', this)">Aceitar</button>
          <button class="btn btn-sm" style="background:#fef2f2;color:#dc2626" onclick="rejectFriendRequest('${req.id}', this)">Recusar</button>
        </div>
      </div>`).join('');
  } catch (_) {
    el.innerHTML = '<span style="font-size:13px;color:#dc2626">Não foi possível carregar solicitações.</span>';
  }
}

async function loadFriendsList() {
  const el = document.getElementById('profile-friends-list');
  try {
    const result = await apiCall('GET', '/friends');
    const friends = result?.friends || [];
    if (friends.length === 0) {
      el.innerHTML = '<span style="font-size:13px;color:#9ca3af">Nenhum amigo ainda.</span>';
      return;
    }
    el.innerHTML = friends.map(f => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px;border:1px solid #e5e7eb;border-radius:8px">
        <div style="display:flex;align-items:center;gap:8px">
          ${f.avatarUrl ? `<img src="${f.avatarUrl}" style="width:32px;height:32px;border-radius:50%;object-fit:cover"/>` : `<div style="width:32px;height:32px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:14px">👤</div>`}
          <span style="font-size:13px;font-weight:500">${f.displayName}</span>
        </div>
        <button class="btn btn-sm btn-danger" onclick="removeFriendById('${f.id}', this)">Remover</button>
      </div>`).join('');
  } catch (_) {
    el.innerHTML = '<span style="font-size:13px;color:#dc2626">Não foi possível carregar amigos.</span>';
  }
}

async function sendFriendRequest() {
  const input = document.getElementById('friend-email-input');
  const statusEl = document.getElementById('friend-request-status');
  const email = input.value.trim();
  if (!email) return;
  statusEl.style.display = '';
  statusEl.style.color = '#1d4ed8';
  statusEl.textContent = '⏳ Enviando...';
  try {
    await apiCall('POST', '/friends/requests', { email });
    input.value = '';
    statusEl.style.color = '#15803d';
    statusEl.textContent = '✓ Solicitação enviada!';
    setTimeout(() => { statusEl.style.display = 'none'; }, 3000);
  } catch (err) {
    const code = err?.error?.code;
    statusEl.style.color = '#dc2626';
    if (code === 'NOT_FOUND') statusEl.textContent = 'E-mail não encontrado.';
    else if (code === 'CONFLICT') statusEl.textContent = 'Solicitação já enviada ou já são amigos.';
    else if (code === 'VALIDATION_ERROR') statusEl.textContent = 'Não é possível enviar para si mesmo.';
    else statusEl.textContent = 'Erro ao enviar solicitação.';
  }
}

async function acceptFriendRequest(requestId, btn) {
  btn.disabled = true;
  try {
    await apiCall('POST', `/friends/requests/${requestId}/accept`);
    await loadPendingRequests();
    await loadFriendsList();
  } catch (_) { btn.disabled = false; }
}

async function rejectFriendRequest(requestId, btn) {
  btn.disabled = true;
  try {
    await apiCall('POST', `/friends/requests/${requestId}/reject`);
    await loadPendingRequests();
  } catch (_) { btn.disabled = false; }
}

async function removeFriendById(friendId, btn) {
  btn.disabled = true;
  try {
    await apiCall('DELETE', `/friends/${friendId}`);
    await loadFriendsList();
    _friendsCache = null; // invalidate cache
  } catch (_) { btn.disabled = false; }
}
