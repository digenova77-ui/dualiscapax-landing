(function () {
  function pad(i, width) {
    var s = String(i);
    while (s.length < width) s = '0' + s;
    return s;
  }
  function detectType(bytes) {
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return 'image/png';
    }
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return 'image/jpeg';
    }
    return null;
  }
  function assemble(img) {
    var stem = img.getAttribute('data-stem');
    var n = parseInt(img.getAttribute('data-parts') || '0', 10);
    var width = parseInt(img.getAttribute('data-pad') || '0', 10);
    if (!stem || !n) return Promise.resolve();
    var urls = [];
    for (var i = 0; i < n; i++) {
      urls.push('/brand/' + stem + '.part' + pad(i, width) + '.b64');
    }
    return Promise.all(urls.map(function (u) {
      return fetch(u).then(function (r) {
        if (!r.ok) throw new Error(u + ' ' + r.status);
        return r.text();
      });
    })).then(function (parts) {
      var b64 = parts.join('').replace(/\s+/g, '');
      var bin = atob(b64);
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      var type = detectType(bytes);
      if (!type) {
        throw new Error(stem + ' not a jpeg or png');
      }
      img.src = URL.createObjectURL(new Blob([bytes], { type: type }));
    }).catch(function (err) {
      console.warn('plate', stem, err);
    });
  }
  document.querySelectorAll('img[data-stem]').forEach(assemble);
})();
