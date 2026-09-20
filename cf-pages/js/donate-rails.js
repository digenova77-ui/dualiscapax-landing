/** Loaded only when DC_PAYMENTS.donate_open === true */
(function(){
  var pay = window.DC_PAYMENTS || {};
  if (pay.donate_open !== true) return;
  var MAIL = 'donate@dualiscapax.ai';
  var panel = document.getElementById('panel');
  var rails = document.getElementById('rails');
  var lede = document.getElementById('donate-lede');
  if (lede) lede.textContent = 'Each control opens a real path: your email app for Interac, or a wallet link for crypto. One method per send. Card checkout stays on Bind.';
  if (panel) { panel.hidden = true; panel.innerHTML = ''; }
  if (!rails) return;
  rails.hidden = false;
  rails.innerHTML =
    '<h2>Canada — bank</h2>' +
    '<button type="button" class="go" id="interac">Open Interac e-Transfer</button>' +
    '<button type="button" class="rail" id="eft">Open email for EFT instructions</button>' +
    '<h2>Crypto — one chain per send</h2>' +
    ['btc','xrp','zec','sol','eth','pol','bsc','link','dot','dgb','bch','doge'].map(function(c){
      var labels={btc:'Bitcoin',xrp:'XRP',zec:'Zcash',sol:'Solana',eth:'Ethereum',pol:'Polygon',bsc:'BNB Chain',link:'LINK (Ethereum)',dot:'Polkadot',dgb:'DigiByte',bch:'Bitcoin Cash',doge:'Dogecoin (Iris time)'};
      return '<button type="button" class="rail" id="'+c+'" data-chain="'+c+'">Open '+labels[c]+' send</button>';
    }).join('');

  function show(html){
    panel.hidden = false;
    panel.innerHTML = html;
    try { panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
  }
  function openUrl(url){
    if (!url) return;
    try {
      var a = document.createElement('a');
      a.href = url; a.rel = 'noopener'; a.target = '_blank';
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { try { location.href = url; } catch (e2) {} }
  }
  function interacMail(){
    var sub = encodeURIComponent('Interac e-Transfer · DualisCapax research');
    var body = encodeURIComponent('Send Interac e-Transfer to this Autodeposit email:\n' + MAIL + '\n\nAmount: (you choose)\nMemo: DualisCapax research gift\n');
    return 'mailto:' + MAIL + '?subject=' + sub + '&body=' + body;
  }
  function eftMail(){
    var sub = encodeURIComponent('EFT · DualisCapax research');
    var body = encodeURIComponent('Please reply with EFT instructions request, or send Interac to ' + MAIL + ' (Autodeposit).\n');
    return 'mailto:' + MAIL + '?subject=' + sub + '&body=' + body;
  }
  function walletUri(chain, addr){
    if (!addr) return null;
    switch (chain) {
      case 'eth': case 'link': return 'ethereum:' + addr;
      case 'pol': return 'ethereum:' + addr + '@137';
      case 'bsc': return 'ethereum:' + addr + '@56';
      case 'sol': return 'solana:' + addr;
      case 'btc': return 'bitcoin:' + addr;
      case 'bch': return 'bitcoincash:' + addr;
      case 'doge': return 'dogecoin:' + addr;
      case 'dgb': return 'digibyte:' + addr;
      case 'zec': return 'zcash:' + addr;
      case 'xrp': return 'ripple:' + addr;
      default: return null;
    }
  }
  function chainLabel(chain){
    return ({btc:'Bitcoin',xrp:'XRP',zec:'Zcash',sol:'Solana',eth:'Ethereum',pol:'Polygon',bsc:'BNB Smart Chain',link:'LINK (Ethereum)',dot:'Polkadot',dgb:'DigiByte',bch:'Bitcoin Cash',doge:'Dogecoin'})[chain] || chain;
  }
  function addrFor(chain){
    var map = {btc:pay.research_btc,xrp:pay.research_xrp,zec:pay.research_zec,sol:pay.research_sol,eth:pay.research_eth,pol:pay.research_pol,bsc:pay.research_bsc,link:pay.research_link,dot:pay.research_dot,dgb:pay.research_dgb,bch:pay.research_bch,doge:pay.ai_doge};
    return map[chain] || '';
  }
  var interacBtn = document.getElementById('interac');
  var eftBtn = document.getElementById('eft');
  if (pay.interac_enabled === true && interacBtn) {
    interacBtn.addEventListener('click', function(){
      openUrl(interacMail());
      show('<strong>Interac e-Transfer</strong><p>Your email app should open with <em>' + MAIL + '</em> ready.</p><div class="addr">' + MAIL + '</div>');
    });
  } else if (interacBtn) { interacBtn.hidden = true; }
  if (pay.eft_enabled === true && eftBtn) {
    eftBtn.addEventListener('click', function(){
      openUrl(eftMail());
      show('<strong>EFT</strong><p>Prefer Interac Autodeposit when you can:</p><div class="addr">' + MAIL + '</div>');
    });
  } else if (eftBtn) { eftBtn.hidden = true; }
  ['btc','xrp','zec','sol','eth','pol','bsc','link','dot','dgb','bch','doge'].forEach(function(chain){
    var el = document.getElementById(chain);
    if (!el) return;
    var addr = addrFor(chain);
    if (!pay.crypto_enabled || !addr) { el.hidden = true; return; }
    el.addEventListener('click', function(){
      var uri = walletUri(chain, addr);
      if (uri) openUrl(uri);
      show('<strong>' + chainLabel(chain) + '</strong><p>Copy the address into your wallet on the correct network.</p><div class="addr">' + addr + '</div>');
    });
  });
})();
