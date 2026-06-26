try {
  var t = localStorage.getItem('theme');
  if (t) {
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
  }
} catch(e) {}
